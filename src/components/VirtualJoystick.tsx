/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { soundManager } from '../audio/SoundEffects';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number; intensity: number; angle: number } | null) => void;
  size?: number;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  size = 130,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxDistance = radius - 18;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      if (distance < 4) {
        setKnobPos({ x: 0, y: 0 });
        onMove(null);
        return;
      }

      const clampedDist = Math.min(distance, maxDistance);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;
      const intensity = Math.min(1, clampedDist / maxDistance);

      setKnobPos({ x: knobX, y: knobY });
      onMove({
        x: Math.cos(angle) * intensity,
        y: Math.sin(angle) * intensity,
        intensity,
        angle,
      });
    },
    [maxDistance, onMove]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    soundManager.userInteraction();
    activePointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(null);
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(null);
  };

  useEffect(() => {
    return () => {
      onMove(null);
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative rounded-full flex items-center justify-center select-none touch-none cursor-pointer transition-all duration-150 backdrop-blur-md border-2 shadow-2xl ${
        active
          ? 'bg-slate-900/80 border-sky-400/90 shadow-sky-500/30'
          : 'bg-slate-900/50 border-slate-700/60 shadow-black/60'
      }`}
      aria-label="Virtual Flight Joystick"
    >
      {/* Outer decorative ring & crosshairs */}
      <div className="absolute inset-1.5 rounded-full border border-sky-500/20 pointer-events-none" />
      <div className="absolute inset-x-3 top-1/2 h-[1px] bg-slate-700/40 pointer-events-none" />
      <div className="absolute inset-y-3 left-1/2 w-[1px] bg-slate-700/40 pointer-events-none" />

      {/* Direction indicator dots */}
      <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-sky-400/60 pointer-events-none" />
      <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-sky-400/40 pointer-events-none" />
      <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-sky-400/40 pointer-events-none" />
      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sky-400/40 pointer-events-none" />

      {/* Floating Center Thumbstick */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-75 pointer-events-none border ${
          active
            ? 'bg-gradient-to-br from-sky-400 to-blue-600 border-sky-200 text-white shadow-sky-400/50 scale-105'
            : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300 shadow-black/80'
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
};
