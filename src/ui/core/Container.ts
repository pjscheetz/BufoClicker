import { Component } from './Component';
import { ComponentOptions, ChildComponent, IComponent } from './types';
import * as Logger from '../../utils/logger';

/**
 * Container component that can hold child components
 */
export class Container extends Component {
  /** Child components */
  private children: ChildComponent[] = [];
  
  /**
   * Create a container component
   * @param options Component options
   */
  constructor(options: ComponentOptions = {}) {
    super(options);
  }
  
  /**
   * Add a child component
   * @param component Component to add
   * @param data Optional data to associate with component
   * @returns The added child component
   */
  public addChild(component: IComponent, data?: any): IComponent {
    // Add to children array
    this.children.push({ component, data });
    
    // Add component's element to container if both exist
    if (this.element && component.getElement()) {
      this.element.appendChild(component.getElement()!);
    }
    
    // Initialize if we're adding a Component instance
    // We need to check if it's an instance of Component to access its methods
    if (component instanceof Component) {
      component.init();
    } else {
      // Otherwise call init directly through the interface
      component.init();
    }
    
    return component;
  }
  
  /**
   * Remove a child component
   * @param componentOrId Component or component ID
   * @returns Success flag
   */
  public removeChild(componentOrId: IComponent | string): boolean {
    const index = typeof componentOrId === 'string'
      ? this.children.findIndex(c => c.component.getId() === componentOrId)
      : this.children.findIndex(c => c.component === componentOrId);
    
    if (index !== -1) {
      const { component } = this.children[index];
      
      // Remove element from DOM
      const element = component.getElement();
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Destroy component
      component.destroy();
      
      // Remove from children array
      this.children.splice(index, 1);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all child components
   */
  public getChildren(): ChildComponent[] {
    return [...this.children];
  }
  
  /**
   * Get a child component by ID
   * @param id Component ID
   */
  public getChildById(id: string): IComponent | null {
    const found = this.children.find(c => c.component.getId() === id);
    return found ? found.component : null;
  }
  
  /**
   * Clear all children
   */
  public clearChildren(): void {
    // Create a copy to avoid issues during iteration
    const childrenCopy = [...this.children];
    
    // Remove each child
    childrenCopy.forEach(child => {
      this.removeChild(child.component);
    });
  }
  
  /**
   * Override destroy to also destroy children
   */
  public destroy(): void {
    // Destroy all children first
    this.clearChildren();
    
    // Then destroy self
    super.destroy();
  }
  
  /**
   * Render all children (can be overridden)
   */
  public renderChildren(): void {
    if (!this.element) return;
    
    // Clear container first
    this.element.innerHTML = '';
    
    // Add each child's element
    this.children.forEach(({ component }) => {
      const childElement = component.getElement();
      if (childElement) {
        this.element!.appendChild(childElement);
      }
    });
  }
}