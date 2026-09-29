import React, { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, FileImage, FileText, UploadCloud, Cpu, Sparkles, Database, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import { PageHead, Panel } from '@/components/AppShell';
import { analyzeDocument, loadSampleAnalysis } from '@/services/analysisService';

export function UploadPage() {
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [busyStatus, setBusyStatus] = useState<string>('');

  const handleFileSelect = (f?: File) => {
    if (!f) return;
    setSelectedFile(f);
    setFileMeta({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type || 'application/pdf',
    });
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;
    setIsBusy(true);
    setBusyStatus('Initializing Dual OCR & Gemini pipeline...');

    try {
      // Small progress display before redirecting to processing animation
      setTimeout(() => setBusyStatus('Extracting text & visual features...'), 600);
      
      // Send real upload to backend
      await analyzeDocument(selectedFile);
      setLocation('/processing');
    } catch (err) {
      console.error('Upload analysis failed:', err);
      setLocation('/processing');
    }
  };

  const handleUseSample = async (sampleId: string = 'BR_PATNA_SAMPATCHAK_001') => {
    setIsBusy(true);
    setBusyStatus(`Loading Bihar Official Dataset (${sampleId})...`);
    try {
      await loadSampleAnalysis(sampleId);
      setLocation('/processing');
    } catch (e) {
      console.error(e);
      setLocation('/processing');
    }
  };

  return (
    <>
      <PageHead eyebrow="Intelligent Ingestion / Step 01" title="Upload Bihar Land Record (Jamabandi / Bhu-Abhilekh)">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Cpu className="w-3 h-3" />
            Hybrid OCR + Gemini 3.6 Flash Active
          </span>
        </div>
      </PageHead>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
        {/* Main Upload Dropzone */}
        <Panel className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-bold">
                Document Upload Zone
              </span>
              <span className="text-[11px] text-slate-500">
                Supports Digital PDF, Scanned PDF, JPG, PNG
              </span>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              className="min-h-[260px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-xl grid place-items-center text-center cursor-pointer transition-all p-6 group"
              data-testid="dropzone-document"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <div>
                {fileMeta ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{fileMeta.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {fileMeta.size} · {fileMeta.type}
                    </p>
                    <button
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-4 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFileMeta(null);
                      }}
                      data-testid="button-remove-file"
                    >
                      Choose another file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 flex items-center justify-center transition-colors mb-3">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Drop Bihar Jamabandi record here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      or click to browse from your device
                    </p>
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      <span>DUAL OCR ENGINE</span>
                      <span>•</span>
                      <span>PYPDF / TESSERACT</span>
                      <span>•</span>
                      <span>GEMINI GROUNDING</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              disabled={!selectedFile || isBusy}
              onClick={handleStartAnalysis}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-medium px-6 py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              data-testid="button-start-examination"
            >
              {isBusy ? (
                <span>{busyStatus || 'Analyzing Document...'}</span>
              ) : (
                <>
                  <span>Extract & Validate with AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-500">
              Department of Land Resources (DoLR) schema verified
            </span>
          </div>
        </Panel>

        {/* Dataset Samples / Fast Demo Panel */}
        <Panel className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-400 font-bold mb-2">
              <Database className="w-3.5 h-3.5" />
              Verified Bihar Dataset Samples
            </div>
            <h2 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
              Patna / Sampatchak Jamabandi Panji II
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5">
              Official digitized Jamabandi records from Bihar Land Revenue portal (Karnpura-121, Circle Sampatchak). Pre-linked with ground truth registration registry.
            </p>

            <div className="mt-5 space-y-3">
              {/* Sample 1 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-emerald-500 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      BR_PATNA_SAMPATCHAK_001.pdf
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Smt. Kanti Devi · Khata 14 · Plot 108 · Clean Title
                    </div>
                  </div>
                </div>

                <button
                  disabled={isBusy}
                  onClick={() => handleUseSample('BR_PATNA_SAMPATCHAK_001')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                  data-testid="button-use-sample-1"
                >
                  <span>Load</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample 2 */}
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-emerald-500 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      BR_PATNA_SAMPATCHAK_002.pdf
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Sampatchak Survey Record · Multi-plot Jamabandi
                    </div>
                  </div>
                </div>

                <button
                  disabled={isBusy}
                  onClick={() => handleUseSample('BR_PATNA_SAMPATCHAK_002')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors"
                  data-testid="button-use-sample-2"
                >
                  <span>Load</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-slate-100 dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              Every extracted field is backed by verbatim bounding coordinates and cross-checked with official Department of Land Resources records.
            </span>
          </div>
        </Panel>
      </div>
    </>
  );
}