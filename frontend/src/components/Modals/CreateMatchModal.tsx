import React, { useState } from 'react';
import { ModalOverlay } from './ModalOverlay';

interface CreateMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (stake: string, guess: number) => void;
    isLoading: boolean;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    isLoading
}) => {
    const [stakeAmount, setStakeAmount] = useState('');
    const [guess, setGuess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        const finalStake = stakeAmount.trim() === '' ? '0.1' : stakeAmount;
        const finalGuess = guess.trim() === '' ? 50 : parseInt(guess);
        onCreate(finalStake, finalGuess);
    };

    return (
        <ModalOverlay onClose={onClose} title="Create New Match">
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
                    placeholder="50"
                />
                <small className="help-text">Closet to the Arbiter's secret number wins!</small>
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
                    {isLoading ? 'Creating...' : 'Create Match'}
                </button>
            </div>
        </ModalOverlay>
    );
};
