import React from 'react';
import { Activity, Flame, Pause, Play, Radio, Orbit } from 'lucide-react';
import { ConsoleScreen } from '../types/mission';

interface TopCommandBarProps {
  activeScreen: ConsoleScreen;
  onSelectScreen: (screen: ConsoleScreen) => void;
  isHeld: boolean;
  onToggleHold: () => void;
}

const NAV_ITEMS: { id: ConsoleScreen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'orbit', label: 'Orbit & Trajectory', icon: Orbit },
  { id: 'propulsion', label: 'Propulsion & Burns', icon: Flame },
  { id: 'subsystems', label: 'Subsystems & Power', icon: Activity },
  { id: 'comms', label: 'Comms & Timeline', icon: Radio },
];

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  activeScreen,
  onSelectScreen,
  isHeld,
  onToggleHold,
}) => {
  return (
    <header className="hud-toolbar h-14 px-4 flex items-center justify-between gap-8 shrink-0 z-30">
      {/* Zone 1: Single-element Brand Wordmark */}
      <div className="text-base font-semibold tracking-tight text-white whitespace-nowrap shrink-0">
        Orbital Mission Console
      </div>

      {/* Zone 2: 4 Single-line Navigation Screens */}
      <nav aria-label="Console screens" className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScreen(item.id)}
              className={`group relative flex items-center gap-2 py-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00F0FF] rounded-sm px-1 ${
                isActive ? 'text-[#00F0FF]' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors duration-150 ${
                  isActive ? 'text-[#00F0FF]' : 'text-[#94A3B8] group-hover:text-[#00F0FF]'
                }`}
              />
              <span>{item.label}</span>
              <span
                className={`absolute inset-x-0 -bottom-[11px] h-[2px] transition-opacity duration-150 ${
                  isActive
                    ? 'opacity-100 bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.85)]'
                    : 'opacity-0 group-hover:opacity-40 bg-[#00F0FF]'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onToggleHold}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] ${
            isHeld
              ? 'bg-[#FF6B35] text-[#080B11] hover:shadow-[0_0_16px_rgba(255,107,53,0.45)]'
              : 'bg-[#00F0FF] text-[#080B11] hover:shadow-[0_0_16px_rgba(0,240,255,0.45)]'
          }`}
        >
          {isHeld ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isHeld ? 'Resume Stream' : 'Hold Telemetry'}</span>
        </button>
      </div>
    </header>
  );
};
