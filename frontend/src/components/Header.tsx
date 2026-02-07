import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface HeaderProps {
    namesCache: Record<string, string>;
    account: string | undefined;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    namesCache,
    account,
    searchTerm,
    setSearchTerm,
    onOpenProfile
}) => {
    return (
        <header className="glass-header">
            <div className="header-left">
                <div className="logo">
                    <img src="/logo.png" alt="THE ARBITER" className="logo-img" />
                    <span className="brand-name">THE ARBITER</span>
                </div>
                <div className="search-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by player name or address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="nav-actions">
                {account && (
                    <div className="user-profile-summary">
                        <span className="user-name-header">
                            {namesCache[account] || account.slice(0, 6) + '...' + account.slice(-4)}
                        </span>
                        <button className="btn btn-outline btn-round" onClick={onOpenProfile}>
                            👤
                        </button>
                    </div>
                )}
                <ConnectButton />
            </div>
        </header>
    );
};
