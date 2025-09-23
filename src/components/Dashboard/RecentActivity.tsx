import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../UI/Card';
import { Icon } from '../UI/Icon';
import { RecentActivity as RecentActivityType } from '../../types/dashboard.types';

interface RecentActivityProps {
  activities: RecentActivityType[];
}

interface AutonomousLogEntry {
  timestamp: string;
  action: string;
  reasoning: string;
  tool_calls: Array<{
    tool_name: string;
    arguments: any;
    response: any;
    execution_time_ms: number;
    timestamp: string;
  }>;
  result: string;
  execution_id: string;
}

const ActivityIcon: React.FC<{ type: string; impact: string }> = ({ type, impact }) => {
  const getIcon = () => {
    switch (type) {
      case 'ai': return 'cpu';
      case 'user': return 'user';
      default: return 'activity';
    }
  };

  const getIconStyle = () => {
    switch (type) {
      case 'ai':
        return 'bg-primary/20 text-primary border border-primary/30';
      case 'user':
        return 'bg-secondary/20 text-secondary border border-secondary/30';
      default:
        return 'bg-dark-surface/40 text-dark-textSecondary border border-dark-border/50';
    }
  };

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getIconStyle()}`}>
      <Icon name={getIcon()} size={16} />
    </div>
  );
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now.getTime() - activityTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const AutonomousAnalysisCard: React.FC<{ entry: AutonomousLogEntry; index: number }> = ({ entry, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatAnalysisContent = (reasoning: string) => {
    return reasoning
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      .replace(/(\d+\.)/g, '\n$1')
      .replace(/(\* )/g, '\n$1')
      .trim();
  };

  return (
    <div
      className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
          <Icon name="cpu" size={18} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-accent text-dark-text text-sm serif-optimized">
              {entry.action}
            </h4>
            <span className="font-body text-xs text-dark-textSecondary serif-optimized">
              {formatTimeAgo(entry.timestamp)}
            </span>
          </div>

          <div className="mb-3">
            <div className={`prose prose-sm max-w-none text-dark-textSecondary ${isExpanded ? '' : 'line-clamp-3'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 text-xs leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="text-dark-text font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-xs">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-xs">{children}</ol>,
                  li: ({ children }) => <li className="text-xs">{children}</li>,
                }}
              >
                {formatAnalysisContent(entry.reasoning)}
              </ReactMarkdown>
            </div>

            {entry.reasoning.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary text-xs font-accent mt-2 hover:text-primary/80 transition-colors"
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 rounded-full text-xs font-accent serif-optimized bg-primary/20 text-primary">
                AUTONOMOUS AI
              </span>

              {entry.tool_calls && entry.tool_calls.length > 0 && (
                <span className="px-2 py-1 rounded-full text-xs font-accent serif-optimized bg-secondary/20 text-secondary">
                  {entry.tool_calls.length} Actions
                </span>
              )}
            </div>

            <span className={`px-2 py-1 rounded-full text-xs font-accent serif-optimized ${entry.result.includes('success') || entry.result.includes('complete')
              ? 'bg-success/20 text-success'
              : entry.result.includes('failed') || entry.result.includes('error')
                ? 'bg-danger/20 text-danger'
                : 'bg-warning/20 text-warning'
              }`}>
              {entry.result.includes('success') || entry.result.includes('complete') ? 'SUCCESS' :
                entry.result.includes('failed') || entry.result.includes('error') ? 'FAILED' : 'PENDING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  console.log('RecentActivity received activities:', activities.length, activities);
  const [autonomousLogs, setAutonomousLogs] = useState<AutonomousLogEntry[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<AutonomousLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAutonomous, setShowAutonomous] = useState(false);
  const [logsToShow, setLogsToShow] = useState(5);
  const [activitiesToShow, setActivitiesToShow] = useState(10);

  const fetchAutonomousLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/autonomous-ai/log');
      const data = await response.json();

      if (data.success) {
        const sortedLogs = data.log.sort((a: AutonomousLogEntry, b: AutonomousLogEntry) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setAutonomousLogs(sortedLogs);
        setDisplayedLogs(sortedLogs.slice(0, logsToShow));
      }
    } catch (error) {
      console.error('Failed to fetch autonomous logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreLogs = () => {
    const newLogsToShow = logsToShow + 5;
    setLogsToShow(newLogsToShow);
    setDisplayedLogs(autonomousLogs.slice(0, newLogsToShow));
  };

  const loadMoreActivities = () => {
    setActivitiesToShow(prev => prev + 5);
  };

  useEffect(() => {
    if (showAutonomous) {
      fetchAutonomousLogs();
    }
  }, [showAutonomous]);

  useEffect(() => {
    setDisplayedLogs(autonomousLogs.slice(0, logsToShow));
  }, [autonomousLogs, logsToShow]);

  // Get current activities to display
  const currentActivities = activities.slice(0, activitiesToShow);

  return (
    <Card className="recent-activity-container glass" hover={false}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-accent text-dark-text serif-optimized">Recent Activity</h3>
            <p className="font-body text-dark-textSecondary serif-optimized">System and user actions</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAutonomous(false)}
              className={`px-3 py-1 rounded-full text-xs font-accent transition-all ${!showAutonomous
                ? 'bg-primary text-white'
                : 'bg-dark-surface/30 text-dark-textSecondary hover:bg-dark-surface/50'
                }`}
            >
              Regular
            </button>
            <button
              onClick={() => setShowAutonomous(true)}
              className={`px-3 py-1 rounded-full text-xs font-accent transition-all ${showAutonomous
                ? 'bg-primary text-white'
                : 'bg-dark-surface/30 text-dark-textSecondary hover:bg-dark-surface/50'
                }`}
            >
              AI Analysis
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {showAutonomous ? (
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
                        <Icon name="loader2" size={24} className="text-primary animate-spin" />
                      </div>
                      <p className="font-body text-dark-textSecondary serif-optimized">Loading autonomous analysis...</p>
                    </div>
                  </div>
                ) : displayedLogs.length > 0 ? (
                  <>
                    {displayedLogs.map((entry, index) => (
                      <AutonomousAnalysisCard key={entry.execution_id} entry={entry} index={index} />
                    ))}

                    {displayedLogs.length < autonomousLogs.length && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMoreLogs}
                          className="px-4 py-2 btn-glass-primary rounded-xl font-accent text-sm"
                        >
                          Load 5 More Analyses
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
                        <Icon name="cpu" size={24} className="text-primary" />
                      </div>
                      <p className="font-body text-dark-textSecondary serif-optimized">No autonomous analysis logs found</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-dark-surface/40 flex items-center justify-center mx-auto mb-4 border border-dark-border/50">
                        <Icon name="activity" size={24} className="text-dark-textSecondary" />
                      </div>
                      <p className="font-body text-dark-textSecondary serif-optimized">No recent activity</p>
                      <p className="font-body text-dark-textSecondary/70 serif-optimized text-sm mt-1">Activity will appear here as you use your devices</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-dark-surface/20 hover:bg-dark-surface/30 transition-all duration-200 border border-dark-border/30"
                      >
                        <ActivityIcon type={activity.type} impact={activity.impact} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-accent text-dark-text text-sm serif-optimized font-medium">
                              {activity.action}
                            </h4>
                            <span className="font-body text-xs text-dark-textSecondary serif-optimized">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>
                          
                          <p className="font-body text-xs text-dark-textSecondary serif-optimized line-clamp-2 mb-2">
                            {activity.description}
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-accent serif-optimized ${
                              activity.type === 'ai' 
                                ? 'bg-primary/20 text-primary' 
                                : activity.type === 'user'
                                ? 'bg-secondary/20 text-secondary'
                                : 'bg-dark-surface/50 text-dark-textSecondary'
                            }`}>
                              {activity.type.toUpperCase()}
                            </span>
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-accent serif-optimized ${
                              activity.impact === 'high'
                                ? 'bg-danger/20 text-danger'
                                : activity.impact === 'medium'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-success/20 text-success'
                            }`}>
                              {activity.impact.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {currentActivities.length < activities.length && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMoreActivities}
                          className="px-4 py-2 bg-secondary/20 text-secondary rounded-lg font-accent text-sm hover:bg-secondary/30 transition-all"
                        >
                          Load 5 More Activities
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};