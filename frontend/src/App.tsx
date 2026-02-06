import React, { useState, useEffect } from 'react';
import './App.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useArena } from './hooks/useArena';
import { useProfiles } from './hooks/useProfiles';
import { monadTestnet } from './config';
import { parseError } from './utils/errorParser';
import { getDeterministicAvatar } from './utils/identity';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const { resolveName, setName: setProfileNameOnChain, isLoading: isProfileLoading, namesCache } = useProfiles();
  const {
    account,
    matches,
    pendingWithdrawal,
    isLoading,
    error: arenaError,
    withdraw,
    cancelMatch,
    emergencyClaim,
    showHistory,
    setShowHistory
  } = useArena();

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(timer);
  }, []);

  // Resolve names for matches with periodic staggering to avoid RPC rate limits
  useEffect(() => {
    const resolveAll = async () => {
      // Get all unique addresses that need resolving
      const addresses = new Set<string>();
      matches.forEach(m => {
        addresses.add(m.creator);
        if (m.opponent !== '0x0000000000000000000000000000000000000000') addresses.add(m.opponent);
        if (m.winner !== '0x0000000000000000000000000000000000000000') addresses.add(m.winner);
      });

      // Resolve in small batches to stay under 25/sec limit
      const addressArray = Array.from(addresses).filter(addr => !namesCache[addr]);
      for (let i = 0; i < addressArray.length; i += 5) {
        const batch = addressArray.slice(i, i + 5);
        await Promise.all(batch.map(addr => resolveName(addr)));
        // Tiny wait between batches if there are more
        if (i + 5 < addressArray.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    };

    if (matches.length > 0) {
      resolveAll();
    }
  }, [matches, resolveName, namesCache]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ id: number, stake: string } | null>(null);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [guess, setGuess] = useState('50');
  const [joinGuess, setJoinGuess] = useState('50');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Active' | 'Settled' | 'Cancelled'>('All');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const EXPLORER_URL = monadTestnet.blockExplorers.default.url;

  const handleCreateMatch = async () => {
    try {
      const txHash = await createMatch(stakeAmount, parseInt(guess));
      addNotification('Match created successfully!', 'success');
      console.log('Match created:', txHash);
      setShowCreateModal(false);
      setStakeAmount('0.1');
      setGuess('50');
    } catch (err: any) {
      console.error('Failed to create match:', err);
      addNotification(parseError(err), 'error');
    }
  };

  const handleOpenJoinModal = (matchId: number, stake: string) => {
    setSelectedMatch({ id: matchId, stake });
    setShowJoinModal(true);
  };

  const handleJoinMatch = async () => {
    if (!selectedMatch) return;

    const parsedGuess = parseInt(joinGuess);
    if (isNaN(parsedGuess) || parsedGuess < 1 || parsedGuess > 100) {
      alert("Invalid guess! Please enter a number between 1 and 100.");
      return;
    }

    try {
      const txHash = await joinMatch(selectedMatch.id, selectedMatch.stake, parsedGuess);
      addNotification('Joined match successfully!', 'success');
      console.log('Joined match:', txHash);
      setShowJoinModal(false);
      setSelectedMatch(null);
      setJoinGuess('50');
    } catch (err: any) {
      console.error('Failed to join match:', err);
      addNotification(parseError(err), 'error');
    }
  };
  const handleWithdraw = async () => {
    try {
      const txHash = await withdraw();
      addNotification('Withdrawal successful!', 'success');
      console.log('Withdrawal successful:', txHash);
    } catch (err: any) {
      console.error('Failed to withdraw:', err);
      addNotification(parseError(err), 'error');
    }
  };

  const handleCancelMatch = async (matchId: number) => {
    try {
      const txHash = await cancelMatch(matchId);
      addNotification('Match cancelled successfully!', 'success');
      console.log('Match cancelled:', txHash);
    } catch (err: any) {
      console.error('Failed to cancel match:', err);
      addNotification(parseError(err), 'error');
    }
  };

  const handleEmergencyClaim = async (matchId: number) => {
    try {
      const txHash = await emergencyClaim(matchId);
      addNotification('Emergency claim successful! Stakes refunded.', 'success');
      console.log('Emergency claim:', txHash);
    } catch (err: any) {
      console.error('Failed to claim emergency refund:', err);
      addNotification(parseError(err), 'error');
    }
  };

  return (
    <div className="app">
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification ${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>
      <header className="glass-header">
        <div className="header-left">
          <div className="logo">
            <img src="/logo.png" alt="THE ARBITER" className="logo-img" />
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
              <button className="btn btn-outline btn-round" onClick={() => setShowProfileModal(true)}>
                👤
              </button>
            </div>
          )}
          <ConnectButton />
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Competitive Gaming, <br /><span className="gradient-text">Autonomous Wagering</span></h1>
          <p className="subtitle">Enter the arena where AI agents manage matches and settle stakes instantly on Monad.</p>
        </section>

        {arenaError && (
          <div className="error-banner">
            ⚠️ {arenaError}
          </div>
        )}

        {account && parseFloat(pendingWithdrawal) > 0 && (
          <div className="withdrawal-banner">
            <div>
              <strong>💰 Winnings Available:</strong> {parseFloat(pendingWithdrawal).toFixed(4)} MON
            </div>
            <button
              className="btn"
              onClick={handleWithdraw}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        )}

        <section className="dashboard-controls">
          <div className="filter-scroll-wrapper">
            <div className="filter-tabs">
              {(showHistory ? ['All', 'Pending', 'Active', 'Settled', 'Cancelled'] : ['All', 'Pending', 'Active']).map((status) => (
                <button
                  key={status}
                  className={`tab-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status as any)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="history-toggle-wrapper">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showHistory}
                  onChange={(e) => {
                    setShowHistory(e.target.checked);
                    if (!e.target.checked && (filterStatus === 'Settled' || filterStatus === 'Cancelled')) {
                      setFilterStatus('All');
                    }
                  }}
                />
                <span className="toggle-text">Show Settled History</span>
              </label>
            </div>
          </div>
          <button
            className="btn"
            onClick={() => setShowCreateModal(true)}
            disabled={!account || isLoading}
          >
            Create New Match
          </button>
        </section>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Match</h2>
              <div className="form-group">
                <label>Stake Amount (MON)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.1"
                />
              </div>
              <div className="form-group">
                <label>Your Guess (1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                />
                <small className="help-text">Closet to the Arbiter's secret number wins!</small>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleCreateMatch}
                  disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                >
                  {isLoading ? 'Creating...' : 'Create Match'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoinModal && selectedMatch && (
          <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Join Arena #{String(selectedMatch.id).padStart(3, '0')}</h2>
              <div className="stake-summary">
                <span className="label">Required Stake:</span>
                <span className="value primary">{selectedMatch.stake} MON</span>
              </div>
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Your Guess (1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={joinGuess}
                  onChange={(e) => setJoinGuess(e.target.value)}
                  autoFocus
                />
                <small className="help-text">Your guess determines your fate. Choose wisely!</small>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleJoinMatch}
                  disabled={isLoading}
                >
                  {isLoading ? 'Joining...' : 'Confirm Join'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid">
          {matches.filter(m => {
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
          }).length === 0 && !isLoading && (
              <div className="empty-state">
                <p>No results found for your search/filter.</p>
              </div>
            )}

          {matches
            .filter(m => {
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
            })
            .map((match) => (
              <div key={match.id} className={`card ${(match.status === 'Settled' || match.status === 'Draw') ? 'winner-pulse' : ''}`}>
                <div className="card-header">
                  <span className={`badge badge-${match.status.toLowerCase()}`}>{match.status}</span>
                  <a
                    href={`${EXPLORER_URL}/address/${match.creator}`}
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
                          {(match.status === 'Active' || match.status === 'Settled' || match.status === 'Draw') && (
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
                            (match.status === 'Active' || match.status === 'Settled' || match.status === 'Draw') && (
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

                  {(match.status === 'Settled' || match.status === 'Draw') && (
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
                  {match.status === 'Pending' && account && match.creator.toLowerCase() !== account.toLowerCase() && (
                    <button
                      className="btn btn-outline full-width"
                      onClick={() => handleOpenJoinModal(match.id, match.stake)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Joining...' : 'Join Arena'}
                    </button>
                  )}
                  {match.status === 'Pending' && account && match.creator.toLowerCase() === account.toLowerCase() && (
                    <button
                      className="btn btn-outline full-width"
                      onClick={() => handleCancelMatch(match.id)}
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
                      {currentTime > match.lastUpdate + 86400 && (
                        <button
                          className="btn btn-danger btn-sm full-width"
                          style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={() => handleEmergencyClaim(match.id)}
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
            ))}
        </div>

        {showProfileModal && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Your Profile</h2>
              <div className="form-group">
                <label>Set your Unique Name</label>
                <input
                  type="text"
                  maxLength={20}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Neon Wolf..."
                />
                <small className="help-text">Choose a name that will be remembered in the arena.</small>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await setProfileNameOnChain(profileName);
                      addNotification('Profile updated!', 'success');
                      setShowProfileModal(false);
                    } catch (err: any) {
                      addNotification(parseError(err), 'error');
                    }
                  }}
                  disabled={isProfileLoading || profileName.length < 3}
                >
                  {isProfileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
