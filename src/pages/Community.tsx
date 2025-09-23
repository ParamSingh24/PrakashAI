import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../components/UI/Icon';

interface EnergyNeed {
  id: string;
  organization: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  impact: string;
  distance: string;
  tokens: number;
  energyNeeded: number;
}

interface TradingHistoryItem {
  id: string;
  type: 'donated' | 'sold';
  amount: number;
  recipient: string;
  time: string;
  impact: string;
  tokens: number;
}

interface CommunityLeader {
  id: string;
  name: string;
  rank: number;
  energyDonated: number;
  isCurrentUser: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'history' | 'leaders' | 'impact'>('marketplace');

  const energyStats = [
    { label: 'Generated Today', value: '12.5 kWh', icon: 'sun' },
    { label: 'Used by You', value: '8.2 kWh', icon: 'home' },
    { label: 'Available to Share', value: '4.3 kWh', icon: 'battery' },
    { label: 'Tokens Earned', value: '89', icon: 'coins' }
  ];

  const energyNeeds: EnergyNeed[] = [
    {
      id: '1',
      organization: 'Local Primary School',
      priority: 'HIGH',
      description: 'Power computer lab for 3 hours',
      impact: 'Help 45 children learn computer skills',
      distance: '0.8 km away',
      tokens: 25,
      energyNeeded: 15
    },
    {
      id: '2',
      organization: 'Community Center',
      priority: 'MEDIUM',
      description: 'Evening senior activities',
      impact: 'Support elderly community programs',
      distance: '1.2 km away',
      tokens: 15,
      energyNeeded: 8
    },
    {
      id: '3',
      organization: 'Neighbor Rajesh',
      priority: 'HIGH',
      description: 'Medical equipment backup',
      impact: 'Ensure continuous medical support',
      distance: '0.3 km away',
      tokens: 12,
      energyNeeded: 5
    },
    {
      id: '4',
      organization: 'Local Clinic',
      priority: 'CRITICAL',
      description: 'Refrigerate medicines',
      impact: 'Keep essential medicines safe',
      distance: '1.5 km away',
      tokens: 35,
      energyNeeded: 20
    }
  ];

  const tradingHistory: TradingHistoryItem[] = [
    {
      id: '1',
      type: 'donated',
      amount: 3,
      recipient: 'Community Center',
      time: 'Today, 2:30 PM',
      impact: 'Powered 2 classrooms for 3 hours',
      tokens: 8
    },
    {
      id: '2',
      type: 'sold',
      amount: 5,
      recipient: 'Grid Network',
      time: 'Yesterday, 4:15 PM',
      impact: 'Reduced grid load during peak hours',
      tokens: 15
    },
    {
      id: '3',
      type: 'donated',
      amount: 4,
      recipient: 'Local School',
      time: '2 days ago',
      impact: 'Helped students complete computer projects',
      tokens: 10
    }
  ];

  const communityLeaders: CommunityLeader[] = [
    { id: '1', name: 'Maria F. (You)', rank: 1, energyDonated: 147, isCurrentUser: true },
    { id: '2', name: 'Ravi K.', rank: 2, energyDonated: 134, isCurrentUser: false },
    { id: '3', name: 'Sunita M.', rank: 3, energyDonated: 128, isCurrentUser: false },
    { id: '4', name: 'Amit S.', rank: 4, energyDonated: 115, isCurrentUser: false },
    { id: '5', name: 'Priya R.', rank: 5, energyDonated: 98, isCurrentUser: false }
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Community Hero',
      description: 'Donated 100+ kWh this month',
      icon: '🏆',
      unlocked: true
    },
    {
      id: '2',
      title: 'Green Warrior',
      description: 'Offset 200kg CO₂',
      icon: '🏆',
      unlocked: true
    },
    {
      id: '3',
      title: 'Neighbor Helper',
      description: 'Helped 10 different neighbors',
      icon: '🏆',
      unlocked: true
    },
    {
      id: '4',
      title: 'School Supporter',
      description: 'Powered education for 50+ hours',
      icon: '🔒',
      unlocked: false
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-red-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '⭐';
    }
  };

  const handleDonate = (need: EnergyNeed) => {
    console.log(`Donating ${need.energyNeeded} kWh to ${need.organization}`);
  };

  const handleSell = (need: EnergyNeed) => {
    console.log(`Selling ${need.energyNeeded} kWh to ${need.organization}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d2e] to-[#0f172a] relative overflow-hidden serif-optimized">
      {/* Subtle Background Effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating" style={{ animationDelay: '3s' }}></div>
      
      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-heading text-white mb-4 serif-optimized gradient-text">
              Community Energy Trading
            </h1>
            <p className="text-xl text-dark-textSecondary mb-6 font-body serif-optimized leading-relaxed">
              Share your surplus energy and help build a sustainable community
            </p>
            <div className="text-6xl">☀️</div>
          </motion.div>

          {/* Energy Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {energyStats.map((stat, index) => (
              <motion.div
                key={index}
                className="glass rounded-2xl p-6 glow-on-hover card-3d-subtle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon name={stat.icon} size={24} className="text-primary" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <p className="text-dark-textSecondary text-sm font-body serif-optimized">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Interactive Tabs */}
          <motion.div 
            className="glass rounded-2xl p-6 mb-8 glow-effect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { id: 'marketplace', label: 'Marketplace' },
                { id: 'history', label: 'Trading History' },
                { id: 'leaders', label: 'Community Leaders' },
                { id: 'impact', label: 'Your Impact' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-xl font-accent serif-optimized transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-primary text-dark-bg shadow-lg glow-effect'
                      : 'text-white hover:bg-white/20 interactive-glass'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {activeTab === 'marketplace' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h3 className="text-2xl font-heading text-white mb-6 serif-optimized">Community Energy Needs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {energyNeeds.map((need, index) => (
                      <motion.div
                        key={need.id}
                        className="glass rounded-xl p-6 card-3d-subtle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-accent text-white serif-optimized">{need.organization}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(need.priority)}`}>
                            {need.priority}
                          </span>
                        </div>
                        <p className="text-white/90 mb-2 font-body serif-optimized">{need.description}</p>
                        <p className="text-dark-textSecondary text-sm mb-4 font-body serif-optimized">{need.impact}</p>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-dark-textSecondary text-sm font-body serif-optimized">{need.distance}</span>
                          <span className="text-white font-semibold">{need.tokens} tokens</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDonate(need)}
                            className="flex-1 bg-success hover:bg-success/80 text-white font-accent py-3 px-4 rounded-lg transition-colors serif-optimized"
                          >
                            Donate {need.energyNeeded} kWh
                          </button>
                          <button
                            onClick={() => handleSell(need)}
                            className="flex-1 bg-primary hover:bg-primary/80 text-dark-bg font-accent py-3 px-4 rounded-lg transition-colors serif-optimized"
                          >
                            Sell {need.energyNeeded} kWh
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h3 className="text-2xl font-heading text-white mb-6 serif-optimized">Your Trading History</h3>
                  <div className="space-y-4">
                    {tradingHistory.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="glass rounded-xl p-6 card-3d-subtle"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-accent text-white serif-optimized">
                            {item.type === 'donated' ? 'Donated' : 'Sold'} {item.amount} kWh to {item.recipient}
                          </h4>
                          <span className="text-success font-semibold">+{item.tokens} tokens</span>
                        </div>
                        <p className="text-dark-textSecondary text-sm mb-2 font-body serif-optimized">{item.time}</p>
                        <p className="text-white/90 font-body serif-optimized">{item.impact}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leaders' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h3 className="text-2xl font-heading text-white mb-6 serif-optimized">Top Community Contributors This Month</h3>
                  <div className="space-y-4">
                    {communityLeaders.map((leader, index) => (
                      <motion.div
                        key={leader.id}
                        className={`glass rounded-xl p-6 transition-all duration-300 card-3d-subtle ${
                          leader.isCurrentUser
                            ? 'border border-warning/30 glow-effect'
                            : ''
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{getRankIcon(leader.rank)}</span>
                            <div>
                              <h4 className="text-lg font-accent text-white serif-optimized">
                                {leader.name} {leader.rank === 1 && '- #1'}
                                {leader.rank === 2 && '- #2'}
                                {leader.rank === 3 && '- #3'}
                                {leader.rank > 3 && `- #${leader.rank}`}
                              </h4>
                              <p className="text-dark-textSecondary font-body serif-optimized">
                                {leader.energyDonated} kWh donated this month
                                {leader.isCurrentUser && ' - Community Hero!'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'impact' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h3 className="text-2xl font-heading text-white mb-6 serif-optimized">Your Impact</h3>
                  
                  {/* Impact Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div 
                      className="glass rounded-xl p-6 text-center card-3d-subtle"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <div className="text-3xl font-bold text-primary mb-2">147 kWh</div>
                      <p className="text-dark-textSecondary font-body serif-optimized">Total Energy Donated</p>
                    </motion.div>
                    <motion.div 
                      className="glass rounded-xl p-6 text-center card-3d-subtle"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="text-3xl font-bold text-success mb-2">234kg CO₂</div>
                      <p className="text-dark-textSecondary font-body serif-optimized">Offset Created 🌱</p>
                    </motion.div>
                    <motion.div 
                      className="glass rounded-xl p-6 text-center card-3d-subtle"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <div className="text-3xl font-bold text-warning mb-2">23</div>
                      <p className="text-dark-textSecondary font-body serif-optimized">Neighbors Helped</p>
                    </motion.div>
                  </div>

                  {/* Achievements */}
                  <motion.div 
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <h4 className="text-xl font-accent text-white mb-4 serif-optimized">Achievements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {achievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          className={`glass rounded-xl p-4 transition-all duration-300 ${
                            achievement.unlocked
                              ? 'border border-warning/30 glow-effect'
                              : 'opacity-60'
                          }`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div>
                              <h5 className="font-accent text-white serif-optimized">{achievement.title}</h5>
                              <p className="text-dark-textSecondary text-sm font-body serif-optimized">{achievement.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="flex flex-wrap gap-4 justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <button className="bg-success hover:bg-success/80 text-white font-accent py-3 px-6 rounded-xl transition-colors serif-optimized glow-on-hover">
              Check Solar Generation
            </button>
            <button className="bg-primary hover:bg-primary/80 text-dark-bg font-accent py-3 px-6 rounded-xl transition-colors serif-optimized glow-on-hover">
              Find Neighbors
            </button>
            <button className="bg-purple hover:bg-purple/80 text-white font-accent py-3 px-6 rounded-xl transition-colors serif-optimized glow-on-hover">
              Trading Settings
            </button>
          </motion.div>

          {/* Impact Story */}
          <motion.div 
            className="glass rounded-2xl p-6 glow-effect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-xl font-accent text-white mb-4 serif-optimized">This Week's Impact Story 🏫</h3>
            <p className="text-white/90 mb-4 font-body serif-optimized leading-relaxed">
              Your energy donation this Tuesday powered the computer lab at Local Primary School for 4 hours, 
              helping 45 children complete their digital literacy projects.
            </p>
            <p className="text-dark-textSecondary italic font-body serif-optimized">
              "Thank you Maria! The children were so excited to finish their presentations." - Mrs. Sharma, Computer Teacher
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Community;