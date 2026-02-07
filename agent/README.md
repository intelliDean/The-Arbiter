# 🤖 The Arbiter - Referee Agent

The autonomous "Brain" of the Arbiter ecosystem. This Python-based node monitors the Monad blockchain for match events, and triggers trustless on-chain settlements.

## Key Features

- **Persistence Layer**: Uses SQLite (`agent_state.db`) to track last processed blocks and match history, ensuring zero-gap recovery after restarts.
- **Reliability Engine**: Automatic transaction retries with exponential backoff and adaptive RPC chunking to avoid rate limits.
- **Health Monitoring**: Integrated HTTP server (Port 8080) for real-time infrastructure health checks.
- **Structured Logging**: Professional internal logging to both `stdout` and `referee.log`.

## Setup

1. **Install Dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   Create a `.env` file from the example:
   ```env
   RPC_URL=https://testnet-rpc.monad.xyz
   CONTRACT_ADDRESS=0x...
   PRIVATE_KEY=0x...
   REFEREE_ADDRESS=0x...
   CHAIN_ID=10143
   ```

## Operations

### Running the Node
```bash
python referee.py
```

### Health Check
```bash
curl http://localhost:8080/health
```

### Maintenance
- **Platform Fees**: The agent automatically monitors accumulated fees and sweeps them to the referee wallet daily (if >0.05 MON).
- **Manual Debugging**: Use `check_status.py` to inspect the current state of the contract and recent match history.

## How It Works

1. **Event Watcher**: Polls the Monad chain for `MatchJoined` events.
2. **Simulation Logic**: Calculates a verifiable target number and determines the winner based on guess proximity.
3. **Settlement**: Constructs and signs a `settleMatch` transaction.
4. **State Sync**: Updates the local database only after on-chain confirmation.

---
Built for high-performance automation on **Monad**.
