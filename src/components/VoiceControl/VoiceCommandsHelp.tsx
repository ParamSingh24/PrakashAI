import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Mic, Volume2 } from 'lucide-react';

interface VoiceCommandsHelpProps {
  appliances: Array<{
    name: string;
    location?: string;
    type: string;
  }>;
}

const VoiceCommandsHelp: React.FC<VoiceCommandsHelpProps> = ({ appliances }) => {
  const [isOpen, setIsOpen] = useState(false);

  const commandExamples = [
    {
      category: "Basic Commands",
      commands: [
        "Turn on [device name]",
        "Turn off [device name]",
        "Switch on the [device name]",
        "Switch off the [device name]",
        "Start the [device name]",
        "Stop the [device name]",
        "Activate [device name]",
        "Deactivate [device name]",
        "Power on [device name]",
        "Power off [device name]"
      ]
    }
  ];

  const deviceExamples = appliances.slice(0, 5).map(appliance => ({
    name: appliance.name,
    location: appliance.location,
    examples: [
      `Turn on ${appliance.name}`,
      `Turn off the ${appliance.name}`,
      appliance.location ? `Switch on ${appliance.location} ${appliance.type}` : null
    ].filter(Boolean)
  }));

  return (
    <>
      {/* Help Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="absolute -top-2 -left-2 bg-dark-card/90 hover:bg-dark-card border border-dark-surface/50 rounded-full p-2 shadow-lg backdrop-blur-sm transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <HelpCircle className="h-4 w-4 text-dark-textSecondary" />
      </motion.button>

      {/* Help Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-dark-card/95 backdrop-blur-xl border border-dark-surface/50 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Mic className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading text-dark-text">Voice Commands</h2>
                    <p className="text-dark-textSecondary text-sm">Learn how to control your devices with voice</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-dark-surface/50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-dark-textSecondary" />
                </button>
              </div>

              {/* Getting Started */}
              <div className="mb-6">
                <h3 className="text-lg font-accent text-dark-text mb-3 flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <span>Getting Started</span>
                </h3>
                <div className="bg-dark-surface/30 rounded-lg p-4 border border-dark-surface/50">
                  <ol className="space-y-2 text-dark-textSecondary">
                    <li className="flex items-start space-x-2">
                      <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                      <span>Click the voice control button (microphone icon)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                      <span>Wait for the "Listening..." indicator</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                      <span>Speak your command clearly</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                      <span>Wait for confirmation and action</span>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Command Patterns */}
              <div className="mb-6">
                <h3 className="text-lg font-accent text-dark-text mb-3">Command Patterns</h3>
                <div className="grid gap-4">
                  {commandExamples.map((category, index) => (
                    <div key={index} className="bg-dark-surface/30 rounded-lg p-4 border border-dark-surface/50">
                      <h4 className="font-medium text-dark-text mb-3">{category.category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {category.commands.map((command, cmdIndex) => (
                          <div key={cmdIndex} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            <code className="text-dark-textSecondary bg-dark-bg/50 px-2 py-1 rounded text-xs">
                              {command}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Devices */}
              {deviceExamples.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-accent text-dark-text mb-3">Examples with Your Devices</h3>
                  <div className="space-y-3">
                    {deviceExamples.map((device, index) => (
                      <div key={index} className="bg-dark-surface/30 rounded-lg p-4 border border-dark-surface/50">
                        <h4 className="font-medium text-dark-text mb-2 flex items-center space-x-2">
                          <span>{device.name}</span>
                          {device.location && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                              {device.location}
                            </span>
                          )}
                        </h4>
                        <div className="space-y-1">
                          {device.examples.map((example, exIndex) => (
                            <div key={exIndex} className="flex items-center space-x-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0"></div>
                              <code className="text-dark-textSecondary bg-dark-bg/50 px-2 py-1 rounded text-xs">
                                "{example}"
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <h3 className="text-lg font-accent text-dark-text mb-3">💡 Tips for Better Recognition</h3>
                <ul className="space-y-2 text-dark-textSecondary text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Speak clearly and at a normal pace</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Use the exact device names as shown in your appliances list</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Minimize background noise for better accuracy</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>If a command fails, try rephrasing it</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>Allow microphone access when prompted by your browser</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceCommandsHelp;