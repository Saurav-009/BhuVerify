import React, { useState, useEffect } from 'react';
import { ArrowRight, Compass, Info, MapPin, Search, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { demoCadastralData } from '@/data/cadastralData';
import { locationService, type LocationResolution } from '@/services/locationService';
import { CadastralMap } from '@/components/CadastralMap';
import { getStoredAnalysis, subscribeAnalysis } from '@/services/analysisService';
import type { AnalysisResult } from '@/types/analysis';

export function GisPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(getStoredAnalysis);
  const hasDocument = Boolean(analysis.document_id);
  const isNonLand = analysis.document_classification === 'NON_LAND_DOCUMENT';

  const getExtractedSearch = (a: AnalysisResult) => {
    if (!a.document_id || a.document_classification === 'NON_LAND_DOCUMENT') {
      return {
        state: '',
        district: '',
        village: '',
        surveyNumber: '',
      };
    }
    return {
      state: a.detected_state || (a.fields.district?.normalized ? 'Bihar' : ''),
      district: a.fields.district?.normalized || a.fields.district?.original || '',
      village: a.fields.mauza?.normalized || a.fields.mauja?.normalized || a.fields.mauja?.original || '',
      surveyNumber: a.fields.khesra_plot_number?.normalized || a.fields.khesra_plot_number?.original || '',
    };
  };

  const [form, setForm] = useState(() => getExtractedSearch(analysis));
  const [result, setResult] = useState<LocationResolution>(() => locationService.resolve(getExtractedSearch(analysis)));

  useEffect(() => {
    const unsub = subscribeAnalysis((newAnalysis) => {
      setAnalysis(newAnalysis);
      const newSearch = getExtractedSearch(newAnalysis);
      setForm(newSearch);
      setResult(locationService.resolve(newSearch));
    });
    return unsub;
  }, []);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  const search = () => setResult(locationService.resolve(form));
  const exact = result.state === 'exact';

  return (
    <>
      <PageHead eyebrow="Cadastral Verification / Step 05" title="Inspect Cadastral Parcel Map">
        <div className="flex items-center gap-2 text-xs text-[#4a5754]">
          <MapPin className="w-3.5 h-3.5 text-[#214f4e]" />
          <span className="font-mono font-semibold">DEMO / REFERENCE CADASTRAL REVENUE SURVEY</span>
        </div>
      </PageHead>

      {isNonLand && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Document not recognized as a land record</p>
            <p className="text-xs text-red-800 mt-0.5">
              Normal GIS parcel and boundary processing is disabled for unrecognized documents. You may manually search the reference cadastral map below or upload a valid land record.
            </p>
          </div>
        </div>
      )}

      <div className="grid xl:grid-cols-[1.35fr_0.65fr] gap-6">
        {/* Map Panel */}
        <Panel className="p-0 overflow-hidden flex flex-col justify-between">
          <div className="h-[480px]">
            <CadastralMap result={result} parcels={demoCadastralData} />
          </div>
          <div className="px-4 py-3 bg-[#202e35] text-[#eee9dc] text-[11px] font-mono flex flex-wrap gap-x-5 gap-y-2 border-t border-[#3b4a4e]">
            <span>Map Base: OpenStreetMap Tiles</span>
            <span>Survey Layer: DoLR Cadastral Geometry</span>
            <span>Active Case: {analysis.document_id || 'No active case'}</span>
          </div>
        </Panel>

        {/* Location & Resolver Controls */}
        <Panel className="p-6 md:p-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <SectionLabel>Revenue Boundary Resolver</SectionLabel>
                <h2 className="font-serif text-2xl font-bold text-[#202e35] mt-1">
                  Find a Parcel
                </h2>
              </div>
              <Compass className="w-5 h-5 text-[#214f4e]" />
            </div>

            <div className="mt-5 space-y-3.5">
              {[
                ['state', 'State', 'e.g. Bihar'],
                ['district', 'District', 'e.g. Patna'],
                ['village', 'Village / Mauza', 'e.g. Karnpura-121'],
                ['surveyNumber', 'Khesra / Survey Number', 'e.g. 108'],
              ].map(([key, label, placeholder]) => (
                <div key={key}>
                  <label
                    className="text-[11px] font-mono uppercase tracking-wider text-[#34484a] font-semibold block"
                    htmlFor={`location-${key}`}
                  >
                    {label}
                  </label>
                  <input
                    id={`location-${key}`}
                    value={form[key as keyof typeof form]}
                    placeholder={placeholder}
                    onChange={(e) => update(key, e.target.value)}
                    className="mt-1.5 w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] placeholder:text-[#7a8682] px-3 py-2 text-xs font-medium rounded-md focus:ring-2 focus:ring-[#214f4e] focus:border-[#214f4e] outline-none shadow-2xs"
                    data-testid={`input-location-${key}`}
                  />
                </div>
              ))}

              <button
                onClick={search}
                className="w-full mt-2 bg-[#214f4e] hover:bg-[#173e3d] text-white px-4 py-2.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm transition-colors"
                data-testid="button-search-parcel"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Cadastral Map</span>
              </button>

              <button
                onClick={() => {
                  const extracted = getExtractedSearch(analysis);
                  setForm(extracted);
                  setResult(locationService.resolve(extracted));
                }}
                className="w-full border border-[#9ea8a2] bg-[#f7f3eb] hover:bg-[#e9e4d9] px-4 py-2 text-xs font-semibold text-[#202e35] rounded-md transition-colors"
                data-testid="button-reset-parcel"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 border-t border-[#d5cdbd] pt-4">
              {result.state === 'exact' && (
                <>
                  <StatusBadge tone="good">Exact Cadastral Match</StatusBadge>
                  <p className="text-xs text-[#2d3d42] mt-2 leading-relaxed">
                    Survey plot <b className="text-[#142127]">{result.parcel?.surveyNumber}</b> verified in{' '}
                    <b className="text-[#142127]">{result.parcel?.village}</b> ({result.parcel?.district}, Bihar).
                  </p>
                </>
              )}
              {result.state === 'location-only' && (
                <>
                  <StatusBadge tone="warn">Village Centroid Located</StatusBadge>
                  <p className="text-xs text-[#2d3d42] mt-2 leading-relaxed">
                    Revenue village coordinates found, but specific plot polygon is not indexed in this survey chunk.
                  </p>
                </>
              )}
              {result.state === 'unavailable' && (
                <>
                  <StatusBadge tone="danger">Boundary Not Indexed</StatusBadge>
                  <p className="text-xs text-[#2d3d42] mt-2 leading-relaxed">
                    {hasDocument && !isNonLand
                      ? 'Plot polygon not found in current survey chunk. Try Plot 108 (Karnpura-121, Patna).'
                      : 'No active land record parcel loaded. Enter State, District, Village/Mauza, and Khesra number above (e.g. Bihar, Patna, Karnpura-121, 108) to inspect a parcel.'}
                  </p>
                </>
              )}
            </div>

            {exact && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f3eee3] p-3 rounded-md border border-[#d5cdbd]">
                    <SectionLabel>Document Area</SectionLabel>
                    <div className="font-mono text-xs font-bold mt-1 text-[#1a262b]">
                      {analysis.fields.land_area?.normalized || analysis.fields.land_area?.original || 'Not detected'}
                    </div>
                    <span className="text-[10px] text-[#52605d] font-medium">EXTRACTED</span>
                  </div>
                  <div className="bg-[#e7eeea] p-3 rounded-md border border-[#b7ccc1]">
                    <SectionLabel>GIS Boundary Area</SectionLabel>
                    <div className="font-mono text-xs font-bold mt-1 text-[#1d4638]">
                      {result.parcel?.area || '0.125 Acre'}
                    </div>
                    <span className="text-[10px] text-[#2e5948] font-medium">REFERENCE</span>
                  </div>
                </div>

                <div className="bg-[#fbf1e5] border-l-2 border-[#b26337] p-3 rounded-r-md flex gap-2 text-xs text-[#594436]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#b26337]" />
                  <span className="text-[11px] leading-relaxed">
                    <b>CADASTRAL NOTE:</b> Coordinates represent illustrative revenue survey centroids under SIH prototype specifications.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#d5cdbd] flex justify-end">
            <Link
              href="/risk"
              className="inline-flex items-center gap-2 bg-[#214f4e] hover:bg-[#173e3d] text-white px-4 py-2.5 text-xs font-semibold rounded-md shadow-sm transition-colors"
              data-testid="link-map-risk"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Continue to Risk Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}