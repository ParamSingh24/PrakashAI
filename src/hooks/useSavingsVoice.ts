import { useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { SavingsAnalysisData } from '../types/dashboard.types';

export const useSavingsVoice = () => {
  const { speak } = useAccessibility();

  // Hindi translations for savings information
  const hindiTranslations = {
    totalSavings: (amount: number) => `कुल बचत ${amount} रुपये है`,
    monthlySavings: (amount: number) => `मासिक बचत ${amount} रुपये है`,
    yearlyProjection: (amount: number) => `वार्षिक अनुमान ${amount} रुपये है`,
    goalAchievement: (percentage: number) => `लक्ष्य की ${percentage} प्रतिशत पूर्ति हो गई है`,
    energySavings: (amount: number) => `ऊर्जा की बचत से ${amount} रुपये बचे हैं`,
    solarSavings: (amount: number) => `सौर ऊर्जा से ${amount} रुपये की बचत हुई है`,
    efficiencySavings: (amount: number) => `ऊर्जा दक्षता से ${amount} रुपये बचे हैं`,
    recommendations: {
      intro: 'बचत के लिए सुझाव:',
      solarPanels: 'सौर पैनल लगवाने से अधिक बचत होगी',
      ledBulbs: 'एल ई डी बल्ब का उपयोग करें',
      smartDevices: 'स्मार्ट उपकरण लगवाएं',
      timeOfUse: 'कम दर के समय में बिजली का उपयोग करें',
      maintenance: 'उपकरणों की नियमित सफाई करें'
    },
    goals: {
      monthly: (current: number, target: number) => 
        `मासिक लक्ष्य: ${current} रुपये में से ${target} रुपये बचाना है`,
      yearly: (current: number, target: number) => 
        `वार्षिक लक्ष्य: ${current} रुपये में से ${target} रुपये बचाना है`,
      achieved: 'लक्ष्य पूरा हो गया है! बधाई हो!',
      nearTarget: 'आप अपने लक्ष्य के करीब हैं'
    },
    trends: {
      increasing: 'बचत बढ़ रही है',
      decreasing: 'बचत कम हो रही है',
      stable: 'बचत स्थिर है'
    }
  };

  const announceSavingsOverview = useCallback((data: SavingsAnalysisData) => {
    const hindiText = `
      ${hindiTranslations.totalSavings(data.totalSavings)}। 
      ${hindiTranslations.monthlySavings(data.monthlySavings)}। 
      ${hindiTranslations.yearlyProjection(data.yearlyProjection)}। 
      ${hindiTranslations.goalAchievement(Math.round((data.totalSavings / data.yearlyProjection) * 100))}।
    `;
    
    speak(hindiText, 'hi');
  }, [speak]);

  const announceSavingsMetrics = useCallback((metrics: any[]) => {
    let hindiText = 'आपकी बचत का विवरण: ';
    
    metrics.forEach((metric) => {
      if (metric.title.toLowerCase().includes('energy')) {
        hindiText += hindiTranslations.energySavings(metric.amount) + '। ';
      } else if (metric.title.toLowerCase().includes('solar')) {
        hindiText += hindiTranslations.solarSavings(metric.amount) + '। ';
      } else if (metric.title.toLowerCase().includes('efficiency')) {
        hindiText += hindiTranslations.efficiencySavings(metric.amount) + '। ';
      }
      
      // Add trend information
      if (metric.trend.isPositive) {
        hindiText += hindiTranslations.trends.increasing + '। ';
      } else {
        hindiText += hindiTranslations.trends.decreasing + '। ';
      }
    });
    
    speak(hindiText, 'hi');
  }, [speak]);

  const announceSavingsGoals = useCallback((goals: any[]) => {
    let hindiText = 'आपके बचत के लक्ष्य: ';
    
    goals.forEach((goal) => {
      if (goal.title.toLowerCase().includes('monthly')) {
        hindiText += hindiTranslations.goals.monthly(goal.current, goal.target) + '। ';
      } else if (goal.title.toLowerCase().includes('yearly')) {
        hindiText += hindiTranslations.goals.yearly(goal.current, goal.target) + '। ';
      }
      
      if (goal.percentage >= 100) {
        hindiText += hindiTranslations.goals.achieved + ' ';
      } else if (goal.percentage >= 80) {
        hindiText += hindiTranslations.goals.nearTarget + '। ';
      }
    });
    
    speak(hindiText, 'hi');
  }, [speak]);

  const announceSavingsRecommendations = useCallback((recommendations: string[]) => {
    let hindiText = hindiTranslations.recommendations.intro + ' ';
    
    recommendations.forEach((recommendation) => {
      const lowerRec = recommendation.toLowerCase();
      if (lowerRec.includes('solar')) {
        hindiText += hindiTranslations.recommendations.solarPanels + '। ';
      } else if (lowerRec.includes('led') || lowerRec.includes('bulb')) {
        hindiText += hindiTranslations.recommendations.ledBulbs + '। ';
      } else if (lowerRec.includes('smart')) {
        hindiText += hindiTranslations.recommendations.smartDevices + '। ';
      } else if (lowerRec.includes('time') || lowerRec.includes('peak')) {
        hindiText += hindiTranslations.recommendations.timeOfUse + '। ';
      } else if (lowerRec.includes('maintenance') || lowerRec.includes('clean')) {
        hindiText += hindiTranslations.recommendations.maintenance + '। ';
      }
    });
    
    speak(hindiText, 'hi');
  }, [speak]);

  const announceSpecificSaving = useCallback((amount: number, type: string) => {
    let hindiText = '';
    
    switch (type.toLowerCase()) {
      case 'energy':
        hindiText = hindiTranslations.energySavings(amount);
        break;
      case 'solar':
        hindiText = hindiTranslations.solarSavings(amount);
        break;
      case 'efficiency':
        hindiText = hindiTranslations.efficiencySavings(amount);
        break;
      case 'monthly':
        hindiText = hindiTranslations.monthlySavings(amount);
        break;
      case 'yearly':
        hindiText = hindiTranslations.yearlyProjection(amount);
        break;
      default:
        hindiText = `${amount} रुपये की बचत हुई है`;
    }
    
    speak(hindiText, 'hi');
  }, [speak]);

  return {
    announceSavingsOverview,
    announceSavingsMetrics,
    announceSavingsGoals,
    announceSavingsRecommendations,
    announceSpecificSaving,
    hindiTranslations
  };
};
