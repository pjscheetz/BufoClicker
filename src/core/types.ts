import { GeneratorData, GeneratorType } from '../models/generators';
import { ExplorerData } from '../models/explorer';

export interface Resources {
  bufos: number;
  totalBufos: number;
  clickPower: number;
  baseClickPower: number;
  clickMultiplier: number;  // Dedicated multiplier for clicks
  productionMultiplier: number;  // For generators only
  clickCount?: number;  // Track total clicks in game state
}

export interface GameSettings {
  lastSaved: number;
  lastTick: number;
  autoSave: boolean;
  version: string;
  firstStartTime?: number; // Track when game was first started for play time calculation
}

export interface UpgradeState {
  purchased: string[];
  available: string[];
}

// New interface for achievement state
export interface AchievementState {
  unlocked: string[];
  progress: Record<string, number>;
  clickCount: number;
  customEvents: Record<string, boolean>;
}

export interface GameState {
  resources: Resources;
  generators: Record<GeneratorType, GeneratorData>;
  explorer: ExplorerData;
  upgrades: UpgradeState;
  gameSettings: GameSettings;
  achievements: AchievementState; // Add achievements to GameState
}

export type StateChangeListener = (newState: GameState, oldState: GameState) => void;

export type PartialGameState = Partial<{
  resources: Partial<Resources>;
  generators: Partial<Record<GeneratorType, Partial<GeneratorData>>>;
  explorer: Partial<ExplorerData>;
  upgrades: Partial<UpgradeState>;
  gameSettings: Partial<GameSettings>;
  achievements: Partial<AchievementState>; // Add to PartialGameState too
}>;