import React from 'react';
import { ArrowUpRight, Compass, Flame, Navigation } from 'lucide-react';
import { formatCountdown, severityMeta } from '../../engine/orbitalSim';
import { ConsoleScreen, MissionState } from '../../types/mission';
import { OrbitalRadarCanvas } from '../OrbitalRadarCanvas';

interface OrbitTrajectoryScreenProps {
  state: MissionState;
  onSelectTarget: (id: string) => void;
  onNavigate: (screen: ConsoleScreen) => void;
}

export const OrbitTrajectoryScreen: React.FC<OrbitTrajectoryScreenProps> = ({
  state,
  onSelectTarget,
  onNavigate,
}) => {
  const target =
    state.targets.find((t) => t.id === state.selectedTargetId) ?? state.targets[0];
  const targetSev = severityMeta(target.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0">
      {/* Left Instrument Column: Fleet Lock + Orbital Elements + Attitude Indicator */}
      <section className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
        {/* Target Vehicle Selector */}
        <div className="hud-panel-locked p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Tracked Vehicles
            </span>
            <span className={`font-mono text-[10px] ${targetSev.textClass}`}>
              {targetSev.glyph} {targetSev.label}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {state.targets.map((v) => {
              const active = v.id === target.id;
              const sev = severityMeta(v.status);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectTarget(v.id)}
                  className={`w-full text-left px-3 py-2 rounded-[3px] border transition-all duration-150 flex items-center justify-between ${
                    active
                      ? 'border-[#00F0FF]/60 bg-[#00F0FF]/10 shadow-[inset_0_1px_0_0_rgba(0,240,255,0.45)]'
                      : 'border-[#94A3B8]/15 bg-[#080B11]/65 hover:border-[#00F0FF]/35'
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-white">
                      {v.callsign}
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">{v.designation}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-[10px] ${sev.textClass}`}>
                      {sev.glyph} {sev.label}
                    </div>
                    <div className="font-mono text-[10px] text-[#94A3B8]">
                      {v.altitudeKm.toFixed(0)} km
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orbital Elements Matrix */}
        <div className="hud-panel p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Keplerian Elements
            </span>
            <Navigation className="w-3.5 h-3.5 text-[#00F0FF]" />
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                Apoapsis
              </div>
              <div className="font-mono text-sm font-medium text-white">
                {target.elements.apoapsisKm.toFixed(1)}{' '}
                <span className="text-[11px] text-[#94A3B8]">km</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                Periapsis
              </div>
              <div className="font-mono text-sm font-medium text-white">
                {target.elements.periapsisKm.toFixed(1)}{' '}
                <span className="text-[11px] text-[#94A3B8]">km</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                Eccentricity
              </div>
              <div className="font-mono text-sm font-medium text-white">
                {target.elements.eccentricity.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                Inclination
              </div>
              <div className="font-mono text-sm font-medium text-white">
                {target.elements.inclinationDeg.toFixed(2)}{' '}
                <span className="text-[11px] text-[#94A3B8]">deg</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                Orbital Period
              </div>
              <div className="font-mono text-sm font-medium text-white">
                {target.elements.periodMin.toFixed(1)}{' '}
                <span className="text-[11px] text-[#94A3B8]">min</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                True Anomaly
              </div>
              <div className="font-mono text-sm font-medium text-[#00F0FF]">
                {target.elements.trueAnomalyDeg.toFixed(1)}{' '}
                <span className="text-[11px] text-[#94A3B8]">deg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Attitude Indicator (Artificial Horizon) */}
        <div className="hud-panel p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Attitude &amp; Gimbal
            </span>
            <Compass className="w-3.5 h-3.5 text-[#00F0FF]" />
          </div>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 120 120" className="w-24 h-24 shrink-0">
              <defs>
                <clipPath id="horizonClip">
                  <circle cx="60" cy="60" r="50" />
                </clipPath>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="#080B11"
                stroke="rgba(0, 240, 255, 0.35)"
                strokeWidth="1.2"
              />
              <g
                clipPath="url(#horizonClip)"
                transform={`rotate(${-target.attitude.rollDeg}, 60, 60) translate(0, ${
                  target.attitude.pitchDeg * 1.4
                })`}
              >
                <rect x="0" y="-20" width="120" height="80" fill="rgba(0, 240, 255, 0.08)" />
                <rect x="0" y="60" width="120" height="80" fill="rgba(255, 107, 53, 0.1)" />
                <line x1="0" y1="60" x2="120" y2="60" stroke="#00F0FF" strokeWidth="1.2" />
                <line x1="42" y1="45" x2="78" y2="45" stroke="#94A3B8" strokeWidth="0.8" />
                <line x1="48" y1="75" x2="72" y2="75" stroke="#94A3B8" strokeWidth="0.8" />
              </g>
              {/* Fixed Boresight Crosshair */}
              <path
                d="M 38 60 L 52 60 L 56 64 M 82 60 L 68 60 L 64 64"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle cx="60" cy="60" r="1.8" fill="#FF6B35" />
            </svg>

            <div className="flex-1 grid grid-cols-1 gap-1.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#94A3B8] uppercase">Pitch</span>
                <span className="text-white">{target.attitude.pitchDeg.toFixed(2)}°</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#94A3B8] uppercase">Roll</span>
                <span className="text-white">{target.attitude.rollDeg.toFixed(2)}°</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#94A3B8] uppercase">Yaw</span>
                <span className="text-white">{target.attitude.yawDeg.toFixed(2)}°</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#94A3B8]/15">
                <span className="text-[10px] text-[#94A3B8] uppercase">Rate</span>
                <span className="text-[#00F0FF]">
                  {target.attitude.angularRateDegS.toFixed(3)} °/s
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Center Stage: ECI Orbital Trajectory & Radar Canvas */}
      <section className="lg:col-span-6 flex flex-col min-h-[440px] min-w-0">
        <OrbitalRadarCanvas
          targets={state.targets}
          selectedTargetId={state.selectedTargetId}
          onSelectTarget={onSelectTarget}
          maneuverPlan={state.maneuverPlan}
          activeBurn={state.activeBurn}
        />
      </section>

      {/* Right Column: Live Flight Kinematics + Burn Countdown + Subsystem Status */}
      <section className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto pl-0.5">
        {/* Primary Kinematics Readouts */}
        <div className="hud-panel-locked p-3.5 hud-chamfer">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Flight Kinematics
            </span>
            <span className="font-mono text-[10px] text-[#00F0FF]">10 Hz LOCK</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="pb-2.5 border-b border-[#94A3B8]/12">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">
                Instantaneous Altitude
              </div>
              <div className="mt-0.5 font-mono text-[22px] leading-[26px] font-semibold text-white">
                {target.altitudeKm.toFixed(1)}
                <span className="text-[11px] font-normal text-[#94A3B8] ml-1.5">km</span>
              </div>
            </div>

            <div className="pb-2.5 border-b border-[#94A3B8]/12">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">
                Orbital Velocity
              </div>
              <div className="mt-0.5 font-mono text-[22px] leading-[26px] font-semibold text-[#00F0FF]">
                {target.velocityKmS.toFixed(3)}
                <span className="text-[11px] font-normal text-[#94A3B8] ml-1.5">km/s</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">
                  Radial Rate
                </div>
                <div className="mt-0.5 font-mono text-base font-medium text-white">
                  {target.verticalSpeedMs >= 0 ? '+' : ''}
                  {target.verticalSpeedMs.toFixed(1)}
                  <span className="text-[10px] text-[#94A3B8] ml-1">m/s</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">
                  Delta-V Budget
                </div>
                <div className="mt-0.5 font-mono text-base font-medium text-[#00E676]">
                  {target.propulsion.remainingDeltaVMs.toFixed(0)}
                  <span className="text-[10px] text-[#94A3B8] ml-1">m/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Burn Countdown / Active Maneuver Trigger */}
        <div
          className={`p-3.5 rounded border ${
            state.activeBurn?.status === 'burning'
              ? 'bg-[#FF6B35]/12 border-[#FF6B35]/70 shadow-[inset_0_1px_0_0_rgba(255,107,53,0.6)]'
              : 'hud-panel'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#FF6B35] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              {state.activeBurn?.status === 'burning' ? 'Active Burn Telemetry' : 'Next Maneuver Window'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('propulsion')}
              className="font-mono text-[10px] text-[#00F0FF] hover:underline flex items-center gap-0.5"
            >
              Planner <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {state.activeBurn?.status === 'burning' ? (
            <div>
              <div className="font-mono text-xl font-semibold text-white">
                {state.activeBurn.appliedDeltaVMs.toFixed(1)} /{' '}
                {state.activeBurn.totalDeltaVMs.toFixed(1)}{' '}
                <span className="text-xs text-[#94A3B8]">m/s</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-[#080B11] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#FF6B35] transition-all duration-150"
                  style={{
                    width: `${Math.min(
                      100,
                      (state.activeBurn.elapsedSec / state.activeBurn.durationSec) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[20px] font-semibold text-[#FF6B35]">
                {formatCountdown(target.nextBurnCountdownSec)}
              </div>
              <div className="font-mono text-[11px] text-[#B9CACB]">
                Δv {Math.hypot(state.maneuverPlan.progradeMs, state.maneuverPlan.normalMs, state.maneuverPlan.radialMs).toFixed(1)} m/s
              </div>
            </div>
          )}
        </div>

        {/* Live Telemetry Subsystem Status Matrix */}
        <div className="hud-panel p-3.5 flex-1">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Vehicle Subsystems
            </span>
            <button
              type="button"
              onClick={() => onNavigate('subsystems')}
              className="font-mono text-[10px] text-[#00F0FF] hover:underline flex items-center gap-0.5"
            >
              Diagnostics <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {state.subsystems.map((sub) => {
              const sev = severityMeta(sub.status);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onNavigate('subsystems')}
                  className="w-full px-2.5 py-1.5 rounded-[3px] border border-[#94A3B8]/12 bg-[#080B11]/60 hover:border-[#00F0FF]/35 flex items-center justify-between transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">
                      {sub.code}
                    </span>
                    <span className="text-xs text-[#E0E2EB] truncate">{sub.name}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] border shrink-0 ${sev.textClass} ${sev.borderClass} ${sev.bgClass}`}
                  >
                    {sev.glyph} {sev.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
