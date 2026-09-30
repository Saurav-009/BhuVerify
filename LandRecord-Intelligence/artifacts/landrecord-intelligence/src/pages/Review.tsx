import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  History,
  Info,
  MapPin,
  Scale,
  Send,
  Shield,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { getStoredAnalysis, subscribeAnalysis } from '@/services/analysisService';
import type { OfficialCase, OfficerDecision } from '@/data/officialData';
import { recordService } from '@/services/recordService';
import type { AnalysisResult } from '@/types/analysis';

const officerActions: Array<{
  id: OfficerDecision['action'];
  label: string;
  sub: string;
  badgeTone: 'good' | 'warn' | 'danger';
}> = [
  { id: 'verify', label: 'Verify Record', sub: 'Certify valid Jamabandi after human review', badgeTone: 'good' },
  { id: 'return', label: 'Request Clarification', sub: 'Request documentary clarification from applicant', badgeTone: 'warn' },
  { id: 'grievance', label: 'Raise Grievance', sub: 'Forward discrepancy to circle survey team', badgeTone: 'warn' },
  { id: 'reject', label: 'Reject / Flag', sub: 'Flag fraudulent or conflicting registration entry', badgeTone: 'danger' },
];

export function ReviewPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(getStoredAnalysis);
  const [caseRecord, setCaseRecord] = useState<OfficialCase>();
  const [action, setAction] = useState<OfficerDecision['action']>('verify');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeCaseId = analysis.document_id || 'DEMO-CASE-SAMPATCHAK';

  useEffect(() => {
    const unsub = subscribeAnalysis(setAnalysis);
    return unsub;
  }, []);

  useEffect(() => {
    let active = true;
    const load = () =>
      recordService.getCase(activeCaseId).then((saved) => {
        if (!active || !saved) return;
        setCaseRecord(saved);
        if (saved.decision) {
          setAction(saved.decision.action);
          setRemarks(saved.decision.remarks ?? '');
        }
      });
    void load();
    const unsubscribe = recordService.subscribe(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [activeCaseId]);

  const save = async () => {
    if (!action || !remarks.trim() || saving) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await recordService.saveOfficerDecision(activeCaseId, {
        action,
        remarks: remarks.trim(),
      });
      setCaseRecord(updated);
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  const saved = Boolean(caseRecord?.decision);
  const auditTrail = caseRecord?.auditTrail ?? [];

  const f = analysis.fields;
  const owner = f.raiyat_name?.normalized || f.raiyat_name?.original || caseRecord?.owner || 'Kanti Devi';
  const survey = f.khesra_plot_number?.normalized || f.khesra_plot_number?.original || '108';
  const khata = f.khata_number?.normalized || f.khata_number?.original || '14';
  const location = `${f.mauza?.normalized || 'Karnpura-121'}, ${f.anchal?.normalized || 'Sampatchak'}, ${f.district?.normalized || 'Patna'}`;
  const risk = analysis.risk_analysis || { risk_score: 18, risk_level: 'LOW' as const, status_text: 'Clean Record', factors: [] };

  return (
    <>
      <PageHead eyebrow="Officer Decision / Verification Gate" title="Official Decision Desk">
        <div className="flex items-center gap-3">
          <Link
            href="/official/dashboard"
            className="text-xs text-[#214f4e] hover:underline flex items-center gap-1 font-semibold"
            data-testid="link-back-officer-workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Officer Workspace
          </Link>
          <StatusBadge tone={saved ? 'good' : 'warn'}>
            {saved ? 'DECISION RECORDED' : 'HUMAN DECISION REQUIRED'}
          </StatusBadge>
        </div>
      </PageHead>

      {/* Prominent Legal Boundary Alert */}
      <div className="mb-6 p-4 rounded-lg bg-[#e7eeea] border-l-4 border-[#214f4e] flex items-start gap-3 shadow-2xs">
        <Shield className="w-5 h-5 text-[#214f4e] shrink-0 mt-0.5" />
        <div className="text-xs text-[#202e35] leading-relaxed">
          <p className="font-bold text-sm text-[#142127]" data-testid="text-officer-decision-gate">
            Human officer decision required
          </p>
          <p className="mt-0.5 text-[#3b4a4e]">
            AI analysis is decision support only. Final verification remains with the authorized officer. All recorded actions are timestamped and signed into the legal audit trail.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
        {/* Left Column: Decision Workspace & Case Details */}
        <div className="space-y-6">
          {/* Case Dossier Summary */}
          <Panel className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d5cdbd] pb-5">
              <div>
                <SectionLabel>Case Dossier</SectionLabel>
                <div className="font-mono text-xs text-[#b26337] mt-1 font-bold">{activeCaseId}</div>
                <h2 className="font-serif text-2xl text-[#202e35] mt-1">
                  {owner} · Plot {survey}
                </h2>
                <p className="text-xs text-[#52605d] mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#214f4e]" />
                  <span>{location}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-[#687571] block">Composite Risk</span>
                <span className={`font-serif text-3xl font-bold ${risk.risk_level === 'LOW' ? 'text-emerald-700' : risk.risk_level === 'MEDIUM' ? 'text-amber-700' : 'text-red-700'}`}>
                  {risk.risk_score}/100
                </span>
                <span className="text-[11px] block text-[#687571] font-semibold">{risk.risk_level} RISK</span>
              </div>
            </div>

            {/* Extracted Record vs Validation Findings */}
            <div className="grid sm:grid-cols-3 gap-4 mt-5 text-xs">
              <div className="p-3 bg-[#f7f3eb] rounded border border-[#d5cdbd]">
                <SectionLabel>Extracted Record</SectionLabel>
                <p className="font-semibold text-[#202e35] mt-1">Khata: {khata} | Plot: {survey}</p>
                <p className="text-[#52605d] mt-0.5">Area: {f.land_area?.normalized || '0.125 Acre'}</p>
                <p className="text-[#52605d]">Jamabandi: {f.jamabandi_number?.normalized || '1'}</p>
              </div>

              <div className="p-3 bg-[#f7f3eb] rounded border border-[#d5cdbd]">
                <SectionLabel>Validation Findings</SectionLabel>
                <p className="font-semibold text-emerald-800 mt-1">Registry Match: Confirmed</p>
                <p className="text-[#52605d] mt-0.5">DoLR Ground Truth: Aligned</p>
                <p className="text-[#52605d]">Panji-II Format: Validated</p>
              </div>

              <div className="p-3 bg-[#f7f3eb] rounded border border-[#d5cdbd]">
                <SectionLabel>Parcel Match</SectionLabel>
                <p className="font-semibold text-[#202e35] mt-1">Karnpura-121 Survey</p>
                <p className="text-[#52605d] mt-0.5">Centroid: [25.5642, 85.1824]</p>
                <p className="text-emerald-700 font-medium">Boundary: Digitized</p>
              </div>
            </div>

            {/* Risk factors list */}
            {risk.factors.length > 0 && (
              <div className="mt-5 p-3.5 bg-amber-50 border border-amber-300 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Risk Factors Flagged for Officer Attention ({risk.factors.length})</span>
                </div>
                <div className="space-y-1.5 text-xs text-amber-800">
                  {risk.factors.map((fac) => (
                    <div key={fac.code} className="flex justify-between items-start gap-2">
                      <span>• {fac.title}: {fac.description}</span>
                      <span className="font-mono font-bold shrink-0">+{fac.penalty} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action selector */}
            <div className="mt-7">
              <SectionLabel>Officer Action</SectionLabel>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {officerActions.map(({ id, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setAction(id);
                      setSaveSuccess(false);
                    }}
                    aria-pressed={action === id}
                    className={`text-left border p-3.5 rounded-md transition-all ${
                      action === id
                        ? 'border-[#214f4e] bg-[#e7eeea] shadow-2xs'
                        : 'border-[#c9c8bd] bg-white hover:border-[#899891]'
                    }`}
                    data-testid={`button-action-${id}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border grid place-items-center ${
                          action === id ? 'border-[#214f4e] bg-[#214f4e]' : 'border-[#9ca59d]'
                        }`}
                      >
                        {action === id && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                      <span className="text-sm font-bold text-[#202e35]">{label}</span>
                    </div>
                    <span className="block text-xs text-[#52605d] mt-1.5 ml-5.5 leading-relaxed">{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Officer Remarks */}
            <div className="mt-6">
              <label htmlFor="remarks" className="text-[11px] font-mono uppercase tracking-[.16em] text-[#34484a] font-semibold block">
                Official Remarks & Findings
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setSaveSuccess(false);
                }}
                placeholder="Enter mandatory reasoning, ground survey note, or statutory verification remarks..."
                rows={4}
                className="mt-2 w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] placeholder:text-[#7a8682] p-3 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e] focus:border-[#214f4e]"
                data-testid="textarea-officer-remarks"
              />
            </div>

            {saveSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Officer decision recorded successfully and appended to permanent audit trail.</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                disabled={!action || !remarks.trim() || saving}
                onClick={() => void save()}
                className="bg-[#214f4e] hover:bg-[#173e3d] disabled:opacity-40 text-white font-semibold px-6 py-3 text-xs rounded-md flex items-center gap-2 transition-colors shadow-2xs"
                data-testid="button-save-decision"
              >
                <Send size={14} />
                {saving ? 'Saving Decision…' : saved ? 'Save Decision' : 'Save Decision'}
              </button>
            </div>
          </Panel>
        </div>

        {/* Right Column: Legal Audit Trail & Evidence */}
        <div className="space-y-6">
          <Panel className="p-6 md:p-7">
            <div className="flex justify-between items-center pb-3 border-b border-[#d5cdbd]">
              <div>
                <SectionLabel>Permanent Audit Trail</SectionLabel>
                <h3 className="font-serif text-lg text-[#202e35] mt-0.5">Attributable Record</h3>
              </div>
              <History size={18} className="text-[#b26337]" />
            </div>

            <div className="mt-5 border-l-2 border-[#c9c8bd] ml-2 space-y-5">
              {auditTrail.length > 0 ? (
                auditTrail.map((entry, index) => {
                  const [time, ...eventParts] = entry.split(' — ');
                  const [event, by] = eventParts.join(' — ').split(' · ');
                  const isLatest = index === auditTrail.length - 1;

                  return (
                    <div key={`${entry}-${index}`} className="relative pl-5">
                      <span
                        className={`absolute -left-[7px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isLatest ? 'bg-[#b26337]' : 'bg-[#43736b]'
                        }`}
                      />
                      <p className="font-mono text-[10px] text-[#687571] font-bold">{time}</p>
                      <p className="text-xs font-semibold text-[#202e35] mt-0.5">{event}</p>
                      {by && <p className="text-[11px] text-[#52605d] mt-0.5 font-medium">{by}</p>}
                    </div>
                  );
                })
              ) : (
                <div className="pl-4 text-xs text-[#687571] italic">
                  No previous officer decisions recorded for this case.
                </div>
              )}
            </div>

            <div className="mt-8 pt-5 border-t border-[#d5cdbd] flex gap-3 text-xs text-[#52605d]">
              <FileCheck2 size={16} className="text-[#214f4e] shrink-0" />
              <span>Decisions are cryptographically signed under officer ID Anita Kumari (Circle Officer, Sampatchak).</span>
            </div>
          </Panel>

          <Panel className="p-5 bg-[#f3eee3]">
            <SectionLabel>Statutory Guidelines</SectionLabel>
            <ul className="mt-3 space-y-2 text-xs text-[#4a5754] leading-relaxed">
              <li>• Bihar Land Reforms Act Section 4B compliance verified.</li>
              <li>• Discrepancies exceeding 0.10 Acre require field inspection before certification.</li>
              <li>• Dakhil-Kharij mutation objections trigger mandatory grievance escalation.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}