---
description: Deploy smart contracts to Monad testnet using Foundry
---

# Deploy to Monad Testnet

This workflow guides you through deploying the Arena smart contract to the Monad testnet.

## Prerequisites

1. **Foundry installed** - Ensure you have `forge` and `cast` installed
2. **Testnet funds** - Get MON tokens from the [Monad faucet](https://testnet.monad.xyz)
3. **Wallet setup** - Create a keystore for secure deployment

## Steps

### 1. Verify Foundry Configuration

Check that `foundry.toml` has the correct Monad testnet settings:
```bash
cd /mnt/data/Projects/Monad/Arbiter/contracts
cat foundry.toml
```

Expected configuration:
- RPC URL: `https://testnet-rpc.monad.xyz`
- Chain ID: `10143`
- EVM Version: `prague`

### 2. Create a Keystore (First Time Only)

Create a secure keystore named `monad-deployer`:
```bash
cast wallet import monad-deployer --private-key $(cast wallet new | grep 'Private key:' | awk '{print $3}')
```

You'll be prompted to set a password. **Remember this password!**

To view your wallet address:
```bash
cast wallet address --account monad-deployer
```

### 3. Get Testnet Funds

1. Copy your wallet address from step 2
2. Visit the [Monad faucet](https://testnet.monad.xyz)
3. Request testnet MON tokens
4. Wait for confirmation

Verify your balance:
```bash
cast balance $(cast wallet address --account monad-deployer) --rpc-url https://testnet-rpc.monad.xyz
```

### 4. Compile the Contract

Compile the Arena contract:
```bash
forge build
```

### 5. Deploy Using Script (Recommended)

Deploy using the deployment script:
```bash
forge script script/Deploy.s.sol:DeployArena --account monad-deployer --rpc-url https://testnet-rpc.monad.xyz --broadcast --verify
```

### 6. Deploy Using Direct Command (Alternative)

Alternatively, deploy directly without a script:
```bash
forge create src/Arena.sol:Arena --account monad-deployer --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

### 7. Save Deployment Information

After successful deployment, you'll see output like:
```
Deployer: 0x...
Deployed to: 0x...
Transaction hash: 0x...
```

**Save these addresses!** You'll need them to interact with the contract.

## Troubleshooting

### Insufficient Funds
If you see "insufficient funds" error, request more tokens from the faucet.

### RPC Connection Issues
Verify the RPC URL is correct and accessible:
```bash
cast block-number --rpc-url https://testnet-rpc.monad.xyz
```

### Keystore Password Issues
If you forgot your password, you'll need to create a new keystore with a different name.

## Next Steps

After deployment:
1. Test the contract on the testnet
2. Verify the contract on a block explorer (if available)
3. Update your frontend with the deployed contract address
