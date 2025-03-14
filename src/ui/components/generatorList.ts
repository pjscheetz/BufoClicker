// src/ui/components/generatorList.ts
import { Container } from '../core/Container';
import { ComponentOptions } from '../core/types';
import { GeneratorItem } from './generatorItem';
import { getGameCore } from '../../game/gameCore';
import { getStateManager } from '../../core/stateManager';
import { GeneratorData } from '../../models/generators';

/**
 * Container component that displays owned generators
 */
export class GeneratorList extends Container {
  /** Element for empty state messaging */
  private emptyStateElement: HTMLElement | null = null;

  /**
   * Create a generator list component
   */
  constructor(options: ComponentOptions = {}) {
    super({
      id: options.id || 'owned-generators',
      className: options.className || 'owned-generators-container panel',
      ...options
    });
  }

  // Add this to src/ui/components/generatorList.ts in the setup method

/**
 * Set up the component
 */
protected setup(): void {
  // Find the generators container within our element
  let generatorsContainer = this.element?.querySelector('.generators-container');
  
  // If it doesn't exist, create it (for backwards compatibility)
  if (!generatorsContainer && this.element) {
    generatorsContainer = document.createElement('div');
    generatorsContainer.classList.add('generators-container');
    this.element.appendChild(generatorsContainer);

    // Find or create empty state element
    this.emptyStateElement = generatorsContainer.querySelector('.empty-generators');
    if (!this.emptyStateElement) {
      this.emptyStateElement = document.createElement('div');
      this.emptyStateElement.classList.add('empty-generators');
      this.emptyStateElement.textContent = 'No frogs yet! Buy some from the shop.';
      generatorsContainer.appendChild(this.emptyStateElement);
    }
  } else {
    // Find empty state element
    this.emptyStateElement = this.element?.querySelector('.empty-generators') || null;
  }

  // Connect to state to get owned generators
  this.connectToState(
    state => {
      // Get all generators from state
      const generators = state.generators;
      // Filter to only show owned generators
      return Object.values(generators).filter(g => g.count > 0);
    },
    this.updateGenerators.bind(this)
  );

  // Listen for generator purchase events
  this.subscribeToEvent('GENERATOR_PURCHASED', () => {
    this.refreshGenerators();
  });
  
  // Listen for game loaded events
  this.subscribeToEvent('GAME_LOADED', () => {
    this.refreshGenerators();
  });
  
  // Listen for explicit UI refresh events
  this.subscribeToEvent('refreshUI', () => {
    this.refreshGenerators();
  });
  
  // Force refresh on initialization
  setTimeout(() => {
    this.refreshGenerators();
  }, 200);
}

  /**
   * Update generators based on state change
   */
  private updateGenerators(ownedGenerators: GeneratorData[]): void {
    // Clear all children
    this.clearChildren();
    
    // Show empty state or generators
    if (ownedGenerators.length === 0) {
      if (this.emptyStateElement) {
        // Make sure the empty state element is in the DOM
        if (!this.element?.contains(this.emptyStateElement)) {
          this.element?.querySelector('.generators-container')?.appendChild(this.emptyStateElement);
        }
        this.emptyStateElement.style.display = '';
      }
    } else {
      if (this.emptyStateElement) {
        this.emptyStateElement.style.display = 'none';
      }
      
      // Add generator items for each owned generator
      ownedGenerators.forEach(generator => {
        
        const generatorItem = new GeneratorItem({
          id: `generator-${generator.id}`,
          className: `owned-generator category-${generator.category}`
        });
        
        this.addChild(generatorItem);
        generatorItem.update(generator);
      });
    }
    
    // Update parent count indicator
    this.updateGeneratorCountIndicator(ownedGenerators.length);
  }

  /**
   * Update the generator count indicator
   */
  private updateGeneratorCountIndicator(count: number): void {
    // Find the generators panel header
    const generatorsPanel = document.getElementById('owned-generators');
    if (!generatorsPanel) return;
    
    const header = generatorsPanel.querySelector('.panel-header h2');
    
    if (header) {
      header.textContent = count > 0 ? `Your Frogs (${count})` : 'Your Frogs';
    }
  }

  /**
   * Refresh all generators
   */
  public refreshGenerators(): void {
    const state = getStateManager().getState();
    const generators = state.generators;
    const ownedGenerators = Object.values(generators).filter(g => g.count > 0);
    this.updateGenerators(ownedGenerators);
  }
}