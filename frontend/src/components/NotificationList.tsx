import React from 'react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationList: React.FC = () => {
    const { notifications } = useNotifications();

    return (
        <div className="notification-container">
            {notifications.map(n => (
                <div key={n.id} className={`notification ${n.type}`}>
                    {n.message}
                </div>
            ))}
        </div>
    );
};
