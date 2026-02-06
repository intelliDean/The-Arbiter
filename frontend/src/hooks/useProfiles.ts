import { useState, useCallback } from 'react';
import { Contract } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { PROFILES_CONTRACT_ADDRESS, PROFILES_ABI } from '../config';
import { clientToProvider, clientToSigner } from './useArena';
import { getDeterministicName } from '../utils/identity';

export const useProfiles = () => {
    const { address: account } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const [namesCache, setNamesCache] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const getContract = useCallback(async (needsSigner = false) => {
        if (!publicClient) throw new Error('Public client not available');
        const zeroAddr = '0x0000000000000000000000000000000000000000' as string;
        if (PROFILES_CONTRACT_ADDRESS === zeroAddr) {
            return null;
        }

        if (needsSigner) {
            if (!walletClient) throw new Error('Wallet not connected');
            const signer = clientToSigner(walletClient);
            return new Contract(PROFILES_CONTRACT_ADDRESS, PROFILES_ABI, signer);
        }

        const provider = clientToProvider(publicClient);
        return new Contract(PROFILES_CONTRACT_ADDRESS, PROFILES_ABI, provider);
    }, [publicClient, walletClient]);

    const resolveName = useCallback(async (address: string) => {
        if (!address || address === '0x0000000000000000000000000000000000000000') return 'Unknown';
        if (namesCache[address]) return namesCache[address];

        try {
            const contract = await getContract();
            if (!contract) return getDeterministicName(address);

            const name = await contract.getName(address);
            const finalName = name || getDeterministicName(address);

            setNamesCache(prev => ({ ...prev, [address]: finalName }));
            return finalName;
        } catch (err) {
            console.error('Error resolving name:', err);
            return getDeterministicName(address);
        }
    }, [getContract, namesCache]);

    const setName = async (newName: string) => {
        if (!account || !walletClient) throw new Error('Wallet not connected');

        try {
            setIsLoading(true);
            const contract = await getContract(true);
            if (!contract) throw new Error('Profiles contract not deployed');

            const tx = await contract.setName(newName);
            await tx.wait();

            setNamesCache(prev => ({ ...prev, [account]: newName }));
            return tx.hash;
        } catch (err) {
            console.error('Error setting name:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        resolveName,
        setName,
        isLoading,
        namesCache
    };
};
