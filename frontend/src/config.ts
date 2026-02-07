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
// testnet.monadvision.com

// Normalized address helper
const normalizeAddress = (address: string | undefined, fallback: string): `0x${string}` => {
    return (address ? address.trim() : fallback).toLowerCase() as `0x${string}`;
};

// Contract addresses - lowercased to avoid checksum validation errors at module load time
export const ARENA_CONTRACT_ADDRESS = normalizeAddress(
    import.meta.env.VITE_ARENA_CONTRACT_ADDRESS,
    '0xaf4e58b7e9b6f95697e454224825a4539ad08991'
);
export const ARENA_ABI = ArenaArtifact.abi;

export const PROFILES_CONTRACT_ADDRESS = normalizeAddress(
    import.meta.env.VITE_PROFILES_CONTRACT_ADDRESS,
    '0xd2d17e03e4f0eaeafadb542869258df0d428c800'
);
export const PROFILES_ABI = ProfilesArtifact.abi;

export const REFEREE_ADDRESS = normalizeAddress(
    import.meta.env.VITE_REFEREE_ADDRESS,
    '0xf2e7e2f51d7c9eea9b0313c2eca12f8e43bd1855'
);

export const config = getDefaultConfig({
    appName: 'The Arbiter',
    projectId: '094f4e690ba870696b28c2c516e69a92',
    chains: [monadTestnet],
    transports: {
        [monadTestnet.id]: http(undefined, {
            timeout: 60_000,
            retryCount: 3,
            retryDelay: 2_000,
        }),
    },
});
