import ArenaArtifact from './Arena.json';
import ProfilesArtifact from './Profiles.json';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

export const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz', 'https://monad-testnet.drpc.org'] },
    },
    blockExplorers: {
        default: { name: 'MonadScan', url: 'https://testnet.monadscan.com' },
    },
    testnet: true,
});

// Contract addresses from environment variables
export const ARENA_CONTRACT_ADDRESS = import.meta.env.VITE_ARENA_CONTRACT_ADDRESS || '0xBA86755490b6aA8D4906f331F905785098Ba1471';
export const ARENA_ABI = ArenaArtifact.abi;
export const PROFILES_CONTRACT_ADDRESS = import.meta.env.VITE_PROFILES_CONTRACT_ADDRESS || '0x26417711902E09FE567C745679FA870A98ba1454';
export const PROFILES_ABI = ProfilesArtifact.abi;
export const REFEREE_ADDRESS = '0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855';

export const config = getDefaultConfig({
    appName: 'The Arbiter',
    projectId: 'YOUR_PROJECT_ID', // Replace with your RainbowKit project ID
    chains: [monadTestnet],
    transports: {
        [monadTestnet.id]: http(undefined, {
            timeout: 60_000,
            retryCount: 3,
            retryDelay: 2_000,
        }),
    },
});
