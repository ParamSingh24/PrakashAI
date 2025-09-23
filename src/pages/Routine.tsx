import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../components/UI/Icon';

const Routine: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-card">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8">
            <Icon name="clock" size={64} className="text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-dark-text mb-4">
              Smart Routines
            </h1>
            <p className="text-lg text-dark-textSecondary">
              Automated schedules and energy optimization patterns
            </p>
          </div>
          
          <div className="bg-dark-card/50 backdrop-blur-sm border border-dark-surface/50 rounded-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-dark-text mb-4">
              Coming Soon
            </h2>
            <p className="text-dark-textSecondary mb-6">
              This page will allow you to:
            </p>
            <ul className="text-left space-y-2 text-dark-textSecondary">
              <li className="flex items-center space-x-2">
                <Icon name="check" size={16} className="text-secondary" />
                <span>Create automated device schedules</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="check" size={16} className="text-secondary" />
                <span>Set energy-saving routines</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="check" size={16} className="text-secondary" />
                <span>Configure smart home automation</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="check" size={16} className="text-secondary" />
                <span>Monitor routine performance</span>
              </li>
              <li className="flex items-center space-x-2">
                <Icon name="check" size={16} className="text-secondary" />
                <span>AI-powered optimization suggestions</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Routine;
