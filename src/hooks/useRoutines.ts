import { useState, useEffect } from 'react';

export interface RoutineAction {
  applianceId: string;
  command: 'turnOn' | 'turnOff';
}

export interface RoutineSchedule {
  time: string;
  days: string[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  schedule: RoutineSchedule;
  actions: RoutineAction[];
  createdBy?: 'ai' | 'manual';
  isActive?: boolean;
  lastExecuted?: string;
  createdAt?: string;
}

export interface CreateRoutineData {
  name: string;
  description: string;
  schedule: RoutineSchedule;
  actions: RoutineAction[];
}

export const useRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all routines
  const fetchRoutines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/routines`;
      console.log('🔄 Fetching routines from:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Routines data received:', data);
        console.log('📊 Number of routines:', data.length);
        setRoutines(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error fetching routines:', err);
      console.error('🔍 Error details:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create new routine
  const createRoutine = async (routineData: CreateRoutineData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...routineData,
          createdBy: 'manual',
          isActive: true,
          createdAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const newRoutine = await response.json();
        setRoutines(prev => [...prev, newRoutine]);
        return { success: true, routine: newRoutine };
      } else {
        throw new Error('Failed to create routine');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error creating routine:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Update routine
  const updateRoutine = async (routineId: string, updateData: Partial<Routine>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/routines/${routineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const updatedRoutine = await response.json();
        setRoutines(prev => prev.map(routine => 
          routine.id === routineId ? updatedRoutine : routine
        ));
        return { success: true, routine: updatedRoutine };
      } else {
        throw new Error('Failed to update routine');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating routine:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Delete routine
  const deleteRoutine = async (routineId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/routines/${routineId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setRoutines(prev => prev.filter(routine => routine.id !== routineId));
        return { success: true };
      } else {
        throw new Error('Failed to delete routine');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting routine:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Execute routine manually
  const executeRoutine = async (routineId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/routines/${routineId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Update last executed timestamp
        setRoutines(prev => prev.map(routine => 
          routine.id === routineId 
            ? { ...routine, lastExecuted: new Date().toISOString() }
            : routine
        ));
        return { success: true };
      } else {
        throw new Error('Failed to execute routine');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error executing routine:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Toggle routine active status
  const toggleRoutineStatus = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return { success: false, error: 'Routine not found' };

    const newStatus = !routine.isActive;
    return await updateRoutine(routineId, { isActive: newStatus });
  };

  // Get AI routine suggestion
  const getAIRoutineSuggestion = async (prompt: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a routine based on this description: ${prompt}. Return the response in JSON format with name, description, schedule, and actions.`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, suggestion: data };
      } else {
        throw new Error('Failed to get AI suggestion');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error getting AI suggestion:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Calculate statistics
  const statistics = {
    total: routines.length,
    active: routines.filter(r => r.isActive !== false).length,
    inactive: routines.filter(r => r.isActive === false).length,
    aiCreated: routines.filter(r => r.createdBy === 'ai').length,
    manualCreated: routines.filter(r => r.createdBy === 'manual').length
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  return {
    routines,
    loading,
    error,
    statistics,
    fetchRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    executeRoutine,
    toggleRoutineStatus,
    getAIRoutineSuggestion
  };
};
