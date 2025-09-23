import { useState, useEffect } from 'react';

export interface Appliance {
  uid: string;
  name: string;
  type: string;
  powerUsagePerHour: number;
  state: 'on' | 'off';
  totalUsage: number;
  usageSinceLastTurnedOn: number;
  priorityLevel: number;
  maxOnDuration: number;
  description: string;
  location: string;
  lastTurnedOnTimestamp: number | null;
  lastTurnedOffTimestamp: number | null;
  
  // Optional fields that might not be present in backend response
  monthlyCost?: number;
  dailyCost?: number;
  realisticPowerWatts?: number;
  usageHoursPerDay?: number;
  power_rating?: number; // Backend field
  room?: string; // Backend field
  brand?: string; // Backend field
  model?: string; // Backend field
  priority?: string; // Backend field
  usage_hours?: number; // Backend field
  usage_count?: number; // Backend field
  last_maintenance?: string; // Backend field
  last_state_change?: string; // Backend field
  created_at?: string; // Backend field
  updated_at?: string; // Backend field
  status?: string; // Backend computed field
  power_consumption?: number; // Backend computed field
  uptime?: number; // Backend computed field
  
  validation?: {
    valid: boolean;
    reason?: string;
  };
}

export const useAppliances = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all appliances
  const fetchAppliances = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/appliances`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both old format (array) and new format (object with appliances array)
        if (Array.isArray(data)) {
          setAppliances(data);
        } else if (data.success && Array.isArray(data.appliances)) {
          setAppliances(data.appliances);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Failed to fetch appliances');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching appliances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle appliance state
  const toggleAppliance = async (applianceId: string) => {
    try {
      const currentAppliance = appliances.find(a => a.uid === applianceId);
      if (!currentAppliance) {
        throw new Error('Appliance not found');
      }

      const newState = currentAppliance.state === 'on' ? 'off' : 'on';
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/appliances/${applianceId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState })
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Handle new response format with appliance nested in response
        const updatedAppliance = responseData.appliance || responseData;
        
        setAppliances(prev => prev.map(appliance => 
          appliance.uid === applianceId ? { ...appliance, ...updatedAppliance, state: newState } : appliance
        ));
        return { success: true, appliance: updatedAppliance };
      } else {
        throw new Error('Failed to toggle appliance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error toggling appliance:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Add new appliance
  const addAppliance = async (applianceData: {
    name: string;
    type: string;
    location: string;
    brand?: string;
    model?: string;
    powerUsagePerHour: number;
    priority?: string;
    description?: string;
  }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/appliances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applianceData)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Handle new response format with appliance nested in response
        const newAppliance = responseData.appliance || responseData;
        
        setAppliances(prev => [...prev, newAppliance]);
        return { success: true, appliance: newAppliance };
      } else {
        throw new Error('Failed to add appliance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error adding appliance:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Update appliance details
  const updateAppliance = async (applianceId: string, updateData: Partial<Appliance>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/appliances/${applianceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Handle new response format with appliance nested in response
        const updatedAppliance = responseData.appliance || responseData;
        
        setAppliances(prev => prev.map(appliance => 
          appliance.uid === applianceId ? { ...appliance, ...updatedAppliance } : appliance
        ));
        return { success: true, appliance: updatedAppliance };
      } else {
        throw new Error('Failed to update appliance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating appliance:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Delete appliance
  const deleteAppliance = async (applianceId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/appliances/${applianceId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAppliances(prev => prev.filter(appliance => appliance.uid !== applianceId));
        return { success: true };
      } else {
        throw new Error('Failed to delete appliance');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting appliance:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Calculate statistics
  const statistics = {
    total: appliances.length,
    online: appliances.filter(d => d.state === 'on').length,
    offline: appliances.filter(d => d.state === 'off').length,
    totalPowerConsumption: appliances
      .filter(d => d.state === 'on')
      .reduce((sum, device) => {
        // Handle both old and new field names for power consumption
        const power = device.realisticPowerWatts || device.power_rating || device.powerUsagePerHour || 0;
        return sum + power;
      }, 0),
    totalMonthlyCost: appliances.reduce((sum, device) => {
      // If monthlyCost is not available, calculate a basic estimate
      const monthlyCost = device.monthlyCost || 0;
      return sum + monthlyCost;
    }, 0)
  };

  useEffect(() => {
    fetchAppliances();
  }, []);

  return {
    appliances,
    loading,
    error,
    statistics,
    fetchAppliances,
    toggleAppliance,
    addAppliance,
    updateAppliance,
    deleteAppliance
  };
};