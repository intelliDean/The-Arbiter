import React, { useState, useEffect } from 'react';
import './App.css';
import { useArena } from './hooks/useArena';
import { useProfiles } from './hooks/useProfiles';
import { monadTestnet } from './config';
import { parseError } from './utils/errorParser';
import { useNotifications } from './context/NotificationContext';

// Components
import { Header } from './components/Header';
import { NotificationList } from './components/NotificationList';
import { WithdrawalBanner } from './components/WithdrawalBanner';
import { DashboardControls } from './components/Dashboard/DashboardControls';
import { MatchGrid } from './components/Dashboard/MatchGrid';
import { CreateMatchModal } from './components/Modals/CreateMatchModal';
import { JoinMatchModal } from './components/Modals/JoinMatchModal';
import { ProfileModal } from './components/Modals/ProfileModal';

const App: React.FC = () => {
  const { resolveName, setName: setProfileNameOnChain, isLoading: isProfileLoading, namesCache } = useProfiles();
  const {
    account,
    matches,
    pendingWithdrawal,
    isLoading,
    error: arenaError,
    createMatch,
    joinMatch,
    withdraw,
    cancelMatch,
    emergencyClaim,
    showHistory,
    setShowHistory
  } = useArena();

  const { addNotification } = useNotifications();
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ id: number, stake: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Active' | 'Settled' | 'Cancelled'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 10000);
    return () => clearInterval(timer);
  }, []);

  // Resolve names for matches with periodic staggering to avoid RPC rate limits
  useEffect(() => {
    const resolveAll = async () => {
      const addresses = new Set<string>();
      matches.forEach(m => {
        addresses.add(m.creator);
        if (m.opponent !== '0x0000000000000000000000000000000000000000') addresses.add(m.opponent);
        if (m.winner !== '0x0000000000000000000000000000000000000000') addresses.add(m.winner);
      });

      const addressArray = Array.from(addresses).filter(addr => !namesCache[addr]);
      for (const addr of addressArray) {
        await resolveName(addr);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    if (matches.length > 0) resolveAll();
  }, [matches, resolveName, namesCache]);

  const EXPLORER_URL = monadTestnet.blockExplorers.default.url;

  const handleCreateMatch = async (stake: string, guess: number) => {
    try {
      const txHash = await createMatch(stake, guess, () => setShowCreateModal(false));
      addNotification('Match created successfully!', 'success');
      console.log('Match created:', txHash);
    } catch (err: any) {
      console.error('Failed to create match:', err);
      addNotification(parseError(err), 'error');
    }
  };

  const handleOpenJoinModal = (matchId: number, stake: string) => {
    setSelectedMatch({ id: matchId, stake });
    setShowJoinModal(true);
  };

  const handleJoinMatch = async (guess: number) => {
    if (!selectedMatch) return;
    try {
      const txHash = await joinMatch(selectedMatch.id, selectedMatch.stake, guess, () => {
        setShowJoinModal(false);
        setSelectedMatch(null);
      });
      addNotification('Joined match successfully!', 'success');
      console.log('Joined match:', txHash);
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
      await cancelMatch(matchId);
      addNotification('Match cancelled successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to cancel match:', err);
      addNotification(parseError(err), 'error');
    }
  };

  const handleEmergencyClaim = async (matchId: number) => {
    try {
      await emergencyClaim(matchId);
      addNotification('Emergency claim successful! Stakes refunded.', 'success');
    } catch (err: any) {
      console.error('Failed to claim emergency refund:', err);
      addNotification(parseError(err), 'error');
    }
  };

  return (
    <div className="app">
      <NotificationList />
      
      <Header 
        namesCache={namesCache}
        account={account}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <main className="container">
        <section className="hero">
          <h1>Competitive Gaming, <br /><span className="gradient-text">Autonomous Wagering</span></h1>
          <p className="subtitle">Enter the arena where AI agents manage matches and settle stakes instantly on Monad.</p>
        </section>

        {arenaError && <div className="error-banner">⚠️ {arenaError}</div>}

        <WithdrawalBanner 
          pendingWithdrawal={pendingWithdrawal}
          onWithdraw={handleWithdraw}
          isLoading={isLoading}
        />

        <DashboardControls 
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          onOpenCreate={() => setShowCreateModal(true)}
          account={account}
          isLoading={isLoading}
        />

        <MatchGrid 
          matches={matches}
          filterStatus={filterStatus}
          searchTerm={searchTerm}
          namesCache={namesCache}
          isLoading={isLoading}
          account={account}
          currentTime={currentTime}
          explorerUrl={EXPLORER_URL}
          onJoin={handleOpenJoinModal}
          onCancel={handleCancelMatch}
          onEmergencyClaim={handleEmergencyClaim}
        />

        <CreateMatchModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMatch}
          isLoading={isLoading}
        />

        {selectedMatch && (
          <JoinMatchModal 
            isOpen={showJoinModal}
            onClose={() => {
              setShowJoinModal(false);
              setSelectedMatch(null);
            }}
            onJoin={handleJoinMatch}
            isLoading={isLoading}
            matchId={selectedMatch.id}
            stake={selectedMatch.stake}
          />
        )}

        <ProfileModal 
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={async (name) => {
            try {
              await setProfileNameOnChain(name);
              addNotification('Profile updated!', 'success');
              setShowProfileModal(false);
            } catch (err: any) {
              addNotification(parseError(err), 'error');
            }
          }}
          isLoading={isProfileLoading}
          currentName={account ? namesCache[account] || '' : ''}
        />
      </main>
    </div>
  );
};

export default App;
