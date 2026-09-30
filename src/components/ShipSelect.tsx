/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShipModelId } from '../types/game';
import { SHIP_PRESETS } from '../types/ships';
import { soundManager } from '../audio/SoundEffects';
import { Shield, Zap, Gauge, Crosshair } from 'lucide-react';

interface ShipSelectProps {
  selectedModel: ShipModelId;
  onSelectModel: (modelId: ShipModelId) => void;
}

export const ShipSelect: React.FC<ShipSelectProps> = ({ selectedModel, onSelectModel }) => {
  const models: ShipModelId[] = ['interceptor', 'vanguard', 'phantom', 'titan'];

  return (
    <div className="w-full my-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-left">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-arcade uppercase tracking-wider text-sky-400">
            Hangar Bay
          </span>
          <span className="text-xs text-slate-400 font-medium">Select Battle Starship</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Selected: <strong className="text-white">{SHIP_PRESETS[selectedModel].name}</strong>
        </span>
      </div>

      {/* Grid of Ship Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {models.map((id) => {
          const ship = SHIP_PRESETS[id];
          const isSelected = selectedModel === id;

          return (
            <button
              key={id}
              onClick={() => {
                soundManager.userInteraction();
                onSelectModel(id);
              }}
              style={{
                borderColor: isSelected ? ship.primaryColor : undefined,
                boxShadow: isSelected ? `0 0 15px ${ship.glowColor}` : undefined,
              }}
              className={`p-2.5 rounded-lg border text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 ring-1 ring-white/20'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              {/* Ship Icon Mini Canvas / SVG Preview */}
              <div className="w-full h-16 flex items-center justify-center relative mb-2">
                <svg viewBox="-30 -30 60 60" className="w-14 h-14 overflow-visible drop-shadow">
                  {id === 'interceptor' && (
                    <polygon
                      points="22,0 -14,15 -7,6 -12,0 -7,-6 -14,-15"
                      fill="#0f172a"
                      stroke={ship.primaryColor}
                      strokeWidth="2.5"
                    />
                  )}
                  {id === 'vanguard' && (
                    <polygon
                      points="20,-6 20,-2 14,0 20,2 20,6 -14,18 -8,6 -16,0 -8,-6 -14,-18"
                      fill="#0f172a"
                      stroke={ship.primaryColor}
                      strokeWidth="2.5"
                    />
                  )}
                  {id === 'phantom' && (
                    <polygon
                      points="26,0 -15,12 -6,0 -15,-12"
                      fill="#0f172a"
                      stroke={ship.primaryColor}
                      strokeWidth="2.5"
                    />
                  )}
                  {id === 'titan' && (
                    <polygon
                      points="18,0 10,14 -10,17 -16,0 -10,-17 10,-14"
                      fill="#0f172a"
                      stroke={ship.primaryColor}
                      strokeWidth="2.5"
                    />
                  )}
                  {/* Cockpit dot */}
                  <ellipse cx="2" cy="0" rx="4" ry="2.5" fill={ship.primaryColor} />
                </svg>
              </div>

              {/* Title & Role */}
              <div className="mb-2">
                <div className="text-xs font-bold font-arcade tracking-tight text-white flex items-center justify-between">
                  <span>{ship.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{ship.role}</div>
              </div>

              {/* Stat bars */}
              <div className="space-y-1 text-[9px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-2.5 h-2.5 text-sky-400" /> Spd
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`w-1.5 h-1.5 rounded-[1px] ${
                          lvl <= ship.stats.speed ? 'bg-sky-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-2.5 h-2.5 text-amber-400" /> Pwr
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`w-1.5 h-1.5 rounded-[1px] ${
                          lvl <= ship.stats.firepower ? 'bg-amber-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-emerald-400" /> Def
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`w-1.5 h-1.5 rounded-[1px] ${
                          lvl <= ship.stats.defense ? 'bg-emerald-400' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Ship Ability Info Banner */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] text-slate-300">
            <strong className="text-white">Perk: </strong>
            {SHIP_PRESETS[selectedModel].specialAbility}
          </span>
        </div>
      </div>
    </div>
  );
};
