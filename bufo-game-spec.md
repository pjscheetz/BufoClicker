# Bufo Clicker - Technical Specification

## Overview
Bufo Clicker is an incremental clicker game with a fun, goofy theme centered around bufos (toads) and bufo-related puns. The game follows a similar UI structure to Cookie Clicker with unique gameplay mechanics including a mini-RPG system. The project will be built to be hosted in a GitHub Pages environment and designed with modularity in mind to allow for easy expansion.

## Core Concept
Players click on a cartoon-style bufo (toad) to accumulate the primary resource: bufos. These bufos can be spent on generators that automatically produce more bufos, upgrades that enhance production, and to power a mini-RPG game system that unlocks after certain progression milestones.

## Technology Stack
- **Language**: TypeScript
- **Framework**: Vanilla TypeScript (no framework)
- **State Management**: Simple state object pattern
- **Deployment**: GitHub Pages
- **Save System**: Both automatic and manual saving to local storage
- **Platform**: Desktop browsers only (initial version)

## Game Elements

### 1. Primary Resource
- **Name**: Bufos
- **Acquisition**: Clicking on the main bufo image and through automatic generators

### 2. Main Interaction
- Cartoon toad visual asset (already created)
- Animation: Slight size decrease on click
- Visual feedback: Numbers float up showing earned bufos

### 3. Generator Tiers
1. Tadpole
2. Froglet
3. Bufo
4. Giant Bufo
5. Bufo Factory
6. Bufo Magnus
7. Hypnobufo
8. Bufo Buddy
9. Croaksmith
10. Bufologist
11. Bufopolis
12. Toadally Awesome
13. Bufoverse
14. Ribbiting Returns
15. Amphibi-Corp

### 4. Upgrade System
- **Generator-specific multipliers**: Enhance individual generator types
- **Global multipliers**: Boost all bufo production
- **Special abilities**: Unique bonuses and effects
- **Pricing model**: Exponential cost scaling

### 5. Prestige System
- **Name**: Transcendence Bufoplier
- **Mechanic**: Soft reset with permanent multiplier to future bufo production
- **Trigger**: Player choice after reaching certain thresholds

### 6. Special Events
- **Golden Bufos**:
  - Appear randomly for a short duration
  - Must be clicked to receive rewards
  - Reward types:
    - Bonus bufos (instant resource gain)
    - Resource multipliers (temporary boost to generator production)
    - Click multipliers (temporary boost to manual clicking)

### 7. Mini-Game System: Bufo RPG
- **Unlock condition**: Purchase of a specific upgrade
- **Gameplay**: Turn-based combat
- **Player character**: Special bufo character with upgradeable stats
- **Character stats**: Health and Attack
- **Enemies**: Various emoji characters
- **Investment mechanic**: Spend bufos to increase character strength
- **Rewards**:
  - Regular enemies: Bonus bufos on defeat
  - Boss enemies: Multipliers on first-time defeat
  - Drops: Collectible items from defeated enemies

### 8. Save System
- **Automatic saving**: At regular intervals
- **Manual saving**: Via button in the UI
- **Storage**: Local browser storage only
- **Offline progression**: None (requires active gameplay)

### 9. User Interface
- **Layout**: Three-column design similar to Cookie Clicker
  - Left column: Main bufo click area with forest background
  - Middle column: Purchased upgrades in a scrollable tab
  - Right column: Shop and RPG section in a scrollable tab
  - Top middle: Primary menu buttons
- **Theme**: Forest/nature environment for the bufo
- **Sound design**: None in initial version

### 10. Achievements System
- Achievements for collecting upgrades
- Achievements for RPG progression
- Milestone achievements for bufo accumulation

## Development Phases

### Phase 1: MVP (Minimum Viable Product)
- Initial layout design and structure
- Core clicking functionality
- Basic state management
- Simple generator implementation (first 3 tiers)
- Save/load functionality

### Phase 2: Core Game Expansion
- Complete implementation of all generator tiers
- Basic upgrade system
- UI refinements
- Achievement system foundation
- Prestige system (Transcendence Bufoplier)

### Phase 3: Special Features
- Golden Bufos implementation
- Additional upgrades
- Full achievement system
- Game balancing

### Phase 4: RPG Mini-Game
- RPG combat system implementation
- Character progression
- Enemy variety
- Reward integration with main game

### Phase 5: Polish and Optimization
- Performance optimizations
- UI polish
- Game balance refinements
- Bug fixes

## Technical Implementation Details

### State Management
The game will use a simple state object to track:
```typescript
interface GameState {
  bufos: number;
  totalBufos: number;
  clickPower: number;
  generators: Record<GeneratorType, GeneratorData>;
  upgrades: Record<UpgradeId, boolean>;
  achievements: Record<AchievementId, boolean>;
  multipliers: {
    global: number;
    click: number;
    generatorSpecific: Record<GeneratorType, number>;
    temporary: TemporaryMultiplier[];
  };
  rpg: {
    unlocked: boolean;
    character: {
      health: number;
      maxHealth: number;
      attack: number;
    };
    inventory: Item[];
    defeatedBosses: Record<BossId, boolean>;
  };
  settings: {
    autosaveInterval: number;
  };
  lastSaved: number;
}
```

### Game Loop
The game will use `requestAnimationFrame` for the main loop, with:
- UI updates at 60fps
- Game logic ticks at a fixed interval (e.g., 10 times per second)
- Generator production calculated based on elapsed time

### Save System
- JSON serialization of the game state
- Local storage for persistence
- Auto-save every minute and manual save option
- Save compression for larger game states

### Game Balance
- Exponential cost scaling for generators and upgrades
- Production values balanced to create meaningful choices
- Prestige system tuned to encourage multiple playthroughs

## User Milestones and Progression
- Unlocking each new generator tier
- Reaching bufo thresholds (e.g., 1,000, 1,000,000, etc.)
- Unlocking the RPG mini-game
- Defeating boss enemies
- Earning achievements
- First prestige (Transcendence)

## Future Expansion Possibilities
- Additional generator tiers
- Expanded RPG system with more enemy types and equipment
- Seasonal events
- Additional mini-games
- Special challenges
- Expanded achievement system
- Cross-session challenges or competitions
