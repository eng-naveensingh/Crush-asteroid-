/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShipConfig, ShipModelId } from '../types/game';

export const SHIP_PRESETS: Record<ShipModelId, ShipConfig> = {
  interceptor: {
    id: 'interceptor',
    name: 'A-10 Starblade',
    role: 'Balanced Interceptor',
    description: 'The standard issue fleet fighter. Well-balanced agility, reliable shields, and versatile dual pulse plasma guns.',
    primaryColor: '#38bdf8', // sky-400
    accentColor: '#0284c7', // sky-600
    glowColor: 'rgba(56, 189, 248, 0.45)',
    maxSpeed: 380,
    thrustPower: 360,
    rotSpeed: 3.8,
    baseFireCooldown: 0.15, // ~6.6 shots/sec
    maxShield: 100,
    maxHealth: 100,
    shieldRechargeRate: 4,
    bulletSpeed: 660,
    bulletDamage: 1,
    specialAbility: 'Balanced handling & rapid shield recharge',
    stats: {
      speed: 3,
      firepower: 3,
      defense: 3,
      agility: 4,
    },
  },
  vanguard: {
    id: 'vanguard',
    name: 'V-22 Vanguard',
    role: 'Heavy Artillery Gunship',
    description: 'Armored multi-barrel assault vessel. Delivers high velocity heavy munitions with reinforced titanium blast shielding.',
    primaryColor: '#f59e0b', // amber-500
    accentColor: '#d97706', // amber-600
    glowColor: 'rgba(245, 158, 11, 0.45)',
    maxSpeed: 320,
    thrustPower: 300,
    rotSpeed: 3.0,
    baseFireCooldown: 0.22, // slower but hits harder
    maxShield: 140,
    maxHealth: 150,
    shieldRechargeRate: 2.5,
    bulletSpeed: 740,
    bulletDamage: 2, // 2x damage per shot!
    specialAbility: 'Double-damage kinetic cannon & fortified hull',
    stats: {
      speed: 2,
      firepower: 5,
      defense: 5,
      agility: 2,
    },
  },
  phantom: {
    id: 'phantom',
    name: 'X-99 Phantom',
    role: 'Hyper-Speed Stealth Fighter',
    description: 'Ultra-light experimental speedster. Exceptional turning rates and rapid-fire needle blasters, but reduced structural plating.',
    primaryColor: '#a855f7', // purple-500
    accentColor: '#7e22ce', // purple-700
    glowColor: 'rgba(168, 85, 247, 0.45)',
    maxSpeed: 460,
    thrustPower: 450,
    rotSpeed: 4.8,
    baseFireCooldown: 0.10, // ~10 shots/sec high rate
    maxShield: 75,
    maxHealth: 75,
    shieldRechargeRate: 5,
    bulletSpeed: 700,
    bulletDamage: 0.9,
    specialAbility: 'Hyper thruster velocity & ultra-rapid fire',
    stats: {
      speed: 5,
      firepower: 4,
      defense: 2,
      agility: 5,
    },
  },
  titan: {
    id: 'titan',
    name: 'T-80 Aegis Titan',
    role: 'Bastion Dreadnought',
    description: 'Monolithic fortress ship featuring automated deflector energy barriers and heavy twin plasma spread cannons.',
    primaryColor: '#10b981', // emerald-500
    accentColor: '#047857', // emerald-700
    glowColor: 'rgba(16, 185, 129, 0.45)',
    maxSpeed: 290,
    thrustPower: 280,
    rotSpeed: 2.7,
    baseFireCooldown: 0.18,
    maxShield: 180,
    maxHealth: 180,
    shieldRechargeRate: 6,
    bulletSpeed: 620,
    bulletDamage: 1.4,
    specialAbility: 'Immense 180 HP shields & rapid self-repair',
    stats: {
      speed: 1,
      firepower: 4,
      defense: 5,
      agility: 2,
    },
  },
};
