import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Lightbulb,
  Fan,
  Wind,
  Monitor,
  Refrigerator,
  Microwave,
  Tv,
  Zap,
  Flame,
  Shirt,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card } from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import { useAppliances } from '../../hooks/useAppliances';
import { useNotification } from '../../contexts/NotificationContext';

interface AddApplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ApplianceType {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

interface FormData {
  name: string;
  type: string;
  location: string;
  brand: string;
  model: string;
  powerUsagePerHour: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

const applianceTypes: ApplianceType[] = [
  {
    value: 'Lighting',
    label: 'Lighting',
    icon: Lightbulb,
    color: '#f59e0b',
    description: 'LED bulbs, lamps, ceiling lights'
  },
  {
    value: 'Fan',
    label: 'Fan',
    icon: Fan,
    color: '#10b981',
    description: 'Ceiling fans, table fans'
  },
  {
    value: 'Air Conditioner',
    label: 'Air Conditioner',
    icon: Wind,
    color: '#0ea5e9',
    description: 'Split AC, window AC, central air'
  },
  {
    value: 'Television',
    label: 'Television',
    icon: Tv,
    color: '#8b5cf6',
    description: 'Smart TV, LED TV, entertainment'
  },
  {
    value: 'Refrigerator',
    label: 'Refrigerator',
    icon: Refrigerator,
    color: '#06b6d4',
    description: 'Fridge, freezer, mini fridge'
  },
  {
    value: 'Washing Machine',
    label: 'Washing Machine',
    icon: Shirt,
    color: '#84cc16',
    description: 'Washer, dryer, laundry'
  },
  {
    value: 'Microwave',
    label: 'Microwave',
    icon: Microwave,
    color: '#f97316',
    description: 'Microwave oven, kitchen appliance'
  },
  {
    value: 'Computer',
    label: 'Computer',
    icon: Monitor,
    color: '#6366f1',
    description: 'Desktop, laptop, monitor'
  },
  {
    value: 'Smart Switch',
    label: 'Smart Switch',
    icon: Zap,
    color: '#ef4444',
    description: 'Smart switches, outlets'
  },
  {
    value: 'Other',
    label: 'Other',
    icon: Zap,
    color: '#64748b',
    description: 'Other smart devices'
  }
];

const locations = [
  'Living Room', 'Bedroom', 'Kitchen', 'Bathroom',
  'Dining Room', 'Study Room', 'Garage', 'Balcony',
  'Guest Room', 'Office', 'Basement', 'Attic', 'Washroom', 'Other'
];

const priorities = [
  { value: 'high', label: 'High Priority', color: '#ef4444', description: 'Critical devices' },
  { value: 'medium', label: 'Medium Priority', color: '#f59e0b', description: 'Important devices' },
  { value: 'low', label: 'Low Priority', color: '#10b981', description: 'Optional devices' }
];

export const AddApplianceModal: React.FC<AddApplianceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addAppliance } = useAppliances();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    location: '',
    brand: '',
    model: '',
    powerUsagePerHour: '',
    priority: 'medium',
    description: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Appliance name is required';
    if (!formData.type) newErrors.type = 'Please select an appliance type';
    if (!formData.location) newErrors.location = 'Please select a location';
    if (formData.powerUsagePerHour && isNaN(Number(formData.powerUsagePerHour))) {
      newErrors.powerUsagePerHour = 'Power rating must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const applianceData = {
        name: formData.name.trim(),
        type: formData.type,
        location: formData.location,
        room: formData.location, // Backend compatibility
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        powerUsagePerHour: formData.powerUsagePerHour ? Number(formData.powerUsagePerHour) : 0,
        power_rating: formData.powerUsagePerHour ? Number(formData.powerUsagePerHour) : 0, // Backend compatibility
        priority: formData.priority,
        description: formData.description.trim()
      };

      const result = await addAppliance(applianceData);

      if (result.success) {
        setShowSuccess(true);
        showNotification({
          type: 'success',
          title: 'Appliance Added Successfully!',
          message: `${formData.name} has been added to your smart home`,
          duration: 4000
        });

        // Reset form and close modal after success animation
        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          onClose();
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to add appliance');
      }
    } catch (error) {
      console.error('Error adding appliance:', error);
      showNotification({
        type: 'error',
        title: 'Failed to Add Appliance',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      location: '',
      brand: '',
      model: '',
      powerUsagePerHour: '',
      priority: 'medium',
      description: ''
    });
    setErrors({});
    setCurrentStep(1);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate essential fields before proceeding
      const hasEssentials = formData.name.trim() && formData.type && formData.location;
      if (hasEssentials) {
        setCurrentStep(2);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="relative">
            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-dark-card/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    className="text-secondary mb-4"
                  >
                    <CheckCircle className="h-16 w-16" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-dark-text mb-2">Success!</h3>
                  <p className="text-dark-textSecondary text-center">
                    Your appliance has been added successfully
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-surface/50">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark-text">Add New Appliance</h2>
                  <p className="text-dark-textSecondary text-sm">
                    Step {currentStep} of 2 - Connect your smart device
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 hover:bg-dark-surface/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-dark-textSecondary" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="flex items-center mb-6">
              <div className="flex items-center space-x-2 w-full">
                <div className={`h-2 flex-1 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-dark-surface'}`} />
                <div className={`h-2 flex-1 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-dark-surface'}`} />
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Appliance Name */}
                  <div>
                    <label className="block text-dark-text font-medium mb-2">
                      Appliance Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Living Room Ceiling Fan"
                      className={`w-full px-4 py-3 bg-dark-surface/50 border rounded-lg text-dark-text placeholder-gray-400 
                        focus:border-primary focus:outline-none transition-colors ${errors.name ? 'border-danger' : 'border-dark-surface'
                        }`}
                    />
                    {errors.name && (
                      <p className="text-danger text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Appliance Type */}
                  <div>
                    <label className="block text-dark-text font-medium mb-3">
                      Appliance Type <span className="text-danger">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {applianceTypes.map((type) => {
                        const IconComponent = type.icon;
                        const isSelected = formData.type === type.value;

                        return (
                          <motion.button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('type', type.value)}
                            className={`p-4 rounded-lg border transition-all duration-200 ${isSelected
                              ? 'border-primary bg-primary/10 scale-105'
                              : 'border-dark-surface/50 hover:border-dark-surface hover:bg-dark-surface/30'
                              }`}
                            whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex flex-col items-center space-y-2">
                              <IconComponent
                                className="h-6 w-6"
                                style={{ color: isSelected ? '#00d4ff' : type.color }}
                              />
                              <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-dark-textSecondary'
                                }`}>
                                {type.label}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    {errors.type && (
                      <p className="text-danger text-sm mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.type}
                      </p>
                    )}
                  </div>

                  {/* Location Selection */}
                  <div>
                    <label className="block text-dark-text font-medium mb-2">
                      Location <span className="text-danger">*</span>
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={`w-full px-4 py-3 bg-dark-surface/50 border rounded-lg text-dark-text 
                        focus:border-primary focus:outline-none transition-colors ${errors.location ? 'border-danger' : 'border-dark-surface'
                        }`}
                    >
                      <option value="">Select a location</option>
                      {locations.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                    {errors.location && (
                      <p className="text-danger text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.name.trim() || !formData.type || !formData.location}
                      className="btn-glass-primary disabled:opacity-50 disabled:cursor-not-allowed 
                        px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
                    >
                      <span>Continue</span>
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Additional Details */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Brand and Model */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-text font-medium mb-2">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="e.g., Samsung, LG, Philips"
                        className="w-full px-4 py-3 bg-dark-surface/50 border border-dark-surface rounded-lg text-dark-text 
                          placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-dark-text font-medium mb-2">Model</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="e.g., ABC-123, XYZ-456"
                        className="w-full px-4 py-3 bg-dark-surface/50 border border-dark-surface rounded-lg text-dark-text 
                          placeholder-gray-400 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Power and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-dark-text font-medium mb-2">Power Rating (Watts)</label>
                      <input
                        type="number"
                        value={formData.powerUsagePerHour}
                        onChange={(e) => handleInputChange('powerUsagePerHour', e.target.value)}
                        placeholder="e.g., 100"
                        min="0"
                        className={`w-full px-4 py-3 bg-dark-surface/50 border rounded-lg text-dark-text 
                          placeholder-gray-400 focus:border-primary focus:outline-none transition-colors ${errors.powerUsagePerHour ? 'border-danger' : 'border-dark-surface'
                          }`}
                      />
                      {errors.powerUsagePerHour && (
                        <p className="text-danger text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.powerUsagePerHour}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-dark-text font-medium mb-2">Priority Level</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value as 'high' | 'medium' | 'low')}
                        className="w-full px-4 py-3 bg-dark-surface/50 border border-dark-surface rounded-lg text-dark-text 
                          focus:border-primary focus:outline-none transition-colors"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-dark-text font-medium mb-2">Description (Optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Additional notes about this appliance..."
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-surface/50 border border-dark-surface rounded-lg text-dark-text 
                        placeholder-gray-400 focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn-glass text-dark-text px-6 py-3 rounded-xl 
                        font-medium flex items-center space-x-2"
                    >
                      <span>← Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-glass-primary disabled:opacity-50 disabled:cursor-not-allowed 
                        px-6 py-3 rounded-xl font-medium flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Add Appliance</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};