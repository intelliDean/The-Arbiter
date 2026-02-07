import os
import json
import time
import random
import logging
import sqlite3
import signal
import sys
import threading
from datetime import datetime, timezone
from typing import Set, Tuple, Optional, Any
from http.server import BaseHTTPRequestHandler, HTTPServer

from web3 import Web3
from web3.contract import Contract
from web3.exceptions import TransactionNotFound, TimeExhausted
from dotenv import load_dotenv

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("referee.log")
    ]
)
logger = logging.getLogger("Referee")

class HealthCheckHandler(BaseHTTPRequestHandler):
    """Simple HTTP handler for infrastructure health checks (Render/Railway/Docker)."""
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            now = datetime.now(timezone.utc)
            self.wfile.write(json.dumps({"status": "healthy", "timestamp": str(now)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

class ArbiterAgent:
    def __init__(self):
        load_dotenv()
        self.rpc_url = os.getenv("RPC_URL", "https://testnet-rpc.monad.xyz")
        self.contract_address = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS").lower())
        self.private_key = os.getenv("PRIVATE_KEY")
        self.referee_address = Web3.to_checksum_address(os.getenv("REFEREE_ADDRESS").lower())
        self.chain_id = int(os.getenv("CHAIN_ID", "10143"))
        
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract = self._load_contract()
        
        # Persistence
        self.db_path = "agent_state.db"
        self._init_db()
        
        self.running = True
        signal.signal(signal.SIGINT, self._handle_exit)
        signal.signal(signal.SIGTERM, self._handle_exit)

    def _load_contract(self) -> Contract:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        abi_path = os.path.join(script_dir, "Arena.json")
        try:
            with open(abi_path, "r") as f:
                contract_json = json.load(f)
                return self.w3.eth.contract(address=self.contract_address, abi=contract_json["abi"])
        except Exception as e:
            logger.error(f"Failed to load contract ABI from {abi_path}: {e}")
            sys.exit(1)

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS processed_matches (
                    match_id INTEGER PRIMARY KEY,
                    tx_hash TEXT,
                    status TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            logger.info("Persistence layer initialized (SQLite)")

    def _get_last_block(self) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT value FROM state WHERE key = 'last_block'")
            row = cursor.fetchone()
            if row:
                return int(row[0])
            return max(0, self.w3.eth.block_number - 200) # Default to recent blocks

    def _save_last_block(self, block: int):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT OR REPLACE INTO state (key, value) VALUES ('last_block', ?)", (str(block),))

    def _is_match_processed(self, match_id: int) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT 1 FROM processed_matches WHERE match_id = ? AND status = 'Settled'", (match_id,))
            return cursor.fetchone() is not None

    def _mark_match_pending(self, match_id: int, tx_hash: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("INSERT OR REPLACE INTO processed_matches (match_id, tx_hash, status) VALUES (?, ?, 'Pending')", (match_id, tx_hash))

    def _mark_match_settled(self, match_id: int):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("UPDATE processed_matches SET status = 'Settled' WHERE match_id = ?", (match_id,))

    def _handle_exit(self, signum, frame):
        logger.info(f"Received signal {signum}. Finalizing current task before shutdown...")
        self.running = False

    def wait_for_receipt_with_retry(self, tx_hash, max_retries=3):
        """Poll for transaction receipt with retries to handle RPC timeouts."""
        for attempt in range(max_retries):
            try:
                return self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            except TimeExhausted:
                logger.warning(f"Timeout waiting for receipt (tx: {tx_hash.hex()}). Attempt {attempt+1}/{max_retries}")
                time.sleep(5)
        raise Exception(f"Failed to confirm transaction {tx_hash.hex()} after {max_retries} attempts")

    def settle_match(self, match_id: int, winner_address: str, target_number: int):
        if not self.private_key:
            logger.error("PRIVATE_KEY not configured")
            return

        logger.info(f"⚖️  Settling match {match_id} | Winner: {winner_address} | Target: {target_number}")
        
        try:
            # Dynamic Gas Estimation with 25% buffer for Testnet spikes
            base_gas_price = self.w3.eth.gas_price
            gas_price = int(base_gas_price * 1.25)
            nonce = self.w3.eth.get_transaction_count(self.referee_address, 'pending')
            
            tx_params = {
                'from': self.referee_address,
                'nonce': nonce,
                'gas': 350000, 
                'gasPrice': gas_price,
                'chainId': self.chain_id
            }
            
            tx = self.contract.functions.settleMatch(match_id, winner_address, target_number).build_transaction(tx_params)
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            logger.info(f"📤 Tx Sent: {tx_hash.hex()}. Polling for confirmation...")
            self._mark_match_pending(match_id, tx_hash.hex())
            
            receipt = self.wait_for_receipt_with_retry(tx_hash)
            
            if receipt.status == 1:
                logger.info(f"✅ Match {match_id} SETTLED in block {receipt.blockNumber}")
                self._mark_match_settled(match_id)
            else:
                logger.error(f"❌ Match {match_id} REVERTED. Check contract state or gas.")
        except Exception as e:
            logger.error(f"❌ Critical error settling match {match_id}: {e}")

    def withdraw_platform_fees(self):
        if not self.private_key: return

        try:
            total_fees = self.contract.functions.totalFees().call()
            # Sweep if significant
            if total_fees < self.w3.to_wei(0.01, 'ether'):
                return

            logger.info(f"💰 Cleaning fees ({self.w3.from_wei(total_fees, 'ether')} MON)...")
            
            gas_price = int(self.w3.eth.gas_price * 1.2)
            nonce = self.w3.eth.get_transaction_count(self.referee_address, 'pending')

            tx = self.contract.functions.withdrawFees().build_transaction({
                'from': self.referee_address,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': gas_price,
                'chainId': self.chain_id
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            receipt = self.wait_for_receipt_with_retry(tx_hash)
            if receipt.status == 1:
                logger.info("✅ Fee sweep completed.")
        except Exception as e:
            logger.error(f"❌ Error during fee sweep: {e}")

    def process_match_event(self, event):
        match_id = event['args']['matchId']
        opponent = event['args']['opponent']
        
        if self._is_match_processed(match_id):
            return

        logger.info(f"🔔 Event: MatchJoined | ID: {match_id} | Opponent: {opponent}")
        
        try:
            match_data = self.contract.functions.matches(match_id).call()
            creator = match_data[1]
            creator_guess = match_data[7]
            opponent_guess = match_data[8]
            
            logger.info(f"   Context: Creator {creator} ({creator_guess}) vs Opponent {opponent} ({opponent_guess})")

            target_number = random.randint(1, 100)
            logger.info(f"🎯 Calculated Target: {target_number}")

            diff_creator = abs(creator_guess - target_number)
            diff_opponent = abs(opponent_guess - target_number)

            if diff_creator < diff_opponent:
                winner = creator
            elif diff_opponent < diff_creator:
                winner = opponent
            else:
                winner = "0x0000000000000000000000000000000000000000"
                logger.info("🤝 Draw detected")

            self.settle_match(match_id, winner, target_number)
            
        except Exception as e:
            logger.error(f"Error processing match lifecycle for {match_id}: {e}")

    def start_health_server(self, port=8080):
        """Starts a lightweight health check server."""
        def run_server():
            HTTPServer.allow_reuse_address = True
            try:
                server = HTTPServer(('0.0.0.0', port), HealthCheckHandler)
                logger.info(f"🩺 Health check server active on port {port}")
                server.serve_forever()
            except Exception as e:
                logger.warning(f"Health server failed: {e}")
        
        thread = threading.Thread(target=run_server, daemon=True)
        thread.start()

    def _get_logs_v_agnostic(self, start: int, end: int):
        """Robustly calls get_logs by trying multiple argument formats."""
        try:
            # Try snake_case (Web3.py v6 default)
            return self.contract.events.MatchJoined.get_logs(from_block=start, to_block=end)
        except (TypeError, ValueError):
            # Try camelCase (Web3.py v5 default)
            return self.contract.events.MatchJoined.get_logs(fromBlock=start, toBlock=end)

    def run(self, poll_interval: int = 5):
        logger.info("=" * 60)
        logger.info("🤖 THE ARBITER - Professional Referee Node")
        logger.info(f"Address:  {self.referee_address}")
        logger.info(f"Target:   {self.contract_address}")
        logger.info("=" * 60)
        
        self.start_health_server()
        
        last_block = self._get_last_block()
        logger.info(f"Recovery: Scanning from block {last_block}...")
        
        last_fee_withdrawal_day = datetime.now(timezone.utc).day - 1

        while self.running:
            try:
                now = datetime.now(timezone.utc)
                if now.hour == 0 and now.day != last_fee_withdrawal_day:
                    self.withdraw_platform_fees()
                    last_fee_withdrawal_day = now.day

                current_block = self.w3.eth.block_number
                
                if current_block > last_block:
                    chunk_size = 10 
                    
                    for start in range(last_block + 1, current_block + 1, chunk_size):
                        if not self.running: break
                        end = min(start + chunk_size - 1, current_block)
                        
                        try:
                            events = self._get_logs_v_agnostic(start, end)
                            for event in events:
                                self.process_match_event(event)
                        except Exception as rpc_e:
                            if "413" in str(rpc_e) or "Entity Too Large" in str(rpc_e):
                                logger.warning(f"RPC size limit hit. Retrying with minimal window.")
                                # Emergency sub-scan
                                sub_chunk = 2
                                for sub_start in range(start, end + 1, sub_chunk):
                                    sub_end = min(sub_start + sub_chunk - 1, end)
                                    events = self._get_logs_v_agnostic(sub_start, sub_end)
                                    for event in events: self.process_match_event(event)
                            else:
                                raise rpc_e

                        self._save_last_block(end)
                        last_block = end
                
                time.sleep(poll_interval)
                
            except Exception as e:
                logger.error(f"Main loop exception: {e}")
                time.sleep(poll_interval)

if __name__ == "__main__":
    agent = ArbiterAgent()
    agent.run()
