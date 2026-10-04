export type DataCategory = 'Observed' | 'Derived' | 'Model-based' | 'Unavailable';

export interface Radii34kt {
  ne: number | null;
  se: number | null;
  sw: number | null;
  nw: number | null;
}

export interface TrackPoint {
  isoTime: string;
  lat: number;
  lon: number;
  windKts: number | null;
  pressureHpa: number | null;
  sshsCategory: number | null;
  dist2LandKm: number | null;
  landfallKm: number | null;
  radii34ktNm?: Radii34kt | null;
  // Derived metrics
  forwardSpeedKmh?: number | null;
  bearingDeg?: number | null;
  intensityCategory?: string;
}

export interface CycloneEvent {
  sid: string;
  season: number;
  name: string;
  subbasin: string;
  agency: string;
  track: TrackPoint[];
  peakWindKts?: number;
  minPressureHpa?: number;
  landfallPoint?: TrackPoint | null;
  startDate?: string;
  endDate?: string;
}

export interface EvidenceItem {
  id: string;
  category: DataCategory;
  label: string;
  value: string | number;
  unit?: string;
  source: string;
  dataset: string;
  timestamp?: string;
  coordinates?: [number, number];
  description: string;
  rawUrl?: string;
}

export interface ProvenanceRecord {
  source: string;
  dataset: string;
  acquisitionTime?: string;
  observationTime?: string;
  geographicCoverage: string;
  processingPerformed: string;
  modelOrAlgorithm?: string;
  citationUrl: string;
}

export interface UncertaintyAssessment {
  hasQuantitativeUncertainty: boolean;
  statement: string;
  metrics?: {
    label: string;
    value: string;
    note: string;
  }[];
}

export interface TimelinePhase {
  phase: 'Before' | 'During' | 'After';
  label: string;
  dateRange: string;
  satelliteDate: string;
  representativePointIndex: number;
  keyObservation: string;
}

export interface HourlyMetric {
  time: string;
  windSpeedKmh: number;
  windGustsKmh?: number;
  surfacePressureHpa: number;
  precipitationMm?: number;
}

export interface TerraAskResult {
  query: string;
  intent: {
    type: 'location_hazard' | 'cyclone_intensity' | 'temporal_evolution' | 'evidence_inspection' | 'general_status';
    targetLocation?: string;
    targetStormName?: string;
    coordinates?: [number, number];
  };
  answer: string;
  evidence: EvidenceItem[];
  reasoning: string;
  uncertainty: UncertaintyAssessment;
  provenance: ProvenanceRecord[];
  storm: CycloneEvent | null;
  activePointIndex: number;
  timelinePhases: TimelinePhase[];
  hourlyEnvironmentalData?: HourlyMetric[] | null;
  environmentalStationName?: string;
  satelliteLayerInfo: {
    layerId: string;
    layerName: string;
    date: string;
    tileUrlTemplate: string;
    provider: string;
  };
  errorState?: {
    isError: boolean;
    reason: string;
    missingRequirement: string;
  };
}
