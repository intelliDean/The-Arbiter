import React from 'react';
import { type Match } from '../../hooks/useArena';
import { getDeterministicAvatar } from '../../utils/identity';

interface MatchCardProps {
    match: Match;
    account: string | undefined;
    namesCache: Record<string, string>;
    currentTime: number;
    explorerUrl: string;
    isLoading: boolean;
    onJoin: (matchId: number, stake: string) => void;
    onCancel: (matchId: number) => void;
    onEmergencyClaim: (matchId: number) => void;
}

export const MatchCard: React.FC<MatchCardProps> = React.memo(({
    match,
    account,
    namesCache,
    currentTime,
    explorerUrl,
    isLoading,
    onJoin,
    onCancel,
    onEmergencyClaim
}) => {
    const isCreator = account && match.creator.toLowerCase() === account.toLowerCase();
    const hasFinished = match.status === 'Settled' || match.status === 'Draw';

    return (
        <div className={`card ${hasFinished ? 'winner-pulse' : ''}`}>
            <div className="card-header">
                <span className={`badge badge-${match.status.toLowerCase()}`}>{match.status}</span>
                <a
                    href={`${explorerUrl}/address/${match.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="match-id"
                >
                    #{String(match.id).padStart(3, '0')}
                </a>
            </div>
            <div className="card-body">
                <div className="stake-info">
                    <span className="label">Stake:</span>
                    <span className="value">{parseFloat(match.stake).toFixed(4)} MON</span>
                </div>
                <div className="players-container">
                    <div className="player-side">
                        <div className="player-avatar" style={{ backgroundColor: getDeterministicAvatar(match.creator) }}></div>
                        <div className="player-info">
                            <span className="label">Creator</span>
                            <div className="player-name-container creator-side">
                                <span className="player-name">
                                    {namesCache[match.creator] || match.creator.slice(0, 6) + '...' + match.creator.slice(-4)}
                                </span>
                                {(match.status === 'Active' || hasFinished) && (
                                    <span className="guess-tag">({match.creatorGuess})</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="versus-badge-container">
                        <div className="versus-line"></div>
                        <div className="vs-badge">VS</div>
                        <div className="versus-line"></div>
                    </div>

                    <div className="player-side text-right">
                        <div className="player-info">
                            <span className="label">Opponent</span>
                            <div className="player-name-container opponent-side">
                                <span className="player-name">
                                    {match.opponent === '0x0000000000000000000000000000000000000000'
                                        ? (match.status === 'Cancelled' ? 'Cancelled' : 'Waiting...')
                                        : (namesCache[match.opponent] || match.opponent.slice(0, 6) + '...' + match.opponent.slice(-4))
                                    }
                                </span>
                                {match.opponent !== '0x0000000000000000000000000000000000000000' &&
                                    (match.status === 'Active' || hasFinished) && (
                                        <span className="guess-tag">({match.opponentGuess})</span>
                                    )}
                            </div>
                        </div>
                        <div className="player-avatar" style={{ backgroundColor: getDeterministicAvatar(match.opponent) }}></div>
                    </div>
                </div>

                {match.status === 'Active' && (
                    <div className="ongoing-animation full-width justify-center">
                        <span className="pulse-dot"></span>
                        Arbiter is resolving fate...
                    </div>
                )}

                {hasFinished && (
                    <div className="settlement-results">
                        <div className="result-item">
                            <span className="label">Arbiter Secret</span>
                            <span className="value arbiter-number">🎯 {match.targetNumber}</span>
                        </div>
                        <div className="result-item">
                            {match.status === 'Draw' ? (
                                <span className="value winner draw-text">🤝 It's a DRAW! (Split Pool)</span>
                            ) : (
                                <>
                                    <span className="label">Winner</span>
                                    <span className="value winner">
                                        🏆 {namesCache[match.winner] || (match.winner.slice(0, 6) + '...' + match.winner.slice(-4))}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="card-footer">
                {match.status === 'Pending' && account && !isCreator && (
                    <button
                        className="btn btn-outline full-width"
                        onClick={() => onJoin(match.id, match.stake)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Joining...' : 'Join Arena'}
                    </button>
                )}
                {match.status === 'Pending' && isCreator && (
                    <button
                        className="btn btn-outline full-width"
                        onClick={() => onCancel(match.id)}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cancelling...' : 'Cancel Match'}
                    </button>
                )}
                {match.status === 'Active' && (
                    <>
                        <button className="btn btn-outline full-width disabled">
                            Match In Progress
                        </button>
                        {currentTime > match.lastUpdate + 86400 + 60 && (
                            <button
                                className="btn btn-danger btn-sm full-width"
                                style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                onClick={() => onEmergencyClaim(match.id)}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Claiming...' : '⚠️ Claim Refund (Stuck)'}
                            </button>
                        )}
                    </>
                )}
                {match.status === 'Settled' && (
                    <button className="btn btn-outline full-width disabled">
                        Settled
                    </button>
                )}
                {match.status === 'Cancelled' && (
                    <button className="btn btn-outline full-width disabled">
                        Cancelled
                    </button>
                )}
            </div>
        </div>
    );
});
