---
description: Verify Arbiter smart contracts on Monad Testnet
---

# Verify Contracts on Monad Testnet

This workflow verifies the `Arena` and `Profiles` contracts on the Monad Testnet using Sourcify.

### 1. Verify Arena Contract
// turbo
```bash
forge verify-contract \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org/' \
  0xAf4E58b7E9b6F95697E454224825a4539AD08991 \
  src/Arena.sol:Arena \
  --constructor-args $(cast abi-encode "constructor(address)" "0xF2E7E2f51D7C9eEa9B0313C2eCa12f8E43bd1855")
```

### 2. Verify Profiles Contract
// turbo
```bash
forge verify-contract \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org/' \
  0xd2d17E03e4F0eaEaFadb542869258DF0D428c800 \
  src/Profiles.sol:Profiles
```
