import React from 'react';
import { motion } from 'framer-motion';
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
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                PAI
              </span>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-dark-text flex items-center gap-2">
                🏠 Welcome back, {user.name}
              </h1>
              <p className="text-lg text-dark-textSecondary flex items-center gap-2 mt-1">
                🧠 <span>PrakashAI Dashboard</span> •
                📊 <span>Smart Home Control</span> •
                ⚡ <span>Energy Management</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-dark-textSecondary flex items-center gap-1">
                📅 {formatDate(currentTime)}
              </div>
              <div className="text-xl font-bold text-primary flex items-center gap-1 mt-1">
                🕐 {formatTime(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
