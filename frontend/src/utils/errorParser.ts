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

    // Custom Contract Errors (Ethers 6 / Viem)
    if (errorString.includes('TIMEOUT_NOT_REACHED') || err.errorName === 'TIMEOUT_NOT_REACHED') {
        return 'The 24-hour timeout has not been reached yet. Please wait a few more minutes.';
    }
    if (errorString.includes('MATCH_NOT_ACTIVE') || err.errorName === 'MATCH_NOT_ACTIVE') {
        return 'This match is not in an active state and cannot be claimed.';
    }
    if (errorString.includes('INVALID_GUESS') || err.errorName === 'INVALID_GUESS') {
        return 'Invalid guess. Must be between 1 and 100.';
    }
    if (errorString.includes('NAME_ALREADY_TAKEN') || err.errorName === 'NAME_ALREADY_TAKEN') {
        return 'This username is already taken. Please try another.';
    }
    if (errorString.includes('NAME_TOO_LONG') || err.errorName === 'NAME_TOO_LONG') {
        return 'Username is too long (max 32 characters).';
    }

    // Execution Reverted (Smart Contract Error)
    if (errorString.includes('execution reverted') || errorString.includes('CALL_EXCEPTION')) {
        // Try to extract the reason if available
        const revertMatch = errorString.match(/reverted with reason string ["'](.+)["']/);
        if (revertMatch && revertMatch[1]) {
            return `Contract error: ${revertMatch[1]}`;
        }

        // Check for common error codes or properties in Ethers 6
        if (err.reason) return `Contract error: ${err.reason}`;

        return 'Transaction failed or was rejected by the smart contract.';
    }

    // Network or Provider issues
    if (errorString.includes('network-error') ||
        errorString.includes('could not coalesce error') ||
        errorString.includes('request limit reached') ||
        errorString.includes('missing revert data')) {
        return 'Network/RPC error. The request limit may have been reached or the node is lagging. Please try again in a few seconds.';
    }

    // Fallback to message or reason if available, otherwise generic
    return err.reason || err.message || 'An unexpected error occurred during the transaction.';
};
