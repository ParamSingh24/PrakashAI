import { useCallback } from 'react';
import { useMultiLanguageVoice } from './useMultiLanguageVoice';
import { useChatterboxTTS } from './useChatterboxTTS';
import { DashboardData } from '../types/dashboard.types';

export const useDashboardReader = () => {
  const { getTranslation } = useMultiLanguageVoice();
  const { speakChunked, selectedLanguage } = useChatterboxTTS();

  const formatCurrency = useCallback((amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0 rupees';
    }
    return `${amount.toLocaleString()} rupees`;
  }, []);

  const formatPercentage = useCallback((value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0 percent';
    }
    return `${value} percent`;
  }, []);

  const formatPower = useCallback((value: number, unit: string = 'kWh') => {
    if (value === undefined || value === null || isNaN(value)) {
      return `0 ${unit}`;
    }
    return `${value} ${unit}`;
  }, []);

  const readOverviewCards = useCallback((overview: any[]) => {
    let content = '';
    
    if (overview && overview.length > 0) {
      overview.forEach((card) => {
        if (card.title && card.value) {
          content += `${card.title} is ${card.value}. `;
          if (card.subtitle) {
            content += `${card.subtitle}. `;
          }
          if (card.trend) {
            const trendDirection = card.trend.isPositive ? 'increased' : 'decreased';
            content += `This has ${trendDirection} by ${card.trend.value} percent ${card.trend.label}. `;
          }
        }
      });
    }

    return content;
  }, []);

  const readPowerConsumers = useCallback((powerConsumers: any[]) => {
    let content = 'Power consumption by appliances: ';
    
    if (powerConsumers && powerConsumers.length > 0) {
      powerConsumers.forEach((consumer) => {
        const usage = consumer.usage || consumer.consumption || 0;
        const percentage = consumer.percentage || 0;
        content += `${consumer.name || 'Unknown device'} consumes ${formatPower(usage, 'kWh')}`;
        if (percentage > 0) {
          content += `, which is ${formatPercentage(percentage)} of total consumption`;
        }
        content += '. ';
      });
    }

    return content;
  }, [formatPower, formatPercentage]);

  const readRoomConsumption = useCallback((rooms: any[]) => {
    let content = 'Room wise energy consumption: ';
    
    if (rooms && rooms.length > 0) {
      rooms.forEach((room) => {
        const roomUsage = room.totalUsage || room.consumption || 0;
        content += `${room.name || 'Unknown room'} consumes ${formatPower(roomUsage, 'watts')}. `;
        if (room.devices && room.devices.length > 0) {
          content += `Main devices are: `;
          room.devices.forEach((device: any, index: number) => {
            const deviceUsage = device.usage || device.consumption || 0;
            content += `${device.name || 'Unknown device'} using ${formatPower(deviceUsage, 'watts')}`;
            if (index < room.devices.length - 1) content += ', ';
          });
          content += '. ';
        }
      });
    }

    return content;
  }, [formatPower]);

  const readSavingsAnalysis = useCallback((savings: any) => {
    let content = 'Savings analysis: ';
    
    if (savings?.totalSavings !== undefined && savings.totalSavings !== null) {
      content += `Total savings achieved is ${formatCurrency(savings.totalSavings)}. `;
    }

    if (savings?.monthlySavings !== undefined && savings.monthlySavings !== null) {
      content += `Monthly savings is ${formatCurrency(savings.monthlySavings)}. `;
    }

    if (savings?.yearlyProjection !== undefined && savings.yearlyProjection !== null) {
      content += `Yearly projection is ${formatCurrency(savings.yearlyProjection)}. `;
    }

    if (savings?.metrics && Array.isArray(savings.metrics) && savings.metrics.length > 0) {
      content += 'Key metrics: ';
      savings.metrics.forEach((metric: any) => {
        const amount = metric?.amount || 0;
        const percentage = metric?.percentage || 0;
        content += `${metric?.title || 'Unknown metric'} shows ${formatCurrency(amount)} savings, `;
        if (percentage > 0) {
          content += `representing ${formatPercentage(percentage)} improvement. `;
        }
      });
    }

    if (savings?.goals && Array.isArray(savings.goals) && savings.goals.length > 0) {
      content += 'Savings goals: ';
      savings.goals.forEach((goal: any) => {
        const current = goal?.current || 0;
        const target = goal?.target || 1;
        const progress = Math.round((current / target) * 100);
        content += `${goal?.title || 'Unknown goal'} is ${formatPercentage(progress)} complete. `;
      });
    }

    if (savings.recommendations && savings.recommendations.length > 0) {
      content += 'Savings recommendations: ';
      savings.recommendations.forEach((recommendation: string, index: number) => {
        content += `${index + 1}. ${recommendation}. `;
      });
    }

    return content;
  }, [formatCurrency, formatPercentage]);

  const readAIInsights = useCallback((aiInsights: any) => {
    let content = 'AI insights and recommendations: ';
    
    if (aiInsights?.insights && Array.isArray(aiInsights.insights) && aiInsights.insights.length > 0) {
      content += 'Key insights: ';
      aiInsights.insights.forEach((insight: string, index: number) => {
        if (insight && typeof insight === 'string') {
          content += `${index + 1}. ${insight} `;
        }
      });
    }

    if (aiInsights?.suggestions && Array.isArray(aiInsights.suggestions) && aiInsights.suggestions.length > 0) {
      content += 'Suggestions: ';
      aiInsights.suggestions.forEach((suggestion: string, index: number) => {
        if (suggestion && typeof suggestion === 'string') {
          content += `${index + 1}. ${suggestion} `;
        }
      });
    }

    if (aiInsights?.proactiveSuggestions && Array.isArray(aiInsights.proactiveSuggestions) && aiInsights.proactiveSuggestions.length > 0) {
      content += 'Proactive recommendations: ';
      aiInsights.proactiveSuggestions.forEach((suggestion: string, index: number) => {
        if (suggestion && typeof suggestion === 'string') {
          content += `${index + 1}. ${suggestion} `;
        }
      });
    }

    return content;
  }, []);

  const readEntireDashboard = useCallback((dashboardData: DashboardData) => {
    let fullContent = '';

    // Welcome message with proper null checks
    const userName = dashboardData?.user?.name || 'User';
    const welcomeText = getTranslation('welcomeBack', userName) as string;
    const overviewText = getTranslation('energyOverview') as string;
    fullContent += `${welcomeText} ${overviewText} `;

    // Overview cards
    if (dashboardData?.overview && Array.isArray(dashboardData.overview)) {
      fullContent += readOverviewCards(dashboardData.overview);
    }

    // Power consumers
    if (dashboardData?.powerConsumers && Array.isArray(dashboardData.powerConsumers) && dashboardData.powerConsumers.length > 0) {
      fullContent += readPowerConsumers(dashboardData.powerConsumers);
    }

    // Room consumption
    if (dashboardData?.roomConsumption && Array.isArray(dashboardData.roomConsumption) && dashboardData.roomConsumption.length > 0) {
      fullContent += readRoomConsumption(dashboardData.roomConsumption);
    }

    // Savings analysis
    if (dashboardData?.savingsAnalysis) {
      fullContent += readSavingsAnalysis(dashboardData.savingsAnalysis);
    }

    // AI insights
    if (dashboardData?.aiInsights) {
      fullContent += readAIInsights(dashboardData.aiInsights);
    }

    // Add conclusion
    fullContent += 'This completes your energy dashboard overview. You can ask for specific details about any section.';

    return fullContent;
  }, [getTranslation, readOverviewCards, readPowerConsumers, readRoomConsumption, readSavingsAnalysis, readAIInsights]);

  const announceFullDashboard = useCallback(async (dashboardData: DashboardData) => {
    const content = readEntireDashboard(dashboardData);
    console.log('Dashboard Reader - Selected Language:', selectedLanguage);
    console.log('Dashboard Reader - Content to speak:', content.substring(0, 100) + '...');
    await speakChunked(content, selectedLanguage);
  }, [readEntireDashboard, speakChunked, selectedLanguage]);

  return {
    announceFullDashboard,
    readEntireDashboard,
    readOverviewCards,
    readPowerConsumers,
    readRoomConsumption,
    readSavingsAnalysis,
    readAIInsights
  };
};
