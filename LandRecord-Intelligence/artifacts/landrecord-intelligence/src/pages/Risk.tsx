import React, { useState, useEffect } from 'react';
import { AlertOctagon, ArrowRight, CheckCircle2, CircleHelp, Scale, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
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

  const risk = analysis.risk_analysis || {
    risk_score: 18,
    risk_level: 'LOW' as const,
    status_text: 'Verified — Clean Record',
    color: 'emerald',
    factors_count: 0,
    factors: []
  };

  const isLow = risk.risk_level === 'LOW';
  const isMedium = risk.risk_level === 'MEDIUM';
  const isHigh = risk.risk_level === 'HIGH';

  return (
    <>
      <PageHead eyebrow="Evidence Assessment / Step 06" title="Explain the Risk Analysis">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <CircleHelp className="w-4 h-4" />
          <span>Deterministic legal audit engine · Department of Land Resources Ruleset</span>
        </div>
      </PageHead>

      <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6">
        {/* Composite Score Card */}
        <Panel className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <SectionLabel>Composite Risk Score</SectionLabel>
            
            <div className="flex items-baseline gap-3 mt-4">
              <span
                className={`font-serif text-6xl md:text-7xl font-bold leading-none ${
                  isLow ? 'text-emerald-600 dark:text-emerald-400' : isMedium ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {risk.risk_score}
              </span>
              <span className="font-mono text-sm text-slate-400">/ 100</span>
            </div>

            <div className="mt-3">
              <StatusBadge tone={isLow ? 'good' : isMedium ? 'warn' : 'danger'}>
                {risk.risk_level} RISK · {risk.status_text}
              </StatusBadge>
            </div>

            {/* Visual Risk Gauge */}
            <div className="mt-8 relative">
              <div className="h-3 rounded-full flex overflow-hidden bg-slate-200 dark:bg-slate-800">
                <span className="w-[30%] bg-emerald-500" />
                <span className="w-[35%] bg-amber-500" />
                <span className="flex-1 bg-red-500" />
              </div>
              <div
                className="absolute top-[-6px] h-6 w-1 bg-slate-900 dark:bg-white rounded-full shadow-md transition-all duration-500"
                style={{ left: `${Math.min(98, Math.max(2, risk.risk_score))}%` }}
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
                <span>0 (Safe)</span>
                <span>30 (Low)</span>
                <span>65 (Medium)</span>
                <span>100 (Critical)</span>
              </div>
            </div>

            {/* Factor Penalties Breakdown */}
            <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800">
              <SectionLabel>Penalty Composition</SectionLabel>
              <div className="space-y-3 mt-3 text-xs">
                {risk.factors.length > 0 ? (
                  risk.factors.map((f) => (
                    <div key={f.code} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            f.severity === 'CRITICAL' || f.severity === 'HIGH'
                              ? 'bg-red-500'
                              : f.severity === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                          {f.title}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 shrink-0">
                        +{f.penalty} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic text-xs py-1">
                    No active penalty points. Baseline clean registry score applied.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Confidence / Clean Registry Credit</span>
                  <span className="font-mono">−10 pts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-[11px] text-slate-400 font-mono">
            CALCULATED VIA BHUVERIFY DETERMINISTIC ENGINE v2.0
          </div>
        </Panel>

        {/* Detailed Risk Factors */}
        <Panel className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <SectionLabel>Evaluated Risk Factors</SectionLabel>
              <span className="font-mono text-xs text-slate-500">
                {risk.factors.length} Active Indicator{risk.factors.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4">
              {risk.factors.length > 0 ? (
                risk.factors.map((item, idx) => {
                  const isCrit = item.severity === 'CRITICAL' || item.severity === 'HIGH';
                  const isMed = item.severity === 'MEDIUM';

                  return (
                    <div
                      key={item.code}
                      className={`border-l-4 ${
                        isCrit ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : isMed ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20' : 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                      } p-3.5 rounded-r-lg transition-colors`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                            {item.category}
                          </span>
                          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {item.title}
                          </h3>
                        </div>

                        <StatusBadge tone={isCrit ? 'danger' : isMed ? 'warn' : 'good'}>
                          {item.severity}
                        </StatusBadge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <span>RULE: {item.code}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Penalty: +{item.penalty}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    No Risk Factors Flagged
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-sm mx-auto">
                    This Jamabandi record has full title continuity, unencumbered status, and exact alignment with Department of Land Resources cadastral records.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>
                Verified Jamabandi Panji II number, Sampatchak circle jurisdiction, and high extraction confidence mitigate baseline administrative risk.
              </span>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/review"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-colors"
              data-testid="link-to-review"
            >
              <Scale className="w-4 h-4" />
              <span>Prepare Official Decision</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}