/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeaponConfig, WeaponType } from './game';

export const WEAPON_PRESETS: Record<WeaponType, WeaponConfig> = {
  blaster: {
    id: 'blaster',
    name: 'Dual Pulse Blaster',
    shortName: 'BLASTER',
    description: 'Standard military energy repeaters. Balanced fire rate, good range, and dependable medium damage across all targets.',
    cooldown: 0.16, // ~6.2 shots/sec
    damage: 1.0, // baseline 1 hit on small, 2 on medium, 3 on large
    bulletSpeed: 660,
    bulletRadius: 3.5,
    color: '#38bdf8', // sky-400
    glowColor: 'rgba(56, 189, 248, 0.6)',
    soundType: 'blaster',
  },
  machinegun: {
    id: 'machinegun',
    name: 'Gatling Vulcan MG',
    shortName: 'VULCAN MG',
    description: 'Ultra-rapid kinetic rotary cannon. Fires blazing hyper-fast streams of rounds (18+ shots/sec). High recoil & shredding sustained DPS.',
    cooldown: 0.055, // ~18.2 shots/sec
    damage: 0.42, // lower per bullet, but sheer volume obliterates targets fast
    bulletSpeed: 820, // very high muzzle velocity
    bulletRadius: 2.2,
    spreadAngle: 0.07, // slight kinetic spread cone
    color: '#f59e0b', // amber-500
    glowColor: 'rgba(245, 158, 11, 0.7)',
    soundType: 'machinegun',
  },
  laserlauncher: {
    id: 'laserlauncher',
    name: 'Photon Beam Launcher',
    shortName: 'LASER LAUNCH',
    description: 'Concentrated high-yield photon beam projector. Slower charge rate, but unleashes devastating piercing bolts that melt through multiple asteroids & bots.',
    cooldown: 0.42, // ~2.4 shots/sec (slower, methodical)
    damage: 3.2, // 1-shot small & medium asteroids! 3.2x damage
    bulletSpeed: 950, // near instant beam lance
    bulletRadius: 5.5,
    pierce: true, // pierces through up to 3 objects!
    color: '#ec4899', // pink-500 neon beam
    glowColor: 'rgba(236, 72, 153, 0.85)',
    soundType: 'laserlauncher',
  },
  plasma: {
    id: 'plasma',
    name: 'Heavy Plasma Torpedo',
    shortName: 'PLASMA',
    description: 'Superheated explosive plasma spheres. Moderate rate of fire with immense destructive blast force and high kinetic knockback.',
    cooldown: 0.28, // ~3.5 shots/sec
    damage: 2.0, // 2x damage
    bulletSpeed: 540,
    bulletRadius: 7.0, // large glowing orb
    color: '#10b981', // emerald-400
    glowColor: 'rgba(16, 185, 129, 0.8)',
    soundType: 'plasma',
  },
};
