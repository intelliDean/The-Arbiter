import React, { useState, useEffect } from 'react';
import './App.css';

interface Match {
  id: number;
  creator: string;
  opponent: string;
  stake: string;
  referee: string;
  status: string;
}

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [account, setAccount] = useState<string | null>(null);

  // Mock data for initial UI build
  useEffect(() => {
    setMatches([
      { id: 1, creator: '0x1de...3a2', opponent: '0x4b1...9c8', stake: '1.0 MON', referee: 'Agent (Referee)', status: 'Active' },
      { id: 2, creator: '0x7e2...5f1', opponent: '', stake: '0.5 MON', referee: 'Agent (Referee)', status: 'Pending' },
      { id: 3, creator: '0x3c9...1d4', opponent: '0x2a1...0b2', stake: '2.5 MON', referee: 'Agent (Referee)', status: 'Settled' },
    ]);
  }, []);

  const connectWallet = () => {
    // Basic mock connection
    setAccount('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  };

  return (
    <div className="app">
      <header className="glass-header">
        <div className="logo">THE ARBITER</div>
        <div className="nav-actions">
          {account ? (
            <div className="wallet-info">
              <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          ) : (
            <button className="btn" onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <h1>Competitive Gaming, <span className="gradient-text">Autonomous Wagering</span></h1>
          <p className="subtitle">Enter the arena where AI agents manage matches and settle stakes instantly on Monad.</p>
        </section>

        <section className="dashboard-controls">
          <button className="btn">Create New Match</button>
        </section>

        <div className="grid">
          {matches.map((match) => (
            <div key={match.id} className="card">
              <div className="card-header">
                <span className={`badge badge-${match.status.toLowerCase()}`}>{match.status}</span>
                <span className="match-id">#00{match.id}</span>
              </div>
              <div className="card-body">
                <div className="stake-info">
                  <span className="label">Stake:</span>
                  <span className="value">{match.stake}</span>
                </div>
                <div className="players">
                  <div className="player">
                    <span className="label">Creator:</span>
                    <span className="value">{match.creator}</span>
                  </div>
                  <div className="player">
                    <span className="label">Opponent:</span>
                    <span className="value">{match.opponent || 'Waiting...'}</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                {match.status === 'Pending' && <button className="btn btn-outline full-width">Join Arena</button>}
                {match.status === 'Active' && <button className="btn btn-outline full-width disabled">Match In Progress</button>}
                {match.status === 'Settled' && <button className="btn btn-outline full-width disabled">Settled</button>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
