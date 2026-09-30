import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, FileCheck2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { getStoredAnalysis, subscribeAnalysis } from '@/services/analysisService';
import type { AnalysisResult } from '@/types/analysis';

export function RiskPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(getStoredAnalysis);

  useEffect(() => {
    const unsub = subscribeAnalysis(setAnalysis);
    return unsub;
  }, []);

  const hasDocument = Boolean(analysis.document_id);
  const isNonLand = analysis.document_classification === 'NON_LAND_DOCUMENT';

  const risk = analysis.risk_analysis || {
    risk_score: 0,
    risk_level: 'LOW' as const,
    status_text: 'No document processed',
    color: 'slate',
    factors_count: 0,
    factors: []
  };

  const isLow = risk.risk_level === 'LOW';
  const isMedium = risk.risk_level === 'MEDIUM';

  return (
    <>
      <PageHead eyebrow="Evidence Assessment / Step 06" title="Explain the Risk Analysis">
        <div className="text-xs text-[#4a5754] flex items-center gap-1.5">
          <CircleHelp className="w-4 h-4 text-[#214f4e]" />
          <span>Deterministic legal audit engine · Department of Land Resources Ruleset</span>
        </div>
      </PageHead>

      {!hasDocument && (
        <div className="mb-6 p-5 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">No document has been processed yet</p>
            <p className="text-sm text-amber-800 mt-1">
              Upload a land record document or load the Bihar demo sample to compute a deterministic risk score.
            </p>
          </div>
        </div>
      )}

      {isNonLand && (
        <div className="mb-6 p-5 rounded-lg bg-red-50 border border-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Document not recognized as a land record</p>
            <p className="text-sm text-red-800 mt-1">
              The uploaded file does not appear to contain a compatible land-record document. Risk scoring is not applicable.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6">
        {/* Composite Score Card */}
        <Panel className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <SectionLabel>Composite Risk Score</SectionLabel>
            
            <div className="flex items-baseline gap-3 mt-4">
              <span
                className={`font-serif text-6xl md:text-7xl font-bold leading-none ${
                  !hasDocument || isNonLand
                    ? 'text-[#687571]'
                    : isLow
                    ? 'text-emerald-700'
                    : isMedium
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
                data-testid="text-risk-score"
              >
                {hasDocument && !isNonLand ? risk.risk_score : '—'}
              </span>
              <span className="font-mono text-sm text-[#52605d]">/ 100</span>
            </div>

            <div className="mt-3">
              <StatusBadge tone={!hasDocument || isNonLand ? 'neutral' : isLow ? 'good' : isMedium ? 'warn' : 'danger'}>
                {!hasDocument
                  ? 'NO ACTIVE CASE'
                  : isNonLand
                  ? 'NON-LAND DOCUMENT'
                  : `${risk.risk_level} RISK · ${risk.status_text}`}
              </StatusBadge>
            </div>

            {/* Visual Risk Gauge */}
            <div className="mt-8 relative">
              <div className="h-3 rounded-full flex overflow-hidden bg-[#e4e2d9]">
                <span className="w-[30%] bg-emerald-600" />
                <span className="w-[35%] bg-amber-500" />
                <span className="flex-1 bg-red-600" />
              </div>
              {hasDocument && !isNonLand && (
                <div
                  className="absolute top-[-6px] h-6 w-1.5 bg-[#202e35] rounded-full shadow-md transition-all duration-500"
                  style={{ left: `${Math.min(98, Math.max(2, risk.risk_score))}%` }}
                />
              )}
              <div className="flex justify-between text-[10px] font-mono text-[#52605d] mt-2 font-medium">
                <span>0 (Safe)</span>
                <span>30 (Low)</span>
                <span>65 (Medium)</span>
                <span>100 (Critical)</span>
              </div>
            </div>

            {/* Factor Penalties Breakdown */}
            <div className="mt-8 pt-5 border-t border-[#d5cdbd]">
              <SectionLabel>Penalty Composition</SectionLabel>
              <div className="space-y-3 mt-3 text-xs">
                {hasDocument && !isNonLand && risk.factors.length > 0 ? (
                  risk.factors.map((f) => (
                    <div key={f.code} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            f.severity === 'CRITICAL' || f.severity === 'HIGH'
                              ? 'bg-red-600'
                              : f.severity === 'MEDIUM'
                              ? 'bg-amber-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <span className="truncate text-[#202e35] font-medium">
                          {f.title}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#202e35] shrink-0">
                        +{f.penalty} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[#52605d] italic text-xs py-1">
                    {!hasDocument || isNonLand
                      ? 'No active land record risk factors evaluated.'
                      : 'No active penalty points. Baseline clean registry score applied.'}
                  </div>
                )}
                {hasDocument && !isNonLand && analysis.overall_confidence > 0.7 && (
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-dashed border-[#d5cdbd] text-emerald-700 font-semibold">
                    <span>Confidence / Clean Registry Credit</span>
                    <span className="font-mono">−10 pts</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 text-[11px] text-[#52605d] font-mono">
            CALCULATED VIA BHUVERIFY DETERMINISTIC ENGINE v2.0
          </div>
        </Panel>

        {/* Detailed Risk Factors */}
        <Panel className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#d5cdbd]">
              <SectionLabel>Evaluated Risk Factors</SectionLabel>
              <span className="font-mono text-xs text-[#4a5754] font-semibold">
                {hasDocument && !isNonLand ? `${risk.factors.length} Active Indicator${risk.factors.length !== 1 ? 's' : ''}` : '0 Indicators'}
              </span>
            </div>

            <div className="space-y-4">
              {hasDocument && !isNonLand && risk.factors.length > 0 ? (
                risk.factors.map((item) => {
                  const isCrit = item.severity === 'CRITICAL' || item.severity === 'HIGH';
                  const isMed = item.severity === 'MEDIUM';

                  return (
                    <div
                      key={item.code}
                      className={`border-l-4 ${
                        isCrit ? 'border-red-600 bg-red-50/70' : isMed ? 'border-amber-600 bg-amber-50/70' : 'border-emerald-600 bg-emerald-50/70'
                      } p-3.5 rounded-r-lg transition-colors`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#52605d] font-semibold block mb-0.5">
                            {item.category}
                          </span>
                          <h3 className="font-bold text-xs text-[#202e35]">
                            {item.title}
                          </h3>
                        </div>

                        <StatusBadge tone={isCrit ? 'danger' : isMed ? 'warn' : 'good'}>
                          {item.severity}
                        </StatusBadge>
                      </div>

                      <p className="text-xs text-[#34484a] leading-relaxed mt-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[#52605d] mt-2.5 pt-2 border-t border-[#d5cdbd]/70">
                        <span>RULE: {item.code}</span>
                        <span className="font-bold text-[#202e35]">
                          Penalty: +{item.penalty}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-lg bg-[#e7eeea] border border-[#b7ccc1] text-center">
                  <ShieldCheck className="w-10 h-10 text-[#214f4e] mx-auto mb-2" />
                  <h3 className="font-bold text-[#202e35] text-sm">
                    {!hasDocument || isNonLand ? 'Risk Evaluation Pending Valid Land Record' : 'No Risk Factors Flagged'}
                  </h3>
                  <p className="text-xs text-[#34484a] mt-1 max-w-sm mx-auto leading-relaxed">
                    {!hasDocument || isNonLand
                      ? 'Upload a valid Bihar Jamabandi record or load the Demo Case to evaluate registry integrity and mutation flags.'
                      : 'This Jamabandi record has full title continuity, unencumbered status, and exact alignment with Department of Land Resources cadastral records.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#d5cdbd] flex items-start gap-2.5 text-xs text-[#34484a]">
              <CheckCircle2 className="w-4 h-4 text-[#214f4e] mt-0.5 shrink-0" />
              <span data-testid="text-risk-officer-notice" className="font-medium">
                Risk analysis complete. Final verification is performed by an authorized officer.
              </span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#d5cdbd] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#52605d]">
              Citizen workflow step 06 of 06 · Proceed to generate your reference copy
            </span>
            <Link
              href="/digital-reference"
              className="inline-flex items-center gap-2 bg-[#214f4e] hover:bg-[#173e3d] text-white px-5 py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-colors"
              data-testid="link-to-digital-reference"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Generate Digital Reference</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}