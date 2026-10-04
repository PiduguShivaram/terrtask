'use client';

import React, { useState } from 'react';
import { CycloneEvent, HourlyMetric } from '@/lib/types';
import { Satellite, BarChart3, Table, ExternalLink, ShieldCheck, Info } from 'lucide-react';

interface EvidenceViewerProps {
  storm: CycloneEvent | null;
  satelliteDate: string;
  hourlyData?: HourlyMetric[] | null;
  stationName?: string;
  activePointIndex: number;
  onSelectPoint: (index: number) => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  storm,
  satelliteDate,
  hourlyData,
  stationName,
  activePointIndex,
  onSelectPoint,
}) => {
  const [activeTab, setActiveTab] = useState<'satellite' | 'chart' | 'table'>('satellite');
  const [imageError, setImageError] = useState(false);

  if (!storm) return null;

  // Real NASA GIBS Snapshot URL
  const minLon = 80.0;
  const minLat = 14.0;
  const maxLon = 92.0;
  const maxLat = 24.0;
  const snapshotUrl = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${satelliteDate}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=900&HEIGHT=600`;

  return (
    <div className="p-5 lg:p-6 rounded-2xl bg-earth-900/90 border border-earth-800 shadow-xl space-y-4">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-earth-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-earth-950/80 rounded-xl border border-earth-800">
          <button
            type="button"
            onClick={() => setActiveTab('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'satellite'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>NASA Satellite Observation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'chart'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>ERA5 Reanalysis Context</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'table'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Raw NOAA Best-Track</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real Earth Observation Data</span>
        </div>
      </div>

      {/* Tab 1: Real NASA Satellite Snapshot (Rule 8: Honestly Described) */}
      {activeTab === 'satellite' && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-earth-800 bg-earth-950 aspect-video flex items-center justify-center">
            {imageError ? (
              <div className="p-8 text-center space-y-2">
                <Satellite className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-xs font-bold text-slate-300">
                  Satellite imagery unavailable for this timestamp.
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NASA EOSDIS GIBS returned no reflectance tile for {satelliteDate}
                </div>
              </div>
            ) : (
              <img
                src={snapshotUrl}
                alt={`NASA MODIS Terra True-Color Satellite Overpass on ${satelliteDate}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            )}

            {!imageError && (
              <>
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-earth-950/85 backdrop-blur-md border border-earth-800 text-[11px] text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">
                    NASA Terra &bull; MODIS Corrected Reflectance (True Color)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Acquisition Date: <span className="text-cyan-300 font-bold">{satelliteDate}</span> &bull; 10:30 AM Local Overpass
                  </div>
                </div>

                <a
                  href={`https://worldview.earthdata.nasa.gov/?v=${minLon},${minLat},${maxLon},${maxLat}&t=${satelliteDate}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-earth-950/85 backdrop-blur-md hover:bg-cyan-600 border border-earth-800 text-[11px] text-white font-medium flex items-center gap-1 transition-all"
                >
                  <span>Inspect in NASA Worldview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>

          <div className="p-3 rounded-lg bg-earth-950/60 border border-earth-800 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Scientific Context (Rule 8):</strong> This calibrated true-color composite from NASA's Terra satellite provides visual observational evidence of cloud spiral organization, eye formation, and coastal proximity. TerraAsk does NOT perform automated wind speed measurements on RGB imagery.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ECMWF ERA5 Model Reanalysis Context (Rule 9: Reanalysis, Not Direct Station Sensor) */}
      {activeTab === 'chart' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-earth-950/60 border border-earth-800 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">Model-Based Reanalysis Notice (Rule 9):</strong> ERA5 is a 0.25° gridded (~28 km) atmospheric reanalysis model assimilating global weather data. It is displayed as regional atmospheric context and must NOT be confused with direct eye-wall station barometers or anemometer readings.
            </div>
          </div>

          {hourlyData && hourlyData.length > 0 ? (
            <div className="p-4 rounded-xl bg-earth-950 border border-earth-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Model-Based Surface Pressure &amp; 10m Wind Curve
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Grid Location: {stationName || 'Coastal Landfall Sector'} &bull; ECMWF ERA5 0.25° Gridded Output
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
                    <span>Pressure (hPa)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
                    <span>10m Wind (km/h)</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="w-full h-56 relative">
                {(() => {
                  const pressures = hourlyData.map((d) => d.surfacePressureHpa).filter((p) => p > 0);
                  const winds = hourlyData.map((d) => d.windSpeedKmh);
                  const minP = Math.floor(Math.min(...pressures) - 5);
                  const maxP = Math.ceil(Math.max(...pressures) + 5);
                  const maxW = Math.ceil(Math.max(...winds, 100));

                  const width = 800;
                  const height = 200;
                  const padding = 30;

                  const pPoints = hourlyData
                    .map((d, i) => {
                      const x = padding + (i / (hourlyData.length - 1)) * (width - 2 * padding);
                      const p = d.surfacePressureHpa > 0 ? d.surfacePressureHpa : maxP;
                      const y = height - padding - ((p - minP) / (maxP - minP)) * (height - 2 * padding);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');

                  const wPoints = hourlyData
                    .map((d, i) => {
                      const x = padding + (i / (hourlyData.length - 1)) * (width - 2 * padding);
                      const y = height - padding - (d.windSpeedKmh / maxW) * (height - 2 * padding);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');

                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3,3" />
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

                      {/* Pressure Line (Amber) */}
                      <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={pPoints} />

                      {/* Wind Speed Line (Cyan) */}
                      <polyline fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4,2" points={wPoints} />

                      {/* Axis Labels */}
                      <text x={padding} y={padding - 8} fill="#f59e0b" fontSize="10" fontFamily="monospace">
                        {maxP} hPa
                      </text>
                      <text x={padding} y={height - padding + 15} fill="#f59e0b" fontSize="10" fontFamily="monospace">
                        Min: {Math.min(...pressures)} hPa
                      </text>
                      <text x={width - padding} y={padding - 8} textAnchor="end" fill="#06b6d4" fontSize="10" fontFamily="monospace">
                        Max Wind: {Math.max(...winds)} km/h
                      </text>
                    </svg>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-earth-950 border border-earth-800 text-center text-xs text-slate-400">
              ECMWF ERA5 reanalysis data for this coastal location is currently synchronizing.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Raw NOAA Best-Track Observations (Auditable Table) */}
      {activeTab === 'table' && (
        <div className="space-y-2">
          <div className="max-h-72 overflow-y-auto rounded-xl border border-earth-800 bg-earth-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-earth-900/90 text-slate-400 font-mono uppercase text-[10px] sticky top-0 border-b border-earth-800">
                <tr>
                  <th className="py-2.5 px-3">ISO_TIME (UTC)</th>
                  <th className="py-2.5 px-3">Coordinates (LAT, LON)</th>
                  <th className="py-2.5 px-3">WMO_WIND (kt)</th>
                  <th className="py-2.5 px-3">WMO_PRES (mb)</th>
                  <th className="py-2.5 px-3">Derived Speed</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-800/60 font-mono text-[11px]">
                {storm.track.map((pt, idx) => {
                  const isSelected = idx === activePointIndex;
                  return (
                    <tr
                      key={idx}
                      onClick={() => onSelectPoint(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-200 font-semibold'
                          : 'hover:bg-earth-900/60'
                      }`}
                    >
                      <td className="py-2 px-3">{pt.isoTime}</td>
                      <td className="py-2 px-3">
                        {pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E
                      </td>
                      <td className="py-2 px-3">{pt.windKts ?? '—'}</td>
                      <td className="py-2 px-3">{pt.pressureHpa ?? '—'}</td>
                      <td className="py-2 px-3">{pt.forwardSpeedKmh ? `${pt.forwardSpeedKmh} km/h` : '—'}</td>
                      <td className="py-2 px-3 font-sans">
                        {pt.landfallKm === 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                            Landfall Fix (0 km)
                          </span>
                        ) : (
                          <span className="text-slate-500">{pt.intensityCategory || 'Active Fix'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
            <span>Source: NOAA NCEI IBTrACS v04r01 (ibtracs.NI.list.v04r01.csv)</span>
            <span>Total: {storm.track.length} verified track fixes</span>
          </div>
        </div>
      )}
    </div>
  );
};
