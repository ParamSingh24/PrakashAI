import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../UI/Icon';
import { User } from '../../types/dashboard.types';

interface DashboardHeaderProps {
  user: User;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl lg:text-4xl font-bold text-dark-text mb-2">
            Welcome {user.name}
          </h1>
          <p className="text-lg text-dark-textSecondary">
            Your Ecosync Nexus Dashboard
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-dark-textSecondary">
              {formatDate(currentTime)}
            </div>
            <div className="text-lg font-semibold text-primary">
              {formatTime(currentTime)}
            </div>
          </div>

          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
            <Icon
              name="user"
              size={24}
              className="text-white"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
