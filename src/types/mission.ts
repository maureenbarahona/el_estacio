export type ConsoleScreen = 'orbit' | 'propulsion' | 'subsystems' | 'comms';

export type TelemetrySeverity = 'nominal' | 'advisory' | 'critical';

export interface OrbitalElements {
  apoapsisKm: number;
  periapsisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  periodMin: number;
  trueAnomalyDeg: number;
  semiMajorAxisKm: number;
}

export interface AttitudeVector {
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  angularRateDegS: number;
}

export interface PropulsionState {
  ispSec: number;
  thrustKn: number;
  maxThrustKn: number;
  chamberTempK: number;
  chamberPressureBar: number;
  gimbalDeg: number;
  loxMassKg: number;
  loxCapacityKg: number;
  fuelMassKg: number;
  fuelCapacityKg: number;
  rcsMassKg: number;
  rcsCapacityKg: number;
  remainingDeltaVMs: number;
}

export interface ActiveBurn {
  id: string;
  label: string;
  progradeMs: number;
  normalMs: number;
  radialMs: number;
  totalDeltaVMs: number;
  appliedDeltaVMs: number;
  durationSec: number;
  elapsedSec: number;
  status: 'armed' | 'burning' | 'completed' | 'aborted';
}

export interface ManeuverPlan {
  progradeMs: number;
  normalMs: number;
  radialMs: number;
  durationSec: number;
  gimbalTrimDeg: number;
}

export interface SpacecraftTarget {
  id: string;
  callsign: string;
  designation: string;
  orbitRegime: string;
  elements: OrbitalElements;
  altitudeKm: number;
  velocityKmS: number;
  verticalSpeedMs: number;
  attitude: AttitudeVector;
  propulsion: PropulsionState;
  nextBurnCountdownSec: number;
  status: TelemetrySeverity;
}

export interface SubsystemNode {
  id: string;
  name: string;
  code: string;
  status: TelemetrySeverity;
  calibrationPct: number;
  baselinePct: number;
  temperatureC: number;
  powerDrawKw: number;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  detailNote: string;
}

export interface GroundStation {
  id: string;
  name: string;
  band: string;
  elevationDeg: number;
  azimuthDeg: number;
  snrDb: number;
  packetRateKbps: number;
  latencyMs: number;
  visible: boolean;
  aosCountdownMin: number;
}

export interface TelemetrySample {
  timestampSec: number;
  busVoltageV: number;
  solarOutputKw: number;
  busCurrentA: number;
  reactionWheelRpm: number;
  avionicsTempC: number;
  downlinkSnrDb: number;
}

export interface MissionEvent {
  id: string;
  met: string;
  utc: string;
  source: string;
  severity: TelemetrySeverity;
  message: string;
}

export interface MissionPhase {
  id: string;
  label: string;
  state: 'completed' | 'active' | 'upcoming';
  windowMet: string;
}

export interface MissionState {
  metSeconds: number;
  isHeld: boolean;
  timeWarp: 1 | 10 | 50;
  selectedTargetId: string;
  targets: SpacecraftTarget[];
  activeBurn: ActiveBurn | null;
  maneuverPlan: ManeuverPlan;
  subsystems: SubsystemNode[];
  groundStations: GroundStation[];
  activeStationId: string;
  history: TelemetrySample[];
  events: MissionEvent[];
  phases: MissionPhase[];
  busVoltageV: number;
  solarOutputKw: number;
  batterySocPct: number;
  coreThermalC: number;
  packetIntegrityPct: number;
  bitErrorRate: string;
}
