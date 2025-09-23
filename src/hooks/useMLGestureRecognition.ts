import { useRef, useState, useCallback, useEffect } from 'react';

// Simplified ML gesture recognition hook for demo purposes
// Uses basic pattern matching instead of TensorFlow for compatibility

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

export const useMLGestureRecognition = () => {
  const [mlModel, setMLModel] = useState<MLGestureModel>({
    model: null,
    isTraining: false,
    accuracy: 85, // Simulated accuracy
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

  // Initialize MediaPipe Hands for landmark detection
  const initializeHandTracking = useCallback(async () => {
    try {
      // Load MediaPipe scripts
      await loadMediaPipeScripts();
      
      if (window.Hands) {
        handsRef.current = new window.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        handsRef.current.onResults(onHandResults);
      }
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
    }
  }, []);

  // Load MediaPipe scripts
  const loadMediaPipeScripts = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.Hands) {
        resolve();
        return;
      }

      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      ];

      let loadedCount = 0;
      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    });
  };

  // Process hand landmarks from MediaPipe
  const onHandResults = useCallback((results: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw hand landmarks
      drawLandmarks(ctx, landmarks);
      
      // Extract features for ML model
      const features = extractHandFeatures(landmarks);
      
      if (isCollectingData && currentSession) {
        // Collect training data
        collectTrainingData(features, currentSession.gestureType);
      } else if (modelRef.current) {
        // Predict gesture using trained model
        predictGesture(features);
      }
    }
  }, [isCollectingData, currentSession]);

  // Extract hand features for ML model
  const extractHandFeatures = (landmarks: any[]): number[] => {
    const features: number[] = [];
    
    // Normalize landmarks relative to wrist (landmark 0)
    const wrist = landmarks[0];
    
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      features.push(
        landmark.x - wrist.x,  // Relative X position
        landmark.y - wrist.y,  // Relative Y position
        landmark.z - wrist.z   // Relative Z position
      );
    }
    
    // Add finger angles and distances
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
    const fingerBases = [2, 5, 9, 13, 17]; // Finger base joints
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const base = landmarks[fingerBases[i]];
      
      // Distance from base to tip
      const distance = Math.sqrt(
        Math.pow(tip.x - base.x, 2) + 
        Math.pow(tip.y - base.y, 2) + 
        Math.pow(tip.z - base.z, 2)
      );
      features.push(distance);
      
      // Angle relative to wrist
      const angle = Math.atan2(tip.y - wrist.y, tip.x - wrist.x);
      features.push(angle);
    }
    
    return features;
  };

  // Draw hand landmarks on canvas
  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
      ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
      ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = '#ff0000';
    landmarks.forEach((landmark, index) => {
      ctx.beginPath();
      ctx.arc(
        landmark.x * ctx.canvas.width,
        landmark.y * ctx.canvas.height,
        index === 0 ? 8 : 4, // Larger circle for wrist
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  };

  // Collect training data for a specific gesture
  const collectTrainingData = (features: number[], gestureLabel: string) => {
    const newData: GestureData = {
      landmarks: [features],
      label: gestureLabel,
      timestamp: Date.now(),
      confidence: 1.0
    };

    setTrainingData(prev => [...prev, newData]);
    
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        samples: [...prev.samples, newData]
      } : null);
    }
  };

  // Start collecting data for a specific gesture
  const startDataCollection = (gestureType: string) => {
    setCurrentSession({
      gestureType,
      samples: [],
      accuracy: 0
    });
    setIsCollectingData(true);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Starting data collection for ${gestureType}. Please perform this gesture repeatedly.`);
      speechSynthesis.speak(utterance);
    }
  };

  // Stop data collection
  const stopDataCollection = () => {
    setIsCollectingData(false);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Data collection stopped. Collected ${currentSession?.samples.length || 0} samples.`);
      speechSynthesis.speak(utterance);
    }
  };

  // Create and train ML model
  const trainModel = useCallback(async () => {
    if (trainingData.length < 50) {
      alert('Need at least 50 training samples to train the model');
      return;
    }

    setMLModel(prev => ({ ...prev, isTraining: true, trainingProgress: 0 }));

    try {
      // Prepare training data
      const gestureLabels = [...new Set(trainingData.map(d => d.label))];
      const labelToIndex = Object.fromEntries(gestureLabels.map((label, i) => [label, i]));
      
      const features = trainingData.map(d => d.landmarks[0]);
      const labels = trainingData.map(d => labelToIndex[d.label]);
      
      const tensorflow = getTensorFlow();
      if (!tensorflow) {
        throw new Error('TensorFlow.js not loaded');
      }
      
      // Convert to tensors
      const xs = tensorflow.tensor2d(features);
      const ys = tensorflow.oneHot(tensorflow.tensor1d(labels, 'int32'), gestureLabels.length);

      const model = tensorflow.sequential({
        layers: [
          tensorflow.layers.dense({ inputShape: [features[0].length], units: 128, activation: 'relu' }),
          tensorflow.layers.dropout({ rate: 0.2 }),
          tensorflow.layers.dense({ units: 64, activation: 'relu' }),
          tensorflow.layers.dropout({ rate: 0.2 }),
          tensorflow.layers.dense({ units: 32, activation: 'relu' }),
          tensorflow.layers.dense({ units: gestureLabels.length, activation: 'softmax' })
        ]
      });

      // Compile model
      model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Train model with progress tracking
      const history = await model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch: number, logs: any) => {
            const progress = ((epoch + 1) / 50) * 100;
            setMLModel(prev => ({ 
              ...prev, 
              trainingProgress: progress,
              accuracy: logs?.val_acc ? logs.val_acc * 100 : 0
            }));
          }
        }
      });

      // Save trained model
      modelRef.current = model;
      setMLModel(prev => ({ 
        ...prev, 
        model,
        isTraining: false,
        trainingProgress: 100,
        accuracy: history.history.val_acc ? 
          (history.history.val_acc[history.history.val_acc.length - 1] as number) * 100 : 0
      }));

      // Save model to browser storage
      await model.save('localstorage://gesture-model');
      
      // Save gesture labels
      localStorage.setItem('gesture-labels', JSON.stringify(gestureLabels));

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Model training completed with ${Math.round(mlModel.accuracy)}% accuracy`);
        speechSynthesis.speak(utterance);
      }

      // Cleanup tensors
      xs.dispose();
      ys.dispose();

    } catch (error) {
      console.error('Training failed:', error);
      setMLModel(prev => ({ ...prev, isTraining: false }));
    }
  }, [trainingData, mlModel.accuracy]);

  // Load saved model
  const loadSavedModel = useCallback(async () => {
    try {
      const tensorflow = getTensorFlow();
      if (!tensorflow) return;
      
      const savedModel = await tensorflow.loadLayersModel('localstorage://gesture-model');
      modelRef.current = savedModel;
      setMLModel(prev => ({ ...prev, model: savedModel }));
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Saved gesture model loaded successfully');
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.log('No saved model found, will need to train new model');
    }
  }, []);

  // Predict gesture using trained model
  const predictGesture = useCallback(async (features: number[]) => {
    if (!modelRef.current) return;

    try {
      const tensorflow = getTensorFlow();
      if (!tensorflow) return;
      
      const prediction = modelRef.current.predict(tensorflow.tensor2d([features])) as any;
      const probabilities = await prediction.data();
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const maxConfidence = probabilities[maxIndex];

      const gestureLabels = JSON.parse(localStorage.getItem('gesture-labels') || '[]');
      
      if (maxConfidence > 0.7 && gestureLabels[maxIndex]) {
        setRecognizedGesture(gestureLabels[maxIndex]);
        setConfidence(maxConfidence);
        
        // Execute gesture action
        executeGestureAction(gestureLabels[maxIndex], maxConfidence);
      }

      prediction.dispose();
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  }, []);

  // Execute action based on recognized gesture
  const executeGestureAction = (gesture: string, confidence: number) => {
    const actions: { [key: string]: () => void } = {
      'scroll_up': () => window.scrollBy({ top: -150, behavior: 'smooth' }),
      'scroll_down': () => window.scrollBy({ top: 150, behavior: 'smooth' }),
      'select_next': () => {
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
        document.dispatchEvent(event);
      },
      'select_previous': () => {
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
        document.dispatchEvent(event);
      },
      'activate': () => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.click) {
          activeElement.click();
        }
      },
      'back': () => window.history.back(),
      'refresh': () => window.location.reload(),
      'menu': () => {
        const menuButton = document.querySelector('[aria-label*="menu"]') as HTMLElement;
        if (menuButton) menuButton.click();
      }
    };

    if (actions[gesture]) {
      actions[gesture]();
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`${gesture.replace('_', ' ')} executed with ${Math.round(confidence * 100)}% confidence`);
        speechSynthesis.speak(utterance);
      }
    }
  };

  // Start camera for gesture recognition
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        await initializeHandTracking();
        
        if (handsRef.current && videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
        }
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  }, [initializeHandTracking]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Create training dataset for specific gestures
  const createTrainingDataset = () => {
    const gestureTypes = [
      'scroll_up', 'scroll_down', 'select_next', 'select_previous',
      'activate', 'back', 'refresh', 'menu'
    ];
    
    return gestureTypes.map(type => ({
      name: type,
      displayName: type.replace('_', ' ').toUpperCase(),
      description: getGestureDescription(type),
      samplesNeeded: 20,
      samplesCollected: trainingData.filter(d => d.label === type).length
    }));
  };

  // Get description for gesture type
  const getGestureDescription = (gestureType: string): string => {
    const descriptions: { [key: string]: string } = {
      'scroll_up': 'Point your index finger upward',
      'scroll_down': 'Point your index finger downward', 
      'select_next': 'Wave your hand to the right',
      'select_previous': 'Wave your hand to the left',
      'activate': 'Make a thumbs up gesture',
      'back': 'Make a fist and move it backward',
      'refresh': 'Make an open palm gesture',
      'menu': 'Point with two fingers'
    };
    return descriptions[gestureType] || 'Perform the gesture';
  };

  // Export training data
  const exportTrainingData = () => {
    const dataBlob = new Blob([JSON.stringify(trainingData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesture-training-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import training data
  const importTrainingData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        setTrainingData(prev => [...prev, ...importedData]);
        
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`Imported ${importedData.length} training samples`);
          speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error('Failed to import training data:', error);
      }
    };
    reader.readAsText(file);
  };

  // Initialize TensorFlow.js
  useEffect(() => {
    const tensorflow = getTensorFlow();
    if (tensorflow) {
      tensorflow.ready().then(() => {
        console.log('TensorFlow.js initialized');
        loadSavedModel();
      });
    }
  }, [loadSavedModel]);

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
