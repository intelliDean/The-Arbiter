import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import { ARENA_CONTRACT_ADDRESS, ARENA_ABI, REFEREE_ADDRESS } from '../config';

export interface Match {
    id: number;
    creator: string;
    opponent: string;
    stake: string;
    referee: string;
    status: 'Pending' | 'Active' | 'Settled' | 'Cancelled';
    winner: string;
    lastUpdate: number;
}

export const useArena = (provider: BrowserProvider | null, account: string | null) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [pendingWithdrawal, setPendingWithdrawal] = useState<string>('0');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getContract = useCallback(async (needsSigner = false) => {
        if (!provider) throw new Error('Provider not available');

        if (needsSigner) {
            const signer = await provider.getSigner();
            return new Contract(ARENA_CONTRACT_ADDRESS, ARENA_ABI, signer);
        }

        return new Contract(ARENA_CONTRACT_ADDRESS, ARENA_ABI, provider);
    }, [provider]);

    const fetchMatches = useCallback(async () => {
        if (!provider) return;

        try {
            const contract = await getContract();
            const nextMatchId = await contract.nextMatchId();
            const matchesData: Match[] = [];

            for (let i = 0; i < Number(nextMatchId); i++) {
                const match = await contract.matches(i);
                const statusMap = ['Pending', 'Active', 'Settled', 'Cancelled'];

                matchesData.push({
                    id: Number(match[0]),
                    creator: match[1],
                    opponent: match[2],
                    stake: formatEther(match[3]),
                    referee: match[4],
                    status: statusMap[match[5]] as Match['status'],
                    winner: match[6],
                    lastUpdate: Number(match[7]),
                });
            }

            setMatches(matchesData.reverse()); // Show newest first
        } catch (err: any) {
            console.error('Error fetching matches:', err);
            setError(err.message);
        }
    }, [provider, getContract]);

    const fetchPendingWithdrawal = useCallback(async () => {
        if (!provider || !account) return;

        try {
            const contract = await getContract();
            const amount = await contract.pendingWithdrawals(account);
            setPendingWithdrawal(formatEther(amount));
        } catch (err: any) {
            console.error('Error fetching pending withdrawal:', err);
        }
    }, [provider, account, getContract]);

    const createMatch = async (stakeAmount: string) => {
        if (!provider || !account) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.createMatch(REFEREE_ADDRESS, {
                value: parseEther(stakeAmount),
            });

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(err.message || 'Failed to create match');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const joinMatch = async (matchId: number, stakeAmount: string) => {
        if (!provider || !account) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.joinMatch(matchId, {
                value: parseEther(stakeAmount),
            });

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(err.message || 'Failed to join match');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const withdraw = async () => {
        if (!provider || !account) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.withdraw();

            await tx.wait();
            await fetchPendingWithdrawal();

            return tx.hash;
        } catch (err: any) {
            setError(err.message || 'Failed to withdraw');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const cancelMatch = async (matchId: number) => {
        if (!provider || !account) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            setError(null);

            const contract = await getContract(true);
            const tx = await contract.cancelMatch(matchId);

            await tx.wait();
            await fetchMatches();

            return tx.hash;
        } catch (err: any) {
            setError(err.message || 'Failed to cancel match');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-fetch matches and withdrawal balance
    useEffect(() => {
        if (provider) {
            fetchMatches();
            if (account) {
                fetchPendingWithdrawal();
            }
        }
    }, [provider, account, fetchMatches, fetchPendingWithdrawal]);

    // Poll for updates every 10 seconds
    useEffect(() => {
        if (!provider) return;

        const interval = setInterval(() => {
            fetchMatches();
            if (account) {
                fetchPendingWithdrawal();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [provider, account, fetchMatches, fetchPendingWithdrawal]);

    return {
        matches,
        pendingWithdrawal,
        isLoading,
        error,
        createMatch,
        joinMatch,
        withdraw,
        cancelMatch,
        refreshMatches: fetchMatches,
    };
};
