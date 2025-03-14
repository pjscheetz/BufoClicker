/**
 * UI-related constants
 */

/**
 * Tab configuration
 */
export interface TabConfig {
    id: string;
    label: string;
    icon?: string;
  }
  
  /**
   * Available tabs in the game
   */
  export const TABS: TabConfig[] = [
    {
      id: 'main',
      label: 'Main',
      icon: '🐸'
    },
    {
      id: 'shop',
      label: 'Shop',
      icon: '🛒'
    },
    {
      id: 'upgrades',
      label: 'Upgrades',
      icon: '⬆️'
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: '📊'
    }
  ];
  
  /**
   * Default active tab
   */
  export const DEFAULT_TAB = 'main';
  
  /**
   * Z-index values for different UI layers
   */
  export const Z_INDEX = {
    base: 1,
    content: 10,
    notification: 100,
    modal: 1000
  };
  
  /**
   * Animation duration values (ms)
   */
  export const ANIMATION = {
    short: 150,
    medium: 300,
    long: 500
  };
  
  /**
   * Media query breakpoints
   */
  export const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024
  };
  
  /**
   * Default notification duration (ms)
   */
  export const DEFAULT_NOTIFICATION_DURATION = 3000;
  
  /**
   * Default theme
   */
  export const DEFAULT_THEME = 'light';
  
  /**
   * Available themes
   */
  export const THEMES = ['light', 'dark', 'forest'];
  
  /**
   * Tooltip display delay (ms)
   */
  export const TOOLTIP_DELAY = 300;