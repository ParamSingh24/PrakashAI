import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Tv, Fan, Refrigerator, AirVent, Droplets } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  icon: React.ReactNode;
  isOn: boolean;
  powerConsumption: number;
  currentPower: number;
  temperature?: number;
  humidity?: number;
  channel?: string;
  speed?: number;
  showContent?: boolean;
}

const Simulation: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Bulb',
      icon: <Lightbulb size={40} />,
      isOn: false,
      powerConsumption: 60,
      currentPower: 0
    },
    {
      id: '2',
      name: 'TV',
      icon: <Tv size={40} />,
      isOn: false,
      powerConsumption: 150,
      currentPower: 0,
      channel: 'HDMI 1',
      showContent: false
    },
    {
      id: '3',
      name: 'Fan',
      icon: <Fan size={40} />,
      isOn: false,
      powerConsumption: 100,
      currentPower: 0,
      speed: 0
    },
    {
      id: '4',
      name: 'Refrigerator',
      icon: <Refrigerator size={40} />,
      isOn: false,
      powerConsumption: 200,
      currentPower: 0,
      temperature: 15
    },
    {
      id: '5',
      name: 'AC',
      icon: <AirVent size={40} />,
      isOn: false,
      powerConsumption: 1000,
      currentPower: 0,
      temperature: 24
    },
    {
      id: '6',
      name: 'Geyser',
      icon: <Droplets size={40} />,
      isOn: false,
      powerConsumption: 2000,
      currentPower: 0,
      temperature: 25,
      humidity: 40
    },
  ]);

  const toggleDevice = (id: string) => {
    setDevices(devices.map(device => {
      if (device.id === id) {
        const newState = !device.isOn;
        return {
          ...device,
          isOn: newState,
          currentPower: newState ? device.powerConsumption : 0,
          showContent: device.name === 'TV' ? newState : device.showContent,
          speed: device.name === 'Fan' ? (newState ? 3 : 0) : device.speed,
          temperature: device.name === 'Geyser' && newState ? 60 :
            device.name === 'Refrigerator' && newState ? 4 :
              device.name === 'AC' && newState ? 22 : device.temperature
        };
      }
      return device;
    }));
  };

  const changeFanSpeed = (id: string, increment: boolean = true) => {
    setDevices(devices.map(device => {
      if (device.id === id && device.name === 'Fan') {
        const newSpeed = increment
          ? Math.min(5, (device.speed || 0) + 1)
          : Math.max(0, (device.speed || 0) - 1);

        return {
          ...device,
          speed: newSpeed,
          currentPower: (device.powerConsumption * newSpeed) / 5
        };
      }
      return device;
    }));
  };

  // Update device states over time
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(currentDevices =>
        currentDevices.map(device => {
          if (!device.isOn) return device;

          const updates: Partial<Device> = {};

          // TV channel changes
          if (device.name === 'TV' && Math.random() > 0.95) {
            const channels = ['HDMI 1', 'HDMI 2', 'Netflix', 'YouTube', 'Prime Video'];
            updates.channel = channels[Math.floor(Math.random() * channels.length)];
          }

          // Temperature changes for AC, fridge, geyser
          if (device.name === 'AC' && device.temperature !== undefined) {
            updates.temperature = Math.min(30, Math.max(16, device.temperature + (Math.random() - 0.5)));
          }

          if (device.name === 'Refrigerator' && device.temperature !== undefined) {
            updates.temperature = Math.min(8, Math.max(2, device.temperature + (Math.random() - 0.5)));
          }

          if (device.name === 'Geyser') {
            if (device.humidity !== undefined) {
              updates.humidity = Math.min(100, Math.max(30, device.humidity + (Math.random() * 4 - 2)));
            }
            if (device.temperature !== undefined) {
              updates.temperature = Math.min(80, Math.max(20, device.temperature + (Math.random() - 0.4)));
            }
          }

          // Fan speed variations
          if (device.name === 'Fan' && Math.random() > 0.9) {
            updates.speed = Math.floor(Math.random() * 3) + 1;
          }

          return Object.keys(updates).length > 0 ? { ...device, ...updates } : device;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const calculateTotalPower = () => {
    return Math.round(devices.reduce((total, device) => total + device.currentPower, 0));
  };

  const renderDeviceIcon = (device: Device) => {
    // TV with screen effect
    if (device.name === 'TV') {
      return (
        <div className="relative w-16 h-16 flex items-center justify-center bg-black rounded-lg overflow-hidden">
          {device.isOn ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-80"></div>
              <div className="relative z-10 text-white text-xs text-center p-1">
                <div className="w-8 h-4 bg-red-600 mx-auto mb-1"></div>
                <div className="w-12 h-1 bg-gray-500 mx-auto mb-1"></div>
                <div className="w-10 h-1 bg-gray-400 mx-auto"></div>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <Tv size={32} className="text-gray-600" />
            </div>
          )}
        </div>
      );
    }

    // Refrigerator with cooling effect
    if (device.name === 'Refrigerator') {
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 -m-2 rounded-lg bg-blue-100/20"
            animate={{
              opacity: device.isOn ? [0.2, 0.4, 0.2] : 0,
              scale: device.isOn ? [1, 1.05, 1] : 1
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <div className="relative z-10">
            <Refrigerator size={40} className={device.isOn ? 'text-blue-300' : 'text-gray-400'} />
            {device.isOn && (
              <motion.div
                className="absolute -bottom-1 -right-1 text-xs font-bold text-blue-400"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ❄️
              </motion.div>
            )}
          </div>
          {device.isOn && device.temperature !== undefined && (
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <span className="inline-block bg-gray-700/80 text-xs font-medium text-blue-300 px-2 py-0.5 rounded-full">
                {device.temperature}°C
              </span>
            </div>
          )}
        </div>
      );
    }

    // Geyser with heating effect
    if (device.name === 'Geyser') {
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 -m-2 rounded-full"
            animate={{
              background: device.isOn
                ? ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.2)', 'rgba(239,68,68,0.1)']
                : 'transparent'
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <div className="relative z-10">
            <Droplets size={40} className={device.isOn ? 'text-red-400' : 'text-gray-400'} />
            {device.isOn && (
              <motion.div
                className="absolute -top-2 -right-2 text-xs"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🔥
              </motion.div>
            )}
          </div>
          {device.isOn && device.temperature !== undefined && (
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <span className="inline-block bg-gray-700/80 text-xs font-medium text-red-400 px-2 py-0.5 rounded-full">
                {device.temperature}°C
              </span>
            </div>
          )}
        </div>
      );
    }

    // AC with cooling effect
    if (device.name === 'AC') {
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 -m-2 rounded-full"
            animate={{
              background: device.isOn
                ? ['rgba(147,197,253,0.1)', 'rgba(147,197,253,0.2)', 'rgba(147,197,253,0.1)']
                : 'transparent'
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <div className="relative z-10">
            <AirVent size={40} className={device.isOn ? 'text-blue-300' : 'text-gray-400'} />
          </div>
          {device.isOn && device.temperature !== undefined && (
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <span className="inline-block bg-gray-700/80 text-xs font-medium text-blue-300 px-2 py-0.5 rounded-full">
                {device.temperature}°C
              </span>
            </div>
          )}
        </div>
      );
    }

    // Bulb with glow effect
    if (device.name === 'Bulb') {
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            className={`absolute inset-0 -m-2 rounded-full ${device.isOn ? 'bg-yellow-100' : ''
              }`}
            animate={{
              opacity: device.isOn ? [0.3, 0.5, 0.3] : 0,
              scale: device.isOn ? [1, 1.1, 1] : 1
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <Lightbulb
            size={40}
            fill={device.isOn ? '#facc15' : 'transparent'}
            className={`${device.isOn ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-gray-400'}`}
          />
          {device.isOn && device.temperature !== undefined && (
            <div className="absolute -bottom-5 left-0 right-0 text-center">
              <span className="inline-block bg-gray-700/80 text-xs font-medium text-yellow-400 px-2 py-0.5 rounded-full">
                {device.temperature}°C
              </span>
            </div>
          )}
        </div>
      );
    }

    // Fan with spinning animation and speed control
    if (device.name === 'Fan') {
      // Speed multipliers for each level (1-5)
      const speedMultipliers = [0, 0.5, 1, 1.8, 2.7, 4]; // Speed 0-5
      // Base speed in degrees per second at speed 1
      const baseSpeed = 120; // degrees per second at speed 1
      // Calculate current speed in degrees per second
      const currentSpeed = baseSpeed * speedMultipliers[device.speed || 0];
      // Calculate duration for one full rotation (360°)
      const rotationDuration = currentSpeed > 0 ? (360 / currentSpeed) : 0;

      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            key={`fan-${device.speed}-${device.isOn}`} // Force re-render on speed/state change
            className="relative z-10"
            initial={{ rotate: 0 }}
            animate={{
              rotate: device.isOn ? 360 : 0,
            }}
            transition={{
              duration: device.isOn ? rotationDuration : 0.3,
              ease: 'linear',
              repeat: device.isOn ? Infinity : 0,
              repeatType: 'loop',
              repeatDelay: 0
            }}
            style={{
              transformOrigin: '50% 50%',
              transformBox: 'fill-box',
              display: 'inline-flex',
              scale: device.isOn ? 1.05 : 1,
              transition: 'scale 0.3s ease-in-out',
              willChange: 'transform' // Optimize for animation
            }}
          >
            <Fan size={40} className={device.isOn ? 'text-blue-300' : 'text-gray-400'} />
          </motion.div>

          {/* Airflow effect */}
          {device.isOn && (
            <>
              <motion.div
                className="absolute inset-0 -m-2 rounded-full bg-blue-50/20"
                animate={{
                  opacity: [0.05, 0.15, 0.05],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2 / Math.max(0.5, device.speed || 1),
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <div className="absolute -bottom-5 left-0 right-0 text-center">
                <span className="inline-block bg-gray-700/80 text-xs font-medium text-blue-300 px-2 py-0.5 rounded-full">
                  Speed: {device.speed || 0}/5
                </span>
              </div>
            </>
          )}
        </div>
      );
    }

    // Default device icon
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className={device.isOn ? 'text-blue-300' : 'text-gray-400'}>
          {device.icon}
        </div>
        {device.isOn && device.temperature !== undefined && (
          <div className="absolute -bottom-6 text-xs font-medium text-blue-300">
            {device.temperature}°C
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen serif-optimized relative p-6">
      {/* Subtle Background Effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 radial-bg-primary rounded-full blur-3xl pointer-events-none floating" style={{ animationDelay: '3s' }}></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-cyber-blue serif-optimized">Energy Simulation</h1>
            <p className="text-gray-400 mt-1 serif-optimized">Monitor and control your smart devices</p>
          </div>
          <div className="glass-card p-4 rounded-xl w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Lightbulb className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 serif-optimized">Total Power Usage</p>
                <p className="text-lg font-semibold text-white serif-optimized">
                  {calculateTotalPower()} <span className="text-sm text-gray-400">Watts</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <motion.div
              key={device.id}
              className={`glass-card rounded-xl p-6 card-3d-subtle transition-all duration-300 border ${
                device.isOn ? 'border-blue-500/30 glow-effect' : 'border-gray-700'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: parseInt(device.id) * 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white serif-optimized">{device.name}</h3>
                  <p className={`text-sm ${device.isOn ? 'text-blue-400' : 'text-gray-500'}`}>
                    {device.isOn ? 'ON' : 'OFF'}
                  </p>
                </div>
                {renderDeviceIcon(device)}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400 serif-optimized">Power Usage</span>
                  <span className="text-sm font-medium text-white serif-optimized">
                    {device.currentPower}W
                  </span>
                </div>

                {device.name === 'Fan' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 serif-optimized">Speed Control</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if ((device.speed || 0) > 0) {
                              changeFanSpeed(device.id, false);
                            }
                          }}
                          disabled={(device.speed || 0) <= 0 || !device.isOn}
                          className="w-8 h-8 flex items-center justify-center rounded-full btn-glass text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="text-sm font-bold">-</span>
                        </button>
                        <div className="w-12 text-center text-lg font-bold text-cyber-blue serif-optimized">
                          {device.speed || 0}/5
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if ((device.speed || 0) < 5) {
                              changeFanSpeed(device.id, true);
                            }
                          }}
                          disabled={(device.speed || 0) >= 5 || !device.isOn}
                          className="w-8 h-8 flex items-center justify-center rounded-full btn-glass text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="text-sm font-bold">+</span>
                        </button>
                      </div>
                    </div>
                    <div className="w-full glass rounded-full h-3 mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${(device.speed || 0) * 20}%`,
                          boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleDevice(device.id)}
                  className={`w-full mt-4 py-3 px-4 rounded-xl font-medium serif-optimized ${
                    device.isOn
                      ? 'btn-glass-danger'
                      : 'btn-glass-primary'
                  }`}
                >
                  {device.isOn ? 'Turn Off' : 'Turn On'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
