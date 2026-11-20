import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { severityMeta } from '../../engine/orbitalSim';
import { MissionState, TelemetrySeverity } from '../../types/mission';

interface SubsystemsPowerScreenProps {
  state: MissionState;
  onSetSubsystemStatus: (id: string, status: TelemetrySeverity) => void;
  onRunSelfTest: (id: string) => void;
}

export const SubsystemsPowerScreen: React.FC<SubsystemsPowerScreenProps> = ({
  state,
  onSetSubsystemStatus,
  onRunSelfTest,
}) => {
  const [hoverSampleIdx, setHoverSampleIdx] = useState<number | null>(null);

  // Spider / Radar Chart math for 6 subsystems
  const cx = 155;
  const cy = 140;
  const maxR = 96;
  const count = state.subsystems.length;

  const radarPoint = (idx: number, pct: number) => {
    const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
    const r = (Math.max(20, Math.min(100, pct)) / 100) * maxR;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const livePolygon = state.subsystems
    .map((s, i) => {
      const pt = radarPoint(i, s.calibrationPct);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const baselinePolygon = state.subsystems
    .map((s, i) => {
      const pt = radarPoint(i, s.baselinePct);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  // Multi-channel waveform helper
  const renderWaveformPath = (
    values: number[],
    minVal: number,
    maxVal: number,
    w: number,
    h: number
  ) => {
    if (values.length < 2) return '';
    return values
      .map((v, idx) => {
        const x = (idx / (values.length - 1)) * w;
        const norm = Math.max(0, Math.min(1, (v - minVal) / (maxVal - minVal || 1)));
        const y = h - 6 - norm * (h - 12);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const history = state.history;
  const currentSample =
    hoverSampleIdx !== null && history[hoverSampleIdx]
      ? history[hoverSampleIdx]
      : history[history.length - 1];

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto">
      {/* Top Power & Thermal KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div className="hud-panel-locked p-3">
          <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            Main Bus Voltage
          </div>
          <div className="mt-1 font-mono text-[22px] leading-[26px] font-semibold text-white">
            {state.busVoltageV.toFixed(2)}
            <span className="text-[11px] font-normal text-[#94A3B8] ml-1.5">VDC</span>
          </div>
        </div>
        <div className="hud-panel p-3">
          <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            Solar Array Generation
          </div>
          <div className="mt-1 font-mono text-[22px] leading-[26px] font-semibold text-[#00F0FF]">
            {state.solarOutputKw.toFixed(2)}
            <span className="text-[11px] font-normal text-[#94A3B8] ml-1.5">kW</span>
          </div>
        </div>
        <div className="hud-panel p-3">
          <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            Battery State of Charge
          </div>
          <div className="mt-1 font-mono text-[22px] leading-[26px] font-semibold text-[#00E676]">
            {state.batterySocPct.toFixed(1)}
            <span className="text-[11px] font-normal text-[#94A3B8] ml-1.5">%</span>
          </div>
        </div>
        <div className="hud-panel p-3">
          <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            Core Thermal Bus
          </div>
          <div
            className={`mt-1 font-mono text-[22px] leading-[26px] font-semibold ${
              state.coreThermalC > 60
                ? 'text-[#FF3B30]'
                : state.coreThermalC > 50
                  ? 'text-[#FFC107]'
                  : 'text-white'
            }`}
          >
            {state.coreThermalC.toFixed(1)}
            <span className="text-[11px] font-normal text-[#94A3B8] ml-1.5">°C</span>
          </div>
        </div>
      </div>

      {/* Middle Section: 6-Axis Spider Calibration + Subsystem Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Spider / Radar Calibration Chart */}
        <div className="lg:col-span-4 hud-panel p-4 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Subsystem Calibration Envelope
            </span>
            <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
          </div>
          <p className="text-xs text-[#94A3B8] mb-2">
            Live readiness versus baseline qualification envelope (0–100%)
          </p>

          <div className="flex-1 flex items-center justify-center bg-[#080B11] rounded border border-[#94A3B8]/12 p-2">
            <svg viewBox="0 0 310 280" className="w-full max-w-[300px] h-auto">
              {/* Polygonal Grid Rings */}
              {[40, 60, 80, 100].map((ring) => {
                const pts = state.subsystems
                  .map((_, i) => {
                    const p = radarPoint(i, ring);
                    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={ring}
                    points={pts}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Radial Axes & Vertex Labels */}
              {state.subsystems.map((sub, i) => {
                const edge = radarPoint(i, 100);
                const labelPt = radarPoint(i, 118);
                return (
                  <g key={sub.id}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={edge.x}
                      y2={edge.y}
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeWidth="0.8"
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y + 3}
                      textAnchor="middle"
                      fill="#B9CACB"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      fontWeight="600"
                    >
                      {sub.code}
                    </text>
                  </g>
                );
              })}

              {/* Baseline Qualification Polygon */}
              <polygon
                points={baselinePolygon}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              {/* Live Calibration Polygon */}
              <polygon
                points={livePolygon}
                fill="rgba(0, 240, 255, 0.18)"
                stroke="#00F0FF"
                strokeWidth="1.8"
              />

              {/* Vertices */}
              {state.subsystems.map((sub, i) => {
                const pt = radarPoint(i, sub.calibrationPct);
                const sev = severityMeta(sub.status);
                return (
                  <circle
                    key={sub.id}
                    cx={pt.x}
                    cy={pt.y}
                    r={3.5}
                    fill={sev.hex}
                    stroke="#080B11"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Subsystem Diagnostic Matrix with Anomaly Testing */}
        <div className="lg:col-span-8 hud-panel p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Vehicle Subsystem Diagnostic Matrix
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Run calibration self-tests or inject fault states to verify alert propagation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 overflow-y-auto pr-1">
            {state.subsystems.map((sub) => {
              const sev = severityMeta(sub.status);
              return (
                <div
                  key={sub.id}
                  className={`p-3 rounded-[3px] border bg-[#080B11]/75 flex flex-col justify-between gap-2 ${
                    sub.status === 'critical'
                      ? 'border-[#FF3B30]/60'
                      : sub.status === 'advisory'
                        ? 'border-[#FFC107]/50'
                        : 'border-[#94A3B8]/16'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#00F0FF]">{sub.code}</span>
                        <span className="text-xs font-semibold text-white">{sub.name}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{sub.detailNote}</p>
                    </div>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] border shrink-0 ${sev.textClass} ${sev.borderClass} ${sev.bgClass}`}
                    >
                      {sev.glyph} {sev.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-[#94A3B8]/10 font-mono text-[11px]">
                    <div>
                      <div className="text-[9px] uppercase text-[#94A3B8]">Calib</div>
                      <div className="text-white">{sub.calibrationPct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-[#94A3B8]">Temp</div>
                      <div className="text-white">{sub.temperatureC.toFixed(1)} °C</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        {sub.primaryMetricLabel}
                      </div>
                      <div className="text-[#00F0FF] truncate">{sub.primaryMetricValue}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onRunSelfTest(sub.id)}
                      className="px-2 py-1 rounded-[2px] border border-[#00F0FF]/35 bg-[#00F0FF]/10 text-[#00F0FF] font-mono text-[10px] hover:bg-[#00F0FF]/20 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Self-Test
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSetSubsystemStatus(sub.id, 'nominal')}
                        title="Restore Nominal"
                        className={`px-1.5 py-1 rounded-[2px] font-mono text-[10px] border transition-colors ${
                          sub.status === 'nominal'
                            ? 'border-[#00E676]/60 text-[#00E676] bg-[#00E676]/10'
                            : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-[#00E676]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                        Nom
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetSubsystemStatus(sub.id, 'advisory')}
                        title="Inject Caution State"
                        className={`px-1.5 py-1 rounded-[2px] font-mono text-[10px] border transition-colors ${
                          sub.status === 'advisory'
                            ? 'border-[#FFC107]/60 text-[#FFC107] bg-[#FFC107]/10'
                            : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-[#FFC107]'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                        Warn
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetSubsystemStatus(sub.id, 'critical')}
                        title="Inject Critical Fault"
                        className={`px-1.5 py-1 rounded-[2px] font-mono text-[10px] border transition-colors ${
                          sub.status === 'critical'
                            ? 'border-[#FF3B30]/60 text-[#FF3B30] bg-[#FF3B30]/10'
                            : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-[#FF3B30]'
                        }`}
                      >
                        Fault
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Multi-Channel Time-Series Waveforms */}
      <div className="hud-panel p-3.5 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
            Synchronized Telemetry Channels (48-Sample Rolling Window)
          </span>
          {currentSample && (
            <div className="font-mono text-[11px] flex items-center gap-4 text-[#B9CACB]">
              <span>
                BUS <strong className="text-[#00F0FF]">{currentSample.busCurrentA.toFixed(1)} A</strong>
              </span>
              <span>
                RW <strong className="text-[#00E676]">{currentSample.reactionWheelRpm.toFixed(0)} RPM</strong>
              </span>
              <span>
                TEMP <strong className="text-[#FF6B35]">{currentSample.avionicsTempC.toFixed(1)} °C</strong>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: 'Main Bus Current (A)',
              values: history.map((h) => h.busCurrentA),
              min: 34,
              max: 62,
              color: '#00F0FF',
              latest: `${currentSample.busCurrentA.toFixed(1)} A`,
            },
            {
              title: 'Reaction Wheel Speed (RPM)',
              values: history.map((h) => h.reactionWheelRpm),
              min: 1760,
              max: 1920,
              color: '#00E676',
              latest: `${currentSample.reactionWheelRpm.toFixed(0)} RPM`,
            },
            {
              title: 'Avionics Core Temp (°C)',
              values: history.map((h) => h.avionicsTempC),
              min: 35,
              max: 75,
              color: '#FF6B35',
              latest: `${currentSample.avionicsTempC.toFixed(1)} °C`,
            },
          ].map((ch) => (
            <div
              key={ch.title}
              className="bg-[#080B11] border border-[#94A3B8]/15 rounded-[2px] p-2"
            >
              <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                <span className="text-[#94A3B8]">{ch.title}</span>
                <span style={{ color: ch.color }}>{ch.latest}</span>
              </div>
              <svg
                viewBox="0 0 260 54"
                className="w-full h-12 cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const rel = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setHoverSampleIdx(Math.round(rel * (history.length - 1)));
                }}
                onMouseLeave={() => setHoverSampleIdx(null)}
              >
                <line
                  x1="0"
                  y1="27"
                  x2="260"
                  y2="27"
                  stroke="rgba(148,163,184,0.12)"
                  strokeDasharray="2 3"
                />
                <path
                  d={renderWaveformPath(ch.values, ch.min, ch.max, 260, 54)}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="1.6"
                />
                {hoverSampleIdx !== null && (
                  <line
                    x1={(hoverSampleIdx / Math.max(1, history.length - 1)) * 260}
                    y1={0}
                    x2={(hoverSampleIdx / Math.max(1, history.length - 1)) * 260}
                    y2={54}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="1"
                  />
                )}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
