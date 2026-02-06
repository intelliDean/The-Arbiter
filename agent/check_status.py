from web3 import Web3
import os
import json
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://testnet-rpc.monad.xyz")
CONTRACT_ADDRESS = Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS").lower())

with open("Arena.json", "r") as f:
    ABI = json.load(f)["abi"]

w3 = Web3(Web3.HTTPProvider(RPC_URL))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

def check_matches():
    next_id = contract.functions.nextMatchId().call()
    referee = contract.functions.officialReferee().call()
    current_block = w3.eth.block_number
    print(f"Contract: {CONTRACT_ADDRESS}")
    print(f"Official Referee: {referee}")
    print(f"Next Match ID: {next_id}")
    print(f"Current Block: {current_block}")
    
    for i in range(max(0, next_id - 5), next_id):
        m = contract.functions.matches(i).call()
        # id, creator, opponent, stake, status, winner, lastUpdate, creatorGuess, opponentGuess, targetNumber
        status_map = {0: "Pending", 1: "Active", 2: "Settled", 3: "Cancelled"}
        last_update = m[6]
        import datetime
        dt = datetime.datetime.fromtimestamp(last_update)
        print(f"Match #{i}: Status={status_map.get(m[4], m[4])}, Creator={m[1]}, Opponent={m[2]}, Winner={m[5]}, LastUpdate={dt} ({last_update})")

if __name__ == "__main__":
    check_matches()
