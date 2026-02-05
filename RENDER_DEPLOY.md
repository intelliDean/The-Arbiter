# ✅ RENDER DEPLOYMENT - READY TO GO

## Critical Fixes Applied

### 1. Service Type Error ❌→✅
**Before:** Created "Web Service" (requires port binding)  
**After:** Must create "Background Worker" (no port needed)

### 2. Event Filter Not Supported ❌→✅
**Before:** Used `create_filter()` - Monad RPC doesn't support this  
**After:** Uses block polling with `get_logs()` - Works with Monad!

## Deploy Steps (Follow Exactly)

### 1. Delete Old Service
If you created a Web Service, delete it first.

### 2. Create Background Worker

1. **Render Dashboard** → "New +" → **"Background Worker"** (NOT Web Service!)

2. **Connect Repository:**
   - GitHub repo: Your Arbiter repo
   - Branch: `main`

3. **Service Configuration:**
   ```
   Name: arbiter-referee
   Region: Oregon (US West)
   Root Directory: agent
   Build Command: pip install -r requirements.txt
   Start Command: python referee.py
   Instance Type: Free
   ```

4. **Environment Variables:**
   ```
   RPC_URL = https://testnet-rpc.monad.xyz
   CONTRACT_ADDRESS = 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
   REFEREE_ADDRESS = 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
   PRIVATE_KEY = <YOUR_PRIVATE_KEY>
   ```
   ⚠️ Mark `PRIVATE_KEY` as **Secret**

5. **Create Background Worker**

## Expected Output

```
============================================================
🤖 THE ARBITER - Autonomous Referee Agent
============================================================
Contract: 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
Referee: 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
Network: https://testnet-rpc.monad.xyz
============================================================
👀 Monitoring blockchain for new matches...

📦 Checking blocks 12345 to 12346...
```

## How It Works Now

The referee agent polls Monad testnet every 5 seconds:
1. Gets current block number
2. Fetches `MatchJoined` events from new blocks
3. Simulates game outcome
4. Settles match on-chain
5. Tracks processed matches to avoid duplicates

## Test It

1. **Deploy on Render** (as Background Worker)
2. **Check logs** - Should show "Monitoring blockchain..."
3. **Create match** on frontend
4. **Join match** with different wallet
5. **Watch Render logs** - Should detect event and settle!

## Files Ready

✅ `agent/referee.py` - Block polling (Monad compatible)  
✅ `agent/Arena.json` - Contract ABI  
✅ `agent/Procfile` - Start command  
✅ `agent/runtime.txt` - Python 3.11  
✅ `agent/requirements.txt` - Dependencies  
✅ `render.yaml` - Blueprint config (root)

## Push to GitHub (Optional)

```bash
cd /mnt/data/Projects/Monad/Arbiter
git add .
git commit -m "Fix Render deployment - use block polling"
git push
```

Then use Blueprint deployment on Render.

---

**Ready to deploy!** 🚀 Just make sure to select **Background Worker**, not Web Service.
