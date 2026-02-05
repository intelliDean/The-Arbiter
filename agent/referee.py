import os
import json
import time
import random
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Configuration
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
REFEREE_ADDRESS = os.getenv("REFEREE_ADDRESS")

# Load ABI from local file (works in cloud deployment)
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
abi_path = os.path.join(script_dir, "Arena.json")

with open(abi_path, "r") as f:
    contract_json = json.load(f)
    ABI = contract_json["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def settle_match(match_id, winner_address):
    """
    Settle a match by declaring the winner.
    The Arbiter v2 will automatically:
    - Deduct 2.5% platform fee
    - Credit winner's pendingWithdrawals
    """
    print(f"⚖️  Settling match {match_id} with winner {winner_address}...")
    
    nonce = w3.eth.get_transaction_count(REFEREE_ADDRESS)
    
    # Get current gas price and add 20% buffer for Monad testnet
    base_gas_price = w3.eth.gas_price
    gas_price = int(base_gas_price * 1.2)
    
    tx = contract.functions.settleMatch(match_id, winner_address).build_transaction({
        'from': REFEREE_ADDRESS,
        'nonce': nonce,
        'gas': 300000,  # Increased for v2 logic
        'gasPrice': gas_price
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"📤 Transaction sent: {tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if receipt.status == 1:
        print(f"✅ Match {match_id} settled in block {receipt.blockNumber}")
    else:
        print(f"❌ Settlement failed for match {match_id}")

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
    
    # Simulate the game
    winner = simulate_game_outcome(creator, opponent)
    
    # Settle the match
    settle_match(match_id, winner)

def log_loop(event_filter, poll_interval):
    """
    Continuously poll for new events.
    """
    print("👀 Monitoring blockchain for new matches...\n")
    while True:
        try:
            for event in event_filter.get_new_entries():
                handle_match_joined(event)
        except Exception as e:
            print(f"⚠️  Error processing event: {e}")
        time.sleep(poll_interval)

def main():
    print("=" * 60)
    print("🤖 THE ARBITER - Autonomous Referee Agent")
    print("=" * 60)
    print(f"Contract: {CONTRACT_ADDRESS}")
    print(f"Referee: {REFEREE_ADDRESS}")
    print(f"Network: {RPC_URL}")
    print("=" * 60)
    
    # Create event filter for MatchJoined
    event_filter = contract.events.MatchJoined.create_filter(fromBlock='latest')
    
    # Start monitoring
    log_loop(event_filter, 2)

if __name__ == "__main__":
    main()
