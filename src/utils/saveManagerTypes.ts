import { GameState } from '../core/types';
import { GeneratorType, GeneratorData } from '../models/generators';
import { ExplorerData } from '../models/explorer';

/**
 * Interface for complete game save data
 */
export interface SaveData {
  /** Game state */
  state: GameState;
  /** Generators */
  generators: Record<GeneratorType, GeneratorData>;
  /** Purchased upgrade IDs */
  upgrades?: string[];
  /** Explorer data */
  explorer?: ExplorerData;
  /** Save version */
  saveVersion: number;
  /** Timestamp when save was created */
  timestamp: number;
}