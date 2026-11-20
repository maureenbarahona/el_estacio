---
name: Orbital Mission Console
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e0e2eb'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e0e2eb'
  inverse-on-surface: '#2d3037'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffb59d'
  on-secondary: '#5d1900'
  secondary-container: '#b83900'
  on-secondary-container: '#ffddd2'
  tertiary: '#dbffde'
  on-tertiary: '#003918'
  tertiary-container: '#34f885'
  on-tertiary-container: '#006e35'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832600'
  tertiary-fixed: '#62ff96'
  tertiary-fixed-dim: '#00e475'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#005226'
  background: '#10131a'
  on-background: '#e0e2eb'
  surface-variant: '#32353c'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  label-telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  label-telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  label-telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-code-cap:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-compact: 0.5rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style
The design system establishes a high-density, real-time command interface engineered for orbital mechanics, trajectory monitoring, and spacecraft telemetry. Drawing inspiration from modern aerospace glass cockpits and deep-space telemetry arrays, the visual language blends refined technical minimalism with restrained sci-fi glassmorphism.

The interface prioritizes extreme data legibility, low cognitive fatigue during prolonged operations, and unambiguous status indication under high-stress anomalous scenarios. Surfaces evoke translucent instrument glass hovering over an ink-black cosmic void, using structural cyan luminescence and laser-sharp demarcation lines instead of heavy physical containers. The overall aesthetic is rigorous, mission-critical, authoritative, and computational.

## Colors
The palette is calibrated strictly for deep-space dark mode, balancing low-luminance chassis surfaces with tactical emission points.

- **Background Canvas & Chassis:** The foundational backdrop relies on `#080B11` (Deep Void), stepping up through `#0D131F` (Sub-chassis) to `#141C2E` (Instrument Base) and `#1E293B` for elevated modal overlays.
- **Accents:** The primary `#00F0FF` (Orbital Cyan) is reserved for active trajectory paths, selected telemetry channels, vector reticles, and key brand anchors. The secondary `#FF6B35` (Aerospace Coral/Warning Orange) marks critical countdowns, burn markers, propulsion activations, and cautionary limits.
- **Mission Telemetry Status Scale:**
  - *Nominal / Optimal:* `#00E676` (Radiant Green)
  - *Advisory / Transient:* `#FFC107` (Solar Amber)
  - *Critical / Anomaly:* `#FF3B30` (Alert Crimson)
- **Data Readout Hierarchy:** Primary readings and high-contrast labels utilize `#FFFFFF`. Secondary telemetry captions, engineering units, and inactive axes use `#94A3B8`. Structural borders are defined with translucent cyan (`rgba(0, 240, 255, 0.15)`) or muted slate (`rgba(148, 163, 184, 0.12)`).

## Typography
Typography is split strictly along cognitive responsibilities:
- **Structural Interface (`Inter`):** Handles mission phases, viewport panel titles, interactive system menus, and analytical notes. It offers clean, distraction-free neutral legibility at compact sizes.
- **Flight & Telemetry Data (`JetBrains Mono`):** Dedicated to all numerical values, coordinates, UTC mission clocks, delta-v projections, apoapsis/periapsis metrics, and raw telemetry streams. Tabular figures (`tnum`) must be enforced globally on all monospace output to eliminate horizontal jitter during sub-second telemetry updates.

All micro-labels, axis markers, and unit annotations use uppercase rendering with wide letter tracking (`label-code-cap`) to maintain instant recognition under low screen luminance.

## Layout & Spacing
Designed explicitly for ultra-wide, multi-monitor, and high-DPI desktop command stations. The system implements a dynamic 24-column CSS grid optimized for information density without visual crowding.

- **Grid Architecture:** Multi-pane viewport partitioning with dockable diagnostic drawers and real-time canvas centers. Primary margins (`margin`) are pegged to `1rem` from the display border to maximize functional screen real estate. Gutters default to `0.75rem`, tightening to `0.5rem` (`gutter-compact`) inside dense telemetry matrices.
- **Density Scaling:** Component internals operate on a strict 4px sub-grid rhythm (`space-xs: 4px`, `space-sm: 8px`, `space-md: 12px`, `space-lg: 20px`, `space-xl: 28px`), giving instruments compact exterior footprints with clear internal separation between sensor labels and real-time metric streams.

## Elevation & Depth
Depth in the mission console is created through optical transmittance, glowing luminescence, and tactical surface tiers rather than traditional drop shadows.

- **Surface Tiers:**
  - *Layer 0 (Canvas):* `#080B11` solid backdrop, hosting HUD coordinate grids and orbit canvas projections.
  - *Layer 1 (Card Matrix):* `#0D131F` at 85% opacity with `backdrop-filter: blur(12px)`. Outlined with a hairline border of `rgba(0, 240, 255, 0.15)`.
  - *Layer 2 (Floating Command Toolbars & Flyouts):* `#141C2E` at 90% opacity with `backdrop-filter: blur(20px)` and structural border `rgba(0, 240, 255, 0.3)`.
  - *Layer 3 (Critical Alert Modals & Interventions):* `#1E293B` at 95% opacity with an ambient glow (`box-shadow: 0 0 30px rgba(255, 59, 48, 0.25)` for alerts or `rgba(0, 240, 255, 0.2)` for orbital operations).
- **HUD Reticles & Laser Traces:** When elements are actively locked or receiving live packet transfers, cards exhibit a faint interior cyan beam along their top edge: `box-shadow: inset 0 1px 0 0 rgba(0, 240, 255, 0.6)`.

## Shapes
The console utilizes a surgical, low-radius shape profile (`roundedness: 1`). Radii stay restricted to 2px (`rounded-sm`), 4px (`rounded`), and 8px (`rounded-lg`) to retain the feel of physical tactical hardware.

High-density HUD cards and sub-panels feature subtle 45-degree chamfered corners (notched display bezels) via CSS clip-paths or SVGs on outer frames, providing an authentic flight deck instrument look. Only live circular radar scopes, attitude indicators, and pulsing status pings deviate from the angular, clipped structural motif.

## Components

- **High-Density Telemetry Cards:**
  Constructed from translucent glass containers (`#0D131F`, 85% opacity, border `rgba(0, 240, 255, 0.15)`). The top bar houses an uppercase monospace sub-label, signal packet indicator, and an optional corner status beacon. Internal values are typeset in `label-telemetry-lg` with the metric unit nested alongside in `body-sm` `#94A3B8`.

- **Live Telemetry Status Pills:**
  Compact badges displaying vehicle subsystem states. Encased in a dark pill border (`rgba(255, 255, 255, 0.1)`) containing a 6px status LED that pulses using CSS keyframe animations for active transmissions (green `#00E676` for nominal telemetry, amber `#FFC107` for thermal/attitude caution, crimson `#FF3B30` for abort thresholds).

- **HUD Radar Grids & Reticles:**
  Tactical coordinate overlays embedded into orbit map canvases. Formed with ultra-fine crosshair intersections, range rings drawn in `rgba(0, 240, 255, 0.1)`, and degree tick-marks. Selected target spacecraft feature an animated rotating corner reticle with dynamic vector readouts tracking coordinates alongside the craft.

- **Glassmorphic Command Toolbars:**
  Floating horizontal docks positioned at the top and bottom viewport edges. Configured with a `1px` outer hairline border and `backdrop-filter: blur(24px)`. Tool triggers feature sharp monochrome vector icons, transitioning on hover to primary cyan luminescence with an underglow highlight.

- **Buttons & Command Triggers:**
  - *Primary Command:* Solid cyan background (`#00F0FF`) with dark obsidian text (`#080B11`), bold `Inter` tracking, and a sharp 4px radius. In hover state, triggers a subtle outer cyan bloom.
  - *Abort / Destructive Action:* High-saturation red border (`#FF3B30`), transparent background, flashing warning hatch fill pattern on hover, and active confirmation requirement.
  - *Ghost / HUD Action:* Translucent slate surface, cyan stroke on focus, monospace label.

- **Input Fields & Data Controllers:**
  Recessed cockpit inputs with dark charcoal fills (`#080B11`), hairline bottom borders that ignite into cyan on focus, and monospace numeric input formatting for manual vector entry and thruster burn durations.

- **Mission Timeline & Phase Badges:**
  Segmented linear sequence indicators tracking launch windows, stage separation, transfer burns, and docking maneuvers. Completed phases reflect dimmed green, the active phase pulses with cyan perimeter sweeps, and upcoming phases remain muted slate.