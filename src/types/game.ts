/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'WAVE_CLEAR' | 'GAME_OVER';

export type ControlScheme = 'CLASSIC' | 'DIRECT' | 'JOYSTICK';

export type AsteroidSize = 'large' | 'medium' | 'small';

export type PowerUpType = 'shield' | 'spread' | 'rapid' | 'nuke' | 'life';

export interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number; // in radians
  radius: number;
  thrust: boolean;
  reverse: boolean;
  rotLeft: boolean;
  rotRight: boolean;
  firing: boolean;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  invulnerableTime: number; // countdown in seconds
  spreadShotTime: number;
  rapidFireTime: number;
  hasNuke: boolean;
  joystickVector?: { x: number; y: number; intensity: number; angle: number };
}

export interface AsteroidVertex {
  angle: number;
  distance: number; // relative factor 0.7 - 1.3
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  sizeTier: AsteroidSize;
  points: number;
  rotation: number;
  rotSpeed: number;
  vertices: AsteroidVertex[];
  color: string;
  craterSpots: { x: number; y: number; r: number }[];
  health: number;
  maxHealth: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  lifespan: number; // in seconds
  maxLifespan: number;
  damage: number;
  isPlayer: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'spark' | 'smoke' | 'rock' | 'ring' | 'glow';
  rotation?: number;
  rotSpeed?: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerUpType;
  lifespan: number;
  radius: number;
  bobPhase: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  size: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  flickerSpeed: number;
  color: string;
  layer: number; // 1 (far), 2 (mid), 3 (near)
}

export interface GameStats {
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  asteroidsDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  timeSurvived: number; // in seconds
}

export interface WaveConfig {
  waveNumber: number;
  asteroidCount: number;
  minSpeed: number;
  maxSpeed: number;
  allowPowerUps: boolean;
}
