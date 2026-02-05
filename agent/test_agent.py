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

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Anvil default accounts
PLAYER1_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PLAYER2_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
REFEREE_KEY = os.getenv("PRIVATE_KEY")

PLAYER1_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PLAYER2_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
REFEREE_ADDR = os.getenv("REFEREE_ADDRESS")

with open("../contracts/out/Arena.sol/Arena.json", "r") as f:
    ABI = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def create_match(player_key, player_addr, stake_eth):
    """Player 1 creates a match"""
    print(f"\n🎯 Player 1 creating match with {stake_eth} ETH stake...")
    
    nonce = w3.eth.get_transaction_count(player_addr)
    tx = contract.functions.createMatch(REFEREE_ADDR).build_transaction({
        'from': player_addr,
        'value': w3.to_wei(stake_eth, 'ether'),
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    
    signed = w3.eth.account.sign_transaction(tx, private_key=player_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get match ID from event
    match_id = contract.events.MatchCreated().process_receipt(receipt)[0]['args']['matchId']
    print(f"✅ Match created! ID: {match_id}")
    return match_id

def join_match(match_id, player_key, player_addr, stake_eth):
    """Player 2 joins the match"""
    print(f"\n🤝 Player 2 joining match {match_id}...")
    
    nonce = w3.eth.get_transaction_count(player_addr)
    tx = contract.functions.joinMatch(match_id).build_transaction({
        'from': player_addr,
        'value': w3.to_wei(stake_eth, 'ether'),
        'nonce': nonce,
        'gas': 200000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })
    
    signed = w3.eth.account.sign_transaction(tx, private_key=player_key)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
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
