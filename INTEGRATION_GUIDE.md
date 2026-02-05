# The Arbiter - Integration Guide

Complete guide for setting up and running The Arbiter on Monad testnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Setup](#frontend-setup)
3. [Referee Agent Setup](#referee-agent-setup)
4. [Cloud Deployment (Railway)](#cloud-deployment-railway)
5. [MetaMask Configuration](#metamask-configuration)
6. [Testing the Complete Flow](#testing-the-complete-flow)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- MetaMask browser extension
- Monad testnet MON tokens ([Get from faucet](https://testnet.monad.xyz))

## Frontend Setup

### 1. Install Dependencies

```bash
cd /mnt/data/Projects/Monad/Arbiter/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

### 4. RainbowKit Integration
The frontend uses **RainbowKit** and **Wagmi** for a professional wallet experience. 
- **Configuration:** Found in `src/config.ts`
- **Providers:** Wrapped in `src/main.tsx`
- **Hook:** `src/hooks/useArena.ts` refactored to use standard Wagmi hooks.

## Referee Agent Setup

### 1. Install Python Dependencies

```bash
cd /mnt/data/Projects/Monad/Arbiter/agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` file and add your private key:

```bash
# Monad Testnet Configuration
RPC_URL=https://testnet-rpc.monad.xyz
CONTRACT_ADDRESS=0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE  # ⚠️ Add your private key
REFEREE_ADDRESS=0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
```

> **⚠️ Security Warning**: Never commit your `.env` file with real private keys!

### 3. Run Locally

```bash
python referee.py
```

The agent will start monitoring for `MatchJoined` events and automatically settle matches.

## Cloud Deployment (Railway)

Deploy the referee agent to Railway for 24/7 operation during the hackathon.

### 1. Prepare for Deployment

Create `Procfile` in the agent directory:

```bash
cd /mnt/data/Projects/Monad/Arbiter/agent
echo "worker: python referee.py" > Procfile
```

Create `runtime.txt` to specify Python version:

```bash
echo "python-3.11.0" > runtime.txt
```

### 2. Deploy to Railway

1. **Sign up** at [railway.app](https://railway.app)
2. **Create New Project** → "Deploy from GitHub repo"
3. **Connect your repository** or use Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd /mnt/data/Projects/Monad/Arbiter/agent
railway init

# Add environment variables
railway variables set RPC_URL=https://testnet-rpc.monad.xyz
railway variables set CONTRACT_ADDRESS=0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
railway variables set PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
railway variables set REFEREE_ADDRESS=0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855

# Deploy
railway up
```

4. **Monitor logs**:

```bash
railway logs
```

### Alternative: Render.com Deployment

1. Create `render.yaml` in agent directory:

```yaml
services:
  - type: worker
    name: arbiter-referee
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python referee.py
    envVars:
      - key: RPC_URL
        value: https://testnet-rpc.monad.xyz
      - key: CONTRACT_ADDRESS
        value: 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
      - key: PRIVATE_KEY
        sync: false  # Set manually in dashboard
      - key: REFEREE_ADDRESS
        value: 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
```

2. Push to GitHub and connect to [render.com](https://render.com)

## MetaMask Configuration

### Add Monad Testnet to MetaMask

The frontend will automatically prompt you to add Monad testnet, but you can also add it manually:

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter the following details:

```
Network Name: Monad Testnet
RPC URL: https://testnet-rpc.monad.xyz
Chain ID: 10143
Currency Symbol: MON
Block Explorer: https://testnet.monadscan.com
```

### Get Testnet Tokens

1. Visit [Monad Faucet](https://testnet.monad.xyz)
2. Enter your wallet address
3. Request MON tokens
4. Wait for confirmation (~30 seconds)

## Testing the Complete Flow

### 1. Connect Wallet

1. Open frontend at `http://localhost:5173`
2. Click the **"Connect Wallet"** button (RainbowKit).
3. Select your wallet (e.g., MetaMask).
4. RainbowKit will automatically prompt you to switch to the **Monad Testnet** if you are on a different network.

### 2. Create a Match

1. Click "Create New Match"
2. Enter stake amount (e.g., `0.1` MON)
3. Confirm transaction in MetaMask
4. Wait for confirmation
5. Match appears with "Pending" status

### 3. Join Match (Different Wallet)

1. Switch to a different MetaMask account
2. Refresh the page
3. Find the pending match
4. Click "Join Arena"
5. Confirm transaction with same stake amount
6. Match status changes to "Active"

### 4. Automatic Settlement

1. Referee agent detects `MatchJoined` event
2. Simulates game outcome (random for demo)
3. Calls `settleMatch()` on contract
4. Match status changes to "Settled"
5. Winner is displayed

### 5. Withdraw Winnings

1. Connect with winning wallet
2. See "Winnings Available" banner
3. Click "Withdraw"
4. Confirm transaction
5. Funds transferred to wallet

## Troubleshooting

### Frontend Issues

**"Please install MetaMask"**
- Install MetaMask browser extension
- Refresh the page

**"Failed to connect wallet"**
- Check MetaMask is unlocked
- Try disconnecting and reconnecting
- Clear browser cache

**Transactions failing**
- Ensure you have enough MON for gas
- Check you're on Monad testnet
- Increase gas limit in MetaMask settings

### Referee Agent Issues

**"Connection refused" error**
- Check RPC URL is correct
- Verify internet connection
- Try alternative RPC if available

**"Insufficient funds" error**
- Ensure referee wallet has MON tokens
- Request more from faucet

**Events not detected**
- Check contract address is correct
- Verify agent is running
- Check Railway/Render logs for errors

**Gas price too low**
- Agent automatically adjusts gas price
- Check Monad testnet status
- Increase gas buffer in `referee.py`

### Contract Issues

**"Match not found"**
- Verify contract address in config
- Check you're on correct network
- Refresh the page

**"Incorrect stake" error**
- Match exact stake amount when joining
- Check decimal precision (use 4 decimals max)

## Contract Details

- **Address**: `0xA658Fa34515794c1C38D5Beb7D412E11d50A141C`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Explorer**: [View on MonadScan](https://testnet.monadscan.com/address/0xa658fa34515794c1c38d5beb7d412e11d50a141c)
- **Owner**: `0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855`
- **Referee**: `0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855`

## Support

For issues or questions:
- Check [Monad Documentation](https://docs.monad.xyz)
- Review contract on [MonadScan](https://testnet.monadscan.com)
- Check Railway/Render deployment logs
