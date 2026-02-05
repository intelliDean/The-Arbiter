# Render Deployment - Critical Fixes

## Issue 1: Wrong Service Type ⚠️

**Error:** "Port scan timeout reached, no open ports detected"

**Problem:** You created a **Web Service** instead of a **Background Worker**

**Solution:** 
1. Delete the current service on Render
2. Create a new **Background Worker** (not Web Service)
3. Background workers don't need ports - they just run Python scripts

## Issue 2: Event Filters Not Supported ⚠️

**Error:** `web3.exceptions.MethodUnavailable: {'code': -32601, 'message': 'Method not found'}`

**Problem:** Monad RPC doesn't support `eth_newFilter` method used by web3.py event filters

**Solution:** ✅ **Fixed!** Updated `referee.py` to use block polling instead of event filters

### What Changed in referee.py

**Before (Broken):**
```python
event_filter = contract.events.MatchJoined.create_filter(fromBlock='latest')
for event in event_filter.get_new_entries():
    handle_match_joined(event)
```

**After (Working):**
```python
# Poll blocks every 5 seconds
events = contract.events.MatchJoined.get_logs(
    fromBlock=last_block + 1,
    toBlock=current_block
)
for event in events:
    handle_match_joined(event)
```

## Deploy Correctly on Render

### Step-by-Step (IMPORTANT: Follow Exactly)

1. **Delete existing service** (if you created a Web Service)

2. **Create New Service:**
   - Click "New +" 
   - Select **"Background Worker"** ← NOT "Web Service"!
   - Connect your GitHub repo

3. **Service Settings:**
   ```
   Name: arbiter-referee
   Region: Oregon (US West)
   Branch: main
   Root Directory: agent
   
   Build Command: pip install -r requirements.txt
   Start Command: python referee.py
   
   Instance Type: Free (or Starter for 24/7)
   ```

4. **Environment Variables:**
   ```
   RPC_URL = https://testnet-rpc.monad.xyz
   CONTRACT_ADDRESS = 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
   REFEREE_ADDRESS = 0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
   PRIVATE_KEY = <YOUR_PRIVATE_KEY>  ← Mark as "Secret"
   ```

5. **Create Background Worker**

### Expected Logs (Success)

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

## Key Differences

| Web Service | Background Worker |
|-------------|-------------------|
| ❌ Needs port binding | ✅ No port needed |
| ❌ For HTTP servers | ✅ For scripts/workers |
| ❌ Wrong for this | ✅ Correct choice |

## Files Updated

✅ `agent/referee.py` - Now uses block polling (compatible with Monad RPC)

## Test Locally First (Optional)

```bash
cd /mnt/data/Projects/Monad/Arbiter/agent
# Make sure .env has your private key
python referee.py
```

You should see it start monitoring without errors.
