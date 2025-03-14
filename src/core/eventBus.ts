import * as Logger from '../utils/logger';

/**
 * Type definition for event callback functions
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * EventBus class for decoupled component communication
 */
export class EventBus {
  private static instance: EventBus;
  private events: Map<string, EventCallback[]> = new Map();
  private debugMode: boolean = false;
  private excludedEvents: Set<string> = new Set()
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Enable or disable event debugging
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Subscribe to an event
   * @param eventName Name of the event to listen for
   * @param callback Function to call when event is emitted
   */
  public on<T>(eventName: string, callback: EventCallback<T>): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    const callbacks = this.events.get(eventName)!;
    
    // Prevent duplicate subscriptions
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
      
      if (this.debugMode) {
        Logger.debug(`EventBus: Subscribed to '${eventName}'`, { 
          listenersCount: callbacks.length 
        });
      }
    }
  }
  /**
   * Set events to exclude from debug logging
   * @param eventNames Array of event names to exclude from logs
   */
  public setExcludedEvents(eventNames: string[]): void {
    this.excludedEvents = new Set(eventNames);
  }
  
  /**
   * Add an event to the excluded events list
   * @param eventName Event name to exclude from logs
   */
  public addExcludedEvent(eventName: string): void {
    this.excludedEvents.add(eventName);
  }
  
  /**
   * Remove an event from the excluded events list
   * @param eventName Event name to include in logs again
   */
  public removeExcludedEvent(eventName: string): void {
    this.excludedEvents.delete(eventName);
  }
  /**
   * Unsubscribe from an event
   * @param eventName Name of the event
   * @param callback The callback to remove
   */
  public off<T>(eventName: string, callback: EventCallback<T>): void {
    if (!this.events.has(eventName)) return;
    
    const callbacks = this.events.get(eventName)!;
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      
      if (this.debugMode) {
        Logger.debug(`EventBus: Unsubscribed from '${eventName}'`, { 
          listenersCount: callbacks.length 
        });
      }
      
      // Clean up empty event arrays
      if (callbacks.length === 0) {
        this.events.delete(eventName);
      }
    }
  }
  
  /**
   * Emit an event with data
   * @param eventName Name of the event to emit
   * @param data Data to pass to subscribers
   */
  /**
   * Emit an event with data
   * @param eventName Name of the event to emit
   * @param data Data to pass to subscribers
   */
  public emit<T>(eventName: string, data?: T): void {
    if (!this.events.has(eventName)) {
      if (this.debugMode && !this.excludedEvents.has(eventName)) {
        Logger.debug(`EventBus: Emitted '${eventName}' (no listeners)`);
      }
      return;
    }
    
    const callbacks = this.events.get(eventName)!;
    
    if (this.debugMode && !this.excludedEvents.has(eventName)) {
      Logger.debug(`EventBus: Emitting '${eventName}'`, {
        listenersCount: callbacks.length,
        payload: data
      });
      Logger.group(`EventBus: '${eventName}' callbacks`);
    }
    
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        Logger.error(`Error in '${eventName}' event handler:`, error);
      }
    }
    
    if (this.debugMode && !this.excludedEvents.has(eventName)) {
      Logger.groupEnd();
    }
  }
  
  /**
   * Check if an event has subscribers
   * @param eventName Name of the event
   * @returns True if the event has subscribers
   */
  public hasListeners(eventName: string): boolean {
    return this.events.has(eventName) && this.events.get(eventName)!.length > 0;
  }
  
  /**
   * Get the number of subscribers for an event
   * @param eventName Name of the event
   * @returns Number of subscribers
   */
  public getListenerCount(eventName: string): number {
    if (!this.events.has(eventName)) return 0;
    return this.events.get(eventName)!.length;
  }
  
  /**
   * Remove all subscribers for an event
   * @param eventName Name of the event
   */
  public clearEvent(eventName: string): void {
    if (this.events.has(eventName)) {
      if (this.debugMode) {
        const count = this.events.get(eventName)!.length;
        Logger.debug(`EventBus: Cleared all listeners for '${eventName}'`, { 
          removedCount: count 
        });
      }
      
      this.events.delete(eventName);
    }
  }
  
  /**
   * Remove all event subscribers
   */
  public clearAllEvents(): void {
    if (this.debugMode) {
      Logger.debug('EventBus: Cleared all events and listeners');
    }
    
    this.events.clear();
  }
  
  /**
   * Get all registered event names
   * @returns Array of event names
   */
  public getEventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

/**
 * Helper function to get EventBus instance
 */
export function getEventBus(): EventBus {
  return EventBus.getInstance();
}