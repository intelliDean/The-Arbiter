import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { MONAD_TESTNET } from '../config';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export const useWallet = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('Please install MetaMask to use this dApp');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            // Check if we're on Monad testnet
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            if (chainId !== MONAD_TESTNET.chainId) {
                // Try to switch to Monad testnet
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: MONAD_TESTNET.chainId }],
                    });
                } catch (switchError: any) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [MONAD_TESTNET],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            const ethersProvider = new BrowserProvider(window.ethereum);
            setProvider(ethersProvider);
            setAccount(accounts[0]);
        } catch (err: any) {
            setError(err.message || 'Failed to connect wallet');
            console.error('Wallet connection error:', err);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
    };

    // Listen for account changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                setAccount(accounts[0]);
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, []);

    return {
        account,
        provider,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
    };
};
