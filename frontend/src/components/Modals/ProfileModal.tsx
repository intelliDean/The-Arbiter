import React, { useState, useEffect } from 'react';
import { ModalOverlay } from './ModalOverlay';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
    isLoading: boolean;
    currentName: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    onSave,
    isLoading,
    currentName
}) => {
    const [profileName, setProfileName] = useState(currentName);

    useEffect(() => {
        if (isOpen) setProfileName(currentName);
    }, [isOpen, currentName]);

    if (!isOpen) return null;

    return (
        <ModalOverlay onClose={onClose} title="Your Profile">
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
                <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                <button
                    className="btn"
                    onClick={() => onSave(profileName)}
                    disabled={isLoading || profileName.length < 3}
                >
                    {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </ModalOverlay>
    );
};
