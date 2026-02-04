import os
import json
import time
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Configuration
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
REFEREE_ADDRESS = os.getenv("REFEREE_ADDRESS")

with open("../contracts/out/Arena.sol/Arena.json", "r") as f:
    contract_json = json.load(f)
    ABI = contract_json["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def settle_match(match_id, winner_address):
    print(f"Settling match {match_id} with winner {winner_address}...")
    
    nonce = w3.eth.get_transaction_count(REFEREE_ADDRESS)
    tx = contract.functions.settleMatch(match_id, winner_address).build_transaction({
        'from': REFEREE_ADDRESS,
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    print(f"Transaction sent: {tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Match {match_id} settled in block {receipt.blockNumber}")

def handle_event(event):
    match_id = event['args']['matchId']
    opponent = event['args']['opponent']
    print(f"Match Joined: ID={match_id}, Opponent={opponent}")
    
    # Simulate a game result
    # In a real scenario, this would wait for game events or an external API
    print("Simulating game...")
    time.sleep(5) 
    
    # Get match details to find creator
    m = contract.functions.matches(match_id).call()
    creator = m[1]
    
    # For demo, creator always wins (very biased referee!)
    settle_match(match_id, creator)

def log_loop(event_filter, poll_interval):
    while True:
        for event in event_filter.get_new_entries():
            handle_event(event)
        time.sleep(poll_interval)

def main():
    print("Referee Agent started. Listening for MatchJoined events...")
    event_filter = contract.events.MatchJoined.create_filter(fromBlock='latest')
    log_loop(event_filter, 2)

if __name__ == "__main__":
    main()
