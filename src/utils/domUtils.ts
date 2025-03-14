/**
 * Utility functions for DOM manipulation
 */

/**
 * Options for creating an element
 */
export interface CreateElementOptions {
    id?: string;
    classes?: string | string[];
    attributes?: Record<string, string>;
    content?: string | HTMLElement | HTMLElement[];
    events?: Record<string, EventListenerOrEventListenerObject>;
    parent?: HTMLElement;
  }
  
  /**
   * Creates an HTML element with specified options
   * @param tag - Tag name of the element to create
   * @param options - Configuration options
   * @returns The created HTML element
   */
  export function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options: CreateElementOptions = {}
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    
    // Set ID if specified
    if (options.id) {
      element.id = options.id;
    }
    
    // Add classes
    if (options.classes) {
      const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
      classes.forEach(className => {
        if (className) {
          element.classList.add(className);
        }
      });
    }
    
    // Set attributes
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    // Add content
    if (options.content !== undefined) {
      setContent(element, options.content);
    }
    
    // Add event listeners
    if (options.events) {
      addEventListeners(element, options.events);
    }
    
    // Append to parent if specified
    if (options.parent) {
      options.parent.appendChild(element);
    }
    
    return element;
  }
  
  /**
   * Adds a CSS class to an element
   * @param element - The target element
   * @param className - The class name to add
   * @returns The modified element
   */
  export function addClass<T extends HTMLElement>(element: T, className: string): T {
    if (!element || !className) return element;
    
    try {
      element.classList.add(className);
    } catch (error) {
      console.error('Error adding class:', error);
    }
    
    return element;
  }
  
  /**
   * Removes a CSS class from an element
   * @param element - The target element
   * @param className - The class name to remove
   * @returns The modified element
   */
  export function removeClass<T extends HTMLElement>(element: T, className: string): T {
    if (!element || !className) return element;
    
    try {
      element.classList.remove(className);
    } catch (error) {
      console.error('Error removing class:', error);
    }
    
    return element;
  }
  
  /**
   * Toggles a CSS class on an element
   * @param element - The target element
   * @param className - The class name to toggle
   * @param force - Optional boolean to force add or remove
   * @returns The modified element
   */
  export function toggleClass<T extends HTMLElement>(element: T, className: string, force?: boolean): T {
    if (!element || !className) return element;
    
    try {
      element.classList.toggle(className, force);
    } catch (error) {
      console.error('Error toggling class:', error);
    }
    
    return element;
  }
  
  /**
   * Sets content of an element
   * @param element - The target element
   * @param content - The content to set (string, element or array of elements)
   * @returns The modified element
   */
  export function setContent<T extends HTMLElement>(
    element: T,
    content: string | HTMLElement | HTMLElement[]
  ): T {
    if (!element) return element;
    
    try {
      // Clear current content
      element.innerHTML = '';
      
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (Array.isArray(content)) {
        content.forEach(child => {
          if (child instanceof HTMLElement) {
            element.appendChild(child);
          }
        });
      } else if (content instanceof HTMLElement) {
        element.appendChild(content);
      }
    } catch (error) {
      console.error('Error setting content:', error);
    }
    
    return element;
  }
  
  /**
   * Adds multiple event listeners to an element
   * @param element - The target element
   * @param events - Object mapping event names to listener functions
   * @returns The modified element
   */
  export function addEventListeners<T extends HTMLElement>(
    element: T,
    events: Record<string, EventListenerOrEventListenerObject>
  ): T {
    if (!element || !events) return element;
    
    Object.entries(events).forEach(([eventName, listener]) => {
      try {
        element.addEventListener(eventName, listener);
      } catch (error) {
        console.error(`Error adding ${eventName} event listener:`, error);
      }
    });
    
    return element;
  }
  
  /**
   * Safely queries the DOM for an element by selector
   * @param selector - CSS selector string
   * @param parent - Optional parent element to search within
   * @returns The found element or null
   */
  export function querySelector<T extends HTMLElement>(
    selector: string,
    parent: HTMLElement | Document = document
  ): T | null {
    try {
      return parent.querySelector<T>(selector);
    } catch (error) {
      console.error(`Error querying for selector "${selector}":`, error);
      return null;
    }
  }
  
  /**
   * Safely queries the DOM for all elements matching a selector
   * @param selector - CSS selector string
   * @param parent - Optional parent element to search within
   * @returns Array of found elements
   */
  export function querySelectorAll<T extends HTMLElement>(
    selector: string,
    parent: HTMLElement | Document = document
  ): T[] {
    try {
      return Array.from(parent.querySelectorAll<T>(selector));
    } catch (error) {
      console.error(`Error querying for all "${selector}":`, error);
      return [];
    }
  }
  
  /**
   * Removes an element from the DOM
   * @param element - The element to remove
   */
  export function removeElement(element: HTMLElement | null): void {
    if (!element) return;
    
    try {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      console.error('Error removing element:', error);
    }
  }
  
  /**
   * Sets an element's display style
   * @param element - The target element
   * @param visible - Whether the element should be visible
   * @returns The modified element
   */
  export function setVisible<T extends HTMLElement>(element: T, visible: boolean): T {
    if (!element) return element;
    
    try {
      element.style.display = visible ? '' : 'none';
    } catch (error) {
      console.error('Error setting visibility:', error);
    }
    
    return element;
  }