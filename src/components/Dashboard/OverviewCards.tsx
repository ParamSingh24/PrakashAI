import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { Icon } from '../UI/Icon';
import { OverviewCard as OverviewCardType } from '../../types/dashboard.types';

interface OverviewCardsProps {
  data: OverviewCardType[];
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ data }) => {
  if (!data) return null;

  return (
    <>
      {data.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
        >
          <Card className="h-full glass glow-on-hover card-3d">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center glow-effect"
                  style={{ 
                    backgroundColor: `${card.color}20`,
                    boxShadow: `0 0 20px ${card.color}30`
                  }}
                >
                  <Icon 
                    name={card.icon} 
                    size={24} 
                    color={card.color}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-accent text-dark-textSecondary serif-optimized">
                    {card.title}
                  </h3>
                  <p className="text-2xl font-display font-semibold text-dark-text serif-optimized text-shadow">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-body text-dark-textSecondary serif-optimized">
                {card.subtitle}
              </p>
              <div className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-full ${
                card.trend.isPositive 
                  ? 'text-secondary bg-secondary/20' 
                  : 'text-danger bg-danger/20'
              }`}>
                <Icon 
                  name={card.trend.isPositive ? 'trending-up' : 'trending-down'} 
                  size={16}
                />
                <span className="font-accent serif-optimized">
                  {card.trend.isPositive ? '+' : ''}{card.trend.value}%
                </span>
              </div>
            </div>
            
            <p className="text-xs font-body text-dark-textSecondary mt-2 serif-optimized opacity-70">
              {card.trend.label}
            </p>
          </Card>
        </motion.div>
      ))}
    </>
  );
};
