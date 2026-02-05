import ArenaArtifact from './Arena.json';

// Monad Testnet Configuration
export const MONAD_TESTNET = {
    chainId: '0x279F', // 10143 in hex
    chainName: 'Monad Testnet',
    nativeCurrency: {
        name: 'Monad',
        symbol: 'MON',
        decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz'],
    blockExplorerUrls: ['https://testnet.monadscan.com'],
};

// Contract Configuration
export const ARENA_CONTRACT_ADDRESS = '0xA658Fa34515794c1C38D5Beb7D412E11d50A141C';
export const ARENA_ABI = ArenaArtifact.abi;

// Network Details
export const CHAIN_ID = 10143;
export const RPC_URL = 'https://testnet-rpc.monad.xyz';
export const EXPLORER_URL = 'https://testnet.monadscan.com';

// Referee Address (for display purposes)
export const REFEREE_ADDRESS = '0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855';
