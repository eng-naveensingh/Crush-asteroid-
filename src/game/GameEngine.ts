/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Asteroid,
  AsteroidSize,
  AsteroidVertex,
  Bullet,
  ControlScheme,
  FloatingText,
  GameState,
  Particle,
  PowerUp,
  PowerUpType,
  Ship,
  Star,
  EnemyBot,
  ShipModelId,
  WeaponType,
} from '../types/game';
import { SHIP_PRESETS } from '../types/ships';
import { WEAPON_PRESETS } from '../types/weapons';
import { soundManager } from '../audio/SoundEffects';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Game state
  public state: GameState = 'MENU';
  public controlScheme: ControlScheme = 'CLASSIC';

  // State change callbacks for React UI sync
  public onStateChange?: (state: GameState) => void;
  public onScoreChange?: (score: number, highScore: number) => void;
  public onWaveChange?: (wave: number) => void;
  public onLivesChange?: (lives: number) => void;
  public onHealthChange?: (health: number, shield: number) => void;
  public onComboChange?: (combo: number) => void;
  public onWaveCleared?: (wave: number, scoreBonus: number) => void;
  public onWeaponChange?: (weapon: WeaponType) => void;

  // Stats
  public score: number = 0;
  public highScore: number = 0;
  public wave: number = 1;
  public lives: number = 3;
  public asteroidsDestroyed: number = 0;
  public shotsFired: number = 0;
  public shotsHit: number = 0;
  public gameStartTime: number = 0;
  public combo: number = 0;
  public comboTimer: number = 0;

  public selectedShipModel: ShipModelId = 'interceptor';
  public selectedWeapon: WeaponType = 'blaster';

  // Entities
  private ship: Ship;
  private asteroids: Asteroid[] = [];
  private enemyBots: EnemyBot[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  private floatingTexts: FloatingText[] = [];
  private stars: Star[] = [];

  // Firing rate control
  private lastShotTime: number = 0;
  private baseFireCooldown: number = 0.15;

  // Input states
  public keys: Record<string, boolean> = {};
  public joystickVector: { x: number; y: number; intensity: number; angle: number } | null = null;
  public touchControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    nuke: false,
  };

  public setJoystick(x: number, y: number, intensity: number, angle: number) {
    if (intensity <= 0.05) {
      this.joystickVector = null;
    } else {
      this.joystickVector = { x, y, intensity: Math.min(1, intensity), angle };
    }
  }

  // Wave transition tracking
  private waveClearDelay: number = 0;
  private waveTotalAsteroids: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.ship = this.createDefaultShip();
    this.loadHighScore();
    this.initStars();
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem('crush_asteroid_highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      // ignore
    }
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('crush_asteroid_highscore', String(this.highScore));
      } catch {
        // ignore
      }
    }
  }

  public setControlScheme(scheme: ControlScheme) {
    this.controlScheme = scheme;
  }

  public setShipModel(modelId: ShipModelId) {
    this.selectedShipModel = modelId;
    const cfg = SHIP_PRESETS[modelId] || SHIP_PRESETS.interceptor;
    this.baseFireCooldown = cfg.baseFireCooldown;
    if (this.ship) {
      this.ship.modelId = modelId;
      this.ship.maxShield = cfg.maxShield;
      this.ship.maxHealth = cfg.maxHealth;
      this.ship.shield = Math.min(this.ship.shield, cfg.maxShield);
      this.ship.health = Math.min(this.ship.health, cfg.maxHealth);
    }
  }

  public setWeapon(weapon: WeaponType) {
    this.selectedWeapon = weapon;
    this.onWeaponChange?.(weapon);
    const wep = WEAPON_PRESETS[weapon];
    this.addFloatingText(this.ship.x, this.ship.y - 25, wep.shortName, wep.color, 16);
  }

  public cycleWeapon() {
    const list: WeaponType[] = ['blaster', 'machinegun', 'laserlauncher', 'plasma'];
    const curIdx = list.indexOf(this.selectedWeapon);
    const nextIdx = (curIdx + 1) % list.length;
    this.setWeapon(list[nextIdx]);
  }

  private createDefaultShip(): Ship {
    const cfg = SHIP_PRESETS[this.selectedShipModel] || SHIP_PRESETS.interceptor;
    this.baseFireCooldown = cfg.baseFireCooldown;
    return {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      vx: 0,
      vy: 0,
      rotation: -Math.PI / 2, // point upwards
      radius: 18,
      thrust: false,
      reverse: false,
      rotLeft: false,
      rotRight: false,
      firing: false,
      health: cfg.maxHealth,
      maxHealth: cfg.maxHealth,
      shield: cfg.maxShield,
      maxShield: cfg.maxShield,
      invulnerableTime: 3.0,
      spreadShotTime: 0,
      rapidFireTime: 0,
      hasNuke: false,
      modelId: this.selectedShipModel,
    };
  }

  private initStars() {
    this.stars = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 3800);
    const colors = ['#ffffff', '#93c5fd', '#fef08a', '#e9d5ff', '#67e8f9'];

    for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: layer === 1 ? Math.random() * 1.2 + 0.5 : layer === 2 ? Math.random() * 1.6 + 1 : Math.random() * 2.2 + 1.5,
        alpha: Math.random() * 0.7 + 0.3,
        flickerSpeed: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        layer,
      });
    }
  }

  public resize(width: number, height: number) {
    const prevW = this.canvas.width;
    const prevH = this.canvas.height;
    this.canvas.width = width;
    this.canvas.height = height;

    if (prevW > 0 && prevH > 0) {
      // Reposition ship proportionally
      this.ship.x = (this.ship.x / prevW) * width;
      this.ship.y = (this.ship.y / prevH) * height;
    } else {
      this.ship.x = width / 2;
      this.ship.y = height / 2;
    }

    this.clampShipToBounds();
    this.initStars();
  }

  // --- START / RESTART / PAUSE ---

  public startGame() {
    soundManager.userInteraction();
    this.score = 0;
    this.wave = 1;
    this.lives = 3;
    this.asteroidsDestroyed = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.gameStartTime = performance.now();
    this.combo = 0;
    this.comboTimer = 0;

    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.floatingTexts = [];
    this.enemyBots = [];

    this.ship = this.createDefaultShip();
    this.ship.x = this.canvas.width / 2;
    this.ship.y = this.canvas.height / 2;

    this.setState('PLAYING');
    this.spawnWave(this.wave);

    this.emitUIUpdates();
    if (!this.animationFrameId) {
      this.lastTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  public nextWave() {
    this.wave++;
    this.spawnWave(this.wave);
    this.setState('PLAYING');
    this.emitUIUpdates();
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      soundManager.stopThrust();
      this.setState('PAUSED');
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      soundManager.userInteraction();
      this.setState('PLAYING');
      this.lastTime = performance.now();
    }
  }

  public returnToMenu() {
    soundManager.stopThrust();
    this.setState('MENU');
  }

  private setState(newState: GameState) {
    this.state = newState;
    this.onStateChange?.(newState);
  }

  private emitUIUpdates() {
    this.onScoreChange?.(this.score, this.highScore);
    this.onWaveChange?.(this.wave);
    this.onLivesChange?.(this.lives);
    this.onHealthChange?.(this.ship.health, this.ship.shield);
    this.onComboChange?.(this.combo);
  }

  // --- SPAWNING ---

  private spawnWave(waveNum: number) {
    this.asteroids = [];
    this.enemyBots = [];

    // Progressive asteroid counts
    // Wave 1: 4 large asteroids
    // Wave 2: 5 large + 1 medium
    // Wave 3+: scale with wave
    const largeCount = 3 + waveNum;
    const speedMult = Math.min(1 + waveNum * 0.12, 2.6);

    for (let i = 0; i < largeCount; i++) {
      this.spawnAsteroid('large', undefined, undefined, speedMult);
    }

    if (waveNum >= 3) {
      const extraMed = Math.floor(waveNum / 2);
      for (let i = 0; i < extraMed; i++) {
        this.spawnAsteroid('medium', undefined, undefined, speedMult);
      }
    }

    // Spawn Enemy Bot ships!
    // Wave 1: 1 scout drone
    // Wave 2: 2 scouts
    // Wave 3: 1 interceptor + 1 scout
    // Wave 4+: mix of interceptors, cruisers, and scouts
    if (waveNum === 1) {
      this.spawnEnemyBot('scout');
    } else if (waveNum === 2) {
      this.spawnEnemyBot('scout');
      this.spawnEnemyBot('scout');
    } else if (waveNum === 3) {
      this.spawnEnemyBot('interceptor');
      this.spawnEnemyBot('scout');
    } else {
      const botCount = Math.min(2 + Math.floor(waveNum / 2), 6);
      for (let b = 0; b < botCount; b++) {
        const type = b === 0 && waveNum >= 4 ? 'cruiser' : b % 2 === 0 ? 'interceptor' : 'scout';
        this.spawnEnemyBot(type);
      }
    }

    this.waveTotalAsteroids = this.asteroids.length;
    this.addFloatingText(this.canvas.width / 2, this.canvas.height / 3, `WAVE ${waveNum}`, '#38bdf8', 36);
    if (this.enemyBots.length > 0) {
      soundManager.playEnemyAlarm();
      this.addFloatingText(this.canvas.width / 2, this.canvas.height / 3 + 45, `HOSTILE DRONES DETECTED!`, '#ef4444', 20);
    }
  }

  private spawnEnemyBot(type: 'scout' | 'interceptor' | 'cruiser') {
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    const pad = 35;

    switch (edge) {
      case 0: // top
        x = Math.random() * this.canvas.width;
        y = -pad;
        break;
      case 1: // right
        x = this.canvas.width + pad;
        y = Math.random() * this.canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + pad;
        break;
      case 3: // left
        x = -pad;
        y = Math.random() * this.canvas.height;
        break;
    }

    let radius = 16;
    let health = 40;
    let shield = 20;
    let speed = 120;
    let fireCooldown = 2.2;
    let points = 250;
    let color = '#ef4444';
    let accentColor = '#991b1b';
    let glowColor = 'rgba(239, 68, 68, 0.4)';

    if (type === 'interceptor') {
      radius = 18;
      health = 60;
      shield = 40;
      speed = 170;
      fireCooldown = 1.5;
      points = 450;
      color = '#f97316';
      accentColor = '#c2410c';
      glowColor = 'rgba(249, 115, 22, 0.4)';
    } else if (type === 'cruiser') {
      radius = 26;
      health = 130;
      shield = 80;
      speed = 85;
      fireCooldown = 1.8;
      points = 800;
      color = '#ec4899';
      accentColor = '#be185d';
      glowColor = 'rgba(236, 72, 153, 0.45)';
    }

    this.enemyBots.push({
      id: Math.random().toString(36).substring(2, 9),
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      rotation: Math.random() * Math.PI * 2,
      radius,
      health,
      maxHealth: health,
      shield,
      maxShield: shield,
      color,
      accentColor,
      glowColor,
      speed,
      fireCooldown,
      lastShotTime: performance.now() / 1000 + Math.random() * 1.5,
      targetAngle: 0,
      aiTimer: Math.random() * 0.8,
      points,
    });
  }

  private spawnAsteroid(
    sizeTier: AsteroidSize,
    x?: number,
    y?: number,
    speedMult: number = 1
  ): Asteroid {
    let radius: number;
    let points: number;
    let hp: number;

    switch (sizeTier) {
      case 'large':
        radius = Math.random() * 12 + 44; // 44 - 56
        points = 100;
        hp = 3;
        break;
      case 'medium':
        radius = Math.random() * 8 + 24; // 24 - 32
        points = 60;
        hp = 2;
        break;
      case 'small':
        radius = Math.random() * 6 + 14; // 14 - 20
        points = 30;
        hp = 1;
        break;
    }

    // If position not supplied, spawn at random screen edge safely away from ship
    let posX = x ?? 0;
    let posY = y ?? 0;

    if (x === undefined || y === undefined) {
      const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      const offset = radius + 10;
      switch (edge) {
        case 0:
          posX = Math.random() * this.canvas.width;
          posY = -offset;
          break;
        case 1:
          posX = this.canvas.width + offset;
          posY = Math.random() * this.canvas.height;
          break;
        case 2:
          posX = Math.random() * this.canvas.width;
          posY = this.canvas.height + offset;
          break;
        case 3:
          posX = -offset;
          posY = Math.random() * this.canvas.height;
          break;
      }
    }

    // Velocity towards general screen area or random direction
    let angle: number;
    if (x === undefined || y === undefined) {
      const targetX = this.canvas.width * (0.2 + Math.random() * 0.6);
      const targetY = this.canvas.height * (0.2 + Math.random() * 0.6);
      angle = Math.atan2(targetY - posY, targetX - posX) + (Math.random() - 0.5) * 0.6;
    } else {
      angle = Math.random() * Math.PI * 2;
    }

    const baseSpeed = sizeTier === 'large' ? 45 : sizeTier === 'medium' ? 70 : 100;
    const speed = (baseSpeed + Math.random() * 30) * speedMult;

    // Procedural jagged polygon vertices
    const vertexCount = sizeTier === 'large' ? 12 : sizeTier === 'medium' ? 10 : 8;
    const vertices: AsteroidVertex[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const vAngle = (i / vertexCount) * Math.PI * 2;
      const distance = 0.75 + Math.random() * 0.5; // jagged irregularity
      vertices.push({ angle: vAngle, distance });
    }

    // Craters
    const craterSpots: { x: number; y: number; r: number }[] = [];
    const craterCount = sizeTier === 'large' ? 3 : sizeTier === 'medium' ? 2 : 1;
    for (let i = 0; i < craterCount; i++) {
      const cDist = (Math.random() * 0.6) * radius;
      const cAngle = Math.random() * Math.PI * 2;
      craterSpots.push({
        x: Math.cos(cAngle) * cDist,
        y: Math.sin(cAngle) * cDist,
        r: (Math.random() * 0.18 + 0.1) * radius,
      });
    }

    const rockTints = ['#9ca3af', '#cbd5e1', '#a1a1aa', '#94a3b8', '#d6d3d1'];
    const color = rockTints[Math.floor(Math.random() * rockTints.length)];

    const asteroid: Asteroid = {
      id: Math.random().toString(36).substring(2, 9),
      x: posX,
      y: posY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      sizeTier,
      points,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      vertices,
      color,
      craterSpots,
      health: hp,
      maxHealth: hp,
    };

    this.asteroids.push(asteroid);
    return asteroid;
  }

  // --- GAME LOOP ---

  private gameLoop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // clamp to max 100ms
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // --- UPDATE ---

  private update(dt: number) {
    this.updateControls();
    this.updateShip(dt);
    this.updateBullets(dt);
    this.updateAsteroids(dt);
    this.updateEnemyBots(dt);
    this.updatePowerUps(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.checkCollisions();

    // Combo timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.onComboChange?.(0);
      }
    }

    // Shield passive regeneration based on ship model preset
    const cfg = SHIP_PRESETS[this.selectedShipModel] || SHIP_PRESETS.interceptor;
    if (this.ship.shield < this.ship.maxShield && this.ship.invulnerableTime <= 0) {
      this.ship.shield = Math.min(this.ship.maxShield, this.ship.shield + dt * cfg.shieldRechargeRate);
      this.onHealthChange?.(this.ship.health, this.ship.shield);
    }

    // Check wave completion (Both asteroids AND enemy bots destroyed!)
    if (this.asteroids.length === 0 && this.enemyBots.length === 0 && this.state === 'PLAYING') {
      this.waveClearDelay += dt;
      if (this.waveClearDelay > 0.8) {
        this.waveClearDelay = 0;
        this.handleWaveClear();
      }
    }
  }

  private updateControls() {
    const up = this.keys['ArrowUp'] || this.keys['KeyW'] || this.touchControls.up;
    const down = this.keys['ArrowDown'] || this.keys['KeyS'] || this.touchControls.down;
    const left = this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touchControls.left;
    const right = this.keys['ArrowRight'] || this.keys['KeyD'] || this.touchControls.right;
    const fire = this.keys['Space'] || this.touchControls.fire;
    const nuke = this.keys['KeyB'] || this.touchControls.nuke;

    // Check if virtual joystick is currently active
    if (this.joystickVector && this.joystickVector.intensity > 0.05) {
      this.ship.thrust = true;
      this.ship.reverse = false;
      this.ship.rotLeft = false;
      this.ship.rotRight = false;
      this.ship.rotation = this.joystickVector.angle;
      this.ship.joystickVector = this.joystickVector;
    } else {
      this.ship.joystickVector = undefined;
      if (this.controlScheme === 'CLASSIC') {
        this.ship.thrust = up;
        this.ship.reverse = down;
        this.ship.rotLeft = left;
        this.ship.rotRight = right;
      } else {
        // Direct / Joystick scheme with keyboard fallback
        let dirX = 0;
        let dirY = 0;
        if (up) dirY -= 1;
        if (down) dirY += 1;
        if (left) dirX -= 1;
        if (right) dirX += 1;

        if (dirX !== 0 || dirY !== 0) {
          this.ship.thrust = true;
          const targetRot = Math.atan2(dirY, dirX);
          this.ship.rotation = targetRot;
        } else {
          this.ship.thrust = false;
        }
        this.ship.rotLeft = false;
        this.ship.rotRight = false;
      }
    }

    this.ship.firing = fire;

    if (nuke && this.ship.hasNuke) {
      this.triggerNuke();
    }
  }

  private updateShip(dt: number) {
    const cfg = SHIP_PRESETS[this.selectedShipModel] || SHIP_PRESETS.interceptor;

    // Rotation (Classic mode without active joystick)
    if (this.controlScheme === 'CLASSIC' && !this.ship.joystickVector) {
      const rotSpeed = cfg.rotSpeed; // rad/s from preset
      if (this.ship.rotLeft) this.ship.rotation -= rotSpeed * dt;
      if (this.ship.rotRight) this.ship.rotation += rotSpeed * dt;
    }

    // Thrust acceleration
    const baseThrustPower = cfg.thrustPower;
    const thrustPower = this.ship.joystickVector
      ? baseThrustPower * Math.max(0.35, this.ship.joystickVector.intensity)
      : baseThrustPower;
    const reversePower = 150;
    const friction = 0.982; // smooth inertia damping

    if (this.ship.thrust) {
      soundManager.startThrust();
      const ax = Math.cos(this.ship.rotation) * thrustPower;
      const ay = Math.sin(this.ship.rotation) * thrustPower;
      this.ship.vx += ax * dt;
      this.ship.vy += ay * dt;

      // Exhaust particles with ship accent color
      if (Math.random() < 0.85) {
        const exhaustAngle = this.ship.rotation + Math.PI + (Math.random() - 0.5) * 0.4;
        const exhaustSpeed = 90 + Math.random() * 80;
        const offset = this.ship.radius * 0.9;
        this.particles.push({
          x: this.ship.x - Math.cos(this.ship.rotation) * offset,
          y: this.ship.y - Math.sin(this.ship.rotation) * offset,
          vx: Math.cos(exhaustAngle) * exhaustSpeed + this.ship.vx * 0.3,
          vy: Math.sin(exhaustAngle) * exhaustSpeed + this.ship.vy * 0.3,
          radius: Math.random() * 3 + 2,
          color: Math.random() < 0.6 ? cfg.primaryColor : '#facc15',
          alpha: 0.9,
          decay: 3.5,
          type: 'spark',
        });
      }
    } else if (this.ship.reverse) {
      soundManager.stopThrust();
      const ax = Math.cos(this.ship.rotation) * reversePower;
      const ay = Math.sin(this.ship.rotation) * reversePower;
      this.ship.vx -= ax * dt;
      this.ship.vy -= ay * dt;
    } else {
      soundManager.stopThrust();
    }

    // Apply friction and speed cap
    this.ship.vx *= Math.pow(friction, dt * 60);
    this.ship.vy *= Math.pow(friction, dt * 60);
    const speed = Math.hypot(this.ship.vx, this.ship.vy);
    const maxSpeed = cfg.maxSpeed;
    if (speed > maxSpeed) {
      this.ship.vx = (this.ship.vx / speed) * maxSpeed;
      this.ship.vy = (this.ship.vy / speed) * maxSpeed;
    }

    // Position update
    this.ship.x += this.ship.vx * dt;
    this.ship.y += this.ship.vy * dt;

    // Requirement: "The ship should have smooth, responsive movement and should not move outside the screen."
    this.clampShipToBounds();

    // Timers
    if (this.ship.invulnerableTime > 0) {
      this.ship.invulnerableTime -= dt;
    }
    if (this.ship.spreadShotTime > 0) {
      this.ship.spreadShotTime -= dt;
    }
    if (this.ship.rapidFireTime > 0) {
      this.ship.rapidFireTime -= dt;
    }

    // Continuous shooting handling
    if (this.ship.firing) {
      const wep = WEAPON_PRESETS[this.selectedWeapon] || WEAPON_PRESETS.blaster;
      let cooldown = wep.cooldown;
      if (this.ship.rapidFireTime > 0) {
        cooldown *= 0.55;
      }
      const now = performance.now() / 1000;
      if (now - this.lastShotTime >= cooldown) {
        this.fireBullet();
        this.lastShotTime = now;
      }
    }
  }

  private clampShipToBounds() {
    const pad = this.ship.radius + 2;
    if (this.ship.x < pad) {
      this.ship.x = pad;
      this.ship.vx = Math.max(0, this.ship.vx * -0.3);
    } else if (this.ship.x > this.canvas.width - pad) {
      this.ship.x = this.canvas.width - pad;
      this.ship.vx = Math.min(0, this.ship.vx * -0.3);
    }
    if (this.ship.y < pad) {
      this.ship.y = pad;
      this.ship.vy = Math.max(0, this.ship.vy * -0.3);
    } else if (this.ship.y > this.canvas.height - pad) {
      this.ship.y = this.canvas.height - pad;
      this.ship.vy = Math.min(0, this.ship.vy * -0.3);
    }
  }

  private fireBullet() {
    const shipCfg = SHIP_PRESETS[this.selectedShipModel] || SHIP_PRESETS.interceptor;
    const wep = WEAPON_PRESETS[this.selectedWeapon] || WEAPON_PRESETS.blaster;

    // Calculate effective weapon stats combining ship firepower factor
    const firepowerMult = shipCfg.stats.firepower / 3.0; // scale from 1 to 5 (0.66x - 1.66x)
    const bulletDamage = wep.damage * firepowerMult;
    const bulletSpeed = wep.bulletSpeed;
    const hasSpread = this.ship.spreadShotTime > 0;
    this.shotsFired++;

    // Weapon specific sound effect
    switch (wep.soundType) {
      case 'machinegun':
        soundManager.playMachineGun();
        break;
      case 'laserlauncher':
        soundManager.playLaserLauncher();
        break;
      case 'plasma':
        soundManager.playPlasmaShot();
        break;
      default:
        soundManager.playLaser(hasSpread);
        break;
    }

    const tipOffset = this.ship.radius + 4;
    const startX = this.ship.x + Math.cos(this.ship.rotation) * tipOffset;
    const startY = this.ship.y + Math.sin(this.ship.rotation) * tipOffset;

    // Slight recoil kick on ship
    if (wep.id === 'laserlauncher') {
      this.ship.vx -= Math.cos(this.ship.rotation) * 45;
      this.ship.vy -= Math.sin(this.ship.rotation) * 45;
    } else if (wep.id === 'machinegun') {
      this.ship.vx -= Math.cos(this.ship.rotation) * 6;
      this.ship.vy -= Math.sin(this.ship.rotation) * 6;
    }

    if (hasSpread) {
      // 3-way spread shot
      const angles = [this.ship.rotation - 0.22, this.ship.rotation, this.ship.rotation + 0.22];
      angles.forEach((ang) => {
        this.bullets.push({
          id: Math.random().toString(36).substring(2, 9),
          x: startX,
          y: startY,
          vx: Math.cos(ang) * bulletSpeed + this.ship.vx * 0.2,
          vy: Math.sin(ang) * bulletSpeed + this.ship.vy * 0.2,
          radius: wep.bulletRadius,
          color: wep.color,
          lifespan: wep.id === 'laserlauncher' ? 0.9 : 1.1,
          maxLifespan: 1.1,
          damage: bulletDamage,
          isPlayer: true,
          weaponType: wep.id,
          pierce: wep.pierce,
          pierceCount: wep.pierce ? 3 : 0,
        });
      });
    } else {
      // Weapon specific single/spread trajectory
      let shotAngle = this.ship.rotation;
      if (wep.spreadAngle) {
        shotAngle += (Math.random() - 0.5) * wep.spreadAngle;
      }

      this.bullets.push({
        id: Math.random().toString(36).substring(2, 9),
        x: startX,
        y: startY,
        vx: Math.cos(shotAngle) * bulletSpeed + this.ship.vx * 0.2,
        vy: Math.sin(shotAngle) * bulletSpeed + this.ship.vy * 0.2,
        radius: wep.bulletRadius,
        color: wep.color,
        lifespan: wep.id === 'machinegun' ? 0.95 : wep.id === 'laserlauncher' ? 1.0 : 1.2,
        maxLifespan: 1.2,
        damage: bulletDamage,
        isPlayer: true,
        weaponType: wep.id,
        pierce: wep.pierce,
        pierceCount: wep.pierce ? 3 : 0,
      });
    }

    // Weapon muzzle flash particle
    const flashRadius = wep.id === 'laserlauncher' ? 11 : wep.id === 'plasma' ? 9 : 5;
    this.particles.push({
      x: startX,
      y: startY,
      vx: this.ship.vx * 0.2,
      vy: this.ship.vy * 0.2,
      radius: flashRadius,
      color: wep.color,
      alpha: 1,
      decay: wep.id === 'machinegun' ? 24 : 14,
      type: 'glow',
    });
  }

  public triggerNuke() {
    if (!this.ship.hasNuke) return;
    this.ship.hasNuke = false;
    soundManager.playShipExplosion();

    // Shockwave particle
    this.particles.push({
      x: this.ship.x,
      y: this.ship.y,
      vx: 0,
      vy: 0,
      radius: 20,
      color: '#38bdf8',
      alpha: 1,
      decay: 1.2,
      type: 'ring',
    });

    // Destroy or split all asteroids on screen
    const copy = [...this.asteroids];
    copy.forEach((ast) => {
      this.destroyAsteroid(ast, true);
    });

    this.addFloatingText(this.ship.x, this.ship.y - 30, 'EMP DETONATED!', '#38bdf8', 26);
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.lifespan -= dt;

      // Remove if out of screen or lifespan exceeded
      const outOfBounds =
        b.x < -10 || b.x > this.canvas.width + 10 || b.y < -10 || b.y > this.canvas.height + 10;

      if (b.lifespan <= 0 || outOfBounds) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateAsteroids(dt: number) {
    const pad = 60;
    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotSpeed * dt;

      // Wrap around edges smoothly
      if (a.x < -pad) a.x = this.canvas.width + pad;
      else if (a.x > this.canvas.width + pad) a.x = -pad;

      if (a.y < -pad) a.y = this.canvas.height + pad;
      else if (a.y > this.canvas.height + pad) a.y = -pad;
    }
  }

  private updateEnemyBots(dt: number) {
    const now = performance.now() / 1000;

    for (let i = this.enemyBots.length - 1; i >= 0; i--) {
      const bot = this.enemyBots[i];

      // AI Logic: Aim and steer toward player with evasive orbiting
      bot.aiTimer -= dt;
      const dx = this.ship.x - bot.x;
      const dy = this.ship.y - bot.y;
      const dist = Math.hypot(dx, dy);
      const angleToPlayer = Math.atan2(dy, dx);

      // Periodically update flight behavior
      if (bot.aiTimer <= 0) {
        bot.aiTimer = 0.4 + Math.random() * 0.4;
        if (dist > 280) {
          // Approach player
          bot.targetAngle = angleToPlayer;
        } else if (dist < 140) {
          // Back off / strafe away
          bot.targetAngle = angleToPlayer + Math.PI + (Math.random() - 0.5) * 0.8;
        } else {
          // Orbit around player
          const orbitDir = (i % 2 === 0 ? 1 : -1) * (Math.PI / 2);
          bot.targetAngle = angleToPlayer + orbitDir;
        }
      }

      // Smooth turn towards target angle
      let diff = bot.targetAngle - bot.rotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const turnSpeed = bot.type === 'scout' ? 4.5 : bot.type === 'interceptor' ? 3.8 : 2.2;
      bot.rotation += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed * dt);

      // Accelerate forward in current facing direction
      const thrust = bot.speed;
      bot.vx += Math.cos(bot.rotation) * thrust * dt;
      bot.vy += Math.sin(bot.rotation) * thrust * dt;

      // Friction
      bot.vx *= Math.pow(0.97, dt * 60);
      bot.vy *= Math.pow(0.97, dt * 60);

      // Position update
      bot.x += bot.vx * dt;
      bot.y += bot.vy * dt;

      // Wrap or clamp within field
      const pad = bot.radius + 10;
      if (bot.x < -pad) bot.x = this.canvas.width + pad;
      else if (bot.x > this.canvas.width + pad) bot.x = -pad;
      if (bot.y < -pad) bot.y = this.canvas.height + pad;
      else if (bot.y > this.canvas.height + pad) bot.y = -pad;

      // Engine trail sparks
      if (Math.random() < 0.6) {
        const exhaustAngle = bot.rotation + Math.PI + (Math.random() - 0.5) * 0.5;
        this.particles.push({
          x: bot.x - Math.cos(bot.rotation) * bot.radius,
          y: bot.y - Math.sin(bot.rotation) * bot.radius,
          vx: Math.cos(exhaustAngle) * 50,
          vy: Math.sin(exhaustAngle) * 50,
          radius: 2,
          color: bot.color,
          alpha: 0.8,
          decay: 4.0,
          type: 'spark',
        });
      }

      // Shield regeneration
      if (bot.shield < bot.maxShield) {
        bot.shield = Math.min(bot.maxShield, bot.shield + dt * 2.5);
      }

      // Enemy Bot Shooting
      // Only shoot if in front arc and line-of-sight distance
      if (this.state === 'PLAYING' && now - bot.lastShotTime >= bot.fireCooldown) {
        const aimDiff = Math.abs(diff);
        if (aimDiff < 0.7 && dist < 500) {
          bot.lastShotTime = now;
          soundManager.playEnemyLaser();

          const bSpeed = 380;
          const tipOffset = bot.radius + 4;
          const bStartX = bot.x + Math.cos(bot.rotation) * tipOffset;
          const bStartY = bot.y + Math.sin(bot.rotation) * tipOffset;

          if (bot.type === 'cruiser') {
            // Twin heavy plasma bolts
            [-0.15, 0.15].forEach((angOffset) => {
              const shotAng = bot.rotation + angOffset;
              this.bullets.push({
                id: Math.random().toString(36).substring(2, 9),
                x: bStartX,
                y: bStartY,
                vx: Math.cos(shotAng) * bSpeed,
                vy: Math.sin(shotAng) * bSpeed,
                radius: 4,
                color: bot.color,
                lifespan: 1.8,
                maxLifespan: 1.8,
                damage: 25,
                isPlayer: false,
              });
            });
          } else {
            // Red plasma bolt
            this.bullets.push({
              id: Math.random().toString(36).substring(2, 9),
              x: bStartX,
              y: bStartY,
              vx: Math.cos(bot.rotation) * bSpeed,
              vy: Math.sin(bot.rotation) * bSpeed,
              radius: bot.type === 'interceptor' ? 3.5 : 2.8,
              color: bot.color,
              lifespan: 1.6,
              maxLifespan: 1.6,
              damage: bot.type === 'interceptor' ? 20 : 15,
              isPlayer: false,
            });
          }
        }
      }
    }
  }

  private updatePowerUps(dt: number) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifespan -= dt;
      p.bobPhase += dt * 3.5;

      if (p.lifespan <= 0) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'ring') {
        p.radius += dt * 280;
      }
      if (p.rotSpeed && p.rotation !== undefined) {
        p.rotation += p.rotSpeed * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.4;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- COLLISION DETECTION ---

  private checkCollisions() {
    // 1. Bullets vs Asteroids & Enemy Bots
    bulletLoop: for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const bullet = this.bullets[bIdx];

      if (bullet.isPlayer) {
        // Player bullet vs Asteroids
        for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
          const asteroid = this.asteroids[aIdx];
          const dist = Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y);

          if (dist <= asteroid.radius + bullet.radius) {
            this.shotsHit++;
            asteroid.health -= bullet.damage;
            soundManager.playAsteroidHit();

            const hitAngle = Math.atan2(bullet.y - asteroid.y, bullet.x - asteroid.x);
            for (let p = 0; p < 5; p++) {
              const sparkAng = hitAngle + (Math.random() - 0.5) * 1.2;
              const sparkSpeed = 60 + Math.random() * 80;
              this.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: Math.cos(sparkAng) * sparkSpeed,
                vy: Math.sin(sparkAng) * sparkSpeed,
                radius: Math.random() * 2 + 1,
                color: bullet.color || '#facc15',
                alpha: 1,
                decay: 4.5,
                type: 'spark',
              });
            }

            if (asteroid.health <= 0) {
              this.destroyAsteroid(asteroid, false);
            }

            // Piercing beam mechanic: if bullet can pierce, decrement pierceCount
            if (bullet.pierce && bullet.pierceCount && bullet.pierceCount > 1) {
              bullet.pierceCount--;
              bullet.damage *= 0.85; // slight falloff
            } else {
              this.bullets.splice(bIdx, 1);
              continue bulletLoop;
            }
          }
        }

        // Player bullet vs Enemy Bots
        for (let eIdx = this.enemyBots.length - 1; eIdx >= 0; eIdx--) {
          const bot = this.enemyBots[eIdx];
          const dist = Math.hypot(bullet.x - bot.x, bullet.y - bot.y);

          if (dist <= bot.radius + bullet.radius) {
            this.shotsHit++;
            soundManager.playAsteroidHit();

            // Deal damage: shields first, then hull
            if (bot.shield > 0) {
              bot.shield -= bullet.damage * 25;
              if (bot.shield < 0) {
                bot.health += bot.shield;
                bot.shield = 0;
              }
            } else {
              bot.health -= bullet.damage * 35;
            }

            // Hit sparks
            for (let p = 0; p < 6; p++) {
              const sparkAng = Math.random() * Math.PI * 2;
              this.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: Math.cos(sparkAng) * 90,
                vy: Math.sin(sparkAng) * 90,
                radius: 2,
                color: bot.color,
                alpha: 1,
                decay: 5.0,
                type: 'spark',
              });
            }

            if (bot.health <= 0) {
              this.destroyEnemyBot(bot);
            }

            // Piercing check
            if (bullet.pierce && bullet.pierceCount && bullet.pierceCount > 1) {
              bullet.pierceCount--;
              bullet.damage *= 0.85;
            } else {
              this.bullets.splice(bIdx, 1);
              continue bulletLoop;
            }
          }
        }
      } else {
        // Enemy bullet vs Player ship
        if (this.ship.invulnerableTime <= 0) {
          const dist = Math.hypot(bullet.x - this.ship.x, bullet.y - this.ship.y);
          if (dist <= this.ship.radius + bullet.radius) {
            this.bullets.splice(bIdx, 1);
            this.handlePlayerDamage(bullet.damage, bullet.x, bullet.y);
            continue bulletLoop;
          }
        }
      }
    }

    // 2. Ship vs Asteroids (if not invulnerable)
    if (this.ship.invulnerableTime <= 0) {
      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const asteroid = this.asteroids[aIdx];
        const dist = Math.hypot(this.ship.x - asteroid.x, this.ship.y - asteroid.y);

        if (dist <= asteroid.radius + this.ship.radius) {
          this.handleShipHit(asteroid);
          break;
        }
      }

      // Ship vs Enemy Bots (Ramming collision)
      for (let eIdx = this.enemyBots.length - 1; eIdx >= 0; eIdx--) {
        const bot = this.enemyBots[eIdx];
        const dist = Math.hypot(this.ship.x - bot.x, this.ship.y - bot.y);

        if (dist <= bot.radius + this.ship.radius) {
          this.destroyEnemyBot(bot);
          this.handlePlayerDamage(50, bot.x, bot.y);
          break;
        }
      }
    }

    // 3. Ship vs PowerUps
    for (let pIdx = this.powerUps.length - 1; pIdx >= 0; pIdx--) {
      const powerUp = this.powerUps[pIdx];
      const dist = Math.hypot(this.ship.x - powerUp.x, this.ship.y - powerUp.y);

      if (dist <= this.ship.radius + powerUp.radius) {
        this.collectPowerUp(powerUp);
        this.powerUps.splice(pIdx, 1);
      }
    }
  }

  private destroyEnemyBot(bot: EnemyBot) {
    const idx = this.enemyBots.indexOf(bot);
    if (idx !== -1) {
      this.enemyBots.splice(idx, 1);
    }

    soundManager.playShipExplosion();

    // Score & Combo
    this.combo++;
    this.comboTimer = 2.8;
    const mult = Math.min(this.combo, 5);
    const earned = bot.points * mult;
    this.score += earned;
    this.saveHighScore();
    this.emitUIUpdates();

    this.addFloatingText(bot.x, bot.y - 15, `+${earned}`, '#f43f5e', 20);

    // Bot explosion shockwave & debris
    this.particles.push({
      x: bot.x,
      y: bot.y,
      vx: 0,
      vy: 0,
      radius: bot.radius * 0.8,
      color: bot.color,
      alpha: 1,
      decay: 2.2,
      type: 'ring',
    });

    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      this.particles.push({
        x: bot.x,
        y: bot.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: Math.random() * 3 + 1,
        color: Math.random() < 0.6 ? bot.color : '#fef08a',
        alpha: 1,
        decay: 2.0,
        type: 'spark',
      });
    }

    // High chance of dropping power-up!
    if (Math.random() < 0.45) {
      this.spawnPowerUp(bot.x, bot.y);
    }
  }

  private handlePlayerDamage(damage: number, hitX: number, hitY: number) {
    if (this.ship.invulnerableTime > 0) return;

    if (this.ship.shield > 10) {
      this.ship.shield -= damage;
      soundManager.playShieldHit();
      this.ship.invulnerableTime = 0.5;

      const pushAng = Math.atan2(this.ship.y - hitY, this.ship.x - hitX);
      this.ship.vx += Math.cos(pushAng) * 120;
      this.ship.vy += Math.sin(pushAng) * 120;

      if (this.ship.shield < 0) {
        this.ship.health += this.ship.shield;
        this.ship.shield = 0;
      }
      this.addFloatingText(this.ship.x, this.ship.y - 20, 'SHIELD HIT!', '#38bdf8', 16);
      this.emitUIUpdates();

      if (this.ship.health > 0) return;
    }

    // Hull damage / Life lost
    soundManager.playShipExplosion();
    this.lives--;
    this.combo = 0;
    this.onComboChange?.(0);

    for (let i = 0; i < 35; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 220;
      this.particles.push({
        x: this.ship.x,
        y: this.ship.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: Math.random() * 4 + 1.5,
        color: Math.random() < 0.5 ? '#ef4444' : '#f97316',
        alpha: 1,
        decay: 1.5,
        type: 'spark',
      });
    }

    if (this.lives > 0) {
      const cfg = SHIP_PRESETS[this.selectedShipModel] || SHIP_PRESETS.interceptor;
      this.ship.x = this.canvas.width / 2;
      this.ship.y = this.canvas.height / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.ship.rotation = -Math.PI / 2;
      this.ship.invulnerableTime = 3.5;
      this.ship.shield = cfg.maxShield;
      this.ship.health = cfg.maxHealth;
      this.addFloatingText(this.ship.x, this.ship.y - 30, 'RESPAWNING...', '#ef4444', 20);
      this.emitUIUpdates();
    } else {
      this.saveHighScore();
      this.setState('GAME_OVER');
      this.emitUIUpdates();
    }
  }

  private destroyAsteroid(asteroid: Asteroid, isNuke: boolean) {
    const idx = this.asteroids.indexOf(asteroid);
    if (idx !== -1) {
      this.asteroids.splice(idx, 1);
    }

    this.asteroidsDestroyed++;
    soundManager.playAsteroidExplosion(asteroid.sizeTier);

    // Combo system
    this.combo++;
    this.comboTimer = 2.2;
    const comboMultiplier = Math.min(this.combo, 5);

    // Scoring: Larger asteroids give more points (as per prompt instructions)
    // Large: 100, Medium: 60, Small: 30
    const earnedPoints = asteroid.points * comboMultiplier;
    this.score += earnedPoints;
    this.saveHighScore();
    this.emitUIUpdates();

    // Floating score indicator
    const comboTag = comboMultiplier > 1 ? ` (x${comboMultiplier})` : '';
    this.addFloatingText(asteroid.x, asteroid.y, `+${earnedPoints}${comboTag}`, '#facc15', 18);

    // Explosion particles
    const particleCount = asteroid.sizeTier === 'large' ? 24 : asteroid.sizeTier === 'medium' ? 16 : 10;
    for (let i = 0; i < particleCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * (asteroid.sizeTier === 'large' ? 180 : 130);
      this.particles.push({
        x: asteroid.x,
        y: asteroid.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: Math.random() * (asteroid.sizeTier === 'large' ? 4 : 2.5) + 1.5,
        color: Math.random() < 0.4 ? '#f97316' : asteroid.color,
        alpha: 1,
        decay: Math.random() * 1.5 + 1.2,
        type: Math.random() < 0.3 ? 'spark' : 'rock',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6,
      });
    }

    // Expanding shockwave ring for large asteroid
    if (asteroid.sizeTier === 'large') {
      this.particles.push({
        x: asteroid.x,
        y: asteroid.y,
        vx: 0,
        vy: 0,
        radius: asteroid.radius * 0.4,
        color: '#fbbf24',
        alpha: 0.8,
        decay: 2.2,
        type: 'ring',
      });
    }

    // Split into smaller pieces (unless it was already small or destroyed by nuke)
    if (!isNuke) {
      if (asteroid.sizeTier === 'large') {
        // Large -> 2 to 3 Medium
        const count = 2;
        for (let i = 0; i < count; i++) {
          this.spawnAsteroid('medium', asteroid.x, asteroid.y, 1.1);
        }
      } else if (asteroid.sizeTier === 'medium') {
        // Medium -> 2 to 3 Small
        const count = Math.random() < 0.6 ? 2 : 3;
        for (let i = 0; i < count; i++) {
          this.spawnAsteroid('small', asteroid.x, asteroid.y, 1.25);
        }
      }
    }

    // Chance to spawn power-up
    const powerChance = asteroid.sizeTier === 'large' ? 0.35 : asteroid.sizeTier === 'medium' ? 0.18 : 0.05;
    if (Math.random() < powerChance && this.powerUps.length < 3) {
      this.spawnPowerUp(asteroid.x, asteroid.y);
    }
  }

  private spawnPowerUp(x: number, y: number) {
    const types: PowerUpType[] = ['shield', 'spread', 'rapid'];
    if (this.lives < 3 && Math.random() < 0.25) {
      types.push('life');
    }
    if (Math.random() < 0.2) {
      types.push('nuke');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 20;

    this.powerUps.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type,
      lifespan: 12.0,
      radius: 14,
      bobPhase: Math.random() * Math.PI,
    });
  }

  private collectPowerUp(p: PowerUp) {
    soundManager.playPowerUpCollect();

    let label = '';
    let color = '#38bdf8';

    switch (p.type) {
      case 'shield':
        this.ship.shield = this.ship.maxShield;
        this.ship.health = Math.min(this.ship.maxHealth, this.ship.health + 25);
        label = 'SHIELD RESTORED!';
        color = '#38bdf8';
        break;
      case 'spread':
        this.ship.spreadShotTime = 12.0;
        label = 'TRIPLE SPREAD CANNON!';
        color = '#a855f7';
        break;
      case 'rapid':
        this.ship.rapidFireTime = 10.0;
        label = 'RAPID TURBO LASER!';
        color = '#eab308';
        break;
      case 'nuke':
        this.ship.hasNuke = true;
        label = 'EMP BOMB READY! [B]';
        color = '#f43f5e';
        break;
      case 'life':
        this.lives++;
        label = '+1 EXTRA SHIP!';
        color = '#10b981';
        break;
    }

    this.addFloatingText(this.ship.x, this.ship.y - 25, label, color, 18);
    this.emitUIUpdates();

    // Collect sparkle particles
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 70;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: 2.5,
        color,
        alpha: 1,
        decay: 3.0,
        type: 'spark',
      });
    }
  }

  private handleShipHit(asteroid: Asteroid) {
    // Check shields first
    if (this.ship.shield > 25) {
      this.ship.shield -= 45;
      soundManager.playShieldHit();
      this.ship.invulnerableTime = 0.8; // brief grace period

      // Push ship back from asteroid
      const pushAng = Math.atan2(this.ship.y - asteroid.y, this.ship.x - asteroid.x);
      this.ship.vx += Math.cos(pushAng) * 200;
      this.ship.vy += Math.sin(pushAng) * 200;

      this.addFloatingText(this.ship.x, this.ship.y - 20, 'SHIELD DEFLECTED!', '#38bdf8', 16);
      this.emitUIUpdates();
      return;
    }

    // Hull damage / Life lost
    soundManager.playShipExplosion();
    this.lives--;
    this.combo = 0;
    this.onComboChange?.(0);

    // Ship explosion particles
    for (let i = 0; i < 35; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 220;
      this.particles.push({
        x: this.ship.x,
        y: this.ship.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: Math.random() * 4 + 1.5,
        color: Math.random() < 0.5 ? '#ef4444' : Math.random() < 0.8 ? '#f97316' : '#ffffff',
        alpha: 1,
        decay: 1.5,
        type: 'spark',
      });
    }

    if (this.lives > 0) {
      // Respawn at center with invulnerability
      this.ship.x = this.canvas.width / 2;
      this.ship.y = this.canvas.height / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.ship.rotation = -Math.PI / 2;
      this.ship.invulnerableTime = 3.5;
      this.ship.shield = 100;
      this.ship.health = 100;
      this.addFloatingText(this.ship.x, this.ship.y - 30, 'RESPAWNING...', '#ef4444', 20);
      this.emitUIUpdates();
    } else {
      // Game Over
      this.saveHighScore();
      this.setState('GAME_OVER');
      this.emitUIUpdates();
    }
  }

  private handleWaveClear() {
    soundManager.playWaveClear();
    const waveBonus = this.wave * 500;
    this.score += waveBonus;
    this.saveHighScore();

    this.onWaveCleared?.(this.wave, waveBonus);
    this.setState('WAVE_CLEAR');
    this.emitUIUpdates();
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number) {
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -40,
      size,
    });
  }

  // --- RENDERING ---

  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Deep space dark canvas
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Subtle cosmic grid lines
    this.renderSubtleGrid();

    // Render multi-layer starfield
    this.renderStars();

    // Render Power-Ups
    this.renderPowerUps();

    // Render Asteroids
    this.renderAsteroids();

    // Render Enemy Bots
    this.renderEnemyBots();

    // Render Bullets
    this.renderBullets();

    // Render Particles
    this.renderParticles();

    // Render Player Ship (if playing/paused/wave_clear)
    if (this.state !== 'GAME_OVER') {
      this.renderShip();
    }

    // Render Floating Text
    this.renderFloatingTexts();
  }

  private renderSubtleGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.025)';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < this.canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderStars() {
    const ctx = this.ctx;
    const t = performance.now() / 1000;

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const flicker = Math.sin(t * star.flickerSpeed + star.x) * 0.25;
      const currentAlpha = Math.max(0.1, Math.min(1, star.alpha + flicker));

      ctx.save();
      ctx.fillStyle = star.color;
      ctx.globalAlpha = currentAlpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderShip() {
    const ctx = this.ctx;
    const ship = this.ship;
    const cfg = SHIP_PRESETS[this.selectedShipModel] || SHIP_PRESETS.interceptor;

    // Invulnerability blinking
    if (ship.invulnerableTime > 0) {
      const blink = Math.floor(performance.now() / 90) % 2 === 0;
      if (blink) return;
    }

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);

    // Shimmering shield bubble if active or recently hit
    if (ship.shield > 20 || ship.invulnerableTime > 0) {
      ctx.save();
      ctx.beginPath();
      const shieldRadius = ship.radius * 1.55;
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.strokeStyle = ship.invulnerableTime > 0 ? 'rgba(56, 189, 248, 0.85)' : cfg.glowColor;
      ctx.lineWidth = ship.invulnerableTime > 0 ? 2.5 : 1.6;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Thruster exhaust flame
    if (ship.thrust) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-ship.radius * 0.7, -ship.radius * 0.45);
      const flameLength = ship.radius * (1.3 + Math.random() * 0.7);
      ctx.lineTo(-flameLength, 0);
      ctx.lineTo(-ship.radius * 0.7, ship.radius * 0.45);
      ctx.closePath();
      ctx.fillStyle = Math.random() < 0.5 ? cfg.primaryColor : '#facc15';
      ctx.shadowColor = cfg.primaryColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    // Custom Ship Geometries per Model Preset
    ctx.beginPath();
    if (cfg.id === 'vanguard') {
      // Heavy wide assault wings with dual nose cannons
      ctx.moveTo(ship.radius * 1.2, -ship.radius * 0.35);
      ctx.lineTo(ship.radius * 1.2, -ship.radius * 0.15);
      ctx.lineTo(ship.radius * 0.8, 0);
      ctx.lineTo(ship.radius * 1.2, ship.radius * 0.15);
      ctx.lineTo(ship.radius * 1.2, ship.radius * 0.35);
      ctx.lineTo(-ship.radius * 0.8, ship.radius * 1.15);
      ctx.lineTo(-ship.radius * 0.5, ship.radius * 0.4);
      ctx.lineTo(-ship.radius * 0.9, 0);
      ctx.lineTo(-ship.radius * 0.5, -ship.radius * 0.4);
      ctx.lineTo(-ship.radius * 0.8, -ship.radius * 1.15);
    } else if (cfg.id === 'phantom') {
      // Needle-sharp swept delta wing
      ctx.moveTo(ship.radius * 1.6, 0);
      ctx.lineTo(-ship.radius * 0.9, ship.radius * 0.75);
      ctx.lineTo(-ship.radius * 0.4, 0);
      ctx.lineTo(-ship.radius * 0.9, -ship.radius * 0.75);
    } else if (cfg.id === 'titan') {
      // Hexagonal armored dreadnought
      ctx.moveTo(ship.radius * 1.1, 0);
      ctx.lineTo(ship.radius * 0.6, ship.radius * 0.9);
      ctx.lineTo(-ship.radius * 0.6, ship.radius * 1.1);
      ctx.lineTo(-ship.radius * 0.9, 0);
      ctx.lineTo(-ship.radius * 0.6, -ship.radius * 1.1);
      ctx.lineTo(ship.radius * 0.6, -ship.radius * 0.9);
    } else {
      // Default Interceptor
      ctx.moveTo(ship.radius * 1.35, 0);
      ctx.lineTo(-ship.radius * 0.85, ship.radius * 0.9);
      ctx.lineTo(-ship.radius * 0.45, ship.radius * 0.35);
      ctx.lineTo(-ship.radius * 0.7, 0);
      ctx.lineTo(-ship.radius * 0.45, -ship.radius * 0.35);
      ctx.lineTo(-ship.radius * 0.85, -ship.radius * 0.9);
    }
    ctx.closePath();

    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = cfg.primaryColor;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = cfg.primaryColor;
    ctx.shadowBlur = 9;
    ctx.stroke();

    // Cockpit Canopy
    ctx.beginPath();
    ctx.ellipse(ship.radius * 0.15, 0, ship.radius * 0.4, ship.radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = cfg.primaryColor;
    ctx.fill();

    // Model specific wing weapons/armor details
    if (cfg.id === 'vanguard') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-ship.radius * 0.2, ship.radius * 0.85, ship.radius * 0.7, 3.5);
      ctx.fillRect(-ship.radius * 0.2, -ship.radius * 0.85 - 3.5, ship.radius * 0.7, 3.5);
    } else if (cfg.id === 'phantom') {
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(0, ship.radius * 0.5, ship.radius * 0.6, 2);
      ctx.fillRect(0, -ship.radius * 0.5 - 2, ship.radius * 0.6, 2);
    }

    ctx.restore();
  }

  private renderEnemyBots() {
    const ctx = this.ctx;

    for (let i = 0; i < this.enemyBots.length; i++) {
      const bot = this.enemyBots[i];
      ctx.save();
      ctx.translate(bot.x, bot.y);
      ctx.rotate(bot.rotation);

      // Enemy Shield Bubble
      if (bot.shield > 5) {
        ctx.beginPath();
        ctx.arc(0, 0, bot.radius * 1.45, 0, Math.PI * 2);
        ctx.strokeStyle = bot.glowColor;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fill();
        ctx.stroke();
      }

      // Enemy Bot Hull based on type
      ctx.beginPath();
      if (bot.type === 'scout') {
        // Triangular swift drone
        ctx.moveTo(bot.radius * 1.2, 0);
        ctx.lineTo(-bot.radius * 0.8, bot.radius * 0.7);
        ctx.lineTo(-bot.radius * 0.4, 0);
        ctx.lineTo(-bot.radius * 0.8, -bot.radius * 0.7);
      } else if (bot.type === 'interceptor') {
        // Aggressive forward-swept fighter
        ctx.moveTo(bot.radius * 1.3, 0);
        ctx.lineTo(bot.radius * 0.6, bot.radius * 0.8);
        ctx.lineTo(-bot.radius * 0.7, bot.radius * 0.7);
        ctx.lineTo(-bot.radius * 0.4, 0);
        ctx.lineTo(-bot.radius * 0.7, -bot.radius * 0.7);
        ctx.lineTo(bot.radius * 0.6, -bot.radius * 0.8);
      } else {
        // Heavy Cruiser Diamond
        ctx.moveTo(bot.radius * 1.2, 0);
        ctx.lineTo(0, bot.radius * 0.9);
        ctx.lineTo(-bot.radius * 1.1, 0);
        ctx.lineTo(0, -bot.radius * 0.9);
      }
      ctx.closePath();

      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.strokeStyle = bot.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = bot.color;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Glowing red ocular sensor / core
      ctx.beginPath();
      ctx.arc(bot.radius * 0.2, 0, bot.radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = bot.color;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fill();

      // Health bar above bot if damaged
      if (bot.health < bot.maxHealth || bot.shield < bot.maxShield) {
        ctx.rotate(-bot.rotation);
        const barW = bot.radius * 1.6;
        const barH = 3;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-barW / 2, -bot.radius - 10, barW, barH);
        ctx.fillStyle = bot.color;
        ctx.fillRect(-barW / 2, -bot.radius - 10, barW * (bot.health / bot.maxHealth), barH);
      }

      ctx.restore();
    }
  }

  private renderAsteroids() {
    const ctx = this.ctx;

    for (let i = 0; i < this.asteroids.length; i++) {
      const a = this.asteroids[i];
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);

      // Draw jagged asteroid polygon
      ctx.beginPath();
      for (let v = 0; v < a.vertices.length; v++) {
        const vert = a.vertices[v];
        const r = a.radius * vert.distance;
        const vx = Math.cos(vert.angle) * r;
        const vy = Math.sin(vert.angle) * r;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();

      // Rock gradient fill
      const grad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, a.radius * 0.1, 0, 0, a.radius);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fill();

      // Rock perimeter outline
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Draw craters
      for (let c = 0; c < a.craterSpots.length; c++) {
        const crater = a.craterSpots[c];
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Health bar for damaged large asteroids
      if (a.sizeTier === 'large' && a.health < a.maxHealth) {
        ctx.rotate(-a.rotation); // keep horizontal
        const barW = a.radius * 1.2;
        const barH = 4;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-barW / 2, -a.radius - 12, barW, barH);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-barW / 2, -a.radius - 12, barW * (a.health / a.maxHealth), barH);
      }

      ctx.restore();
    }
  }

  private renderBullets() {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      ctx.save();

      if (b.weaponType === 'laserlauncher') {
        // High-energy glowing beam lance
        ctx.beginPath();
        const beamLength = 32;
        const ang = Math.atan2(b.vy, b.vx);
        ctx.moveTo(b.x + Math.cos(ang) * (beamLength * 0.4), b.y + Math.sin(ang) * (beamLength * 0.4));
        ctx.lineTo(b.x - Math.cos(ang) * (beamLength * 0.6), b.y - Math.sin(ang) * (beamLength * 0.6));
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = b.radius * 1.8;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 16;
        ctx.stroke();

        // White hot inner core
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(ang) * (beamLength * 0.35), b.y + Math.sin(ang) * (beamLength * 0.35));
        ctx.lineTo(b.x - Math.cos(ang) * (beamLength * 0.45), b.y - Math.sin(ang) * (beamLength * 0.45));
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = b.radius * 0.8;
        ctx.stroke();
      } else if (b.weaponType === 'machinegun') {
        // Fast kinetic tracer bullet
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
        ctx.fill();

        // High-speed tracer tail
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 0.024, b.y - b.vy * 0.024);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
        ctx.lineWidth = b.radius * 1.2;
        ctx.stroke();
      } else if (b.weaponType === 'plasma') {
        // Superheated plasma sphere with pulsating corona
        const pulse = 1 + Math.sin(performance.now() * 0.02) * 0.15;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 18;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        // Standard blaster
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 9;
        ctx.fill();

        // Bullet trail
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.radius * 1.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private renderPowerUps() {
    const ctx = this.ctx;

    for (let i = 0; i < this.powerUps.length; i++) {
      const p = this.powerUps[i];
      const bob = Math.sin(p.bobPhase) * 3;

      ctx.save();
      ctx.translate(p.x, p.y + bob);

      // Determine color and glyph
      let color = '#38bdf8';
      let icon = 'S';
      switch (p.type) {
        case 'shield':
          color = '#38bdf8';
          icon = 'SHIELD';
          break;
        case 'spread':
          color = '#c084fc';
          icon = 'SPREAD';
          break;
        case 'rapid':
          color = '#facc15';
          icon = 'TURBO';
          break;
        case 'nuke':
          color = '#f43f5e';
          icon = 'EMP';
          break;
        case 'life':
          color = '#34d399';
          icon = '+1 LIFE';
          break;
      }

      // Outer rotating hexagon
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const ang = (s / 6) * Math.PI * 2 + p.bobPhase * 0.8;
        const hx = Math.cos(ang) * (p.radius + 2);
        const hy = Math.sin(ang) * (p.radius + 2);
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Inner text label
      ctx.fillStyle = color;
      ctx.font = 'bold 8px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, 0, 0);

      ctx.restore();
    }
  }

  private renderParticles() {
    const ctx = this.ctx;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.type === 'spark' || p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'rock') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.rect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'glow') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderFloatingTexts() {
    const ctx = this.ctx;

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.font = `bold ${ft.size}px "Chakra Petch", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // --- CLEANUP ---

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundManager.destroy();
  }
}
