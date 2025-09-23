import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { Icon } from '../UI/Icon';

interface AIInsightsProps {
  insights: string[];
  suggestions: string[];
  proactiveSuggestions: string[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ 
  insights, 
  suggestions, 
  proactiveSuggestions 
}) => {
  return (
    <Card className="h-full">
      <div className="mb-8">
        <h3 className="text-2xl font-heading text-dark-text mb-2 serif-optimized text-shadow">
          AI Insights & Recommendations
        </h3>
        <p className="font-body text-dark-textSecondary serif-optimized text-lg">
          Smart suggestions to optimize your energy consumption
        </p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current Insights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon name="lightbulb" size={20} className="text-primary" />
              <h4 className="font-accent text-dark-text serif-optimized">Current Insights</h4>
            </div>
            <div className="space-y-3">
              {insights.length > 0 ? insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-4 bg-primary/10 border border-primary/20 rounded-lg glass hover:bg-primary/15 transition-all duration-200"
                >
                  <p className="text-sm font-body text-dark-textSecondary serif-optimized">{insight}</p>
                </motion.div>
              )) : (
                <div className="p-4 bg-dark-surface/20 border border-dark-surface/30 rounded-lg glass text-center">
                  <p className="text-sm font-body text-dark-textSecondary serif-optimized">No current insights available</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Proactive Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon name="lightbulb" size={20} className="text-warning" />
              <h4 className="font-accent text-dark-text serif-optimized">AI Proactive Suggestions</h4>
            </div>
            <div className="space-y-3">
              {proactiveSuggestions.length > 0 ? proactiveSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-4 bg-warning/10 border border-warning/20 rounded-lg glass hover:bg-warning/15 transition-all duration-200"
                >
                  <p className="text-sm font-body text-dark-textSecondary serif-optimized">{suggestion}</p>
                </motion.div>
              )) : (
                <div className="p-4 bg-dark-surface/20 border border-dark-surface/30 rounded-lg glass text-center">
                  <p className="text-sm font-body text-dark-textSecondary serif-optimized">No proactive suggestions available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
  );
};
