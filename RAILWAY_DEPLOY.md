# Railway Deployment - Step by Step Guide

## Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- Your private key ready

## Step 1: Install Railway CLI

Open a terminal and run:

```bash
sudo npm install -g @railway/cli
```

Enter your password when prompted.

**Verify installation:**
```bash
railway --version
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser. Login and authorize the CLI.

## Step 3: Navigate to Agent Directory

```bash
cd /mnt/data/Projects/Monad/Arbiter/agent
```

## Step 4: Initialize Railway Project

```bash
railway init
```

- Choose: "Create a new project"
- Project name: `arbiter-referee` (or any name you like)

## Step 5: Set Environment Variables

**IMPORTANT:** Replace `<YOUR_PRIVATE_KEY>` with your actual private key!

```bash
railway variables set RPC_URL=https://testnet-rpc.monad.xyz

railway variables set CONTRACT_ADDRESS=0xA658Fa34515794c1C38D5Beb7D412E11d50A141C

railway variables set REFEREE_ADDRESS=0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855

railway variables set PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

**Verify variables:**
```bash
railway variables
```

## Step 6: Deploy!

```bash
railway up
```

Railway will:
1. Upload your code
2. Detect it's a Python project
3. Install dependencies from `requirements.txt`
4. Run `python referee.py` (from Procfile)

## Step 7: View Logs

```bash
railway logs
```

**Expected output:**
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

## Step 8: Test It!

1. Open your frontend: `cd ../frontend && npm run dev`
2. Create a match
3. Join with another wallet
4. Watch Railway logs: `railway logs --follow`
5. You should see the referee detect and settle the match!

## Useful Commands

```bash
# View logs (live)
railway logs --follow

# Check status
railway status

# Open dashboard
railway open

# Stop service
railway down

# Redeploy
railway up
```

## Troubleshooting

**"Not logged in"**
```bash
railway login
```

**"No project found"**
```bash
railway link
# Or create new:
railway init
```

**"Service crashed"**
```bash
railway logs
# Check for errors
```

**Need to update code:**
```bash
# Make your changes, then:
railway up
```

## Cost

Railway gives you **$5 free credit per month**. The referee agent uses minimal resources:
- ~$0.01/hour = ~$7/month for 24/7
- For hackathon (few days): ~$0.50 total

Your $5 credit is more than enough! 🎉

## Alternative: Railway Dashboard

If CLI doesn't work, you can deploy via the web dashboard:

1. Go to [railway.app/new](https://railway.app/new)
2. "Deploy from GitHub repo"
3. Connect your repo
4. Select `agent` as root directory
5. Add environment variables in the dashboard
6. Deploy!

---

**Ready to deploy!** Just follow the steps above. Let me know if you hit any issues!
