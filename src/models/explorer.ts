/**
 * Explorer state enum for tracking current activity
 */
export enum ExplorerState {
  Idle = 'idle',
  Exploring = 'exploring',
  Fighting = 'fighting',
  Resting = 'resting',
  Injured = 'injured'
}

/**
* Explorer stats with level tracking
*/
export interface ExplorerStat {
  /** Current value */
  value: number;
  /** Level of this stat (affects growth rate) */
  level: number;
  /** Base growth per level */
  growthRate: number;
  /** Cost to upgrade this stat */
  upgradeCost: number;
  /** Multiplier for this stat from equipment and buffs */
  multiplier: number;
}

/**
* Explorer equipment slots
*/
export interface ExplorerEquipment {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
}

/**
* Explorer adventure results
*/
export interface ExplorationResult {
  /** Whether explorer survived */
  survived: boolean;
  /** Duration of exploration in seconds */
  duration: number;
  /** Resources gained */
  bufosGained: number;
  /** Experience gained */
  experienceGained: number;
  /** Items found (if any) */
  itemsFound: string[];
}

/**
* Explorer data model
*/
export interface ExplorerData {
  /** Explorer name */
  name: string;
  /** Current explorer level */
  level: number;
  /** Total experience points */
  experience: number;
  /** Experience needed for next level */
  experienceToNextLevel: number;
  /** Current state (idle, exploring, etc) */
  state: ExplorerState;
  /** When the current state began (for calculating durations) */
  stateStartTime: number;
  /** Current health points */
  health: number;
  /** Maximum health points */
  maxHealth: number;
  /** Attack stat and level */
  attack: ExplorerStat;
  /** Defense stat and level */
  defense: ExplorerStat;
  /** Speed stat and level */
  speed: ExplorerStat;
  /** Luck stat and level (affects item finds) */
  luck: ExplorerStat;
  /** Current equipment */
  equipment: ExplorerEquipment;
  /** Exploration progress (0-100%) */
  explorationProgress: number;
  /** Current area being explored */
  currentArea: string;
  /** Total successful explorations completed */
  explorationsCompleted: number;
  /** Total bufos earned from exploring */
  lifetimeBufosFromExploring: number;
}

/**
* Default initial explorer data
*/
export const DEFAULT_EXPLORER_DATA: ExplorerData = {
  name: 'Explorer Frog',
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  state: ExplorerState.Idle,
  stateStartTime: Date.now(),
  health: 100,
  maxHealth: 100,
  attack: {
    value: 10,
    level: 1,
    growthRate: 2,
    upgradeCost: 50,
    multiplier: 1
  },
  defense: {
    value: 5,
    level: 1,
    growthRate: 1.5,
    upgradeCost: 50,
    multiplier: 1
  },
  speed: {
    value: 8,
    level: 1,
    growthRate: 1.2,
    upgradeCost: 50,
    multiplier: 1
  },
  luck: {
    value: 5,
    level: 1,
    growthRate: 1,
    upgradeCost: 50,
    multiplier: 1
  },
  equipment: {
    weapon: null,
    armor: null,
    accessory: null
  },
  explorationProgress: 0,
  currentArea: 'Pond',
  explorationsCompleted: 0,
  lifetimeBufosFromExploring: 0
};

/**
* Calculate damage per second based on attack and speed
*/
export function calculateDPS(explorer: ExplorerData): number {
  const baseAttack = explorer.attack.value * explorer.attack.multiplier;
  const attacksPerSecond = Math.max(0.5, explorer.speed.value * explorer.speed.multiplier / 20);
  return baseAttack * attacksPerSecond;
}

/**
* Calculate theoretical survival time in seconds
*/
export function calculateSurvivalTime(explorer: ExplorerData): number {
  // Base enemy damage per second (for calculation purposes)
  const baseEnemyDPS = 5 + (explorer.level * 2);
  
  // Damage reduction from defense (percentage between 0-80%)
  const damageReduction = Math.min(0.8, explorer.defense.value * explorer.defense.multiplier / 100);
  
  // Effective enemy DPS after defense
  const effectiveEnemyDPS = baseEnemyDPS * (1 - damageReduction);
  
  // If enemy can't damage the explorer, return a high number
  if (effectiveEnemyDPS <= 0) return 999;
  
  // Calculate how long until health reaches 0
  return explorer.health / effectiveEnemyDPS;
}

/**
* Calculate explorer power rating (overall effectiveness)
*/
export function calculatePowerRating(explorer: ExplorerData): number {
  const dps = calculateDPS(explorer);
  const survivalTime = calculateSurvivalTime(explorer);
  const luckBonus = Math.sqrt(explorer.luck.value * explorer.luck.multiplier);
  
  // Combine factors into a single rating
  return Math.floor((dps * survivalTime) / 10 + luckBonus);
}

/**
* Calculate explorer effectiveness in an area
* Returns a value between 0 and 1
*/
export function calculateAreaEffectiveness(explorer: ExplorerData, areaLevel: number): number {
  const powerRating = calculatePowerRating(explorer);
  const idealPower = areaLevel * 25;
  
  // If explorer is stronger than ideal, cap at 1
  if (powerRating >= idealPower) return 1;
  
  // Otherwise scale based on power ratio
  return powerRating / idealPower;
}

/**
* Calculate upgrade cost for a stat
*/
export function calculateStatUpgradeCost(statLevel: number, baseCost: number = 50): number {
  return Math.floor(baseCost * Math.pow(1.15, statLevel - 1));
}

/**
* Update explorer after stat changes
*/
export function recalculateExplorerStats(explorer: ExplorerData): ExplorerData {
  // Calculate health based on level and defense
  const healthBase = 100 + (explorer.level - 1) * 20;
  const healthFromDefense = explorer.defense.level * 10;
  const newMaxHealth = healthBase + healthFromDefense;
  
  // Calculate experience needed for next level
  const expToNextLevel = 100 * Math.pow(1.5, explorer.level - 1);
  
  // Create updated explorer
  return {
    ...explorer,
    maxHealth: newMaxHealth,
    health: Math.min(explorer.health, newMaxHealth), // Cap health at max
    experienceToNextLevel: Math.ceil(expToNextLevel)
  };
}

/**
* Check if explorer can level up
*/
export function canLevelUp(explorer: ExplorerData): boolean {
  return explorer.experience >= explorer.experienceToNextLevel;
}

/**
 * Apply level up to explorer
 */
export function levelUpExplorer(explorer: ExplorerData): ExplorerData {
  if (!canLevelUp(explorer)) return explorer;
  
  const newLevel = explorer.level + 1;
  const remainingExp = explorer.experience - explorer.experienceToNextLevel;
  
  // Create upgraded explorer
  const upgradedExplorer: ExplorerData = {
    ...explorer,
    level: newLevel,
    experience: remainingExp,
  };
  
  // Recalculate all stats
  return recalculateExplorerStats(upgradedExplorer);
}

/**
* Upgrade a specific stat
*/
export function upgradeExplorerStat(explorer: ExplorerData, statName: 'attack' | 'defense' | 'speed' | 'luck', bufos: number): {
  success: boolean;
  cost: number;
  explorer: ExplorerData;
} {
  const stat = explorer[statName];
  if (!stat) {
    return { success: false, cost: 0, explorer };
  }
  
  // Check if can afford upgrade
  if (bufos < stat.upgradeCost) {
    return { success: false, cost: stat.upgradeCost, explorer };
  }
  
  // Upgrade the stat
  const newLevel = stat.level + 1;
  const newValue = stat.value + stat.growthRate;
  const newUpgradeCost = calculateStatUpgradeCost(newLevel, 50);
  
  // Create upgraded stat
  const upgradedStat: ExplorerStat = {
    ...stat,
    level: newLevel,
    value: newValue,
    upgradeCost: newUpgradeCost
  };
  
  // Create updated explorer
  const upgradedExplorer: ExplorerData = {
    ...explorer,
    [statName]: upgradedStat
  };
  
  // Recalculate all stats (for health, etc.)
  const recalculatedExplorer = recalculateExplorerStats(upgradedExplorer);
  
  return {
    success: true,
    cost: stat.upgradeCost,
    explorer: recalculatedExplorer
  };
}

/**
* Start an exploration with the explorer
*/
export function startExploration(explorer: ExplorerData, area: string): ExplorerData {
  if (explorer.state !== ExplorerState.Idle && explorer.state !== ExplorerState.Resting) {
    return explorer; // Can't start if already exploring, fighting or injured
  }
  
  if (explorer.health < explorer.maxHealth * 0.2) {
    return explorer; // Can't explore with less than 20% health
  }
  
  return {
    ...explorer,
    state: ExplorerState.Exploring,
    stateStartTime: Date.now(),
    explorationProgress: 0,
    currentArea: area
  };
}

/**
* Start a combat with the explorer
*/
export function startCombat(explorer: ExplorerData): ExplorerData {
  if (explorer.state !== ExplorerState.Exploring) {
    return explorer; // Can only enter combat from exploration
  }
  
  return {
    ...explorer,
    state: ExplorerState.Fighting,
    stateStartTime: Date.now()
  };
}

/**
* Calculate result of an exploration
*/
export function calculateExplorationResult(explorer: ExplorerData, elapsedSeconds: number): ExplorationResult {
  // Base values for calculation
  const areaLevel = getAreaLevel(explorer.currentArea);
  const effectiveness = calculateAreaEffectiveness(explorer, areaLevel);
  
  // Calculate duration modifier based on effectiveness
  // More effective = faster exploration
  const durationModifier = 0.5 + (0.5 * effectiveness);
  const explorationDuration = elapsedSeconds * durationModifier;
  
  // Calculate survival chance based on health and effectiveness
  const healthPercentage = explorer.health / explorer.maxHealth;
  const baseSurvivalChance = healthPercentage * effectiveness;
  const survived = Math.random() < baseSurvivalChance;
  
  // Calculate rewards
  const baseBuffos = areaLevel * 50 * effectiveness * (explorationDuration / 60);
  const luckModifier = 1 + (explorer.luck.value * explorer.luck.multiplier / 100);
  const bufosGained = survived ? Math.floor(baseBuffos * luckModifier) : Math.floor(baseBuffos * 0.3);
  
  // Calculate experience
  const baseExperience = areaLevel * 10 * (explorationDuration / 60);
  const experienceGained = survived ? Math.floor(baseExperience) : Math.floor(baseExperience * 0.5);
  
  // Calculate item drops (placeholder for future implementation)
  const itemsFound: string[] = [];
  
  return {
    survived,
    duration: explorationDuration,
    bufosGained,
    experienceGained,
    itemsFound
  };
}

/**
* Complete an exploration - apply results to explorer
*/
export function completeExploration(explorer: ExplorerData, result: ExplorationResult): ExplorerData {
  // Calculate health loss based on duration and survival
  let healthLoss = explorer.maxHealth * 0.1; // Base 10% health loss
  
  if (!result.survived) {
    // Failed exploration causes more health loss
    healthLoss = explorer.maxHealth * 0.4; // 40% health loss on failure
  }
  
  // Calculate new health (can't go below 1)
  const newHealth = Math.max(1, explorer.health - healthLoss);
  
  // Determine new state based on health
  let newState = ExplorerState.Resting;
  if (newHealth < explorer.maxHealth * 0.2) {
    newState = ExplorerState.Injured; // Explorer is injured if health is low
  }
  
  // Update explorer
  const updatedExplorer: ExplorerData = {
    ...explorer,
    health: newHealth,
    state: newState,
    stateStartTime: Date.now(),
    experience: explorer.experience + result.experienceGained,
    explorationsCompleted: explorer.explorationsCompleted + 1,
    lifetimeBufosFromExploring: explorer.lifetimeBufosFromExploring + result.bufosGained,
    explorationProgress: 0
  };
  
  // Check if explorer can level up
  if (canLevelUp(updatedExplorer)) {
    return levelUpExplorer(updatedExplorer);
  }
  
  return updatedExplorer;
}

/**
* Rest the explorer to recover health
*/
export function restExplorer(explorer: ExplorerData, seconds: number): ExplorerData {
  if (explorer.state !== ExplorerState.Resting && explorer.state !== ExplorerState.Injured) {
    return explorer;
  }
  
  // Calculate health recovery (slower if injured)
  const recoveryRate = explorer.state === ExplorerState.Injured ? 0.05 : 0.1;
  const healthRecovered = explorer.maxHealth * recoveryRate * (seconds / 60);
  
  // Apply health recovery
  const newHealth = Math.min(explorer.maxHealth, explorer.health + healthRecovered);
  
  // Check if fully recovered
  let newState: ExplorerState = explorer.state; // Explicitly type as ExplorerState
  if (newHealth >= explorer.maxHealth) {
    newState = ExplorerState.Idle; // Now this will work with proper type
  } else if (newHealth >= explorer.maxHealth * 0.2 && explorer.state === ExplorerState.Injured) {
    newState = ExplorerState.Resting; // No longer injured if above 20% health
  }
  
  return {
    ...explorer,
    health: newHealth,
    state: newState,
    stateStartTime: newState !== explorer.state ? Date.now() : explorer.stateStartTime
  };
}

/**
* Get the level of an area
*/
export function getAreaLevel(area: string): number {
  const areaLevels: Record<string, number> = {
    'Pond': 1,
    'Creek': 2,
    'Swamp': 3,
    'River': 4,
    'Lake': 5,
    'Forest': 6,
    'Mountains': 8,
    'Dungeon': 10
  };
  
  return areaLevels[area] || 1;
}

/**
* Update explorer during game tick
*/
export function updateExplorer(explorer: ExplorerData, deltaSeconds: number): {
  explorer: ExplorerData;
  result?: ExplorationResult;
} {
  // Handle different states
  switch (explorer.state) {
    case ExplorerState.Exploring: {
      // Update exploration progress
      const progressIncrement = (deltaSeconds / 60) * 10; // 10% per minute as base
      let newProgress = explorer.explorationProgress + progressIncrement;
      
      // Check if exploration is complete
      if (newProgress >= 100) {
        // Calculate exploration duration
        const explorationTimeSeconds = (Date.now() - explorer.stateStartTime) / 1000;
        
        // Calculate result
        const result = calculateExplorationResult(explorer, explorationTimeSeconds);
        
        // Apply result
        const updatedExplorer = completeExploration(explorer, result);
        
        return { explorer: updatedExplorer, result };
      }
      
      // Update progress
      return {
        explorer: {
          ...explorer,
          explorationProgress: newProgress
        }
      };
    }
    
    case ExplorerState.Fighting: {
      // Combat is managed by the ExplorerManager, so no changes here
      return { explorer };
    }
    
    case ExplorerState.Resting:
    case ExplorerState.Injured: {
      // Heal explorer
      const updatedExplorer = restExplorer(explorer, deltaSeconds);
      return { explorer: updatedExplorer };
    }
    
    default:
      return { explorer };
  }
}