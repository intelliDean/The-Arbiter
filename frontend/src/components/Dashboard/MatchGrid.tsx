import React, { useMemo } from 'react';
import { type Match } from '../../hooks/useArena';
import { MatchCard } from './MatchCard';

interface MatchGridProps {
    matches: Match[];
    filterStatus: string;
    searchTerm: string;
    namesCache: Record<string, string>;
    isLoading: boolean;
    account: string | undefined;
    currentTime: number;
    explorerUrl: string;
    onJoin: (matchId: number, stake: string) => void;
    onCancel: (matchId: number) => void;
    onEmergencyClaim: (matchId: number) => void;
}

export const MatchGrid: React.FC<MatchGridProps> = ({
    matches,
    filterStatus,
    searchTerm,
    namesCache,
    isLoading,
    account,
    currentTime,
    explorerUrl,
    onJoin,
    onCancel,
    onEmergencyClaim
}) => {
    const filteredMatches = useMemo(() => {
        return matches.filter(m => {
            const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
            const searchLower = searchTerm.toLowerCase();
            const creatorName = namesCache[m.creator] || '';
            const opponentName = namesCache[m.opponent] || '';

            const matchesSearch = !searchTerm ||
                m.creator.toLowerCase().includes(searchLower) ||
                m.opponent.toLowerCase().includes(searchLower) ||
                creatorName.toLowerCase().includes(searchLower) ||
                opponentName.toLowerCase().includes(searchLower);

            return matchesStatus && matchesSearch;
        });
    }, [matches, filterStatus, searchTerm, namesCache]);

    if (filteredMatches.length === 0 && !isLoading) {
        return (
            <div className="empty-state">
                <p>No results found for your search/filter.</p>
            </div>
        );
    }

    return (
        <div className="grid">
            {filteredMatches.map((match) => (
                <MatchCard
                    key={match.id}
                    match={match}
                    account={account}
                    namesCache={namesCache}
                    currentTime={currentTime}
                    explorerUrl={explorerUrl}
                    isLoading={isLoading}
                    onJoin={onJoin}
                    onCancel={onCancel}
                    onEmergencyClaim={onEmergencyClaim}
                />
            ))}
        </div>
    );
};
