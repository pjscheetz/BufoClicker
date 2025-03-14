import { ExplorerData } from './explorer';
import { Enemy, calculateEnemyRewards } from './enemies';

/**
 * Combat status enum
 */
export enum CombatStatus {
  InProgress = 'inProgress',
  Victory = 'victory',
  Defeat = 'defeat'
}

/**
 * Combat action types
 */
export enum CombatActionType {
  Attack = 'attack',
  Defend = 'defend',
  Flee = 'flee'
}

/**
 * Represents the state of a combat encounter
 */
export interface CombatState {
  /** The explorer data */
  explorer: ExplorerData;
  /** The enemy being fought */
  enemy: Enemy;
  /** Current status of the combat */
  status: CombatStatus;
  /** Current round number */
  round: number;
  /** Log of combat actions */
  combatLog: string[];
  /** Time the combat started */
  startTime: number;
  /** Time of the last action */
  lastActionTime: number;
}

/**
 * Result of a combat action
 */
export interface CombatActionResult {
  /** Updated combat state */
  newState: CombatState;
  /** Damage dealt to enemy */
  damageToEnemy: number;
  /** Damage dealt to explorer */
  damageToExplorer: number;
  /** Message describing the action result */
  actionMessage: string;
  /** Rewards if combat ended in victory */
  rewards?: {
    bufos: number;
    experience: number;
    drops: string[];
  };
}

/**
 * Initialize a combat encounter between explorer and enemy
 */
export function initializeCombat(explorer: ExplorerData, enemy: Enemy): CombatState {
  return {
    explorer,
    enemy,
    status: CombatStatus.InProgress,
    round: 1,
    combatLog: [`${explorer.name} encounters ${enemy.name}!`],
    startTime: Date.now(),
    lastActionTime: Date.now()
  };
}

/**
 * Execute a combat action
 */
export function executeCombatAction(
  state: CombatState,
  action: CombatActionType
): CombatActionResult {
  const { explorer, enemy, round } = state;
  
  // Create a deep copy of the state to avoid mutating the original
  const newState: CombatState = {
    ...state,
    explorer: { ...explorer },
    enemy: { ...enemy },
    round: round + 1,
    lastActionTime: Date.now()
  };
  
  let damageToEnemy = 0;
  let damageToExplorer = 0;
  let actionMessage = '';
  
  switch (action) {
    case CombatActionType.Attack:
      // Calculate explorer's damage to enemy
      damageToEnemy = calculateDamage(
        explorer.attack.value * explorer.attack.multiplier,
        enemy.defense,
        0.8, 1.2  // Random factor between 0.8 and 1.2
      );
      
      // Update enemy health
      newState.enemy.health = Math.max(0, enemy.health - damageToEnemy);
      
      actionMessage = `${explorer.name} attacks ${enemy.name} for ${damageToEnemy} damage!`;
      newState.combatLog.push(actionMessage);
      
      // Check if enemy is defeated
      if (newState.enemy.health <= 0) {
        newState.status = CombatStatus.Victory;
        newState.combatLog.push(`${enemy.name} is defeated!`);
        
        // Calculate rewards
        const rewards = calculateEnemyRewards(enemy);
        newState.combatLog.push(`Gained ${rewards.bufos} bufos and ${rewards.experience} experience!`);
        
        if (rewards.drops.length > 0) {
          newState.combatLog.push(`Found items: ${rewards.drops.join(', ')}!`);
        }
        
        return {
          newState,
          damageToEnemy,
          damageToExplorer: 0,
          actionMessage,
          rewards
        };
      }
      
      // Enemy counterattack
      damageToExplorer = calculateEnemyAttack(newState);
      break;
      
    case CombatActionType.Defend:
      // Reduced damage from enemy when defending (50% reduction)
      damageToExplorer = calculateEnemyAttack(newState, 0.5);
      
      actionMessage = `${explorer.name} defends against ${enemy.name}'s attack!`;
      newState.combatLog.push(actionMessage);
      break;
      
    case CombatActionType.Flee:
      // Calculate escape chance based on speed difference
      const explorerSpeed = explorer.speed.value * explorer.speed.multiplier;
      const escapeChance = Math.min(0.75, 0.5 + ((explorerSpeed - enemy.speed) / 20));
      
      if (Math.random() < escapeChance) {
        // Successful escape
        actionMessage = `${explorer.name} successfully fled from the battle!`;
        newState.combatLog.push(actionMessage);
        newState.status = CombatStatus.Defeat; // Using Defeat status for fleeing
        
        return {
          newState,
          damageToEnemy: 0,
          damageToExplorer: 0,
          actionMessage
        };
      } else {
        // Failed escape, enemy gets free attack
        actionMessage = `${explorer.name} failed to escape!`;
        newState.combatLog.push(actionMessage);
        
        // Enemy gets a free attack with a slight damage bonus
        damageToExplorer = calculateEnemyAttack(newState, 1.2);
      }
      break;
  }
  
  // Check if explorer is defeated
  if (newState.explorer.health <= 0) {
    newState.status = CombatStatus.Defeat;
    newState.combatLog.push(`${explorer.name} has been defeated!`);
  }
  
  return {
    newState,
    damageToEnemy,
    damageToExplorer,
    actionMessage
  };
}

/**
 * Calculate damage dealt by an attack
 */
function calculateDamage(
  attackStat: number,
  defenseStat: number,
  minRandomFactor: number = 0.9,
  maxRandomFactor: number = 1.1
): number {
  // Base formula: attack - defense with minimum 1 damage
  const baseDamage = Math.max(1, attackStat - (defenseStat * 0.5));
  
  // Apply random factor
  const randomFactor = minRandomFactor + Math.random() * (maxRandomFactor - minRandomFactor);
  
  // Return as integer
  return Math.round(baseDamage * randomFactor);
}

/**
 * Calculate enemy's attack damage to explorer
 */
function calculateEnemyAttack(state: CombatState, damageMultiplier: number = 1): number {
  const { explorer, enemy } = state;
  
  // Calculate damage
  const damage = calculateDamage(
    enemy.attack * damageMultiplier,
    explorer.defense.value * explorer.defense.multiplier
  );
  
  // Apply damage to explorer
  explorer.health = Math.max(0, explorer.health - damage);
  
  // Add to combat log
  state.combatLog.push(`${enemy.name} attacks ${explorer.name} for ${damage} damage!`);
  
  return damage;
}

/**
 * Auto-combat simulation for simplified exploration
 * Simulates a combat encounter without requiring player input
 */
export function simulateCombat(
  explorer: ExplorerData,
  enemy: Enemy,
  simulationRounds: number = 10
): {
  victory: boolean;
  explorerRemainingHealth: number;
  experienceGained: number;
  bufosGained: number;
  itemsFound: string[];
  rounds: number;
} {
  // Create a copy of explorer to avoid modifying original
  const explorerCopy: ExplorerData = JSON.parse(JSON.stringify(explorer));
  
  // Create a copy of enemy to avoid modifying original
  const enemyCopy: Enemy = JSON.parse(JSON.stringify(enemy));
  
  let round = 0;
  
  // Simulate combat
  while (round < simulationRounds && explorerCopy.health > 0 && enemyCopy.health > 0) {
    round++;
    
    // Explorer's turn
    const explorerDamage = calculateDamage(
      explorerCopy.attack.value * explorerCopy.attack.multiplier,
      enemyCopy.defense
    );
    
    enemyCopy.health = Math.max(0, enemyCopy.health - explorerDamage);
    
    // Check if enemy is defeated
    if (enemyCopy.health <= 0) {
      break;
    }
    
    // Enemy's turn
    const enemyDamage = calculateDamage(
      enemyCopy.attack,
      explorerCopy.defense.value * explorerCopy.defense.multiplier
    );
    
    explorerCopy.health = Math.max(0, explorerCopy.health - enemyDamage);
  }
  
  // Determine outcome
  const victory = enemyCopy.health <= 0;
  
  // Calculate rewards if victorious
  let experienceGained = 0;
  let bufosGained = 0;
  let itemsFound: string[] = [];
  
  if (victory) {
    const rewards = calculateEnemyRewards(enemy);
    experienceGained = rewards.experience;
    bufosGained = rewards.bufos;
    itemsFound = rewards.drops;
  }
  
  return {
    victory,
    explorerRemainingHealth: explorerCopy.health,
    experienceGained,
    bufosGained,
    itemsFound,
    rounds: round
  };
}