import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { getGameCore } from '../game/gameCore';
import { Component } from '../ui/core/Component';
import { ComponentOptions } from '../ui/core/types';
import { UI_MODAL_OPENED, UI_MODAL_CLOSED, ACHIEVEMENT_UNLOCKED } from '../core/eventTypes';
import { ResourceDisplay } from '../ui/components/resourceDisplay';
import { ClickArea } from '../ui/components/clickArea';
import { GeneratorList } from '../ui/components/generatorList';
import { Shop } from '../ui/components/shop';
import { UpgradeList } from '../ui/components/upgradeList';
import { ProductionStats } from '../ui/components/productionStats';
import { saveGame } from '../game/gameSave';
import { getSaveManager } from '../utils/saveManager';
import { Achievement,AchievementCategory, getCategoryIcon, RewardType } from '../models/achievements';
import { formatTimeAgo } from '../utils/timeUtils';
import { formatNumber } from '../utils/numberUtils';
import { formatDuration } from '../utils/numberUtils';

/**
 * Interface for modal configuration
 */
export interface ModalOptions {
  id: string;
  title: string;
  content: string;
  buttons?: {
    text: string;
    callback: () => void;
    className?: string;
  }[];
  closeOnBackdrop?: boolean;
}

/**
 * Interface for notification configuration
 */
interface NotificationOptions {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

/**
 * Interface for achievement notification
 */
interface AchievementNotificationOptions {
  achievement: Achievement;
  animate?: boolean;
  duration?: number;
}

/**
 * Singleton UIManager class to handle overall UI structure and coordination
 */
export class UIManager {
  private static instance: UIManager;
  
  /** Root UI element */
  private rootElement: HTMLElement | null = null;
  
  /** Container for modals */
  private modalContainer: HTMLElement | null = null;
  
  /** Container for notifications */
  private notificationContainer: HTMLElement | null = null;
  
  /** Container for achievement notifications */
  private achievementNotificationContainer: HTMLElement | null = null;
  
  /** Map of initialized components */
  private components: Map<string, Component> = new Map();
  
  /** Active modal element */
  private activeModal: HTMLElement | null = null;
  
  /** Animation frame ID for updates */
  private animationFrameId: number | null = null;
  
  /** Flag for game visibility */
  private isGameVisible: boolean = true;
  
  /** Resize observer */
  private resizeObserver: ResizeObserver | null = null;

  /** Whether to show locked achievements */
  private showLockedAchievements: boolean = true;

  /** Whether to show secret achievements */
  private showSecretAchievements: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }
  
/**
 * Initialize the UI manager
 * @param rootElementId ID of the root element to attach UI to
 */
public init(rootElementId: string = 'game-container'): void {
  // Find root element
  this.rootElement = document.getElementById(rootElementId);
  
  if (!this.rootElement) {
    console.error(`UIManager: Root element #${rootElementId} not found`);
    return;
  }
  
  // Create base structure
  this.createBaseStructure();
  
  // Initialize components
  this.initializeComponents();
  
  // Initialize menu buttons
  this.initializeMenu();
  
  // Set up event listeners
  this.setupEventListeners();
  
  // Set up visibility change tracking
  this.setupVisibilityTracking();
  
  // Set up resize handling
  this.setupResizeHandling();
  
  // Create achievement notification container
  this.createAchievementNotificationContainer();
  
  // Start update loop
  this.startUpdateLoop();
  
  console.log('UIManager: Initialized');
}

 // Update the createBaseStructure method in UIManager.ts
// Add the game menu to the center column

/**
 * Create base UI structure
 */
private createBaseStructure(): void {
  if (!this.rootElement) return;
  
  // Clear any existing content
  this.rootElement.innerHTML = '';
  
  // Create the structure with proper nesting and classes
  this.rootElement.innerHTML = `
    <!-- Game header with title -->
    <header class="game-header">
      <h1 class="game-title"></h1>
    </header>

    <!-- Main content container -->
    <main class="game-content">
      <!-- Three-column layout wrapper -->
      <div class="three-column-layout">
        <!-- Left column: Click area and production statistics -->
        <div class="column left-column">
          <div id="resource-display" class="resource-display"></div>
          <div id="frog-display" class="frog-display"></div>
          <div id="production-stats" class="production-stats panel">
            <div class="panel-header">
              <h2>Production Statistics</h2>
            </div>
            <div class="panel-content">
              <!-- Production stats will be inserted here -->
            </div>
          </div>
        </div>

        <!-- Center column: Menu buttons and owned generators ("Your Frogs") -->
        <div class="column center-column">
          <div id="game-menu" class="game-menu">
            <button id="stats-button" class="menu-button">Stats</button>
            <button id="achievements-button" class="menu-button">Achievements</button>
            <button id="save-button" class="menu-button">Save</button>
            <button id="reset-button" class="menu-button">Reset</button>
          </div>
          
          <div id="owned-generators" class="owned-generators-container panel">
            <div class="panel-header">
              <h2>Your Frogs</h2>
            </div>
            <div class="panel-content generators-container">
              <!-- Generator items will be inserted here -->
              <div class="empty-generators">No frogs yet! Buy some from the shop.</div>
            </div>
          </div>
        </div>

        <!-- Right column: Upgrades and shop -->
        <div class="column right-column">
          <div id="upgrades-panel" class="upgrades-panel panel">
            <div class="panel-header">
              <h2>Upgrades</h2>
            </div>
            <div class="panel-content">
              <div id="upgrades-container" class="upgrades-grid">
                <!-- Upgrade items will be inserted here -->
                <div class="empty-upgrades">No upgrades available yet.</div>
              </div>
            </div>
          </div>
          
          <div id="shop-panel" class="shop-panel panel">
            <div class="panel-header">
              <h2>Frog Shop</h2>
            </div>
            <div class="panel-content">
              <div id="purchase-controls" class="purchase-controls">
                <div class="purchase-amount-buttons">
                  <!-- Purchase amount buttons will be inserted here -->
                </div>
              </div>
              <div id="buildings-container" class="buildings-container">
                <!-- Shop items will be inserted here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;
  
  // Create and append the modal container to the root element
  // This should be outside the main layout to ensure proper stacking
  this.modalContainer = document.createElement('div');
  this.modalContainer.className = 'modal-container';
  this.rootElement.appendChild(this.modalContainer);
  
  // Create and append the notification container 
  this.notificationContainer = document.createElement('div');
  this.notificationContainer.className = 'notification-container';
  this.rootElement.appendChild(this.notificationContainer);
}

/**
 * Create achievement notification container
 */
private createAchievementNotificationContainer(): void {
  // We don't need a container for the new centered notification style
  // Each notification will be appended directly to the body
  // This is just a compatibility method that does nothing now
  this.achievementNotificationContainer = document.createElement('div');
  this.achievementNotificationContainer.style.display = 'none';
  document.body.appendChild(this.achievementNotificationContainer);
}
  
  /**
   * Initialize UI components
   */
  private initializeComponents(): void {
    if (!this.rootElement) return;
    
    // Initialize components - directly instantiate instead of using factory functions
    const resourceDisplay = new ResourceDisplay();
    const clickArea = new ClickArea();
    const generatorList = new GeneratorList();
    const shop = new Shop();
    const upgradeList = new UpgradeList();
    const productionStats = new ProductionStats(); // New component
    
    // Initialize all components
    resourceDisplay.init();
    clickArea.init();
    generatorList.init();
    shop.init();
    upgradeList.init();
    productionStats.init();

    const gameCore = getGameCore();
    gameCore.checkUnlocks();
    // Store components
    this.components.set('resourceDisplay', resourceDisplay);
    this.components.set('clickArea', clickArea);
    this.components.set('generatorList', generatorList);
    this.components.set('shop', shop);
    this.components.set('upgradeList', upgradeList);
    this.components.set('productionStats', productionStats);
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    const eventBus = getEventBus();
    
    // Handle upgrades available event
    eventBus.on('UPGRADES_AVAILABLE', (data: { count: number }) => {
      this.updateTabNotification('upgrades', data.count > 0);
    });
    
    // Handle achievement unlocked event
    eventBus.on(ACHIEVEMENT_UNLOCKED, (data: { achievement: Achievement, timestamp: number }) => {
      this.showAchievementNotification({
        achievement: data.achievement,
        animate: true,
        duration: 5000
      });
    });
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showNotification({
        message: 'An error occurred. Check console for details.',
        type: 'error',
        duration: 5000
      });
    });
  }
  
  /**
   * Set up visibility change tracking
   */
  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      this.isGameVisible = document.visibilityState === 'visible';
      
      // Notify game of visibility change
      const gameCore = getGameCore();
      if (this.isGameVisible) {
        gameCore.start(); // Use start() instead of onResume()
      } else {
        gameCore.stop(); // Use stop() instead of onPause()
      }
    });
  }
  
  /**
   * Set up resize handling
   */
  private setupResizeHandling(): void {
    if (!this.rootElement) return;
    
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.rootElement) {
          this.handleResize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    
    this.resizeObserver.observe(this.rootElement);
  }
  
  /**
   * Handle window resize event
   */
  private handleResize(width: number, height: number): void {
    // Apply responsive changes based on size
    if (width < 1024) {
      this.rootElement?.classList.add('mobile-layout');
      this.rootElement?.classList.remove('desktop-layout');
    } else {
      this.rootElement?.classList.add('desktop-layout');
      this.rootElement?.classList.remove('mobile-layout');
    }
  }
  
  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    const updateUI = () => {
      // Only update if visible
      if (this.isGameVisible) {
        // Update components if needed
        // (Most updates come through state changes, this is for animation-based updates)
      }
      
      this.animationFrameId = requestAnimationFrame(updateUI);
    };
    
    this.animationFrameId = requestAnimationFrame(updateUI);
  }
  
  /**
   * Update notification indicator
   * @param tabId ID of the tab
   * @param hasNotification Whether the tab has a notification
   */
  public updateTabNotification(tabId: string, hasNotification: boolean): void {
    // Update notification indicators in the new layout
    const panel = document.getElementById(`${tabId}-panel`);
    
    if (panel) {
      if (hasNotification) {
        panel.classList.add('has-notification');
      } else {
        panel.classList.remove('has-notification');
      }
    }
  }
  

/**
 * Initialize menu buttons and functionality
 */
public initializeMenu(): void {
  // Find buttons
  const statsButton = document.getElementById('stats-button');
  const achievementsButton = document.getElementById('achievements-button');
  const saveButton = document.getElementById('save-button');
  const resetButton = document.getElementById('reset-button');
  
  // Add event listeners
  if (statsButton) {
    statsButton.addEventListener('click', this.showStatsModal.bind(this));
  }
  
  if (achievementsButton) {
    achievementsButton.addEventListener('click', this.showAchievementsModal.bind(this));
  }
  
  if (saveButton) {
    saveButton.addEventListener('click', this.handleSave.bind(this));
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', this.handleReset.bind(this));
  }
}

/**
 * Show achievements modal with all game achievements
 */
private showAchievementsModal(): void {
  const achievementManager = getGameCore().getAchievementManager();
  
  // Get only unlocked achievements data
  const unlockedAchievements = achievementManager.getUnlockedAchievements();
  
  // Calculate progress stats
  const totalCount = achievementManager.getTotalAchievementCount();
  const unlockedCount = achievementManager.getUnlockedCount();
  const progressPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  
  // Build progress bar HTML
  const progressHtml = `
    <div class="achievement-progress-bar">
      <div class="achievement-progress-text">${unlockedCount} of ${totalCount} Achievements Unlocked (${progressPercentage}%)</div>
      <div class="achievement-progress-outer">
        <div class="achievement-progress-inner" style="width: ${progressPercentage}%"></div>
      </div>
    </div>
  `;
  
  // Build achievements list HTML - only show unlocked achievements
  let achievementsListHtml = '';
  
  // Add unlocked achievements
  unlockedAchievements.forEach(achievement => {
    achievementsListHtml += this.renderAchievementItem(achievement, true);
  });
  
  // Handle empty state
  if (achievementsListHtml === '') {
    achievementsListHtml = `
      <div class="empty-achievements">
        <p>No achievements unlocked yet.</p>
        <p>Keep playing to unlock achievements!</p>
      </div>
    `;
  }
  
  // Combine all sections into the modal content
  const modalContent = `
    <div class="achievements-container">
      ${progressHtml}
      <div class="achievements-list">
        ${achievementsListHtml}
      </div>
    </div>
  `;
  
  // Show the modal
  const modal = this.showModal({
    id: 'achievements-modal',
    title: 'Achievements',
    content: modalContent,
    closeOnBackdrop: true
  });
}

/**
 * Render a single achievement item
 */
/**
 * Render a single achievement item with reward information
 */
private renderAchievementItem(achievement: Achievement, unlocked: boolean): string {
  // Get category icon
  const categoryIcon = getCategoryIcon(achievement.category);
  
  // Create icon HTML
  let iconHtml = '';
  if (achievement.iconPath) {
    iconHtml = `<img src="${achievement.iconPath}" alt="${achievement.name}" class="achievement-icon-img">`;
  } else {
    iconHtml = `<div class="achievement-icon-emoji">${categoryIcon}</div>`;
  }
  
  // Prepare reward text if available
  let rewardHtml = '';
  if (achievement.reward) {
    const reward = achievement.reward;
    let rewardText = 'Reward: ';
    
    switch (reward.type) {
      case RewardType.ProductionBoost:
        rewardText += `${reward.value}x production boost`;
        break;
      case RewardType.ClickBoost:
        rewardText += `${reward.value}x click boost`;
        break;
      case RewardType.GeneratorBoost:
        rewardText += `${reward.value}x boost to ${reward.target} generator`;
        break;
      case RewardType.BufoBonus:
        rewardText += `${reward.value} Bufos`;
        break;
      case RewardType.UnlockGenerator:
        rewardText += `Unlocked ${reward.target} generator`;
        break;
      case RewardType.UnlockUpgrade:
        rewardText += `Unlocked new upgrade`;
        break;
      case RewardType.UnlockFeature:
        rewardText += `Unlocked new feature`;
        break;
      default:
        rewardText += 'Special bonus';
    }
    
    rewardHtml = `<div class="achievement-reward">${rewardText}</div>`;
  }
  
  // Build HTML for the achievement item
  return `
    <div class="achievement-item category-${achievement.category}" data-id="${achievement.id}">
      <div class="achievement-icon">
        ${iconHtml}
      </div>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description}</div>
        ${rewardHtml}
      </div>
    </div>
  `;
}

/**
 * Show achievement notification
 */
public showAchievementNotification(options: AchievementNotificationOptions): HTMLElement | null {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  
  // Get the icon HTML
  let iconHtml = '';
  if (options.achievement.iconPath) {
    iconHtml = `<img src="${options.achievement.iconPath}" alt="${options.achievement.name}" class="achievement-icon-img">`;
  } else {
    const categoryIcon = getCategoryIcon(options.achievement.category);
    iconHtml = `<div class="achievement-icon-emoji">${categoryIcon}</div>`;
  }
  
  // Prepare reward text if available
  let rewardHtml = '';
  if (options.achievement.reward) {
    const reward = options.achievement.reward;
    let rewardText = '';
    
    switch (reward.type) {
      case RewardType.ProductionBoost:
        rewardText = `${reward.value}x production boost`;
        break;
      case RewardType.ClickBoost:
        rewardText = `${reward.value}x click boost`;
        break;
      case RewardType.GeneratorBoost:
        rewardText = `${reward.value}x boost to ${reward.target} generator`;
        break;
      case RewardType.BufoBonus:
        rewardText = `+${reward.value} Bufos`;
        break;
      case RewardType.UnlockGenerator:
        rewardText = `Unlocked ${reward.target} generator`;
        break;
      case RewardType.UnlockUpgrade:
        rewardText = `Unlocked new upgrade`;
        break;
      case RewardType.UnlockFeature:
        rewardText = `Unlocked new feature`;
        break;
      default:
        rewardText = 'Special bonus';
    }
    
    rewardHtml = `<div class="achievement-notification-reward">Reward: ${rewardText}</div>`;
  }
  
  // Build notification content
  notification.innerHTML = `
    <div class="achievement-notification-icon">
      ${iconHtml}
    </div>
    <div class="achievement-notification-content">
      <div class="achievement-notification-title">Achievement Unlocked!</div>
      <div class="achievement-notification-name">${options.achievement.name}</div>
      <div class="achievement-notification-description">${options.achievement.description}</div>
      ${rewardHtml}
    </div>
  `;
  
  // Add to document body (centered)
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('visible');
  }, 10);
  
  // Auto close after duration
  setTimeout(() => {
    notification.classList.remove('visible');
    
    // Remove after animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, options.duration || 1000);
  
  return notification;
}
/**
 * Filter achievements by category in the modal
 */
private filterAchievementsByCategory(modal: HTMLElement, category: string): void {
  const items = modal.querySelectorAll('.achievement-item');
  
  items.forEach(item => {
    if (category === 'all' || item.getAttribute('data-category') === category) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

/**
 * Refresh the achievements modal with current data
 */
private refreshAchievementsModal(): void {
  if (this.activeModal && this.activeModal.id === 'achievements-modal') {
    this.closeModal();
    this.showAchievementsModal();
  }
}

/**
 * Show stats modal with comprehensive game statistics
 */
private showStatsModal(): void {
  // Get the current game state
  const state = getStateManager().getState();
  
  // Get managers for additional data
  const gameCore = getGameCore();
  const generatorManager = gameCore.getGeneratorManager();
  const upgradeManager = gameCore.getUpgradeManager();
  const achievementManager = gameCore.getAchievementManager();

  // Calculate derived stats
  const totalBufosProduced = state.resources.totalBufos;
  const currentBufos = state.resources.bufos;
  const totalBufosSpent = totalBufosProduced - currentBufos;
  
  // Get total clicks directly from game core
  const totalClicks = gameCore.clickCount;
  
  // Calculate play time from firstStartTime
  const now = Date.now();
  const startTime = state.gameSettings.firstStartTime || state.gameSettings.lastTick || now;
  const playTimeMs = now - startTime;
  const playTimeStr = formatDuration(Math.floor(playTimeMs / 1000));
  
  // Calculate achievement progress
  const totalAchievements = achievementManager.getTotalAchievementCount();
  const unlockedAchievements = achievementManager.getUnlockedCount();
  const achievementPercentage = totalAchievements > 0 
    ? Math.round((unlockedAchievements / totalAchievements) * 100) 
    : 0;
  
  // Get generator stats
  const allGenerators = generatorManager.getAllGenerators();
  const unlockedGenerators = generatorManager.getUnlockedGenerators();
  const totalGeneratorsOwned = Object.values(state.generators)
    .reduce((total, gen) => total + gen.count, 0);
  
  // Get upgrade stats
  const purchasedUpgrades = upgradeManager.getPurchasedUpgrades().length;
  
  // Get production stats
  const productionStats = generatorManager.getProductionStats();
  
  // Create the content for the modal
  const statsContent = `
    <div class="stats-container">
      <h3 class="stats-section-title">Resources</h3>
      
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">Total Bufos Produced</div>
          <div class="stat-value">${formatNumber(totalBufosProduced)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Current Bufos</div>
          <div class="stat-value">${formatNumber(currentBufos)}</div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">Total Bufos Spent</div>
          <div class="stat-value">${formatNumber(totalBufosSpent)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Current Production</div>
          <div class="stat-value">${formatNumber(productionStats.totalPerSecond)}/sec</div>
        </div>
      </div>
      
      <h3 class="stats-section-title">Game Progress</h3>
      
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">Time Played</div>
          <div class="stat-value">${playTimeStr}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Clicks</div>
          <div class="stat-value">${totalClicks.toLocaleString()}</div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">Achievements</div>
          <div class="stat-value">${unlockedAchievements}/${totalAchievements} (${achievementPercentage}%)</div>
          <div class="achievement-progress-indicator">
            <div class="achievement-progress-bar" style="width: ${achievementPercentage}%"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Upgrades Purchased</div>
          <div class="stat-value">${purchasedUpgrades}</div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">Generators Unlocked</div>
          <div class="stat-value">${unlockedGenerators.length}/${allGenerators.length}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Generators Owned</div>
          <div class="stat-value">${totalGeneratorsOwned}</div>
        </div>
      </div>

      <h3 class="stats-section-title">Production Details</h3>
      
      <div class="stats-row production-details">
        <div class="stat-item">
          <div class="stat-label">Per Second</div>
          <div class="stat-value">${formatNumber(productionStats.totalPerSecond)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Per Minute</div>
          <div class="stat-value">${formatNumber(productionStats.totalPerMinute)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Per Hour</div>
          <div class="stat-value">${formatNumber(productionStats.totalPerHour)}</div>
        </div>
      </div>
    </div>
    
    <div class="contributions-container">
      <h3 class="stats-section-title">Production Sources</h3>
      <div class="contributions-list">
        ${this.renderProductionSources(productionStats.generatorContributions)}
      </div>
    </div>
  `;
  
  // Show the modal with the stats content
  this.showModal({
    id: 'stats-modal',
    title: 'Game Statistics',
    content: `<div class="stats-modal-content">${statsContent}</div>`,
    closeOnBackdrop: true
  });
}

/**
 * Render production sources for the stats modal
 */
private renderProductionSources(contributions: Array<{
  id: string;
  name: string;
  production: number;
  percentage: number;
  count: number;
}>): string {
  if (contributions.length === 0) {
    return '<div class="empty-contributions">No production sources yet.</div>';
  }
  
  return contributions
    .sort((a, b) => b.production - a.production)
    .map(contrib => `
      <div class="contribution-item">
        <div class="contribution-name">${contrib.name} (x${contrib.count})</div>
        <div class="contribution-value">
          ${formatNumber(contrib.production)}/sec
          <span class="contribution-percentage">(${contrib.percentage.toFixed(1)}%)</span>
        </div>
      </div>
    `)
    .join('');
}

/**
 * Handle save button click
 */
private handleSave(): void {
  // Get the game core
  const gameCore = getGameCore();
  
  // Save the game
  const success = saveGame();
  
  // Get the state to show when it was last saved
  const state = getStateManager().getState();
  const lastSavedTime = state.gameSettings.lastSaved;
  
  if (success) {
    this.showSaveNotification(
      `Game saved successfully at ${new Date(lastSavedTime).toLocaleTimeString()}!`
    );
  } else {
    this.showNotification({
      message: 'Failed to save the game',
      type: 'error',
      duration: 3000
    });
  }
}

/**
 * Handle reset button click
 */
private handleReset(): void {
  // Show a confirmation modal
  this.showModal({
    id: 'reset-confirmation-modal',
    title: 'Reset Game',
    content: `
      <p>Are you sure you want to reset your game?</p>
      <p>All progress will be lost!</p>
    `,
    buttons: [
      {
        text: 'Cancel',
        callback: () => this.closeModal(),
        className: 'modal-button cancel-button'
      },
      {
        text: 'Reset Game',
        callback: () => {
          // Close modal
          this.closeModal();
          
          // Clear save
          const saveManager = getSaveManager();
          saveManager.clearSave();
          
          // Reset state
          getGameCore().resetState();
          
          // Show notification
          this.showNotification({
            message: 'Game reset successfully. Refreshing page...',
            type: 'info',
            duration: 0
          });
          
          // Refresh page after a delay
          setTimeout(() => {
            window.location.reload();
          }, 0);
        },
        className: 'modal-button confirm-button'
      }
    ],
    closeOnBackdrop: true
  });
}

/**
 * Show a temporary save notification
 */
private showSaveNotification(message: string): void {
  // Check if a notification already exists
  let notification = document.querySelector('.save-notification');
  
  if (!notification) {
    // Create new notification
    notification = document.createElement('div');
    notification.className = 'save-notification';
    document.body.appendChild(notification);
  }
  
  // Set message
  notification.textContent = message;
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('visible');
    
    // Hide after 2 seconds
    setTimeout(() => {
      notification.classList.remove('visible');
      
      // Remove after animation
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }, 10);
}

/**
 * Improve the UI feedback about auto-save status
 */
public updateAutoSaveStatus(enabled: boolean): void {
  // Find the auto-save toggle element if it exists
  const autoSaveToggle = document.getElementById('auto-save-toggle');
  
  if (autoSaveToggle) {
    // Update the toggle element
    if (autoSaveToggle instanceof HTMLInputElement) {
      autoSaveToggle.checked = enabled;
    }
    
    // Show a notification about auto-save status
    this.showNotification({
      message: enabled 
        ? 'Auto-save enabled - game will be saved every 5 minutes' 
        : 'Auto-save disabled - remember to save manually!',
      type: enabled ? 'info' : 'warning',
      duration: 3000
    });
  }
}
/**
 * Show a modal dialog
 * @param options Modal configuration options
 * @returns The created modal element
 */
public showModal(options: ModalOptions): HTMLElement {
  if (!this.modalContainer) return document.createElement('div');
  
  // Close any existing modal
  this.closeModal();
  
  // Create modal element
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = options.id;
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  // Add header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2>${options.title}</h2>
    <button class="modal-close">&times;</button>
  `;
  modalContent.appendChild(header);
  
  // Add body
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = options.content;
  modalContent.appendChild(body);
  
  // Add footer with buttons
  if (options.buttons && options.buttons.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    options.buttons.forEach(buttonConfig => {
      const button = document.createElement('button');
      button.textContent = buttonConfig.text;
      button.className = buttonConfig.className || 'modal-button';
      button.addEventListener('click', () => {
        buttonConfig.callback();
        this.closeModal();
      });
      footer.appendChild(button);
    });
    
    modalContent.appendChild(footer);
  }
  
  modal.appendChild(modalContent);
  this.modalContainer.appendChild(modal);
  
  // Add close button event listener
  const closeButton = modal.querySelector('.modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => this.closeModal());
  }
  
  // Add backdrop click event listener
  if (options.closeOnBackdrop !== false) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }
  
  // Show modal with animation
  // Force a reflow to ensure animation works
  void modal.offsetWidth;
  
  // Add visible class after a short delay to ensure CSS transition works
  setTimeout(() => {
    modal.classList.add('visible');
  }, 10);
  
  // Store reference
  this.activeModal = modal;
  
  // Emit modal opened event
  getEventBus().emit(UI_MODAL_OPENED, { modalId: options.id });
  
  return modal;
}

/**
 * Close the active modal
 */
public closeModal(): void {
  if (!this.activeModal) return;
  
  // Hide with animation
  this.activeModal.classList.remove('visible');
  
  const modalId = this.activeModal.id;
  const modalToRemove = this.activeModal;
  this.activeModal = null;
  
  // Remove after animation
  setTimeout(() => {
    if (modalToRemove && modalToRemove.parentNode) {
      modalToRemove.parentNode.removeChild(modalToRemove);
      
      // Emit modal closed event
      getEventBus().emit(UI_MODAL_CLOSED, { modalId });
    }
  }, 300);
}

/**
 * Show a notification
 * @param options Notification configuration
 */
public showNotification(options: NotificationOptions): HTMLElement {
  if (!this.notificationContainer) return document.createElement('div');
  
  const { message, type = 'info', duration = 3000 } = options;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add to container
  this.notificationContainer.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('visible');
  }, 10);
  
  // Add close button listener
  const closeButton = notification.querySelector('.notification-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      this.closeNotification(notification);
    });
  }
  
  // Auto close after duration
  setTimeout(() => {
    this.closeNotification(notification);
  }, duration);
  
  return notification;
}

/**
 * Close a notification
 * @param notification The notification element to close
 */
private closeNotification(notification: HTMLElement): void {
  // Hide with animation
  notification.classList.remove('visible');
  
  // Remove after animation
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

/**
 * Clean up resources
 */
public destroy(): void {
  // Stop update loop
  if (this.animationFrameId !== null) {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
  
  // Disconnect resize observer
  if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
  }
  
  // Destroy all components
  this.components.forEach(component => {
    component.destroy();
  });
  
  // Clear references
  this.components.clear();
  this.activeModal = null;
  
  // Remove achievement notification container
  if (this.achievementNotificationContainer && this.achievementNotificationContainer.parentNode) {
    this.achievementNotificationContainer.parentNode.removeChild(this.achievementNotificationContainer);
  }
  
  console.log('UIManager: Destroyed');
}

/**
 * Get a component by id
 * @param id Component id
 * @returns The component or null if not found
 */
public getComponent<T extends Component>(id: string): T | null {
  const component = this.components.get(id);
  return component as T || null;
}
}

/**
 * Helper function to get UIManager instance
 */
export function getUIManager(): UIManager {
  return UIManager.getInstance();
}