import { useState, useRef, useCallback, useEffect } from 'react';
import { useTouchlessNavigation } from './useTouchlessNavigation';

interface SimpleGesture {
  name: string;
  action: () => void;
  description: string;
  key: string;
  voiceFeedback: string;
  icon: string;
}

interface GestureSettings {
  sensitivity: number;
  confirmationDelay: number;
  voiceFeedback: boolean;
  visualFeedback: boolean;
  hapticFeedback: boolean;
}

interface MotionData {
  x: number;
  y: number;
  timestamp: number;
}

export const useSimplifiedGestureControl = () => {
  const touchlessNav = useTouchlessNavigation();
  
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [gestureHistory, setGestureHistory] = useState<{ gesture: string; time: Date }[]>([]);
  const [pendingGesture, setPendingGesture] = useState<string | null>(null);
  const [confirmationTimer, setConfirmationTimer] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const motionDataRef = useRef<MotionData[]>([]);
  const lastGestureTime = useRef<number>(0);

  // Accessibility-optimized gesture settings
  const [settings, setSettings] = useState<GestureSettings>({
    sensitivity: 15,
    confirmationDelay: 1500,
    voiceFeedback: true,
    visualFeedback: true,
    hapticFeedback: true
  });

  // Voice synthesis for feedback
  const speak = useCallback((text: string) => {
    if (settings.voiceFeedback && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [settings.voiceFeedback]);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [settings.hapticFeedback]);

  // Simplified motion detection using camera feed
  const detectMotion = useCallback((canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple motion detection by analyzing pixel changes
    let totalMotion = 0;
    let motionCenterX = 0;
    let motionCenterY = 0;
    let motionPixels = 0;

    // Compare with previous frame (stored in canvas data attribute)
    const prevImageData = canvas.dataset.prevFrame;
    if (prevImageData) {
      const prevData = JSON.parse(prevImageData);
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        const prevR = prevData[i] || 0;
        const prevG = prevData[i + 1] || 0;
        const prevB = prevData[i + 2] || 0;
        
        const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
        
        if (diff > settings.sensitivity) {
          totalMotion += diff;
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          
          motionCenterX += x;
          motionCenterY += y;
          motionPixels++;
        }
      }
    }

    // Store current frame for next comparison
    canvas.dataset.prevFrame = JSON.stringify(Array.from(imageData.data));

    if (motionPixels > 0) {
      motionCenterX /= motionPixels;
      motionCenterY /= motionPixels;
      
      return {
        x: motionCenterX / canvas.width,
        y: motionCenterY / canvas.height,
        intensity: totalMotion / motionPixels,
        timestamp: Date.now()
      };
    }

    return null;
  }, [settings.sensitivity]);

  // Analyze motion patterns to detect gestures
  const analyzeGesturePattern = useCallback((motionData: MotionData[]) => {
    if (motionData.length < 10) return null;

    const recentData = motionData.slice(-20); // Last 20 motion points
    const firstPoint = recentData[0];
    const lastPoint = recentData[recentData.length - 1];
    
    const deltaX = lastPoint.x - firstPoint.x;
    const deltaY = lastPoint.y - firstPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Prevent gesture spam
    const now = Date.now();
    if (now - lastGestureTime.current < 2000) return null;

    // Gesture detection based on motion patterns
    if (distance > 0.3) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal movement
        if (deltaX > 0.2) {
          lastGestureTime.current = now;
          return 'swipe_right';
        } else if (deltaX < -0.2) {
          lastGestureTime.current = now;
          return 'swipe_left';
        }
      } else {
        // Vertical movement
        if (deltaY > 0.2) {
          lastGestureTime.current = now;
          return 'swipe_down';
        } else if (deltaY < -0.2) {
          lastGestureTime.current = now;
          return 'swipe_up';
        }
      }
    }

    // Check for stationary gestures (hand held in position)
    const avgX = recentData.reduce((sum, point) => sum + point.x, 0) / recentData.length;
    const avgY = recentData.reduce((sum, point) => sum + point.y, 0) / recentData.length;
    
    // Center region gestures
    if (avgX > 0.4 && avgX < 0.6 && avgY > 0.4 && avgY < 0.6) {
      const variance = recentData.reduce((sum, point) => {
        return sum + Math.pow(point.x - avgX, 2) + Math.pow(point.y - avgY, 2);
      }, 0) / recentData.length;
      
      if (variance < 0.01) { // Very stable position
        lastGestureTime.current = now;
        return 'center_hold';
      }
    }

    return null;
  }, []);

  // Enhanced gesture commands
  const gestures: SimpleGesture[] = [
    {
      name: 'Swipe Up',
      action: () => {
        window.scrollBy({ top: -150, behavior: 'smooth' });
        speak('Scrolling up');
        triggerHaptic();
      },
      description: 'Move hand up to scroll up',
      key: 'ArrowUp',
      voiceFeedback: 'Scrolling up',
      icon: '⬆️'
    },
    {
      name: 'Swipe Down',
      action: () => {
        window.scrollBy({ top: 150, behavior: 'smooth' });
        speak('Scrolling down');
        triggerHaptic();
      },
      description: 'Move hand down to scroll down',
      key: 'ArrowDown',
      voiceFeedback: 'Scrolling down',
      icon: '⬇️'
    },
    {
      name: 'Swipe Left',
      action: () => {
        if (!touchlessNav.isNavigationMode) {
          touchlessNav.startNavigation();
        }
        touchlessNav.selectPrevious();
        triggerHaptic();
      },
      description: 'Swipe left to select previous element',
      key: 'ArrowLeft',
      voiceFeedback: 'Selecting previous element',
      icon: '👈'
    },
    {
      name: 'Swipe Right',
      action: () => {
        if (!touchlessNav.isNavigationMode) {
          touchlessNav.startNavigation();
        }
        touchlessNav.selectNext();
        triggerHaptic();
      },
      description: 'Swipe right to select next element',
      key: 'ArrowRight',
      voiceFeedback: 'Selecting next element',
      icon: '👉'
    },
    {
      name: 'Center Hold',
      action: () => {
        if (touchlessNav.isNavigationMode) {
          touchlessNav.activateSelected();
        } else {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.click) {
            activeElement.click();
            speak('Element activated');
          }
        }
        triggerHaptic();
      },
      description: 'Hold hand in center to activate element',
      key: 'Enter',
      voiceFeedback: 'Activating element',
      icon: '👍'
    }
  ];

  const addToHistory = (gesture: string) => {
    setCurrentGesture(gesture);
    setGestureHistory(prev => [...prev.slice(-4), { gesture, time: new Date() }]);
    
    setTimeout(() => setCurrentGesture(null), 2000);
  };

  const executeGestureWithConfirmation = (gestureName: string) => {
    if (currentGesture === gestureName || pendingGesture === gestureName) return;

    if (confirmationTimer) {
      clearTimeout(confirmationTimer);
    }

    setPendingGesture(gestureName);
    speak(`Detected ${gestureName}. Confirming in ${settings.confirmationDelay / 1000} seconds`);

    const timer = setTimeout(() => {
      const gesture = gestures.find(g => g.name === gestureName);
      if (gesture) {
        console.log('Executing confirmed gesture:', gestureName);
        gesture.action();
        addToHistory(gestureName);
      }
      setPendingGesture(null);
      setConfirmationTimer(null);
    }, settings.confirmationDelay);

    setConfirmationTimer(timer);
  };

  const cancelPendingGesture = useCallback(() => {
    if (confirmationTimer) {
      clearTimeout(confirmationTimer);
      setConfirmationTimer(null);
    }
    setPendingGesture(null);
    speak('Gesture cancelled');
  }, [confirmationTimer, speak]);

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting simplified gesture control...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadeddata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = 320;
            canvasRef.current.height = 240;
            
            // Start motion detection loop
            const detectLoop = () => {
              if (!isActive || !videoRef.current || !canvasRef.current) return;
              
              const motion = detectMotion(canvasRef.current, videoRef.current);
              if (motion) {
                motionDataRef.current.push(motion);
                
                // Keep only recent motion data
                if (motionDataRef.current.length > 50) {
                  motionDataRef.current = motionDataRef.current.slice(-30);
                }
                
                // Analyze for gestures
                const gesture = analyzeGesturePattern(motionDataRef.current);
                if (gesture) {
                  const gestureMap: { [key: string]: string } = {
                    'swipe_up': 'Swipe Up',
                    'swipe_down': 'Swipe Down',
                    'swipe_left': 'Swipe Left',
                    'swipe_right': 'Swipe Right',
                    'center_hold': 'Center Hold'
                  };
                  
                  const gestureName = gestureMap[gesture];
                  if (gestureName) {
                    executeGestureWithConfirmation(gestureName);
                  }
                }
              }
              
              requestAnimationFrame(detectLoop);
            };
            
            setIsActive(true);
            speak('Simplified gesture control activated. Use hand movements to navigate.');
            detectLoop();
          }
        };
      }
      
      console.log('Simplified gesture control started successfully');
    } catch (error) {
      console.error('Failed to start simplified gesture control:', error);
      setIsActive(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied. Please allow camera access to use gesture control.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found. Please connect a camera to use gesture control.');
        } else {
          alert(`Gesture control error: ${error.message}`);
        }
      }
    }
  }, [detectMotion, analyzeGesturePattern, executeGestureWithConfirmation, speak, isActive]);

  const stopCamera = useCallback(() => {
    try {
      console.log('Stopping simplified gesture control...');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsActive(false);
      setCurrentGesture(null);
      motionDataRef.current = [];
      
      console.log('Simplified gesture control stopped');
    } catch (error) {
      console.error('Error stopping gesture control:', error);
    }
  }, []);

  // Keyboard shortcuts for testing
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isActive) return;

      const gesture = gestures.find(g => g.key === event.key);
      if (gesture && event.ctrlKey) {
        event.preventDefault();
        gesture.action();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isActive, gestures]);

  return {
    isActive,
    currentGesture,
    gestureHistory,
    gestures,
    startCamera,
    stopCamera,
    settings,
    updateSettings: setSettings,
    videoRef,
    canvasRef,
    pendingGesture,
    cancelPendingGesture,
    touchlessNav
  };
};
