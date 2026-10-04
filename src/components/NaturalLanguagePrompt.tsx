'use client';

import React, { useState } from 'react';
import { Search, Loader2, Compass, Sparkles } from 'lucide-react';

interface NaturalLanguagePromptProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  currentQuery: string;
}

const SAMPLE_QUERIES = [
  'What is happening near Puri?',
  "What is happening near India's east coast?",
  'What evidence supports this intensity estimate?',
  'Show me how Cyclone Fani evolved.',
  'What is happening near Paradip?',
  'What is happening near Chennai?',
];

export const NaturalLanguagePrompt: React.FC<NaturalLanguagePromptProps> = ({
  onSearch,
  isLoading,
  currentQuery,
}) => {
  const [input, setInput] = useState(currentQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
    }
  };

  const handleSelectSample = (sample: string) => {
    setInput(sample);
    onSearch(sample);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-cyan-400 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Earth what is changing... (e.g. 'What is happening near Puri?')"
            className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-earth-900/90 border border-earth-700/80 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 shadow-inner transition-all"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Querying...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Ask Earth</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Inquiries */}
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 pl-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          Suggested:
        </span>
        {SAMPLE_QUERIES.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-md bg-earth-900/70 hover:bg-earth-800 text-slate-300 hover:text-cyan-300 border border-earth-800 hover:border-cyan-500/30 transition-all"
          >
            {sample}
          </button>
        ))}
      </div>
    </div>
  );
};
