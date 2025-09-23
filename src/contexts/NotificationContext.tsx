import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Notification, { NotificationProps } from '../components/UI/Notification';

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationProps, 'id' | 'onClose'>) => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const showNotification = useCallback((notification: Omit<NotificationProps, 'id' | 'onClose'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: NotificationProps = {
      ...notification,
      id,
      onClose: clearNotification
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.map((notification) => (
            <Notification key={notification.id} {...notification} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};
