import { Component } from '../core/Component';
import { ComponentOptions } from '../core/types';
import { getGameCore } from '../../game/gameCore';
import { pulse } from '../../utils/animationUtils';

export interface ClickAreaOptions extends ComponentOptions {
  /** Path to bufo image */
  imagePath?: string;
  /** Max clicks to track for combo */
  maxComboClicks?: number;
  /** Click combo timeout in ms */
  comboTimeout?: number;
}

/**
 * Interface for click result
 */
interface ClickResult {
  bufosGained: number;
  isCombo: boolean;
  comboMultiplier: number;
}

/**
 * Click area component for the main bufo clicking interaction
 */
export class ClickArea extends Component {
  /** Path to bufo image */
  private imagePath: string;
  /** Max clicks to track */
  private maxComboClicks: number;
  /** Bufo image element */
  private bufoImage: HTMLImageElement | null = null;
  /** Click combo timeout */
  private comboTimeout: number;
  /** Recent clicks timestamps */
  private recentClicks: number[] = [];
  /** Timer for clearing clicks */
  private clearClicksTimer: number | null = null;
  /** Click cooldown flag */
  private clickCooldown: boolean = false;

  /**
   * Create a click area component
   */
  constructor(options: ClickAreaOptions = {}) {
    super({
      id: options.id || 'frog-display',
      className: options.className || 'frog-display',
      ...options
    });

    this.imagePath = options.imagePath || './assets/images/bufo.png';
    this.maxComboClicks = options.maxComboClicks || 5;
    this.comboTimeout = options.comboTimeout || 1000;
  }

  /**
   * Set up the component
   */
  protected setup(): void {
    // Create initial structure
    this.setContent(this.render());

    // Find bufo image
    if (this.element) {
      this.bufoImage = this.element.querySelector('.bufo-image');
    }

    // Add click event listeners
    if (this.element) {
      this.element.addEventListener('click', this.handleClick.bind(this));
    }

    // Set up click cleaner
    this.clearClicksTimer = window.setInterval(() => {
      this.clearOldClicks();
    }, 1000);
  }

  /**
   * Handle click on the bufo
   */
  private handleClick(e: MouseEvent): void {
    e.preventDefault();

    // Prevent click spam with cooldown
    if (this.clickCooldown) return;
    this.clickCooldown = true;
    setTimeout(() => {
      this.clickCooldown = false;
    }, 50);

    // Track click for combo
    this.recentClicks.push(Date.now());
    if (this.recentClicks.length > this.maxComboClicks) {
      this.recentClicks.shift();
    }

    // Get click position for effects
    const rect = this.element?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Trigger game click and get result
    const clickResult = getGameCore().click();

    // Create visual effects
    this.createClickEffects(x, y, clickResult);
  }

  /**
   * Create visual effects for click
   */
  private createClickEffects(x: number, y: number, clickResult: ClickResult): void {
    // Animate bufo image
    if (this.bufoImage) {
      pulse(this.bufoImage, 0.95, 100);
    }

    // Create click indicator
    this.createClickIndicator(x, y);

    // Create floating number with wider scatter
    this.createFloatingNumber(x, y, clickResult);
  }

  /**
   * Create floating number with improved styling and moderate scatter
   */
  private createFloatingNumber(x: number, y: number, clickResult: ClickResult): void {
    const element = document.createElement('div');
    element.classList.add('floating-number');
    
    // Add combo styling
    if (clickResult.isCombo) {
      element.classList.add('combo');
    }
    
    // Set content - just the value, no multiplier
    const valueSpan = document.createElement('span');
    valueSpan.classList.add('value');
    valueSpan.textContent = `+${clickResult.bufosGained.toFixed(1)}`;
    element.appendChild(valueSpan);
    
    // Apply CSS directly for immediate effect
    element.style.cssText = `
      position: absolute;
      font-weight: bold;
      font-size: ${clickResult.isCombo ? '1.4em' : '1.2em'};
      color: ${clickResult.isCombo ? '#FFD700' : '#FFFFFF'};
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      pointer-events: none;
      z-index: 1000;
    `;
    
    if (clickResult.isCombo) {
      element.style.cssText += `
        background-color: rgba(76, 175, 80, 0.2);
        padding: 4px 8px;
        border-radius: 10px;
      `;
    }
    
    // Position with moderate random offset for scatter effect
    const offsetX = Math.random() * 30 - 15; // Reduced scatter: +/- 15px
    const offsetY = Math.random() * 20 - 10; // Reduced scatter: +/- 10px
    element.style.left = `${x + offsetX}px`;
    element.style.top = `${y + offsetY}px`;
    
    // Add to container
    if (this.element) {
      this.element.appendChild(element);
    }
    
    // Animate with improved trajectory
    let progress = 0;
    const duration = 1500; // Fixed duration
    const startY = y + offsetY;
    const startX = x + offsetX;
    
    // Moderate range of movement
    const targetY = startY - (50 + Math.random() * 20); // Upward motion
    const targetX = startX + (Math.random() * 40 - 20); // Slight horizontal drift
    
    const animationFrame = () => {
      progress += 16 / duration; // ~60fps
      
      if (progress >= 1) {
        // Remove when done
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        return;
      }
      
      // Non-linear movement for more natural floating
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentY = startY + (targetY - startY) * easeOutCubic;
      
      // Gentle arc to horizontal movement
      const horizontalProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const currentX = startX + (targetX - startX) * horizontalProgress;
      
      // Opacity with fade-out
      const opacity = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
      
      // Scale - start small, grow, then shrink
      let scale = 1;
      if (progress < 0.2) {
        scale = 0.7 + (progress / 0.2) * 0.5;
      } else {
        scale = 1.2 - ((progress - 0.2) / 0.8) * 0.4;
      }
      
      // Apply styles
      element.style.transform = `translate(${currentX - startX}px, ${currentY - startY}px) scale(${scale})`;
      element.style.opacity = opacity.toString();
      
      requestAnimationFrame(animationFrame);
    };
    
    requestAnimationFrame(animationFrame);
  }

  /**
   * Create click indicator
   */
  private createClickIndicator(x: number, y: number): void {
    // Create indicator container if it doesn't exist
    let container = this.element?.querySelector('.click-indicator-container');
    if (!container && this.element) {
      container = document.createElement('div');
      container.classList.add('click-indicator-container');
      this.element.appendChild(container);
    }
    
    if (!container) return;
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.classList.add('click-indicator');
    
    // Position at click point
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    
    // Add to container
    container.appendChild(indicator);
    
    // Remove after animation completes
    setTimeout(() => {
      if (indicator.parentNode === container) {
        container.removeChild(indicator);
      }
    }, 1000);
  }

  /**
   * Clear clicks older than combo timeout
   */
  private clearOldClicks(): void {
    const now = Date.now();
    this.recentClicks = this.recentClicks.filter(time => {
      return (now - time) < this.comboTimeout;
    });
  }

  /**
   * Render the click area
   */
  public render(): string {
    return `
      <img src="${this.imagePath}" alt="Bufo" class="bufo-image">
      <div class="click-indicator-container"></div>
    `;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clear timer
    if (this.clearClicksTimer !== null) {
      clearInterval(this.clearClicksTimer);
      this.clearClicksTimer = null;
    }
    
    super.destroy();
  }
}