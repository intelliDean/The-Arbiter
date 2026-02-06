export const parseError = (err: any): string => {
    if (!err) return 'An unknown error occurred';

    const errorString = typeof err === 'string' ? err : JSON.stringify(err);

    // User rejected transaction
    if (
        errorString.includes('ACTION_REJECTED') ||
        errorString.includes('user rejected action') ||
        errorString.includes('User denied transaction signature') ||
        err.code === 4001 ||
        err.code === 'ACTION_REJECTED'
    ) {
        return 'Transaction rejected by user.';
    }

    // Insufficient funds
    if (
        errorString.includes('INSUFFICIENT_FUNDS') ||
        errorString.includes('insufficient funds')
    ) {
        return 'Insufficient funds for transaction.';
    }

    // Execution Reverted (Smart Contract Error)
    if (errorString.includes('execution reverted')) {
        // Try to extract the reason if available
        const revertMatch = errorString.match(/reverted with reason string ["'](.+)["']/);
        if (revertMatch && revertMatch[1]) {
            return `Contract error: ${revertMatch[1]}`;
        }
        return 'Transaction reverted by the smart contract.';
    }

    // Network or Provider issues
    if (errorString.includes('network-error') || errorString.includes('could not coalesce error')) {
        return 'Network error. Please check your connection or RPC endpoint.';
    }

    // Fallback to message or reason if available, otherwise generic
    return err.reason || err.message || 'An unexpected error occurred during the transaction.';
};
