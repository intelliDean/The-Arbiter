import os
import json
import time
import random
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Configuration
RPC_URL = os.getenv("RPC_URL", "https://testnet-rpc.monad.xyz")
CONTRACT_ADDRESS = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS").lower())
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
REFEREE_ADDRESS = Web3.to_checksum_address(os.getenv("REFEREE_ADDRESS").lower())

# Load ABI from local file (works in cloud deployment)
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
abi_path = os.path.join(script_dir, "Arena.json")

with open(abi_path, "r") as f:
    contract_json = json.load(f)
    ABI = contract_json["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def settle_match(match_id, winner_address, target_number):
    """
    Settle a match by declaring the winner.
    """
    if not PRIVATE_KEY or PRIVATE_KEY == "YOUR_PRIVATE_KEY_HERE":
        print("❌ Error: PRIVATE_KEY not configured correctly in .env or environment variables.")
        return

    print(f"⚖️  Settling match {match_id} with winner {winner_address} (Target: {target_number})...")
    
    try:
        # Get current gas price and add 20% buffer for Monad testnet
        gas_price = int(w3.eth.gas_price * 1.2)  # Add 20% buffer for Monad testnet
        nonce = w3.eth.get_transaction_count(REFEREE_ADDRESS)
        
        # Monad Testnet Chain ID
        chain_id = 10143
        
        tx = contract.functions.settleMatch(match_id, winner_address, target_number).build_transaction({
            'from': REFEREE_ADDRESS,
            'nonce': nonce,
            'gas': 300000,
            'gasPrice': gas_price,
            'chainId': chain_id
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        print(f"📤 Transaction sent: {tx_hash.hex()}")
        print(f"⏳ Waiting for confirmation...")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        if receipt.status == 1:
            print(f"✅ Match {match_id} settled in block {receipt.blockNumber}")
        else:
            print(f"❌ Settlement failed (Transaction reverted)")
    except Exception as e:
        print(f"❌ Error during settlement: {e}")

def withdraw_platform_fees():
    """
    Withdraw platform fees from the contract.
    """
    if not PRIVATE_KEY or PRIVATE_KEY == "YOUR_PRIVATE_KEY_HERE":
        return

    print("💰 Attempting daily platform fee withdrawal...")
    try:
        # Check if there are fees to withdraw
        total_fees = contract.functions.totalFees().call()
        if total_fees == 0:
            print("ℹ️  No fees available to withdraw.")
            return

        gas_price = int(w3.eth.gas_price * 1.2)
        nonce = w3.eth.get_transaction_count(REFEREE_ADDRESS)
        chain_id = 10143

        tx = contract.functions.withdrawFees().build_transaction({
            'from': REFEREE_ADDRESS,
            'nonce': nonce,
            'gas': 200000,
            'gasPrice': gas_price,
            'chainId': chain_id
        })

        signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        print(f"📤 Fee withdrawal transaction sent: {tx_hash.hex()}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        if receipt.status == 1:
            print(f"✅ Fees successfully withdrawn in block {receipt.blockNumber}")
        else:
            print(f"❌ Fee withdrawal failed (Transaction reverted)")
    except Exception as e:
        print(f"❌ Error during fee withdrawal: {e}")

def simulate_game_outcome(creator, opponent):
    """
    Simulate a game result. In production, this would:
    - Listen to game server webhooks
    - Query an external oracle
    - Use Chainlink Functions for off-chain computation
    """
    print("🎮 Simulating game outcome...")
    time.sleep(3)  # Simulate game duration
    
    # Random winner for demo purposes
    winner = random.choice([creator, opponent])
    print(f"🏆 Winner determined: {winner}")
    return winner

def handle_match_joined(event):
    """
    Handle MatchJoined events from The Arbiter contract.
    """
    match_id = event['args']['matchId']
    opponent = event['args']['opponent']
    print(f"\n🔔 Match Joined Event Detected!")
    print(f"   Match ID: {match_id}")
    print(f"   Opponent: {opponent}")
    
    # Fetch match details from contract
    # Match struct: (id, creator, opponent, stake, referee, status, winner, lastUpdate)
    match_data = contract.functions.matches(match_id).call()
    creator = match_data[1]
    stake = match_data[3]
    
    print(f"   Creator: {creator}")
    print(f"   Stake: {w3.from_wei(stake, 'ether')} ETH")
    
def poll_for_matches(poll_interval=5):
    """
    Poll for new matches by checking recent blocks.
    """
    print("👀 Monitoring blockchain for new matches...\n")
    
    processed_matches = set()
    last_fee_withdrawal_day = -1
    
    # Look back up to 5,000 blocks on startup to catch missed events during redeploy
    current_block = w3.eth.block_number
    last_block = max(0, current_block - 5000)
    print(f"🔄 Startup: Looking back to block {last_block} catch missed matches...")
    
    while True:
        try:
            # Daily Fee Withdrawal Logic (at 12 AM UTC)
            current_time = time.gmtime()
            if current_time.tm_hour == 0 and current_time.tm_mday != last_fee_withdrawal_day:
                withdraw_platform_fees()
                last_fee_withdrawal_day = current_time.tm_mday

            current_block = w3.eth.block_number
            
            if current_block > last_block:
                print(f"📦 Checking blocks {last_block + 1} to {current_block}...")
                
                # Check in chunks of 100 blocks to avoid "Request Entity Too Large"
                chunk_size = 100
                for start in range(last_block + 1, current_block + 1, chunk_size):
                    end = min(start + chunk_size - 1, current_block)
                    
                    try:
                        events = contract.events.MatchJoined.get_logs(
                            fromBlock=start,
                            toBlock=end
                        )
                        
                        for event in events:
                            match_id = event['args']['matchId']
                            
                            if match_id in processed_matches:
                                continue
                            
                            opponent = event['args']['opponent']
                            print(f"\n🔔 Match Joined Event Detected!")
                            print(f"   Match ID: {match_id}")
                            print(f"   Opponent: {opponent}")
                            
                            # Fetch match details (now with guesses and without referee slot)
                            match_data = contract.functions.matches(match_id).call()
                            creator = match_data[1]
                            stake = match_data[3]
                            creator_guess = match_data[7]
                            opponent_guess = match_data[8]
                            
                            print(f"   Creator: {creator} (Guess: {creator_guess})")
                            print(f"   Opponent: {opponent} (Guess: {opponent_guess})")
                            print(f"   Stake: {w3.from_wei(stake, 'ether')} MON")
                            
                            # Calculate the winner (Guessing Logic)
                            try:
                                print("🎮 Calculating game outcome...")
                                target_number = random.randint(1, 100)
                                print(f"🎯 Target Number: {target_number}")

                                diff_creator = abs(creator_guess - target_number)
                                diff_opponent = abs(opponent_guess - target_number)

                                if diff_creator < diff_opponent:
                                    winner = creator
                                    print(f"🏆 Winner determined: {winner} (Diff: {diff_creator})")
                                elif diff_opponent < diff_creator:
                                    winner = opponent
                                    print(f"🏆 Winner determined: {winner} (Diff: {diff_opponent})")
                                else:
                                    winner = "0x0000000000000000000000000000000000000000"
                                    print(f"🤝 It's a DRAW! (Both diffs: {diff_creator})")

                                # Settle with target number
                                settle_match(match_id, winner, target_number)
                                processed_matches.add(match_id)
                            except Exception as settlement_err:
                                print(f"⚠️  Settlement error for match {match_id}: {settlement_err}")
                            
                    except Exception as event_err:
                        print(f"⚠️  Error fetching events for blocks {start}-{end}: {event_err}")
                
                last_block = current_block
            
            time.sleep(poll_interval)
            
        except Exception as loop_err:
            print(f"⚠️  Error in polling loop: {loop_err}")
            time.sleep(poll_interval)

def main():
    print("=" * 60)
    print("🤖 THE ARBITER - Autonomous Referee Agent")
    print("=" * 60)
    print(f"Contract: {CONTRACT_ADDRESS}")
    print(f"Referee: {REFEREE_ADDRESS}")
    print(f"Network: {RPC_URL}")
    print("=" * 60)
    
    # Start polling for matches
    poll_for_matches(poll_interval=5)

if __name__ == "__main__":
    main()
