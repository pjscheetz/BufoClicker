import { GeneratorType } from './generators';
import { loadJsonData } from '../utils/dataLoader';
import * as Logger from '../utils/logger';

/**
 * Enum for upgrade categories
 */
export enum UpgradeCategory {
  Click = 'click',
  Generator = 'generator',
  Global = 'global'
}

/**
 * Types of upgrade effects
 */
export type UpgradeEffectType = 
  | 'clickMultiplier'
  | 'generatorProduction'
  | 'globalMultiplier'
  | 'unlockSpecial';

/**
 * Unlock condition types
 */
export enum UnlockConditionType {
  TotalBufos = 'totalBufos',
  GeneratorCount = 'generatorCount',
  Achievements = 'achievements'
}

/**
 * Unlock condition interface
 */
export interface UnlockCondition {
  type: UnlockConditionType;
  target?: string | GeneratorType;
  value: number;
}

/**
 * Upgrade effect interface
 */
export interface UpgradeEffect {
  type: UpgradeEffectType;
  target?: string | GeneratorType;
  multiplier: number;
}

/**
 * Upgrade interface
 */
export interface Upgrade {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the upgrade */
  description: string;
  /** Upgrade category */
  flavorText?: string;
  category: UpgradeCategory;
  /** Cost to purchase */
  cost: number;
  /** Effects when purchased */
  effects: UpgradeEffect[];
  /** Conditions to unlock */
  unlockConditions: UnlockCondition[];
  /** Icon or image path */
  iconPath?: string;
}

/**
 * Initial set of upgrades - will be populated from JSON
 */
export let INITIAL_UPGRADES: Upgrade[] = [];

/**
 * Initialize upgrades from JSON data
 */
export async function initializeUpgrades(): Promise<Upgrade[]> {
  try {
    // Log a message to track loading progress
    Logger.debug('Loading upgrades from JSON...');
    
    // Load data from JSON file
    const data = await loadJsonData<any[]>('./assets/data/upgrades.json');
    
    // Log that we successfully retrieved JSON
    Logger.debug(`Retrieved upgrades JSON with ${data.length} entries`);
    
    // Convert JSON data to properly typed upgrades
    const upgrades: Upgrade[] = [];
    
    // Process each upgrade from JSON
    for (const upgradeData of data) {
      try {
        // Convert unlock conditions to proper enum types
        const unlockConditions: UnlockCondition[] = (upgradeData.unlockConditions || []).map((condition: any) => ({
          type: mapUnlockConditionTypeFromString(condition.type),
          value: condition.value,
          target: condition.target
        }));
        
        // Convert effects
        const effects: UpgradeEffect[] = (upgradeData.effects || []).map((effect: any) => ({
          type: effect.type as UpgradeEffectType,
          target: effect.target,
          multiplier: effect.multiplier
        }));
        
        // Create typed upgrade
        upgrades.push({
          ...upgradeData,
          category: mapCategoryFromString(upgradeData.category),
          unlockConditions,
          effects
        });
        
        // Log each processed upgrade for debugging
        Logger.debug(`Processed upgrade: ${upgradeData.id}`);
      } catch (error) {
        Logger.error(`Error processing upgrade ${upgradeData.id || 'unknown'}:`, error);
        // Skip this upgrade
      }
    }
    
    // Set the global INITIAL_UPGRADES with the new data
    INITIAL_UPGRADES = upgrades;
    
    // Log success
    Logger.log(`Initialized ${upgrades.length} upgrades from JSON`);
    
    return upgrades;
  } catch (error) {
    Logger.error('Failed to initialize upgrades from JSON:', error);
    
    // Return an empty array as fallback
    return [];
  }
}

/**
 * Map string category to UpgradeCategory enum
 */
function mapCategoryFromString(category: string): UpgradeCategory {
  switch (category.toLowerCase()) {
    case 'click': return UpgradeCategory.Click;
    case 'generator': return UpgradeCategory.Generator;
    case 'global': return UpgradeCategory.Global;
    default: return UpgradeCategory.Global;
  }
}

/**
 * Map string unlock condition type to UnlockConditionType enum
 */
function mapUnlockConditionTypeFromString(type: string): UnlockConditionType {
  switch (type.toLowerCase()) {
    case 'totalbufos': return UnlockConditionType.TotalBufos;
    case 'generatorcount': return UnlockConditionType.GeneratorCount;
    case 'achievements': return UnlockConditionType.Achievements;
    default: return UnlockConditionType.TotalBufos;
  }
}

/**
 * Find an upgrade by ID
 * @param upgrades Array of upgrades to search
 * @param id Upgrade ID to find
 * @returns The found upgrade or undefined
 */
export function findUpgradeById(upgrades: Upgrade[], id: string): Upgrade | undefined {
  return upgrades.find(upgrade => upgrade.id === id);
}

/**
 * Check if an upgrade meets all unlock conditions
 * @param upgrade The upgrade to check
 * @param totalBufos Total bufos earned
 * @param generatorCounts Map of generator counts
 * @param achievements Map of unlocked achievements
 * @returns Whether the upgrade meets all unlock conditions
 */
export function meetsUnlockConditions(
  upgrade: Upgrade,
  totalBufos: number,
  generatorCounts: Record<GeneratorType, number>,
  achievements: Record<string, boolean> = {}
): boolean {
  // Check each unlock condition
  for (const condition of upgrade.unlockConditions) {
    switch (condition.type) {
      case UnlockConditionType.TotalBufos:
        if (totalBufos < condition.value) {
          return false;
        }
        break;
        
      case UnlockConditionType.GeneratorCount:
        if (!condition.target) {
          return false;
        }
        
        const targetCount = generatorCounts[condition.target as GeneratorType] || 0;
        if (targetCount < condition.value) {
          return false;
        }
        break;
        
      case UnlockConditionType.Achievements:
        if (!condition.target) {
          return false;
        }
        
        if (!achievements[condition.target as string]) {
          return false;
        }
        break;
        
      default:
        return false;
    }
  }
  
  // All conditions passed
  return true;
}

/**
 * Calculate upgrade effects based on generator type
 * @param upgrade The upgrade to apply
 * @param generatorType The type of generator to check effects for
 * @returns Multiplier for the generator (1.0 if no effect)
 */
export function calculateUpgradeEffectForGenerator(
  upgrade: Upgrade,
  generatorType: GeneratorType
): number {
  // Default multiplier (no effect)
  let multiplier = 1.0;
  
  // Check each effect
  for (const effect of upgrade.effects) {
    // Check if this effect applies to the specified generator
    if (effect.type === 'generatorProduction' && effect.target === generatorType) {
      multiplier *= effect.multiplier;
    }
    // Check if this is a global effect that applies to all generators
    else if (effect.type === 'globalMultiplier') {
      multiplier *= effect.multiplier;
    }
  }
  
  return multiplier;
}

/**
 * Calculate click multiplier from a set of upgrades
 * @param upgrades Array of upgrades to check
 * @returns Total click multiplier
 */
export function calculateClickMultiplier(upgrades: Upgrade[]): number {
  let multiplier = 1.0;
  
  for (const upgrade of upgrades) {
    for (const effect of upgrade.effects) {
      if (effect.type === 'clickMultiplier') {
        multiplier *= effect.multiplier;
      }
    }
  }
  
  return multiplier;
}

/**
 * Calculate global production multiplier from a set of upgrades
 * @param upgrades Array of upgrades to check
 * @returns Total global production multiplier
 */
export function calculateGlobalMultiplier(upgrades: Upgrade[]): number {
  let multiplier = 1.0;
  
  for (const upgrade of upgrades) {
    for (const effect of upgrade.effects) {
      if (effect.type === 'globalMultiplier') {
        multiplier *= effect.multiplier;
      }
    }
  }
  
  return multiplier;
}