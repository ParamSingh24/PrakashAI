import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus, 
  Zap, 
  Brain,
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone,
  Lightbulb,
  Fan,
  Wind,
  Monitor
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Icon } from '../components/UI/Icon';
import { useRoutines, Routine, CreateRoutineData } from '../hooks/useRoutines';
import { useAppliances } from '../hooks/useAppliances';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import VoiceControlButton from '../components/VoiceControl/VoiceControlButton';
import VoiceDeviceControl from '../components/VoiceControl/VoiceDeviceControl';

interface StatCard {
  title: string;
  value: number;
  icon: any;
  color: string;
  description: string;
}

const Routines: React.FC = () => {
  console.log('📱 Routines component loaded!');
  const { routines, loading, statistics, createRoutine, deleteRoutine, executeRoutine, toggleRoutineStatus, getAIRoutineSuggestion } = useRoutines();
  const { appliances } = useAppliances();
  const { showNotification } = useNotification();
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showVoiceControl, setShowVoiceControl] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const statsCards: StatCard[] = [
    {
      title: "Total Routines",
      value: statistics.total,
      icon: Clock,
      color: "blue",
      description: "Created routines"
    },
    {
      title: "Active",
      value: statistics.active,
      icon: CheckCircle,
      color: "green", 
      description: "Running routines"
    },
    {
      title: "AI Created",
      value: statistics.aiCreated,
      icon: Brain,
      color: "purple",
      description: "AI-generated routines"
    }
  ];

  // Filter routines based on selected filter
  const filteredRoutines = routines.filter(routine => {
    switch (selectedFilter) {
      case 'active':
        return routine.isActive !== false;
      case 'inactive':
        return routine.isActive === false;
      case 'ai':
        return routine.createdBy === 'ai';
      case 'manual':
        return routine.createdBy === 'manual';
      default:
        return true;
    }
  });

  // Get appliance name by ID
  const getApplianceName = (applianceId: string) => {
    const appliance = appliances.find(a => a.uid === applianceId);
    return appliance?.name || 'Unknown Device';
  };

  // Get appliance icon by type
  const getApplianceIcon = (applianceId: string) => {
    const appliance = appliances.find(a => a.uid === applianceId);
    if (!appliance) return Settings;
    
    const iconMap: { [key: string]: any } = {
      'Lighting': Lightbulb,
      'light': Lightbulb,
      'Fan': Fan,
      'ac': Wind,
      'Computer': Monitor,
      'PC': Monitor
    };
    return iconMap[appliance.type] || Settings;
  };

  // Format schedule display
  const formatSchedule = (schedule: any) => {
    if (!schedule) {
      return 'Invalid schedule';
    }
    
    const time = schedule.time || 'Unknown time';
    const days = schedule.days;
    
    // Check if days is defined and is an array
    if (!days || !Array.isArray(days) || days.length === 0) {
      return `${time} (no days specified)`;
    }
    
    if (days.length === 7) {
      return `Daily at ${time}`;
    } else if (days.length === 5 && days.every((day: string) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day.toLowerCase()))) {
      return `Weekdays at ${time}`;
    } else if (days.length === 2 && days.every((day: string) => ['saturday', 'sunday'].includes(day.toLowerCase()))) {
      return `Weekends at ${time}`;
    } else {
      const dayNames = days.map((day: string) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());
      return `${dayNames.join(', ')} at ${time}`;
    }
  };

  // Handle routine execution
  const handleExecuteRoutine = async (routineId: string) => {
    setActionLoading(routineId);
    
    try {
      const result = await executeRoutine(routineId);
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Routine executed',
          message: 'Routine has been executed successfully',
          duration: 3000
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Execution failed',
          message: result.error || 'Failed to execute routine',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error executing routine:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server',
        duration: 5000
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle routine deletion
  const handleDeleteRoutine = async (routineId: string, routineName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${routineName}"?`)) {
      return;
    }
    
    try {
      const result = await deleteRoutine(routineId);
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Routine deleted',
          message: `"${routineName}" has been deleted`,
          duration: 3000
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Deletion failed',
          message: result.error || 'Failed to delete routine',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server',
        duration: 5000
      });
    }
  };

  // Handle routine status toggle
  const handleToggleStatus = async (routineId: string) => {
    try {
      const result = await toggleRoutineStatus(routineId);
      if (result.success) {
        const routine = routines.find(r => r.id === routineId);
        const newStatus = routine?.isActive ? 'activated' : 'deactivated';
        showNotification({
          type: 'success',
          title: 'Status updated',
          message: `Routine has been ${newStatus}`,
          duration: 3000
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Failed to update routine status',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error toggling routine status:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server',
        duration: 5000
      });
    }
  };

  // Handle AI suggestion
  const handleAISuggestion = async () => {
    if (!aiPrompt.trim()) {
      showNotification({
        type: 'warning',
        title: 'Empty prompt',
        message: 'Please enter a description for your routine',
        duration: 3000
      });
      return;
    }

    setAiLoading(true);
    
    try {
      const result = await getAIRoutineSuggestion(aiPrompt);
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'AI Suggestion Ready',
          message: 'Check the suggestion and create your routine',
          duration: 3000
        });
        // Here you would typically show the AI suggestion in a modal
        console.log('AI Suggestion:', result.suggestion);
      } else {
        showNotification({
          type: 'error',
          title: 'AI Suggestion Failed',
          message: result.error || 'Failed to get AI suggestion',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the AI service',
        duration: 5000
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Handle voice command processing
  const handleVoiceCommand = (command: string, success: boolean) => {
    console.log('🗣️ Voice command processed:', { command, success });
    if (success) {
      // Refresh routines data after successful voice command
      // The command might have created, modified, or executed routines
      setTimeout(() => {
        console.log('🔄 Refreshing routines after voice command');
        // The useRoutines hook should automatically refresh
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-card">
      <div className="container mx-auto px-4 py-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Icon name="clock" size={48} className="text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-dark-text">
                  Routines
                </h1>
                <p className="text-dark-textSecondary">
                  Automate Your Home Efficiency
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <VoiceControlButton
                onCommandProcessed={handleVoiceCommand}
                size="md"
                className="flex items-center"
              />
              <button
                onClick={() => setShowVoiceControl(!showVoiceControl)}
                className="flex items-center space-x-2 px-4 py-2 glass bg-green-500/20 hover:bg-green-500/30 text-green-100 border border-green-500/30 rounded-lg font-medium transition-all duration-300 backdrop-blur-md glow-effect-green"
                title="Toggle Voice Control Panel"
              >
                <Icon name="mic" size={20} />
                <span>Voice Panel</span>
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center space-x-2 px-4 py-2 glass bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border border-purple-500/30 rounded-lg font-medium transition-all duration-300 backdrop-blur-md glow-effect-purple"
              >
                <Brain className="h-5 w-5" />
                <span>AI Assistant</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 glass bg-primary/20 hover:bg-primary/30 text-blue-100 border border-primary/30 rounded-lg font-medium transition-all duration-300 backdrop-blur-md glow-effect"
              >
                <Plus className="h-5 w-5" />
                <span>Add New Routine</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          <FilterButton 
            active={selectedFilter === 'all'}
            onClick={() => setSelectedFilter('all')}
          >
            All Routines
          </FilterButton>
          <FilterButton 
            active={selectedFilter === 'active'}
            onClick={() => setSelectedFilter('active')}
          >
            Active
          </FilterButton>
          <FilterButton 
            active={selectedFilter === 'inactive'}
            onClick={() => setSelectedFilter('inactive')}
          >
            Inactive
          </FilterButton>
          <FilterButton 
            active={selectedFilter === 'ai'}
            onClick={() => setSelectedFilter('ai')}
          >
            AI Created
          </FilterButton>
          <FilterButton 
            active={selectedFilter === 'manual'}
            onClick={() => setSelectedFilter('manual')}
          >
            Manual
          </FilterButton>
        </motion.div>

        {/* Routines Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutines.map((routine, index) => (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <RoutineCard 
                  routine={routine}
                  onExecute={() => handleExecuteRoutine(routine.id)}
                  onDelete={() => handleDeleteRoutine(routine.id, routine.name)}
                  onToggleStatus={() => handleToggleStatus(routine.id)}
                  getApplianceName={getApplianceName}
                  getApplianceIcon={getApplianceIcon}
                  formatSchedule={formatSchedule}
                  loading={actionLoading === routine.id}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRoutines.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <Icon name="clock" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark-text mb-2">
              No routines found
            </h3>
            <p className="text-dark-textSecondary mb-6">
              {selectedFilter !== 'all' 
                ? 'No routines match your current filter'
                : 'Create your first routine to automate your home'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 glass bg-primary/20 hover:bg-primary/30 text-blue-100 border border-primary/30 rounded-lg font-medium transition-all duration-300 backdrop-blur-md glow-effect mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Routine</span>
            </button>
          </motion.div>
        )}

        {/* AI Assistant Modal */}
        {showAIModal && (
          <AIAssistantModal
            isOpen={showAIModal}
            onClose={() => setShowAIModal(false)}
            prompt={aiPrompt}
            setPrompt={setAiPrompt}
            onSubmit={handleAISuggestion}
            loading={aiLoading}
          />
        )}

        {/* Voice Control Panel */}
        {showVoiceControl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-8"
          >
            <VoiceDeviceControl />
          </motion.div>
        )}

        {/* Create Routine Modal */}
        {showCreateModal && (
          <CreateRoutineModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={createRoutine}
            appliances={appliances}
            showNotification={showNotification}
          />
        )}
      </div>
    </div>
  );
};

// Statistics Card Component
const StatCard: React.FC<StatCard> = ({ title, value, icon: Icon, color, description }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-primary bg-primary/10 border-primary/30';
      case 'green': return 'text-secondary bg-secondary/10 border-secondary/30';
      case 'purple': return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
      case 'red': return 'text-danger bg-danger/10 border-danger/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-textSecondary text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-dark-text mt-1">{value}</p>
          <p className="text-gray-500 text-xs mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-xl border ${getColorClasses(color)}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </Card>
  );
};

// Filter Button Component
const FilterButton: React.FC<{
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}> = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 backdrop-blur-md border ${
      active
        ? 'glass bg-primary/30 text-white border-primary/50 glow-effect shadow-lg'
        : 'glass bg-white/5 text-dark-textSecondary hover:bg-white/10 border-white/10 hover:border-white/20'
    }`}
  >
    {children}
  </button>
);

// Routine Card Component
const RoutineCard: React.FC<{
  routine: Routine;
  onExecute: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  getApplianceName: (id: string) => string;
  getApplianceIcon: (id: string) => any;
  formatSchedule: (schedule: any) => string;
  loading: boolean;
}> = ({ routine, onExecute, onDelete, onToggleStatus, getApplianceName, getApplianceIcon, formatSchedule, loading }) => {
  // Safely get icon component - check if actions exist and has at least one item
  const firstAction = routine.actions && routine.actions.length > 0 ? routine.actions[0] : null;
  const IconComponent = firstAction ? getApplianceIcon(firstAction.applianceId) : Settings;

  return (
    <Card className="relative group">
      {/* Routine Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-dark-text">{routine.name}</h3>
            {routine.createdBy === 'ai' && (
              <span className="px-2 py-1 bg-purple-900/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                AI
              </span>
            )}
          </div>
          <p className="text-sm text-dark-textSecondary mb-2">{routine.description}</p>
          
          {/* Schedule */}
          <div className="flex items-center space-x-2 text-sm text-dark-textSecondary">
            <Calendar className="h-4 w-4" />
            <span>{formatSchedule(routine.schedule)}</span>
          </div>
        </div>
        
        {/* Status Toggle */}
        <button
          onClick={onToggleStatus}
          className={`p-2 rounded-lg transition-all duration-200 ${
            routine.isActive !== false
              ? 'text-green-400 bg-green-900/20 border border-green-500/30'
              : 'text-red-400 bg-red-900/20 border border-red-500/30'
          }`}
        >
          {routine.isActive !== false ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      </div>

      {/* Actions */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-dark-textSecondary mb-2">Actions:</h4>
        <div className="space-y-2">
          {routine.actions && routine.actions.length > 0 ? (
            routine.actions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <IconComponent className="h-4 w-4 text-primary" />
                <span className="text-dark-text">
                  {getApplianceName(action.applianceId)}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  action.command === 'turnOn' 
                    ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                    : 'bg-red-900/20 text-red-400 border border-red-500/30'
                }`}>
                  {action.command === 'turnOn' ? 'Turn ON' : 'Turn OFF'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-dark-textSecondary">
              No actions defined for this routine
            </div>
          )}
        </div>
      </div>

      {/* Last Executed */}
      {routine.lastExecuted && (
        <div className="mb-4 text-xs text-dark-textSecondary">
          Last executed: {new Date(routine.lastExecuted).toLocaleString()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={onExecute}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 glass bg-primary/20 hover:bg-primary/30 text-blue-100 border border-primary/30 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-md glow-effect disabled:opacity-50"
        >
          {loading ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{loading ? 'Executing...' : 'Execute Now'}</span>
        </button>
        
        <button
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
          title="Delete routine"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
};

// AI Assistant Modal Component
const AIAssistantModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  loading: boolean;
}> = ({ isOpen, onClose, prompt, setPrompt, onSubmit, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-card border border-dark-surface/50 rounded-xl p-6 w-full max-w-md"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-dark-text">AI Assistant</h2>
        </div>
        
        <p className="text-dark-textSecondary mb-4">
          Describe your routine in plain English and let AI create it for you.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Describe your routine
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Turn off all lights at midnight on weekdays"
              className="w-full p-3 bg-dark-surface/50 border border-dark-surface/50 rounded-lg text-dark-text placeholder-gray-400 focus:border-primary focus:outline-none resize-none"
              rows={4}
            />
          </div>
          
          <div className="text-xs text-dark-textSecondary">
            <p className="mb-2">Examples:</p>
            <ul className="space-y-1">
              <li>• "Turn off fan at 11 PM every Monday, Tuesday, Thursday"</li>
              <li>• "Turn on kitchen fan at 5 PM daily"</li>
              <li>• "Turn off bathroom AC for power saving at 10 PM"</li>
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-dark-surface/50 text-dark-textSecondary hover:bg-dark-surface rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !prompt.trim()}
            className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" className="text-white" />
                <span>Processing...</span>
              </div>
            ) : (
              'Get AI Suggestion'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Create Routine Modal Component
const CreateRoutineModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateRoutineData) => Promise<any>;
  appliances: any[];
  showNotification: (notification: any) => void;
}> = ({ isOpen, onClose, onCreate, appliances, showNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    time: '12:00',
    days: [] as string[],
    applianceId: '',
    command: 'turnOff' as 'turnOn' | 'turnOff'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.applianceId || formData.days.length === 0) {
      showNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        duration: 3000
      });
      return;
    }

    try {
      const routineData: CreateRoutineData = {
        name: formData.name,
        description: formData.description,
        schedule: {
          time: formData.time,
          days: formData.days
        },
        actions: [{
          applianceId: formData.applianceId,
          command: formData.command
        }]
      };

      const result = await onCreate(routineData);
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Routine Created',
          message: `"${formData.name}" has been created successfully`,
          duration: 3000
        });
        onClose();
        setFormData({
          name: '',
          description: '',
          time: '12:00',
          days: [],
          applianceId: '',
          command: 'turnOff'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Creation Failed',
          message: result.error || 'Failed to create routine',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error creating routine:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server',
        duration: 5000
      });
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-card border border-dark-surface/50 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Plus className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-dark-text">Create New Routine</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Routine Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Night Mode"
              className="w-full p-3 bg-dark-surface/50 border border-dark-surface/50 rounded-lg text-dark-text placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this routine does"
              className="w-full p-3 bg-dark-surface/50 border border-dark-surface/50 rounded-lg text-dark-text placeholder-gray-400 focus:border-primary focus:outline-none resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Time *
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className="w-full p-3 bg-dark-surface/50 border border-dark-surface/50 rounded-lg text-dark-text focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Days *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                    formData.days.includes(day)
                      ? 'bg-primary text-white'
                      : 'bg-dark-surface/50 text-dark-textSecondary hover:bg-dark-surface'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Appliance *
            </label>
            <select
              value={formData.applianceId}
              onChange={(e) => setFormData(prev => ({ ...prev, applianceId: e.target.value }))}
              className="w-full p-3 bg-dark-surface/50 border border-dark-surface/50 rounded-lg text-dark-text focus:border-primary focus:outline-none"
            >
              <option value="">Select an appliance</option>
              {appliances.map(appliance => (
                <option key={appliance.uid} value={appliance.uid}>
                  {appliance.name} ({appliance.location || 'Unknown Location'})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-textSecondary mb-2">
              Action *
            </label>
            <select
              value={formData.command}
              onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value as 'turnOn' | 'turnOff' }))}
              className="w-full p-3 bg-dark-surface/50 border border-dark-surface/50 rounded-lg text-dark-text focus:border-primary focus:outline-none"
            >
              <option value="turnOff">Turn OFF</option>
              <option value="turnOn">Turn ON</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-dark-surface/50 text-dark-textSecondary hover:bg-dark-surface rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200"
            >
              Create Routine
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Routines;
