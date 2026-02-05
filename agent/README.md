# The Arbiter - Agent Brain

This directory contains the autonomous Referee agent that monitors and settles matches.

## Setup

1. **Install dependencies**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   Create a `.env` file:
   ```env
   RPC_URL=http://127.0.0.1:8545
   CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   REFEREE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

## Running the Agent

### 1. Start Anvil (Local Testnet)
```bash
cd ../contracts
anvil
```

### 2. Deploy the Contract
```bash
forge create --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  src/Arena.sol:Arena
```

### 3. Run the Referee Agent
```bash
python referee.py
```

### 4. Test with Simulated Matches
In another terminal:
```bash
python test_agent.py
```

## How It Works

1. **Event Monitoring**: The agent listens for `MatchJoined` events on-chain.
2. **Game Simulation**: When a match is joined, it simulates a game outcome (random for demo).
3. **Settlement**: Calls `settleMatch()` on the contract, which:
   - Deducts 2.5% platform fee
   - Credits winner's `pendingWithdrawals`
   - Emits `MatchSettled` event

## Production Considerations

For a real deployment, replace the game simulation with:
- **Game Server Webhooks**: Listen to actual game results
- **Chainlink Functions**: Off-chain computation with cryptographic proofs
- **Multi-Referee Consensus**: Require 2-of-3 agents to agree on results
