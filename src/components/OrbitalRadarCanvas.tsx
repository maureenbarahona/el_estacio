import React, { useMemo, useRef, useState } from 'react';
import { Crosshair, Eye, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { previewManeuverElements } from '../engine/orbitalSim';
import { ActiveBurn, ManeuverPlan, OrbitalElements, SpacecraftTarget } from '../types/mission';

interface OrbitalRadarCanvasProps {
  targets: SpacecraftTarget[];
  selectedTargetId: string;
  onSelectTarget: (id: string) => void;
  maneuverPlan: ManeuverPlan;
  activeBurn: ActiveBurn | null;
}

const EARTH_RADIUS_KM = 6371;

function orbitPoint(
  elements: OrbitalElements,
  angleDeg: number,
  scalePxPerKm: number
): { x: number; y: number } {
  const ra = EARTH_RADIUS_KM + elements.apoapsisKm;
  const rp = EARTH_RADIUS_KM + elements.periapsisKm;
  const a = (ra + rp) / 2;
  const e = Math.max(0, Math.min(0.92, (ra - rp) / (ra + rp)));
  const theta = (angleDeg * Math.PI) / 180;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
  // Rotate slightly by inclination visual offset so orbits don't overlap identically
  const rotOffset = ((elements.inclinationDeg - 28.45) * Math.PI) / 180;
  const px = r * scalePxPerKm * Math.cos(theta + rotOffset);
  const py = r * scalePxPerKm * Math.sin(theta + rotOffset);
  return { x: px, y: -py };
}

function buildOrbitPath(elements: OrbitalElements, scalePxPerKm: number): string {
  const pts: string[] = [];
  for (let deg = 0; deg <= 360; deg += 4) {
    const { x, y } = orbitPoint(elements, deg, scalePxPerKm);
    pts.push(`${deg === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
}

export const OrbitalRadarCanvas: React.FC<OrbitalRadarCanvasProps> = ({
  targets,
  selectedTargetId,
  onSelectTarget,
  maneuverPlan,
  activeBurn,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showBurnPreview, setShowBurnPreview] = useState<boolean>(true);
  const [showAllTargets, setShowAllTargets] = useState<boolean>(true);
  const [cursorProbe, setCursorProbe] = useState<{
    x: number;
    y: number;
    rangeKm: number;
    azimuthDeg: number;
  } | null>(null);

  const selectedTarget = useMemo(
    () => targets.find((t) => t.id === selectedTargetId) ?? targets[0],
    [targets, selectedTargetId]
  );

  // Base scale: fit ~12,000 km radius comfortably inside 260px half-height
  const baseScale = 0.021 * zoom;
  const earthRadiusPx = EARTH_RADIUS_KM * baseScale;

  const previewElements = useMemo(() => {
    const hasManeuver =
      Math.abs(maneuverPlan.progradeMs) > 0.5 ||
      Math.abs(maneuverPlan.normalMs) > 0.5 ||
      Math.abs(maneuverPlan.radialMs) > 0.5;
    if (!hasManeuver) return null;
    return previewManeuverElements(selectedTarget.elements, maneuverPlan);
  }, [selectedTarget.elements, maneuverPlan]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Map screen pixel delta to SVG viewBox (-320..320)
    const scaleFactor = 640 / Math.min(rect.width, rect.height);
    const vx = (e.clientX - cx) * scaleFactor;
    const vy = (e.clientY - cy) * scaleFactor;
    const distPx = Math.hypot(vx, vy);
    const rangeKm = Math.max(0, distPx / baseScale - EARTH_RADIUS_KM);
    let azimuthDeg = (Math.atan2(vx, -vy) * 180) / Math.PI;
    if (azimuthDeg < 0) azimuthDeg += 360;
    setCursorProbe({
      x: vx,
      y: vy,
      rangeKm,
      azimuthDeg,
    });
  };

  const selectedPos = orbitPoint(
    selectedTarget.elements,
    selectedTarget.elements.trueAnomalyDeg,
    baseScale
  );

  // Tangent velocity direction approximation
  const aheadPos = orbitPoint(
    selectedTarget.elements,
    selectedTarget.elements.trueAnomalyDeg + 3,
    baseScale
  );
  const vDx = aheadPos.x - selectedPos.x;
  const vDy = aheadPos.y - selectedPos.y;
  const vLen = Math.hypot(vDx, vDy) || 1;
  const velVecX = (vDx / vLen) * 34;
  const velVecY = (vDy / vLen) * 34;

  return (
    <div className="relative flex-1 h-full min-h-[420px] hud-panel-locked overflow-hidden flex flex-col">
      {/* Top Overlay Toolbar */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 border-b border-[#00F0FF]/15 bg-[#0D131F]/80 z-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-bold tracking-[0.12em] uppercase text-[#00F0FF]">
            ECI Orbital Plot
          </span>
          <span className="text-[#94A3B8]/40" aria-hidden="true">
            |
          </span>
          <span className="font-mono text-[11px] text-[#B9CACB]">
            {selectedTarget.callsign} · {selectedTarget.orbitRegime}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className={`px-2 py-1 rounded-[2px] font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              showGrid
                ? 'border-[#00F0FF]/50 bg-[#00F0FF]/12 text-[#00F0FF]'
                : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setShowVectors((v) => !v)}
            className={`px-2 py-1 rounded-[2px] font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              showVectors
                ? 'border-[#00F0FF]/50 bg-[#00F0FF]/12 text-[#00F0FF]'
                : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
            }`}
          >
            Vectors
          </button>
          <button
            type="button"
            onClick={() => setShowBurnPreview((v) => !v)}
            className={`px-2 py-1 rounded-[2px] font-mono text-[10px] uppercase tracking-wider border transition-colors ${
              showBurnPreview
                ? 'border-[#FF6B35]/60 bg-[#FF6B35]/12 text-[#FF6B35]'
                : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
            }`}
          >
            Burn Arc
          </button>
          <button
            type="button"
            onClick={() => setShowAllTargets((v) => !v)}
            className={`px-2 py-1 rounded-[2px] font-mono text-[10px] uppercase tracking-wider border transition-colors flex items-center gap-1 ${
              showAllTargets
                ? 'border-[#00F0FF]/50 bg-[#00F0FF]/12 text-[#00F0FF]'
                : 'border-[#94A3B8]/20 text-[#94A3B8] hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            Fleet
          </button>

          <div className="h-4 w-px bg-[#94A3B8]/20 mx-1" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.15).toFixed(2))))}
            aria-label="Zoom out"
            className="p-1 rounded-[2px] border border-[#94A3B8]/20 text-[#B9CACB] hover:text-[#00F0FF] hover:border-[#00F0FF]/45 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#94A3B8] w-10 text-center">
            {zoom.toFixed(1)}×
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.9, Number((z + 0.15).toFixed(2))))}
            aria-label="Zoom in"
            className="p-1 rounded-[2px] border border-[#94A3B8]/20 text-[#B9CACB] hover:text-[#00F0FF] hover:border-[#00F0FF]/45 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Reset radar zoom"
            className="p-1 rounded-[2px] border border-[#94A3B8]/20 text-[#B9CACB] hover:text-[#00F0FF] hover:border-[#00F0FF]/45 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Radar & Orbital Trajectory SVG Stage */}
      <div className="relative flex-1 bg-[#080B11] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="-340 -260 680 520"
          className="w-full h-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorProbe(null)}
        >
          <defs>
            <radialGradient id="earthGlow" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#1D4E73" />
              <stop offset="55%" stopColor="#0C2238" />
              <stop offset="100%" stopColor="#050D17" />
            </radialGradient>
            <radialGradient id="atmoRim" cx="50%" cy="50%" r="55%">
              <stop offset="82%" stopColor="rgba(0, 240, 255, 0)" />
              <stop offset="96%" stopColor="rgba(0, 240, 255, 0.28)" />
              <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
            </radialGradient>
            <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* HUD Radar Coordinate Grid & Range Rings */}
          {showGrid && (
            <g>
              {/* Orthogonal Crosshairs */}
              <line x1="-340" y1="0" x2="340" y2="0" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="0.75" />
              <line x1="0" y1="-260" x2="0" y2="260" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="0.75" />
              {/* Diagonal Axes */}
              <line
                x1="-250"
                y1="-250"
                x2="250"
                y2="250"
                stroke="rgba(148, 163, 184, 0.06)"
                strokeWidth="0.75"
                strokeDasharray="3 5"
              />
              <line
                x1="-250"
                y1="250"
                x2="250"
                y2="-250"
                stroke="rgba(148, 163, 184, 0.06)"
                strokeWidth="0.75"
                strokeDasharray="3 5"
              />

              {/* Concentric Range Rings */}
              {[1500, 3000, 5000, 7500].map((altKm) => {
                const rad = (EARTH_RADIUS_KM + altKm) * baseScale;
                return (
                  <g key={altKm}>
                    <circle
                      cx={0}
                      cy={0}
                      r={rad}
                      fill="none"
                      stroke="rgba(0, 240, 255, 0.1)"
                      strokeWidth="0.8"
                      strokeDasharray={altKm === 3000 ? undefined : '2 4'}
                    />
                    <text
                      x={4}
                      y={-rad + 10}
                      fill="#64748B"
                      fontSize="8"
                      fontFamily="JetBrains Mono"
                    >
                      +{altKm} km
                    </text>
                  </g>
                );
              })}

              {/* Outer Azimuth Degree Ticks */}
              {Array.from({ length: 36 }).map((_, idx) => {
                const deg = idx * 10;
                const rad = (deg * Math.PI) / 180;
                const rInner = 232;
                const rOuter = deg % 30 === 0 ? 242 : 237;
                return (
                  <g key={deg}>
                    <line
                      x1={Math.sin(rad) * rInner}
                      y1={-Math.cos(rad) * rInner}
                      x2={Math.sin(rad) * rOuter}
                      y2={-Math.cos(rad) * rOuter}
                      stroke="rgba(0, 240, 255, 0.25)"
                      strokeWidth={deg % 30 === 0 ? 1.1 : 0.7}
                    />
                    {deg % 90 === 0 && (
                      <text
                        x={Math.sin(rad) * 252}
                        y={-Math.cos(rad) * 252 + 3}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono"
                      >
                        {deg.toString().padStart(3, '0')}°
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Secondary Fleet Orbits */}
          {showAllTargets &&
            targets
              .filter((t) => t.id !== selectedTargetId)
              .map((t) => {
                const pos = orbitPoint(t.elements, t.elements.trueAnomalyDeg, baseScale);
                return (
                  <g
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => onSelectTarget(t.id)}
                  >
                    <path
                      d={buildOrbitPath(t.elements, baseScale)}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.28)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={4}
                      fill="#0D131F"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pos.x + 8}
                      y={pos.y + 3}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                    >
                      {t.callsign}
                    </text>
                  </g>
                );
              })}

          {/* Predicted Post-Maneuver Orbit Preview */}
          {showBurnPreview && previewElements && (
            <path
              d={buildOrbitPath(previewElements, baseScale)}
              fill="none"
              stroke="#FF6B35"
              strokeWidth="1.35"
              strokeDasharray="5 4"
              opacity={0.85}
            />
          )}

          {/* Primary Active Orbit Path */}
          <path
            d={buildOrbitPath(selectedTarget.elements, baseScale)}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="1.75"
            filter="url(#cyanGlow)"
          />

          {/* Earth Planet Sphere */}
          <g>
            <circle cx={0} cy={0} r={earthRadiusPx * 1.12} fill="url(#atmoRim)" />
            <circle
              cx={0}
              cy={0}
              r={earthRadiusPx}
              fill="url(#earthGlow)"
              stroke="rgba(0, 240, 255, 0.45)"
              strokeWidth="1"
            />
            {/* Subtle Latitude/Longitude Graticule */}
            <ellipse
              cx={0}
              cy={0}
              rx={earthRadiusPx}
              ry={earthRadiusPx * 0.35}
              fill="none"
              stroke="rgba(0, 240, 255, 0.14)"
              strokeWidth="0.6"
            />
            <ellipse
              cx={0}
              cy={0}
              rx={earthRadiusPx * 0.42}
              ry={earthRadiusPx}
              fill="none"
              stroke="rgba(0, 240, 255, 0.12)"
              strokeWidth="0.6"
            />
            <text
              x={0}
              y={3}
              textAnchor="middle"
              fill="#7DF4FF"
              fontSize="8.5"
              fontWeight="600"
              fontFamily="JetBrains Mono"
              letterSpacing="0.12em"
            >
              TERRA
            </text>
          </g>

          {/* Apoapsis & Periapsis Markers */}
          {(() => {
            const pe = orbitPoint(selectedTarget.elements, 0, baseScale);
            const ap = orbitPoint(selectedTarget.elements, 180, baseScale);
            return (
              <g>
                <circle cx={pe.x} cy={pe.y} r={3} fill="#00E676" />
                <text
                  x={pe.x + 6}
                  y={pe.y - 4}
                  fill="#00E676"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono"
                >
                  Pe {selectedTarget.elements.periapsisKm.toFixed(0)}
                </text>
                <circle cx={ap.x} cy={ap.y} r={3} fill="#FF6B35" />
                <text
                  x={ap.x + 6}
                  y={ap.y + 10}
                  fill="#FF6B35"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono"
                >
                  Ap {selectedTarget.elements.apoapsisKm.toFixed(0)}
                </text>
              </g>
            );
          })()}

          {/* Selected Target Craft + Velocity Vector + Rotating Corner Reticle */}
          <g transform={`translate(${selectedPos.x}, ${selectedPos.y})`}>
            {showVectors && (
              <g>
                <line
                  x1={0}
                  y1={0}
                  x2={velVecX}
                  y2={velVecY}
                  stroke={activeBurn?.status === 'burning' ? '#FF6B35' : '#00F0FF'}
                  strokeWidth="1.5"
                />
                <circle
                  cx={velVecX}
                  cy={velVecY}
                  r={2.2}
                  fill={activeBurn?.status === 'burning' ? '#FF6B35' : '#00F0FF'}
                />
              </g>
            )}

            {/* Rotating Corner Target Reticle */}
            <g className="reticle-spin">
              <path
                d="M -14 -7 L -14 -14 L -7 -14 M 7 -14 L 14 -14 L 14 -7 M 14 7 L 14 14 L 7 14 M -7 14 L -14 14 L -14 7"
                fill="none"
                stroke={activeBurn?.status === 'burning' ? '#FF6B35' : '#00F0FF'}
                strokeWidth="1.35"
              />
            </g>

            <circle
              cx={0}
              cy={0}
              r={4.2}
              fill={activeBurn?.status === 'burning' ? '#FF6B35' : '#00F0FF'}
            />

            {/* Dynamic Vector Readout Tag */}
            <g transform="translate(18, -12)">
              <rect
                x={0}
                y={-9}
                width={108}
                height={32}
                rx={2}
                fill="rgba(13, 19, 31, 0.88)"
                stroke="rgba(0, 240, 255, 0.35)"
                strokeWidth="0.8"
              />
              <text
                x={6}
                y={2}
                fill="#FFFFFF"
                fontSize="8.5"
                fontWeight="600"
                fontFamily="JetBrains Mono"
              >
                {selectedTarget.callsign}
              </text>
              <text x={6} y={13} fill="#00F0FF" fontSize="8" fontFamily="JetBrains Mono">
                {selectedTarget.altitudeKm.toFixed(1)}km · {selectedTarget.velocityKmS.toFixed(2)}km/s
              </text>
              <text x={6} y={21} fill="#94A3B8" fontSize="7.2" fontFamily="JetBrains Mono">
                ν {selectedTarget.elements.trueAnomalyDeg.toFixed(1)}°
              </text>
            </g>
          </g>

          {/* Interactive Crosshair Probe Line */}
          {cursorProbe && (
            <g pointerEvents="none">
              <line
                x1={0}
                y1={0}
                x2={cursorProbe.x}
                y2={cursorProbe.y}
                stroke="rgba(0, 240, 255, 0.28)"
                strokeWidth="0.75"
                strokeDasharray="2 3"
              />
              <circle
                cx={cursorProbe.x}
                cy={cursorProbe.y}
                r={3}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="0.9"
              />
            </g>
          )}
        </svg>

        {/* Bottom-Left Crosshair Probe Coordinate HUD */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-[2px] bg-[#0D131F]/88 border border-[#00F0FF]/25 backdrop-blur-md flex items-center gap-3 pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-[#00F0FF]" />
          <div className="font-mono text-[11px] text-[#B9CACB] flex items-center gap-3">
            <span>
              ALT{' '}
              <strong className="text-white font-medium">
                {cursorProbe ? `${cursorProbe.rangeKm.toFixed(0)} km` : '--- km'}
              </strong>
            </span>
            <span>
              AZ{' '}
              <strong className="text-white font-medium">
                {cursorProbe ? `${cursorProbe.azimuthDeg.toFixed(1)}°` : '---°'}
              </strong>
            </span>
          </div>
        </div>

        {/* Bottom-Right Legend */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-[2px] bg-[#0D131F]/88 border border-[#94A3B8]/20 backdrop-blur-md flex items-center gap-3 font-mono text-[10px] text-[#94A3B8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#00F0FF] inline-block" /> Active Orbit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#FF6B35] inline-block" /> Burn Preview
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E676] inline-block" /> Pe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6B35] inline-block" /> Ap
          </span>
        </div>
      </div>
    </div>
  );
};
