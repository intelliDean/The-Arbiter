import React from 'react';

interface WithdrawalBannerProps {
    pendingWithdrawal: string;
    onWithdraw: () => void;
    isLoading: boolean;
}

export const WithdrawalBanner: React.FC<WithdrawalBannerProps> = ({
    pendingWithdrawal,
    onWithdraw,
    isLoading
}) => {
    if (parseFloat(pendingWithdrawal) <= 0) return null;

    return (
        <div className="withdrawal-banner">
            <div>
                <strong>💰 Winnings Available:</strong> {parseFloat(pendingWithdrawal).toFixed(4)} MON
            </div>
            <button
                className="btn"
                onClick={onWithdraw}
                disabled={isLoading}
            >
                {isLoading ? 'Processing...' : 'Withdraw'}
            </button>
        </div>
    );
};
