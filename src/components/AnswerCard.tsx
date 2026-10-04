'use client';

import React, { useState } from 'react';
import { TerraAskResult, DataCategory, EvidenceItem } from '@/lib/types';
import { 
  ExternalLink, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Layers,
  Calculator,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Compass,
  Gauge,
  Eye,
  TrendingUp,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface AnswerCardProps {
  result: TerraAskResult;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ result }) => {
  const [showFullProvenance, setShowFullProvenance] = useState(false);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  const getCategoryBadge = (category: DataCategory) => {
    switch (category) {
      case 'Observed':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
            Observed
          </span>
        );
      case 'Derived':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
            Derived
          </span>
        );
      case 'Model-based':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/40">
            Model-based
          </span>
        );
      case 'Interpretation':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/40">
            Interpretation
          </span>
        );
      case 'Unavailable':
      default:
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/40">
            Unavailable
          </span>
        );
    }
  };

  const decisionAnswer = result.decisionAnswer;

  // Filter evidence into Rule 19 groups
  const observedEvidence = result.evidence.filter(e => e.category === 'Observed');
  const satelliteEvidence = result.evidence.filter(
    e => e.id.includes('satellite-cloud-proxy') || e.id.includes('satellite-centroid-offset')
  );
  const temporalEvidence = result.evidence.filter(
    e => e.id.includes('temporal-comparison') || e.id.includes('forward-speed')
  );
  const otherEvidence = result.evidence.filter(
    e => !observedEvidence.includes(e) && !satelliteEvidence.includes(e) && !temporalEvidence.includes(e)
  );

  const renderEvidenceCard = (ev: EvidenceItem) => {
    const isExpanded = expandedEvidenceId === ev.id;
    return (
      <div
        key={ev.id}
        className="p-4 rounded-xl bg-earth-950/80 border border-earth-800 hover:border-earth-700 transition-all space-y-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-slate-200">{ev.label}</span>
            <div className="text-lg font-bold text-white tracking-tight font-mono mt-0.5">
              {ev.displayValue}
            </div>
          </div>
          {getCategoryBadge(ev.category)}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {ev.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-earth-800/80 text-[11px] text-slate-400 font-mono">
          {ev.timestamp && (
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{ev.timestamp}</span>
            </div>
          )}
          {ev.coordinates && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{ev.coordinates[0].toFixed(2)}°N, {ev.coordinates[1].toFixed(2)}°E</span>
            </div>
          )}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setExpandedEvidenceId(isExpanded ? null : ev.id)}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 shrink-0 font-sans transition-colors"
            >
              <span>{isExpanded ? 'Hide Details' : 'Inspect Lineage'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2.5 p-3 rounded-lg bg-earth-900/90 border border-earth-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
            <div>
              <span className="text-slate-400">Source Provider:</span> <span className="text-slate-200">{ev.source}</span>
            </div>
            {ev.rawVariable && (
              <div>
                <span className="text-slate-400">Raw Variable:</span> <span className="text-cyan-300">{ev.rawVariable}</span>
              </div>
            )}
            {ev.rawValue !== undefined && (
              <div>
                <span className="text-slate-400">Raw Recorded Value:</span> <span className="text-white font-bold">{String(ev.rawValue)} {ev.rawUnit || ''}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Processing Method:</span> <span className="text-slate-200">{ev.processing}</span>
            </div>
            {ev.derivationDetails?.formula && (
              <div className="text-emerald-300">
                <span className="text-slate-400">Derivation Formula:</span> {ev.derivationDetails.formula}
              </div>
            )}
            {ev.limitations && (
              <div className="text-amber-300/90 font-sans pt-1">
                <span className="font-semibold text-amber-400">Limitation:</span> {ev.limitations}
              </div>
            )}
            {ev.rawUrl && (
              <div className="pt-1.5">
                <a
                  href={ev.rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-sans text-[11px]"
                >
                  <span>Open Direct Dataset Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. DIRECT ANSWER (Rule 19 Hierarchy: DIRECT ANSWER comes first) */}
      <div className="p-6 rounded-2xl bg-earth-900/90 border border-cyan-500/30 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xs uppercase tracking-widest font-bold text-cyan-400">
              Direct Decision Answer
            </h2>
          </div>
          {result.storm && (
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/80">
              Cyclone {result.storm.name} ({result.storm.season})
            </span>
          )}
        </div>

        {/* Primary Executive Answer */}
        <p className="text-base lg:text-lg text-white font-medium leading-relaxed">
          {decisionAnswer?.directAnswer || result.assessment || result.answer}
        </p>

        {/* Structured Dimension Breakdown (Rule 18) */}
        {decisionAnswer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
            {decisionAnswer.whatHappened && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">What Happened</span>
                <p className="text-slate-200 text-[11px] leading-snug">{decisionAnswer.whatHappened}</p>
              </div>
            )}
            {decisionAnswer.where && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Where</span>
                <p className="text-slate-200 text-[11px] leading-snug">{decisionAnswer.where}</p>
              </div>
            )}
            {decisionAnswer.when && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">When</span>
                <p className="text-slate-200 text-[11px] leading-snug font-mono text-cyan-300">{decisionAnswer.when}</p>
              </div>
            )}
            {decisionAnswer.howStrong && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Observed Strength</span>
                <p className="text-slate-200 text-[11px] leading-snug">{decisionAnswer.howStrong}</p>
              </div>
            )}
            {decisionAnswer.whatSatelliteShows && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Satellite Evidence</span>
                <p className="text-slate-200 text-[11px] leading-snug">{decisionAnswer.whatSatelliteShows}</p>
              </div>
            )}
            {decisionAnswer.whatChangedOverTime && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Change Over Time</span>
                <p className="text-slate-200 text-[11px] leading-snug">{decisionAnswer.whatChangedOverTime}</p>
              </div>
            )}
            {decisionAnswer.supportingEvidenceSummary && (
              <div className="p-2.5 rounded-lg bg-earth-950/60 border border-earth-800 space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Supporting Evidence Lineage</span>
                <p className="text-slate-300 text-[11px] leading-snug">{decisionAnswer.supportingEvidenceSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* Temporal Synchronization Strip (Rule 13) */}
        {result.temporalSync && (
          <div className="pt-2 border-t border-earth-800 text-[11px] text-slate-400 flex flex-col gap-1 font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                Track Fix: <strong className="text-white">{result.temporalSync.trackTimestamp}</strong>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span>
                Terra Overpass: <strong className="text-cyan-300">{result.temporalSync.satelliteTimestamp}</strong>
              </span>
            </div>
            <div className="text-[10px] text-slate-400 italic font-sans pl-5">
              {result.temporalSync.synchronizationNote}
            </div>
          </div>
        )}
      </div>

      {/* 2. OBSERVED EVIDENCE (Rule 19 Hierarchy) */}
      {observedEvidence.length > 0 && (
        <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
                Observed In-Situ / Best-Track Evidence
              </h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono">
              {observedEvidence.length} direct records
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {observedEvidence.map(renderEvidenceCard)}
          </div>
        </div>
      )}

      {/* 3. SATELLITE EVIDENCE (Derived Visuals) */}
      {satelliteEvidence.length > 0 && (
        <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
                Satellite-Derived Visual Evidence (NASA MODIS Terra)
              </h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono">
              {satelliteEvidence.length} derived metrics
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {satelliteEvidence.map(renderEvidenceCard)}
          </div>
        </div>
      )}

      {/* 4. CHANGE OVER TIME (Temporal Analytics) */}
      {temporalEvidence.length > 0 && (
        <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
                Change Over Time &amp; Temporal Evolution
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-mono">
              {temporalEvidence.length} temporal metrics
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {temporalEvidence.map(renderEvidenceCard)}
          </div>
        </div>
      )}

      {/* 5. INTERPRETATION & MODEL-BASED CONTEXT */}
      {otherEvidence.length > 0 && (
        <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
                Contextual &amp; Model-Based Evidence
              </h3>
            </div>
            <span className="text-xs text-purple-400 font-mono">
              {otherEvidence.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {otherEvidence.map(renderEvidenceCard)}
          </div>
        </div>
      )}

      {/* 6. WHAT TERRAASK CANNOT DETERMINE (LIMITATIONS - Rule 19 Hierarchy) */}
      <div className="p-6 rounded-2xl bg-earth-900/80 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs uppercase tracking-widest font-bold text-amber-400">
            What TerraAsk Cannot Determine (Limitations)
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed space-y-2.5">
          <div className="font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{result.uncertainty.statement}</span>
          </div>

          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-300">
            {(decisionAnswer?.whatCannotBeDetermined || result.uncertainty.limitations).map((lim, idx) => (
              <li key={idx} className="leading-relaxed">
                {lim}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7. SOURCES / EVIDENCE (Clickable Provenance Lineage - Rule 19 Hierarchy) */}
      <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
              Authoritative Provenance Lineage
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullProvenance(!showFullProvenance)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>{showFullProvenance ? 'Collapse Lineage' : 'Inspect Full Lineage'}</span>
            {showFullProvenance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="space-y-3">
          {result.provenance.slice(0, showFullProvenance ? result.provenance.length : 2).map((prov, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-earth-950/60 border border-earth-800/80 text-xs text-slate-300 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{prov.dataset}</span>
                <a
                  href={prov.citationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-slate-400 text-[11px]">
                <strong className="text-slate-300">Provider:</strong> {prov.source}
              </div>
              <div className="text-slate-400 text-[11px]">
                <strong className="text-slate-300">Coverage:</strong> {prov.geographicCoverage}
              </div>
              <div className="text-slate-400 text-[11px]">
                <strong className="text-slate-300">Processing:</strong> {prov.processingPerformed}
              </div>
              {prov.observationTime && (
                <div className="text-slate-400 text-[11px]">
                  <strong className="text-slate-300">Timestamp:</strong> <span className="font-mono text-cyan-400">{prov.observationTime}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
