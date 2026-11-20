import React, { useMemo, useState } from 'react';
import { Radio, Send, Terminal } from 'lucide-react';
import { severityMeta } from '../../engine/orbitalSim';
import { MissionState, TelemetrySeverity } from '../../types/mission';

interface CommsTimelineScreenProps {
  state: MissionState;
  onSelectStation: (stationId: string) => void;
  onTransmitCommand: (cmd: string) => void;
}

const QUICK_COMMANDS = [
  'PING TRANSPONDER',
  'SYNC STAR TRACKER',
  'DUMP TELEMETRY',
  'CALIBRATE KA-DISH',
];

function heatmapCellColor(val: number): string {
  // Discrete monochromatic Cyan-to-Amber step ramp (0..30 dB)
  if (val >= 26) return '#00F0FF';
  if (val >= 22) return '#00B8CC';
  if (val >= 18) return '#007C8C';
  if (val >= 14) return '#1E4E68';
  if (val >= 10) return '#FFC107';
  return '#FF6B35';
}

export const CommsTimelineScreen: React.FC<CommsTimelineScreenProps> = ({
  state,
  onSelectStation,
  onTransmitCommand,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | TelemetrySeverity>('all');
  const [commandInput, setCommandInput] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{
    freqGhz: string;
    slotLabel: string;
    snr: number;
  } | null>(null);

  const activeStation =
    state.groundStations.find((g) => g.id === state.activeStationId) ??
    state.groundStations[0];

  const filteredEvents = useMemo(() => {
    if (severityFilter === 'all') return state.events;
    return state.events.filter((e) => e.severity === severityFilter);
  }, [state.events, severityFilter]);

  // Build deterministic spectrographic heatmap grid (8 frequency channels x 16 time bins)
  const spectrumGrid = useMemo(() => {
    const baseSnr = activeStation.snrDb || 18;
    const phase = Math.floor(state.metSeconds / 2);
    const rows = 8;
    const cols = 16;
    const matrix: { freqGhz: string; cells: { slot: number; snr: number }[] }[] = [];

    for (let r = 0; r < rows; r++) {
      const freqGhz = (31.8 + r * 0.15).toFixed(2);
      const cells: { slot: number; snr: number }[] = [];
      for (let c = 0; c < cols; c++) {
        const wave = Math.sin((c + phase) * 0.45 + r * 0.7) * 4.2;
        const centerBoost = r === 3 || r === 4 ? 3.5 : r === 2 || r === 5 ? 1.5 : -2.5;
        const snr = Number(Math.max(6, Math.min(30, baseSnr + centerBoost + wave)).toFixed(1));
        cells.push({ slot: c, snr });
      }
      matrix.push({ freqGhz, cells });
    }
    return matrix;
  }, [activeStation.snrDb, state.metSeconds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commandInput.trim();
    if (!trimmed) return;
    onTransmitCommand(trimmed);
    setCommandInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full min-h-0">
      {/* Left Column: DSN Ground Station Pass Matrix */}
      <section className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
        <div className="hud-panel-locked p-3.5 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
                Deep Space Network Passes
              </span>
              <h2 className="text-sm font-semibold text-white mt-0.5">
                Ground Station Link Matrix
              </h2>
            </div>
            <Radio className="w-4 h-4 text-[#00F0FF]" />
          </div>

          <div className="flex flex-col gap-2.5">
            {state.groundStations.map((st) => {
              const isLocked = st.id === state.activeStationId;
              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-[3px] border transition-colors ${
                    isLocked
                      ? 'border-[#00F0FF]/65 bg-[#00F0FF]/10 shadow-[inset_0_1px_0_0_rgba(0,240,255,0.5)]'
                      : 'border-[#94A3B8]/15 bg-[#080B11]/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-semibold text-white">{st.name}</div>
                      <div className="font-mono text-[10px] text-[#94A3B8]">{st.band}</div>
                    </div>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[2px] border ${
                        isLocked
                          ? 'text-[#00F0FF] border-[#00F0FF]/50 bg-[#00F0FF]/12'
                          : st.visible
                            ? 'text-[#00E676] border-[#00E676]/35 bg-[#00E676]/10'
                            : 'text-[#94A3B8] border-[#94A3B8]/25 bg-[#080B11]'
                      }`}
                    >
                      {isLocked
                        ? '● Locked'
                        : st.visible
                          ? '● Visible'
                          : `AOS ${st.aosCountdownMin}m`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-[#94A3B8]/12 font-mono text-[11px]">
                    <div>
                      <div className="text-[9px] text-[#94A3B8] uppercase">Elev</div>
                      <div className="text-white">{st.elevationDeg.toFixed(1)}°</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#94A3B8] uppercase">SNR</div>
                      <div className={st.snrDb > 18 ? 'text-[#00E676]' : 'text-[#FFC107]'}>
                        {st.visible ? `${st.snrDb.toFixed(1)} dB` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#94A3B8] uppercase">Rate</div>
                      <div className="text-white">
                        {st.visible ? `${st.packetRateKbps}k` : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#94A3B8] uppercase">RTT</div>
                      <div className="text-[#B9CACB]">
                        {st.visible ? `${st.latencyMs}ms` : '--'}
                      </div>
                    </div>
                  </div>

                  {!isLocked && (
                    <button
                      type="button"
                      disabled={!st.visible}
                      onClick={() => onSelectStation(st.id)}
                      className="mt-2.5 w-full py-1.5 rounded-[2px] border border-[#00F0FF]/40 bg-[#00F0FF]/8 text-[#00F0FF] font-mono text-[10px] uppercase tracking-wider hover:bg-[#00F0FF]/18 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                    >
                      {st.visible ? 'Handover Carrier Lock' : 'Below Horizon'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Center Column: Spectrographic SNR Heatmap & Link Metrics */}
      <section className="lg:col-span-4 flex flex-col gap-3 min-h-0">
        <div className="hud-panel p-3.5 grid grid-cols-2 gap-3 shrink-0">
          <div>
            <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Frame Integrity
            </div>
            <div className="mt-1 font-mono text-[22px] leading-[26px] font-semibold text-[#00E676]">
              {state.packetIntegrityPct.toFixed(2)}
              <span className="text-[11px] font-normal text-[#94A3B8] ml-1">%</span>
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
              Bit Error Rate
            </div>
            <div className="mt-1 font-mono text-[22px] leading-[26px] font-semibold text-white">
              {state.bitErrorRate}
            </div>
          </div>
        </div>

        {/* Spectrographic SNR Heatmap */}
        <div className="hud-panel-locked p-4 flex-1 flex flex-col min-h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">
                Downlink RF Spectrum
              </span>
              <h3 className="text-sm font-semibold text-white">
                Carrier SNR Heatmap · {activeStation.name}
              </h3>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center bg-[#080B11] rounded border border-[#94A3B8]/12 p-3">
            <div className="flex flex-col gap-[2px]">
              {spectrumGrid.map((row) => (
                <div key={row.freqGhz} className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-[#94A3B8] w-14 shrink-0 text-right">
                    {row.freqGhz}G
                  </span>
                  <div className="flex-1 grid grid-cols-16 gap-[2px]">
                    {row.cells.map((cell) => (
                      <div
                        key={cell.slot}
                        onMouseEnter={() =>
                          setHoveredCell({
                            freqGhz: `${row.freqGhz} GHz`,
                            slotLabel: `T-${(15 - cell.slot) * 2}s`,
                            snr: cell.snr,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className="h-5 rounded-[1px] cursor-crosshair transition-transform duration-100 hover:scale-110"
                        style={{ backgroundColor: heatmapCellColor(cell.snr) }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Discrete Color Scale Legend */}
            <div className="mt-4 pt-3 border-t border-[#94A3B8]/15 flex items-center justify-between font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#94A3B8]">6 dB</span>
                {['#FF6B35', '#FFC107', '#1E4E68', '#007C8C', '#00B8CC', '#00F0FF'].map((c) => (
                  <span key={c} className="w-4 h-2.5 rounded-[1px]" style={{ backgroundColor: c }} />
                ))}
                <span className="text-[#00F0FF]">30 dB</span>
              </div>
              <div className="text-[#B9CACB]">
                {hoveredCell
                  ? `${hoveredCell.freqGhz} · ${hoveredCell.slotLabel} · ${hoveredCell.snr} dB`
                  : 'Hover bin to inspect'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Mission Event Log & Command Uplink Console */}
      <section className="lg:col-span-4 flex flex-col gap-3 min-h-0">
        <div className="hud-panel p-3.5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
              Telemetry Event Stream
            </span>

            <div className="flex items-center gap-1">
              {(['all', 'nominal', 'advisory', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded-[2px] font-mono text-[10px] uppercase transition-colors ${
                    severityFilter === sev
                      ? 'bg-[#00F0FF] text-[#080B11] font-semibold'
                      : 'bg-[#080B11] text-[#94A3B8] hover:text-white border border-[#94A3B8]/15'
                  }`}
                >
                  {sev === 'advisory' ? 'Warn' : sev}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[200px]">
            {filteredEvents.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-[#94A3B8]">
                No telemetry events match current filter.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const meta = severityMeta(ev.severity);
                return (
                  <div
                    key={ev.id}
                    className="p-2 rounded-[2px] border border-[#94A3B8]/12 bg-[#080B11]/75 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-[#94A3B8]">
                        {ev.met} · <strong className="text-[#00F0FF]">{ev.source}</strong>
                      </span>
                      <span className={meta.textClass}>
                        {meta.glyph} {meta.label}
                      </span>
                    </div>
                    <div className="font-sans text-xs text-[#E0E2EB] leading-snug">
                      {ev.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Command Uplink Console */}
          <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-[#94A3B8]/15">
            <div className="font-mono text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8] mb-1.5">
              Command Uplink Dispatch
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => onTransmitCommand(cmd)}
                  className="px-2 py-1 rounded-[2px] border border-[#94A3B8]/20 bg-[#080B11] font-mono text-[10px] text-[#B9CACB] hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Enter spacecraft telecommand..."
                className="cockpit-input flex-1 px-2.5 py-2 text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded bg-[#00F0FF] text-[#080B11] text-xs font-semibold flex items-center gap-1.5 hover:shadow-[0_0_14px_rgba(0,240,255,0.4)] transition-all whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Uplink</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
