import React, { useState, useEffect } from 'react';
import { ArrowRight, Compass, Info, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { demoCadastralData } from '@/data/cadastralData';
import { locationService, type LocationResolution } from '@/services/locationService';
import { CadastralMap } from '@/components/CadastralMap';
import { getStoredAnalysis, subscribeAnalysis } from '@/services/analysisService';
import type { AnalysisResult } from '@/types/analysis';

export function GisPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(getStoredAnalysis);

  const initialSearch = {
    state: 'Bihar',
    district: analysis.fields.district?.normalized || 'Patna',
    village: analysis.fields.mauza?.normalized || 'Karnpura-121',
    surveyNumber: analysis.fields.khesra_plot_number?.normalized || '108',
  };

  const [form, setForm] = useState(initialSearch);
  const [result, setResult] = useState<LocationResolution>(() => locationService.resolve(initialSearch));

  useEffect(() => {
    const unsub = subscribeAnalysis((newAnalysis) => {
      setAnalysis(newAnalysis);
      const newSearch = {
        state: 'Bihar',
        district: newAnalysis.fields.district?.normalized || 'Patna',
        village: newAnalysis.fields.mauza?.normalized || 'Karnpura-121',
        surveyNumber: newAnalysis.fields.khesra_plot_number?.normalized || '108',
      };
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
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono">DEMO / REFERENCE CADASTRAL REVENUE SURVEY</span>
        </div>
      </PageHead>

      <div className="grid xl:grid-cols-[1.35fr_0.65fr] gap-6">
        {/* Map Panel */}
        <Panel className="p-0 overflow-hidden flex flex-col justify-between">
          <div className="h-[480px]">
            <CadastralMap result={result} parcels={demoCadastralData} />
          </div>
          <div className="px-4 py-3 bg-slate-900 text-slate-200 text-[10px] font-mono flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-800">
            <span>Map Base: OpenStreetMap Tiles</span>
            <span>Survey Layer: DoLR Cadastral Geometry</span>
            <span>Active Record: {analysis.document_id}</span>
          </div>
        </Panel>

        {/* Location & Resolver Controls */}
        <Panel className="p-6 md:p-7 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <SectionLabel>Revenue Boundary Resolver</SectionLabel>
                <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Find a Parcel
                </h2>
              </div>
              <Compass className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="mt-5 space-y-3">
              {[
                ['state', 'State'],
                ['district', 'District'],
                ['village', 'Village / Mauza'],
                ['surveyNumber', 'Khesra / Survey Number'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label
                    className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block"
                    htmlFor={`location-${key}`}
                  >
                    {label}
                  </label>
                  <input
                    id={`location-${key}`}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => update(key, e.target.value)}
                    className="mt-1 w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
                    data-testid={`input-location-${key}`}
                  />
                </div>
              ))}

              <button
                onClick={search}
                className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-semibold rounded-md flex items-center justify-center gap-2 shadow-sm transition-colors"
                data-testid="button-search-parcel"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Cadastral Map</span>
              </button>

              <button
                onClick={() => {
                  setForm(initialSearch);
                  setResult(locationService.resolve(initialSearch));
                }}
                className="w-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md transition-colors"
                data-testid="button-reset-parcel"
              >
                Reset to Extracted Record
              </button>
            </div>

            <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
              {result.state === 'exact' && (
                <>
                  <StatusBadge tone="good">Exact Cadastral Match</StatusBadge>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Survey plot <b>{result.parcel?.surveyNumber}</b> verified in{' '}
                    <b>{result.parcel?.village}</b> ({result.parcel?.district}, Bihar).
                  </p>
                </>
              )}
              {result.state === 'location-only' && (
                <>
                  <StatusBadge tone="warn">Village Centroid Located</StatusBadge>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Revenue village coordinates found, but specific polygon is being digitized.
                  </p>
                </>
              )}
              {result.state === 'unavailable' && (
                <>
                  <StatusBadge tone="danger">Boundary Not Indexed</StatusBadge>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Plot polygon not found in current survey chunk. Try Plot 108 (Karnpura-121).
                  </p>
                </>
              )}
            </div>

            {exact && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800">
                    <SectionLabel>Document Area</SectionLabel>
                    <div className="font-mono text-xs font-bold mt-1 text-slate-900 dark:text-slate-100">
                      {analysis.fields.land_area?.normalized || '0.125 Acre'}
                    </div>
                    <span className="text-[10px] text-slate-400">EXTRACTED</span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <SectionLabel>GIS Boundary Area</SectionLabel>
                    <div className="font-mono text-xs font-bold mt-1 text-emerald-800 dark:text-emerald-300">
                      {result.parcel?.area || '0.125 Acre'}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">REFERENCE</span>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 border-l-2 border-amber-600 p-2.5 rounded-r-md flex gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span className="text-[11px] leading-relaxed">
                    <b>CADASTRAL NOTE:</b> Coordinates represent illustrative revenue survey centroids under SIH prototype specifications.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <Link
              href="/risk"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold rounded-md shadow-sm transition-colors"
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