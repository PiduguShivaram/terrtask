'use client';

import React, { useState } from 'react';
import { TerraAskResult, DataCategory } from '@/lib/types';
import { 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  FileText, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

interface AnswerCardProps {
  result: TerraAskResult;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ result }) => {
  const [showFullProvenance, setShowFullProvenance] = useState(false);

  const getCategoryBadge = (category: DataCategory) => {
    switch (category) {
      case 'Observed':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            Observed
          </span>
        );
      case 'Derived':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Derived
          </span>
        );
      case 'Model-based':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Model-based
          </span>
        );
      case 'Unavailable':
      default:
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Unavailable
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. ANSWER SECTION */}
      <div className="p-6 rounded-2xl bg-earth-900/90 border border-earth-700/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <h2 className="text-xs uppercase tracking-widest font-bold text-cyan-400">
            Earth-Observation Assessment
          </h2>
        </div>

        <p className="text-base lg:text-lg text-slate-100 font-medium leading-relaxed">
          {result.answer}
        </p>
      </div>

      {/* 2. EVIDENCE SECTION */}
      <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
              Verified Observational Evidence
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {result.evidence.length} validated data points
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {result.evidence.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-earth-950/70 border border-earth-800 hover:border-earth-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">{ev.label}</span>
                  {getCategoryBadge(ev.category)}
                </div>

                <div className="text-lg font-bold text-white tracking-tight mb-1 font-mono">
                  {ev.value}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {ev.description}
                </p>
              </div>

              <div className="pt-2 border-t border-earth-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate pr-2 font-medium text-slate-400">{ev.source}</span>
                {ev.timestamp && (
                  <span className="font-mono text-cyan-400/80 shrink-0">{ev.timestamp.slice(0, 16)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. REASONING SECTION */}
      <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
            Auditable Physical Reasoning
          </h3>
        </div>

        <div className="text-xs lg:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-earth-950/60 p-4 rounded-xl border border-earth-800 font-sans">
          {result.reasoning}
        </div>
      </div>

      {/* 4. CONFIDENCE & UNCERTAINTY SECTION */}
      <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
            Confidence &amp; Observational Uncertainty
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          <p className="font-medium mb-2">{result.uncertainty.statement}</p>

          {result.uncertainty.metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-amber-500/20">
              {result.uncertainty.metrics.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-earth-950/60 border border-amber-500/20">
                  <div className="text-[10px] text-amber-400 font-semibold uppercase">{m.label}</div>
                  <div className="text-sm font-bold text-white font-mono my-0.5">{m.value}</div>
                  <div className="text-[10px] text-slate-400">{m.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. PROVENANCE & DATA REPRODUCIBILITY */}
      <div className="p-6 rounded-2xl bg-earth-900/80 border border-earth-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-300">
              Authoritative Provenance &amp; Lineage
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullProvenance(!showFullProvenance)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>{showFullProvenance ? 'Collapse Lineage' : 'Inspect Full Sources'}</span>
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
                <strong className="text-slate-300">Agency:</strong> {prov.source}
              </div>
              <div className="text-slate-400 text-[11px]">
                <strong className="text-slate-300">Coverage:</strong> {prov.geographicCoverage}
              </div>
              <div className="text-slate-400 text-[11px]">
                <strong className="text-slate-300">Processing:</strong> {prov.processingPerformed}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
