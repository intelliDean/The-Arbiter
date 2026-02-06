import { useState, useEffect, useCallback } from 'react';
import { Contract, parseEther, formatEther, BrowserProvider, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ARENA_CONTRACT_ADDRESS, ARENA_ABI } from '../config';
import { parseError } from '../utils/errorParser';

export interface Match {
    id: number;
    creator: string;
    opponent: string;
    stake: string;
    status: 'Pending' | 'Active' | 'Settled' | 'Cancelled' | 'Draw';
    winner: string;
    lastUpdate: number;
    creatorGuess: number;
    opponentGuess: number;
    targetNumber: number;
}

// Global cache for providers to avoid redundant eth_chainId calls
const providerCache: Record<string, JsonRpcProvider | BrowserProvider> = {};

export function clientToProvider(publicClient: any) {
    const { chain, transport } = publicClient;
    const cacheKey = `${chain.id}-${transport.url || transport.type}`;

    if (providerCache[cacheKey]) {
        return providerCache[cacheKey];
    }

    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };

    let provider;
    // If it's an HTTP transport, use JsonRpcProvider
    if (transport.type === 'http') {
        provider = new JsonRpcProvider(transport.url, network);
    }
    // If it's a fallback transport, use the first successful URL
    else if (transport.type === 'fallback') {
        const url = transport.transports?.[0]?.value?.url || transport.url;
        provider = url ? new JsonRpcProvider(url, network) : new BrowserProvider(transport, network);
    }
    else {
        // Fallback to BrowserProvider for EIP-1193
        provider = new BrowserProvider(transport, network);
    }

    providerCache[cacheKey] = provider;
    return provider;
}

export function clientToSigner(walletClient: any) {
    const { account, chain, transport } = walletClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new BrowserProvider(transport, network);
    return new JsonRpcSigner(provider, account.address);
}

export const useArena = () => {
    const { address: account } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [matches, setMatches] = useState<Match[]>([]);
    const [pendingWithdrawal, setPendingWithdrawal] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getContract = useCallback(async (needsSigner = false) => {
        if (!publicClient) throw new Error('Public client not available');

        if (needsSigner) {
            if (!walletClient) throw new Error('Wallet not connected');
            const signer = clientToSigner(walletClient);
            return new Contract(ARENA_CONTRACT_ADDRESS, ARENA_ABI, signer);
        }

        const provider = clientToProvider(publicClient);
        return new Contract(ARENA_CONTRACT_ADDRESS, ARENA_ABI, provider);
    }, [publicClient, walletClient]);

    const fetchMatches = useCallback(async () => {
        if (!publicClient) return;

        try {
            const contract = await getContract();
            const nextMatchId = Number(await contract.nextMatchId());

            // Only fetch the last 20 matches to avoid RPC rate limits and long load times
            const startIndex = Math.max(0, nextMatchId - 20);
            const statusMap = ['Pending', 'Active', 'Settled', 'Cancelled', 'Draw'];

            const matchPromises = [];
            for (let i = startIndex; i < nextMatchId; i++) {
                matchPromises.push(contract.matches(i));
            }

            const results = await Promise.all(matchPromises);
            const matchesData: Match[] = results.map(match => ({
                id: Number(match[0]),
                creator: match[1],
                opponent: match[2],
                stake: formatEther(match[3]),
                status: statusMap[match[4]] as Match['status'],
                winner: match[5],
                lastUpdate: Number(match[6]),
                creatorGuess: Number(match[7]),
                opponentGuess: Number(match[8]),
                targetNumber: Number(match[9]),
            }));

            setMatches(matchesData.reverse()); // Show newest first
        } catch (err: any) {
            console.error('Error fetching matches:', err);
            setError(err.message);
        }
    }, [publicClient, getContract]);

    const fetchPendingWithdrawal = useCallback(async () => {
        if (!publicClient || !account) return;

        try {
            const contract = await getContract();
            const amount = await contract.pendingWithdrawals(account);
            setPendingWithdrawal(formatEther(amount));
        } catch (err: any) {
            console.error('Error fetching pending withdrawal:', err);
        }
    }, [publicClient, account, getContract]);

    const createMatch = async (stakeAmount: string, guess: number) => {
        if (!account || !walletClient) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.createMatch(guess, {
                value: parseEther(stakeAmount),
            });

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(parseError(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const joinMatch = async (matchId: number, stakeAmount: string, guess: number) => {
        if (!account || !walletClient) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.joinMatch(matchId, guess, {
                value: parseEther(stakeAmount),
            });

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(parseError(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const withdraw = async () => {
        if (!account || !walletClient) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.withdraw();

            await tx.wait();
            await fetchPendingWithdrawal();

            return tx.hash;
        } catch (err: any) {
            setError(parseError(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const cancelMatch = async (matchId: number) => {
        if (!account || !walletClient) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.cancelMatch(matchId);

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(parseError(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const emergencyClaim = async (matchId: number) => {
        if (!account || !walletClient) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.emergencyClaim(matchId);

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(parseError(err));
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch matches and withdrawal balance
    useEffect(() => {
        if (publicClient) {
            fetchMatches();
            if (account) {
                fetchPendingWithdrawal();
            }
        }
    }, [publicClient, account, fetchMatches, fetchPendingWithdrawal]);

    // Poll for updates every 10 seconds
    useEffect(() => {
        if (!publicClient) return;

        const interval = setInterval(() => {
            fetchMatches();
            if (account) {
                fetchPendingWithdrawal();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [publicClient, account, fetchMatches, fetchPendingWithdrawal]);

    return {
        account,
        publicClient,
        matches,
        pendingWithdrawal,
        isLoading,
        error,
        createMatch,
        joinMatch,
        withdraw,
        cancelMatch,
        emergencyClaim,
        refreshMatches: fetchMatches,
    };
};
