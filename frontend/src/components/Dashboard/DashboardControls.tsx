import React from 'react';

interface DashboardControlsProps {
    showHistory: boolean;
    setShowHistory: (value: boolean) => void;
    filterStatus: string;
    setFilterStatus: (value: any) => void;
    onOpenCreate: () => void;
    account: string | undefined;
    isLoading: boolean;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
    showHistory,
    setShowHistory,
    filterStatus,
    setFilterStatus,
    onOpenCreate,
    account,
    isLoading
}) => {
    const tabs = showHistory
        ? ['All', 'Pending', 'Active', 'Settled', 'Cancelled']
        : ['All', 'Pending', 'Active'];

    return (
        <section className="dashboard-controls">
            <div className="filter-scroll-wrapper">
                <div className="filter-tabs">
                    {tabs.map((status) => (
                        <button
                            key={status}
                            className={`tab-btn ${filterStatus === status ? 'active' : ''}`}
                            onClick={() => setFilterStatus(status)}
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
                onClick={onOpenCreate}
                disabled={!account || isLoading}
            >
                Create New Match
            </button>
        </section>
    );
};
