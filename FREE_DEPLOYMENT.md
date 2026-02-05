# Free Deployment Options for Referee Agent

## Option 1: Railway ⭐ RECOMMENDED

**Free Tier:** $5 credit/month (enough for hackathon)

### Deploy Steps

1. **Sign up at [railway.app](https://railway.app)**

2. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

3. **Deploy:**
   ```bash
   cd /mnt/data/Projects/Monad/Arbiter/agent
   
   # Login
   railway login
   
   # Create project
   railway init
   
   # Set environment variables
   railway variables set RPC_URL=https://testnet-rpc.monad.xyz
   railway variables set CONTRACT_ADDRESS=0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
   railway variables set REFEREE_ADDRESS=0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
   railway variables set PRIVATE_KEY=<YOUR_PRIVATE_KEY>
   
   # Deploy
   railway up
   
   # View logs
   railway logs
   ```

**That's it!** Railway auto-detects Python and uses your `Procfile`.

---

## Option 2: Fly.io (Free Tier Available)

**Free Tier:** 3 shared VMs, 160GB bandwidth/month

### Deploy Steps

1. **Install flyctl:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   flyctl auth login
   ```

3. **Create fly.toml:**
   ```bash
   cd /mnt/data/Projects/Monad/Arbiter/agent
   flyctl launch --no-deploy
   ```

4. **Set secrets:**
   ```bash
   flyctl secrets set RPC_URL=https://testnet-rpc.monad.xyz
   flyctl secrets set CONTRACT_ADDRESS=0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
   flyctl secrets set REFEREE_ADDRESS=0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
   flyctl secrets set PRIVATE_KEY=<YOUR_PRIVATE_KEY>
   ```

5. **Deploy:**
   ```bash
   flyctl deploy
   flyctl logs
   ```

---

## Option 3: Run Locally (Simplest for Hackathon)

**Free:** 100% free, runs on your machine

### Setup

1. **Add private key to .env:**
   ```bash
   cd /mnt/data/Projects/Monad/Arbiter/agent
   nano .env  # or use your editor
   # Add: PRIVATE_KEY=<YOUR_PRIVATE_KEY>
   ```

2. **Run in background:**
   ```bash
   # Option A: Using screen (Linux/Mac)
   screen -S arbiter
   python referee.py
   # Press Ctrl+A then D to detach
   
   # Option B: Using nohup
   nohup python referee.py > referee.log 2>&1 &
   
   # View logs
   tail -f referee.log
   ```

3. **Keep terminal open** during hackathon demo

**Pros:** Free, instant, no deployment complexity  
**Cons:** Requires your computer to stay on

---

## Option 4: Google Cloud Run (Free Tier)

**Free Tier:** 2 million requests/month, always-free tier

Requires Docker, more complex setup. Let me know if you want this option.

---

## Recommendation for Hackathon

**For quick demo:** Use **Option 3 (Local)** - Just run it on your laptop  
**For 24/7 uptime:** Use **Option 1 (Railway)** - $5 free credit is plenty

### Quick Railway Deploy (30 seconds)

```bash
npm install -g @railway/cli
cd /mnt/data/Projects/Monad/Arbiter/agent
railway login
railway init
railway variables set RPC_URL=https://testnet-rpc.monad.xyz
railway variables set CONTRACT_ADDRESS=0xA658Fa34515794c1C38D5Beb7D412E11d50A141C
railway variables set REFEREE_ADDRESS=0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855
railway variables set PRIVATE_KEY=<YOUR_KEY>
railway up
```

Which option would you prefer?
