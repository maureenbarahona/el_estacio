/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BottomTelemetryDock } from './components/BottomTelemetryDock';
import { InterventionModal } from './components/InterventionModal';
import { TopCommandBar } from './components/TopCommandBar';
import { CommsTimelineScreen } from './components/screens/CommsTimelineScreen';
import { OrbitTrajectoryScreen } from './components/screens/OrbitTrajectoryScreen';
import { PropulsionBurnsScreen } from './components/screens/PropulsionBurnsScreen';
import { SubsystemsPowerScreen } from './components/screens/SubsystemsPowerScreen';
import {
  createInitialMissionState,
  formatMet,
  formatUtcClock,
  stepMissionState,
} from './engine/orbitalSim';
import {
  ConsoleScreen,
  ManeuverPlan,
  MissionEvent,
  MissionState,
  TelemetrySeverity,
} from './types/mission';

function makeEvent(
  metSeconds: number,
  source: string,
  severity: TelemetrySeverity,
  message: string
): MissionEvent {
  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    met: formatMet(metSeconds),
    utc: formatUtcClock(metSeconds),
    source,
    severity,
    message,
  };
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ConsoleScreen>('orbit');
  const [mission, setMission] = useState<MissionState>(() => createInitialMissionState());
  const [abortModalOpen, setAbortModalOpen] = useState(false);

  // Live 250ms telemetry tick loop
  useEffect(() => {
    const interval = window.setInterval(() => {
      setMission((prev) => stepMissionState(prev, 0.25));
    }, 250);
    return () => window.clearInterval(interval);
  }, []);

  const handleToggleHold = () => {
    setMission((prev) => {
      const nextHeld = !prev.isHeld;
      const ev = makeEvent(
        prev.metSeconds,
        'CONSOLE',
        nextHeld ? 'advisory' : 'nominal',
        nextHeld
          ? 'Telemetry propagation paused by flight controller hold.'
          : 'Live telemetry propagation resumed.'
      );
      return {
        ...prev,
        isHeld: nextHeld,
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleSelectTarget = (targetId: string) => {
    setMission((prev) => ({
      ...prev,
      selectedTargetId: targetId,
    }));
  };

  const handleUpdatePlan = (plan: ManeuverPlan) => {
    setMission((prev) => ({
      ...prev,
      maneuverPlan: plan,
    }));
  };

  const handleExecuteBurn = () => {
    setMission((prev) => {
      const { maneuverPlan, selectedTargetId, targets, metSeconds } = prev;
      const target = targets.find((t) => t.id === selectedTargetId) ?? targets[0];
      const totalDv = Math.hypot(
        maneuverPlan.progradeMs,
        maneuverPlan.normalMs,
        maneuverPlan.radialMs
      );
      if (totalDv < 0.5 || prev.isHeld) return prev;

      const label =
        maneuverPlan.progradeMs >= 0 ? 'PROGRADE-BURN' : 'RETROGRADE-BURN';

      const ev = makeEvent(
        metSeconds,
        target.callsign,
        'advisory',
        `Main engine ignition commanded: ${label} Δv ${totalDv.toFixed(1)} m/s over ${maneuverPlan.durationSec}s.`
      );

      return {
        ...prev,
        activeBurn: {
          id: `burn-${Date.now()}`,
          label,
          progradeMs: maneuverPlan.progradeMs,
          normalMs: maneuverPlan.normalMs,
          radialMs: maneuverPlan.radialMs,
          totalDeltaVMs: totalDv,
          appliedDeltaVMs: 0,
          durationSec: maneuverPlan.durationSec,
          elapsedSec: 0,
          status: 'burning',
        },
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleConfirmAbortBurn = () => {
    setAbortModalOpen(false);
    setMission((prev) => {
      if (!prev.activeBurn) return prev;
      const applied = prev.activeBurn.appliedDeltaVMs;
      const ev = makeEvent(
        prev.metSeconds,
        'ABORT',
        'critical',
        `Engine cutoff (MECO) forced by flight controller at ${applied.toFixed(1)} m/s applied Δv.`
      );
      return {
        ...prev,
        activeBurn: null,
        targets: prev.targets.map((t) =>
          t.id === prev.selectedTargetId
            ? {
                ...t,
                propulsion: {
                  ...t.propulsion,
                  thrustKn: 0,
                  gimbalDeg: 0,
                },
              }
            : t
        ),
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleSetSubsystemStatus = (id: string, status: TelemetrySeverity) => {
    setMission((prev) => {
      const targetSub = prev.subsystems.find((s) => s.id === id);
      if (!targetSub) return prev;
      const nextSubs = prev.subsystems.map((s) => {
        if (s.id !== id) return s;
        const calibrationPct =
          status === 'nominal' ? 98.2 : status === 'advisory' ? 81.4 : 58.6;
        const temperatureC =
          status === 'nominal' ? 40.5 : status === 'advisory' ? 54.8 : 71.2;
        return {
          ...s,
          status,
          calibrationPct,
          temperatureC,
        };
      });

      const worstSeverity: TelemetrySeverity = nextSubs.some((s) => s.status === 'critical')
        ? 'critical'
        : nextSubs.some((s) => s.status === 'advisory')
          ? 'advisory'
          : 'nominal';

      const ev = makeEvent(
        prev.metSeconds,
        targetSub.code,
        status,
        status === 'nominal'
          ? `${targetSub.name} restored to nominal operating envelope.`
          : status === 'advisory'
            ? `${targetSub.name} thermal/calibration drift detected; caution threshold active.`
            : `${targetSub.name} critical anomaly flagged; contingency isolation advised.`
      );

      return {
        ...prev,
        subsystems: nextSubs,
        targets: prev.targets.map((t) =>
          t.id === prev.selectedTargetId ? { ...t, status: worstSeverity } : t
        ),
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleRunSelfTest = (id: string) => {
    setMission((prev) => {
      const sub = prev.subsystems.find((s) => s.id === id);
      if (!sub) return prev;
      const ev = makeEvent(
        prev.metSeconds,
        sub.code,
        'nominal',
        `${sub.name} built-in self-test (BIST) passed; calibration coefficients updated.`
      );
      return {
        ...prev,
        subsystems: prev.subsystems.map((s) =>
          s.id === id
            ? {
                ...s,
                calibrationPct: Math.min(99.6, Number((s.calibrationPct + 1.2).toFixed(1))),
                status: s.status === 'critical' ? 'advisory' : 'nominal',
              }
            : s
        ),
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleSelectStation = (stationId: string) => {
    setMission((prev) => {
      const station = prev.groundStations.find((s) => s.id === stationId);
      if (!station || !station.visible) return prev;
      const ev = makeEvent(
        prev.metSeconds,
        'DSN',
        'nominal',
        `Carrier lock handed over to ${station.name} (${station.band}, ${station.snrDb.toFixed(1)} dB SNR).`
      );
      return {
        ...prev,
        activeStationId: stationId,
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleTransmitCommand = (cmd: string) => {
    setMission((prev) => {
      const callsign =
        prev.targets.find((t) => t.id === prev.selectedTargetId)?.callsign ?? 'SPACECRAFT';
      const ev = makeEvent(
        prev.metSeconds,
        'UPLINK',
        'nominal',
        `Telecommand "${cmd.toUpperCase()}" acknowledged by ${callsign} (CRC OK).`
      );
      return {
        ...prev,
        events: [ev, ...prev.events].slice(0, 24),
      };
    });
  };

  const handleSelectPhase = (phaseId: string) => {
    setMission((prev) => {
      const idx = prev.phases.findIndex((p) => p.id === phaseId);
      if (idx === -1) return prev;
      return {
        ...prev,
        phases: prev.phases.map((p, i) => ({
          ...p,
          state: i < idx ? 'completed' : i === idx ? 'active' : 'upcoming',
        })),
      };
    });
  };

  return (
    <div className="h-screen w-screen bg-[#080B11] text-[#E0E2EB] flex flex-col overflow-hidden">
      {/* Layer 2: Top Glassmorphic Command Bar */}
      <TopCommandBar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        isHeld={mission.isHeld}
        onToggleHold={handleToggleHold}
      />

      {/* Primary Multi-Screen Console Viewport */}
      <main className="flex-1 min-h-0 p-3 overflow-y-auto lg:overflow-hidden">
        {activeScreen === 'orbit' && (
          <OrbitTrajectoryScreen
            state={mission}
            onSelectTarget={handleSelectTarget}
            onNavigate={setActiveScreen}
          />
        )}
        {activeScreen === 'propulsion' && (
          <PropulsionBurnsScreen
            state={mission}
            onUpdatePlan={handleUpdatePlan}
            onExecuteBurn={handleExecuteBurn}
            onRequestAbortBurn={() => setAbortModalOpen(true)}
          />
        )}
        {activeScreen === 'subsystems' && (
          <SubsystemsPowerScreen
            state={mission}
            onSetSubsystemStatus={handleSetSubsystemStatus}
            onRunSelfTest={handleRunSelfTest}
          />
        )}
        {activeScreen === 'comms' && (
          <CommsTimelineScreen
            state={mission}
            onSelectStation={handleSelectStation}
            onTransmitCommand={handleTransmitCommand}
          />
        )}
      </main>

      {/* Layer 2: Bottom Mission Timeline & Time-Rate Dock */}
      <BottomTelemetryDock
        metSeconds={mission.metSeconds}
        timeWarp={mission.timeWarp}
        onChangeTimeWarp={(warp) => setMission((prev) => ({ ...prev, timeWarp: warp }))}
        phases={mission.phases}
        activePhaseId={mission.phases.find((p) => p.state === 'active')?.id ?? 'transfer'}
        onSelectPhase={handleSelectPhase}
      />

      {/* Layer 3: Critical Abort Confirmation Modal */}
      <InterventionModal
        open={abortModalOpen}
        tone="crimson"
        title="Confirm Main Engine Cutoff (Abort Burn)"
        description="Commanding an immediate burn abort will close main propellant valves and leave the vehicle in an intermediate transfer trajectory. Confirm emergency cutoff?"
        confirmLabel="Confirm Abort Cutoff"
        onConfirm={handleConfirmAbortBurn}
        onCancel={() => setAbortModalOpen(false)}
      />
    </div>
  );
}
