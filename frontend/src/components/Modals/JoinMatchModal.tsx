import React, { useState } from 'react';
import { ModalOverlay } from './ModalOverlay';

interface JoinMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoin: (guess: number) => void;
    isLoading: boolean;
    matchId: number;
    stake: string;
}

export const JoinMatchModal: React.FC<JoinMatchModalProps> = ({
    isOpen,
    onClose,
    onJoin,
    isLoading,
    matchId,
    stake
}) => {
    const [joinGuess, setJoinGuess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const finalGuess = joinGuess.trim() === '' ? 50 : parseInt(joinGuess);
        onJoin(finalGuess);
    };

    return (
        <ModalOverlay onClose={onClose} title={`Join Arena #${String(matchId).padStart(3, '0')}`}>
            <div className="stake-summary">
                <span className="label">Required Stake:</span>
                <span className="value primary">{stake} MON</span>
            </div>
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Your Guess (1-100)</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={joinGuess}
                    onChange={(e) => setJoinGuess(e.target.value)}
                    placeholder="50"
                    autoFocus
                />
                <small className="help-text">Your guess determines your fate. Choose wisely!</small>
            </div>
            <div className="modal-actions">
                <button
                    className="btn btn-outline"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    className="btn"
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? 'Joining...' : 'Confirm Join'}
                </button>
            </div>
        </ModalOverlay>
    );
};
