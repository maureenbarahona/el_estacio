import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface InterventionModalProps {
  open: boolean;
  tone: 'crimson' | 'cyan';
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  open,
  tone,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const isCrimson = tone === 'crimson';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B11]/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-modal-title"
    >
      <div
        className={`w-full max-w-md rounded-lg p-5 transition-transform duration-150 ${
          isCrimson ? 'hud-modal-crimson' : 'hud-modal-cyan'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {isCrimson ? (
              <AlertTriangle className="w-5 h-5 text-[#FF3B30] shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-[#00F0FF] shrink-0" />
            )}
            <h2 id="intervention-modal-title" className="text-base font-semibold text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#94A3B8] hover:text-white p-1 rounded transition-colors"
            aria-label="Close confirmation modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-[#B9CACB]">{description}</p>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-[#94A3B8]/25 bg-[#0D131F] text-xs font-medium text-[#E0E2EB] hover:border-[#00F0FF]/45 hover:text-white transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-xs font-semibold whitespace-nowrap transition-all ${
              isCrimson
                ? 'abort-trigger bg-[#FF3B30]/15 text-[#FF3B30]'
                : 'bg-[#00F0FF] text-[#080B11] hover:shadow-[0_0_18px_rgba(0,240,255,0.45)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
