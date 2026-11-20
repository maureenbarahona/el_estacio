import React, { useMemo, useState } from 'react';
import { Flame, Gauge, ShieldAlert, Sliders } from 'lucide-react';
import { previewManeuverElements } from '../../engine/orbitalSim';
import { ManeuverPlan, MissionState } from '../../types/mission';

interface PropulsionBurnsScreenProps {
  state: MissionState;
  onUpdatePlan: (plan: ManeuverPlan) => void;
  onExecuteBurn: () => void;
  onRequestAbortBurn: () => void;
}

const THRUST_CURVE_POINTS = [
  { throttle: 20, theoreticalIsp: 412, empiricalIsp: 406, thrustKn: 22.4 },
  { throttle: 35, theoreticalIsp: 426, empiricalIsp: 421, thrustKn: 39.2 },
  { throttle: 50, theoreticalIsp: 438, empiricalIsp: 434, thrustKn: 56.0 },
  { throttle: 65, theoreticalIsp: 444, empiricalIsp: 441, thrustKn: 72.8 },
  { throttle: 80, theoreticalIsp: 448, empiricalIsp: 446, thrustKn: 89.6 },
  { throttle: 90, theoreticalIsp: 450, empiricalIsp: 448.5, thrustKn: 100.8 },
  { throttle: 100, theoreticalIsp: 451, empiricalIsp: 447.2, thrustKn: 112.0 },
];

export const PropulsionBurnsScreen: React.FC<PropulsionBurnsScreenProps> = ({
  state,
  onUpdatePlan,
  onExecuteBurn,
  onRequestAbortBurn,
}) => {
  const target =
    state.targets.find((t) => t.id === state.selectedTargetId) ?? state.targets[0];
  const { maneuverPlan, activeBurn } = state;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const totalPlannedDv = Math.hypot(
    maneuverPlan.progradeMs,
    maneuverPlan.normalMs,
    maneuverPlan.radialMs
  );

  const predicted = useMemo(
    () => previewManeuverElements(target.elements, maneuverPlan),
    [target.elements, maneuverPlan]
  );

  const isBurning = activeBurn?.status === 'burning';

  const applyPreset = (preset: 'circularize' | 'raise' | 'plane' | 'retro') => {
    if (preset === 'circularize') {
      const diff = (target.elements.apoapsisKm - target.elements.periapsisKm) * 0.22;
      onUpdatePlan({
        progradeMs: Number(Math.min(320, Math.max(24, diff)).toFixed(1)),
        normalMs: 0,
        radialMs: -4.5,
        durationSec: 32,
        gimbalTrimDeg: 0.1,
      });
    } else if (preset === 'raise') {
      onUpdatePlan({
        progradeMs: 185.0,
        normalMs: 0,
        radialMs: 0,
        durationSec: 26,
        gimbalTrimDeg: 0.0,
      });
    } else if (preset === 'plane') {
      onUpdatePlan({
        progradeMs: 12.0,
        normalMs: 64.0,
        radialMs: 0,
        durationSec: 18,
        gimbalTrimDeg: 0.4,
      });
    } else {
      onUpdatePlan({
        progradeMs: -140.0,
        normalMs: 0,
        radialMs: 6.0,
        durationSec: 24,
        gimbalTrimDeg: -0.2,
      });
    }
  };

  // Dual-axis curve geometry
  const chartW = 540;
  const chartH = 210;
  const padL = 44;
  const padR = 44;
  const padT = 20;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const mapX = (throttle: number) => padL + ((throttle - 20) / 80) * innerW;
  const mapY = (isp: number) => padT + innerH - ((isp - 400) / 60) * innerH;

  const theoreticalPath = THRUST_CURVE_POINTS.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.throttle).toFixed(1)} ${mapY(p.theoreticalIsp).toFixed(1)}`
  ).join(' ');

  const empiricalPath = THRUST_CURVE_POINTS.map(
    (p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.throttle).toFixed(1)} ${mapY(p.empiricalIsp).toFixed(1)}`
  ).join(' ');

  const hoveredPoint = hoverIdx !== null ? THRUST_CURVE_POINTS[hoverIdx] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0">
      {/* Left Column: Maneuver Vector Inputs & Presets */}
      <section className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <div className="hud-panel-locked p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Maneuver Vector Entry
            </span>
            <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => applyPreset('circularize')}
              className="px-2 py-1.5 rounded-[2px] border border-[#94A3B8]/20 bg-[#080B11] text-[11px] font-mono text-[#B9CACB] hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
            >
              Circularize
            </button>
            <button
              type="button"
              onClick={() => applyPreset('raise')}
              className="px-2 py-1.5 rounded-[2px] border border-[#94A3B8]/20 bg-[#080B11] text-[11px] font-mono text-[#B9CACB] hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
            >
              Raise Apogee
            </button>
            <button
              type="button"
              onClick={() => applyPreset('plane')}
              className="px-2 py-1.5 rounded-[2px] border border-[#94A3B8]/20 bg-[#080B11] text-[11px] font-mono text-[#B9CACB] hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
            >
              Plane Trim
            </button>
            <button
              type="button"
              onClick={() => applyPreset('retro')}
              className="px-2 py-1.5 rounded-[2px] border border-[#94A3B8]/20 bg-[#080B11] text-[11px] font-mono text-[#B9CACB] hover:border-[#FF6B35]/60 hover:text-[#FF6B35] transition-colors"
            >
              Retrograde
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <label className="block">
              <div className="flex justify-between font-mono text-[10px] text-[#94A3B8] mb-1">
                <span className="uppercase">Prograde (Δv_p)</span>
                <span>m/s</span>
              </div>
              <input
                type="number"
                step="1"
                min="-500"
                max="500"
                value={maneuverPlan.progradeMs}
                onChange={(e) =>
                  onUpdatePlan({ ...maneuverPlan, progradeMs: Number(e.target.value) || 0 })
                }
                className="cockpit-input w-full px-2.5 py-1.5 text-sm"
              />
            </label>

            <label className="block">
              <div className="flex justify-between font-mono text-[10px] text-[#94A3B8] mb-1">
                <span className="uppercase">Normal (Δv_n)</span>
                <span>m/s</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="-250"
                max="250"
                value={maneuverPlan.normalMs}
                onChange={(e) =>
                  onUpdatePlan({ ...maneuverPlan, normalMs: Number(e.target.value) || 0 })
                }
                className="cockpit-input w-full px-2.5 py-1.5 text-sm"
              />
            </label>

            <label className="block">
              <div className="flex justify-between font-mono text-[10px] text-[#94A3B8] mb-1">
                <span className="uppercase">Radial (Δv_r)</span>
                <span>m/s</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="-250"
                max="250"
                value={maneuverPlan.radialMs}
                onChange={(e) =>
                  onUpdatePlan({ ...maneuverPlan, radialMs: Number(e.target.value) || 0 })
                }
                className="cockpit-input w-full px-2.5 py-1.5 text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <div className="font-mono text-[10px] uppercase text-[#94A3B8] mb-1">
                  Duration (s)
                </div>
                <input
                  type="number"
                  step="1"
                  min="4"
                  max="180"
                  value={maneuverPlan.durationSec}
                  onChange={(e) =>
                    onUpdatePlan({
                      ...maneuverPlan,
                      durationSec: Math.max(4, Number(e.target.value) || 4),
                    })
                  }
                  className="cockpit-input w-full px-2.5 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <div className="font-mono text-[10px] uppercase text-[#94A3B8] mb-1">
                  Gimbal (°)
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="-5"
                  max="5"
                  value={maneuverPlan.gimbalTrimDeg}
                  onChange={(e) =>
                    onUpdatePlan({
                      ...maneuverPlan,
                      gimbalTrimDeg: Number(e.target.value) || 0,
                    })
                  }
                  className="cockpit-input w-full px-2.5 py-1.5 text-sm"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#94A3B8]/15 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase text-[#94A3B8]">
              Total Impulse Δv
            </span>
            <span className="font-mono text-lg font-semibold text-[#FF6B35]">
              {totalPlannedDv.toFixed(1)}{' '}
              <span className="text-xs font-normal text-[#94A3B8]">m/s</span>
            </span>
          </div>
        </div>
      </section>

      {/* Center Column: Trajectory Delta Table + Dual-Axis Isp Efficiency Chart */}
      <section className="lg:col-span-6 flex flex-col gap-3 min-h-0">
        {/* Post-Burn Projected Orbit Table */}
        <div className="hud-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Projected Maneuver Solution · {target.callsign}
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Pre-burn Keplerian state versus integrated post-burn orbital elements
              </p>
            </div>
            <span className="font-mono text-[11px] text-[#FF6B35]">
              EST MASS COST {(totalPlannedDv * 4.5).toFixed(0)} kg
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#94A3B8]/20 text-[10px] uppercase tracking-wider text-[#94A3B8]">
                  <th className="py-2 pr-3 font-medium">Orbital Element</th>
                  <th className="py-2 px-3 font-medium">Current</th>
                  <th className="py-2 px-3 font-medium">Post-Burn</th>
                  <th className="py-2 pl-3 font-medium text-right">Net Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#94A3B8]/10">
                {[
                  {
                    label: 'Apoapsis Altitude',
                    cur: target.elements.apoapsisKm,
                    next: predicted.apoapsisKm,
                    unit: 'km',
                    digits: 1,
                  },
                  {
                    label: 'Periapsis Altitude',
                    cur: target.elements.periapsisKm,
                    next: predicted.periapsisKm,
                    unit: 'km',
                    digits: 1,
                  },
                  {
                    label: 'Eccentricity',
                    cur: target.elements.eccentricity,
                    next: predicted.eccentricity,
                    unit: '',
                    digits: 4,
                  },
                  {
                    label: 'Orbital Inclination',
                    cur: target.elements.inclinationDeg,
                    next: predicted.inclinationDeg,
                    unit: 'deg',
                    digits: 2,
                  },
                  {
                    label: 'Orbital Period',
                    cur: target.elements.periodMin,
                    next: predicted.periodMin,
                    unit: 'min',
                    digits: 1,
                  },
                ].map((row) => {
                  const delta = row.next - row.cur;
                  const deltaColor =
                    Math.abs(delta) < 0.0001
                      ? 'text-[#94A3B8]'
                      : delta > 0
                        ? 'text-[#00F0FF]'
                        : 'text-[#FF6B35]';
                  return (
                    <tr key={row.label}>
                      <td className="py-2 pr-3 text-[#E0E2EB] font-sans text-xs">{row.label}</td>
                      <td className="py-2 px-3 text-[#B9CACB]">
                        {row.cur.toFixed(row.digits)} {row.unit}
                      </td>
                      <td className="py-2 px-3 text-white font-medium">
                        {row.next.toFixed(row.digits)} {row.unit}
                      </td>
                      <td className={`py-2 pl-3 text-right ${deltaColor}`}>
                        {delta >= 0 ? '+' : ''}
                        {delta.toFixed(row.digits)} {row.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dual-Axis Efficiency & Isp Curve */}
        <div className="hud-panel-locked p-4 flex-1 flex flex-col min-h-[250px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
                Specific Impulse vs Throttle Curve
              </span>
              <div className="text-xs text-[#E0E2EB] mt-0.5">
                Theoretical Isp Model vs Empirical Chamber Telemetry
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-[#00F0FF]">
                <span className="w-3 h-0.5 bg-[#00F0FF] inline-block" /> Theoretical
              </span>
              <span className="flex items-center gap-1.5 text-[#FF6B35]">
                <span className="w-3 h-0.5 border-t border-dashed border-[#FF6B35] inline-block" />{' '}
                Empirical
              </span>
            </div>
          </div>

          <div className="relative flex-1 bg-[#080B11] rounded border border-[#94A3B8]/12 p-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full cursor-crosshair">
              {/* Horizontal Grid Lines */}
              {[410, 425, 440, 455].map((isp) => {
                const y = mapY(isp);
                return (
                  <g key={isp}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.12)"
                      strokeWidth="0.8"
                    />
                    <text
                      x={padL - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                    >
                      {isp}s
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Throttle Labels */}
              {THRUST_CURVE_POINTS.map((p) => (
                <text
                  key={p.throttle}
                  x={mapX(p.throttle)}
                  y={chartH - 10}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                >
                  {p.throttle}%
                </text>
              ))}

              {/* Curves */}
              <path d={theoreticalPath} fill="none" stroke="#00F0FF" strokeWidth="2" />
              <path
                d={empiricalPath}
                fill="none"
                stroke="#FF6B35"
                strokeWidth="1.8"
                strokeDasharray="5 4"
              />

              {/* Hover Hairline Crosshair */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={mapX(hoveredPoint.throttle)}
                    y1={padT}
                    x2={mapX(hoveredPoint.throttle)}
                    y2={chartH - padB}
                    stroke="rgba(0, 240, 255, 0.45)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={mapX(hoveredPoint.throttle)}
                    cy={mapY(hoveredPoint.theoreticalIsp)}
                    r={4}
                    fill="#00F0FF"
                  />
                  <circle
                    cx={mapX(hoveredPoint.throttle)}
                    cy={mapY(hoveredPoint.empiricalIsp)}
                    r={4}
                    fill="#FF6B35"
                  />
                </g>
              )}

              {/* Interactive Hit Targets */}
              {THRUST_CURVE_POINTS.map((p, idx) => (
                <rect
                  key={p.throttle}
                  x={mapX(p.throttle) - 24}
                  y={padT}
                  width={48}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              ))}
            </svg>

            {hoveredPoint && (
              <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-[2px] bg-[#0D131F]/95 border border-[#00F0FF]/40 font-mono text-[10px] text-[#E0E2EB] pointer-events-none">
                <div>THR {hoveredPoint.throttle}% · {hoveredPoint.thrustKn.toFixed(1)} kN</div>
                <div className="text-[#00F0FF]">THEO {hoveredPoint.theoreticalIsp.toFixed(1)} s</div>
                <div className="text-[#FF6B35]">EMP {hoveredPoint.empiricalIsp.toFixed(1)} s</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right Column: Propellant Tanks, Chamber Readouts & Burn Execution */}
      <section className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <div className="hud-panel p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Propellant Inventory
            </span>
            <Gauge className="w-3.5 h-3.5 text-[#00F0FF]" />
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                label: 'LOX Oxidizer',
                mass: target.propulsion.loxMassKg,
                cap: target.propulsion.loxCapacityKg,
                color: 'bg-[#00F0FF]',
              },
              {
                label: 'RP-1 Main Fuel',
                mass: target.propulsion.fuelMassKg,
                cap: target.propulsion.fuelCapacityKg,
                color: 'bg-[#00E676]',
              },
              {
                label: 'Hypergolic RCS',
                mass: target.propulsion.rcsMassKg,
                cap: target.propulsion.rcsCapacityKg,
                color: 'bg-[#FFC107]',
              },
            ].map((tank) => {
              const pct = Math.max(0, Math.min(100, (tank.mass / tank.cap) * 100));
              return (
                <div key={tank.label}>
                  <div className="flex items-baseline justify-between font-mono text-[11px] mb-1">
                    <span className="text-[#B9CACB]">{tank.label}</span>
                    <span className="text-white">
                      {tank.mass.toFixed(0)} <span className="text-[#94A3B8]">/ {tank.cap} kg</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#080B11] rounded-[2px] border border-[#94A3B8]/15 overflow-hidden">
                    <div
                      className={`h-full ${tank.color} transition-all duration-200`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Engine Chamber Telemetry */}
        <div className="hud-panel p-3.5">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            Engine Chamber Telemetry
          </span>
          <div className="mt-2.5 grid grid-cols-2 gap-3 font-mono">
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Thrust</div>
              <div
                className={`text-lg font-semibold ${
                  isBurning ? 'text-[#FF6B35]' : 'text-white'
                }`}
              >
                {target.propulsion.thrustKn.toFixed(1)}{' '}
                <span className="text-[10px] text-[#94A3B8]">kN</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Vacuum Isp</div>
              <div className="text-lg font-semibold text-white">
                {target.propulsion.ispSec.toFixed(1)}{' '}
                <span className="text-[10px] text-[#94A3B8]">s</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Chamber Temp</div>
              <div className="text-sm font-medium text-white">
                {target.propulsion.chamberTempK.toFixed(0)}{' '}
                <span className="text-[10px] text-[#94A3B8]">K</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#94A3B8] uppercase">Pressure</div>
              <div className="text-sm font-medium text-white">
                {target.propulsion.chamberPressureBar.toFixed(1)}{' '}
                <span className="text-[10px] text-[#94A3B8]">bar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Command Triggers */}
        <div className="hud-panel-locked p-3.5 mt-auto flex flex-col gap-2.5">
          {isBurning && activeBurn ? (
            <div className="p-2.5 rounded bg-[#FF6B35]/12 border border-[#FF6B35]/60">
              <div className="flex items-center justify-between font-mono text-xs text-[#FF6B35] mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Flame className="w-3.5 h-3.5" /> BURN IN PROGRESS
                </span>
                <span>
                  {activeBurn.elapsedSec.toFixed(1)}s / {activeBurn.durationSec}s
                </span>
              </div>
              <div className="h-2 w-full bg-[#080B11] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#FF6B35] transition-all duration-100"
                  style={{
                    width: `${Math.min(100, (activeBurn.elapsedSec / activeBurn.durationSec) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={isBurning || totalPlannedDv < 0.5 || state.isHeld}
            onClick={onExecuteBurn}
            className="w-full py-2.5 px-4 rounded bg-[#00F0FF] text-[#080B11] text-xs font-semibold tracking-wide hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {state.isHeld
              ? 'Resume Stream to Burn'
              : isBurning
                ? 'Main Engine Firing...'
                : 'Execute Planned Burn'}
          </button>

          <button
            type="button"
            disabled={!isBurning}
            onClick={onRequestAbortBurn}
            className="abort-trigger w-full py-2 px-4 rounded text-xs font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-35 disabled:pointer-events-none"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Abort Active Burn</span>
          </button>
        </div>
      </section>
    </div>
  );
};
