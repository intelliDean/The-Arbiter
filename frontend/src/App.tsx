import React, { useState } from 'react';
import './App.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useArena } from './hooks/useArena';
import { monadTestnet } from './config';
import { parseError } from './utils/errorParser';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const {
    account,
    matches,
    pendingWithdrawal,
    isLoading,
    error: arenaError,
    createMatch,
    joinMatch,
    withdraw,
    cancelMatch
  } = useArena();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ id: number, stake: string } | null>(null);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [guess, setGuess] = useState('50');
  const [joinGuess, setJoinGuess] = useState('50');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Active' | 'Settled'>('All');
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
        <div className="logo">
          <img src="/logo.png" alt="THE ARBITER" className="logo-img" />
        </div>
        <div className="nav-actions">
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
          <div className="filter-tabs">
            {['All', 'Pending', 'Active', 'Settled'].map((status) => (
              <button
                key={status}
                className={`tab-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status as any)}
              >
                {status}
              </button>
            ))}
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
          {matches.filter(m => filterStatus === 'All' || m.status === filterStatus).length === 0 && !isLoading && (
            <div className="empty-state">
              <p>No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} matches yet.</p>
            </div>
          )}

          {matches
            .filter(m => filterStatus === 'All' || m.status === filterStatus)
            .map((match) => (
              <div key={match.id} className="card">
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
                  <div className="players">
                    <div className="player">
                      <span className="label">Creator:</span>
                      <span className="value">
                        {match.creator.slice(0, 6)}...{match.creator.slice(-4)}
                        {match.status === 'Settled' && (
                          <span className="guess-tag">({match.creatorGuess})</span>
                        )}
                      </span>
                    </div>
                    <div className="player">
                      <span className="label">Opponent:</span>
                      <span className="value">
                        {match.opponent === '0x0000000000000000000000000000000000000000'
                          ? 'Waiting...'
                          : `${match.opponent.slice(0, 6)}...${match.opponent.slice(-4)}`
                        }
                        {match.opponent !== '0x0000000000000000000000000000000000000000' && match.status === 'Settled' && (
                          <span className="guess-tag">({match.opponentGuess})</span>
                        )}
                      </span>
                    </div>
                    {match.status === 'Settled' && (
                      <>
                        <div className="player">
                          <span className="label">Arbiter Secret:</span>
                          <span className="value arbiter-number">
                            🎯 {match.targetNumber}
                          </span>
                        </div>
                        <div className="player">
                          <span className="label">Winner:</span>
                          <span className="value winner">
                            🏆 {match.winner.slice(0, 6)}...{match.winner.slice(-4)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
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
                    <button className="btn btn-outline full-width disabled">
                      Match In Progress
                    </button>
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
      </main>
    </div>
  );
};

export default App;
