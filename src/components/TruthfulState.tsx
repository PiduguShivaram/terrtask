'use client';

import React from 'react';
import { AlertTriangle, Database, Info, ExternalLink } from 'lucide-react';

interface TruthfulStateProps {
  reason: string;
  missingRequirement: string;
  onReset: () => void;
}

export const TruthfulState: React.FC<TruthfulStateProps> = ({
  reason,
  missingRequirement,
  onReset,
}) => {
  return (
    <div className="p-8 rounded-2xl bg-earth-900/90 border border-amber-500/30 shadow-2xl text-center max-w-2xl mx-auto space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">
          Authoritative Data Not Available
        </h3>
        <p className="text-xs uppercase tracking-widest font-semibold text-amber-400 mt-1">
          Zero Synthetic Fallback Policy Enforced
        </p>
      </div>

      <div className="p-4 rounded-xl bg-earth-950/80 border border-earth-800 text-xs text-slate-300 text-left space-y-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Explanation:</strong> {reason}
          </div>
        </div>

        <div className="flex items-start gap-2 pt-2 border-t border-earth-800">
          <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Requirement / Coverage Scope:</strong>{' '}
            {missingRequirement}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          Return to Verified Indian Coast Benchmark (Puri)
        </button>

        <a
          href="https://www.ncei.noaa.gov/products/international-best-track-archive"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-xl bg-earth-950 hover:bg-earth-800 border border-earth-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <span>Inspect NOAA NCEI IBTrACS Index</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
