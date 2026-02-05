# Quick Render Deployment Guide

## Issues Fixed ✅

1. **ABI Loading Error** - Updated `referee.py` to load `Arena.json` from the same directory
2. **Blueprint Error** - Moved `render.yaml` to repository root

## Deploy Now

### Method 1: Direct Deployment (Recommended)

1. **Go to [render.com](https://render.com/dashboard)**

2. **Click "New +" → "Background Worker"**

3. **Connect Repository:**
   - Connect GitHub
   - Select: `Monad/Arbiter` (or your repo name)
   - Branch: `main`

4. **Configure Service:**
   ```
   Name: arbiter-referee
   Region: Oregon (US West)
   Root Directory: agent
   Build Command: pip install -r requirements.txt
   Start Command: python referee.py
   Instance Type: Free (or Starter for 24/7)
   ```

5. **Add Environment Variables:**
   ```
   RPC_URL = https://testnet-rpc.monad.xyz
   CONTRACT_ADDRESS = 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
   REFEREE_ADDRESS = 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
   PRIVATE_KEY = <YOUR_PRIVATE_KEY>  ← Mark as "Secret"
   ```

6. **Click "Create Background Worker"**

### Method 2: Blueprint Deployment

1. **Push to GitHub:**
   ```bash
   cd /mnt/data/Projects/Monad/Arbiter
   git add .
   git commit -m "Fix Render deployment configuration"
   git push
   ```

2. **On Render:**
   - Click "New +" → "Blueprint"
   - Select your repository
   - Render will find `render.yaml` in the root
   - Click "Apply"

3. **Set Private Key:**
   - Go to your service → "Environment"
   - Add `PRIVATE_KEY` manually
   - Mark as secret
   - Save

## Verify Deployment

After deployment, check logs for:
```
============================================================
🤖 THE ARBITER - Autonomous Referee Agent
============================================================
Contract: 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
Referee: 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
Network: https://testnet-rpc.monad.xyz
============================================================
👀 Monitoring blockchain for new matches...
```

## Files Now in Place

✅ `agent/Arena.json` - Contract ABI (copied from build)
✅ `agent/referee.py` - Updated to load local ABI
✅ `agent/Procfile` - Render start command
✅ `agent/runtime.txt` - Python version
✅ `render.yaml` - Blueprint config (in root)

## Test It

1. Deploy on Render
2. Open frontend: `cd frontend && npm run dev`
3. Create a match
4. Join with another wallet
5. Watch Render logs for settlement!
