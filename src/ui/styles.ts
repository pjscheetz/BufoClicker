/**
 * CSS class names used throughout the UI
 * Using constants prevents typos and makes refactoring easier
 */

/**
 * Layout classes
 */
export const LAYOUT = {
    container: 'game-container',
    header: 'game-header',
    content: 'game-content',
    footer: 'game-footer',
    tabContent: 'tab-content',
    panel: 'game-panel',
    section: 'game-section',
    wrapper: 'content-wrapper',
    flex: 'flex-container',
    grid: 'grid-container',
    hidden: 'hidden',
    visible: 'visible',
    mobile: 'mobile-layout',
    desktop: 'desktop-layout'
  };
  
  /**
   * Component classes
   */
  export const COMPONENT = {
    resourceDisplay: 'resource-display',
    clickArea: 'frog-display',
    generatorList: 'owned-generators-container',
    generator: 'owned-generator',
    shop: 'buildings-container',
    shopItem: 'building-item',
    upgradeList: 'upgrades-grid',
    upgradeItem: 'upgrade-icon-container',
    tab: 'tab-button',
    activeTab: 'active',
    button: 'game-button',
    input: 'game-input',
    icon: 'game-icon',
    image: 'game-image',
    tooltip: 'game-tooltip'
  };
  
  /**
   * State classes
   */
  export const STATE = {
    selected: 'selected',
    active: 'active',
    disabled: 'disabled',
    loading: 'loading',
    error: 'error',
    success: 'success',
    warning: 'warning',
    info: 'info',
    new: 'new',
    affordable: 'affordable',
    notAffordable: 'not-affordable',
    unlocked: 'unlocked',
    locked: 'locked',
    hasNotification: 'has-notification',
    highlighted: 'highlighted',
    pulse: 'pulse',
    shake: 'shake',
    fade: 'fade',
    bounce: 'bounce'
  };
  
  /**
   * Modal classes
   */
  export const MODAL = {
    container: 'modal-container',
    modal: 'modal',
    content: 'modal-content',
    header: 'modal-header',
    body: 'modal-body',
    footer: 'modal-footer',
    close: 'modal-close',
    button: 'modal-button',
    confirm: 'confirm-button',
    cancel: 'cancel-button',
    visible: 'visible'
  };
  
  /**
   * Notification classes
   */
  export const NOTIFICATION = {
    container: 'notification-container',
    notification: 'notification',
    content: 'notification-content',
    message: 'notification-message',
    close: 'notification-close',
    info: 'notification-info',
    success: 'notification-success',
    warning: 'notification-warning',
    error: 'notification-error',
    visible: 'visible'
  };
  
  /**
   * Tooltip classes
   */
  export const TOOLTIP = {
    container: 'tooltip-container',
    tooltip: 'game-tooltip',
    header: 'tooltip-header',
    title: 'tooltip-title',
    description: 'tooltip-description',
    section: 'tooltip-section',
    label: 'tooltip-label',
    value: 'tooltip-value',
    visible: 'visible'
  };
  
  /**
   * Animation classes
   */
  export const ANIMATION = {
    fade: 'fade',
    fadeIn: 'fade-in',
    fadeOut: 'fade-out',
    slide: 'slide',
    slideIn: 'slide-in',
    slideOut: 'slide-out',
    pulse: 'pulse',
    bounce: 'bounce',
    shake: 'shake',
    spin: 'spin',
    pop: 'pop'
  };
  
  /**
   * Category classes
   */
  export const CATEGORY = {
    basic: 'category-basic',
    premium: 'category-premium',
    special: 'category-special',
    click: 'category-click',
    generator: 'category-generator',
    global: 'category-global'
  };