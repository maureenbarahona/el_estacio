import React from 'react';
import { formatMet, formatUtcClock } from '../engine/orbitalSim';
import { MissionPhase } from '../types/mission';

interface BottomTelemetryDockProps {
  metSeconds: number;
  timeWarp: 1 | 10 | 50;
  onChangeTimeWarp: (warp: 1 | 10 | 50) => void;
  phases: MissionPhase[];
  activePhaseId: string;
  onSelectPhase: (phaseId: string) => void;
}

const WARPS: (1 | 10 | 50)[] = [1, 10, 50];

export const BottomTelemetryDock: React.FC<BottomTelemetryDockProps> = ({
  metSeconds,
  timeWarp,
  onChangeTimeWarp,
  phases,
  onSelectPhase,
}) => {
  return (
    <footer className="hud-toolbar h-12 px-4 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Left: Mission Clocks */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            MET
          </span>
          <span className="font-mono text-sm font-semibold text-white">
            {formatMet(metSeconds)}
          </span>
        </div>
        <div className="h-4 w-px bg-[#94A3B8]/20" aria-hidden="true" />
        <div className="hidden sm:flex items-baseline gap-2">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            UTC
          </span>
          <span className="font-mono text-xs text-[#B9CACB]">{formatUtcClock(metSeconds)}</span>
        </div>
      </div>

      {/* Center: Segmented Mission Timeline & Phase Badges */}
      <div className="hidden lg:flex items-center gap-1.5 flex-1 justify-center max-w-3xl">
        {phases.map((phase, idx) => {
          const isCompleted = phase.state === 'completed';
          const isActive = phase.state === 'active';
          return (
            <React.Fragment key={phase.id}>
              <button
                type="button"
                onClick={() => onSelectPhase(phase.id)}
                className={`px-2.5 py-1 rounded-[3px] border text-[11px] font-medium whitespace-nowrap shrink-0 transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? 'border-[#00F0FF]/70 bg-[#00F0FF]/12 text-[#DBFCFF] shadow-[inset_0_1px_0_0_rgba(0,240,255,0.6),0_0_12px_rgba(0,240,255,0.18)]'
                    : isCompleted
                      ? 'border-[#00E676]/30 bg-[#00E676]/8 text-[#00E676]/85 hover:border-[#00E676]/55'
                      : 'border-[#94A3B8]/15 bg-[#080B11]/60 text-[#94A3B8] hover:border-[#00F0FF]/30 hover:text-white'
                }`}
                title={`Phase Window ${phase.windowMet}`}
              >
                <span className="font-mono text-[9px] opacity-80">0{idx + 1}</span>
                <span>{phase.label}</span>
              </button>
              {idx < phases.length - 1 && (
                <div
                  className={`h-px w-4 shrink-0 ${
                    isCompleted ? 'bg-[#00E676]/45' : 'bg-[#94A3B8]/20'
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: Time Warp Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8] hidden sm:inline">
          Time Rate
        </span>
        <div className="flex items-center bg-[#080B11] border border-[#00F0FF]/20 rounded p-0.5 gap-0.5">
          {WARPS.map((warp) => {
            const active = timeWarp === warp;
            return (
              <button
                key={warp}
                type="button"
                onClick={() => onChangeTimeWarp(warp)}
                className={`px-2 py-0.5 rounded-[2px] font-mono text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#00F0FF] text-[#080B11] font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {warp}×
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
