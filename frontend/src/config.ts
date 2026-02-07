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
export const ARENA_CONTRACT_ADDRESS = import.meta.env.VITE_ARENA_CONTRACT_ADDRESS || '0xAf4e58B7e9B6f95697E454224825A4539Ad08991';
export const ARENA_ABI = ArenaArtifact.abi;
export const PROFILES_CONTRACT_ADDRESS = import.meta.env.VITE_PROFILES_CONTRACT_ADDRESS || '0xD2d17E03E4F0EaeAfAdB542869258dF0d428C800';
export const PROFILES_ABI = ProfilesArtifact.abi;
export const REFEREE_ADDRESS = '0xF2E7E2f51D7C9eEa9B0313C2eCa12f8E43bD1855';

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
