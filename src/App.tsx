/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { ControlScheme, GameState } from './types/game';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { GameOverModal, PauseMenu, StartMenu, WaveClearModal } from './components/MenuOverlays';
import { ExportModal } from './components/ExportModal';
import { soundManager } from './audio/SoundEffects';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Synchronized Game UI state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [health, setHealth] = useState<number>(100);
  const [shield, setShield] = useState<number>(100);
  const [combo, setCombo] = useState<number>(0);
  const [hasNuke, setHasNuke] = useState<boolean>(false);
  const [waveClearBonus, setWaveClearBonus] = useState<number>(500);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Audio & Controls settings
  const [sfxMuted, setSfxMuted] = useState<boolean>(soundManager.isSfxMuted());
  const [musicMuted, setMusicMuted] = useState<boolean>(soundManager.isMusicMuted());
  const [controlScheme, setControlScheme] = useState<ControlScheme>('CLASSIC');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Load initial high score
    setHighScore(engine.highScore);

    // Register engine event callbacks
    engine.onStateChange = (newState) => {
      setGameState(newState);
      if (engine) {
        setHasNuke(engine['ship']?.hasNuke || false);
      }
    };

    engine.onScoreChange = (newScore, newHighScore) => {
      setScore(newScore);
      setHighScore(newHighScore);
    };

    engine.onWaveChange = (newWave) => {
      setWave(newWave);
    };

    engine.onLivesChange = (newLives) => {
      setLives(newLives);
    };

    engine.onHealthChange = (newHealth, newShield) => {
      setHealth(newHealth);
      setShield(newShield);
      if (engine) {
        setHasNuke(engine['ship']?.hasNuke || false);
      }
    };

    engine.onComboChange = (newCombo) => {
      setCombo(newCombo);
    };

    engine.onWaveCleared = (clearedWave, bonus) => {
      setWaveClearBonus(bonus);
    };

    // Window resize handler
    const handleResize = () => {
      if (canvas && engine) {
        engine.resize(window.innerWidth, window.innerHeight);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause toggle
      if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
        if (engine.state === 'PLAYING') {
          engine.pauseGame();
        } else if (engine.state === 'PAUSED') {
          engine.resumeGame();
        }
        return;
      }

      // Prevent scrolling on gameplay keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      engine.keys[e.code] = true;
      if (e.key) {
        engine.keys[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.code] = false;
      if (e.key) {
        engine.keys[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.destroy();
    };
  }, []);

  // Sync control scheme changes
  const handleSetControlScheme = (scheme: ControlScheme) => {
    setControlScheme(scheme);
    if (engineRef.current) {
      engineRef.current.setControlScheme(scheme);
    }
  };

  const handleToggleSfx = () => {
    const isMuted = !soundManager.toggleSfx();
    setSfxMuted(isMuted);
  };

  const handleToggleMusic = () => {
    const isMuted = !soundManager.toggleMusic();
    setMusicMuted(isMuted);
  };

  const handleJoystickMove = (
    vector: { x: number; y: number; intensity: number; angle: number } | null
  ) => {
    if (engineRef.current) {
      if (vector) {
        engineRef.current.setJoystick(vector.x, vector.y, vector.intensity, vector.angle);
      } else {
        engineRef.current.setJoystick(0, 0, 0, 0);
      }
    }
  };

  const handleMobileFire = (active: boolean) => {
    if (engineRef.current) {
      engineRef.current.touchControls.fire = active;
    }
  };

  const handleMobileNuke = () => {
    if (engineRef.current) {
      engineRef.current.triggerNuke();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* In-Game HUD (Visible during gameplay and pause) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'WAVE_CLEAR') && (
        <HUD
          score={score}
          highScore={highScore}
          wave={wave}
          lives={lives}
          health={health}
          shield={shield}
          combo={combo}
          hasNuke={hasNuke}
          onPause={() => engineRef.current?.pauseGame()}
          sfxMuted={sfxMuted}
          musicMuted={musicMuted}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* On-Screen Mobile Virtual Joystick & Touch Controls */}
      {gameState === 'PLAYING' && (
        <MobileControls
          onJoystickMove={handleJoystickMove}
          onFire={handleMobileFire}
          onNuke={handleMobileNuke}
          hasNuke={hasNuke}
        />
      )}

      {/* State Overlays */}
      {gameState === 'MENU' && (
        <StartMenu
          onStart={() => engineRef.current?.startGame()}
          highScore={highScore}
          controlScheme={controlScheme}
          onSetControlScheme={handleSetControlScheme}
          sfxMuted={sfxMuted}
          musicMuted={musicMuted}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
          onOpenExport={() => setShowExportModal(true)}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={() => engineRef.current?.resumeGame()}
          onRestart={() => engineRef.current?.startGame()}
          onMenu={() => engineRef.current?.returnToMenu()}
          sfxMuted={sfxMuted}
          musicMuted={musicMuted}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
          onOpenExport={() => setShowExportModal(true)}
        />
      )}

      {gameState === 'WAVE_CLEAR' && (
        <WaveClearModal
          wave={wave}
          bonus={waveClearBonus}
          onNextWave={() => engineRef.current?.nextWave()}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={score}
          highScore={highScore}
          wave={wave}
          asteroidsDestroyed={engineRef.current?.asteroidsDestroyed || 0}
          shotsFired={engineRef.current?.shotsFired || 0}
          shotsHit={engineRef.current?.shotsHit || 0}
          onRestart={() => engineRef.current?.startGame()}
          onMenu={() => engineRef.current?.returnToMenu()}
        />
      )}

      {/* Project Export & Source Code Viewer Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}
