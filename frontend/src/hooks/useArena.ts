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

// Helper to convert viem client to ethers provider/signer
export function clientToProvider(publicClient: any) {
    const { chain, transport } = publicClient;
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    };

    // If it's an HTTP transport, use JsonRpcProvider
    if (transport.type === 'http') {
        return new JsonRpcProvider(transport.url, network);
    }

    // If it's a fallback transport, use the first successful URL
    if (transport.type === 'fallback') {
        const url = transport.transports?.[0]?.value?.url || transport.url;
        if (url) return new JsonRpcProvider(url, network);
    }

    // Fallback to BrowserProvider for EIP-1193 or if we can't find a URL
    return new BrowserProvider(transport, network);
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
            const nextMatchId = await contract.nextMatchId();
            const matchesData: Match[] = [];

            for (let i = 0; i < Number(nextMatchId); i++) {
                const match = await contract.matches(i);
                const statusMap = ['Pending', 'Active', 'Settled', 'Cancelled', 'Draw'];

                matchesData.push({
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
                });
            }

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
