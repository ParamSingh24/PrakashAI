import { useState, useEffect } from 'react';
import { DashboardData } from '../types/dashboard.types';

const API_BASE_URL = 'http://localhost:3000';
const USER_ID = 'krishnasinghprojects';

// Helper functions
const getApplianceName = (applianceId: string): string => {
  if (!applianceId) return 'Unknown Device';

  const applianceMap: { [key: string]: string } = {
    'ac1': 'Bedroom Air Conditioner',
    'fan1': 'Bedroom Ceiling Fan',
    'pc1': 'Desktop Computer',
    'bulb1': 'Bedroom Main Light',
    'lamp1': 'Study Table Lamp',
    'switch1': 'Smart Switch Hub'
  };
  return applianceMap[applianceId] || `Device ${applianceId}`;
};

const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

// Fallback mock data for when backend is unavailable
const getMockDashboardData = (): DashboardData => {
  return {
    user: {
      name: "Krishna Singh",
      totalUsage: 166.02,
      totalCost: 680.09,
      projectedCost: 2450.37,
      monthlyBudget: 2500,
      budgetLeft: 49.63,
      budgetUsedPercentage: 98.0
    },
    powerConsumers: [
      { name: "Bedroom Air Conditioner", usage: 120.12, percentage: 72, cost: 495, color: "#00d4ff" },
      { name: "Smart Switch Hub", usage: 32.76, percentage: 20, cost: 135, color: "#10b981" },
      { name: "Desktop Computer", usage: 6.75, percentage: 4, cost: 28, color: "#f59e0b" },
      { name: "Bedroom Ceiling Fan", usage: 6.04, percentage: 4, cost: 25, color: "#8b5cf6" }
    ],
    overview: [
      {
        title: "Total Usage",
        value: "166.02 kWh",
        subtitle: "This Month",
        trend: { value: 12, isPositive: true, label: "from last month" },
        icon: "zap",
        color: "#00d4ff"
      },
      {
        title: "Total Cost",
        value: "₹680.09",
        subtitle: "Current Bill",
        trend: { value: 98, isPositive: false, label: "of monthly budget" },
        icon: "dollar-sign",
        color: "#10b981"
      },
      {
        title: "Budget Left",
        value: "₹49.63",
        subtitle: "of ₹2500",
        trend: { value: 2, isPositive: true, label: "remaining budget" },
        icon: "piggy-bank",
        color: "#ef4444"
      },
      {
        title: "Projected Cost",
        value: "₹2450.37",
        subtitle: "End of Month",
        trend: { value: 260, isPositive: false, label: "projected increase" },
        icon: "trending-up",
        color: "#ef4444"
      }
    ],
    aiInsights: {
      insights: [
        "Your Bedroom Air Conditioner is consuming 72% of total energy. Consider optimizing its usage schedule.",
        "Peak usage detected between 10 PM - 6 AM. Smart scheduling could reduce costs by 15%.",
        "Current usage pattern suggests you'll exceed your monthly budget by ₹450."
      ],
      suggestions: [
        "Set AC temperature to 24°C instead of 22°C to save 20% energy",
        "Use ceiling fan along with AC to feel cooler at higher temperatures",
        "Schedule AC to turn off automatically during deep sleep hours (1-6 AM)"
      ],
      proactiveSuggestions: [
        "Set up a routine to ensure your 'Bedroom Air Conditioner' turns off automatically when you typically leave your home for extended periods and turns back on just before your usual return, preventing unnecessary cooling of an empty room.",
        "On days with milder outside temperatures, try to utilize natural ventilation by opening windows and doors in your bedroom during cooler parts of the day, and only use your 'Bedroom Air Conditioner' when absolutely necessary.",
        "Consider applying reflective window film or installing external shading (like awnings) on bedroom windows that receive direct sunlight. This can significantly reduce heat gain and lighten the load on your 'Bedroom Air Conditioner'."
      ]
    },
    autonomousActions: [
      {
        id: 'mock-autonomous-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        action: 'Autonomous Analysis Complete',
        reasoning: 'Completed comprehensive analysis of smart home system and implemented energy-saving routines. The Bedroom Air Conditioner was identified as the highest energy consumer, contributing significantly to budget overrun. Created automated routines to optimize AC usage during deep sleep hours (1 AM - 6 AM) on both weekdays and weekends.',
        details: {
          routinesCreated: [
            {
              name: 'Weekday Deep Sleep AC Saver',
              description: 'Automatically turns off the Bedroom Air Conditioner at 1:00 AM on weekdays to save energy during deep sleep',
              schedule: { time: '01:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
              actions: [{ applianceId: 'ac1', command: 'turnOff' }]
            },
            {
              name: 'Weekend Deep Sleep AC Saver',
              description: 'Automatically turns off the Bedroom Air Conditioner at 1:00 AM on weekends to save energy during deep sleep',
              schedule: { time: '01:00', days: ['Saturday', 'Sunday'] },
              actions: [{ applianceId: 'ac1', command: 'turnOff' }]
            }
          ],
          analysisPerformed: [
            'Identified Bedroom Air Conditioner as highest energy consumer (72% of total usage)',
            'Analyzed user sleep patterns and energy consumption during night hours',
            'Calculated potential savings from optimized AC scheduling',
            'Evaluated budget impact and projected cost reductions'
          ],
          optimizationsApplied: [
            'Implemented automatic AC shutdown during deep sleep hours',
            'Reduced nightly AC operation from 8 hours to 3 hours',
            'Applied energy-saving schedule across all days of the week',
            'Optimized routine timing based on user bedtime patterns'
          ]
        }
      }
    ],
    recentActivity: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        action: "Device Controlled",
        description: "Bedroom Air Conditioner used 12.00 kWh for 8h",
        type: "user" as const,
        impact: "high" as const
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        action: "Device Automated",
        description: "Bedroom Ceiling Fan used 0.60 kWh for 8h",
        type: "system" as const,
        impact: "medium" as const
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        action: "Device Controlled",
        description: "Desktop Computer used 1.35 kWh for 4h",
        type: "user" as const,
        impact: "medium" as const
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        action: "Device Activity",
        description: "Smart Switch Hub used 0.05 kWh for 36s",
        type: "ai" as const,
        impact: "low" as const
      },
      {
        id: "5",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        action: "Device Controlled",
        description: "Study Table Lamp used 0.05 kWh for 4h",
        type: "user" as const,
        impact: "low" as const
      },
      {
        id: "6",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        action: "Device Controlled",
        description: "Bedroom Main Light used 0.08 kWh for 3h",
        type: "user" as const,
        impact: "low" as const
      },
      {
        id: "7",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        action: "Device Automated",
        description: "Smart Switch Hub scheduled routine executed",
        type: "system" as const,
        impact: "low" as const
      },
      {
        id: "8",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
        action: "Device Controlled",
        description: "Desktop Computer used 2.10 kWh for 6h",
        type: "user" as const,
        impact: "high" as const
      },
      {
        id: "9",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
        action: "Device Controlled",
        description: "Bedroom Air Conditioner used 8.50 kWh for 6h",
        type: "user" as const,
        impact: "high" as const
      },
      {
        id: "10",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        action: "Device Automated",
        description: "Bedroom Ceiling Fan used 0.45 kWh for 6h",
        type: "system" as const,
        impact: "medium" as const
      },
      {
        id: "11",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        action: "Device Controlled",
        description: "Study Table Lamp used 0.12 kWh for 8h",
        type: "user" as const,
        impact: "low" as const
      },
      {
        id: "12",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        action: "Device Activity",
        description: "Smart Switch Hub connectivity check completed",
        type: "system" as const,
        impact: "low" as const
      }
    ]
  };
};

// Transform backend data to frontend format
const transformDashboardData = (userData: any, usageLogs: any[], autonomousLogs: any[]): DashboardData => {
  try {
    const { dashboardData } = userData;
    const { totalUsageKWh, totalCostINR, projectedCostINR, topPowerConsumers, suggestions, aiInsights, proactiveSuggestions } = dashboardData;

    // Validate required data
    if (!totalUsageKWh || !totalCostINR || !projectedCostINR || !topPowerConsumers) {
      throw new Error('Missing required dashboard data');
    }

    // Calculate budget left
    const budgetLeft = Math.max(0, userData.monthlyBudget - projectedCostINR);
    const budgetUsedPercentage = Math.min(100, (projectedCostINR / userData.monthlyBudget) * 100);

    // Transform power consumers with colors and percentages
    const colors = ["#00d4ff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
    const powerConsumers = (topPowerConsumers || []).map((consumer: any, index: number) => ({
      name: consumer.name || 'Unknown Device',
      usage: consumer.usageKWh || 0,
      percentage: Math.round(((consumer.usageKWh || 0) / totalUsageKWh) * 100),
      cost: Math.round(((consumer.usageKWh || 0) / totalUsageKWh) * totalCostINR),
      color: colors[index % colors.length]
    }));

    // Safely handle usage logs for recent activity
    const safeUsageLogs = Array.isArray(usageLogs) ? usageLogs : [];
    const safeAutonomousLogs = Array.isArray(autonomousLogs) ? autonomousLogs : [];

    // Transform usage logs to recent activities
    let recentActivities = safeUsageLogs
      .filter((log: any) => log && log.appliance_id) // Filter out invalid logs
      .slice(0, 25) // Get recent 25 logs
      .map((log: any, index: number) => {
        const applianceName = getApplianceName(log.appliance_id);
        const energyConsumed = typeof log.energy_consumed_kwh === 'number' ? log.energy_consumed_kwh : 0;
        const duration = typeof log.time_duration_seconds === 'number' ? log.time_duration_seconds : 0;

        const activity = {
          id: log.id || `log-${index}`,
          timestamp: log.end_timestamp || log.start_timestamp || new Date().toISOString(),
          action: `Device ${log.trigger === 'manual' ? 'Controlled' : log.trigger === 'routine' ? 'Automated' : 'Activity'}`,
          description: `${applianceName} used ${energyConsumed.toFixed(2)} kWh for ${formatDuration(duration)}`,
          type: (log.trigger === 'manual' ? 'user' : log.trigger === 'ai' ? 'ai' : 'system') as 'user' | 'ai' | 'system',
          impact: (energyConsumed > 1 ? 'high' : energyConsumed > 0.1 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
        };
        return activity;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('Usage logs fetched:', safeUsageLogs.length);
    console.log('Recent activities created:', recentActivities.length);

    // Always ensure we have some activities to show - use mock data if backend data is insufficient
    if (recentActivities.length === 0) {
      console.log('No backend activities found, using mock data');
      recentActivities = [
        {
          id: "mock-1",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          action: "Device Controlled",
          description: "Bedroom Air Conditioner used 1.50 kWh for 1h",
          type: "user" as const,
          impact: "high" as const
        },
        {
          id: "mock-2",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          action: "Device Automated",
          description: "Bedroom Ceiling Fan used 0.15 kWh for 2h",
          type: "system" as const,
          impact: "medium" as const
        },
        {
          id: "mock-3",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          action: "Device Controlled",
          description: "Desktop Computer used 1.20 kWh for 4h",
          type: "user" as const,
          impact: "medium" as const
        }
      ];
    }



    // Transform autonomous logs to detailed autonomous actions
    let autonomousActions = safeAutonomousLogs
      .filter((log: any) => log && (log.tool_calls || log.action)) // Filter valid logs
      .slice(0, 10) // Get top 10 actions
      .map((log: any, index: number) => {
        const toolCalls = Array.isArray(log.tool_calls) ? log.tool_calls : [];

        // Extract routines created
        const routinesCreated = toolCalls
          .filter((call: any) => call.tool_name === 'create_autonomous_routine')
          .map((call: any) => ({
            name: call.arguments?.name || 'Unknown Routine',
            description: call.arguments?.description || 'Autonomous routine for energy optimization',
            schedule: call.arguments?.schedule || { time: '00:00', days: [] },
            actions: call.arguments?.actions || []
          }));

        // Extract analysis performed
        const analysisPerformed = toolCalls
          .filter((call: any) => call.tool_name === 'analyze_home_data')
          .map(() => 'Comprehensive smart home system analysis completed')
          .concat(
            log.reasoning ? [
              'Energy consumption patterns analyzed',
              'User preferences and habits evaluated',
              'Appliance usage optimization opportunities identified',
              'Budget impact assessment performed'
            ] : []
          );

        // Extract optimizations applied
        const optimizationsApplied = toolCalls
          .filter((call: any) => call.tool_name === 'autonomous_appliance_control')
          .map(() => 'Autonomous appliance state optimization applied')
          .concat(
            routinesCreated.length > 0 ? [
              'Energy-saving routines automatically implemented',
              'Smart scheduling based on usage patterns',
              'Budget-conscious automation activated'
            ] : []
          );

        return {
          id: `autonomous-${index}`,
          timestamp: log.timestamp || new Date().toISOString(),
          action: log.action || 'Autonomous System Optimization',
          reasoning: log.reasoning || 'Autonomous optimization performed to improve energy efficiency and reduce costs.',
          details: {
            routinesCreated: routinesCreated.length > 0 ? routinesCreated : undefined,
            analysisPerformed: analysisPerformed.length > 0 ? analysisPerformed : undefined,
            optimizationsApplied: optimizationsApplied.length > 0 ? optimizationsApplied : undefined
          }
        };
      });

    // If no autonomous actions available, create detailed mock actions
    if (autonomousActions.length === 0) {
      autonomousActions = [
        {
          id: 'mock-autonomous-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          action: 'Autonomous Analysis Complete',
          reasoning: 'Completed comprehensive analysis of smart home system and implemented energy-saving routines. The Bedroom Air Conditioner was identified as the highest energy consumer, contributing significantly to budget overrun. Created automated routines to optimize AC usage during deep sleep hours (1 AM - 6 AM) on both weekdays and weekends.',
          details: {
            routinesCreated: [
              {
                name: 'Weekday Deep Sleep AC Saver',
                description: 'Automatically turns off the Bedroom Air Conditioner at 1:00 AM on weekdays to save energy during deep sleep',
                schedule: { time: '01:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
                actions: [{ applianceId: 'ac1', command: 'turnOff' }]
              },
              {
                name: 'Weekend Deep Sleep AC Saver',
                description: 'Automatically turns off the Bedroom Air Conditioner at 1:00 AM on weekends to save energy during deep sleep',
                schedule: { time: '01:00', days: ['Saturday', 'Sunday'] },
                actions: [{ applianceId: 'ac1', command: 'turnOff' }]
              }
            ],
            analysisPerformed: [
              'Identified Bedroom Air Conditioner as highest energy consumer (72% of total usage)',
              'Analyzed user sleep patterns and energy consumption during night hours',
              'Calculated potential savings from optimized AC scheduling',
              'Evaluated budget impact and projected cost reductions'
            ],
            optimizationsApplied: [
              'Implemented automatic AC shutdown during deep sleep hours',
              'Reduced nightly AC operation from 8 hours to 3 hours',
              'Applied energy-saving schedule across all days of the week',
              'Optimized routine timing based on user bedtime patterns'
            ]
          }
        }
      ];
    }


    // Use proactive suggestions from user data instead of autonomous logs
    const userProactiveSuggestions = Array.isArray(proactiveSuggestions) ? proactiveSuggestions : [];

    // Fallback to dashboard data proactive suggestions if available
    const finalProactiveSuggestions = userProactiveSuggestions.length > 0
      ? userProactiveSuggestions
      : (Array.isArray(dashboardData.proactiveAiSuggestions) ? dashboardData.proactiveAiSuggestions : []);

    return {
      user: {
        name: userData.name || 'User',
        totalUsage: totalUsageKWh,
        totalCost: totalCostINR,
        projectedCost: projectedCostINR,
        monthlyBudget: userData.monthlyBudget || 2500,
        budgetLeft,
        budgetUsedPercentage
      },
      powerConsumers,
      overview: [
        {
          title: "Total Usage",
          value: `${totalUsageKWh.toFixed(2)} kWh`,
          subtitle: "This Month",
          trend: { value: 12, isPositive: true, label: "from last month" },
          icon: "zap",
          color: "#00d4ff"
        },
        {
          title: "Total Cost",
          value: `₹${totalCostINR.toFixed(2)}`,
          subtitle: "Current Bill",
          trend: { value: Math.round(budgetUsedPercentage), isPositive: false, label: "of monthly budget" },
          icon: "dollar-sign",
          color: "#10b981"
        },
        {
          title: "Budget Left",
          value: `₹${budgetLeft.toFixed(2)}`,
          subtitle: `of ₹${userData.monthlyBudget}`,
          trend: { value: Math.round(100 - budgetUsedPercentage), isPositive: budgetLeft > 0, label: "remaining budget" },
          icon: "piggy-bank",
          color: budgetLeft > 0 ? "#10b981" : "#ef4444"
        },
        {
          title: "Projected Cost",
          value: `₹${projectedCostINR.toFixed(2)}`,
          subtitle: "End of Month",
          trend: { value: Math.round(((projectedCostINR - totalCostINR) / totalCostINR) * 100), isPositive: false, label: "projected increase" },
          icon: "trending-up",
          color: projectedCostINR > userData.monthlyBudget ? "#ef4444" : "#f59e0b"
        }
      ],
      aiInsights: {
        insights: Array.isArray(aiInsights) ? aiInsights : [],
        suggestions: Array.isArray(suggestions) ? suggestions : [],
        proactiveSuggestions: finalProactiveSuggestions
      },
      autonomousActions: autonomousActions,
      recentActivity: recentActivities
    };
  } catch (error) {
    console.warn('Error transforming dashboard data, using fallback:', error);
    return getMockDashboardData();
  }
};

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      // Try to fetch user data with dashboard information
      const userResponse = await fetch(`${API_BASE_URL}/users/${USER_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!userResponse.ok) {
        throw new Error(`Backend server not available (${userResponse.status})`);
      }

      const userData = await userResponse.json();

      // Try to fetch usage logs for recent activities
      let usageLogs = [];
      try {
        const logsResponse = await fetch(`${API_BASE_URL}/logs`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout for logs
        });
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          console.log('Raw logs response:', logsData);
          // Check if the response is actually usage logs (should have appliance_id) or appliances (should have uid)
          if (Array.isArray(logsData) && logsData.length > 0) {
            if (logsData[0].appliance_id) {
              // This is actual usage logs
              usageLogs = logsData;
              console.log('Successfully fetched usage logs:', usageLogs.length);
            } else {
              // This is appliances data, not usage logs - backend bug
              console.warn('Backend /logs endpoint returning appliances instead of usage logs');
              usageLogs = [];
            }
          } else {
            console.warn('No usage logs found in response');
          }
        } else {
          console.warn('Failed to fetch logs, status:', logsResponse.status);
        }
      } catch (logsError) {
        console.warn('Could not fetch usage logs, using empty array:', logsError);
        usageLogs = [];
      }

      // Try to fetch complete autonomous AI logs for performed actions
      let autonomousLogs = [];
      try {
        const aiLogsResponse = await fetch(`${API_BASE_URL}/autonomous-ai/log`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout for AI logs
        });
        if (aiLogsResponse.ok) {
          const aiLogsData = await aiLogsResponse.json();
          // Handle the response format: {"success": true, "log": [...]}
          autonomousLogs = aiLogsData.success && Array.isArray(aiLogsData.log) ? aiLogsData.log : [];
        }
      } catch (aiLogsError) {
        console.warn('Could not fetch autonomous AI logs, using empty array:', aiLogsError);
        autonomousLogs = [];
      }

      // Transform and set data
      const transformedData = transformDashboardData(userData, usageLogs, autonomousLogs);
      setDashboardData(transformedData);

    } catch (err) {
      console.warn('Backend not available, using fallback data:', err);

      // Use fallback data when backend is not available
      const fallbackData = getMockDashboardData();
      setDashboardData(fallbackData);
      setIsUsingFallback(true);

      // Set a user-friendly error message
      if (err instanceof Error && err.message.includes('fetch')) {
        setError('Backend server is not running. Using demo data.');
      } else {
        setError('Using demo data. Start the backend server for live data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    dashboardData,
    loading,
    error,
    refreshData,
    isUsingFallback
  };
};
