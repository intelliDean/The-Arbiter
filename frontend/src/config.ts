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

export const ARENA_CONTRACT_ADDRESS = '0x0d3df5c18cc48099a3a829e56d1628afb904f278' as const;
export const ARENA_ABI = ArenaArtifact.abi;
export const PROFILES_CONTRACT_ADDRESS = '0x12d32039760a9c729a1558ae3f47f87f40e4901b' as const;
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
