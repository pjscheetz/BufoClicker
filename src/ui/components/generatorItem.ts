// src/ui/components/generatorItem.ts
import { Component } from '../core/Component';
import { ComponentOptions } from '../core/types';
import { GeneratorData, GeneratorCategory } from '../../models/generators';
import { formatNumber } from '../../utils/numberUtils';
import { getStateManager } from '../../core/stateManager';
import { showTooltip, updateTooltipPosition, hideTooltip } from '../../utils/tooltipUtils';

/**
 * Component for displaying a single owned generator
 */
export class GeneratorItem extends Component {
  /** Generator data */
  private generator: GeneratorData | null = null;
  /** Element for displaying production */
  private productionElement: HTMLElement | null = null;
  /** Element for displaying count */
  private countElement: HTMLElement | null = null;

  /**
   * Create a generator item component
   */
  constructor(options: ComponentOptions = {}) {

    super(options);
  }

  /**
   * Set up the component
   */
  protected setup(): void {
    
    // Initial render (likely without generator data)
    this.setContent(this.render());
    
    // Find child elements
    if (this.element) {
      this.productionElement = this.element.querySelector('.production-value');
      this.countElement = this.element.querySelector('.generator-count');
      
      // Add tooltip event listeners - using click instead of hover
      this.element.addEventListener('click', (e: Event) => {
        this.handleClick(e as MouseEvent);
      });
    }
  }

  /**
   * Handle click on generator item
   */
  private handleClick(e: MouseEvent): void {
    if (!this.generator || !this.element) return;
    
    // Show tooltip with generator details
    showTooltip(this.generateTooltipContent(), e);
    
    // Setup document-level listeners that will be cleaned up when tooltip is closed
    const handleMouseMove = (e: Event) => updateTooltipPosition(e as MouseEvent);
    const handleMouseUp = () => {
      // Remove all document event listeners when tooltip is closed
      hideTooltip();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  /**
   * Generate tooltip content
   */
  private generateTooltipContent(): string {
    if (!this.generator) return '';
    
    // Get state from state manager
    const state = getStateManager().getState();
    
    // Build production breakdown
    const boosts = this.generator.boosts
      .filter(boost => boost.active)
      .map(boost => {
        const isPositive = boost.multiplier > 1;
        return `
          <div class="tooltip-boost-item ${isPositive ? 'positive' : 'negative'}">
            <span class="tooltip-label">${boost.source}:</span>
            <span class="tooltip-value">x${boost.multiplier.toFixed(2)}</span>
          </div>
        `;
      })
      .join('');
    
    // Category color
    const categoryColors: Record<GeneratorCategory, string> = {
      [GeneratorCategory.Basic]: '#4CAF50',
      [GeneratorCategory.Premium]: '#3f51b5',
      [GeneratorCategory.Special]: '#FF9800'
    };
    
    const titleColor = categoryColors[this.generator.category] || '#4CAF50';
    
    return `
      <div class="tooltip-header" style="color: ${titleColor};">
        <strong>${this.generator.name}</strong> <span class="tooltip-count">x${this.generator.count}</span>
      </div>
      
      <div class="tooltip-description">
        ${this.generator.detailedDescription || this.generator.description}
      </div>
      
      <div class="tooltip-section">
        <div class="tooltip-section-title">Production</div>
        <div class="tooltip-production">
          <div class="tooltip-production-item">
            <span class="tooltip-label">Base production:</span>
            <span class="tooltip-value">${formatNumber(this.generator.baseProduction)}/sec per unit</span>
          </div>
          <div class="tooltip-production-item">
            <span class="tooltip-label">Current production:</span>
            <span class="tooltip-value">${formatNumber(this.generator.currentProduction)}/sec per unit</span>
          </div>
          <div class="tooltip-production-item total">
            <span class="tooltip-label">Total production:</span>
            <span class="tooltip-value">${formatNumber(this.generator.totalProduction)}/sec</span>
          </div>
        </div>
        
        ${boosts ? `
        <div class="tooltip-boosts">
          <div class="tooltip-section-subtitle">Boosts</div>
          ${boosts}
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Get HTML for generator icon
   */
  private getGeneratorIconHtml(generator: GeneratorData): string {
    // Define default category icons
    const defaultIcons: Record<string, string> = {
      'basic': '🐸',
      'premium': '✨',
      'special': '🔮'
    };
    
    if (generator.iconPath) {
      // Fix relative paths
      let iconPath = generator.iconPath;
      if (iconPath.startsWith('./')) {
        iconPath = iconPath.substring(2);
      }
      
      
      return `
        <div class="generator-icon-wrapper">
          <img src="${iconPath}" alt="${generator.name}" class="generator-icon-img" 
               onerror="console.error('Failed to load icon:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="generator-icon-fallback" style="display:none;">${defaultIcons[generator.category] || '🐸'}</div>
        </div>
      `;
    }
    
    // Default icons if no image provided
    const defaultIcon = defaultIcons[generator.category] || '🐸';
    
    return `
      <div class="generator-icon-wrapper">
        <div class="generator-icon-fallback" style="display:flex;">${defaultIcon}</div>
      </div>
    `;
  }

  /**
   * Render the generator item
   */
  public render(): string {
    if (!this.generator) {
      return `
        <div class="generator-icon"></div>
        <div class="generator-info">
          <div class="name-count-container">
            <div class="generator-name">Unknown</div>
            <div class="generator-count">x0</div>
          </div>
          <div class="generator-production">
            <span class="production-value">0</span>/sec
          </div>
        </div>
      `;
    }
    
    return `
      <div class="generator-icon">
        ${this.getGeneratorIconHtml(this.generator)}
      </div>
      <div class="generator-info">
        <div class="name-count-container">
          <div class="generator-name">${this.generator.name}</div>
          <div class="generator-count">x${this.generator.count}</div>
        </div>
        <div class="generator-production">
          <span class="production-value">${formatNumber(this.generator.totalProduction)}</span>/sec
        </div>
      </div>
    `;
  }

  /**
   * Update the generator item
   */
  public update(generator: GeneratorData): void {

    // Store the generator data
    this.generator = generator;
    
    // Re-render the entire component with updated data
    if (this.element) {

      this.setContent(this.render());
      
      // Re-find elements after re-render
      this.productionElement = this.element.querySelector('.production-value');
      this.countElement = this.element.querySelector('.generator-count');
    }
    
    // Update category class
    if (this.element) {
      // Remove existing category classes
      Object.values(GeneratorCategory).forEach(category => {
        this.element?.classList.remove(`category-${category}`);
      });
      
      // Add current category class
      this.element.classList.add(`category-${generator.category}`);
    }
  }
}