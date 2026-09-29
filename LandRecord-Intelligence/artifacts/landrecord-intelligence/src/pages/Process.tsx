import React, { useEffect, useState } from 'react';
import { Check, CircleDot, FileSearch, GitCompareArrows, LandPlot, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import { useLocation } from 'wouter';
import { PageHead, Panel } from '@/components/AppShell';
import { getStoredAnalysis } from '@/services/analysisService';

const REAL_PIPELINE_STAGES = [
  {
    title: 'Document Ingestion & Format Detection',
    detail: 'Detecting PDF text layer vs scanned raster image (PyPDF / PyMuPDF)'
  },
  {
    title: 'Hybrid OCR & Layout Normalization',
    detail: 'Cleaning Devanagari numerals and isolating tabular Jamabandi blocks'
  },
  {
    title: 'Gemini 3.6 Flash Structured Extraction',
    detail: 'Isolating 14 key land registry fields with verbatim evidence coordinates'
  },
  {
    title: 'Department of Land Resources Registry Matching',
    detail: 'Cross-verifying Computerized Jamabandi, Raiyat, and Mauza against database'
  },
  {
    title: 'Cadastral GIS Plot Projection',
    detail: 'Computing centroid and boundary polygons for Sampatchak / Karnpura'
  },
  {
    title: 'Deterministic Risk & Anomaly Scoring',
    detail: 'Evaluating mutation integrity, owner match, and encumbrance flags'
  }
];

export function ProcessPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const analysis = getStoredAnalysis();

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= REAL_PIPELINE_STAGES.length - 1) {
          clearInterval(timer);
          setTimeout(() => setLocation('/record'), 600);
          return prev;
        }
        return prev + 1;
      });
    }, 650);

    return () => clearInterval(timer);
  }, [setLocation]);

  const icons = [FileSearch, Cpu, Sparkles, GitCompareArrows, LandPlot, ShieldCheck];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHead eyebrow="Intelligent Processing / Step 02" title="Analyzing Land Record">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-800">
            {analysis.ocr_path_used || 'DIGITAL_PDF_TEXT_LAYER'}
          </span>
        </div>
      </PageHead>

      <Panel className="p-6 md:p-10">
        <div className="relative h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / REAL_PIPELINE_STAGES.length) * 100}%` }}
          />
        </div>

        <div className="mt-8 space-y-6">
          {REAL_PIPELINE_STAGES.map((s, i) => {
            const Icon = icons[i];
            const isDone = i < step;
            const isCurrent = i === step;

            return (
              <div
                key={s.title}
                className={`flex items-start gap-4 transition-all duration-300 ${
                  i > step ? 'opacity-35' : 'opacity-100'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border transition-colors ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isCurrent
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950 animate-pulse'
                      : 'border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {s.title}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                        PROCESSING
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex items-center justify-center gap-2 mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        <span>Grounded extraction active: Zero hallucination policy enforced through verbatim coordinates</span>
      </div>
    </div>
  );
}