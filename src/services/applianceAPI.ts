// API service for controlling real backend appliances
export interface BackendAppliance {
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
  last_state_change: string;
  usage_count: number;
  updated_at: string;
}

export interface ApplianceControlResponse {
  success: boolean;
  message: string;
  appliance?: BackendAppliance;
  previous_state?: string;
  new_state?: string;
  error?: string;
}

class ApplianceAPIService {
  private baseURL: string;

  constructor() {
    // Default to localhost:3000, but allow override via environment
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  // Get all appliances from backend
  async getAllAppliances(): Promise<BackendAppliance[]> {
    try {
      console.log('🔌 Fetching appliances from backend...');
      
      const response = await fetch(`${this.baseURL}/appliances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const appliances = await response.json();
      console.log(`✅ Retrieved ${appliances.length} appliances from backend`);
      
      return appliances;
    } catch (error) {
      console.error('❌ Error fetching appliances:', error);
      throw new Error(`Failed to fetch appliances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get specific appliance by UID
  async getAppliance(uid: string): Promise<BackendAppliance> {
    try {
      const response = await fetch(`${this.baseURL}/appliances/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Appliance with ID ${uid} not found`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.appliance;
    } catch (error) {
      console.error(`❌ Error fetching appliance ${uid}:`, error);
      throw error;
    }
  }

  // Control appliance state (turn on/off)
  async controlAppliance(uid: string, state: 'on' | 'off'): Promise<ApplianceControlResponse> {
    try {
      console.log(`🎛️ Controlling appliance ${uid}: ${state}`);
      
      const response = await fetch(`${this.baseURL}/appliances/${uid}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ Backend error:`, result);
        return {
          success: false,
          message: result.error || 'Failed to control appliance',
          error: result.error
        };
      }

      console.log(`✅ Successfully controlled ${uid}: ${state}`);
      return result;
    } catch (error) {
      console.error(`❌ Error controlling appliance ${uid}:`, error);
      return {
        success: false,
        message: 'Network error - could not reach backend',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get appliance state only
  async getApplianceState(uid: string): Promise<{ state: 'on' | 'off'; name: string }> {
    try {
      const response = await fetch(`${this.baseURL}/appliances/${uid}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        state: result.state,
        name: result.name
      };
    } catch (error) {
      console.error(`❌ Error getting appliance state ${uid}:`, error);
      throw error;
    }
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing backend connection...');
      
      const response = await fetch(`${this.baseURL}/appliances/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const health = await response.json();
        console.log('✅ Backend connection successful:', health);
        return true;
      } else {
        console.error('❌ Backend health check failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  }

  // Find appliances by name or type (for voice commands)
  async findAppliancesByName(searchTerm: string): Promise<BackendAppliance[]> {
    try {
      const appliances = await this.getAllAppliances();
      const searchLower = searchTerm.toLowerCase();
      
      return appliances.filter(appliance => 
        appliance.name.toLowerCase().includes(searchLower) ||
        appliance.type.toLowerCase().includes(searchLower) ||
        appliance.location.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('❌ Error searching appliances:', error);
      return [];
    }
  }
}

// Export singleton instance
export const applianceAPI = new ApplianceAPIService();
export default applianceAPI;