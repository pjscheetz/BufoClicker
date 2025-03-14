// src/models/achievements.ts
import { GeneratorType } from './generators';
import { loadJsonData } from '../utils/dataLoader';
import * as Logger from '../utils/logger';

/**
 * Achievement categories enum
 */
export enum AchievementCategory {
  Generators = 'generators',     // Generator-related achievements
  Production = 'production',     // Production rate/total achievements
  Clicks = 'clicks',             // Clicking achievements
  Special = 'special'            // Special/secret achievements
}

/**
 * Achievement data interface
 */
export interface Achievement {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what to do */
  description: string;
  /** Flavor text shown when achieved */
  flavorText?: string;
  /** Achievement category */
  category: AchievementCategory;
  /** Icon or image path */
  iconPath?: string;
  /** Requirements to unlock */
  requirement: AchievementRequirement;
  /** Achievement reward (if any) */
  reward?: AchievementReward;
  /** Whether the achievement is a secret (hidden until unlocked) */
  secret?: boolean;
  /** Sort order within category */
  order?: number;
}

/**
 * Different requirement types for achievements
 */
export enum RequirementType {
  TotalBufos = 'totalBufos',              // Total bufos earned
  BufosPerSecond = 'bufosPerSecond',      // Production rate
  TotalGenerators = 'totalGenerators',    // Total generators owned
  GeneratorType = 'generatorType',        // Specific generator count
  ClickCount = 'clickCount',              // Number of clicks
  ConsoleOpened = 'consoleOpened',        // Console opened (dev tools)
  UpgradeCount = 'upgradeCount',          // Number of upgrades purchased
  ExplorationCount = 'explorationCount',  // Number of explorations completed
  CustomEvent = 'customEvent'             // Custom event triggered
}

/**
 * Achievement requirement interface
 */
export interface AchievementRequirement {
  /** Type of requirement */
  type: RequirementType;
  /** Target value to reach */
  value: number;
  /** Target specific generator type (for GeneratorType requirements) */
  target?: GeneratorType | string;
}

/**
 * Achievement reward types
 */
export enum RewardType {
  ProductionBoost = 'productionBoost',    // Boost to all production
  ClickBoost = 'clickBoost',              // Boost to clicking power
  GeneratorBoost = 'generatorBoost',      // Boost to specific generator
  UnlockGenerator = 'unlockGenerator',    // Unlock a generator
  UnlockUpgrade = 'unlockUpgrade',        // Unlock an upgrade
  UnlockFeature = 'unlockFeature',        // Unlock a feature
  BufoBonus = 'bufoBonus'                 // One-time bufo bonus
}

/**
 * Achievement reward interface
 */
export interface AchievementReward {
  /** Type of reward */
  type: RewardType;
  /** Value of the reward (multiplier or amount) */
  value: number;
  /** Target for the reward (generator type, upgrade id, etc.) */
  target?: string;
  /** Description of the reward */
  description: string;
}

/**
 * Initial achievement data (will be populated from JSON)
 */
export let INITIAL_ACHIEVEMENTS: Achievement[] = [];

/**
 * Initialize achievements from JSON data
 */
export async function initializeAchievements(): Promise<Achievement[]> {
  try {
    // Log a message to track loading progress
    Logger.debug('Loading achievements from JSON...');
    
    // Load data from JSON file
    const data = await loadJsonData<any[]>('./assets/data/achievements.json');
    
    
    // Log that we successfully retrieved JSON
    Logger.debug(`Retrieved achievements JSON with ${data.length} entries`);
    
    // Convert JSON data to properly typed achievements
    const achievements: Achievement[] = [];
    
    // Process each achievement from JSON
    for (const achievementData of data) {
      try {
        // Create typed achievement
        achievements.push({
          ...achievementData,
          category: mapCategoryFromString(achievementData.category),
          requirement: {
            ...achievementData.requirement,
            type: mapRequirementTypeFromString(achievementData.requirement.type)
          },
          reward: achievementData.reward ? {
            ...achievementData.reward,
            type: mapRewardTypeFromString(achievementData.reward.type)
          } : undefined
        });
        
        // Log each processed achievement for debugging
        Logger.debug(`Processed achievement: ${achievementData.id}`);
      } catch (error) {
        Logger.error(`Error processing achievement ${achievementData.id || 'unknown'}:`, error);
        // Skip this achievement
      }
    }
    
    // Set the global INITIAL_ACHIEVEMENTS with the new data
    INITIAL_ACHIEVEMENTS = achievements;
    
    // Log success
    Logger.log(`Initialized ${achievements.length} achievements from JSON`);
    
    return achievements;
  } catch (error) {
    Logger.error('Failed to initialize achievements from JSON:', error);
    
    // Return an empty array as fallback
    return [];
  }
}

/**
 * Map string category to AchievementCategory enum
 */
function mapCategoryFromString(category: string): AchievementCategory {
  switch (category.toLowerCase()) {
    case 'generators': return AchievementCategory.Generators;
    case 'production': return AchievementCategory.Production;
    case 'clicks': return AchievementCategory.Clicks;
    case 'special': return AchievementCategory.Special;
    default: return AchievementCategory.Special;
  }
}

/**
 * Map string requirement type to RequirementType enum
 */
function mapRequirementTypeFromString(type: string): RequirementType {
  switch (type.toLowerCase()) {
    case 'totalbufos': return RequirementType.TotalBufos;
    case 'bufospersecond': return RequirementType.BufosPerSecond;
    case 'totalgenerators': return RequirementType.TotalGenerators;
    case 'generatortype': return RequirementType.GeneratorType;
    case 'clickcount': return RequirementType.ClickCount;
    case 'consoleopened': return RequirementType.ConsoleOpened;
    case 'upgradecount': return RequirementType.UpgradeCount;
    case 'explorationcount': return RequirementType.ExplorationCount;
    case 'customevent': return RequirementType.CustomEvent;
    default: return RequirementType.CustomEvent;
  }
}

/**
 * Map string reward type to RewardType enum
 */
function mapRewardTypeFromString(type: string): RewardType {
  switch (type.toLowerCase()) {
    case 'productionboost': return RewardType.ProductionBoost;
    case 'clickboost': return RewardType.ClickBoost;
    case 'generatorboost': return RewardType.GeneratorBoost;
    case 'unlockgenerator': return RewardType.UnlockGenerator;
    case 'unlockupgrade': return RewardType.UnlockUpgrade;
    case 'unlockfeature': return RewardType.UnlockFeature;
    case 'bufobonus': return RewardType.BufoBonus;
    default: return RewardType.BufoBonus;
  }
}

/**
 * Check if an achievement's requirements are met
 * @param achievement The achievement to check
 * @param gameState Current game state
 * @returns Whether the achievement requirements are met
 */
export function checkAchievementRequirement(
  achievement: Achievement,
  gameState: { 
    totalBufos: number; 
    bufosPerSecond: number;
    totalGenerators: number;
    generatorCounts: Record<GeneratorType, number>;
    clickCount: number;
    consoleOpened: boolean;
    upgradesPurchased: number;
    explorationsCompleted: number;
    customEvents: Record<string, boolean>;
  }
): boolean {
  const req = achievement.requirement;
  
  switch (req.type) {
    case RequirementType.TotalBufos:
      return gameState.totalBufos >= req.value;
      
    case RequirementType.BufosPerSecond:
      return gameState.bufosPerSecond >= req.value;
      
    case RequirementType.TotalGenerators:
      return gameState.totalGenerators >= req.value;
      
    case RequirementType.GeneratorType:
      if (!req.target) return false;
      return gameState.generatorCounts[req.target as GeneratorType] >= req.value;
      
    case RequirementType.ClickCount:
      return gameState.clickCount >= req.value;
      
    case RequirementType.ConsoleOpened:
      return gameState.consoleOpened;
      
    case RequirementType.UpgradeCount:
      return gameState.upgradesPurchased >= req.value;
      
    case RequirementType.ExplorationCount:
      return gameState.explorationsCompleted >= req.value;
      
    case RequirementType.CustomEvent:
      if (!req.target) return false;
      return gameState.customEvents[req.target] === true;
      
    default:
      return false;
  }
}

/**
 * Get emoji icon for achievement category
 * @param category Achievement category
 * @returns Emoji representing the category
 */
export function getCategoryIcon(category: AchievementCategory): string {
  switch (category) {
    case AchievementCategory.Generators: return '🏭';
    case AchievementCategory.Production: return '💰';
    case AchievementCategory.Clicks: return '👆';
    case AchievementCategory.Special: return '🎮';
    default: return '🏆';
  }
}

/**
 * Get icon for an achievement (fallback to category icon)
 * @param achievement Achievement to get icon for
 * @returns Icon string or path
 */
export function getAchievementIcon(achievement: Achievement): string {
  // Use custom icon if provided
  if (achievement.iconPath) {
    return achievement.iconPath;
  }
  
  // Otherwise use category icon
  return getCategoryIcon(achievement.category);
}