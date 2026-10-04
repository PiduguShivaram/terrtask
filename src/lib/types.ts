import { SatelliteImageAnalysisResult, TemporalSatelliteComparisonResult } from './satellite-analysis';

export type DataCategory = 
  | 'Observed' 
  | 'Derived' 
  | 'Model-based' 
  | 'Interpretation' 
  | 'Unavailable';

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
  // Deterministic derivations
  forwardSpeedKmh?: number | null;
  bearingDeg?: number | null;
  intensityCategory?: string;
  derivationMethod?: string;
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

export interface RelevantStormMatch {
  storm: CycloneEvent;
  closestDistanceKm: number;
  closestFixTime: string;
  closestPoint: TrackPoint;
  peakWindKts: number | null;
  minPressureHpa: number | null;
}

export interface TemporalSynchronization {
  trackTimestamp: string;
  satelliteTimestamp: string;
  satelliteOffsetHours: number;
  reanalysisTimestamp?: string;
  reanalysisOffsetHours?: number;
  synchronizationNote: string;
}

export interface EvidenceItem {
  id: string;
  category: DataCategory;
  label: string;
  // Raw data from source
  rawVariable?: string;
  rawValue?: string | number | null;
  rawUnit?: string;
  // Display presentation
  displayValue: string | number;
  displayUnit?: string;
  source: string;
  dataset: string;
  timestamp?: string;
  coordinates?: [number, number];
  processing: string;
  derivationDetails?: {
    formula?: string;
    sourceVariables?: string[];
    assumptions?: string;
  };
  limitations?: string;
  description: string;
  rawUrl?: string;
}

export interface ProvenanceRecord {
  source: string;
  dataset: string;
  observationTime?: string;
  retrievalTime?: string;
  geographicCoverage: string;
  processingPerformed: string;
  modelOrAlgorithm?: string;
  citationUrl: string;
}

export interface UncertaintyAssessment {
  hasQuantitativeUncertainty: boolean;
  statement: string;
  limitations: string[];
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

export interface ResolvedLocation {
  name: string;
  lat: number;
  lon: number;
  state: string;
  source: string;
  description: string;
}

export interface StructuredDecisionAnswer {
  directAnswer: string;
  whatHappened?: string;
  where?: string;
  when?: string;
  howStrong?: string;
  whatSatelliteShows?: string;
  whatChangedOverTime?: string;
  supportingEvidenceSummary?: string;
  whatCannotBeDetermined: string[];
}

export type QueryIntentType = 
  | 'location_hazard' 
  | 'cyclone_intensity' 
  | 'temporal_evolution' 
  | 'evidence_inspection' 
  | 'satellite_intensity_request'
  | 'satellite_visual_analysis'
  | 'satellite_comparison'
  | 'closest_storm_query'
  | 'historical_cyclone_comparison'
  | 'satellite_capabilities_inquiry'
  | 'optical_change_misinterpretation'
  | 'era5_nature_inquiry'
  | 'unsupported_forecast' 
  | 'unsupported_damage' 
  | 'unknown_or_unsupported';

export interface TerraTaskResult {
  query: string;
  intent: {
    type: QueryIntentType;
    targetLocation?: string;
    targetStormName?: string;
    coordinates?: [number, number];
    requestedOperation?: string;
  };
  // Answer Structure
  assessment: string;
  answer: string; // compatibility
  decisionAnswer?: StructuredDecisionAnswer;
  derivedAnalysis?: string;
  limitations?: string[];
  evidence: EvidenceItem[];
  reasoning: string;
  uncertainty: UncertaintyAssessment;
  provenance: ProvenanceRecord[];
  
  // Geospatial & Storm Context
  storm: CycloneEvent | null;
  relevantStorms: RelevantStormMatch[];
  activePointIndex: number;
  targetLocationInfo?: ResolvedLocation | null;
  
  // Synchronization & Satellite Analysis
  temporalSync: TemporalSynchronization;
  timelinePhases: TimelinePhase[];
  hourlyEnvironmentalData?: HourlyMetric[] | null;
  environmentalStationName?: string;
  satelliteLayerInfo: {
    layerId: string;
    layerName: string;
    satellite: string;
    instrument: string;
    product: string;
    date: string;
    tileUrlTemplate: string;
    provider: string;
    roleDescription: string;
  };
  
  // Phase 4 Satellite Pixel Analysis & Comparison
  satelliteAnalysis?: SatelliteImageAnalysisResult | null;
  satelliteComparison?: TemporalSatelliteComparisonResult | null;
  
  errorState?: {
    isError: boolean;
    reason: string;
    missingRequirement: string;
  };
}
