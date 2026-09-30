import React from 'react';
import { Crosshair, Zap } from 'lucide-react';
import { soundManager } from '../audio/SoundEffects';
import { VirtualJoystick } from './VirtualJoystick';

interface MobileControlsProps {
  onJoystickMove: (vector: { x: number; y: number; intensity: number; angle: number } | null) => void;
  onFire: (active: boolean) => void;
  onNuke: () => void;
  onCycleWeapon?: () => void;
  currentWeapon?: string;
  hasNuke: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onFire,
  onNuke,
  onCycleWeapon,
  currentWeapon,
  hasNuke,
}) => {
  const bindFire = () => {
    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        soundManager.userInteraction();
        onFire(true);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        onFire(false);
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.preventDefault();
        onFire(false);
      },
      onMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        soundManager.userInteraction();
        onFire(true);
      },
      onMouseUp: (e: React.MouseEvent) => {
        e.preventDefault();
        onFire(false);
      },
      onMouseLeave: () => {
        onFire(false);
      },
    };
  };

  return (
    <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-6 z-20 px-5 flex items-end justify-between select-none touch-none">
      {/* 360-Degree Analog Virtual Joystick (Left side) */}
      <div className="pointer-events-auto flex flex-col items-center">
        <VirtualJoystick onMove={onJoystickMove} size={135} />
        <span className="mt-1 text-[10px] font-arcade uppercase tracking-wider text-sky-400/80 drop-shadow">
          JOYSTICK
        </span>
      </div>

      {/* Action Cluster (Right side) */}
      <div className="pointer-events-auto flex items-end gap-2.5 pb-2">
        {/* Switch Weapon Button */}
        {onCycleWeapon && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              soundManager.userInteraction();
              onCycleWeapon();
            }}
            onClick={() => {
              soundManager.userInteraction();
              onCycleWeapon();
            }}
            aria-label="Switch Weapon"
            className="w-14 h-14 flex flex-col items-center justify-center rounded-2xl bg-slate-900/80 active:bg-sky-600/50 border border-sky-400/60 text-sky-300 active:scale-95 transition-transform shadow-lg shadow-sky-950/40 backdrop-blur-md"
          >
            <span className="text-[11px] font-arcade font-bold">WEP</span>
            <span className="text-[8px] font-mono text-slate-300 uppercase tracking-tighter truncate max-w-[48px]">
              {currentWeapon || 'CYCLE'}
            </span>
          </button>
        )}

        {/* Nuke Bomb Button (if acquired) */}
        {hasNuke && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              soundManager.userInteraction();
              onNuke();
            }}
            onClick={() => {
              soundManager.userInteraction();
              onNuke();
            }}
            aria-label="Detonate EMP Nuke"
            className="w-14 h-14 flex flex-col items-center justify-center rounded-2xl bg-rose-950/80 active:bg-rose-600/70 border-2 border-rose-500/80 text-rose-300 active:scale-95 transition-transform shadow-xl shadow-rose-950/60"
          >
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="text-[9px] font-arcade font-bold tracking-tight">EMP</span>
          </button>
        )}

        {/* Primary Fire Button */}
        <button
          {...bindFire()}
          aria-label="Fire Lasers"
          className="w-20 h-20 flex flex-col items-center justify-center rounded-2xl bg-amber-500/25 active:bg-amber-500/50 border-2 border-amber-400 text-amber-300 active:scale-95 transition-transform shadow-2xl shadow-amber-500/30 backdrop-blur-md"
        >
          <Crosshair className="w-8 h-8 mb-0.5" />
          <span className="text-[10px] font-arcade font-bold tracking-wider">FIRE</span>
        </button>
      </div>
    </div>
  );
};
