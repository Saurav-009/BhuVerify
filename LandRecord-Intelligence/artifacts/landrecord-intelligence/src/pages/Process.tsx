import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, CircleDot, FileSearch, GitCompareArrows, LandPlot, ShieldCheck, Sparkles, Cpu, XCircle, UploadCloud, FileText } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { PageHead, Panel } from '@/components/AppShell';
import { getStoredAnalysis, loadSampleAnalysis } from '@/services/analysisService';

const PIPELINE_STAGES = [
  { title: 'Document Ingestion & Format Detection', detail: 'Detecting PDF text layer vs scanned raster image (PyPDF / PyMuPDF)' },
  { title: 'Document Type Classification', detail: 'Verifying document is a Bihar Jamabandi / land registry record' },
  { title: 'Hybrid OCR & Layout Normalization', detail: 'Cleaning Devanagari numerals and isolating tabular Jamabandi blocks' },
  { title: 'Gemini Flash Structured Extraction', detail: 'Isolating 14 key land registry fields with verbatim evidence coordinates' },
  { title: 'Department of Land Resources Registry Matching', detail: 'Cross-verifying Computerized Jamabandi, Raiyat, and Mauza against database' },
  { title: 'Deterministic Risk & Anomaly Scoring', detail: 'Evaluating mutation integrity, owner match, and encumbrance flags' },
];

export function ProcessPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const analysis = getStoredAnalysis();

  const classification = analysis.document_classification;
  const isNonLandDocument = classification === 'NON_LAND_DOCUMENT';
  const isUncertain = classification === 'UNCERTAIN';

  useEffect(() => {
    if (isNonLandDocument) {
      // Stop at step 1 (classification gate)
      setStep(1);
      setDone(true);
      return;
    }

    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= PIPELINE_STAGES.length - 1) {
          clearInterval(timer);
          setDone(true);
          setTimeout(() => setLocation('/record'), 700);
          return prev;
        }
        return prev + 1;
      });
    }, 650);

    return () => clearInterval(timer);
  }, [setLocation, isNonLandDocument]);

  const icons = [FileSearch, ShieldCheck, Cpu, Sparkles, GitCompareArrows, LandPlot];

  // ── NON_LAND_DOCUMENT rejection screen ──────────────────────────────────────
  if (done && isNonLandDocument) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHead eyebrow="Document Classification / Step 02" title="Document Not Recognized" />
        <Panel className="p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-300 flex items-center justify-center mb-5">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="font-serif text-2xl text-[#202e35]" data-testid="heading-non-land-doc">
              Document not recognized as a land record
            </h2>
            <p className="text-sm text-[#4a5754] mt-3 max-w-md leading-relaxed" data-testid="text-non-land-doc-subtitle">
              The uploaded file does not appear to contain a compatible land-record document.
            </p>

            {analysis.document_classification_reason && (
              <div className="mt-5 w-full p-4 bg-amber-50 border border-amber-300 rounded-lg text-left">
                <p className="text-xs font-semibold text-amber-900 mb-1">Classification analysis:</p>
                <p className="text-xs text-amber-800 leading-relaxed">{analysis.document_classification_reason}</p>
              </div>
            )}

            <div className="mt-4 w-full p-4 bg-[#f3eee3] border border-[#d5cdbd] rounded-lg text-left text-xs text-[#4a5754] leading-relaxed">
              <strong>Accepted documents:</strong> Scanned PDF, JPEG, or TIFF of Bihar Jamabandi / Bhu-Abhilekh land registry records.<br/>
              <strong>Zero-fabrication policy:</strong> Unrelated screenshots or non-land images are blocked before field extraction, GIS mapping, and risk scoring.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-7 w-full">
              <Link
                href="/upload"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#214f4e] hover:bg-[#173e3d] text-white font-semibold px-5 py-3 rounded-lg text-sm transition-colors"
                data-testid="link-upload-another"
              >
                <UploadCloud className="w-4 h-4" /> Upload another document
              </Link>
              <button
                onClick={async () => {
                  await loadSampleAnalysis();
                  setLocation('/processing');
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-[#214f4e] bg-white hover:bg-[#e7eeea] text-[#202e35] font-semibold px-5 py-3 rounded-lg text-sm transition-colors"
                data-testid="button-try-demo-from-rejection"
              >
                <FileText className="w-4 h-4 text-[#214f4e]" /> Try Demo Land Record
              </button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  // ── UNCERTAIN banner (shown and marked for human review) ────────────────────
  return (
    <div className="max-w-3xl mx-auto">
      <PageHead eyebrow="Intelligent Processing / Step 02" title="Analyzing Land Record">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300">
            {analysis.ocr_path_used || 'DIGITAL_PDF_TEXT_LAYER'}
          </span>
        </div>
      </PageHead>

      {isUncertain && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3" data-testid="banner-uncertain-doc">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Document type could not be verified</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              {analysis.document_classification_reason || 'Document type could not be verified automatically. Marked for human officer review.'}
            </p>
          </div>
        </div>
      )}

      <Panel className="p-6 md:p-10">
        <div className="relative h-2.5 bg-[#e4e2d9] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / PIPELINE_STAGES.length) * 100}%` }}
          />
        </div>

        <div className="mt-8 space-y-6">
          {PIPELINE_STAGES.map((s, i) => {
            const Icon = icons[i];
            const isDone = i < step;
            const isCurrent = i === step;

            return (
              <div
                key={s.title}
                className={`flex items-start gap-4 transition-all duration-300 ${i > step ? 'opacity-40' : 'opacity-100'}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border transition-colors ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isCurrent
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50 animate-pulse'
                      : 'border-[#c9c8bd] text-[#687571]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-[#202e35]">{s.title}</div>
                    {isCurrent && (
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        PROCESSING
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">RESOLVED</span>
                    )}
                  </div>
                  <div className="text-xs text-[#52605d] mt-0.5">{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex items-center justify-center gap-2 mt-5 text-center text-xs text-[#52605d]">
        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
        <span>Grounded extraction active: Zero hallucination policy enforced through verbatim coordinates</span>
      </div>
    </div>
  );
}