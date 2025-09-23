export interface User {
  name: string;
  totalUsage: number; // kWh
  totalCost: number; // ₹
  projectedCost: number; // ₹
  monthlyBudget: number; // ₹
  budgetLeft: number; // ₹
  budgetUsedPercentage: number; // %
}

export interface PowerConsumer {
  name: string;
  usage: number; // kWh
  percentage: number;
  cost: number; // ₹
  color: string;
}

export interface RoomDevice {
  name: string;
  usage: number; // W
  cost: number; // ₹
  status: 'active' | 'idle' | 'off';
}

export interface RoomConsumption {
  name: string;
  devices: RoomDevice[];
  totalUsage: number; // W
  cost: number; // ₹
  status: 'active' | 'idle' | 'off';
  icon: string;
}

export interface OverviewCard {
  title: string;
  value: string;
  subtitle: string;
  trend: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon: string;
  color: string;
}

export interface AIInsights {
  insights: string[];
  suggestions: string[];
  proactiveSuggestions: string[];
}

export interface AutonomousAction {
  id: string;
  timestamp: string;
  action: string;
  reasoning: string;
  details: {
    routinesCreated?: Array<{
      name: string;
      description: string;
      schedule: {
        time: string;
        days: string[];
      };
      actions: Array<{
        applianceId: string;
        command: string;
      }>;
    }>;
    analysisPerformed?: string[];
    optimizationsApplied?: string[];
  };
}

export interface RecentActivity {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  type: 'ai' | 'user' | 'system';
  impact: 'low' | 'medium' | 'high';
}

export interface SavingsMetric {
  title: string;
  amount: number;
  percentage: number;
  period: string;
  trend: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon: string;
  color: string;
}

export interface SavingsGoal {
  title: string;
  target: number;
  current: number;
  percentage: number;
  deadline: string;
  color: string;
}

export interface SavingsAnalysisData {
  totalSavings: number;
  monthlySavings: number;
  yearlyProjection: number;
  metrics: SavingsMetric[];
  goals: SavingsGoal[];
  recommendations: string[];
}

export interface DashboardData {
  user: User;
  powerConsumers: PowerConsumer[];
  roomConsumption?: RoomConsumption[];
  overview: OverviewCard[];
  aiInsights?: AIInsights;
  autonomousActions?: AutonomousAction[];
  savingsAnalysis?: SavingsAnalysisData;
  recentActivity: RecentActivity[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
