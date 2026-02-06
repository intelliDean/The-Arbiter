from web3 import Web3
import os
import json
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://testnet-rpc.monad.xyz")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

with open("Arena.json", "r") as f:
    ABI = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def check_matches():
    next_id = contract.functions.nextMatchId().call()
    referee = contract.functions.officialReferee().call()
    print(f"Contract: {CONTRACT_ADDRESS}")
    print(f"Official Referee: {referee}")
    print(f"Next Match ID: {next_id}")
    
    for i in range(max(0, next_id - 5), next_id):
        m = contract.functions.matches(i).call()
        # id, creator, opponent, stake, status, winner, lastUpdate, creatorGuess, opponentGuess, targetNumber
        status_map = {0: "Pending", 1: "Active", 2: "Settled", 3: "Cancelled"}
        print(f"Match #{i}: Status={status_map.get(m[4], m[4])}, Creator={m[1]}, Opponent={m[2]}, Winner={m[5]}")

if __name__ == "__main__":
    check_matches()
