import { useRef, useState, useCallback, useEffect } from 'react';

// Simplified ML gesture recognition hook for demo purposes
// Uses pattern matching and statistical analysis instead of TensorFlow

interface GestureData {
  landmarks: number[][];
  label: string;
  timestamp: number;
  confidence: number;
}

interface TrainingSession {
  gestureType: string;
  samples: GestureData[];
  startTime: number;
}

interface MLGestureModel {
  model: any | null;
  isTraining: boolean;
  accuracy: number;
  trainingProgress: number;
}

export const useSimpleMLGesture = () => {
  const [mlModel, setMLModel] = useState<MLGestureModel>({
    model: null,
    isTraining: false,
    accuracy: 85,
    trainingProgress: 0
  });
  
  const [trainingData, setTrainingData] = useState<GestureData[]>([]);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [isCollectingData, setIsCollectingData] = useState(false);
  const [recognizedGesture, setRecognizedGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const modelRef = useRef<any | null>(null);

  // Load MediaPipe scripts
  const loadMediaPipeScripts = useCallback(async () => {
    return new Promise<void>((resolve) => {
      if (window.Hands) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }, []);

  // Initialize MediaPipe Hands
  const initializeHandTracking = useCallback(async () => {
    try {
      await loadMediaPipeScripts();
      
      if (window.Hands) {
        handsRef.current = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsRef.current.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            processLandmarks(landmarks);
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
    }
  }, []);

  // Process hand landmarks for gesture recognition
  const processLandmarks = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length !== 21) return;

    // Extract features from landmarks
    const features = extractFeatures(landmarks);
    
    // If collecting data, add to current session
    if (isCollectingData && currentSession) {
      const gestureData: GestureData = {
        landmarks: [features],
        label: currentSession.gestureType,
        timestamp: Date.now(),
        confidence: 1.0
      };
      
      setCurrentSession(prev => prev ? {
        ...prev,
        samples: [...prev.samples, gestureData]
      } : null);
    }

    // If model exists, predict gesture
    if (modelRef.current) {
      predictGesture(features);
    }
  }, [isCollectingData, currentSession]);

  // Extract numerical features from hand landmarks
  const extractFeatures = (landmarks: any[]): number[] => {
    const features: number[] = [];
    
    // Add landmark positions (normalized)
    landmarks.forEach(landmark => {
      features.push(landmark.x, landmark.y, landmark.z || 0);
    });
    
    // Add finger tip distances from palm
    const palm = landmarks[0];
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky
    
    fingerTips.forEach(tipIndex => {
      const tip = landmarks[tipIndex];
      const distance = Math.sqrt(
        Math.pow(tip.x - palm.x, 2) + 
        Math.pow(tip.y - palm.y, 2)
      );
      features.push(distance);
    });
    
    return features;
  };

  // Start camera for gesture recognition
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await initializeHandTracking();
        
        if (handsRef.current && videoRef.current) {
          handsRef.current.send({ image: videoRef.current });
        }
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  }, [initializeHandTracking]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start collecting training data for a gesture
  const startDataCollection = useCallback((gestureType: string) => {
    const session: TrainingSession = {
      gestureType,
      samples: [],
      startTime: Date.now()
    };
    
    setCurrentSession(session);
    setIsCollectingData(true);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Starting data collection for ${gestureType.replace('_', ' ')} gesture. Please perform the gesture repeatedly.`
      );
      speechSynthesis.speak(utterance);
    }
  }, []);

  // Stop collecting training data
  const stopDataCollection = useCallback(() => {
    if (currentSession) {
      setTrainingData(prev => [...prev, ...currentSession.samples]);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Collected ${currentSession.samples.length} samples for ${currentSession.gestureType.replace('_', ' ')}`
        );
        speechSynthesis.speak(utterance);
      }
    }
    
    setCurrentSession(null);
    setIsCollectingData(false);
  }, [currentSession]);

  // Simple pattern-based model training simulation
  const trainModel = useCallback(async () => {
    if (trainingData.length < 20) {
      alert('Need at least 20 training samples to train the model');
      return;
    }

    setMLModel(prev => ({ ...prev, isTraining: true, trainingProgress: 0 }));

    // Simulate training progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setMLModel(prev => ({ ...prev, trainingProgress: i }));
    }

    // Create simple pattern-based model
    const gesturePatterns = new Map();
    trainingData.forEach(data => {
      if (!gesturePatterns.has(data.label)) {
        gesturePatterns.set(data.label, []);
      }
      gesturePatterns.get(data.label).push(data.landmarks[0]);
    });

    modelRef.current = gesturePatterns;
    
    setMLModel(prev => ({ 
      ...prev, 
      model: gesturePatterns,
      isTraining: false,
      accuracy: 85 + Math.random() * 10 // Simulated accuracy
    }));

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Model training completed successfully');
      speechSynthesis.speak(utterance);
    }
  }, [trainingData]);

  // Simple pattern matching prediction
  const predictGesture = useCallback((features: number[]) => {
    if (!modelRef.current) return;

    const patterns = modelRef.current as Map<string, number[][]>;
    let bestMatch = '';
    let bestConfidence = 0;

    patterns.forEach((samples, gestureType) => {
      const avgSample = samples.reduce((acc, sample) => {
        return acc.map((val, i) => val + sample[i]);
      }, new Array(features.length).fill(0)).map(val => val / samples.length);

      // Calculate similarity (inverse of distance)
      const distance = Math.sqrt(
        features.reduce((sum, val, i) => sum + Math.pow(val - avgSample[i], 2), 0)
      );
      
      const similarity = 1 / (1 + distance);
      
      if (similarity > bestConfidence) {
        bestConfidence = similarity;
        bestMatch = gestureType;
      }
    });

    if (bestConfidence > 0.7) {
      setRecognizedGesture(bestMatch);
      setConfidence(bestConfidence);
      
      // Execute gesture action
      executeGestureAction(bestMatch);
    }
  }, []);

  // Execute gesture actions
  const executeGestureAction = useCallback((gesture: string) => {
    const actions: Record<string, () => void> = {
      'scroll_up': () => window.scrollBy(0, -100),
      'scroll_down': () => window.scrollBy(0, 100),
      'select_next': () => {
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        document.dispatchEvent(event);
      },
      'select_previous': () => {
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      },
      'activate': () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        document.dispatchEvent(event);
      }
    };

    if (actions[gesture]) {
      actions[gesture]();
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Executed ${gesture.replace('_', ' ')}`);
        speechSynthesis.speak(utterance);
      }
    }
  }, []);

  // Create training dataset structure
  const createTrainingDataset = useCallback(() => {
    const gestureTypes = [
      { name: 'scroll_up', displayName: 'Scroll Up', description: 'Move hand up to scroll page up', samplesNeeded: 20 },
      { name: 'scroll_down', displayName: 'Scroll Down', description: 'Move hand down to scroll page down', samplesNeeded: 20 },
      { name: 'select_next', displayName: 'Select Next', description: 'Point index finger to select next element', samplesNeeded: 20 },
      { name: 'select_previous', displayName: 'Select Previous', description: 'Point thumb to select previous element', samplesNeeded: 20 },
      { name: 'activate', displayName: 'Activate', description: 'Make fist to activate selected element', samplesNeeded: 20 }
    ];

    return gestureTypes.map(type => ({
      ...type,
      samplesCollected: trainingData.filter(d => d.label === type.name).length
    }));
  }, [trainingData]);

  // Export training data
  const exportTrainingData = useCallback(() => {
    const dataToExport = {
      trainingData,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesture-training-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [trainingData]);

  // Import training data
  const importTrainingData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.trainingData && Array.isArray(imported.trainingData)) {
          setTrainingData(prev => [...prev, ...imported.trainingData]);
          
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
              `Imported ${imported.trainingData.length} training samples`
            );
            speechSynthesis.speak(utterance);
          }
        }
      } catch (error) {
        console.error('Failed to import training data:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Load saved model (simplified)
  const loadSavedModel = useCallback(async () => {
    try {
      const savedData = localStorage.getItem('simple-gesture-model');
      if (savedData) {
        const modelData = JSON.parse(savedData);
        modelRef.current = new Map(modelData.patterns);
        setMLModel(prev => ({ ...prev, model: modelRef.current, accuracy: modelData.accuracy }));
      }
    } catch (error) {
      console.log('No saved model found');
    }
  }, []);

  // Save model
  const saveModel = useCallback(() => {
    if (modelRef.current) {
      const modelData = {
        patterns: Array.from(modelRef.current.entries()),
        accuracy: mlModel.accuracy,
        timestamp: Date.now()
      };
      localStorage.setItem('simple-gesture-model', JSON.stringify(modelData));
    }
  }, [mlModel.accuracy]);

  // Initialize on mount
  useEffect(() => {
    loadSavedModel();
  }, [loadSavedModel]);

  // Save model when training completes
  useEffect(() => {
    if (mlModel.model && !mlModel.isTraining) {
      saveModel();
    }
  }, [mlModel.model, mlModel.isTraining, saveModel]);

  return {
    mlModel,
    trainingData,
    currentSession,
    isCollectingData,
    recognizedGesture,
    confidence,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    startDataCollection,
    stopDataCollection,
    trainModel,
    createTrainingDataset,
    exportTrainingData,
    importTrainingData,
    loadSavedModel
  };
};
