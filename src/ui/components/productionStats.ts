import { Component } from '../core/Component';
import { ComponentOptions } from '../core/types';
import { formatNumber, getNumberFullName } from '../../utils/numberUtils';
import { getGameCore } from '../../game/gameCore';
import { getStateManager } from '../../core/stateManager';
import { getProductionStatistics } from '../../game/gameState';
/**
 * Component for displaying production statistics
 */
export class ProductionStats extends Component {
  private statsContainer: HTMLElement | null = null;
  private contributionsContainer: HTMLElement | null = null;

  /**
   * Create a production stats component
   */
  constructor(options: ComponentOptions = {}) {
    super({
      id: options.id || 'production-stats',
      className: options.className || 'production-stats panel',
      ...options
    });
  }

  /**
   * Set up the component
   */
  protected setup(): void {
    // Initial render
    this.setContent(this.render());
    
    // Find containers
    if (this.element) {
      this.statsContainer = this.element.querySelector('.stats-container');
      this.contributionsContainer = this.element.querySelector('.contributions');
    }

    // Connect to state to update stats when production changes
    this.connectToState(
      (state) => getProductionStatistics(state),
      this.updateStats.bind(this)
    );

    // Subscribe to production updates
    this.subscribeToEvent('GENERATOR_PRODUCTION_UPDATED', () => {
      this.refreshStats();
    });

    this.subscribeToEvent('GENERATOR_PURCHASED', () => {
      this.refreshStats();
    });
  }

  /**
   * Render the production stats
   */
  public render(): string {
    return `
      <div class="panel-content">
        <div class="stats-container">

        </div>
        
        <div class="contributions">
          <h3>Production Sources</h3>
          <div class="contributions-list">
            <div class="empty-contributions">No production sources yet.</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update stats based on state change
   */
  private updateStats(stats: ReturnType<typeof getProductionStatistics>): void {
    if (!this.statsContainer || !this.contributionsContainer) return;

    // Update main stats
    const statsItems = this.statsContainer.querySelectorAll('.stat-item');
    if (statsItems.length >= 3) {
      const currentRateValue = statsItems[0].querySelector('.stat-value');
      const perMinuteValue = statsItems[1].querySelector('.stat-value');
      const perHourValue = statsItems[2].querySelector('.stat-value');

      if (currentRateValue) currentRateValue.textContent = `${formatNumber(stats.currentRate)}/sec`;
      if (perMinuteValue) perMinuteValue.textContent = formatNumber(stats.perMinute);
      if (perHourValue) perHourValue.textContent = formatNumber(stats.perHour);
    }

    // Update contributions
    const contributionsList = this.contributionsContainer.querySelector('.contributions-list');
    if (contributionsList) {
      if (stats.generatorContributions.length === 0) {
        contributionsList.innerHTML = '<div class="empty-contributions">No production sources yet.</div>';
      } else {
        contributionsList.innerHTML = stats.generatorContributions
          .sort((a, b) => b.production - a.production)
          .map(contrib => `
            <div class="contribution-item">
              <span class="contribution-name">${contrib.name} (x${contrib.count})</span>
              <span class="contribution-value">${formatNumber(contrib.production)}/sec (${contrib.percentage.toFixed(1)}%)</span>
            </div>
          `)
          .join('');
      }
    }
  }

  /**
   * Refresh stats from current game state
   */
  public refreshStats(): void {
    const state = getStateManager().getState();
    const stats = getProductionStatistics(state);
    this.updateStats(stats);
  }
}

// Export the component
export default ProductionStats;