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

export const ARENA_CONTRACT_ADDRESS = '0xaf4e58b7e9b6f95697e454224825a4539ad08991' as const;
export const ARENA_ABI = ArenaArtifact.abi;
export const PROFILES_CONTRACT_ADDRESS = '0xd2d17e03e4f0eaeafadb542869258df0d428c800' as const;
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
