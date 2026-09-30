/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Music, Pause } from 'lucide-react';
import { soundManager } from '../audio/SoundEffects';

interface HUDProps {
  score: number;
  highScore: number;
  wave: number;
  lives: number;
  health: number;
  shield: number;
  combo: number;
  hasNuke: boolean;
  onPause: () => void;
  sfxMuted: boolean;
  musicMuted: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  wave,
  lives,
  health,
  shield,
  combo,
  hasNuke,
  onPause,
  sfxMuted,
  musicMuted,
  onToggleSfx,
  onToggleMusic,
}) => {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 md:p-6 text-slate-100">
      {/* Zone 1: Scores */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Score</span>
          <span className="font-arcade text-2xl md:text-3xl font-bold tracking-tight text-white tabular-nums">
            {score.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Best</span>
          <span className="font-arcade font-semibold text-slate-300 tabular-nums">
            {highScore.toLocaleString()}
          </span>
          {combo > 1 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="font-arcade font-bold text-amber-400 animate-pulse">
                {combo}X COMBO
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Wave & Active Buffs */}
      <div className="flex flex-col items-center">
        <div className="font-arcade text-lg md:text-xl font-bold tracking-widest text-sky-400 uppercase">
          Wave {String(wave).padStart(2, '0')}
        </div>
        {hasNuke && (
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-400">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>EMP READY [B]</span>
          </div>
        )}
      </div>

      {/* Zone 3: Vitals & System Controls */}
      <div className="flex items-center gap-4">
        {/* Vitals: Shield & Hull */}
        <div className="hidden sm:flex flex-col gap-1.5 w-28 md:w-36">
          {/* Shield bar */}
          <div className="flex items-center justify-between text-[10px] text-sky-300 font-medium">
            <span>SHIELD</span>
            <span className="tabular-nums font-mono">{Math.round(shield)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, shield))}%` }}
            />
          </div>

          {/* Hull / Lives */}
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">SHIPS</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                <svg
                  key={i}
                  className="w-3.5 h-3.5 text-emerald-400 fill-current"
                  viewBox="0 0 24 24"
                >
                  <polygon points="12 2, 2 22, 12 18, 22 22" />
                </svg>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls (Pointer enabled) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Audio SFX Toggle */}
          <button
            onClick={() => {
              soundManager.userInteraction();
              onToggleSfx();
            }}
            className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors"
            title={sfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            aria-label="Toggle Sound Effects"
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Music Toggle */}
          <button
            onClick={() => {
              soundManager.userInteraction();
              onToggleMusic();
            }}
            className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors"
            title={musicMuted ? 'Play Music' : 'Mute Music'}
            aria-label="Toggle Background Music"
          >
            <Music className={`w-4 h-4 ${musicMuted ? 'text-slate-500' : 'text-sky-400'}`} />
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-md transition-colors"
            title="Pause Game [P]"
            aria-label="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
