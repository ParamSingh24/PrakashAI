import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface FocusableElement {
  element: HTMLElement;
  rect: DOMRect;
  index: number;
  type: 'button' | 'link' | 'input' | 'card' | 'other';
}

interface ScrollState {
  canScrollUp: boolean;
  canScrollDown: boolean;
  scrollPosition: number;
  maxScroll: number;
}

export const useTouchlessNavigation = () => {
  const { speak, settings } = useAccessibility();
  const [focusedElementIndex, setFocusedElementIndex] = useState(-1);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollUp: false,
    canScrollDown: false,
    scrollPosition: 0,
    maxScroll: 0
  });
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Create visual highlight overlay
  const createHighlightOverlay = useCallback(() => {
    if (!highlightRef.current) {
      const overlay = document.createElement('div');
      overlay.id = 'gesture-highlight-overlay';
      overlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        border: 3px solid #3b82f6;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.1);
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        transition: all 0.2s ease;
        display: none;
      `;
      document.body.appendChild(overlay);
      highlightRef.current = overlay;
    }
    return highlightRef.current;
  }, []);

  // Update scroll state
  const updateScrollState = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = documentHeight - windowHeight;

    setScrollState({
      canScrollUp: scrollTop > 0,
      canScrollDown: scrollTop < maxScroll,
      scrollPosition: scrollTop,
      maxScroll
    });
  }, []);

  // Find all focusable elements
  const updateFocusableElements = useCallback(() => {
    const selectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '.dashboard-card',
      '.appliance-card',
      '.routine-card',
      '[role="button"]',
      '[data-selectable="true"]'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    const focusableList: FocusableElement[] = [];

    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      // Only include visible elements
      if (rect.width > 0 && rect.height > 0 && 
          rect.top < window.innerHeight && rect.bottom > 0) {
        
        let type: FocusableElement['type'] = 'other';
        if (htmlElement.tagName === 'BUTTON') type = 'button';
        else if (htmlElement.tagName === 'A') type = 'link';
        else if (htmlElement.tagName === 'INPUT' || htmlElement.tagName === 'TEXTAREA') type = 'input';
        else if (htmlElement.classList.contains('card') || htmlElement.getAttribute('role') === 'button') type = 'card';

        focusableList.push({
          element: htmlElement,
          rect,
          index,
          type
        });
      }
    });

    // Sort by position (top to bottom, left to right)
    focusableList.sort((a, b) => {
      const topDiff = a.rect.top - b.rect.top;
      if (Math.abs(topDiff) > 10) return topDiff;
      return a.rect.left - b.rect.left;
    });

    setFocusableElements(focusableList);
  }, []);

  // Highlight focused element
  const highlightElement = useCallback((element: HTMLElement | null) => {
    const overlay = createHighlightOverlay();
    
    if (!element || !overlay) {
      overlay.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = `${rect.left - 5}px`;
    overlay.style.top = `${rect.top - 5}px`;
    overlay.style.width = `${rect.width + 10}px`;
    overlay.style.height = `${rect.height + 10}px`;

    // Announce element
    if (settings.textToSpeech) {
      const label = element.getAttribute('aria-label') || 
                   element.getAttribute('title') || 
                   element.textContent?.trim() || 
                   `${element.tagName.toLowerCase()} element`;
      speak(`Focused on ${label}`);
    }
  }, [createHighlightOverlay, speak, settings.textToSpeech]);

  // Navigation functions
  const scrollUp = useCallback((amount = 100) => {
    if (scrollState.canScrollUp) {
      window.scrollBy({ top: -amount, behavior: 'smooth' });
      if (settings.textToSpeech) speak('Scrolling up');
    }
  }, [scrollState.canScrollUp, settings.textToSpeech, speak]);

  const scrollDown = useCallback((amount = 100) => {
    if (scrollState.canScrollDown) {
      window.scrollBy({ top: amount, behavior: 'smooth' });
      if (settings.textToSpeech) speak('Scrolling down');
    }
  }, [scrollState.canScrollDown, settings.textToSpeech, speak]);

  const selectPrevious = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const newIndex = focusedElementIndex <= 0 
      ? focusableElements.length - 1 
      : focusedElementIndex - 1;
    
    setFocusedElementIndex(newIndex);
    const element = focusableElements[newIndex]?.element;
    
    if (element) {
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(element);
    }
  }, [focusableElements, focusedElementIndex, highlightElement]);

  const selectNext = useCallback(() => {
    if (focusableElements.length === 0) return;
    
    const newIndex = focusedElementIndex >= focusableElements.length - 1 
      ? 0 
      : focusedElementIndex + 1;
    
    setFocusedElementIndex(newIndex);
    const element = focusableElements[newIndex]?.element;
    
    if (element) {
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(element);
    }
  }, [focusableElements, focusedElementIndex, highlightElement]);

  const activateSelected = useCallback(() => {
    if (focusedElementIndex >= 0 && focusableElements[focusedElementIndex]) {
      const element = focusableElements[focusedElementIndex].element;
      
      // Simulate click or focus
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.focus();
        if (settings.textToSpeech) speak('Input field activated');
      } else {
        element.click();
        if (settings.textToSpeech) speak('Element activated');
      }
    }
  }, [focusedElementIndex, focusableElements, settings.textToSpeech, speak]);

  const startNavigation = useCallback(() => {
    setIsNavigationMode(true);
    updateFocusableElements();
    updateScrollState();
    
    if (focusableElements.length > 0) {
      setFocusedElementIndex(0);
      highlightElement(focusableElements[0]?.element);
    }
    
    if (settings.textToSpeech) {
      speak('Navigation mode activated. Use gestures to scroll and select elements.');
    }
  }, [updateFocusableElements, updateScrollState, focusableElements, highlightElement, settings.textToSpeech, speak]);

  const stopNavigation = useCallback(() => {
    setIsNavigationMode(false);
    setFocusedElementIndex(-1);
    
    const overlay = document.getElementById('gesture-highlight-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    if (settings.textToSpeech) {
      speak('Navigation mode deactivated');
    }
  }, [settings.textToSpeech, speak]);

  // Update elements and scroll state periodically
  useEffect(() => {
    if (!isNavigationMode) return;

    const interval = setInterval(() => {
      updateFocusableElements();
      updateScrollState();
    }, 1000);

    return () => clearInterval(interval);
  }, [isNavigationMode, updateFocusableElements, updateScrollState]);

  // Update scroll state on scroll
  useEffect(() => {
    const handleScroll = () => updateScrollState();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateScrollState]);

  // Cleanup overlay on unmount
  useEffect(() => {
    return () => {
      const overlay = document.getElementById('gesture-highlight-overlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, []);

  return {
    isNavigationMode,
    focusedElementIndex,
    focusableElements,
    scrollState,
    startNavigation,
    stopNavigation,
    scrollUp,
    scrollDown,
    selectPrevious,
    selectNext,
    activateSelected,
    highlightElement
  };
};
