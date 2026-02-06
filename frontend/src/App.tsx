import React, { useState } from 'react';
import './App.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useArena } from './hooks/useArena';
import { monadTestnet } from './config';

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
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [guess, setGuess] = useState('50');

  const EXPLORER_URL = monadTestnet.blockExplorers.default.url;

  const handleCreateMatch = async () => {
    try {
      const txHash = await createMatch(stakeAmount, parseInt(guess));
      console.log('Match created:', txHash);
      setShowCreateModal(false);
      setStakeAmount('0.1');
      setGuess('50');
    } catch (err) {
      console.error('Failed to create match:', err);
    }
  };

  const handleJoinMatch = async (matchId: number, stake: string) => {
    const userGuess = prompt("Enter your guess (1-100) to join this arena:", "50");
    if (!userGuess) return;

    const parsedGuess = parseInt(userGuess);
    if (isNaN(parsedGuess) || parsedGuess < 1 || parsedGuess > 100) {
      alert("Invalid guess! Please enter a number between 1 and 100.");
      return;
    }

    try {
      const txHash = await joinMatch(matchId, stake, parsedGuess);
      console.log('Joined match:', txHash);
    } catch (err) {
      console.error('Failed to join match:', err);
    }
  };

  const handleWithdraw = async () => {
    try {
      const txHash = await withdraw();
      console.log('Withdrawal successful:', txHash);
    } catch (err) {
      console.error('Failed to withdraw:', err);
    }
  };

  const handleCancelMatch = async (matchId: number) => {
    try {
      const txHash = await cancelMatch(matchId);
      console.log('Match cancelled:', txHash);
    } catch (err) {
      console.error('Failed to cancel match:', err);
    }
  };

  return (
    <div className="app">
      <header className="glass-header">
        <div className="logo">THE ARBITER</div>
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

        <div className="grid">
          {matches.length === 0 && !isLoading && (
            <div className="empty-state">
              <p>No matches yet. Create the first one!</p>
            </div>
          )}

          {matches.map((match) => (
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
                      <span className="guess-tag">({match.creatorGuess})</span>
                    </span>
                  </div>
                  <div className="player">
                    <span className="label">Opponent:</span>
                    <span className="value">
                      {match.opponent === '0x0000000000000000000000000000000000000000'
                        ? 'Waiting...'
                        : `${match.opponent.slice(0, 6)}...${match.opponent.slice(-4)}`
                      }
                      {match.opponent !== '0x0000000000000000000000000000000000000000' && (
                        <span className="guess-tag">({match.opponentGuess})</span>
                      )}
                    </span>
                  </div>
                  {match.status === 'Settled' && (
                    <div className="player">
                      <span className="label">Winner:</span>
                      <span className="value winner">
                        🏆 {match.winner.slice(0, 6)}...{match.winner.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer">
                {match.status === 'Pending' && account && match.creator.toLowerCase() !== account.toLowerCase() && (
                  <button
                    className="btn btn-outline full-width"
                    onClick={() => handleJoinMatch(match.id, match.stake)}
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
