/**
 * Generators module for game production buildings
 */
import { loadJsonData } from '../utils/dataLoader';
import * as Logger from '../utils/logger';

/**
 * Enumeration of generator types
 * Represents different tiers of production buildings
 */
export enum GeneratorType {
  Tadpole = 'tadpole',
  Froglet = 'froglet',
  Bufo = 'bufo',
  GiantToad = 'giant_toad',
  PoisonDartFrog = 'poison_dart_frog',
  TreeFrog = 'tree_frog',
  BulbousFrog = 'bulbous_frog',
  GoldenFrog = 'golden_frog'
}

/**
 * Enumeration of generator categories
 */
export enum GeneratorCategory {
  Basic = 'basic',
  Premium = 'premium',
  Special = 'special'
}

/**
 * Unlock type for generators
 */
export enum UnlockType {
  Bufos = 'bufos', // Unlocked by collecting total bufos
  Generators = 'generators', // Unlocked by owning X of another generator
  Achievement = 'achievement', // Unlocked by specific achievement
  Special = 'special' // Special unlock conditions
}

/**
 * Interface for generator unlock requirements
 */
export interface UnlockRequirement {
  /** Type of unlock requirement */
  type: UnlockType;
  /** Value needed (bufos amount, generator count, etc.) */
  value: number;
  /** Target (specific generator, achievement ID, etc.) */
  target?: string;
}

/**
 * Interface for production boosts from upgrades
 */
export interface ProductionBoost {
  /** ID of the boost */
  id: string;
  /** Multiplier value */
  multiplier: number;
  /** Is boost currently active */
  active: boolean;
  /** Source of the boost (upgrade, achievement, etc.) */
  source: string;
}

/**
 * Interface for generator data
 * Contains all properties needed for a generator
 */
export interface GeneratorData {
  /** Unique identifier of the generator */
  readonly id: GeneratorType;
  /** Display name of the generator */
  readonly name: string;
  /** Short description of the generator */
  readonly description: string;
  /** Detailed description shown in tooltips */
  readonly detailedDescription?: string;
  /** Path to generator icon image */
  readonly iconPath?: string;
  /** Category of generator */
  readonly category: GeneratorCategory;
  /** Current owned count */
  readonly count: number;
  /** Base production per second per unit */
  readonly baseProduction: number;
  /** Current production after all multipliers */
  readonly currentProduction: number;
  /** Total production from all instances of this generator */
  readonly totalProduction: number;
  /** Base cost for the first unit */
  readonly baseCost: number;
  /** Current cost to purchase the next unit */
  readonly currentCost: number;
  /** Cost growth multiplier (how much each unit increases the cost) */
  readonly costMultiplier: number;
  /** Unlock requirements */
  readonly unlockRequirements: UnlockRequirement[];
  /** Whether this generator is visible to the player */
  readonly unlocked: boolean;
  /** Whether this generator is enabled and can be purchased */
  readonly enabled: boolean;
  /** Production boosts specific to this generator */
  readonly boosts: ProductionBoost[];
  /** Upgrade IDs that affect this generator */
  readonly relatedUpgrades?: string[];
  /** Additional metadata or special properties */
  readonly metadata?: Record<string, any>;
}

/**
 * Interface for updating generator data
 * All properties are optional for easier updates
 */
export interface GeneratorUpdate extends Partial<Omit<GeneratorData, 'id'>> {
  readonly id: GeneratorType;
}

/**
 * Default generators data - will be populated from JSON
 */
export let INITIAL_GENERATORS: Record<GeneratorType, GeneratorData> = {} as Record<GeneratorType, GeneratorData>;

/**
 * Initialize generators from JSON data
 */
/**
 * Initialize generators from JSON data
 */
export async function initializeGenerators(): Promise<Record<GeneratorType, GeneratorData>> {
  try {
    // Log a message to track loading progress
    Logger.debug('Loading generators from JSON...');
    
    // Load data from JSON file
    const data = await loadJsonData<Record<string, any>>('./assets/data/generators.json');
    
    // Log that we successfully retrieved JSON
    Logger.debug(`Retrieved generators JSON with ${Object.keys(data).length} entries`);
    
    // Convert JSON data to properly typed generators
    const typedGenerators: Record<GeneratorType, GeneratorData> = {} as Record<GeneratorType, GeneratorData>;
    
    // Process each generator from JSON
    for (const [key, genData] of Object.entries(data)) {
      try {
        // Convert unlock requirements to proper enum types
        const unlockRequirements: UnlockRequirement[] = (genData.unlockRequirements || []).map((req: any) => ({
          type: mapUnlockTypeFromString(req.type),
          value: req.value,
          target: req.target
        }));
        
        // Create typed generator data
        typedGenerators[key as GeneratorType] = {
          ...genData,
          id: key as GeneratorType,
          category: mapCategoryFromString(genData.category),
          unlockRequirements,
          boosts: genData.boosts || []
        };
        
        // Log each processed generator for debugging
        Logger.debug(`Processed generator: ${key}`);
      } catch (error) {
        Logger.error(`Error processing generator ${key}:`, error);
        // Skip this generator
      }
    }
    
    // Set the global INITIAL_GENERATORS with the new data
    INITIAL_GENERATORS = typedGenerators;
    
    // Log success
    Logger.log(`Initialized ${Object.keys(typedGenerators).length} generators from JSON`);
    
    return typedGenerators;
  } catch (error) {
    Logger.error('Failed to initialize generators from JSON:', error);
    
    // Return an empty object as fallback
    return {} as Record<GeneratorType, GeneratorData>;
  }
}

/**
 * Map string category to GeneratorCategory enum
 */
function mapCategoryFromString(category: string): GeneratorCategory {
  switch (category.toLowerCase()) {
    case 'basic': return GeneratorCategory.Basic;
    case 'premium': return GeneratorCategory.Premium;
    case 'special': return GeneratorCategory.Special;
    default: return GeneratorCategory.Basic;
  }
}

/**
 * Map string unlock type to UnlockType enum
 */
function mapUnlockTypeFromString(type: string): UnlockType {
  switch (type.toLowerCase()) {
    case 'bufos': return UnlockType.Bufos;
    case 'generators': return UnlockType.Generators;
    case 'achievement': return UnlockType.Achievement;
    case 'special': return UnlockType.Special;
    default: return UnlockType.Bufos;
  }
}

/**
 * Creates a new generator state by merging the current state with updates
 * Uses immutable pattern to prevent accidental state mutations
 */
export function updateGenerator(
  currentGenerator: GeneratorData,
  updates: GeneratorUpdate
): GeneratorData {
  return { ...currentGenerator, ...updates };
}

/**
 * Recalculates derived values for a generator
 * Should be called after any generator update
 */
export function recalculateGenerator(
  generator: GeneratorData,
  globalMultiplier: number,
  additionalBoosts: ProductionBoost[] = []
): GeneratorData {
  // Calculate production multiplier from all boosts
  let boostMultiplier = 1;
  
  // Apply generator-specific boosts
  for (const boost of generator.boosts) {
    if (boost.active) {
      boostMultiplier *= boost.multiplier;
    }
  }
  
  // Apply additional boosts (e.g., from upgrades)
  for (const boost of additionalBoosts) {
    if (boost.active) {
      boostMultiplier *= boost.multiplier;
    }
  }
  
  // Apply global multiplier
  const totalMultiplier = boostMultiplier * globalMultiplier;
  
  // Calculate production per unit
  const currentProduction = generator.baseProduction * totalMultiplier;
  
  // Calculate total production from all units
  const totalProduction = currentProduction * generator.count;
  
  // Calculate current cost
  // For newly unlocked generators, we use the base cost
  // For existing generators, we use the formula: baseCost * (costMultiplier ^ count)
  const currentCost = generator.count === 0 
    ? generator.baseCost 
    : Math.ceil(generator.baseCost * Math.pow(generator.costMultiplier, generator.count));
  
  
  return { 
    ...generator, 
    currentProduction,
    totalProduction,
    currentCost 
  };
}

/**
 * Check if a generator's unlock requirements are met
 */
export function checkGeneratorUnlock(
  generator: GeneratorData,
  totalBufos: number,
  ownedGenerators: Record<GeneratorType, number>,
  unlockedAchievements: Record<string, boolean> = {},
  specialConditions: Record<string, boolean> = {}
): boolean {
  if (generator.unlocked) return true;
  
  // Check each unlock requirement
  for (const requirement of generator.unlockRequirements) {
    switch (requirement.type) {
      case UnlockType.Bufos:
        if (totalBufos < requirement.value) return false;
        break;
      
      case UnlockType.Generators:
        if (!requirement.target) continue;
        if ((ownedGenerators[requirement.target as GeneratorType] || 0) < requirement.value) return false;
        break;
      
      case UnlockType.Achievement:
        if (!requirement.target) continue;
        if (!unlockedAchievements[requirement.target]) return false;
        break;
      
      case UnlockType.Special:
        if (!requirement.target) continue;
        if (!specialConditions[requirement.target]) return false;
        break;
    }
  }
  
  // All requirements met
  return true;
}
/**
 * Unlock a generator if requirements are met
 */
export function unlockGenerator(
  generator: GeneratorData,
  totalBufos: number,
  ownedGenerators: Record<GeneratorType, number>,
  unlockedAchievements: Record<string, boolean> = {},
  specialConditions: Record<string, boolean> = {}
): GeneratorData {
  if (generator.unlocked) return generator;
  
  const shouldUnlock = checkGeneratorUnlock(
    generator, 
    totalBufos, 
    ownedGenerators, 
    unlockedAchievements, 
    specialConditions
  );
  
  if (shouldUnlock) {
    return { ...generator, unlocked: true };
  }
  
  return generator;
}

/**
 * Calculates the total production per second from all generators
 */
export function calculateTotalProduction(
  generators: Record<GeneratorType, GeneratorData>
): number {
  // Sum up the totalProduction value from each generator
  return Object.values(generators).reduce(
    (total, generator) => total + generator.totalProduction,
    0
  );
}

/**
 * Check if player can afford to buy the specified quantity of a generator
 */
export function canAffordGenerator(
  generator: GeneratorData,
  bufos: number,
  quantity: number = 1
): boolean {
  if (quantity === 1) {
    return bufos >= generator.currentCost;
  }
  
  // For bulk purchases, we need to calculate the cost of n items
  // using the formula for sum of geometric progression
  const totalCost = calculateBulkCost(generator, quantity);
  
  return bufos >= totalCost;
}

/**
 * Calculate the cost of buying multiple generators
 */
export function calculateBulkCost(
  generator: GeneratorData,
  quantity: number
): number {
  if (quantity === 1) {
    return generator.currentCost;
  }
  
  // Using the formula for sum of geometric progression
  const a = generator.currentCost;
  const r = generator.costMultiplier;
  const n = quantity;
  
  // Sum = a * (1 - r^n) / (1 - r)
  return Math.ceil(a * (1 - Math.pow(r, n)) / (1 - r));
}

/**
 * Calculate the maximum number of generators that can be purchased with the current resources
 */
export function calculateMaxAffordable(
  generator: GeneratorData,
  bufos: number
): number {
  if (bufos < generator.currentCost) {
    return 0;
  }
  
  // Using the formula for max affordable items with exponential cost:
  // n = log((bufos * (r-1) / (a * r^owned) + 1), r)
  // where:
  // - bufos is current amount of currency
  // - r is the cost multiplier
  // - a is the base cost
  // - owned is the current count
  
  const r = generator.costMultiplier;
  const a = generator.baseCost;
  const owned = generator.count;
  
  if (r === 1) {
    // Special case: linear cost growth
    return Math.floor(bufos / generator.currentCost);
  }
  
  const numerator = bufos * (r - 1) / (a * Math.pow(r, owned)) + 1;
  
  if (numerator <= 0) {
    return 0;
  }
  
  const maxAffordable = Math.floor(Math.log(numerator) / Math.log(r));
  return Math.max(0, maxAffordable);
}

/**
 * Creates a new generator from scratch
 */
export function createGenerator(
  id: GeneratorType,
  name: string,
  description: string,
  baseProduction: number,
  baseCost: number,
  costMultiplier: number,
  unlockRequirements: UnlockRequirement[] = [{ type: UnlockType.Bufos, value: 0 }],
  category: GeneratorCategory = GeneratorCategory.Basic,
  iconPath?: string,
  detailedDescription?: string
): GeneratorData {
  return {
    id,
    name,
    description,
    detailedDescription,
    iconPath,
    category,
    count: 0,
    baseProduction,
    currentProduction: baseProduction,
    totalProduction: 0,
    baseCost,
    currentCost: baseCost,
    costMultiplier,
    unlockRequirements,
    unlocked: unlockRequirements.length === 1 && 
              unlockRequirements[0].type === UnlockType.Bufos && 
              unlockRequirements[0].value === 0,
    enabled: true,
    boosts: []
  };
}

/**
 * Apply a production boost to a generator
 */
export function applyBoostToGenerator(
  generator: GeneratorData,
  boostId: string,
  multiplier: number,
  source: string,
  active: boolean = true
): GeneratorData {
  // Check if boost already exists
  const existingBoostIndex = generator.boosts.findIndex(b => b.id === boostId);
  
  if (existingBoostIndex >= 0) {
    // Update existing boost
    const updatedBoosts = [...generator.boosts];
    updatedBoosts[existingBoostIndex] = {
      ...updatedBoosts[existingBoostIndex],
      multiplier,
      active
    };
    
    return { ...generator, boosts: updatedBoosts };
  } else {
    // Add new boost
    return {
      ...generator,
      boosts: [
        ...generator.boosts,
        { id: boostId, multiplier, source, active }
      ]
    };
  }
}

/**
 * Enable or disable a specific boost on a generator
 */
export function toggleBoost(
  generator: GeneratorData,
  boostId: string,
  active: boolean
): GeneratorData {
  const boostIndex = generator.boosts.findIndex(b => b.id === boostId);
  
  if (boostIndex < 0) {
    return generator;
  }
  
  const updatedBoosts = [...generator.boosts];
  updatedBoosts[boostIndex] = {
    ...updatedBoosts[boostIndex],
    active
  };
  
  return { ...generator, boosts: updatedBoosts };
}