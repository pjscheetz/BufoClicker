/**
 * Centralized constants for all event names used in the game
 */

// Resource events
export const RESOURCE_ADDED = 'RESOURCE_ADDED';
export const RESOURCE_SPENT = 'RESOURCE_SPENT';

// Generator events
export const GENERATOR_PURCHASED = 'GENERATOR_PURCHASED';
export const GENERATOR_UNLOCKED = 'GENERATOR_UNLOCKED';
export const GENERATOR_PRODUCTION_UPDATED = 'GENERATOR_PRODUCTION_UPDATED';

// Explorer events
export const EXPLORATION_STARTED = 'EXPLORATION_STARTED';
export const EXPLORATION_COMPLETED = 'EXPLORATION_COMPLETED';
export const EXPLORER_LEVEL_UP = 'EXPLORER_LEVEL_UP';
export const EXPLORER_STAT_UPGRADED = 'EXPLORER_STAT_UPGRADED';
export const EXPLORER_STATE_CHANGED = 'EXPLORER_STATE_CHANGED';

// Upgrade events
export const UPGRADE_PURCHASED = 'UPGRADE_PURCHASED';
export const UPGRADES_AVAILABLE = 'UPGRADES_AVAILABLE';

// Achievement events
export const ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED';
export const ACHIEVEMENTS_UPDATED = 'ACHIEVEMENTS_UPDATED';

// Game events
export const GAME_TICK = 'GAME_TICK';
export const GAME_SAVED = 'GAME_SAVED';
export const GAME_LOADED = 'GAME_LOADED';
export const GAME_RESET = 'GAME_RESET';
export const GAME_STARTED = 'GAME_STARTED';
export const GAME_PAUSED = 'GAME_PAUSED';

// UI events
export const UI_TAB_CHANGED = 'UI_TAB_CHANGED';
export const UI_SETTINGS_TOGGLED = 'UI_SETTINGS_TOGGLED';
export const UI_MODAL_OPENED = 'UI_MODAL_OPENED';
export const UI_MODAL_CLOSED = 'UI_MODAL_CLOSED';