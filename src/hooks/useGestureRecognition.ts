import { useEffect, useRef, useState, useCallback } from 'react';
import { GestureRecognition, GestureCommand } from '../types/accessibility.types';

// MediaPipe Hands will be loaded dynamically
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export const useGestureRecognition = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gestureState, setGestureState] = useState<GestureRecognition>({
    isActive: false,
    confidence: 0,
    gesture: null,
    landmarks: [],
  });
  const [commands, setCommands] = useState<GestureCommand[]>([]);
  const [handsInstance, setHandsInstance] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);

  // Load MediaPipe scripts with better error handling
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        console.log('Loading MediaPipe scripts...');
        
        if (!window.Hands) {
          // Load scripts in sequence to ensure proper loading
          const loadScript = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
              // Check if script already exists
              const existingScript = document.querySelector(`script[src="${src}"]`);
              if (existingScript) {
                resolve();
                return;
              }
              
              const script = document.createElement('script');
              script.src = src;
              script.crossOrigin = 'anonymous';
              script.onload = () => {
                console.log(`Loaded: ${src}`);
                resolve();
              };
              script.onerror = () => {
                console.error(`Failed to load: ${src}`);
                reject(new Error(`Failed to load ${src}`));
              };
              document.head.appendChild(script);
            });
          };

          // Load MediaPipe scripts in sequence with timeout
          const loadWithTimeout = (src: string, timeout = 10000) => {
            return Promise.race([
              loadScript(src),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Timeout loading ${src}`)), timeout)
              )
            ]);
          };

          await loadWithTimeout('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadWithTimeout('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
          await loadWithTimeout('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
          await loadWithTimeout('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
          
          console.log('All MediaPipe scripts loaded successfully');
          
          // Initialize hands after scripts are loaded
          setTimeout(() => {
            if (window.Hands && !handsInstance) {
              initializeHands();
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to load MediaPipe scripts:', error);
        // Fallback: Set gesture state to indicate MediaPipe is not available
        setGestureState(prev => ({ ...prev, isActive: false }));
      }
    };

    loadMediaPipe();
  }, []);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(async () => {
    try {
      console.log('Initializing MediaPipe Hands...');
      
      if (!window.Hands || !videoRef.current || !canvasRef.current) {
        console.log('Missing dependencies:', { 
          hands: !!window.Hands, 
          video: !!videoRef.current, 
          canvas: !!canvasRef.current 
        });
        return;
      }

      const hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        
        if (canvas && ctx) {
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
              // Draw hand landmarks
              drawLandmarks(ctx, landmarks);
              
              // Recognize gestures
              const gesture = recognizeGesture(landmarks);
              if (gesture) {
                console.log('Gesture detected:', gesture);
                setGestureState(prev => ({
                  ...prev,
                  gesture: gesture.name,
                  confidence: gesture.confidence,
                  landmarks: landmarks,
                }));
                
                // Execute gesture command with debouncing
                const command = commands.find(cmd => cmd.name === gesture.name);
                if (command) {
                  console.log('Executing command:', command.description);
                  command.action();
                }
              }
            }
          } else {
            // Clear gesture when no hands detected
            setGestureState(prev => ({
              ...prev,
              gesture: null,
              confidence: 0,
              landmarks: [],
            }));
          }
          ctx.restore();
        }
      });

      setHandsInstance(hands);

      // Initialize camera with error handling
      if (videoRef.current && window.Camera) {
        console.log('Initializing camera...');
        const cameraInstance = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && hands) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        setCamera(cameraInstance);
        console.log('Camera initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize MediaPipe Hands:', error);
    }
  }, [commands]);

  const drawLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    ctx.fillStyle = '#00d4ff';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;

    // Draw connections between landmarks
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    ];

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
      ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
      ctx.stroke();
    });

    // Draw landmark points
    landmarks.forEach((landmark) => {
      ctx.beginPath();
      ctx.arc(
        landmark.x * ctx.canvas.width,
        landmark.y * ctx.canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  };

  const recognizeGesture = (landmarks: any[]): { name: string; confidence: number } | null => {
    if (!landmarks || landmarks.length !== 21) return null;

    // Enhanced gesture recognition with more gestures
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
    const fingerPips = [3, 6, 10, 14, 18]; // Finger PIP joints

    const fingersUp = fingerTips.map((tip, index) => {
      if (index === 0) { // Thumb
        return landmarks[tip].x > landmarks[fingerPips[index]].x;
      } else { // Other fingers
        return landmarks[tip].y < landmarks[fingerPips[index]].y;
      }
    });

    const upCount = fingersUp.filter(Boolean).length;

    // Advanced gesture recognition logic
    if (upCount === 0) {
      return { name: 'fist', confidence: 0.95 };
    } else if (upCount === 1 && fingersUp[1]) {
      return { name: 'point', confidence: 0.95 };
    } else if (upCount === 2 && fingersUp[1] && fingersUp[2]) {
      return { name: 'peace', confidence: 0.95 };
    } else if (upCount === 5) {
      return { name: 'open_hand', confidence: 0.95 };
    } else if (fingersUp[0] && fingersUp[4] && upCount === 2) {
      return { name: 'rock_on', confidence: 0.95 };
    } else if (fingersUp[0] && !fingersUp[1] && !fingersUp[2] && !fingersUp[3] && !fingersUp[4]) {
      return { name: 'thumbs_up', confidence: 0.9 };
    } else if (upCount === 3 && fingersUp[1] && fingersUp[2] && fingersUp[3]) {
      return { name: 'three', confidence: 0.9 };
    } else if (upCount === 4 && !fingersUp[0]) {
      return { name: 'four', confidence: 0.9 };
    }

    // Swipe gestures based on hand movement
    const indexTip = landmarks[8];
    if (fingersUp[1] && upCount === 1) {
      // Check for horizontal movement (swipe left/right)
      if (indexTip.x < 0.3) {
        return { name: 'swipe_left', confidence: 0.8 };
      } else if (indexTip.x > 0.7) {
        return { name: 'swipe_right', confidence: 0.8 };
      }
    }

    return null;
  };

  const startGestureRecognition = useCallback(async () => {
    try {
      console.log('Starting gesture recognition...');
      
      // Check if MediaPipe is available
      if (!window.Hands) {
        throw new Error('MediaPipe Hands not loaded. Please refresh the page.');
      }
      
      // Request camera permissions with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          const onLoadedData = () => {
            videoRef.current?.removeEventListener('loadeddata', onLoadedData);
            resolve(void 0);
          };
          videoRef.current?.addEventListener('loadeddata', onLoadedData);
        });
      }
      
      // Initialize hands if not already done
      if (!handsInstance) {
        await initializeHands();
      }
      
      // Start camera processing
      if (camera) {
        await camera.start();
      }
      
      setGestureState(prev => ({ ...prev, isActive: true }));
      console.log('Gesture recognition started successfully');
    } catch (error) {
      console.error('Failed to start gesture recognition:', error);
      setGestureState(prev => ({ ...prev, isActive: false }));
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Camera permission denied. Please allow camera access to use gesture control.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found. Please connect a camera to use gesture control.');
        } else {
          alert(`Gesture recognition error: ${error.message}`);
        }
      }
    }
  }, [handsInstance, camera, initializeHands]);

  const stopGestureRecognition = useCallback(async () => {
    try {
      console.log('Stopping gesture recognition...');
      
      if (camera) {
        await camera.stop();
      }
      
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      setGestureState(prev => ({ ...prev, isActive: false, gesture: null }));
      console.log('Gesture recognition stopped');
    } catch (error) {
      console.error('Error stopping gesture recognition:', error);
    }
  }, [camera]);

  const registerGestureCommand = useCallback((command: GestureCommand) => {
    setCommands(prev => [...prev.filter(cmd => cmd.name !== command.name), command]);
  }, []);

  // Initialize hands when component mounts
  useEffect(() => {
    if (window.Hands && !handsInstance) {
      initializeHands();
    }
  }, [handsInstance, initializeHands]);

  // Register dashboard navigation gesture commands
  useEffect(() => {
    const defaultCommands: GestureCommand[] = [
      {
        name: 'point',
        action: () => {
          // Simulate click on focused element
          const focusedElement = document.activeElement as HTMLElement;
          if (focusedElement && focusedElement.click) {
            focusedElement.click();
          }
        },
        description: 'Point to select focused item'
      },
      {
        name: 'fist',
        action: () => {
          // Navigate back or close modals
          const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
          document.dispatchEvent(escEvent);
        },
        description: 'Close fist to go back/close'
      },
      {
        name: 'open_hand',
        action: () => {
          // Toggle accessibility panel
          const accessibilityButton = document.querySelector('[aria-label*="accessibility"]') as HTMLElement;
          if (accessibilityButton) {
            accessibilityButton.click();
          }
        },
        description: 'Open hand to show accessibility menu'
      },
      {
        name: 'peace',
        action: () => {
          // Navigate to next tab/section
          const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
          document.dispatchEvent(tabEvent);
        },
        description: 'Peace sign to navigate forward'
      },
      {
        name: 'rock_on',
        action: () => {
          // Refresh dashboard data
          const refreshButton = document.querySelector('[aria-label*="refresh"]') as HTMLElement;
          if (refreshButton) {
            refreshButton.click();
          } else {
            // Fallback: dispatch custom refresh event
            window.dispatchEvent(new CustomEvent('gesture-refresh'));
          }
        },
        description: 'Rock on to refresh data'
      },
      {
        name: 'thumbs_up',
        action: () => {
          // Toggle between dashboard sections
          const sections = ['overview', 'power-consumers', 'room-consumption', 'ai-insights', 'savings-analysis'];
          const currentSection = document.querySelector('[data-active="true"]')?.getAttribute('data-section') || 'overview';
          const currentIndex = sections.indexOf(currentSection);
          const nextIndex = (currentIndex + 1) % sections.length;
          const nextSection = document.querySelector(`[data-section="${sections[nextIndex]}"]`) as HTMLElement;
          if (nextSection) {
            nextSection.click();
          }
        },
        description: 'Thumbs up to switch dashboard sections'
      },
      {
        name: 'swipe_left',
        action: () => {
          // Navigate to previous section
          const leftArrow = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
          document.dispatchEvent(leftArrow);
        },
        description: 'Swipe left to go to previous section'
      },
      {
        name: 'swipe_right',
        action: () => {
          // Navigate to next section
          const rightArrow = new KeyboardEvent('keydown', { key: 'ArrowRight' });
          document.dispatchEvent(rightArrow);
        },
        description: 'Swipe right to go to next section'
      },
      {
        name: 'three',
        action: () => {
          // Toggle voice commands
          window.dispatchEvent(new CustomEvent('toggle-voice-commands'));
        },
        description: 'Three fingers to toggle voice commands'
      },
      {
        name: 'four',
        action: () => {
          // Toggle high contrast mode
          window.dispatchEvent(new CustomEvent('toggle-high-contrast'));
        },
        description: 'Four fingers to toggle high contrast'
      }
    ];

    defaultCommands.forEach(registerGestureCommand);
  }, [registerGestureCommand]);

  return {
    gestureState,
    startGestureRecognition,
    stopGestureRecognition,
    registerGestureCommand,
    videoRef,
    canvasRef,
  };
};
