import {
  ActiveBurn,
  ManeuverPlan,
  MissionEvent,
  MissionState,
  OrbitalElements,
  SpacecraftTarget,
  TelemetrySample,
  TelemetrySeverity,
} from '../types/mission';

const EARTH_RADIUS_KM = 6371;
const EARTH_MU = 398600.4418; // km^3 / s^2

export function formatMet(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hrs = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `T+${pad(days)}:${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `T-${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatUtcClock(metSeconds: number): string {
  const baseEpoch = Date.UTC(2026, 10, 20, 17, 7, 53);
  const now = new Date(baseEpoch + metSeconds * 1000);
  return now.toISOString().slice(11, 19) + ' UTC';
}

export function computeOrbitalMetrics(elements: OrbitalElements): {
  altitudeKm: number;
  velocityKmS: number;
  verticalSpeedMs: number;
} {
  const ra = EARTH_RADIUS_KM + elements.apoapsisKm;
  const rp = EARTH_RADIUS_KM + elements.periapsisKm;
  const a = (ra + rp) / 2;
  const e = Math.max(0, Math.min(0.95, (ra - rp) / (ra + rp)));
  const theta = (elements.trueAnomalyDeg * Math.PI) / 180;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(theta));
  const altitudeKm = Math.max(120, r - EARTH_RADIUS_KM);
  const velocityKmS = Math.sqrt(Math.max(0.1, EARTH_MU * (2 / r - 1 / a)));
  const flightPathAngle = Math.atan2(e * Math.sin(theta), 1 + e * Math.cos(theta));
  const verticalSpeedMs = velocityKmS * 1000 * Math.sin(flightPathAngle);
  return { altitudeKm, velocityKmS, verticalSpeedMs };
}

export function previewManeuverElements(
  current: OrbitalElements,
  plan: ManeuverPlan
): OrbitalElements {
  const progradeFactor = plan.progradeMs * 1.45;
  const radialFactor = plan.radialMs * 0.55;
  const nextApoapsis = Math.max(180, current.apoapsisKm + progradeFactor + Math.abs(radialFactor));
  const nextPeriapsis = Math.max(
    160,
    Math.min(nextApoapsis, current.periapsisKm + progradeFactor * 0.25 - radialFactor * 0.4)
  );
  const ra = EARTH_RADIUS_KM + nextApoapsis;
  const rp = EARTH_RADIUS_KM + nextPeriapsis;
  const semiMajorAxisKm = (ra + rp) / 2;
  const eccentricity = Math.max(0, (ra - rp) / (ra + rp));
  const periodMin = (2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / EARTH_MU)) / 60;
  const inclinationDeg = Math.max(
    0,
    Math.min(98, current.inclinationDeg + plan.normalMs * 0.045)
  );

  return {
    ...current,
    apoapsisKm: nextApoapsis,
    periapsisKm: nextPeriapsis,
    semiMajorAxisKm,
    eccentricity,
    inclinationDeg,
    periodMin,
  };
}

function buildInitialHistory(): TelemetrySample[] {
  const samples: TelemetrySample[] = [];
  for (let i = 0; i < 48; i++) {
    const t = 14820 - (47 - i) * 2;
    samples.push({
      timestampSec: t,
      busVoltageV: 28.4 + Math.sin(i * 0.35) * 0.14,
      solarOutputKw: 14.2 + Math.cos(i * 0.22) * 0.38,
      busCurrentA: 41.8 + Math.sin(i * 0.5) * 1.6,
      reactionWheelRpm: 1840 + Math.sin(i * 0.28) * 32,
      avionicsTempC: 41.6 + Math.sin(i * 0.18) * 0.7,
      downlinkSnrDb: 24.8 + Math.cos(i * 0.4) * 1.1,
    });
  }
  return samples;
}

export function createInitialMissionState(): MissionState {
  const orionElements: OrbitalElements = {
    apoapsisKm: 1842.4,
    periapsisKm: 418.6,
    eccentricity: 0.0948,
    inclinationDeg: 28.45,
    periodMin: 108.4,
    trueAnomalyDeg: 46.2,
    semiMajorAxisKm: 7501.5,
  };
  const orionMetrics = computeOrbitalMetrics(orionElements);

  const gatewayElements: OrbitalElements = {
    apoapsisKm: 4210.0,
    periapsisKm: 3890.0,
    eccentricity: 0.0153,
    inclinationDeg: 18.2,
    periodMin: 176.2,
    trueAnomalyDeg: 194.8,
    semiMajorAxisKm: 10421.0,
  };
  const gatewayMetrics = computeOrbitalMetrics(gatewayElements);

  const relayElements: OrbitalElements = {
    apoapsisKm: 920.5,
    periapsisKm: 898.2,
    eccentricity: 0.0015,
    inclinationDeg: 51.6,
    periodMin: 103.2,
    trueAnomalyDeg: 302.5,
    semiMajorAxisKm: 7280.3,
  };
  const relayMetrics = computeOrbitalMetrics(relayElements);

  const targets: SpacecraftTarget[] = [
    {
      id: 'orion-iv',
      callsign: 'ORION-IV',
      designation: 'Cislunar Transfer Vehicle',
      orbitRegime: 'HEO Transfer',
      elements: orionElements,
      ...orionMetrics,
      attitude: {
        pitchDeg: 4.18,
        rollDeg: -0.42,
        yawDeg: 1.07,
        angularRateDegS: 0.014,
      },
      propulsion: {
        ispSec: 448.5,
        thrustKn: 0.0,
        maxThrustKn: 112.0,
        chamberTempK: 318,
        chamberPressureBar: 2.4,
        gimbalDeg: 0.0,
        loxMassKg: 4820,
        loxCapacityKg: 6400,
        fuelMassKg: 2190,
        fuelCapacityKg: 3000,
        rcsMassKg: 412,
        rcsCapacityKg: 520,
        remainingDeltaVMs: 2418.6,
      },
      nextBurnCountdownSec: 742,
      status: 'nominal',
    },
    {
      id: 'gateway-l1',
      callsign: 'GATEWAY-L1',
      designation: 'Orbital Staging Depot',
      orbitRegime: 'MEO Staging',
      elements: gatewayElements,
      ...gatewayMetrics,
      attitude: {
        pitchDeg: 0.12,
        rollDeg: 0.08,
        yawDeg: -0.19,
        angularRateDegS: 0.003,
      },
      propulsion: {
        ispSec: 326.0,
        thrustKn: 0.0,
        maxThrustKn: 24.0,
        chamberTempK: 294,
        chamberPressureBar: 1.8,
        gimbalDeg: 0.0,
        loxMassKg: 2150,
        loxCapacityKg: 3200,
        fuelMassKg: 1410,
        fuelCapacityKg: 2100,
        rcsMassKg: 685,
        rcsCapacityKg: 800,
        remainingDeltaVMs: 1140.2,
      },
      nextBurnCountdownSec: 3920,
      status: 'nominal',
    },
    {
      id: 'relay-02',
      callsign: 'RELAY-02',
      designation: 'S/Ka-Band Telemetry Node',
      orbitRegime: 'LEO Polar',
      elements: relayElements,
      ...relayMetrics,
      attitude: {
        pitchDeg: -1.35,
        rollDeg: 0.91,
        yawDeg: 2.44,
        angularRateDegS: 0.021,
      },
      propulsion: {
        ispSec: 292.0,
        thrustKn: 0.0,
        maxThrustKn: 4.5,
        chamberTempK: 301,
        chamberPressureBar: 1.4,
        gimbalDeg: 0.0,
        loxMassKg: 340,
        loxCapacityKg: 600,
        fuelMassKg: 280,
        fuelCapacityKg: 500,
        rcsMassKg: 194,
        rcsCapacityKg: 260,
        remainingDeltaVMs: 680.4,
      },
      nextBurnCountdownSec: 5180,
      status: 'advisory',
    },
  ];

  const initialEvents: MissionEvent[] = [
    {
      id: 'ev-1',
      met: 'T+00:04:07:12',
      utc: '17:07:45 UTC',
      source: 'GNC',
      severity: 'nominal',
      message: 'Star tracker quaternion lock verified (residual 0.004 deg).',
    },
    {
      id: 'ev-2',
      met: 'T+00:04:06:48',
      utc: '17:07:21 UTC',
      source: 'DSN-14',
      severity: 'nominal',
      message: 'Goldstone Ka-band carrier locked at 24.8 dB SNR.',
    },
    {
      id: 'ev-3',
      met: 'T+00:04:05:19',
      utc: '17:05:52 UTC',
      source: 'THERMAL',
      severity: 'advisory',
      message: 'Solar beta angle shift +1.4 deg; radiator loop B flow trimmed.',
    },
    {
      id: 'ev-4',
      met: 'T+00:04:01:04',
      utc: '17:01:37 UTC',
      source: 'PROP',
      severity: 'nominal',
      message: 'LOX/RP-1 propellant settling ullage check passed.',
    },
  ];

  return {
    metSeconds: 14820,
    isHeld: false,
    timeWarp: 1,
    selectedTargetId: 'orion-iv',
    targets,
    activeBurn: null,
    maneuverPlan: {
      progradeMs: 142.0,
      normalMs: 8.5,
      radialMs: -4.0,
      durationSec: 28,
      gimbalTrimDeg: 0.2,
    },
    subsystems: [
      {
        id: 'gnc',
        name: 'Guidance & Navigation',
        code: 'GNC-01',
        status: 'nominal',
        calibrationPct: 98.4,
        baselinePct: 96.0,
        temperatureC: 36.2,
        powerDrawKw: 1.85,
        primaryMetricLabel: 'Attitude Drift',
        primaryMetricValue: '0.004 deg/hr',
        detailNote: 'Dual star tracker + IMU Kalman filter converged.',
      },
      {
        id: 'prop',
        name: 'Main Propulsion',
        code: 'PROP-02',
        status: 'nominal',
        calibrationPct: 96.8,
        baselinePct: 95.0,
        temperatureC: 44.8,
        powerDrawKw: 0.92,
        primaryMetricLabel: 'Ullage Pressure',
        primaryMetricValue: '2.40 bar',
        detailNote: 'Helium pressurization manifold nominal; valves seated.',
      },
      {
        id: 'thermal',
        name: 'Thermal Control',
        code: 'TCS-03',
        status: 'nominal',
        calibrationPct: 92.1,
        baselinePct: 94.0,
        temperatureC: 42.1,
        powerDrawKw: 2.4,
        primaryMetricLabel: 'Loop Delta-T',
        primaryMetricValue: '11.4 °C',
        detailNote: 'Ammonia radiator loop A/B rejecting 4.1 kW heat load.',
      },
      {
        id: 'power',
        name: 'Electrical Power',
        code: 'EPS-04',
        status: 'nominal',
        calibrationPct: 97.5,
        baselinePct: 95.0,
        temperatureC: 38.9,
        powerDrawKw: 14.2,
        primaryMetricLabel: 'Bus Regulation',
        primaryMetricValue: '28.40 V',
        detailNote: 'Triple-junction solar wings tracking at 99.1% incidence.',
      },
      {
        id: 'comms',
        name: 'S/Ka-Band Comms',
        code: 'RF-05',
        status: 'nominal',
        calibrationPct: 95.3,
        baselinePct: 93.0,
        temperatureC: 46.5,
        powerDrawKw: 1.65,
        primaryMetricLabel: 'Link Margin',
        primaryMetricValue: '+12.6 dB',
        detailNote: 'High-gain parabolic dish slewed to Goldstone DSS-14.',
      },
      {
        id: 'eclss',
        name: 'Avionics & ECLSS',
        code: 'ECL-06',
        status: 'nominal',
        calibrationPct: 99.1,
        baselinePct: 96.0,
        temperatureC: 24.8,
        powerDrawKw: 3.12,
        primaryMetricLabel: 'Cabin Pressure',
        primaryMetricValue: '101.2 kPa',
        detailNote: 'N2/O2 partial pressure balanced; scrubber nominal.',
      },
    ],
    groundStations: [
      {
        id: 'dss-14',
        name: 'Goldstone DSS-14',
        band: 'Ka-Band 32 GHz',
        elevationDeg: 48.2,
        azimuthDeg: 214.6,
        snrDb: 24.8,
        packetRateKbps: 1240,
        latencyMs: 38,
        visible: true,
        aosCountdownMin: 0,
      },
      {
        id: 'dss-63',
        name: 'Madrid DSS-63',
        band: 'S-Band 2.2 GHz',
        elevationDeg: 14.5,
        azimuthDeg: 98.4,
        snrDb: 18.2,
        packetRateKbps: 512,
        latencyMs: 54,
        visible: true,
        aosCountdownMin: 0,
      },
      {
        id: 'dss-43',
        name: 'Canberra DSS-43',
        band: 'Ka-Band 32 GHz',
        elevationDeg: -6.4,
        azimuthDeg: 312.0,
        snrDb: 0.0,
        packetRateKbps: 0,
        latencyMs: 0,
        visible: false,
        aosCountdownMin: 18,
      },
      {
        id: 'tdrs-e',
        name: 'TDRS-East Relay',
        band: 'Ku-Band 15 GHz',
        elevationDeg: 62.7,
        azimuthDeg: 164.1,
        snrDb: 21.4,
        packetRateKbps: 860,
        latencyMs: 242,
        visible: true,
        aosCountdownMin: 0,
      },
    ],
    activeStationId: 'dss-14',
    history: buildInitialHistory(),
    events: initialEvents,
    phases: [
      { id: 'launch', label: 'Ascent & Insertion', state: 'completed', windowMet: 'T+00:00:08' },
      { id: 'checkout', label: 'Orbit Checkout', state: 'completed', windowMet: 'T+00:01:45' },
      { id: 'transfer', label: 'Transfer Coast', state: 'active', windowMet: 'T+00:04:07' },
      { id: 'apogee', label: 'Apoapsis Burn', state: 'upcoming', windowMet: 'T+00:04:19' },
      { id: 'docking', label: 'Rendezvous Dock', state: 'upcoming', windowMet: 'T+00:06:30' },
    ],
    busVoltageV: 28.4,
    solarOutputKw: 14.2,
    batterySocPct: 94.6,
    coreThermalC: 42.1,
    packetIntegrityPct: 99.94,
    bitErrorRate: '1.2e-7',
  };
}

export function stepMissionState(prev: MissionState, dtSec: number): MissionState {
  if (prev.isHeld) {
    return prev;
  }

  const effectiveDt = dtSec * prev.timeWarp;
  const nextMet = prev.metSeconds + effectiveDt;

  let nextBurn: ActiveBurn | null = prev.activeBurn ? { ...prev.activeBurn } : null;
  let burnCompletedEvent: MissionEvent | null = null;

  const nextTargets = prev.targets.map((target) => {
    const isSelected = target.id === prev.selectedTargetId;
    const meanMotionDegPerSec = 360 / (target.elements.periodMin * 60);
    // Slight Keplerian speed variation: faster near periapsis (cos theta = 1)
    const thetaRad = (target.elements.trueAnomalyDeg * Math.PI) / 180;
    const speedScale = 1 + target.elements.eccentricity * Math.cos(thetaRad);
    let nextTrueAnomaly = (target.elements.trueAnomalyDeg + meanMotionDegPerSec * speedScale * effectiveDt) % 360;
    if (nextTrueAnomaly < 0) nextTrueAnomaly += 360;

    let nextElements = {
      ...target.elements,
      trueAnomalyDeg: nextTrueAnomaly,
    };

    const nextPropulsion = { ...target.propulsion };
    let nextCountdown = Math.max(0, target.nextBurnCountdownSec - effectiveDt);

    // Process active burn on selected target
    if (isSelected && nextBurn && nextBurn.status === 'burning') {
      const burnStepSec = Math.min(effectiveDt, nextBurn.durationSec - nextBurn.elapsedSec);
      const frac = nextBurn.durationSec > 0 ? burnStepSec / nextBurn.durationSec : 1;
      const stepDv = nextBurn.totalDeltaVMs * frac;

      nextBurn.elapsedSec += burnStepSec;
      nextBurn.appliedDeltaVMs = Math.min(nextBurn.totalDeltaVMs, nextBurn.appliedDeltaVMs + stepDv);

      // Update orbit proportionally
      const apogeeGain = nextBurn.progradeMs * 1.45 * frac + Math.abs(nextBurn.radialMs) * 0.55 * frac;
      const perigeeGain = nextBurn.progradeMs * 0.25 * frac - nextBurn.radialMs * 0.4 * frac;
      const incGain = nextBurn.normalMs * 0.045 * frac;

      const nextApoapsis = Math.max(180, nextElements.apoapsisKm + apogeeGain);
      const nextPeriapsis = Math.max(160, Math.min(nextApoapsis, nextElements.periapsisKm + perigeeGain));
      const ra = EARTH_RADIUS_KM + nextApoapsis;
      const rp = EARTH_RADIUS_KM + nextPeriapsis;
      const semiMajorAxisKm = (ra + rp) / 2;
      const eccentricity = Math.max(0, (ra - rp) / (ra + rp));
      const periodMin = (2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / EARTH_MU)) / 60;

      nextElements = {
        ...nextElements,
        apoapsisKm: nextApoapsis,
        periapsisKm: nextPeriapsis,
        semiMajorAxisKm,
        eccentricity,
        periodMin,
        inclinationDeg: Math.max(0, Math.min(98, nextElements.inclinationDeg + incGain)),
      };

      // Propulsion telemetry during burn
      const throttleRatio = Math.min(1, 0.85 + Math.sin(nextBurn.elapsedSec * 2) * 0.05);
      nextPropulsion.thrustKn = nextPropulsion.maxThrustKn * throttleRatio;
      nextPropulsion.chamberTempK = Math.min(3420, 2980 + Math.sin(nextBurn.elapsedSec * 4) * 35);
      nextPropulsion.chamberPressureBar = 104.2 + Math.sin(nextBurn.elapsedSec * 3) * 1.4;
      nextPropulsion.gimbalDeg = prev.maneuverPlan.gimbalTrimDeg + Math.sin(nextBurn.elapsedSec * 1.5) * 0.12;
      nextPropulsion.remainingDeltaVMs = Math.max(0, nextPropulsion.remainingDeltaVMs - stepDv);
      nextPropulsion.loxMassKg = Math.max(0, nextPropulsion.loxMassKg - stepDv * 3.1);
      nextPropulsion.fuelMassKg = Math.max(0, nextPropulsion.fuelMassKg - stepDv * 1.4);

      if (nextBurn.elapsedSec >= nextBurn.durationSec - 0.01) {
        nextBurn.status = 'completed';
        nextPropulsion.thrustKn = 0;
        nextPropulsion.chamberTempK = 680;
        nextPropulsion.chamberPressureBar = 3.1;
        nextPropulsion.gimbalDeg = 0;
        nextCountdown = 1840;
        burnCompletedEvent = {
          id: `ev-${Date.now()}`,
          met: formatMet(nextMet),
          utc: formatUtcClock(nextMet),
          source: 'PROP',
          severity: 'nominal',
          message: `Maneuver ${nextBurn.label} complete: Δv ${nextBurn.totalDeltaVMs.toFixed(1)} m/s achieved.`,
        };
      }
    } else {
      // Cool-down chamber back toward ambient
      nextPropulsion.thrustKn = 0;
      nextPropulsion.chamberTempK = Math.max(296, nextPropulsion.chamberTempK - effectiveDt * 18);
      nextPropulsion.chamberPressureBar = Math.max(1.8, nextPropulsion.chamberPressureBar - effectiveDt * 0.6);
      nextPropulsion.gimbalDeg = 0;
    }

    const metrics = computeOrbitalMetrics(nextElements);

    // Gentle attitude micro-oscillation
    const t = nextMet * 0.4;
    const pitchDeg = target.attitude.pitchDeg + Math.sin(t) * 0.015;
    const rollDeg = target.attitude.rollDeg + Math.cos(t * 0.8) * 0.01;
    const yawDeg = target.attitude.yawDeg + Math.sin(t * 0.6) * 0.012;

    return {
      ...target,
      elements: nextElements,
      ...metrics,
      propulsion: nextPropulsion,
      nextBurnCountdownSec: nextCountdown,
      attitude: {
        ...target.attitude,
        pitchDeg: Number(pitchDeg.toFixed(2)),
        rollDeg: Number(rollDeg.toFixed(2)),
        yawDeg: Number(yawDeg.toFixed(2)),
      },
    };
  });

  // Check overall severity from subsystems
  const hasCritical = prev.subsystems.some((s) => s.status === 'critical');
  const hasAdvisory = prev.subsystems.some((s) => s.status === 'advisory');
  const activeStation = prev.groundStations.find((g) => g.id === prev.activeStationId);

  const busVoltageV = hasCritical ? 26.8 + Math.sin(nextMet) * 0.25 : 28.4 + Math.sin(nextMet * 0.3) * 0.08;
  const solarOutputKw = 14.2 + Math.cos(nextMet * 0.15) * 0.35;
  const coreThermalC = hasCritical
    ? 68.4 + Math.sin(nextMet * 0.6) * 1.1
    : hasAdvisory
      ? 53.2 + Math.sin(nextMet * 0.4) * 0.6
      : 42.1 + Math.sin(nextMet * 0.2) * 0.4;

  const newSample: TelemetrySample = {
    timestampSec: nextMet,
    busVoltageV,
    solarOutputKw,
    busCurrentA: 41.5 + (nextBurn?.status === 'burning' ? 14.2 : 0) + Math.sin(nextMet * 0.5) * 1.4,
    reactionWheelRpm: 1840 + Math.sin(nextMet * 0.3) * 28,
    avionicsTempC: coreThermalC,
    downlinkSnrDb: (activeStation?.snrDb ?? 22.0) + Math.cos(nextMet * 0.4) * 0.6,
  };

  const nextHistory = [...prev.history.slice(-47), newSample];

  const nextStations = prev.groundStations.map((st) => {
    const jitter = Math.sin(nextMet * 0.2 + st.azimuthDeg) * 0.4;
    return st.visible
      ? {
          ...st,
          snrDb: Number(Math.max(12, st.snrDb + jitter * 0.15).toFixed(1)),
          elevationDeg: Number(Math.max(5, Math.min(85, st.elevationDeg + jitter * 0.05)).toFixed(1)),
        }
      : st;
  });

  const nextEvents = burnCompletedEvent ? [burnCompletedEvent, ...prev.events].slice(0, 24) : prev.events;

  return {
    ...prev,
    metSeconds: nextMet,
    targets: nextTargets,
    activeBurn: nextBurn && nextBurn.status === 'completed' ? null : nextBurn,
    history: nextHistory,
    groundStations: nextStations,
    events: nextEvents,
    busVoltageV: Number(busVoltageV.toFixed(2)),
    solarOutputKw: Number(solarOutputKw.toFixed(2)),
    coreThermalC: Number(coreThermalC.toFixed(1)),
    batterySocPct: Number(Math.max(72, Math.min(99.8, prev.batterySocPct + Math.sin(nextMet * 0.05) * 0.02)).toFixed(1)),
  };
}

export function severityMeta(severity: TelemetrySeverity): {
  glyph: string;
  label: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  hex: string;
} {
  switch (severity) {
    case 'critical':
      return {
        glyph: '✖',
        label: 'Critical',
        textClass: 'text-[#FF3B30]',
        borderClass: 'border-[#FF3B30]/50',
        bgClass: 'bg-[#FF3B30]/10',
        hex: '#FF3B30',
      };
    case 'advisory':
      return {
        glyph: '▲',
        label: 'Caution',
        textClass: 'text-[#FFC107]',
        borderClass: 'border-[#FFC107]/45',
        bgClass: 'bg-[#FFC107]/10',
        hex: '#FFC107',
      };
    default:
      return {
        glyph: '●',
        label: 'Nominal',
        textClass: 'text-[#00E676]',
        borderClass: 'border-[#00E676]/35',
        bgClass: 'bg-[#00E676]/10',
        hex: '#00E676',
      };
  }
}
