'use client';

import React, { useState, useEffect } from 'react';
import { TimelinePhase, TrackPoint } from '@/lib/types';
import { Play, Pause, SkipBack, SkipForward, Clock, Wind, Gauge } from 'lucide-react';

interface TimelineControlProps {
  phases: TimelinePhase[];
  trackPoints: TrackPoint[];
  activePointIndex: number;
  onSelectPoint: (index: number) => void;
}

export const TimelineControl: React.FC<TimelineControlProps> = ({
  phases,
  trackPoints,
  activePointIndex,
  onSelectPoint,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onSelectPoint(
          activePointIndex >= trackPoints.length - 1 ? 0 : activePointIndex + 1
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activePointIndex, trackPoints.length, onSelectPoint]);

  const activePoint = trackPoints[activePointIndex] || trackPoints[0];

  return (
    <div className="p-4 lg:p-5 rounded-2xl bg-earth-900/90 border border-earth-800 shadow-xl space-y-4">
      {/* Top Bar: Before -> During -> After Phases */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-earth-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Temporal Evolution
          </span>
        </div>

        {/* Phase Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {phases.map((p) => {
            const isPhaseActive =
              Math.abs(p.representativePointIndex - activePointIndex) <= 3;
            return (
              <button
                key={p.phase}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  onSelectPoint(p.representativePointIndex);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isPhaseActive
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'bg-earth-950/60 border-earth-800 text-slate-400 hover:text-slate-200 hover:bg-earth-800'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-normal">{p.phase}</div>
                <div>{p.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrubber & Playback Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Play/Step buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onSelectPoint(Math.max(0, activePointIndex - 1));
            }}
            disabled={activePointIndex <= 0}
            className="p-2 rounded-lg bg-earth-950 border border-earth-800 hover:bg-earth-800 text-slate-300 disabled:opacity-40 transition-all"
            title="Previous 3-hour observation"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-900/30 flex items-center gap-1.5 transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Play Track</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              onSelectPoint(Math.min(trackPoints.length - 1, activePointIndex + 1));
            }}
            disabled={activePointIndex >= trackPoints.length - 1}
            className="p-2 rounded-lg bg-earth-950 border border-earth-800 hover:bg-earth-800 text-slate-300 disabled:opacity-40 transition-all"
            title="Next 3-hour observation"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Range Slider */}
        <div className="flex-1 w-full flex flex-col gap-1.5">
          <input
            type="range"
            min={0}
            max={trackPoints.length - 1}
            value={activePointIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onSelectPoint(Number(e.target.value));
            }}
            className="w-full h-2 bg-earth-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-earth-800"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Fix #{activePointIndex + 1} of {trackPoints.length}</span>
            <span className="text-cyan-300 font-bold">{activePoint?.isoTime} UTC</span>
          </div>
        </div>

        {/* Metrics Pill for Active Point */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-earth-950 border border-earth-800 text-xs">
          <div className="flex items-center gap-1 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono font-bold text-white">{activePoint?.windKts || '—'}</span>
            <span className="text-[10px] text-slate-400">kts</span>
          </div>
          <div className="h-4 w-px bg-earth-800" />
          <div className="flex items-center gap-1 text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-white">{activePoint?.pressureHpa || '—'}</span>
            <span className="text-[10px] text-slate-400">hPa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
