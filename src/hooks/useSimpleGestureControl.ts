import { useState, useRef, useCallback, useEffect } from 'react';
import { useTouchlessNavigation } from './useTouchlessNavigation';
import { useGestureRecognition } from './useGestureRecognition';

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

export const useSimpleGestureControl = () => {
  const touchlessNav = useTouchlessNavigation();
  const gestureRecognition = useGestureRecognition();
  
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [gestureHistory, setGestureHistory] = useState<{ gesture: string; time: Date }[]>([]);
  const [pendingGesture, setPendingGesture] = useState<string | null>(null);
  const [confirmationTimer, setConfirmationTimer] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Accessibility-optimized gesture settings
  const [settings, setSettings] = useState<GestureSettings>({
    sensitivity: 15, // Lower threshold for easier detection
    confirmationDelay: 1500, // 1.5 second confirmation delay
    voiceFeedback: true,
    visualFeedback: true,
    hapticFeedback: true
  });

  // Voice synthesis for feedback
  const speak = useCallback((text: string) => {
    if (settings.voiceFeedback && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower speech for clarity
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, [settings.voiceFeedback]);

  // Haptic feedback simulation
  const triggerHaptic = useCallback(() => {
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Pattern: vibrate-pause-vibrate
    }
  }, [settings.hapticFeedback]);

  // Enhanced gesture commands with scrolling and selection
  const gestures: SimpleGesture[] = [
    {
      name: 'Scroll Up',
      action: () => {
        if (touchlessNav.isNavigationMode) {
          touchlessNav.scrollUp(150);
        } else {
          window.scrollBy({ top: -150, behavior: 'smooth' });
          speak('Scrolling up');
        }
        triggerHaptic();
      },
      description: 'Move hand up to scroll up',
      key: 'ArrowUp',
      voiceFeedback: 'Scrolling up',
      icon: '⬆️'
    },
    {
      name: 'Scroll Down',
      action: () => {
        if (touchlessNav.isNavigationMode) {
          touchlessNav.scrollDown(150);
        } else {
          window.scrollBy({ top: 150, behavior: 'smooth' });
          speak('Scrolling down');
        }
        triggerHaptic();
      },
      description: 'Move hand down to scroll down',
      key: 'ArrowDown',
      voiceFeedback: 'Scrolling down',
      icon: '⬇️'
    },
    {
      name: 'Select Previous',
      action: () => {
        if (!touchlessNav.isNavigationMode) {
          touchlessNav.startNavigation();
        }
        touchlessNav.selectPrevious();
        triggerHaptic();
      },
      description: 'Wave left to select previous element',
      key: 'ArrowLeft',
      voiceFeedback: 'Selecting previous element',
      icon: '👈'
    },
    {
      name: 'Select Next',
      action: () => {
        if (!touchlessNav.isNavigationMode) {
          touchlessNav.startNavigation();
        }
        touchlessNav.selectNext();
        triggerHaptic();
      },
      description: 'Wave right to select next element',
      key: 'ArrowRight',
      voiceFeedback: 'Selecting next element',
      icon: '👉'
    },
    {
      name: 'Activate Element',
      action: () => {
        if (touchlessNav.isNavigationMode) {
          touchlessNav.activateSelected();
        } else {
          // Click the currently focused element
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.click) {
            activeElement.click();
            speak('Element activated');
          }
        }
        triggerHaptic();
      },
      description: 'Thumbs up to activate selected element',
      key: 'Enter',
      voiceFeedback: 'Activating element',
      icon: '👍'
    },
    {
      name: 'Toggle Navigation',
      action: () => {
        if (touchlessNav.isNavigationMode) {
          touchlessNav.stopNavigation();
          speak('Navigation mode disabled');
        } else {
          touchlessNav.startNavigation();
          speak('Navigation mode enabled. Use gestures to select elements.');
        }
        triggerHaptic();
      },
      description: 'Open hand to toggle element selection mode',
      key: 'F2',
      voiceFeedback: 'Toggling navigation mode',
      icon: '✋'
    },
    {
      name: 'Open Hand',
      action: () => {
        const accessibilityButton = document.querySelector('[aria-label*="accessibility"]') as HTMLElement;
        if (accessibilityButton) {
          accessibilityButton.click();
          speak('Opening accessibility menu');
        } else {
          speak('Accessibility menu not found');
        }
        triggerHaptic();
      },
      description: 'Open hand to toggle accessibility menu',
      key: 'F1',
      voiceFeedback: 'Opening accessibility menu',
      icon: '🖐️'
    },
    {
      name: 'Peace Sign',
      action: () => {
        // Focus next interactive element
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
        const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
        if (nextElement) {
          nextElement.focus();
          speak('Focusing next element');
        }
        triggerHaptic();
      },
      description: 'Peace sign to focus next element',
      key: 'Tab',
      voiceFeedback: 'Moving to next element',
      icon: '✌️'
    },
    {
      name: 'Fist',
      action: () => {
        // Emergency stop or escape
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        document.dispatchEvent(escEvent);
        speak('Escape action triggered');
        triggerHaptic();
      },
      description: 'Fist to escape or go back',
      key: 'Escape',
      voiceFeedback: 'Going back',
      icon: '✊'
    }
  ];

  const addToHistory = (gesture: string) => {
    setCurrentGesture(gesture);
    setGestureHistory(prev => [...prev.slice(-4), { gesture, time: new Date() }]);
    
    // Clear current gesture after 2 seconds
    setTimeout(() => setCurrentGesture(null), 2000);
  };

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera for gesture control...');
      
      // Register gesture commands with MediaPipe gesture recognition
      gestureRecognition.registerGestureCommand({
        name: 'fist',
        action: () => executeGestureWithConfirmation('Fist'),
        description: 'Escape or go back'
      });
      
      gestureRecognition.registerGestureCommand({
        name: 'point',
        action: () => executeGestureWithConfirmation('Select Next'),
        description: 'Select next element'
      });
      
      gestureRecognition.registerGestureCommand({
        name: 'thumbs_up',
        action: () => executeGestureWithConfirmation('Activate Element'),
        description: 'Activate selected element'
      });
      
      gestureRecognition.registerGestureCommand({
        name: 'open_hand',
        action: () => executeGestureWithConfirmation('Open Hand'),
        description: 'Toggle accessibility menu'
      });
      
      gestureRecognition.registerGestureCommand({
        name: 'peace',
        action: () => executeGestureWithConfirmation('Peace Sign'),
        description: 'Focus next element'
      });
      
      gestureRecognition.registerGestureCommand({
        name: 'swipe_left',
        action: () => executeGestureWithConfirmation('Select Previous'),
        description: 'Select previous element'
      });
      
      gestureRecognition.registerGestureCommand({
        name: 'swipe_right',
        action: () => executeGestureWithConfirmation('Select Next'),
        description: 'Select next element'
      });

      // Start MediaPipe gesture recognition
      await gestureRecognition.startGestureRecognition();
      setIsActive(true);
      console.log('Gesture recognition started successfully');
      
      // Monitor gesture state changes
      const checkGestureState = () => {
        if (gestureRecognition.gestureState.gesture) {
          setCurrentGesture(gestureRecognition.gestureState.gesture);
        }
        setIsActive(gestureRecognition.gestureState.isActive);
      };
      
      // Check gesture state every 100ms
      const gestureMonitor = setInterval(checkGestureState, 100);
      
      // Cleanup on component unmount
      return () => clearInterval(gestureMonitor);
      
    } catch (error) {
      console.error('Failed to start gesture recognition:', error);
      setIsActive(false);
    }
  }, [gestureRecognition]);

  const stopCamera = useCallback(() => {
    try {
      console.log('Stopping camera...');
      
      // Stop MediaPipe gesture recognition
      gestureRecognition.stopGestureRecognition();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsActive(false);
      setCurrentGesture(null);
      console.log('Camera stopped');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }, [gestureRecognition]);



  const executeGestureWithConfirmation = (gestureName: string) => {
    if (currentGesture === gestureName || pendingGesture === gestureName) return;

    // Clear any existing timer
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

  const cancelPendingGesture = () => {
    if (confirmationTimer) {
      clearTimeout(confirmationTimer);
      setConfirmationTimer(null);
    }
    setPendingGesture(null);
    speak('Gesture cancelled');
  };

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
  }, [isActive]);

  // Sync gesture state with MediaPipe recognition
  useEffect(() => {
    if (gestureRecognition.gestureState.gesture && gestureRecognition.gestureState.gesture !== currentGesture) {
      setCurrentGesture(gestureRecognition.gestureState.gesture);
    }
  }, [gestureRecognition.gestureState.gesture, currentGesture]);

  return {
    isActive,
    currentGesture: gestureRecognition.gestureState.gesture || currentGesture,
    gestureHistory,
    gestures,
    startCamera,
    stopCamera,
    settings,
    updateSettings: setSettings,
    videoRef: gestureRecognition.videoRef,
    canvasRef: gestureRecognition.canvasRef,
    pendingGesture,
    cancelPendingGesture: () => {
      if (confirmationTimer) {
        clearTimeout(confirmationTimer);
        setConfirmationTimer(null);
      }
      setPendingGesture(null);
    },
    ...touchlessNav
  };
};
