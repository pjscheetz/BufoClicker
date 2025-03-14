import { getStateManager } from '../../core/stateManager';
import { getEventBus } from '../../core/eventBus';
import { IComponent, ComponentOptions, RenderOptions, StateSelector, ComponentEventHandler } from './types';
import * as Logger from '../../utils/logger';
// In Component.ts


/**
 * Base Component class for UI elements
 */
export class Component implements IComponent {
  /** The DOM element for this component */
  protected element: HTMLElement | null = null;
  /** Element ID */
  protected id: string | null = null;
  /** Whether component is initialized */
  protected initialized = false;
  /** Map of event handlers */
  private eventHandlers: Map<string, Set<ComponentEventHandler>> = new Map();
  /** State unsubscribe functions */
  private stateUnsubscribers: (() => void)[] = [];
  /** Event unsubscribers */
  private eventUnsubscribers: (() => void)[] = [];
  
  /**
   * Create a new component
   * @param options Component options
   */
  constructor(options: ComponentOptions = {}) {
    // Store ID for later reference
    this.id = options.id || null;
    
    // If element is provided, use it
    if (options.element) {
      this.element = options.element;
    } 
    // Otherwise, find or create element by ID
    else if (options.id) {
      this.element = document.getElementById(options.id);
      
      // If element doesn't exist, create it
      if (!this.element) {
        this.element = this.createElement(options.tagName || 'div', {
          id: options.id,
          className: options.className
        });
      }
    } 
    // Create a new element with no ID
    else {
      this.element = this.createElement(options.tagName || 'div', {
        className: options.className
      });
    }
    
    // Add class if provided and element exists
    if (this.element && options.className && !options.element) {
      this.addClass(options.className);
    }
    
    // Set template content if provided
    if (options.template && this.element) {
      this.setContent(options.template);
    }
  }
  
  /**
   * Initialize the component
   */
  public init(): void {
    if (this.initialized) return;
    
    try {
      // Call component's setup logic
      this.setup();
      
      // Mark as initialized
      this.initialized = true;
    } catch (error) {
      Logger.error(`Error initializing component ${this.id || 'unnamed'}:`, error);
    }
  }
  
  /**
   * Setup logic (override in subclasses)
   */
  protected setup(): void {
    // Override in subclasses
  }
  
  /**
   * Render the component (override in subclasses)
   */
  public render(): string | HTMLElement {
    // Default implementation returns empty string
    // Override in subclasses to provide content
    return '';
  }
  
  /**
   * Update the component (override in subclasses)
   * @param data Data to update with
   */
  public update(data?: any): void {
    // Default does nothing
    // Override in subclasses to handle updates
  }
  
  /**
   * Set the content of the element
   * @param content HTML string or element
   * @param options Render options
   */
  public setContent(content: string | HTMLElement, options: RenderOptions = { replace: true }): void {
    if (!this.element) return;
    
    if (typeof content === 'string') {
      if (options.replace) {
        this.element.innerHTML = content;
      } else if (options.append) {
        this.element.innerHTML += content;
      }
    } else {
      if (options.replace) {
        this.element.innerHTML = '';
        this.element.appendChild(content);
      } else if (options.append) {
        this.element.appendChild(content);
      }
    }
  }
  
  /**
   * Create an HTML element
   * @param tag Element tag name
   * @param options Element options
   */
  protected createElement(tag: string, options: { id?: string; className?: string } = {}): HTMLElement {
    const element = document.createElement(tag);
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.className) {
      element.className = options.className;
    }
    
    return element;
  }
  
  /**
   * Add a CSS class to the element
   * @param className Class name(s) to add
   */
  public addClass(className: string): void {
    if (!this.element) return;
    
    const classes = className.split(' ');
    this.element.classList.add(...classes);
  }
  
  /**
   * Remove a CSS class from the element
   * @param className Class name(s) to remove
   */
  public removeClass(className: string): void {
    if (!this.element) return;
    
    const classes = className.split(' ');
    this.element.classList.remove(...classes);
  }
  
  /**
   * Toggle a CSS class on the element
   * @param className Class name to toggle
   * @param force Force add or remove
   */
  public toggleClass(className: string, force?: boolean): void {
    if (!this.element) return;
    this.element.classList.toggle(className, force);
  }
  
  /**
   * Add an event listener
   * @param eventName Event name (e.g., 'click')
   * @param handler Event handler function
   */
  public addEventListener(eventName: string, handler: ComponentEventHandler): void {
    if (!this.element) return;
    
    // Store handler for cleanup
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    
    const handlers = this.eventHandlers.get(eventName)!;
    
    // Only add if not already added
    if (!handlers.has(handler)) {
      handlers.add(handler);
      this.element.addEventListener(eventName, handler);
    }
  }
  
  /**
   * Remove an event listener
   * @param eventName Event name
   * @param handler Event handler function
   */
  public removeEventListener(eventName: string, handler: ComponentEventHandler): void {
    if (!this.element) return;
    
    // Remove from element
    this.element.removeEventListener(eventName, handler);
    
    // Remove from our tracking
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName)!;
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventName);
      }
    }
  }
  
  /**
   * Connect to state changes
   * @param selector Function to select relevant part of state
   * @param onChange Callback when selected state changes
   */
  public connectToState<T>(selector: StateSelector<T>, onChange: (selectedState: T) => void): void {
    // Get initial state
    const initialState = selector(getStateManager().getState());
    
    // Call with initial state
    onChange(initialState);
    
    // Subscribe to state changes
    const unsubscribe = getStateManager().subscribe((newState, oldState) => {
      const newSelectedState = selector(newState);
      const oldSelectedState = selector(oldState);
      
      // Only call if selected state has changed
      if (JSON.stringify(newSelectedState) !== JSON.stringify(oldSelectedState)) {
        onChange(newSelectedState);
      }
    });
    
    // Store unsubscribe function for cleanup
    this.stateUnsubscribers.push(unsubscribe);
  }
  
  /**
   * Subscribe to an event
   * @param eventName Event name
   * @param callback Event callback
   */
  public subscribeToEvent<T>(eventName: string, callback: (data: T) => void): void {
    getEventBus().on(eventName, callback);
    
    // Store unsubscribe function
    this.eventUnsubscribers.push(() => {
      getEventBus().off(eventName, callback);
    });
  }
  
  /**
   * Get the component's element
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }
  
  /**
   * Get the component's ID
   */
  public getId(): string | null {
    return this.id;
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove all event listeners
    this.eventHandlers.forEach((handlers, eventName) => {
      handlers.forEach(handler => {
        if (this.element) {
          this.element.removeEventListener(eventName, handler);
        }
      });
    });
    this.eventHandlers.clear();
    
    // Unsubscribe from state
    this.stateUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.stateUnsubscribers = [];
    
    // Unsubscribe from events
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    
    // Clear element content
    if (this.element) {
      this.element.innerHTML = '';
    }
    
    // Mark as not initialized
    this.initialized = false;
  }
}