'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { CycloneEvent, TrackPoint } from '@/lib/types';
import { Layers, Eye, Compass, Info } from 'lucide-react';

interface MapProps {
  storm: CycloneEvent | null;
  activePointIndex: number;
  onSelectPoint: (index: number) => void;
  satelliteDate: string;
}

export const Map: React.FC<MapProps> = ({
  storm,
  activePointIndex,
  onSelectPoint,
  satelliteDate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const trackLayersRef = useRef<any[]>([]);

  const [activeBaseLayer, setActiveBaseLayer] = useState<'satellite' | 'dark' | 'osm'>('satellite');
  const [showRadii, setShowRadii] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Default view over Bay of Bengal and India's East Coast
      const map = L.map(mapContainerRef.current, {
        center: [18.5, 86.0],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://earthdata.nasa.gov" target="_blank" class="text-cyan-400">NASA GIBS</a> &bull; NOAA IBTrACS &bull; OpenStreetMap')
        .addTo(map);

      // 1. NASA GIBS Satellite Base Layer
      const gibsLayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${satelliteDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        {
          maxZoom: 9,
          attribution: 'NASA EOSDIS GIBS',
        }
      );

      // 2. Dark CartoDB Layer
      const darkLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      );

      // 3. OpenStreetMap
      const osmLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
        }
      );

      layersRef.current = {
        satellite: gibsLayer,
        dark: darkLayer,
        osm: osmLayer,
      };

      // Add default layer
      gibsLayer.addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Layer & Satellite Date
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import('leaflet').then((L) => {
      // Remove all base layers
      Object.values(layersRef.current).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      if (activeBaseLayer === 'satellite') {
        const gibsLayer = L.tileLayer(
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${satelliteDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
          {
            maxZoom: 9,
            attribution: 'NASA EOSDIS GIBS',
          }
        );
        layersRef.current.satellite = gibsLayer;
        gibsLayer.addTo(map);
      } else if (activeBaseLayer === 'dark') {
        layersRef.current.dark?.addTo(map);
      } else if (activeBaseLayer === 'osm') {
        layersRef.current.osm?.addTo(map);
      }
    });
  }, [activeBaseLayer, satelliteDate]);

  // Render Cyclone Track, Points, Landfall, and Wind Radii
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !storm || !storm.track || storm.track.length === 0) return;

    import('leaflet').then((L) => {
      // Clear previous track layers
      trackLayersRef.current.forEach((layer) => map.removeLayer(layer));
      trackLayersRef.current = [];

      const points = storm.track;
      const latLngs = points.map((p) => [p.lat, p.lon] as [number, number]);

      // 1. Draw Polyline colored by intensity
      const trackPolyline = L.polyline(latLngs, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.85,
        dashArray: undefined,
      }).addTo(map);
      trackLayersRef.current.push(trackPolyline);

      // Fit bounds to track
      map.fitBounds(trackPolyline.getBounds(), { padding: [50, 50] });

      // 2. Add Track Points
      points.forEach((p, idx) => {
        const isActive = idx === activePointIndex;
        const isLandfall = p.landfallKm === 0;

        // Custom HTML Marker
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
          // Color based on wind speed
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
            <div class="text-slate-700">Winds: <span class="font-semibold text-cyan-700">${p.windKts || '—'} kts</span> (${Math.round((p.windKts || 0) * 1.852)} km/h)</div>
            <div class="text-slate-700">Pressure: <span class="font-semibold">${p.pressureHpa || '—'} hPa</span></div>
            ${p.landfallKm === 0 ? '<div class="text-rose-600 font-bold mt-0.5">⚠️ Direct Landfall Fix</div>' : ''}
            <div class="text-[10px] text-slate-500 mt-0.5">Click to inspect observation</div>
          </div>
          `,
          { direction: 'top', offset: [0, -10] }
        );

        trackLayersRef.current.push(marker);
      });

      // 3. Draw 34-knot Gale Radius for Active Point
      const activePoint = points[activePointIndex];
      if (showRadii && activePoint && activePoint.radii34ktNm) {
        const r = activePoint.radii34ktNm;
        // Average radius in meters (1 nm = 1852 meters)
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
  }, [storm, activePointIndex, showRadii]);

  return (
    <div className="relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-2xl overflow-hidden border border-earth-800 bg-earth-950 shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Layer Controls & Overlays */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-1 p-1 bg-earth-900/90 backdrop-blur-md rounded-xl border border-earth-700/80 shadow-xl">
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

      {/* Satellite Observation Date Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-earth-900/90 backdrop-blur-md border border-earth-700/80 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs text-slate-300 font-medium">
          Observation Overpass: <span className="font-mono text-cyan-300 font-bold">{satelliteDate}</span>
        </span>
      </div>

      {/* Legend Card Bottom Right */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex flex-col gap-1 p-2.5 rounded-xl bg-earth-950/90 backdrop-blur-md border border-earth-800 text-[11px] text-slate-300 shadow-xl pointer-events-none">
        <div className="font-semibold text-white flex items-center gap-1 mb-0.5">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Real Track Legend (IBTrACS)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Category 4/5 (&ge; 115 kts)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span>Category 2/3 (90-114 kts)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
          <span>Tropical Storm / Cat 1 (&lt; 90 kts)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-dashed border-amber-300" />
          <span>34-kt Gale Radii Field</span>
        </div>
      </div>
    </div>
  );
};
