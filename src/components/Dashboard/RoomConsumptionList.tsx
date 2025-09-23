import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { Icon } from '../UI/Icon';
import { RoomConsumption } from '../../types/dashboard.types';

interface RoomConsumptionListProps {
  rooms: RoomConsumption[];
}

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-secondary';
      case 'idle':
        return 'bg-warning';
      case 'off':
        return 'bg-dark-surface';
      default:
        return 'bg-dark-surface';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'idle':
        return 'Idle';
      case 'off':
        return 'Off';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
      <span className="text-xs text-dark-textSecondary">
        {getStatusText(status)}
      </span>
    </div>
  );
};

export const RoomConsumptionList: React.FC<RoomConsumptionListProps> = ({ rooms }) => {
  if (!rooms || rooms.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="h-full">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-dark-text mb-2">
            Room-wise Consumption
          </h3>
          <p className="text-dark-textSecondary">
            Real-time power usage by room and device
          </p>
        </div>

        <div className="space-y-4">
          {rooms.map((room, index) => (
            <motion.div
              key={room.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="border border-dark-surface/50 rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Icon 
                      name={room.icon} 
                      size={20} 
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-text">
                      {room.name}
                    </h4>
                    <StatusIndicator status={room.status} />
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-dark-text">
                    {room.totalUsage}W
                  </div>
                  <div className="text-sm text-secondary">
                    ₹{room.cost}
                  </div>
                </div>
              </div>

              {room.devices.length > 0 && (
                <div className="space-y-2">
                  {room.devices.map((device, deviceIndex) => (
                    <div 
                      key={deviceIndex}
                      className="flex items-center justify-between py-2 px-3 bg-dark-surface/30 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          device.status === 'active' ? 'bg-secondary' : 
                          device.status === 'idle' ? 'bg-warning' : 'bg-dark-surface'
                        }`} />
                        <span className="text-sm text-dark-textSecondary">
                          {device.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-dark-text">
                          {device.usage}W
                        </div>
                        <div className="text-xs text-dark-textSecondary">
                          ₹{device.cost}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
