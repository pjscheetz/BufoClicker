import { getGameCore } from './gameCore';
import * as Logger from '../utils/logger';
import { getEventBus } from '../core/eventBus';
import { GAME_TICK } from '../core/eventTypes';

/**
 * GameLoop class
 * Handles the game tick using requestAnimationFrame
 * Calculates delta time between frames
 * Controls the flow of time in the game
 */
export class GameLoop {
  private static instance: GameLoop;
  
  /** Frame request ID for requestAnimationFrame */
  private frameId: number | null = null;
  /** Last frame timestamp */
  private lastFrameTime: number = 0;
  /** Is the loop running */
  private isRunning: boolean = false;
  /** Time scale (1.0 = normal speed) */
  private timeScale: number = 1.0;
  /** Target framerate for ticks */
  private targetFPS: number = 60;
  /** Minimum time between ticks in ms */
  private minTickDelta: number = 1000 / 60; // 60 FPS max
  /** Accumulated time overflow from previous frame */
  private accumulatedTime: number = 0;
  /** Maximum accumulated time to prevent spiral of death */
  private readonly MAX_ACCUMULATED_TIME: number = 1000; // 1 second
  /** Time since last tick emission */
  private timeSinceLastTick: number = 0;
  /** Tick emit interval in ms */
  private tickEmitInterval: number = 100; // 10 ticks per second for UI updates

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): GameLoop {
    if (!GameLoop.instance) {
      GameLoop.instance = new GameLoop();
    }
    return GameLoop.instance;
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.accumulatedTime = 0;
    
    // Start the animation frame loop
    this.frameId = requestAnimationFrame(this.gameLoop.bind(this));
    
    Logger.log('Game loop started');
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Cancel the animation frame
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    Logger.log('Game loop stopped');
  }

  /**
   * Set the time scale
   * @param scale Time scale factor (1.0 = normal speed)
   */
  public setTimeScale(scale: number): void {
    // Clamp time scale between 0.1 and 5.0
    this.timeScale = Math.max(0.1, Math.min(5.0, scale));
    Logger.log(`Time scale set to ${this.timeScale}`);
  }

  /**
   * Get the current time scale
   */
  public getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Set the target frames per second
   * @param fps Target frames per second
   */
  public setTargetFPS(fps: number): void {
    // Clamp FPS between 10 and 144
    this.targetFPS = Math.max(10, Math.min(144, fps));
    this.minTickDelta = 1000 / this.targetFPS;
    Logger.log(`Target FPS set to ${this.targetFPS}`);
  }

  /**
   * The main game loop function
   * Called every animation frame
   */
  private gameLoop(timestamp: number): void {
    if (!this.isRunning) return;
    
    // Calculate delta time in milliseconds
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Add to accumulated time
    this.accumulatedTime += deltaTime * this.timeScale;
    
    // Cap accumulated time to prevent spiral of death
    if (this.accumulatedTime > this.MAX_ACCUMULATED_TIME) {
      Logger.warn(`Accumulated time capped from ${this.accumulatedTime}ms to ${this.MAX_ACCUMULATED_TIME}ms`);
      this.accumulatedTime = this.MAX_ACCUMULATED_TIME;
    }
    
    // Process as many fixed time steps as needed
    while (this.accumulatedTime >= this.minTickDelta) {
      // Process a single game tick with fixed time step
      this.processTick(this.minTickDelta / 1000); // Convert to seconds
      
      // Subtract processed time from accumulator
      this.accumulatedTime -= this.minTickDelta;
    }
    
    // Update the tick emission counter
    this.timeSinceLastTick += deltaTime;
    
    // Emit tick event at a lower frequency for UI updates
    if (this.timeSinceLastTick >= this.tickEmitInterval) {
      getEventBus().emit(GAME_TICK, {
        deltaTime: this.timeSinceLastTick,
        timeScale: this.timeScale
      });
      this.timeSinceLastTick = 0;
    }
    
    // Continue the loop
    this.frameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Process a single game tick
   * @param deltaSeconds Time step in seconds
   */
  private processTick(deltaSeconds: number): void {
    try {
      // Get the game core instance
      const gameCore = getGameCore();
      
      // Process the game tick
      gameCore.processTick(deltaSeconds);
    } catch (error) {
      Logger.error('Error processing game tick:', error);
    }
  }
}

/**
 * Get the singleton GameLoop instance
 */
export function getGameLoop(): GameLoop {
  return GameLoop.getInstance();
}