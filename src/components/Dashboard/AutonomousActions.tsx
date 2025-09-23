import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../UI/Card';
import { Icon } from '../UI/Icon';
import { AutonomousAction } from '../../types/dashboard.types';

interface AutonomousActionsProps {
  actions: AutonomousAction[];
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getApplianceName = (applianceId: string): string => {
  const applianceMap: { [key: string]: string } = {
    'ac1': 'Bedroom Air Conditioner',
    'fan1': 'Bedroom Ceiling Fan',
    'pc1': 'Desktop Computer',
    'bulb1': 'Bedroom Main Light',
    'lamp1': 'Study Table Lamp',
    'switch1': 'Smart Switch Hub'
  };
  return applianceMap[applianceId] || `Device ${applianceId}`;
};

export const AutonomousActions: React.FC<AutonomousActionsProps> = ({ actions }) => {
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [showAllActions, setShowAllActions] = useState(false);

  // Sort actions by timestamp (newest first)
  const sortedActions = [...actions].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const currentAction = sortedActions[selectedActionIndex];
  const hasMultipleActions = sortedActions.length > 1;
  if (!actions || actions.length === 0) {
    return (
      <Card className="glass glow-on-hover">
        <div className="mb-6">
          <h3 className="text-2xl font-heading text-dark-text mb-2 serif-optimized text-shadow">
            AI Autonomous Actions Performed
          </h3>
          <p className="font-body text-dark-textSecondary serif-optimized">
            Detailed view of autonomous optimizations and implementations
          </p>
        </div>
        <div className="text-center py-12">
          <Icon name="cpu" size={64} className="text-dark-surface mx-auto mb-4" />
          <p className="font-body text-dark-textSecondary serif-optimized text-lg">No autonomous actions performed yet</p>
          <p className="font-body text-dark-textSecondary serif-optimized text-sm mt-2">
            The AI will automatically optimize your system and create routines based on your usage patterns
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass glow-on-hover">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-heading text-dark-text mb-2 serif-optimized text-shadow">
              AI Autonomous Actions Performed
            </h3>
            <p className="font-body text-dark-textSecondary serif-optimized">
              Latest autonomous optimization report
            </p>
          </div>

          {hasMultipleActions && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-dark-textSecondary serif-optimized">
                {selectedActionIndex + 1} of {sortedActions.length}
              </span>
              <button
                onClick={() => setShowAllActions(!showAllActions)}
                className="px-4 py-2 btn-glass-primary rounded-xl text-sm font-accent serif-optimized"
              >
                {showAllActions ? 'Show Latest' : 'View All'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAllActions && hasMultipleActions ? (
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-accent text-dark-text serif-optimized">Select Report:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-120 overflow-y-auto custom-scrollbar p-2">
            {sortedActions.map((action, index) => (
              <button
                key={action.id}
                onClick={() => {
                  setSelectedActionIndex(index);
                  setShowAllActions(false);
                }}
                className={`p-3 rounded-xl text-left transition-all duration-300 ${index === selectedActionIndex
                  ? 'bg-primary/20 border border-primary/30 text-primary'
                  : 'bg-dark-surface/20 border border-dark-surface/30 text-dark-textSecondary hover:bg-dark-surface/30'
                  }`}
              >
                <div className="text-sm font-accent serif-optimized">{action.action}</div>
                <div className="text-xs opacity-70">{formatTimestamp(action.timestamp)}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {currentAction && (
            <div className="bg-gradient-to-r from-success/5 to-primary/5 border border-success/20 rounded-xl p-6 glass hover:from-success/10 hover:to-primary/10 transition-all duration-300">
              {/* Action Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center shadow-lg glow-effect">
                    <Icon name="cpu" size={24} className="text-success" />
                  </div>
                  <div>
                    <h4 className="text-lg font-accent text-dark-text serif-optimized">
                      {currentAction.action}
                    </h4>
                    <p className="text-sm font-body text-dark-textSecondary serif-optimized">
                      {formatTimestamp(currentAction.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-accent serif-optimized shadow-lg">
                  COMPLETED
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-6">
                <h5 className="text-sm font-accent text-dark-text mb-2 serif-optimized uppercase tracking-wide">
                  Analysis & Reasoning
                </h5>
                <div className="bg-dark-surface/20 rounded-xl p-4 border border-dark-surface/30 backdrop-blur-sm">
                  <div className="text-sm font-body text-dark-textSecondary serif-optimized leading-relaxed prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-accent text-dark-text mb-2 serif-optimized">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-accent text-dark-text mb-2 serif-optimized">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-accent text-dark-text mb-1 serif-optimized">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 text-dark-textSecondary">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-dark-textSecondary">{children}</li>,
                        strong: ({ children }) => <strong className="font-accent text-dark-text">{children}</strong>,
                        em: ({ children }) => <em className="italic text-primary">{children}</em>,
                        code: ({ children }) => <code className="bg-primary/10 text-primary px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/30 pl-3 italic text-dark-textSecondary">{children}</blockquote>
                      }}
                    >
                      {currentAction.reasoning}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Implementation Details */}
              <div className="space-y-4">
                {/* Routines Created */}
                {currentAction.details.routinesCreated && currentAction.details.routinesCreated.length > 0 && (
                  <div>
                    <h5 className="text-sm font-accent text-dark-text mb-3 serif-optimized uppercase tracking-wide flex items-center">
                      <Icon name="clock" size={16} className="mr-2 text-primary" />
                      Routines Created ({currentAction.details.routinesCreated.length})
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentAction.details.routinesCreated.map((routine, routineIndex) => (
                        <div
                          key={routineIndex}
                          className="bg-primary/5 border border-primary/20 rounded-xl p-4 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-accent text-dark-text serif-optimized text-sm">
                              {routine.name}
                            </h6>
                            <span className="text-xs font-body text-primary serif-optimized bg-primary/10 px-2 py-1 rounded-lg">
                              {routine.schedule.time}
                            </span>
                          </div>
                          <p className="text-xs font-body text-dark-textSecondary serif-optimized mb-3">
                            {routine.description}
                          </p>

                          {/* Schedule */}
                          <div className="mb-3">
                            <p className="text-xs font-accent text-dark-text serif-optimized mb-1">Schedule:</p>
                            <div className="flex flex-wrap gap-1">
                              {routine.schedule.days.map((day, dayIndex) => (
                                <span
                                  key={dayIndex}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-body serif-optimized"
                                >
                                  {day.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div>
                            <p className="text-xs font-accent text-dark-text serif-optimized mb-2">Actions:</p>
                            <div className="space-y-1">
                              {routine.actions.map((routineAction, actionIndex) => (
                                <div
                                  key={actionIndex}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="font-body text-dark-textSecondary serif-optimized">
                                    {getApplianceName(routineAction.applianceId)}
                                  </span>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-accent serif-optimized ${routineAction.command === 'turnOn'
                                    ? 'bg-success/20 text-success'
                                    : 'bg-danger/20 text-danger'
                                    }`}>
                                    {routineAction.command === 'turnOn' ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Performed */}
                {currentAction.details.analysisPerformed && currentAction.details.analysisPerformed.length > 0 && (
                  <div>
                    <h5 className="text-sm font-accent text-dark-text mb-3 serif-optimized uppercase tracking-wide flex items-center">
                      <Icon name="bar-chart" size={16} className="mr-2 text-warning" />
                      Analysis Performed
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentAction.details.analysisPerformed.map((analysis, analysisIndex) => (
                        <div
                          key={analysisIndex}
                          className="bg-warning/5 border border-warning/20 rounded-xl p-3 backdrop-blur-sm"
                        >
                          <p className="text-sm font-body text-dark-textSecondary serif-optimized">
                            {analysis}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimizations Applied */}
                {currentAction.details.optimizationsApplied && currentAction.details.optimizationsApplied.length > 0 && (
                  <div>
                    <h5 className="text-sm font-accent text-dark-text mb-3 serif-optimized uppercase tracking-wide flex items-center">
                      <Icon name="zap" size={16} className="mr-2 text-secondary" />
                      Optimizations Applied
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                      {currentAction.details.optimizationsApplied.map((optimization, optIndex) => (
                        <div
                          key={optIndex}
                          className="bg-secondary/5 border border-secondary/20 rounded-xl p-3 backdrop-blur-sm"
                        >
                          <p className="text-sm font-body text-dark-textSecondary serif-optimized">
                            {optimization}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};