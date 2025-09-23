import React from 'react';
import { motion } from 'framer-motion';
import { Plus, PlusCircle, Zap } from 'lucide-react';

interface AddApplianceButtonProps {
  onClick: () => void;
  variant?: 'fab' | 'card' | 'inline';
  className?: string;
}

export const AddApplianceButton: React.FC<AddApplianceButtonProps> = ({ 
  onClick, 
  variant = 'fab',
  className = '' 
}) => {
  if (variant === 'fab') {
    return (
      <motion.button
        onClick={onClick}
        className={`fixed bottom-6 right-6 w-14 h-14 btn-glass-primary
          rounded-full z-40 flex items-center justify-center 
          group ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          damping: 15, 
          stiffness: 300,
          delay: 0.5 
        }}
      >
        <motion.div
          animate={{ rotate: [0, 90, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Plus className="h-6 w-6" />
        </motion.div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 
          transition-opacity duration-200 pointer-events-none">
          <div className="bg-dark-card text-dark-text text-sm px-3 py-1 rounded-lg shadow-lg 
            border border-dark-surface/50 whitespace-nowrap">
            Add New Appliance
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 
              border-transparent border-t-dark-card"></div>
          </div>
        </div>
      </motion.button>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        onClick={onClick}
        className={`bg-dark-card/40 border-2 border-dashed border-dark-surface/70 hover:border-primary/50 
          rounded-xl p-8 cursor-pointer transition-all duration-300 group
          hover:bg-dark-card/60 hover:scale-[1.02] min-h-[280px] flex flex-col items-center 
          justify-center text-center space-y-4 ${className}`}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-primary/10 p-4 rounded-full border border-primary/20 
            group-hover:bg-primary/20 transition-colors duration-300">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <PlusCircle className="h-12 w-12 text-primary" />
            </motion.div>
          </div>
          
          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 bg-primary/20 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
        
        <div>
          <h3 className="text-lg font-semibold text-dark-text group-hover:text-primary 
            transition-colors duration-300 mb-2">
            Add New Appliance
          </h3>
          <p className="text-dark-textSecondary text-sm leading-relaxed">
            Connect a new smart device to your home automation system
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        
       
         
        </motion.div>
    );
  }

  // Inline variant
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center space-x-2 btn-glass-primary
        px-6 py-3 rounded-xl font-medium ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Plus className="h-5 w-5" />
      <span>Add Appliance</span>
    </motion.button>
  );
};

// Additional specialized button for header/toolbar
export const AddApplianceHeaderButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center space-x-2 btn-glass-primary
        px-4 py-2 rounded-xl font-medium group"
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0, 212, 255, 0.3)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="group-hover:animate-none"
      >
        <Plus className="h-5 w-5" />
      </motion.div>
      <span>Add Device</span>
    </motion.button>
  );
};