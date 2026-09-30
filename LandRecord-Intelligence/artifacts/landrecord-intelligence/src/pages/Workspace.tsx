import { ArrowRight, Check, FileText, Fingerprint, LandPlot, ShieldAlert, UploadCloud, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { stages } from '@/data/mockData';
import { getStoredAnalysis } from '@/services/analysisService';
import type { AnalysisResult } from '@/types/analysis';

export function Workspace({ onLoad }: { onLoad: () => void }) {
  const analysis: AnalysisResult = getStoredAnalysis();
  const hasCase = Boolean(analysis.document_id);

  return <>
    <PageHead eyebrow="BhuVerify / Public Workspace" title="Land Record Digitization & Validation">
      <div className="flex items-center gap-2">
        {hasCase && (
          <button onClick={onLoad} className="bg-[#214f4e] text-[#f7f3eb] px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[#173e3d]" data-testid="button-load-demo">
            <Fingerprint size={16}/> Reload current case <ArrowRight size={15}/>
          </button>
        )}
      </div>
    </PageHead>

    {/* Hero / CTA */}
    {!hasCase && (
      <div className="mb-8 rounded-xl bg-[#202e35] text-[#eee9dc] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[.18em] text-[#d98549] mb-2">Intelligent Land Intelligence System</div>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight">Upload a land record to begin</h2>
          <p className="text-[#a9b5b4] mt-3 text-sm leading-relaxed max-w-lg">Upload any Bihar Jamabandi / Bhu-Abhilekh document (PDF, JPG, PNG) to extract, validate and risk-assess the record automatically.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/upload" className="inline-flex items-center gap-2 bg-[#d98549] hover:bg-[#c47840] text-[#202e35] font-semibold px-5 py-3 rounded-lg text-sm transition-colors" data-testid="link-start-upload">
              <UploadCloud size={16}/> Upload Land Document
            </Link>
            <button onClick={onLoad} className="inline-flex items-center gap-2 border border-[#3b4a4e] hover:bg-[#2e4145] text-[#d3d8d0] px-5 py-3 rounded-lg text-sm transition-colors" data-testid="button-try-demo">
              <FileText size={16}/> Try Demo Case (Bihar Sample)
            </button>
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-3 text-sm text-[#8ea09f] min-w-[200px]">
          {['Upload Document', 'Extract Fields', 'Validate vs Registry', 'Locate Parcel', 'Assess Risk', 'Generate Reference'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#3b4a4e] text-[#d98549] text-[10px] font-bold grid place-items-center">{i+1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Active Case Panel (shown only when a document has been processed) */}
    {hasCase && (
      <div className="grid lg:grid-cols-[1.4fr_.8fr] gap-5 mb-5">
        <Panel className="p-6 md:p-8 paper-grid">
          <div className="flex justify-between">
            <div>
              <SectionLabel>Active case — USER DOCUMENT</SectionLabel>
              <div className="font-mono text-xs text-[#b26337] mt-3">{analysis.document_id}</div>
              <h2 className="font-serif text-3xl mt-1">
                {analysis.fields?.raiyat_name?.normalized || analysis.fields?.raiyat_name?.original || <span className="text-[#8a928b] italic font-sans text-xl">Owner not detected</span>}
              </h2>
              <p className="text-sm text-[#687571] mt-1">
                {analysis.file_name} · {analysis.ocr_path_used?.replace(/_/g, ' ')}
              </p>
            </div>
            <StatusBadge tone={analysis.status === 'VERIFIED' ? 'good' : analysis.status === 'DISCREPANCY_FLAGGED' ? 'danger' : 'warn'}>
              {analysis.status?.replace(/_/g, ' ') || 'REVIEW REQUIRED'}
            </StatusBadge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-9 pt-5 border-t border-[#d5cdbd]">
            {[
              ['Document', analysis.file_name || '—'],
              ['Overall Confidence', analysis.overall_confidence ? `${Math.round(analysis.overall_confidence * 100)}%` : '—'],
              ['Risk Score', analysis.risk_analysis?.risk_score != null ? `${analysis.risk_analysis.risk_score} / 100` : '—'],
              ['Risk Level', analysis.risk_analysis?.risk_level || '—'],
            ].map(([a, b]) => (
              <div key={a}>
                <SectionLabel>{a}</SectionLabel>
                <p className="font-mono text-sm mt-2 text-[#202e35]">{b}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-6">
          <div className="flex items-center justify-between mb-5">
            <SectionLabel>Pipeline progress</SectionLabel>
            <span className="text-[11px] font-mono text-[#b26337]">06 / 06</span>
          </div>
          <div className="space-y-4">
            {stages.map((s, i) => (
              <div className="flex items-center gap-3" key={s}>
                <span className="w-5 h-5 grid place-items-center border border-[#43736b] bg-[#43736b] text-white">
                  <Check size={12}/>
                </span>
                <span className="text-sm text-[#202e35]">{s}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    )}

    {/* Bottom action cards */}
    <div className="grid md:grid-cols-3 gap-5">
      <Panel className="p-6">
        <UploadCloud className="text-[#b26337] mb-5" size={22}/>
        <h3 className="font-semibold text-[#202e35]">{hasCase ? 'Upload new document' : 'Start an examination'}</h3>
        <p className="text-sm text-[#687571] mt-2 leading-relaxed">
          Upload a scanned registry document. PDF, JPG and PNG files are supported.
        </p>
        <Link href="/upload" className="inline-flex items-center gap-2 text-sm text-[#214f4e] font-semibold mt-5" data-testid="link-upload-start">
          Open upload desk <ArrowRight size={14}/>
        </Link>
      </Panel>

      <Panel className="p-6">
        <ShieldAlert className="text-[#b26337] mb-5" size={22}/>
        <h3 className="font-semibold text-[#202e35]">
          {hasCase ? 'Review risk analysis' : 'Risk engine ready'}
        </h3>
        <p className="text-sm text-[#687571] mt-2 leading-relaxed">
          {hasCase
            ? `Risk score: ${analysis.risk_analysis?.risk_score ?? '—'}/100 · ${analysis.risk_analysis?.risk_level ?? ''}`
            : 'Upload a document first to activate the deterministic risk scoring engine.'}
        </p>
        {hasCase ? (
          <Link href="/risk" className="inline-flex items-center gap-2 text-sm text-[#214f4e] font-semibold mt-5" data-testid="link-risk-review">
            Open risk assessment <ArrowRight size={14}/>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-[#8a928b] mt-5 italic">No document processed</span>
        )}
      </Panel>

      <Panel className="p-6">
        <FileText className="text-[#b26337] mb-5" size={22}/>
        <h3 className="font-semibold text-[#202e35]">Demo dataset</h3>
        <p className="text-sm text-[#687571] mt-2 leading-relaxed">
          Try with a prepared Bihar Jamabandi record — Smt. Kanti Devi, Sampatchak, Patna.
        </p>
        <button onClick={onLoad} className="inline-flex items-center gap-2 mt-5 text-sm text-[#a65435] font-semibold" data-testid="button-load-demo-case">
          Load Bihar Sample <ArrowRight size={14}/>
        </button>
      </Panel>
    </div>
  </>;
}