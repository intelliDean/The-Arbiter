# Arena Contract Deployment

## Monad Testnet Deployment

**Deployment Date:** February 5, 2026

### Contract Details

- **Contract Name:** Arena (The Arbiter)
- **Network:** Monad Testnet
- **Chain ID:** 10143
- **Deployer Address:** `0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855`
- **Contract Address:** `0xA658Fa34515794c1C38D5Beb7D412E11d50A141C`
- **Transaction Hash:** `0x3ffcee138ad57991422dd2ca8b2489884f502844b7d746770b5ff5da5891ecc6`

### Explorer Links

- **Contract Explorer:** [View on MonadScan](https://testnet.monadscan.com/address/0xa658fa34515794c1c38d5beb7d412e11d50a141c)
- **Deployment Transaction:** [View Transaction](https://testnet.monadscan.com/tx/0x3ffcee138ad57991422dd2ca8b2489884f502844b7d746770b5ff5da5891ecc6)

### Contract Features

The Arena contract includes the following features:

- **Match Creation:** Players can create wagering matches with custom stakes
- **Match Joining:** Opponents can join pending matches by matching the stake
- **Referee System:** Autonomous arbiter settles matches and determines winners
- **Fee System:** 2.5% platform fee on all settled matches
- **Timeout Protection:** 24-hour emergency claim mechanism for stuck matches
- **Pull Withdrawal Pattern:** Secure withdrawal system for winnings
- **Reentrancy Protection:** Custom reentrancy guard for all critical functions

### Contract Configuration

- **Platform Fee:** 2.5% (250 basis points)
- **Match Timeout:** 24 hours
- **Owner:** `0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855`

### RPC Configuration

```toml
eth-rpc-url = "https://testnet-rpc.monad.xyz"
chain_id = 10143
evm_version = "prague"
```

### Interacting with the Contract

#### Using Cast (Foundry)

```bash
# Check owner
cast call 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C "owner()(address)" --rpc-url https://testnet-rpc.monad.xyz

# Check next match ID
cast call 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C "nextMatchId()(uint256)" --rpc-url https://testnet-rpc.monad.xyz

# Create a match (example with 0.1 MON stake)
cast send 0xA658Fa34515794c1C38D5Beb7D412E11d50A141C "createMatch(address)" <REFEREE_ADDRESS> --value 0.1ether --private-key <YOUR_PRIVATE_KEY> --rpc-url https://testnet-rpc.monad.xyz
```

#### Using Web3 Libraries

```javascript
const ARENA_ADDRESS = "0xA658Fa34515794c1C38D5Beb7D412E11d50A141C";
const RPC_URL = "https://testnet-rpc.monad.xyz";
const CHAIN_ID = 10143;
```

### Next Steps

1. **Update Frontend:** Configure your frontend application with the deployed contract address
2. **Test Functionality:** Create test matches to verify all features work correctly
3. **Monitor Events:** Set up event listeners for match creation, joining, and settlement
4. **Deploy Referee Agent:** Deploy the autonomous referee system to manage match settlements

### Verification Status

✅ **Contract Verified** on MonadScan - Source code is publicly viewable

### Security Notes

- Contract uses custom reentrancy guard
- Pull withdrawal pattern implemented for secure fund transfers
- Emergency timeout mechanism protects against stuck matches
- Owner-only fee withdrawal function
