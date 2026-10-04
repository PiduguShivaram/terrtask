'use client';

import React from 'react';
import { Globe, Database, ShieldCheck, Waves, Satellite } from 'lucide-react';

export const TerraAskHeader: React.FC = () => {
  return (
    <header className="border-b border-earth-800 bg-earth-950/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Globe className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">TerraAsk</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Earth Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Ask Earth what is changing. Real satellite &amp; geospatial observations.
            </p>
          </div>
        </div>

        {/* Verified Data Sources */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-earth-900/90 border border-earth-800 text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">NOAA IBTrACS:</span>
            <span className="font-mono text-emerald-300 font-medium">v04r01 (WMO Record)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-earth-900/90 border border-earth-800 text-slate-300">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">NASA GIBS:</span>
            <span className="font-mono text-cyan-300 font-medium">MODIS Terra (True Color)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-earth-900/90 border border-earth-800 text-slate-300">
            <Waves className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">ECMWF ERA5:</span>
            <span className="font-mono text-indigo-300 font-medium">0.25° Reanalysis</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-[11px]">Zero Fabricated Data</span>
          </div>
        </div>
      </div>
    </header>
  );
};
