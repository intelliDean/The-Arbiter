"""
The Arbiter - Agent Testing Suite

This script helps you test the Referee agent locally using Foundry's Anvil.
"""
import os
import json
import time
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://testnet-rpc.monad.xyz")
CONTRACT_ADDRESS = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS"))

# Anvil default accounts (Not used for Monad Testnet unless provided)
PLAYER1_KEY = os.getenv("PRIVATE_KEY") # Use the same key for testing if needed
PLAYER2_KEY = os.getenv("PRIVATE_KEY") 
REFEREE_KEY = os.getenv("PRIVATE_KEY")

PLAYER1_ADDR = os.getenv("REFEREE_ADDRESS")
PLAYER2_ADDR = os.getenv("REFEREE_ADDRESS")
REFEREE_ADDR = Web3.to_checksum_address(os.getenv("REFEREE_ADDRESS"))

# Use the ABI from agent/Arena.json instead of ../contracts/...
with open("Arena.json", "r") as f:
    ABI = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def create_match(player_key, player_addr, stake_eth, guess=50):
    """Player 1 creates a match"""
    print(f"\n🎯 Player 1 creating match with {stake_eth} ETH stake and guess {guess}...")
    
    nonce = w3.eth.get_transaction_count(player_addr)
    tx = contract.functions.createMatch(guess).build_transaction({
        'from': player_addr,
        'value': w3.to_wei(stake_eth, 'ether'),
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price
    })
    
    signed = w3.eth.account.sign_transaction(tx, private_key=player_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get match ID from event
    match_id = contract.events.MatchCreated().process_receipt(receipt)[0]['args']['matchId']
    print(f"✅ Match created! ID: {match_id}")
    return match_id

def join_match(match_id, player_key, player_addr, stake_eth, guess=75):
    """Player 2 joins the match"""
    print(f"\n🤝 Player 2 joining match {match_id} with guess {guess}...")
    
    nonce = w3.eth.get_transaction_count(player_addr)
    tx = contract.functions.joinMatch(match_id, guess).build_transaction({
        'from': player_addr,
        'value': w3.to_wei(stake_eth, 'ether'),
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    
    signed = w3.eth.account.sign_transaction(tx, private_key=player_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    print(f"✅ Player 2 joined match {match_id}")
    print("⏳ Waiting for Referee agent to settle...")

def main():
    print("=" * 60)
    print("🧪 THE ARBITER - Test Harness")
    print("=" * 60)
    
    # Create and join a match
    stake = 1.0
    match_id = create_match(PLAYER1_KEY, PLAYER1_ADDR, stake)
    time.sleep(2)
    join_match(match_id, PLAYER2_KEY, PLAYER2_ADDR, stake)
    
    print("\n✅ Test match created and joined!")
    print("🤖 The Referee agent should now detect and settle this match.")
    print("   Check the referee.py terminal for settlement logs.")

if __name__ == "__main__":
    main()
