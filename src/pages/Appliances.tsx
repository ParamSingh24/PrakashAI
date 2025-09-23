
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Home, 
  Wind, 
  Fan, 
  Monitor, 
  Lightbulb, 
  Power,
  Wifi,
  WifiOff,
  Search,
  Clock,
  DollarSign,
  Tv,
  Zap,
  Plus,
  Filter,
  Activity,
  TrendingUp,
  MapPin,
  Settings
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Icon } from '../components/UI/Icon';
import { useAppliances, Appliance } from '../hooks/useAppliances';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { AddApplianceModal, AddApplianceButton, AddApplianceHeaderButton } from '../components/Appliances';
import { VoiceControl } from '../components/VoiceControl';

interface StatCard {
  title: string;
  value: number;
  icon: any;
  color: string;
  description: string;
}

const Appliances: React.FC = () => {
  const { appliances, loading, statistics, toggleAppliance, fetchAppliances } = useAppliances();
  const { showNotification } = useNotification();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const statsCards: StatCard[] = [
    {
      title: "Total Devices",
      value: statistics.total,
      icon: Smartphone,
      color: "blue",
      description: "Connected devices"
    },
    {
      title: "Online",
      value: statistics.online,
      icon: CheckCircle,
      color: "green", 
      description: "Active devices"
    },
    {
      title: "Offline", 
      value: statistics.offline,
      icon: XCircle,
      color: "red",
      description: "Inactive devices"
    }
  ];

  // Handle successful appliance addition
  const handleApplianceAdded = () => {
    fetchAppliances(); // Refresh the appliances list
  };

  // Toggle device state
  const toggleDevice = async (applianceId: string) => {
    setToggleLoading(applianceId);
    
    try {
      const currentAppliance = appliances.find(a => a.uid === applianceId);
      if (!currentAppliance) return;

      const result = await toggleAppliance(applianceId);
      if (result.success) {
        const newState = currentAppliance.state === 'on' ? 'off' : 'on';
        showNotification({
          type: 'success',
          title: `${currentAppliance.name} turned ${newState}`,
          message: `Device is now ${newState === 'on' ? 'active' : 'inactive'}`,
          duration: 3000
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Failed to control device',
          message: result.error || 'An error occurred while toggling the device',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error toggling device:', error);
      showNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to the server',
        duration: 5000
      });
    } finally {
      setToggleLoading(null);
    }
  };

  // Voice control wrapper that handles the appliance ID lookup
  const handleVoiceToggle = async (applianceId: string) => {
    await toggleDevice(applianceId);
  };

  // Filter appliances based on search and filter
  const filteredAppliances = appliances.filter(appliance => {
    const location = appliance.location || appliance.room || '';
    const matchesSearch = appliance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appliance.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'online' && appliance.state === 'on') ||
                         (selectedFilter === 'offline' && appliance.state === 'off');
    
    return matchesSearch && matchesFilter;
  });

  // Get icon for device type
  const getDeviceIcon = (type: string) => {
    const iconMap: { [key: string]: any } = {
      'Lighting': Lightbulb,
      'light': Lightbulb,
      'Fan': Fan,
      'Air Conditioner': Wind,
      'ac': Wind,
      'Computer': Monitor,
      'PC': Monitor,
      'Television': Tv,
      'TV': Tv,
      'Smart Switch': Power,
      'Refrigerator': Home,
      'Microwave': Home,
      'Washing Machine': Home
    };
    return iconMap[type] || Home;
  };

  // Get status color classes
  const getStatusColor = (state: string) => {
    return state === 'on' 
      ? 'text-green-400 bg-green-900/20 border-green-500/30' 
      : 'text-red-400 bg-red-900/20 border-red-500/30';
  };

  // Get power consumption percentage
  const getPowerPercentage = (appliance: Appliance) => {
    if (appliance.state === 'off') return 0;
    // Calculate based on power usage vs typical max for the appliance type
    const currentPower = appliance.powerUsagePerHour || appliance.power_rating || 0;
    const maxPower = currentPower * 1.2; // 20% buffer
    return Math.min((currentPower / maxPower) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1d2e] to-[#0f172a]">
      <div className="container mx-auto px-4 py-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="glass rounded-2xl p-6 glow-effect">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center glow-effect">
                  <Zap size={32} className="text-primary" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl"></div>
              </div>
              <div>
                <h1 className="text-4xl font-heading text-white serif-optimized gradient-text">
                  Smart Appliances
                </h1>
                <p className="font-body text-slate-300 serif-optimized leading-relaxed text-lg">
                  Monitor and control your connected devices with style
                </p>
              </div>
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
              whileHover={{ y: -5 }}
              className="card-3d"
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Filter and Search Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-8 glow-effect"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-primary" />
                <span className="text-white font-medium serif-optimized">Filters:</span>
              </div>
              <div className="flex space-x-2">
                <FilterButton 
                  active={selectedFilter === 'all'}
                  onClick={() => setSelectedFilter('all')}
                >
                  All Devices
                </FilterButton>
                <FilterButton 
                  active={selectedFilter === 'online'}
                  onClick={() => setSelectedFilter('online')}
                >
                  <Wifi size={16} className="mr-1" />
                  Online
                </FilterButton>
                <FilterButton 
                  active={selectedFilter === 'offline'} 
                  onClick={() => setSelectedFilter('offline')}
                >
                  <WifiOff size={16} className="mr-1" />
                  Offline
                </FilterButton>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:glow-effect focus:outline-none transition-all duration-300 w-64"
              />
            </div>
          </div>
        </motion.div>

        {/* Device Control Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Add Appliance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AddApplianceButton 
                variant="card" 
                onClick={() => setShowAddModal(true)} 
              />
            </motion.div>
            
            {/* Existing Appliances */}
            {filteredAppliances.map((appliance, index) => (
              <motion.div
                key={appliance.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: (index + 1) * 0.05 }}
              >
                <DeviceCard 
                  appliance={appliance}
                  onToggle={() => toggleDevice(appliance.uid)}
                  loading={toggleLoading === appliance.uid}
                  getDeviceIcon={getDeviceIcon}
                  getStatusColor={getStatusColor}
                  getPowerPercentage={getPowerPercentage}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAppliances.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <Icon name="search" size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-accent text-dark-text mb-2 serif-optimized">
              No devices found
            </h3>
            <p className="font-body text-dark-textSecondary serif-optimized">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first smart appliance'
              }
            </p>
            {!searchTerm && selectedFilter === 'all' && (
              <AddApplianceButton 
                variant="inline" 
                onClick={() => setShowAddModal(true)}
                className="mx-auto"
              />
            )}
          </motion.div>
        )}

        {/* Floating Action Button */}
        <AddApplianceButton 
          variant="fab" 
          onClick={() => setShowAddModal(true)} 
        />

        {/* Voice Control Buttons */}
        <div className="fixed bottom-6 left-6 z-50 flex flex-col space-y-4">
          {/* Original Voice Control */}
          <VoiceControl
            appliances={appliances}
            onToggleAppliance={handleVoiceToggle}
          />
        </div>

        {/* Add Appliance Modal */}
        <AddApplianceModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleApplianceAdded}
        />
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
      case 'red': return 'text-danger bg-danger/10 border-danger/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-textSecondary text-sm font-accent serif-optimized">{title}</p>
          <p className="text-3xl font-display font-semibold text-dark-text mt-1 serif-optimized">{value}</p>
          <p className="text-gray-500 text-xs mt-1 font-body serif-optimized">{description}</p>
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
    className={`px-4 py-2 rounded-lg font-accent serif-optimized transition-all duration-300 backdrop-blur-md border ${
      active
        ? 'glass bg-primary/30 text-white border-primary/50 glow-effect shadow-lg'
        : 'glass bg-white/5 text-dark-textSecondary hover:bg-white/10 border-white/10 hover:border-white/20'
    }`}
  >
    {children}
  </button>
);

// Device Card Component
const DeviceCard: React.FC<{
  appliance: Appliance;
  onToggle: () => void;
  loading: boolean;
  getDeviceIcon: (type: string) => any;
  getStatusColor: (state: string) => string;
  getPowerPercentage: (appliance: Appliance) => number;
}> = ({ appliance, onToggle, loading, getDeviceIcon, getStatusColor, getPowerPercentage }) => {
  const IconComponent = getDeviceIcon(appliance.type);
  const powerPercentage = getPowerPercentage(appliance);

  return (
    <Card className="relative group">
      {/* Device Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-primary">
            <IconComponent className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-accent text-dark-text serif-optimized">{appliance.name}</h3>
            <p className="text-sm font-body text-dark-textSecondary serif-optimized">
              {appliance.location || appliance.room || 'Unknown Location'}
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(appliance.state)}`}>
          {appliance.state === 'on' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="capitalize">{appliance.state}</span>
        </div>
      </div>

      {/* Power Information */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-dark-textSecondary text-sm">Current Power</span>
          <span className="text-dark-text font-medium">
            {appliance.state === 'on' ? 
              `${appliance.powerUsagePerHour || appliance.power_rating || 0}W` : 
              '0W'
            }
          </span>
        </div>
        <div className="w-full bg-dark-surface/50 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              appliance.state === 'on' ? 'bg-primary' : 'bg-gray-600'
            }`}
            style={{ width: `${powerPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div className="flex items-center space-x-1 text-dark-textSecondary">
          <Clock className="h-3 w-3" />
          <span>{appliance.usage_hours || 0}h total</span>
        </div>
        <div className="flex items-center space-x-1 text-dark-textSecondary">
          <DollarSign className="h-3 w-3" />
          <span>{(appliance.totalUsage * 0.1).toFixed(2)} ₹</span>
        </div>
      </div>

      {/* Control Button */}
      <button
        onClick={onToggle}
        disabled={loading}
        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-accent serif-optimized transition-all duration-300 backdrop-blur-md border ${
          appliance.state === 'on'
            ? 'glass bg-red-500/20 hover:bg-red-500/30 text-red-100 border-red-500/30 glow-effect-red'
            : 'glass bg-green-500/20 hover:bg-green-500/30 text-green-100 border-green-500/30 glow-effect-green'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <LoadingSpinner size="sm" className="text-white" />
        ) : (
          <Power className="h-5 w-5" />
        )}
        <span>
          {loading ? 'Processing...' : appliance.state === 'on' ? 'Turn OFF' : 'Turn ON'}
        </span>
      </button>
    </Card>
  );
};

export default Appliances;
