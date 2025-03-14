/**
 * Represents the types of enemies in the game
 */
export enum EnemyType {
    Normal = 'normal',
    Elite = 'elite',
    Boss = 'boss'
  }
  
  /**
   * Represents an item that can be dropped by an enemy
   */
  export interface DropItem {
    /** Unique identifier for the item */
    id: string;
    /** Display name of the item */
    name: string;
    /** Rarity of the item (0-1, where 1 is most common) */
    dropRate: number;
  }
  
  /**
   * Represents an enemy's drop table
   */
  export interface DropTable {
    /** Guaranteed drops (will always drop) */
    guaranteedDrops?: string[];
    /** Possible drops with their rates */
    possibleDrops: DropItem[];
    /** Base bufo reward */
    baseBufos: number;
    /** Base experience reward */
    baseExperience: number;
  }
  
  /**
   * Represents an enemy in the game
   */
  export interface Enemy {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Current health points */
    health: number;
    /** Maximum health points */
    maxHealth: number;
    /** Attack stat */
    attack: number;
    /** Defense stat */
    defense: number;
    /** Speed stat */
    speed: number;
    /** Enemy type (normal, elite, boss) */
    type: EnemyType;
    /** Visual color theme for UI */
    colorTheme: string;
    /** Sprite/image reference */
    spriteRef: string;
    /** Area/region this enemy appears in */
    area: string;
    /** Difficulty level (affects stat scaling) */
    difficultyLevel: number;
    /** Drop table for rewards */
    dropTable: DropTable;
  }
  
  /**
   * Represents an enemy template for generating enemies
   */
  export interface EnemyTemplate {
    /** Base identifier (will be modified for instances) */
    baseId: string;
    /** Display name template */
    nameTemplate: string;
    /** Base maximum health */
    baseMaxHealth: number;
    /** Base attack stat */
    baseAttack: number;
    /** Base defense stat */
    baseDefense: number;
    /** Base speed stat */
    baseSpeed: number;
    /** Possible enemy types this template can generate */
    possibleTypes: EnemyType[];
    /** Probability weights for each enemy type */
    typeWeights: number[];
    /** Visual color theme for UI */
    colorTheme: string;
    /** Sprite/image reference or pattern */
    spriteRef: string;
    /** Areas this enemy can appear in */
    areas: string[];
    /** Minimum area level for this enemy to appear */
    minAreaLevel: number;
    /** Base drop table */
    baseDropTable: DropTable;
    /** Scaling factor for health with area level */
    healthScaling: number;
    /** Scaling factor for attack with area level */
    attackScaling: number;
    /** Scaling factor for defense with area level */
    defenseScaling: number;
    /** Scaling factor for speed with area level */
    speedScaling: number;
  }
  
  /**
   * Base drop items that can be used across multiple enemy types
   */
  export const BASE_DROP_ITEMS: Record<string, DropItem> = {
    'common_slime': {
      id: 'common_slime',
      name: 'Common Slime',
      dropRate: 0.8
    },
    'water_essence': {
      id: 'water_essence',
      name: 'Water Essence',
      dropRate: 0.5
    },
    'thorn_spike': {
      id: 'thorn_spike',
      name: 'Thorn Spike',
      dropRate: 0.4
    },
    'frog_scale': {
      id: 'frog_scale',
      name: 'Frog Scale',
      dropRate: 0.6
    },
    'golden_egg': {
      id: 'golden_egg',
      name: 'Golden Egg',
      dropRate: 0.05
    }
  };
  
  /**
   * Initial enemy templates for the game
   */
  export const INITIAL_ENEMY_TEMPLATES: EnemyTemplate[] = [
    {
      baseId: 'waterBug',
      nameTemplate: 'Water Bug',
      baseMaxHealth: 20,
      baseAttack: 3,
      baseDefense: 1,
      baseSpeed: 5,
      possibleTypes: [EnemyType.Normal, EnemyType.Elite],
      typeWeights: [95, 5], // 95% normal, 5% elite
      colorTheme: '#6BCDFF',
      spriteRef: 'assets/images/enemies/water_bug.png',
      areas: ['Pond', 'Creek', 'Swamp'],
      minAreaLevel: 1,
      baseDropTable: {
        possibleDrops: [BASE_DROP_ITEMS.common_slime, BASE_DROP_ITEMS.water_essence],
        baseBufos: 5,
        baseExperience: 10
      },
      healthScaling: 1.2,
      attackScaling: 1.1,
      defenseScaling: 1.05,
      speedScaling: 1.15
    },
    {
      baseId: 'mudCrawler',
      nameTemplate: 'Mud Crawler',
      baseMaxHealth: 35,
      baseAttack: 4,
      baseDefense: 3,
      baseSpeed: 2,
      possibleTypes: [EnemyType.Normal, EnemyType.Elite],
      typeWeights: [90, 10],
      colorTheme: '#8B4513',
      spriteRef: 'assets/images/enemies/mud_crawler.png',
      areas: ['Creek', 'Swamp', 'River'],
      minAreaLevel: 2,
      baseDropTable: {
        possibleDrops: [BASE_DROP_ITEMS.common_slime, BASE_DROP_ITEMS.thorn_spike],
        baseBufos: 10,
        baseExperience: 15
      },
      healthScaling: 1.25,
      attackScaling: 1.15,
      defenseScaling: 1.2,
      speedScaling: 1.05
    },
    {
      baseId: 'poisonDartFrog',
      nameTemplate: 'Poison Dart Frog',
      baseMaxHealth: 25,
      baseAttack: 8,
      baseDefense: 2,
      baseSpeed: 7,
      possibleTypes: [EnemyType.Normal, EnemyType.Elite, EnemyType.Boss],
      typeWeights: [85, 13, 2],
      colorTheme: '#FF4D4D',
      spriteRef: 'assets/images/enemies/poison_frog.png',
      areas: ['Swamp', 'River', 'Forest'],
      minAreaLevel: 3,
      baseDropTable: {
        possibleDrops: [
          BASE_DROP_ITEMS.frog_scale, 
          BASE_DROP_ITEMS.water_essence
        ],
        baseBufos: 25,
        baseExperience: 30
      },
      healthScaling: 1.2,
      attackScaling: 1.25,
      defenseScaling: 1.1,
      speedScaling: 1.2
    },
    {
      baseId: 'giantSnapper',
      nameTemplate: 'Giant Snapper',
      baseMaxHealth: 80,
      baseAttack: 12,
      baseDefense: 10,
      baseSpeed: 2,
      possibleTypes: [EnemyType.Normal, EnemyType.Elite, EnemyType.Boss],
      typeWeights: [80, 15, 5],
      colorTheme: '#006400',
      spriteRef: 'assets/images/enemies/giant_snapper.png',
      areas: ['River', 'Lake', 'Swamp'],
      minAreaLevel: 4,
      baseDropTable: {
        possibleDrops: [
          BASE_DROP_ITEMS.water_essence, 
          BASE_DROP_ITEMS.thorn_spike, 
          BASE_DROP_ITEMS.golden_egg
        ],
        baseBufos: 40,
        baseExperience: 50
      },
      healthScaling: 1.3,
      attackScaling: 1.2,
      defenseScaling: 1.3,
      speedScaling: 1.05
    },
    {
      baseId: 'forestStalker',
      nameTemplate: 'Forest Stalker',
      baseMaxHealth: 60,
      baseAttack: 15,
      baseDefense: 6,
      baseSpeed: 10,
      possibleTypes: [EnemyType.Normal, EnemyType.Elite, EnemyType.Boss],
      typeWeights: [75, 20, 5],
      colorTheme: '#3D7B3D',
      spriteRef: 'assets/images/enemies/forest_stalker.png',
      areas: ['Forest', 'Mountains'],
      minAreaLevel: 5,
      baseDropTable: {
        possibleDrops: [
          BASE_DROP_ITEMS.thorn_spike, 
          BASE_DROP_ITEMS.golden_egg
        ],
        baseBufos: 60,
        baseExperience: 80
      },
      healthScaling: 1.25,
      attackScaling: 1.3,
      defenseScaling: 1.15,
      speedScaling: 1.25
    },
    {
      baseId: 'darkDweller',
      nameTemplate: 'Dark Dweller',
      baseMaxHealth: 100,
      baseAttack: 20,
      baseDefense: 15,
      baseSpeed: 5,
      possibleTypes: [EnemyType.Elite, EnemyType.Boss],
      typeWeights: [80, 20],
      colorTheme: '#4B0082',
      spriteRef: 'assets/images/enemies/dark_dweller.png',
      areas: ['Mountains', 'Dungeon'],
      minAreaLevel: 7,
      baseDropTable: {
        possibleDrops: [
          BASE_DROP_ITEMS.frog_scale, 
          BASE_DROP_ITEMS.golden_egg
        ],
        baseBufos: 100,
        baseExperience: 120
      },
      healthScaling: 1.35,
      attackScaling: 1.35,
      defenseScaling: 1.3,
      speedScaling: 1.15
    }
  ];
  
  /**
   * Generate an enemy based on area and exploration distance
   * 
   * @param area The area being explored
   * @param distanceMultiplier How far into the area (affects difficulty)
   * @param areaLevel The level of the area
   * @returns A generated enemy
   */
  export function generateEnemy(
    area: string,
    distanceMultiplier: number,
    areaLevel: number
  ): Enemy {
    // Find templates that are valid for this area and level
    const validTemplates = INITIAL_ENEMY_TEMPLATES.filter(template => 
      template.areas.includes(area) && template.minAreaLevel <= areaLevel
    );
    
    if (validTemplates.length === 0) {
      // Fallback if no valid template
      throw new Error(`No valid enemy templates for area ${area} at level ${areaLevel}`);
    }
    
    // Select a random template from the valid ones
    const template = validTemplates[Math.floor(Math.random() * validTemplates.length)];
    
    // Determine enemy type (normal, elite, boss) based on template weights
    const typeIndex = selectWeightedRandom(template.typeWeights);
    const enemyType = template.possibleTypes[typeIndex];
    
    // Apply type multipliers for stats
    const typeMultipliers = getTypeMultipliers(enemyType);
    
    // Calculate effective area level (includes distance progression)
    const effectiveAreaLevel = areaLevel + (distanceMultiplier * 0.5);
    
    // Calculate scaled stats
    const maxHealth = calculateScaledStat(
      template.baseMaxHealth,
      effectiveAreaLevel,
      template.healthScaling,
      typeMultipliers.health
    );
    
    const attack = calculateScaledStat(
      template.baseAttack,
      effectiveAreaLevel,
      template.attackScaling,
      typeMultipliers.attack
    );
    
    const defense = calculateScaledStat(
      template.baseDefense,
      effectiveAreaLevel,
      template.defenseScaling,
      typeMultipliers.defense
    );
    
    const speed = calculateScaledStat(
      template.baseSpeed,
      effectiveAreaLevel,
      template.speedScaling,
      typeMultipliers.speed
    );
    
    // Generate a unique ID
    const id = `${template.baseId}_${area}_${Date.now()}`;
    
    // Modify name for elite/boss enemies
    let name = template.nameTemplate;
    if (enemyType === EnemyType.Elite) {
      name = `Elite ${name}`;
    } else if (enemyType === EnemyType.Boss) {
      name = `${name} Boss`;
    }
    
    // Calculate drop table with scaled rewards
    const dropTable = calculateDropTable(
      template.baseDropTable, 
      enemyType, 
      effectiveAreaLevel
    );
    
    // Create and return the enemy
    return {
      id,
      name,
      health: maxHealth,
      maxHealth,
      attack,
      defense,
      speed,
      type: enemyType,
      colorTheme: template.colorTheme,
      spriteRef: template.spriteRef,
      area,
      difficultyLevel: effectiveAreaLevel,
      dropTable
    };
  }
  
  /**
   * Calculate scaled stat value based on base stat, level, and scaling factors
   */
  function calculateScaledStat(
    baseStat: number, 
    level: number, 
    scalingFactor: number,
    typeMultiplier: number
  ): number {
    // Apply diminishing returns formula to prevent excessive scaling
    const scaledValue = baseStat * Math.pow(scalingFactor, Math.sqrt(level));
    
    // Apply type multiplier
    const finalValue = scaledValue * typeMultiplier;
    
    // Add some randomness (±10%)
    const randomFactor = 0.9 + (Math.random() * 0.2);
    
    // Return as integer
    return Math.round(finalValue * randomFactor);
  }
  
  /**
   * Calculate drop table with scaled rewards
   */
  function calculateDropTable(
    baseDropTable: DropTable,
    enemyType: EnemyType,
    effectiveLevel: number
  ): DropTable {
    // Scale bufo rewards based on level and enemy type
    const typeRewardMultipliers = {
      [EnemyType.Normal]: 1,
      [EnemyType.Elite]: 2.5,
      [EnemyType.Boss]: 5
    };
    
    const rewardMultiplier = typeRewardMultipliers[enemyType];
    
    const baseBufos = baseDropTable.baseBufos * Math.pow(1.1, effectiveLevel) * rewardMultiplier;  
    const baseExperience = baseDropTable.baseExperience * Math.pow(1.1, effectiveLevel) * rewardMultiplier;
    
    return {
      guaranteedDrops: baseDropTable.guaranteedDrops,
      possibleDrops: baseDropTable.possibleDrops,
      baseBufos: Math.round(baseBufos),
      baseExperience: Math.round(baseExperience)
    };
  }
  
  /**
   * Get multipliers for enemy stats based on type
   */
  function getTypeMultipliers(enemyType: EnemyType): {
    health: number;
    attack: number;
    defense: number;
    speed: number;
  } {
    switch (enemyType) {
      case EnemyType.Normal:
        return {
          health: 1,
          attack: 1,
          defense: 1,
          speed: 1
        };
      case EnemyType.Elite:
        return {
          health: 2.5,
          attack: 1.8,
          defense: 1.5,
          speed: 1.2
        };
      case EnemyType.Boss:
        return {
          health: 5,
          attack: 3,
          defense: 2.5,
          speed: 1.5
        };
      default:
        return {
          health: 1,
          attack: 1,
          defense: 1,
          speed: 1
        };
    }
  }
  
  /**
   * Select a random index based on weights
   */
  function selectWeightedRandom(weights: number[]): number {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomValue = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      randomValue -= weights[i];
      if (randomValue <= 0) {
        return i;
      }
    }
    
    // Fallback (shouldn't reach here if weights are positive)
    return 0;
  }
  
  /**
   * Helper function to calculate rewards from defeating an enemy
   */
  export function calculateEnemyRewards(enemy: Enemy): {
    bufos: number;
    experience: number;
    drops: string[];
  } {
    // Calculate bufo reward with some randomness (±20%)
    const bufosVariation = 0.8 + (Math.random() * 0.4);
    const bufos = Math.max(1, Math.round(enemy.dropTable.baseBufos * bufosVariation));
    
    // Calculate experience reward with some randomness (±20%)
    const expVariation = 0.8 + (Math.random() * 0.4);
    const experience = Math.max(1, Math.round(enemy.dropTable.baseExperience * expVariation));
    
    // Calculate drops
    const drops: string[] = [];
    
    // Add guaranteed drops
    if (enemy.dropTable.guaranteedDrops) {
      drops.push(...enemy.dropTable.guaranteedDrops);
    }
    
    // Calculate random drops
    enemy.dropTable.possibleDrops.forEach(drop => {
      if (Math.random() < drop.dropRate) {
        drops.push(drop.id);
      }
    });
    
    return {
      bufos,
      experience,
      drops
    };
  }
  
  /**
   * Determine if an enemy is stronger than the explorer
   * Returns a number indicating difficulty:
   * < 0.5: Easy enemy
   * 0.5-1.0: Balanced enemy
   * > 1.0: Difficult enemy
   */
  export function calculateRelativeDifficulty(
    enemyStats: { attack: number, defense: number, health: number, speed: number },
    explorerStats: { attack: number, defense: number, health: number, speed: number }
  ): number {
    // Calculate enemy power rating
    const enemyPower = (enemyStats.attack * 1.5) + 
                      (enemyStats.defense * 1.0) + 
                      (enemyStats.health * 0.2) + 
                      (enemyStats.speed * 0.8);
    
    // Calculate explorer power rating
    const explorerPower = (explorerStats.attack * 1.5) + 
                          (explorerStats.defense * 1.0) + 
                          (explorerStats.health * 0.2) + 
                          (explorerStats.speed * 0.8);
    
    // Return difficulty rating
    return enemyPower / explorerPower;
  }