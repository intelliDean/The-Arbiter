import ArenaArtifact from './Arena.json';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

export const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz'] },
    },
    blockExplorers: {
        default: { name: 'MonadScan', url: 'https://testnet.monadscan.com' },
    },
    testnet: true,
});

export const ARENA_CONTRACT_ADDRESS = '0xA658Fa34515794c1C38D5Beb7D412E11d50A141C' as const;
export const ARENA_ABI = ArenaArtifact.abi;
export const REFEREE_ADDRESS = '0xF2E7E2f51D7C9eEa9B0313C2eCa12f8e43bd1855';

export const config = getDefaultConfig({
    appName: 'The Arbiter',
    projectId: 'YOUR_PROJECT_ID', // Replace with your RainbowKit project ID
    chains: [monadTestnet],
    transports: {
        [monadTestnet.id]: http(),
    },
});
