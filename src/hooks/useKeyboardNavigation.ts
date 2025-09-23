import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardNavigation = () => {
  const navigate = useNavigate();

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Check for modifier keys (Alt + key combinations)
    if (event.altKey) {
      event.preventDefault();
      
      switch (event.key.toLowerCase()) {
        case '1':
          navigate('/dashboard');
          break;
        case '2':
          navigate('/appliances');
          break;
        case '3':
          navigate('/routine');
          break;
        case '4':
          navigate('/ai-chat');
          break;
        default:
          break;
      }
    }

    // Handle escape key to close modals
    if (event.key === 'Escape') {
      // Add any escape key functionality here if needed
    }

    // Handle tab navigation
    if (event.key === 'Tab') {
      // Add any tab key functionality here if needed
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Focus management utilities
  const focusFirstElement = useCallback(() => {
    const firstFocusable = document.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const focusLastElement = useCallback(() => {
    const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (lastFocusable) {
      lastFocusable.focus();
    }
  }, []);

  const trapFocus = useCallback((containerSelector: string) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey as EventListener);
    return () => container.removeEventListener('keydown', handleTabKey as EventListener);
  }, []);

  return {
    focusFirstElement,
    focusLastElement,
    trapFocus,
  };
};
