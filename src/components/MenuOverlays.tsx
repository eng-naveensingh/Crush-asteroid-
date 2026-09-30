/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Music, Shield, Zap, Crosshair, ChevronRight, HelpCircle, Trophy } from 'lucide-react';
import { ControlScheme, GameState } from '../types/game';
import { soundManager } from '../audio/SoundEffects';

interface StartMenuProps {
  onStart: () => void;
  highScore: number;
  controlScheme: ControlScheme;
  onSetControlScheme: (scheme: ControlScheme) => void;
  sfxMuted: boolean;
  musicMuted: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onOpenExport?: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  onStart,
  highScore,
  controlScheme,
  onSetControlScheme,
  sfxMuted,
  musicMuted,
  onToggleSfx,
  onToggleMusic,
  onOpenExport,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl my-auto flex flex-col items-center text-center">
        {/* Title */}
        <div className="mb-2">
          <span className="text-xs uppercase tracking-[0.3em] text-sky-400 font-semibold">
            Deep Space Interceptor
          </span>
          <h1 className="font-arcade text-4xl sm:text-6xl font-bold tracking-tight text-white mt-1 drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]">
            CRUSH ASTEROID
          </h1>
        </div>

        {/* High score callout */}
        <div className="flex items-center gap-2 mb-8 text-sm text-slate-300">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>All-Time High Score:</span>
          <span className="font-arcade font-bold text-amber-400 tabular-nums">
            {highScore.toLocaleString()}
          </span>
        </div>

        {/* Main action button */}
        <button
          onClick={() => {
            soundManager.userInteraction();
            onStart();
          }}
          className="w-full sm:w-72 py-3.5 px-6 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-arcade font-bold text-lg tracking-wider transition-all duration-150 shadow-lg shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>LAUNCH MISSION</span>
        </button>

        {/* Secondary options bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="py-1.5 px-3 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>{showHowToPlay ? 'Hide Guide' : 'How to Play'}</span>
          </button>

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="py-1.5 px-3 rounded-md bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-600/40 transition-colors flex items-center gap-1.5 font-medium"
              title="Copy code, view full project tree, or download files"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copy / Export Project</span>
            </button>
          )}

          {/* Control Scheme Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => onSetControlScheme('CLASSIC')}
              className={`py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
                controlScheme === 'CLASSIC'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classic Inertia
            </button>
            <button
              onClick={() => onSetControlScheme('DIRECT')}
              className={`py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
                controlScheme === 'DIRECT'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct 8-Way
            </button>
          </div>

          {/* Audio Toggles */}
          <button
            onClick={onToggleSfx}
            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggleMusic}
            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Toggle Background Music"
          >
            <Music className={`w-3.5 h-3.5 ${musicMuted ? 'text-slate-500' : 'text-sky-400'}`} />
          </button>
        </div>

        {/* How to Play Section */}
        {showHowToPlay && (
          <div className="w-full mt-6 p-5 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-xs leading-relaxed text-slate-300 transition-all duration-200">
            <h2 className="font-arcade text-sm font-bold uppercase tracking-wider text-sky-400 mb-3">
              Mission Directives & Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-white mb-1.5">Pilot Controls</p>
                <ul className="space-y-1 text-slate-400">
                  <li><strong className="text-sky-300">Virtual Joystick</strong>: 360° analog steering & thrust</li>
                  <li><strong className="text-slate-200">Arrow Keys / WASD</strong>: Keyboard steering fallback</li>
                  <li><strong className="text-amber-300">Spacebar (or Tap FIRE)</strong>: Rapid laser fire</li>
                  <li><strong className="text-rose-400">B Key (or EMP button)</strong>: Detonate EMP nuke</li>
                  <li><strong className="text-slate-200">P Key</strong>: Pause game</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-1.5">Asteroid Demolition</p>
                <ul className="space-y-1 text-slate-400">
                  <li><strong className="text-amber-400">Large Asteroids (100 pts)</strong>: Split into 2 medium pieces</li>
                  <li><strong className="text-amber-300">Medium Asteroids (60 pts)</strong>: Split into 2-3 small fragments</li>
                  <li><strong className="text-slate-200">Small Asteroids (30 pts)</strong>: Completely obliterated</li>
                  <li><strong className="text-sky-300">Combo Multiplier</strong>: Destroy targets quickly for up to 5x points!</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Blue pickups restore shields & hull</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                <span>Purple pickups grant 3-way spread cannons</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Yellow pickups trigger turbo fire rate</span>
              </span>
            </div>
          </div>
        )}

        <footer className="mt-8 text-[11px] text-slate-500">
          <span>Survive progressive asteroid belts · Stay inside boundary limits</span>
        </footer>
      </div>
    </div>
  );
};

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  sfxMuted: boolean;
  musicMuted: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onOpenExport?: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMenu,
  sfxMuted,
  musicMuted,
  onToggleSfx,
  onToggleMusic,
  onOpenExport,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <h2 className="font-arcade text-2xl font-bold tracking-wider text-sky-400 mb-6 uppercase">
          Mission Paused
        </h2>

        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-colors"
          >
            Resume Mission
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors"
          >
            Restart Wave 1
          </button>
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 font-medium text-sm border border-sky-700/50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copy / Export Project</span>
            </button>
          )}
          <button
            onClick={onMenu}
            className="w-full py-2.5 px-4 rounded-lg bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors"
          >
            Exit to Main Menu
          </button>
        </div>

        {/* Audio controls */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-800 w-full text-xs text-slate-400">
          <button
            onClick={onToggleSfx}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            <span>SFX: {sfxMuted ? 'Off' : 'On'}</span>
          </button>
          <span className="text-slate-700">·</span>
          <button
            onClick={onToggleMusic}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Music className={`w-4 h-4 ${musicMuted ? 'text-slate-500' : 'text-sky-400'}`} />
            <span>Music: {musicMuted ? 'Off' : 'On'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface WaveClearModalProps {
  wave: number;
  bonus: number;
  onNextWave: () => void;
}

export const WaveClearModal: React.FC<WaveClearModalProps> = ({ wave, bonus, onNextWave }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-6 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-2xl shadow-sky-500/10 animate-in fade-in zoom-in-95 duration-200">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
          Sector Cleared
        </span>
        <h2 className="font-arcade text-3xl font-bold tracking-tight text-white mb-2">
          WAVE {wave} COMPLETE
        </h2>

        <div className="my-4 py-2.5 px-4 rounded-lg bg-sky-950/50 border border-sky-800/60 w-full">
          <div className="text-xs text-slate-400">Sector Clear Bonus</div>
          <div className="font-arcade text-xl font-bold text-sky-300 tabular-nums">
            +{bonus.toLocaleString()} PTS
          </div>
        </div>

        <button
          onClick={onNextWave}
          className="w-full py-3 px-5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-arcade font-bold text-sm tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/25 active:scale-[0.98]"
        >
          <span>ENGAGE WAVE {wave + 1}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  score: number;
  highScore: number;
  wave: number;
  asteroidsDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  wave,
  asteroidsDestroyed,
  shotsFired,
  shotsHit,
  onRestart,
  onMenu,
}) => {
  const isNewRecord = score >= highScore && score > 0;
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-slate-900 border border-rose-900/60 shadow-2xl">
        <span className="text-xs uppercase tracking-widest text-rose-500 font-bold mb-1">
          Hull Destroyed
        </span>
        <h2 className="font-arcade text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          MISSION TERMINATED
        </h2>

        {isNewRecord && (
          <div className="mb-4 py-1 px-3 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>NEW ALL-TIME RECORD!</span>
          </div>
        )}

        {/* Score Card */}
        <div className="w-full bg-slate-950/60 rounded-xl p-4 border border-slate-800 mb-6">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Final Score</div>
          <div className="font-arcade text-4xl font-bold text-white tabular-nums mb-3">
            {score.toLocaleString()}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Wave</div>
              <div className="font-arcade font-bold text-sm text-sky-400 tabular-nums">{wave}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Destroyed</div>
              <div className="font-arcade font-bold text-sm text-amber-400 tabular-nums">
                {asteroidsDestroyed}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase">Accuracy</div>
              <div className="font-arcade font-bold text-sm text-emerald-400 tabular-nums">
                {accuracy}%
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              soundManager.userInteraction();
              onRestart();
            }}
            className="flex-1 py-3 px-5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-arcade font-bold text-sm tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>
          <button
            onClick={onMenu}
            className="flex-1 py-3 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
