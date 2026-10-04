'use client';

import React from 'react';
import { RelevantStormMatch } from '@/lib/types';
import { Wind, Gauge, Compass, History } from 'lucide-react';

interface RelevantStormsSelectorProps {
  storms: RelevantStormMatch[];
  selectedSid: string;
  onSelectStorm: (sid: string) => void;
  locationName?: string;
}

export const RelevantStormsSelector: React.FC<RelevantStormsSelectorProps> = ({
  storms,
  selectedSid,
  onSelectStorm,
  locationName,
}) => {
  if (!storms || storms.length <= 1) return null;

  return (
    <div className="p-4 rounded-2xl bg-earth-900/90 border border-earth-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
            Relevant Historical Cyclones {locationName ? `near ${locationName}` : ''}
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {storms.length} cyclones ranked by proximity
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Multiple historical cyclones impacted this coastal sector. Select an event to inspect its verified track, satellite overpass, and barometric evidence:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {storms.slice(0, 6).map((match) => {
          const isSelected = match.storm.sid === selectedSid;
          return (
            <button
              key={match.storm.sid}
              type="button"
              onClick={() => onSelectStorm(match.storm.sid)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'bg-earth-950/80 border-earth-800 hover:border-earth-700 hover:bg-earth-900/80'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-sm font-bold text-white tracking-tight">
                  {match.storm.name}{' '}
                  <span className="text-xs font-normal text-slate-400">({match.storm.season})</span>
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500 text-white">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>
                    Closest Approach: <strong className="text-white">{match.closestDistanceKm} km</strong>
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-earth-900/70 border border-earth-800 space-y-0.5">
                  <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Peak Recorded Intensity
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="font-semibold text-white">{match.peakWindKts ? `${match.peakWindKts} kt` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">{match.minPressureHpa ? `${match.minPressureHpa} hPa` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-sans truncate border-t border-earth-800/80 pt-1.5 w-full">
                Closest Track Fix: {match.closestFixTime.slice(0, 16)} UTC
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
