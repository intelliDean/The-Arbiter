import React, { type ReactNode } from 'react';

interface ModalOverlayProps {
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
    onClose,
    children,
    title
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {title && <h2>{title}</h2>}
                {children}
            </div>
        </div>
    );
};
