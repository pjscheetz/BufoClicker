/**
 * Utility functions for animations and visual effects
 * Provides simple animation capabilities for DOM elements
 */

/**
 * Animation options
 */
export interface AnimationOptions {
    duration?: number;
    delay?: number;
    easing?: (t: number) => number;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
  }
  
  /**
   * CSS property animation options
   */
  export interface CSSAnimationOptions extends AnimationOptions {
    properties: Record<string, string | number>;
  }
  
  /**
   * Standard easing functions
   */
  export const Easing = {
    /**
     * Linear easing (no easing)
     */
    linear: (t: number): number => t,
    
    /**
     * Ease in (accelerating)
     */
    easeIn: (t: number): number => t * t,
    
    /**
     * Ease out (decelerating)
     */
    easeOut: (t: number): number => t * (2 - t),
    
    /**
     * Ease in and out (accelerate then decelerate)
     */
    easeInOut: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    /**
     * Elastic bouncing effect
     */
    elastic: (t: number): number => {
      const p = 0.3;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    
    /**
     * Bouncing effect
     */
    bounce: (t: number): number => {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        const t2 = t - 1.5 / 2.75;
        return 7.5625 * t2 * t2 + 0.75;
      } else if (t < 2.5 / 2.75) {
        const t2 = t - 2.25 / 2.75;
        return 7.5625 * t2 * t2 + 0.9375;
      } else {
        const t2 = t - 2.625 / 2.75;
        return 7.5625 * t2 * t2 + 0.984375;
      }
    }
  };
  
  /**
   * Animates a function over time
   * @param duration - Animation duration in milliseconds
   * @param onProgress - Callback for each animation frame with progress (0-1)
   * @param options - Additional animation options
   * @returns A promise that resolves when animation completes
   */
  export function animate(
    duration: number,
    onProgress: (progress: number) => void,
    options: Omit<AnimationOptions, 'duration'> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const easing = options.easing || Easing.linear;
      
      // Handle delay
      if (options.delay && options.delay > 0) {
        setTimeout(() => runAnimation(), options.delay);
      } else {
        runAnimation();
      }
      
      function runAnimation() {
        let rafId: number;
        
        const step = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const rawProgress = Math.min(elapsed / duration, 1);
          const progress = easing(rawProgress);
          
          // Call update callback
          onProgress(progress);
          
          if (options.onUpdate) {
            options.onUpdate(progress);
          }
          
          if (rawProgress < 1) {
            rafId = requestAnimationFrame(step);
          } else {
            if (options.onComplete) {
              options.onComplete();
            }
            resolve();
          }
        };
        
        rafId = requestAnimationFrame(step);
      }
    });
  }
  
  /**
   * Animates CSS properties of an element
   * @param element - The target element
   * @param options - Animation options including CSS properties
   * @returns A promise that resolves when animation completes
   */
  export function animateElement(
    element: HTMLElement,
    options: CSSAnimationOptions
  ): Promise<void> {
    if (!element) {
      return Promise.reject(new Error('Element is required'));
    }
    
    const duration = options.duration || 300;
    const cssProperties = options.properties || {};
    
    // Store initial values
    const initialValues: Record<string, string> = {};
    const targetValues: Record<string, string> = {};
    const units: Record<string, string> = {};
    
    // Parse properties and extract initial values, target values, and units
    Object.entries(cssProperties).forEach(([prop, targetValue]) => {
      const computed = window.getComputedStyle(element);
      const initialValue = computed[prop as any] || '0';
      
      // Convert target value to string
      const targetValueStr = String(targetValue);
      
      // Check for units (px, %, em, etc.)
      const match = initialValue.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
      const unit = match ? match[2] : '';
      
      // Store for animation
      initialValues[prop] = initialValue;
      targetValues[prop] = targetValueStr;
      units[prop] = unit;
    });
    
    return animate(
      duration,
      (progress) => {
        // Update all properties based on progress
        Object.keys(cssProperties).forEach((prop) => {
          // Get numeric values without units
          const initialMatch = initialValues[prop].match(/^(-?\d*\.?\d+)/);
          const targetMatch = targetValues[prop].match(/^(-?\d*\.?\d+)/);
          
          if (initialMatch && targetMatch) {
            const initialNum = parseFloat(initialMatch[0]);
            const targetNum = parseFloat(targetMatch[0]);
            const currentValue = initialNum + (targetNum - initialNum) * progress;
            
            // Apply with correct unit
            element.style[prop as any] = `${currentValue}${units[prop]}`;
          }
        });
      },
      {
        easing: options.easing || Easing.easeInOut,
        delay: options.delay,
        onUpdate: options.onUpdate,
        onComplete: options.onComplete
      }
    );
  }
  
  /**
   * Fades in an element
   * @param element - The element to fade in
   * @param duration - Animation duration in milliseconds (default: 300)
   * @returns Promise that resolves when animation completes
   */
  export function fadeIn(element: HTMLElement, duration: number = 300): Promise<void> {
    if (!element) {
      return Promise.reject(new Error('Element is required'));
    }
    
    // Set initial state
    element.style.opacity = '0';
    element.style.display = '';
    
    // Animate opacity
    return animateElement(element, {
      duration,
      properties: {
        opacity: 1
      },
      easing: Easing.easeInOut
    });
  }
  
  /**
   * Fades out an element
   * @param element - The element to fade out
   * @param duration - Animation duration in milliseconds (default: 300)
   * @param removeElement - Whether to set display:none after fade (default: true)
   * @returns Promise that resolves when animation completes
   */
  export function fadeOut(
    element: HTMLElement, 
    duration: number = 300,
    removeElement: boolean = true
  ): Promise<void> {
    if (!element) {
      return Promise.reject(new Error('Element is required'));
    }
    
    // Animate opacity
    return animateElement(element, {
      duration,
      properties: {
        opacity: 0
      },
      easing: Easing.easeInOut,
      onComplete: () => {
        if (removeElement) {
          element.style.display = 'none';
        }
      }
    });
  }
  
  /**
   * Creates a pulse animation on an element
   * @param element - The element to animate
   * @param scale - Maximum scale factor (default: 1.05)
   * @param duration - Animation duration in milliseconds (default: 600)
   * @returns Promise that resolves when animation completes
   */
  export function pulse(
    element: HTMLElement, 
    scale: number = 1.05, 
    duration: number = 600
  ): Promise<void> {
    if (!element) {
      return Promise.reject(new Error('Element is required'));
    }
    
    // Store original transform
    const originalTransform = element.style.transform || '';
    
    // Create half-duration animations for pulse up and down
    const halfDuration = duration / 2;
    
    return animate(
      halfDuration,
      (progress) => {
        // Scale up from 1 to scale
        const currentScale = 1 + (scale - 1) * progress;
        element.style.transform = `${originalTransform} scale(${currentScale})`;
      },
      { 
        easing: Easing.easeOut,
        onComplete: () => {
          // Scale back down
          animate(
            halfDuration,
            (progress) => {
              const currentScale = scale - (scale - 1) * progress;
              element.style.transform = `${originalTransform} scale(${currentScale})`;
            },
            { 
              easing: Easing.easeIn,
              onComplete: () => {
                // Reset to original
                element.style.transform = originalTransform;
              }
            }
          );
        }
      }
    );
  }
  
  /**
   * Creates a shake animation on an element
   * @param element - The element to animate
   * @param intensity - Shake intensity in pixels (default: 5)
   * @param duration - Animation duration in milliseconds (default: 500)
   * @returns Promise that resolves when animation completes
   */
  export function shake(
    element: HTMLElement, 
    intensity: number = 5, 
    duration: number = 500
  ): Promise<void> {
    if (!element) {
      return Promise.reject(new Error('Element is required'));
    }
    
    // Store original transform
    const originalTransform = element.style.transform || '';
    
    // Shake pattern (right, left, smaller right, smaller left, etc.)
    const steps = 6;
    const stepDuration = duration / steps;
    
    return new Promise((resolve) => {
      let currentStep = 0;
      
      function shakeStep() {
        if (currentStep >= steps) {
          // Reset to original position and resolve
          element.style.transform = originalTransform;
          resolve();
          return;
        }
        
        // Calculate direction and diminishing intensity
        const direction = currentStep % 2 === 0 ? 1 : -1;
        const diminish = 1 - (currentStep / steps);
        const offset = intensity * direction * diminish;
        
        // Apply transform
        element.style.transform = `${originalTransform} translateX(${offset}px)`;
        
        // Next step
        currentStep++;
        setTimeout(shakeStep, stepDuration);
      }
      
      // Start shake animation
      shakeStep();
    });
  }