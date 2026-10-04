'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { CycloneEvent, ResolvedLocation } from '@/lib/types';
import { Layers, Eye, Compass, Info, MapPin } from 'lucide-react';

interface MapProps {
  storm: CycloneEvent | null;
  targetLocation?: ResolvedLocation | null;
  activePointIndex: number;
  onSelectPoint: (index: number) => void;
  satelliteDate: string;
}

export const Map: React.FC<MapProps> = ({
  storm,
  targetLocation,
  activePointIndex,
  onSelectPoint,
  satelliteDate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const trackLayersRef = useRef<any[]>([]);

  const [activeBaseLayer, setActiveBaseLayer] = useState<'dark' | 'satellite' | 'osm'>('dark');
  const [showRadii, setShowRadii] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const defaultCenter: [number, number] = targetLocation 
        ? [targetLocation.lat, targetLocation.lon]
        : [19.8135, 85.8312];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://carto.com" target="_blank" class="text-cyan-400">CARTO</a> &bull; <a href="https://earthdata.nasa.gov" target="_blank" class="text-cyan-400">NASA GIBS</a> &bull; NOAA IBTrACS &bull; OpenStreetMap')
        .addTo(map);

      // 1. Dark CartoDB Layer (default high-contrast dark geographic context)
      const darkLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        }
      );

      // 2. NASA GIBS Satellite Base Layer
      const gibsLayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${satelliteDate || '2019-05-03'}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        {
          maxZoom: 9,
          attribution: 'NASA EOSDIS GIBS',
        }
      );

      // 3. OpenStreetMap
      const osmLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }
      );

      layersRef.current = {
        dark: darkLayer,
        satellite: gibsLayer,
        osm: osmLayer,
      };

      // Add default basemap
      darkLayer.addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      // Invalidate size immediately and after layout completes
      map.invalidateSize();
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Update Base Layer & Satellite Date
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    import('leaflet').then((L) => {
      Object.values(layersRef.current).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      if (activeBaseLayer === 'satellite') {
        const gibsLayer = L.tileLayer(
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${satelliteDate || '2019-05-03'}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
          {
            maxZoom: 9,
            attribution: 'NASA EOSDIS GIBS',
          }
        );
        layersRef.current.satellite = gibsLayer;
        gibsLayer.addTo(map);
      } else if (activeBaseLayer === 'osm') {
        layersRef.current.osm?.addTo(map);
      } else {
        layersRef.current.dark?.addTo(map);
      }
      map.invalidateSize();
    });
  }, [mapReady, activeBaseLayer, satelliteDate]);

  // Render Target Location Pin, Track, Landfall, and Wind Radii
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !storm || !storm.track || storm.track.length === 0) return;

    import('leaflet').then((L) => {
      // Clear previous layers
      trackLayersRef.current.forEach((layer) => map.removeLayer(layer));
      trackLayersRef.current = [];

      const points = storm.track;
      const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);

      // 1. Draw Polyline
      const trackPolyline = L.polyline(latLngs, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.85,
      }).addTo(map);
      trackLayersRef.current.push(trackPolyline);

      // Collect bounds to include track + target location
      const bounds = L.latLngBounds(latLngs);

      // 2. Add Target Location Pin (if resolved from query)
      if (targetLocation) {
        bounds.extend([targetLocation.lat, targetLocation.lon]);

        const targetIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60"></span>
              <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-bold">
                📍
              </div>
            </div>
          `,
          className: 'custom-target-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const targetMarker = L.marker([targetLocation.lat, targetLocation.lon], { icon: targetIcon }).addTo(map);
        targetMarker.bindTooltip(
          `
          <div class="text-xs font-sans p-1">
            <div class="font-bold text-emerald-300">${targetLocation.name} (${targetLocation.state})</div>
            <div class="text-slate-300 text-[11px]">${targetLocation.description}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Source: ${targetLocation.source}</div>
          </div>
          `,
          { direction: 'top', offset: [0, -12] }
        );
        trackLayersRef.current.push(targetMarker);
      }

      // Smoothly fit bounds
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });

      // 3. Add Track Points
      points.forEach((p, idx) => {
        const isActive = idx === activePointIndex;
        const isLandfall = p.landfallKm === 0;

        let markerHtml = '';
        if (isActive) {
          markerHtml = `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-cyan-400 opacity-75"></span>
              <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-500/50"></div>
            </div>
          `;
        } else if (isLandfall) {
          markerHtml = `
            <div class="relative flex items-center justify-center">
              <span class="animate-pulse absolute inline-flex h-6 w-6 rounded-full bg-rose-500 opacity-60"></span>
              <div class="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-md"></div>
            </div>
          `;
        } else {
          let pointColor = '#38bdf8';
          if ((p.windKts || 0) >= 90) pointColor = '#fb923c';
          if ((p.windKts || 0) >= 115) pointColor = '#f43f5e';

          markerHtml = `
            <div class="w-2.5 h-2.5 rounded-full border border-earth-950 shadow-sm" style="background-color: ${pointColor}"></div>
          `;
        }

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-track-marker',
          iconSize: isActive ? [28, 28] : [14, 14],
          iconAnchor: isActive ? [14, 14] : [7, 7],
        });

        const marker = L.marker([p.lat, p.lon], { icon }).addTo(map);

        marker.on('click', () => {
          onSelectPoint(idx);
        });

        marker.bindTooltip(
          `
          <div class="text-xs font-sans p-1">
            <div class="font-bold text-slate-900">${storm.name} &bull; ${p.isoTime} UTC</div>
            <div class="text-slate-700">Winds: <span class="font-semibold text-cyan-700">${p.windKts || '—'} kt</span> (${Math.round((p.windKts || 0) * 1.852)} km/h)</div>
            <div class="text-slate-700">Pressure: <span class="font-semibold">${p.pressureHpa || '—'} hPa</span></div>
            ${p.landfallKm === 0 ? '<div class="text-rose-600 font-bold mt-0.5">⚠️ Direct Landfall Fix (0 km)</div>' : ''}
            <div class="text-[10px] text-slate-500 mt-0.5">Click to inspect observation</div>
          </div>
          `,
          { direction: 'top', offset: [0, -10] }
        );

        trackLayersRef.current.push(marker);
      });

      // 4. Draw 34-knot Gale Radius for Active Point
      const activePoint = points[activePointIndex];
      if (showRadii && activePoint && activePoint.radii34ktNm) {
        const r = activePoint.radii34ktNm;
        const validRadii = [r.ne, r.se, r.sw, r.nw].filter((v): v is number => v !== null && v > 0);
        if (validRadii.length > 0) {
          const avgRadiusNm = validRadii.reduce((a, b) => a + b, 0) / validRadii.length;
          const radiusMeters = avgRadiusNm * 1852;

          const radiusCircle = L.circle([activePoint.lat, activePoint.lon], {
            radius: radiusMeters,
            color: '#f59e0b',
            fillColor: '#fbbf24',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '4, 4',
          }).addTo(map);

          radiusCircle.bindTooltip(
            `<span class="text-xs font-sans">Observed 34-kt Gale Radius: ~${Math.round(avgRadiusNm)} nm (~${Math.round(avgRadiusNm * 1.852)} km)</span>`
          );

          trackLayersRef.current.push(radiusCircle);
        }
      }
    });
  }, [mapReady, storm, targetLocation, activePointIndex, showRadii]);

  return (
    <div className="relative w-full h-[480px] lg:h-[580px] rounded-2xl overflow-hidden border border-earth-800 bg-earth-950 shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Layer Controls & Overlays */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-1 p-1 bg-earth-900/90 backdrop-blur-md rounded-xl border border-earth-700/80 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveBaseLayer('dark')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeBaseLayer === 'dark'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-earth-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dark Carto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBaseLayer('satellite')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeBaseLayer === 'satellite'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-earth-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>NASA Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBaseLayer('osm')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeBaseLayer === 'osm'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-earth-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>OSM</span>
          </button>
        </div>

        {/* Toggle Gale Radii */}
        <button
          type="button"
          onClick={() => setShowRadii(!showRadii)}
          className={`self-end px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border shadow-lg transition-all ${
            showRadii
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-earth-900/80 border-earth-700 text-slate-400 hover:text-white'
          }`}
        >
          {showRadii ? '● 34-kt Wind Radii Active' : '○ Show Wind Radii'}
        </button>
      </div>

      {/* Target Location / Observation Overpass Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-earth-900/90 backdrop-blur-md border border-earth-700/80 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-medium">
            Overpass: <span className="font-mono text-cyan-300 font-bold">{satelliteDate}</span> (~05:00 UTC)
          </span>
        </div>

        {targetLocation && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 shadow-lg text-[11px] text-emerald-300">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Target: <strong>{targetLocation.name}</strong> ({targetLocation.lat.toFixed(2)}°N, {targetLocation.lon.toFixed(2)}°E)</span>
          </div>
        )}
      </div>

      {/* Legend Card Bottom Right */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-col gap-1 p-2.5 rounded-xl bg-earth-950/90 backdrop-blur-md border border-earth-800 text-[11px] text-slate-300 shadow-xl pointer-events-none">
        <div className="font-semibold text-white flex items-center gap-1 mb-0.5">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Real Track Legend (IBTrACS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Category 4/5 (&ge; 115 kt)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span>Category 2/3 (90-114 kt)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Tropical Storm / Cat 1 (&lt; 90 kt)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-dashed border-amber-300" />
          <span>34-kt Gale Radii Field</span>
        </div>
      </div>
    </div>
  );
};
