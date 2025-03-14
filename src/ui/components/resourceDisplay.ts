import { Component } from '../core/Component';
import { ComponentOptions } from '../core/types';
import { formatNumber, getNumberFullName, formatNumberWithPrecision } from '../../utils/numberUtils';
import { pulse } from '../../utils/animationUtils';
import { getResourceDisplay } from '../../game/gameState';
import { GameState } from '../../core/types';

export interface ResourceDisplayOptions extends ComponentOptions {
  /** Whether to show production rate */
  showProductionRate?: boolean;
}

/**
 * ResourceDisplay component shows current bufos and production rate
 */
export class ResourceDisplay extends Component {
  /** Whether to show production rate */
  private showProductionRate: boolean;
  /** Last known bufo count */
  private lastBufos: number = 0;
  /** Element for showing bufo count */
  private bufoCountElement: HTMLElement | null = null;
  /** Element for showing production rate */
  private productionRateElement: HTMLElement | null = null;

  /**
   * Create a resource display component
   */
  constructor(options: ResourceDisplayOptions = {}) {
    super({
      id: options.id || 'resource-display',
      className: options.className || 'resource-display',
      ...options
    });

    this.showProductionRate = options.showProductionRate !== false;
  }

  /**
   * Set up the component
   */
  protected setup(): void {
    // Find the existing element in the DOM
    this.element = document.getElementById(this.id || '');
    
    if (!this.element) {
      console.error(`ResourceDisplay: Element with ID "${this.id}" not found`);
      // Create the element if it doesn't exist
      this.element = document.createElement('div');
      this.element.id = this.id || '';
      this.element.className = 'resource-display';
      
      // Find where to append the element (left column)
      const leftColumn = document.querySelector('.left-column');
      if (leftColumn) {
        leftColumn.prepend(this.element);
      } else {
        document.body.appendChild(this.element);
      }
    }
    
    // Make sure the element has the proper styling
    this.element.style.display = 'block';
    this.element.style.visibility = 'visible';
    this.element.style.minHeight = '80px';
    this.element.style.width = '100%';

    // Check if child elements exist
    this.bufoCountElement = this.element.querySelector('.resource-count');
    this.productionRateElement = this.element.querySelector('.production-rate');
    
    // Create child elements if they don't exist
    if (!this.bufoCountElement) {
      this.bufoCountElement = document.createElement('div');
      this.bufoCountElement.className = 'resource-count';
      this.element.appendChild(this.bufoCountElement);
      this.bufoCountElement.innerHTML = `
        <span class="number-value">0</span>
        <span class="number-label">Bufos</span>
      `;
    }
    
    if (!this.productionRateElement && this.showProductionRate) {
      this.productionRateElement = document.createElement('div');
      this.productionRateElement.className = 'production-rate';
      this.element.appendChild(this.productionRateElement);
      this.productionRateElement.textContent = '0/sec';
    }

    // Connect to state
    this.connectToState(
      (state: GameState) => {
        const resourceDisplay = getResourceDisplay(state);
        return { 
          bufos: resourceDisplay.bufos,
          totalProduction: resourceDisplay.productionRate
        };
      },
      this.handleStateChange.bind(this)
    );

    // Subscribe to production change events
    this.subscribeToEvent('productionChanged', (data: { totalProduction: number }) => {
      if (this.productionRateElement) {
        this.updateProductionRate(data.totalProduction);
      }
    });
  }

  /**
   * Handle state changes
   */
  private handleStateChange(data: { bufos: number, totalProduction: number }): void {
    const { bufos, totalProduction } = data;

    // Update bufo count
    if (this.bufoCountElement) {
      this.updateBufoCount(bufos);
    }

    // Update production rate
    if (this.productionRateElement && this.showProductionRate) {
      this.updateProductionRate(totalProduction);
    }
  }

  /**
   * Update bufo count with animation if significant change
   */
  private updateBufoCount(bufos: number): void {
    if (!this.bufoCountElement) return;

    // Format the number with 3 significant digits
    const formattedNumber = formatNumberWithPrecision(Math.floor(bufos));
    const fullName = getNumberFullName(Math.floor(bufos));
    
    // Create HTML structure with the number on top and the full name + "bufos" below
    this.bufoCountElement.innerHTML = `
      <span class="number-value">${formattedNumber}</span>
      <span class="number-label">${fullName} Bufos</span>
    `;

    // Animate if there was a significant change
    const change = bufos - this.lastBufos;

    this.lastBufos = bufos;
  }

  /**
   * Update production rate with animation
   */
  private updateProductionRate(productionPerSecond: number): void {
    if (!this.productionRateElement) return;

    // Format the production rate
    this.productionRateElement.textContent = `${formatNumber(productionPerSecond)} bufos/sec`;
    
    // Add animation class
    this.productionRateElement.classList.add('production-updated');
    
    // Remove animation class after animation completes
    setTimeout(() => {
      if (this.productionRateElement) {
        this.productionRateElement.classList.remove('production-updated');
      }
    }, 300);
  }

  /**
   * Render the resource display
   */
  public render(): string {
    return `
      <div class="resource-count">
        <span class="number-value">0</span>
        <span class="number-label">Bufos</span>
      </div>
      ${this.showProductionRate ? '<div class="production-rate">0/sec</div>' : ''}
    `;
  }

  /**
   * Update the component
   */
  public update(data?: { bufos?: number; productionRate?: number }): void {
    if (!data) return;

    if (data.bufos !== undefined && this.bufoCountElement) {
      this.updateBufoCount(data.bufos);
    }

    if (data.productionRate !== undefined && this.productionRateElement) {
      this.updateProductionRate(data.productionRate);
    }
  }
}