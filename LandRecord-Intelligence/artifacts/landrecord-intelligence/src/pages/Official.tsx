import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileSearch,
  LockKeyhole,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  UsersRound,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Link, useRoute } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { demoGrievance } from '@/data/officialData';
import type { Grievance, OfficialCase } from '@/data/officialData';
import { governmentServices } from '@/config/governmentServices';
import { recordService } from '@/services/recordService';

function useSavedGrievances() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  useEffect(() => {
    let active = true;
    const load = () =>
      recordService.getGrievances().then((saved) => {
        if (active) setGrievances(saved);
      });
    void load();
    const unsubscribe = recordService.subscribe(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return grievances;
}

function useSavedCases() {
  const [cases, setCases] = useState<OfficialCase[]>([]);
  useEffect(() => {
    let active = true;
    const load = () =>
      recordService.getCases().then((saved) => {
        if (active) setCases(saved);
      });
    void load();
    const unsubscribe = recordService.subscribe(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return cases;
}

export function OfficialLogin({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState('SIH-DEMO-047');
  const [password, setPassword] = useState('registry-demo');

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#202e35] text-[#d98549] grid place-items-center font-serif text-3xl mx-auto shadow-md">
          BV
        </div>
        <div className="text-[11px] font-mono uppercase tracking-[.18em] text-[#b26337] mt-5 font-bold">
          Dedicated Officer Portal · Prototype Demo Area
        </div>
        <h1 className="font-serif text-4xl mt-2 text-[#202e35]">Official Portal</h1>
        <p className="text-sm text-[#4a5754] mt-2">
          Revenue Circle Officer workspace for case verification, risk review, and grievance redressal
        </p>
      </div>

      <Panel className="p-8 md:p-10">
        <div className="bg-[#e7eeea] border-l-4 border-[#214f4e] p-4 text-xs text-[#202e35] leading-relaxed">
          <p className="font-bold text-sm text-[#142127]">Demo / Prototype Official Access</p>
          <p className="mt-1 text-[#3b4a4e]">
            Prototype/demo access — no real government authentication is connected. Pre-filled with demo credentials for evaluator testing.
          </p>
        </div>

        <form
          className="mt-7 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
        >
          <div>
            <label htmlFor="official-id" className="text-[11px] font-mono uppercase tracking-[.16em] text-[#34484a] font-semibold block">
              Official ID / Post
            </label>
            <input
              id="official-id"
              autoComplete="username"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="mt-2 w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] p-3 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
              data-testid="input-official-id"
            />
          </div>

          <div>
            <label htmlFor="official-password" className="text-[11px] font-mono uppercase tracking-[.16em] text-[#34484a] font-semibold block">
              Password / Access Token
            </label>
            <input
              id="official-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] p-3 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
              data-testid="input-official-password"
            />
          </div>

          <button
            type="submit"
            disabled={!id || !password}
            className="w-full bg-[#214f4e] hover:bg-[#173e3d] disabled:opacity-40 text-white font-semibold px-4 py-3 text-xs rounded-md flex items-center justify-center gap-2 shadow-sm transition-colors"
            data-testid="button-demo-official-login"
          >
            <LockKeyhole size={15} />
            <span>Enter Officer Workspace (Demo)</span>
          </button>
        </form>
      </Panel>
    </div>
  );
}

export function OfficialDashboard() {
  const grievances = useSavedGrievances();
  const cases = useSavedCases();
  const [citizenGrievance, setCitizenGrievance] = useState<Grievance>();

  useEffect(() => {
    let active = true;
    const load = () =>
      recordService.getCitizenGrievance().then((saved) => {
        if (active) setCitizenGrievance(saved);
      });
    void load();
    const unsubscribe = recordService.subscribe(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const openGrievancesCount = grievances.filter((g) => g.status !== 'Resolved').length;
  const highRiskCasesCount = cases.filter((c) => c.risk > 50).length;
  const awaitingVerificationCount = cases.filter((c) => c.status === 'Officer Review' || !c.decision).length;
  const pendingDecisionsCount = cases.filter((c) => !c.decision).length;

  return (
    <>
      <PageHead eyebrow="Official Portal / Revenue Administration" title="Officer Workspace">
        <div className="flex items-center gap-2 text-xs text-[#4a5754]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span className="font-semibold text-[#202e35]">Anita Kumari</span>
          <span>· Circle Officer (Sampatchak, Patna)</span>
        </div>
      </PageHead>

      {/* Prominent Prototype Banner */}
      <div className="bg-[#e7eeea] border border-[#b7ccc1] px-5 py-3.5 text-xs text-[#202e35] mb-6 rounded-lg flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-[#214f4e] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <b>Prototype / Demo Access</b> — No real government authentication is connected. Prototype role-based workspace for SIH Round-2 evaluation. All records and metrics below are fictional prototype data.
        </div>
      </div>

      {/* Prominent Officer Action Cards / Buttons */}
      <div className="mb-6">
        <SectionLabel>Quick Officer Actions</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          <Link
            href="/official/grievances"
            className="p-5 bg-white border border-[#c9c8bd] hover:border-[#214f4e] hover:shadow-md rounded-lg flex flex-col justify-between transition-all group"
            data-testid="card-verify-cases"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-[#e7eeea] text-[#214f4e] grid place-items-center">
                <FileSearch size={18} />
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                {awaitingVerificationCount} Pending
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-[#202e35] group-hover:text-[#214f4e] flex items-center justify-between">
                <span>Verify Cases</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#52605d] mt-1">Cross-check Jamabandi records</p>
            </div>
          </Link>

          <Link
            href="/review"
            className="p-5 bg-[#214f4e] text-white hover:bg-[#173e3d] hover:shadow-md rounded-lg flex flex-col justify-between transition-all group"
            data-testid="card-official-decisions"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-[#326967] text-white grid place-items-center">
                <Scale size={18} />
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#3b5a4e] text-white">
                {pendingDecisionsCount} Action Req.
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Official Decisions</span>
                <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#a9b5b4] mt-1">Record statutory verification</p>
            </div>
          </Link>

          <Link
            href="/official/grievances"
            className="p-5 bg-white border border-[#c9c8bd] hover:border-[#214f4e] hover:shadow-md rounded-lg flex flex-col justify-between transition-all group"
            data-testid="card-open-grievances"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 grid place-items-center">
                <ClipboardList size={18} />
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                {openGrievancesCount} Open
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-[#202e35] group-hover:text-[#214f4e] flex items-center justify-between">
                <span>Open Grievances</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#52605d] mt-1">Review citizen petitions</p>
            </div>
          </Link>

          <Link
            href="/official/grievances"
            className="p-5 bg-white border border-[#c9c8bd] hover:border-red-400 hover:shadow-md rounded-lg flex flex-col justify-between transition-all group"
            data-testid="card-high-risk-cases"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-lg bg-red-50 text-red-700 grid place-items-center">
                <ShieldAlert size={18} />
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-300">
                {highRiskCasesCount} High-Risk
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-sm text-[#202e35] group-hover:text-red-700 flex items-center justify-between">
                <span>Review High-Risk Cases</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-[#52605d] mt-1">Area mismatches & conflicts</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Cases Awaiting Verification', val: awaitingVerificationCount, sub: 'Needs field check', icon: FileSearch, tone: 'good' },
          { label: 'Human Review Required', val: 7, sub: 'Boundary & HTR doubts', icon: Scale, tone: 'warn' },
          { label: 'High-Risk Cases', val: highRiskCasesCount, sub: 'Title conflict alert', icon: ShieldAlert, tone: 'danger' },
          { label: 'Open Grievances', val: openGrievancesCount, sub: 'Citizen inquiries', icon: UsersRound, tone: 'warn' },
          { label: 'Pending Official Decisions', val: pendingDecisionsCount, sub: 'Statutory signature', icon: ClipboardCheck, tone: 'good' },
        ].map((m) => (
          <Panel key={m.label} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <m.icon size={18} className="text-[#b26337]" />
                <span className="w-2 h-2 rounded-full bg-[#43736b]" />
              </div>
              <SectionLabel>{m.label}</SectionLabel>
              <div className="font-serif text-3xl font-bold mt-2 text-[#202e35]">{m.val}</div>
            </div>
            <div className="text-xs text-[#52605d] mt-2 font-medium">{m.sub}</div>
          </Panel>
        ))}
      </div>

      {/* Main Priority Queue & Notifications */}
      <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6 mt-6">
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#d5cdbd]">
            <div>
              <SectionLabel>Priority Queue</SectionLabel>
              <h2 className="font-serif text-2xl mt-1 text-[#202e35]">Cases Awaiting Official Action</h2>
            </div>
            <Link
              href="/review"
              className="text-xs font-semibold px-3 py-1.5 bg-[#214f4e] text-white hover:bg-[#173e3d] rounded-md transition-colors shadow-2xs"
              data-testid="link-open-decision-desk"
            >
              Open Decision Desk →
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {cases.map((c) => (
              <div key={c.id} className="p-4 bg-[#f7f3eb] rounded-lg border border-[#d5cdbd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      c.priority === 'Urgent' ? 'bg-red-600' : c.priority === 'High' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#214f4e]">{c.id}</span>
                      <StatusBadge tone={c.priority === 'Urgent' ? 'danger' : c.priority === 'High' ? 'warn' : 'good'}>
                        {c.priority}
                      </StatusBadge>
                    </div>
                    <div className="text-sm font-semibold text-[#202e35] mt-1">
                      {c.owner} · {c.village}
                    </div>
                    <div className="text-xs text-[#52605d] mt-0.5">
                      Risk Score: <b className={c.risk > 50 ? 'text-red-700' : 'text-emerald-800'}>{c.risk}/100</b> · {c.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href="/review"
                    className="text-xs font-semibold px-3 py-1.5 border border-[#214f4e] text-[#214f4e] hover:bg-[#e7eeea] rounded transition-colors"
                  >
                    Review & Decide
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6 md:p-7">
            <div className="flex justify-between items-center pb-3 border-b border-[#d5cdbd]">
              <SectionLabel>Officer Notifications</SectionLabel>
              <Bell size={17} className="text-[#b26337]" />
            </div>

            <div className="space-y-4 mt-5 text-xs text-[#202e35]">
              <div className="border-l-4 border-red-500 pl-3 py-1 bg-red-50/60 rounded-r">
                <p className="font-bold text-red-900">
                  {citizenGrievance?.id === demoGrievance.id ? 'Citizen Grievance Received' : 'High-Priority Grievance Alert'}
                </p>
                <p className="text-[#52605d] mt-0.5">
                  {citizenGrievance?.id ?? demoGrievance.id} · Discrepancy reported for {demoGrievance.caseId}
                </p>
              </div>

              <div className="border-l-4 border-amber-500 pl-3 py-1 bg-amber-50/60 rounded-r">
                <p className="font-bold text-amber-900">Boundary & Cadastral Verification</p>
                <p className="text-[#52605d] mt-0.5">2 cases awaiting revenue inspector field polygon check</p>
              </div>

              <div className="border-l-4 border-emerald-600 pl-3 py-1 bg-emerald-50/60 rounded-r">
                <p className="font-bold text-emerald-950">Audit Trail Synchronized</p>
                <p className="text-[#52605d] mt-0.5">All officer decisions logged to secure cryptographic ledger</p>
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#214f4e]" />
              <SectionLabel>Government DoLR Systems</SectionLabel>
            </div>
            <p className="text-xs text-[#4a5754] mt-2 leading-relaxed">
              External state registry webhooks are running in demo sandbox mode.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              {governmentServices.map((service) => (
                <div key={service.label} className="flex items-center justify-between text-[#52605d] border-t border-[#e3dccf] pt-2">
                  <span>{service.label}</span>
                  <span className="font-mono text-xs text-[#b26337] font-semibold">DEMO SANDBOX</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

export function OfficialGrievances() {
  const grievances = useSavedGrievances();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const rows = useMemo(
    () =>
      grievances.filter(
        (grievance) =>
          (filter === 'All' || grievance.status === filter) &&
          (grievance.id + grievance.subject + grievance.citizen + grievance.village)
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [grievances, query, filter]
  );

  return (
    <>
      <PageHead eyebrow="Official Portal / Redressal Workspace" title="Grievances & Concerns">
        <Link
          href="/official/dashboard"
          className="text-xs text-[#214f4e] hover:underline font-semibold flex items-center gap-1"
          data-testid="link-back-official-dashboard"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Officer Dashboard
        </Link>
      </PageHead>

      <Panel className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search size={15} className="absolute left-3 top-3 text-[#7a8682]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search grievance ID, citizen, or concern..."
              className="w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] placeholder:text-[#7a8682] py-2.5 pl-9 pr-3 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
              data-testid="input-grievance-search"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-[#52605d] font-semibold">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] px-3 py-2 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
              data-testid="select-grievance-status"
            >
              <option>All</option>
              <option>Submitted</option>
              <option>In Review</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#e9e4d9] text-[11px] font-mono uppercase text-[#34484a] font-bold">
              <tr>
                <th className="p-3">Grievance</th>
                <th className="p-3">Concern</th>
                <th className="p-3">Citizen</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id} className="border-t border-[#e3dccf] hover:bg-[#f7f3eb] transition-colors">
                  <td className="p-4 font-mono text-xs text-[#214f4e] font-bold">
                    {g.id}
                    <span className="block text-[#52605d] text-[10px] mt-0.5 font-normal">{g.caseId}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-[#202e35] max-w-xs">{g.subject}</td>
                  <td className="p-4 text-xs text-[#202e35]">
                    {g.citizen}
                    <span className="block text-[11px] text-[#52605d] mt-0.5">{g.village}</span>
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={g.priority === 'Urgent' ? 'danger' : g.priority === 'High' ? 'warn' : 'neutral'}>
                      {g.priority}
                    </StatusBadge>
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={g.status === 'Resolved' ? 'good' : g.status === 'In Review' ? 'warn' : 'neutral'}>
                      {g.status}
                    </StatusBadge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/official/grievances/${g.id}`}
                      className="text-xs font-semibold px-3 py-1.5 bg-[#214f4e] hover:bg-[#173e3d] text-white rounded transition-colors"
                      data-testid={`link-grievance-${g.id}`}
                    >
                      Open Case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

export function GrievanceDetail() {
  const [, params] = useRoute('/official/grievances/:id');
  const id = params?.id ?? demoGrievance.id;
  const [grievance, setGrievance] = useState<Grievance>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () =>
      recordService.getGrievance(id).then((current) => {
        if (!active) return;
        setGrievance(current);
        if (current) setNote(current.resolution);
      });
    void load();
    const unsubscribe = recordService.subscribe(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [id]);

  if (!grievance) {
    return (
      <PageHead eyebrow="Official Portal / Grievance Detail" title="Loading Grievance…">
        <Link href="/official/grievances" className="text-sm text-[#214f4e] underline">
          Back to Grievances
        </Link>
      </PageHead>
    );
  }

  const updateStatus = async (status: Grievance['status']) => {
    const updated = await recordService.updateGrievanceStatus(grievance.id, status);
    setGrievance(updated);
    setSaved(false);
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    const updated = await recordService.addGrievanceRemark(grievance.id, note.trim());
    setGrievance(updated);
    setSaved(true);
  };

  return (
    <>
      <PageHead eyebrow="Official Portal / Grievance Redressal" title={grievance.id}>
        <Link
          href="/official/grievances"
          className="text-xs text-[#214f4e] hover:underline font-semibold flex items-center gap-1"
          data-testid="link-back-grievances"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to grievance list
        </Link>
      </PageHead>

      <div className="grid lg:grid-cols-[1fr_.7fr] gap-6">
        <Panel className="p-6 md:p-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <SectionLabel>Case Linked · {grievance.caseId}</SectionLabel>
              <h2 className="font-serif text-2xl mt-1 text-[#202e35]">{grievance.subject}</h2>
              <p className="text-xs text-[#52605d] mt-1 font-medium">
                Submitted by {grievance.citizen} · {grievance.created}
              </p>
            </div>
            <StatusBadge tone={grievance.status === 'Resolved' ? 'good' : 'warn'}>{grievance.status}</StatusBadge>
          </div>

          <div className="mt-6 p-4 bg-[#f3eee3] border border-[#d5cdbd] rounded text-xs text-[#202e35] leading-relaxed">
            <span className="font-bold text-[#142127] block mb-1">Citizen's Recorded Concern:</span>
            {grievance.concern}
          </div>

          <div className="mt-6">
            <SectionLabel>Update Redressal Status</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {(['In Review', 'Resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => void updateStatus(status)}
                  className={`border px-3.5 py-2 text-xs font-semibold rounded transition-colors ${
                    grievance.status === status
                      ? 'bg-[#214f4e] text-white border-[#214f4e]'
                      : 'border-[#bfc3b8] bg-white text-[#202e35] hover:bg-[#f3eee3]'
                  }`}
                  data-testid={`button-grievance-${status.toLowerCase().replace(' ', '-')}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="resolution-note" className="text-[11px] font-mono uppercase tracking-[.16em] text-[#34484a] font-semibold block">
              Official Officer Response (Attributed to Record)
            </label>
            <textarea
              id="resolution-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
              rows={4}
              placeholder="Record official circle inquiry findings, site survey instructions, or resolution remarks..."
              className="mt-2 w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] placeholder:text-[#7a8682] p-3 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
              data-testid="textarea-resolution-note"
            />
          </div>

          <button
            disabled={!note.trim()}
            onClick={() => void saveNote()}
            className="mt-4 bg-[#214f4e] hover:bg-[#173e3d] text-white disabled:opacity-40 px-5 py-2.5 text-xs font-semibold rounded-md shadow-2xs transition-colors"
            data-testid="button-save-resolution"
          >
            {saved ? 'Response Saved to Audit Log' : 'Save Official Response'}
          </button>

          {grievance.resolution && (
            <div className="mt-5 border-l-4 border-[#214f4e] bg-[#e7eeea] p-4 text-xs">
              <SectionLabel>Published Officer Response</SectionLabel>
              <p className="mt-1 text-[#202e35] leading-relaxed">{grievance.resolution}</p>
            </div>
          )}
        </Panel>

        <Panel className="p-6">
          <SectionLabel>Attributable Audit History</SectionLabel>
          <div className="mt-5 border-l-2 border-[#c9c8bd] ml-2 space-y-4">
            {grievance.audit.map((a, i) => (
              <p key={a + i} className="relative pl-5 text-xs text-[#52605d]">
                <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 bg-[#43736b] rounded-full border-2 border-white" />
                {a}
              </p>
            ))}
          </div>

          <div className="mt-8 pt-5 border-t border-[#d5cdbd] text-xs text-[#52605d] leading-relaxed">
            Official actions update the saved demo record. The citizen concern status and official reply update in real time.
          </div>
        </Panel>
      </div>
    </>
  );
}