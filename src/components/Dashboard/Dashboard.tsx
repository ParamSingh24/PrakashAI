import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDashboardData } from '../../hooks/useDashboardData';
import { OverviewCards } from './OverviewCards';
import { PowerConsumersChart } from './PowerConsumersChart';
import { AIInsights } from './AIInsights';
import { RecentActivity } from './RecentActivity';
import { AutonomousActions } from './AutonomousActions';
import { Icon } from '../UI/Icon';
import { logDashboardStatus } from '../../utils/testDashboard';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4 glow-effect"></div>
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl"></div>
      </div>
      <p className="font-body text-dark-textSecondary serif-optimized">Loading your dashboard...</p>
    </div>
  </div>
);

const ErrorMessage: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center glass p-8 rounded-2xl">
      <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4 glow-effect-danger">
        <Icon name="alert-triangle" size={32} className="text-danger" />
      </div>
      <h2 className="text-xl font-accent text-dark-text mb-2 serif-optimized">Something went wrong</h2>
      <p className="font-body text-dark-textSecondary mb-6 serif-optimized">{error}</p>
      <button
        onClick={onRetry}
        className="btn-glass-primary px-6 py-3 rounded-xl font-accent serif-optimized"
      >
        Try Again
      </button>
    </div>
  </div>
);

const BudgetAlert: React.FC<{ user: any }> = ({ user }) => {
  if (user.budgetUsedPercentage < 80) return null;

  const isOverBudget = user.projectedCost > user.monthlyBudget;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass p-4 rounded-xl mb-6 border-l-4 ${
        isOverBudget ? 'border-danger bg-danger/5' : 'border-warning bg-warning/5'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon 
          name={isOverBudget ? "alert-circle" : "alert-triangle"} 
          size={24} 
          className={isOverBudget ? "text-danger" : "text-warning"} 
        />
        <div>
          <h4 className="font-accent text-dark-text serif-optimized">
            {isOverBudget ? 'Budget Exceeded!' : 'Budget Warning'}
          </h4>
          <p className="font-body text-dark-textSecondary text-sm serif-optimized">
            {isOverBudget 
              ? `You're projected to exceed your budget by ₹${(user.projectedCost - user.monthlyBudget).toFixed(2)}`
              : `You've used ${user.budgetUsedPercentage.toFixed(0)}% of your monthly budget`
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  const { dashboardData, loading, error, refreshData, isUsingFallback } = useDashboardData();

  // Log dashboard status for debugging
  useEffect(() => {
    logDashboardStatus();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !dashboardData) {
    return <ErrorMessage error={error} onRetry={refreshData} />;
  }

  if (!dashboardData) {
    return <ErrorMessage error="No data available" onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen serif-optimized relative">
      {/* Subtle Background Effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating" style={{ animationDelay: '3s' }}></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Dashboard Header */}
        <motion.div 
          className="mb-8 serif-optimized"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-heading text-cyber-blue mb-2 tracking-tight serif-optimized">
                Welcome back !
              </h1>
              <p className="text-lg font-body text-dark-textSecondary leading-relaxed">
                Here's your energy overview for today
              </p>
            </div>
            
            <button
              onClick={refreshData}
              className={`glass p-3 rounded-xl interactive-glass group ${
                isUsingFallback ? 'border border-warning/30' : ''
              }`}
              title={isUsingFallback ? 'Refresh (Demo Mode)' : 'Refresh Data'}
            >
              <Icon 
                name="refresh-cw" 
                size={20} 
                className={`group-hover:rotate-180 transition-transform duration-500 ${
                  isUsingFallback ? 'text-warning' : 'text-primary'
                }`} 
              />
            </button>
          </div>
        </motion.div>

        {/* Backend Status Alert */}
        {isUsingFallback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-4 rounded-xl mb-6 border-l-4 border-warning bg-warning/5"
          >
            <div className="flex items-center space-x-3">
              <Icon name="server" size={24} className="text-warning" />
              <div>
                <h4 className="font-accent text-dark-text serif-optimized">Demo Mode</h4>
                <p className="font-body text-dark-textSecondary text-sm serif-optimized">
                  Backend server is not running. Showing demo data. Start the backend server for live data.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Budget Alert */}
        <BudgetAlert user={dashboardData.user} />
        
        {/* Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <OverviewCards data={dashboardData.overview} />
        </motion.div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Power Consumers Chart */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PowerConsumersChart data={dashboardData.powerConsumers} />
          </motion.div>
          
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <RecentActivity activities={dashboardData.recentActivity} />
          </motion.div>
        </div>
        
        {/* AI Insights */}
        {dashboardData.aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <AIInsights 
              insights={dashboardData.aiInsights.insights}
              suggestions={dashboardData.aiInsights.suggestions}
              proactiveSuggestions={dashboardData.aiInsights.proactiveSuggestions || []}
            />
          </motion.div>
        )}

        {/* Autonomous Actions */}
        {dashboardData.autonomousActions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <AutonomousActions actions={dashboardData.autonomousActions} />
          </motion.div>
        )}
      </div>
    </div>
  );
};