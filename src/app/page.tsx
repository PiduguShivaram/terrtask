'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TerraAskHeader } from '@/components/TerraAskHeader';
import { NaturalLanguagePrompt } from '@/components/NaturalLanguagePrompt';
import { AnswerCard } from '@/components/AnswerCard';
import { TimelineControl } from '@/components/TimelineControl';
import { EvidenceViewer } from '@/components/EvidenceViewer';
import { TruthfulState } from '@/components/TruthfulState';
import { TerraAskResult } from '@/lib/types';
import { extractDateString } from '@/lib/gibs';
import { Loader2, ShieldCheck, Database, Compass, Layers, AlertCircle } from 'lucide-react';

// Dynamic import for Leaflet Map to avoid SSR window issues
const Map = dynamic(() => import('@/components/Map').then((m) => m.Map), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] lg:min-h-[580px] rounded-2xl border border-earth-800 bg-earth-950 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <span className="text-xs text-slate-400 font-mono">Initializing Geospatial Engine...</span>
    </div>
  ),
});

export default function TerraAskHome() {
  const [currentQuery, setCurrentQuery] = useState('What is happening near Puri?');
  const [result, setResult] = useState<TerraAskResult | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Execute query against Earth-Observation API
  const handleQuery = async (queryText: string) => {
    setIsLoading(true);
    setApiError(null);
    setCurrentQuery(queryText);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });

      if (!res.ok) {
        throw new Error(`Earth-Observation Service error (${res.status})`);
      }

      const data: TerraAskResult = await res.json();
      setResult(data);
      setActivePointIndex(data.activePointIndex ?? 0);
    } catch (err) {
      console.error('Failed to execute TerraAsk query:', err);
      setApiError(err instanceof Error ? err.message : 'Unknown communication error');
    } finally {
      setIsLoading(false);
    }
  };

  // Run benchmark query on mount
  useEffect(() => {
    handleQuery('What is happening near Puri?');
  }, []);

  // Compute satellite date from active track point
  const currentActivePoint = result?.storm?.track?.[activePointIndex];
  const satelliteDate = currentActivePoint
    ? extractDateString(currentActivePoint.isoTime)
    : result?.satelliteLayerInfo?.date || '2019-05-03';

  return (
    <div className="min-h-screen flex flex-col bg-earth-950 text-slate-100">
      <TerraAskHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Natural Language Interface */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Climate Intelligence Prompt</span>
            </h1>
            <span className="text-xs text-slate-400 hidden sm:inline">
              NOAA IBTrACS &bull; NASA GIBS &bull; ECMWF ERA5
            </span>
          </div>

          <NaturalLanguagePrompt
            currentQuery={currentQuery}
            onSearch={handleQuery}
            isLoading={isLoading}
          />
        </section>

        {/* Loading Spinner for full query transition */}
        {isLoading && !result && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="text-sm font-semibold text-white">
              Retrieving Authoritative Earth Observations...
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Connecting to NOAA Best-Track archives and NASA GIBS overpasses
            </div>
          </div>
        )}

        {/* Truthful Error / Unavailable State */}
        {result?.errorState?.isError && (
          <TruthfulState
            reason={result.errorState.reason}
            missingRequirement={result.errorState.missingRequirement}
            onReset={() => handleQuery('What is happening near Puri?')}
          />
        )}

        {/* API Failure State */}
        {apiError && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Query Execution Failure</h3>
            <p className="text-xs text-rose-300 font-mono">{apiError}</p>
            <button
              type="button"
              onClick={() => handleQuery(currentQuery)}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              Retry Observation Retrieval
            </button>
          </div>
        )}

        {/* Primary Dashboard Interface */}
        {result && !result.errorState?.isError && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Map & Temporal Scrubber (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Geospatial Track &amp; Satellite Overpass</span>
                  </div>
                  {result.storm && (
                    <span className="font-mono text-cyan-400 font-semibold">
                      Cyclone {result.storm.name} ({result.storm.season})
                    </span>
                  )}
                </div>

                <Map
                  storm={result.storm}
                  activePointIndex={activePointIndex}
                  onSelectPoint={setActivePointIndex}
                  satelliteDate={satelliteDate}
                />
              </div>

              {/* Temporal Scrubber Control */}
              {result.storm && result.storm.track.length > 0 && (
                <TimelineControl
                  phases={result.timelinePhases}
                  trackPoints={result.storm.track}
                  activePointIndex={activePointIndex}
                  onSelectPoint={setActivePointIndex}
                />
              )}

              {/* Evidence Deep Dive Viewer (Satellite / ERA5 Barometric Chart / Raw Best Track) */}
              <EvidenceViewer
                storm={result.storm}
                satelliteDate={satelliteDate}
                hourlyData={result.hourlyEnvironmentalData}
                stationName={result.environmentalStationName}
                activePointIndex={activePointIndex}
                onSelectPoint={setActivePointIndex}
              />
            </div>

            {/* Right Column: Structured Answer Card (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              <AnswerCard result={result} />
            </div>
          </div>
        )}
      </main>

      {/* Authoritative Data Lineage Footer */}
      <footer className="border-t border-earth-800 bg-earth-950 px-4 lg:px-8 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TerraAsk</span>
            <span className="text-slate-600">&bull;</span>
            <span>Real Earth-Observation Intelligence Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span>Data Providers:</span>
            <a
              href="https://www.ncei.noaa.gov/products/international-best-track-archive"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              NOAA NCEI IBTrACS
            </a>
            <a
              href="https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              NASA EOSDIS GIBS
            </a>
            <a
              href="https://www.ecmwf.int/en/forecasts/dataset/ecmwf-reanalysis-v5"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              ECMWF ERA5
            </a>
            <a
              href="https://mausam.imd.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              IMD RSMC
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
