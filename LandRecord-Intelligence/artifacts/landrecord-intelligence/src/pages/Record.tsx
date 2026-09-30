import React, { useState, useEffect } from 'react';
import { Braces, ExternalLink, Highlighter, MapPin, ArrowRight, ShieldCheck, Eye, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { getStoredAnalysis, subscribeAnalysis } from '@/services/analysisService';
import type { AnalysisResult, ExtractedField } from '@/types/analysis';

const ND = <span className="text-slate-400 italic text-xs">Not detected</span>;
const ndText = (v?: string | null) => v || 'Not detected';

export function RecordPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(getStoredAnalysis);
  const [showJson, setShowJson] = useState(false);
  const [selectedFieldEvidence, setSelectedFieldEvidence] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAnalysis(setAnalysis);
    return unsub;
  }, []);

  const f = analysis.fields;
  const hasDocument = Boolean(analysis.document_id);

  const displayFields: { label: string; key: string; field?: ExtractedField }[] = [
    { label: 'Raiyat (Titleholder) Name', key: 'raiyat_name', field: f.raiyat_name },
    { label: 'Father / Husband Name', key: 'father_or_husband_name', field: f.father_or_husband_name },
    { label: 'Computerized Jamabandi ID', key: 'computerized_jamabandi_number', field: f.computerized_jamabandi_number },
    { label: 'Legacy Jamabandi Number', key: 'jamabandi_number', field: f.jamabandi_number },
    { label: 'Khata Number (Ledger)', key: 'khata_number', field: f.khata_number },
    { label: 'Khesra (Plot) Number', key: 'khesra_plot_number', field: f.khesra_plot_number },
    { label: 'Bhag Vartaman / Prishth', key: 'volume_page', field: (f.bhag_vartaman?.original || f.prishth_sankhya?.original) ? {
      original: `भाग ${f.bhag_vartaman?.original || '—'}, पृष्ठ ${f.prishth_sankhya?.original || '—'}`,
      normalized: `Vol: ${f.bhag_vartaman?.normalized || '—'}, Pg: ${f.prishth_sankhya?.normalized || '—'}`,
      confidence: Math.min(f.bhag_vartaman?.confidence || 0, f.prishth_sankhya?.confidence || 0),
      evidence: [...(f.bhag_vartaman?.evidence || []), ...(f.prishth_sankhya?.evidence || [])]
    } : undefined },
    { label: 'Area (Rakba)', key: 'land_area', field: f.land_area },
    { label: 'Village / Mauza', key: 'mauja', field: f.mauja || f.mauza },
    { label: 'Circle / Anchal', key: 'anchal', field: f.anchal },
    { label: 'District / State', key: 'district', field: (f.district?.original || f.district?.normalized) ? {
      original: `${f.district?.original || f.district?.normalized}, बिहार`,
      normalized: `${f.district?.normalized || f.district?.original}, Bihar`,
      confidence: f.district?.confidence || 0.95,
      evidence: f.district?.evidence || []
    } : undefined },
    { label: 'Dakhil-Kharij / Mutation', key: 'mutation_status', field: f.mutation_status },
  ];

  const isNonLand = analysis.document_classification === 'NON_LAND_DOCUMENT';

  return (
    <>
      <PageHead eyebrow="Structured Record / Step 03" title="What the Land Record Contains">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/digital-reference"
            className="border border-emerald-700 text-emerald-800 bg-emerald-50 px-3 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Digital Panji-II View</span>
          </Link>
          <button
            onClick={() => setShowJson((v) => !v)}
            className="border border-[#9ea8a2] bg-white text-[#202e35] px-3 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 hover:bg-[#e9e4d9] transition-colors"
            data-testid="button-view-json"
          >
            <Braces className="w-3.5 h-3.5" />
            <span>{showJson ? 'Hide Raw JSON' : 'View Raw JSON'}</span>
          </button>
          <Link
            href="/validation"
            className="bg-[#214f4e] hover:bg-[#173e3d] text-white px-3.5 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm transition-colors"
            data-testid="link-to-validation"
          >
            <span>Compare with Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PageHead>

      {isNonLand && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900">
          <p className="font-bold text-sm">Document not recognized as a land record</p>
          <p className="mt-1 text-red-800">
            The uploaded file does not appear to contain a compatible land-record document. No owner or parcel fields were populated.
          </p>
        </div>
      )}

      {showJson && (
        <Panel className="mb-6 p-5 bg-[#142127] text-[#eee9dc] rounded-xl overflow-auto border border-[#3b4a4e]">
          <pre className="font-mono text-xs leading-relaxed max-h-96">
            {JSON.stringify(analysis, null, 2)}
          </pre>
        </Panel>
      )}

      <div className="grid xl:grid-cols-[0.8fr_1.2fr] gap-6">
        {/* Source Document & Evidence Inspector */}
        <Panel className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d5cdbd]">
              <div className="flex items-center gap-2">
                <SectionLabel>Document Evidence Inspector</SectionLabel>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e9e4d9] text-[#34484a] font-bold">
                  {analysis.ocr_path_used}
                </span>
              </div>
              <Link href="/digital-reference" className="text-[#214f4e] hover:underline text-xs font-semibold flex items-center gap-1">
                <span>Portal View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Document Visualizer */}
            {!hasDocument ? (
              <div className="mt-4 min-h-[220px] flex flex-col items-center justify-center text-center text-[#687571] border border-dashed border-[#c9c8bd] rounded-lg p-8">
                <span className="text-4xl mb-3">📄</span>
                <p className="font-semibold text-[#202e35]">No document processed yet</p>
                <p className="text-sm mt-1">Upload a land record document to see extracted fields here.</p>
              </div>
            ) : (
            <div className="relative mt-4 min-h-[380px] bg-amber-50/70 border border-amber-200 rounded-lg p-5 overflow-hidden font-serif">
              <div className="text-center border-b border-amber-300/80 pb-3 mb-4">
                <div className="text-[11px] font-bold text-amber-950 tracking-wider">
                  BhuVerify — Extracted Document View
                </div>
                <div className="text-xs font-semibold text-[#34484a] mt-0.5">
                  {analysis.ocr_path_used?.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] font-mono text-[#52605d] mt-1">
                  CASE ID: {analysis.document_id} · FILE: {analysis.file_name}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-2 bg-white/90 rounded border border-amber-200">
                  <span className="text-[10px] text-[#52605d] block font-sans font-semibold">Computerized Jamabandi No.:</span>
                  {f.computerized_jamabandi_number?.original ? (
                    <mark className="bg-amber-200 text-[#142127] px-1 py-0.5 font-mono font-bold rounded">
                      {f.computerized_jamabandi_number.original}
                    </mark>
                  ) : ND}
                </div>

                <div className="p-2 bg-white/90 rounded border border-amber-200">
                  <span className="text-[10px] text-[#52605d] block font-sans font-semibold">Raiyat Name (Owner):</span>
                  {f.raiyat_name?.original ? (
                    <mark className="bg-amber-200 text-[#142127] px-1 py-0.5 font-bold rounded">{f.raiyat_name.original}</mark>
                  ) : ND}
                  {f.father_or_husband_name?.original && (
                    <span className="text-[11px] text-[#52605d] ml-2">
                      Father/Husband: {f.father_or_husband_name.original}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white/90 rounded border border-amber-200">
                    <span className="text-[10px] text-[#52605d] block font-sans font-semibold">Khata No.:</span>
                    {f.khata_number?.original ? (
                      <mark className="bg-amber-200 text-[#142127] px-1 py-0.5 font-bold rounded">{f.khata_number.original}</mark>
                    ) : ND}
                  </div>
                  <div className="p-2 bg-white/90 rounded border border-amber-200">
                    <span className="text-[10px] text-[#52605d] block font-sans font-semibold">Khesra/Plot No.:</span>
                    {f.khesra_plot_number?.original ? (
                      <mark className="bg-amber-200 text-[#142127] px-1 py-0.5 font-bold rounded">{f.khesra_plot_number.original}</mark>
                    ) : ND}
                  </div>
                </div>

                <div className="p-2 bg-white/90 rounded border border-amber-200">
                  <span className="text-[10px] text-[#52605d] block font-sans font-semibold">Land Area (Rakba):</span>
                  {f.land_area?.original ? (
                    <mark className="bg-amber-200 text-[#142127] px-1 py-0.5 font-semibold rounded">{f.land_area.original}</mark>
                  ) : ND}
                </div>
              </div>

              {/* Verified Stamp */}
              <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-2 border-emerald-700 text-emerald-800 text-[8px] font-sans font-bold flex flex-col items-center justify-center text-center rotate-[-10deg] bg-emerald-50/90 p-1 shadow-sm">
                <span>BHU-VERIFY</span>
                <span className="text-[7px]">CASE RECORD</span>
                <span className="text-[6px]">{isNonLand ? 'REJECTED' : 'PROCESSED'}</span>
              </div>
            </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#52605d]">
            <Highlighter className="w-4 h-4 text-[#214f4e] shrink-0" />
            <span>Amber highlights mark verbatim OCR extracts grounded to source bounding boxes.</span>
          </div>
        </Panel>

        {/* Extracted Parcel Fields Table */}
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#d5cdbd]">
            <div>
              <SectionLabel>Extracted Registry Attributes</SectionLabel>
              <h2 className="font-serif text-xl font-bold text-[#202e35] mt-1">
                {analysis.document_id || 'No active case'}
              </h2>
            </div>
            {hasDocument && (
              <StatusBadge tone={analysis.status === 'VERIFIED' ? 'good' : analysis.status === 'REVIEW_REQUIRED' ? 'warn' : 'danger'}>
                {analysis.status?.replace(/_/g, ' ') || 'UNKNOWN'}
              </StatusBadge>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {displayFields.map((item) => {
              const field = item.field;
              const hasValue = Boolean(field?.normalized || field?.original);
              const isSelected = selectedFieldEvidence === item.key;
              const confPct = hasValue ? Math.round((field?.confidence ?? 0.85) * 100) : 0;

              return (
                <div key={item.key} className="py-2.5 border-b border-[#e3dccf]">
                  <div className="flex items-center justify-between">
                    <SectionLabel>{item.label}</SectionLabel>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#e9e4d9] text-[#34484a] rounded">
                      {confPct}% conf
                    </span>
                  </div>

                  <div className="mt-1 font-semibold text-sm text-[#202e35]">
                    {field?.normalized || field?.original || <span className="text-[#687571] italic text-xs font-normal">Not detected</span>}
                  </div>

                  {field?.original && field?.original !== field?.normalized && (
                    <div className="text-[11px] text-[#52605d] mt-0.5">
                      Raw: "{field.original}"
                    </div>
                  )}

                  {/* Evidence Toggle */}
                  {field?.evidence && field.evidence.length > 0 && (
                    <div className="mt-1.5">
                      <button
                        onClick={() => setSelectedFieldEvidence(isSelected ? null : item.key)}
                        className="text-[11px] text-[#214f4e] font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Evidence snippet</span>
                        {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isSelected && (
                        <div className="mt-1.5 p-2 rounded bg-[#f7f3eb] border border-[#d5cdbd] text-[11px] text-[#34484a] font-mono">
                          <div>Page: {field.evidence[0].page}</div>
                          <div className="italic text-[#142127] mt-0.5">
                            "{field.evidence[0].text}"
                          </div>
                          {field.evidence[0].bbox && (
                            <div className="text-[10px] text-[#52605d] mt-0.5">
                              BBox: [{field.evidence[0].bbox.join(', ')}]
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`mt-6 border-l-4 p-4 rounded-r-lg flex gap-3 ${
            !hasDocument ? 'bg-[#f3eee3] border-[#9ea8a2]' :
            analysis.overall_confidence > 0.7 ? 'bg-emerald-50 border-emerald-600' : 'bg-amber-50 border-amber-500'
          }`}>
            <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${
              !hasDocument ? 'text-[#687571]' :
              analysis.overall_confidence > 0.7 ? 'text-emerald-700' : 'text-amber-600'
            }`} />
            <div>
              <p className={`text-sm font-semibold ${
                !hasDocument ? 'text-[#202e35]' :
                analysis.overall_confidence > 0.7 ? 'text-emerald-950' : 'text-amber-900'
              }`}>
                {!hasDocument
                  ? 'No document processed'
                  : `Overall Extraction Confidence: ${Math.round(analysis.overall_confidence * 100)}%`}
              </p>
              <p className="text-xs text-[#4a5754] mt-0.5">
                {!hasDocument
                  ? 'Upload a land record document using the New examination link to see extracted fields.'
                  : analysis.overall_confidence > 0.7
                  ? 'Proceed to Registry Validation to compare against the Bihar Department database.'
                  : 'Low confidence or unverified document — requires human officer review.'}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}