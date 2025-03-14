import { GameState } from '../../core/types';

/**
 * Options for creating a component
 */
export interface ComponentOptions {
  /** Existing HTML element to use */
  element?: HTMLElement;
  /** Element ID to find or create */
  id?: string;
  /** CSS class name(s) to add */
  className?: string;
  /** HTML template string */
  template?: string;
  /** Tag name for creating element (defaults to 'div') */
  tagName?: string;
}

/**
 * Options for rendering content
 */
export interface RenderOptions {
  /** Replace existing content */
  replace?: boolean;
  /** Append to existing content */
  append?: boolean;
}

/**
 * Function to select part of the state
 */
export type StateSelector<T> = (state: GameState) => T;

/**
 * Component event handler
 */
export type ComponentEventHandler = (event: Event) => void;

/**
 * Mapping of event names to handlers
 */
export interface EventHandlerMap {
  [eventName: string]: ComponentEventHandler;
}

/**
 * Child component with optional data
 * Uses IComponent interface to avoid circular reference
 */
export interface ChildComponent {
  component: IComponent;
  data?: any;
}

/**
 * Interface for Component class to avoid circular dependency
 */
export interface IComponent {
  init(): void;
  render(): string | HTMLElement;
  update(data?: any): void;
  destroy(): void;
  getElement(): HTMLElement | null;
  getId(): string | null;
}