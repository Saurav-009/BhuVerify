import React, { useMemo, useState } from 'react';
import {
  Download,
  Filter,
  Search,
  SlidersHorizontal,
  Shield,
  Users,
  Clock,
  UserCheck,
  AlertCircle,
  KeyRound,
  Building2,
} from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { history } from '@/data/mockData';

const DEMO_LOGIN_HISTORY = [
  {
    officialId: 'SIH-DEMO-047',
    name: 'Anita Kumari (Demo)',
    rolePost: 'Circle Officer (Anchal Adhikari)',
    loginTime: '30 Sep 2026 · 13:45 IST',
    status: 'Active Session',
    tone: 'good' as const,
  },
  {
    officialId: 'SIH-DEMO-019',
    name: 'Rajeshwar Prasad (Demo)',
    rolePost: 'Revenue Karamchari · Halka 04',
    loginTime: '30 Sep 2026 · 11:20 IST',
    status: 'Verified',
    tone: 'good' as const,
  },
  {
    officialId: 'SIH-DEMO-082',
    name: 'Meena Sinha (Demo)',
    rolePost: 'Circle Inspector · Sampatchak',
    loginTime: '30 Sep 2026 · 09:55 IST',
    status: 'Logged Out',
    tone: 'neutral' as const,
  },
  {
    officialId: 'SIH-DEMO-104',
    name: 'Vikramaditya Singh (Demo)',
    rolePost: 'District Cadastral Surveyor',
    loginTime: '29 Sep 2026 · 17:12 IST',
    status: 'Review Pending',
    tone: 'warn' as const,
  },
  {
    officialId: 'SIH-DEMO-003',
    name: 'Dr. S. K. Verma (Demo)',
    rolePost: 'Additional Collector (Land Revenue)',
    loginTime: '29 Sep 2026 · 15:04 IST',
    status: 'Verified',
    tone: 'good' as const,
  },
];

const DEMO_ASSIGNED_POSTS = [
  {
    officialId: 'SIH-DEMO-047',
    name: 'Anita Kumari (Demo)',
    department: 'Department of Land Resources (DoLR)',
    designation: 'Circle Officer (CO)',
    jurisdiction: 'Sampatchak Anchal, Patna',
    accessLevel: 'Level 3 · Statutory Decision & Digital Sign',
    status: 'Active',
    tone: 'good' as const,
  },
  {
    officialId: 'SIH-DEMO-019',
    name: 'Rajeshwar Prasad (Demo)',
    department: 'Revenue & Land Reforms',
    designation: 'Halka Karamchari',
    jurisdiction: 'Bairiya Karnpura (Mauza 121)',
    accessLevel: 'Level 1 · Field Verification & Panji-II Entry',
    status: 'Active',
    tone: 'good' as const,
  },
  {
    officialId: 'SIH-DEMO-082',
    name: 'Meena Sinha (Demo)',
    department: 'Revenue & Land Reforms',
    designation: 'Circle Inspector (CI)',
    jurisdiction: 'Sampatchak Circle',
    accessLevel: 'Level 2 · Mutation & Grievance Audit',
    status: 'Active',
    tone: 'good' as const,
  },
  {
    officialId: 'SIH-DEMO-104',
    name: 'Vikramaditya Singh (Demo)',
    department: 'Directorate of Land Records & Survey',
    designation: 'Cadastral GIS Officer',
    jurisdiction: 'Patna Sadar & Sampatchak',
    accessLevel: 'Level 2 · Spatial Polygon & Khesra Resolver',
    status: 'Pending Renewal',
    tone: 'warn' as const,
  },
  {
    officialId: 'SIH-DEMO-003',
    name: 'Dr. S. K. Verma (Demo)',
    department: 'District Collectorate',
    designation: 'Additional Collector',
    jurisdiction: 'Patna District',
    accessLevel: 'Level 4 · Appellate & High-Risk Escalation',
    status: 'Active',
    tone: 'good' as const,
  },
];

export function HistoryPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const rows = useMemo(
    () =>
      history.filter(
        (r) =>
          (filter === 'All' || r.status === filter) &&
          (r.id + r.ownerName + r.surveyNumber + r.village)
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [query, filter]
  );

  return (
    <>
      <PageHead eyebrow="System Administration & Audit / Protected Demo" title="Admin & Examination History">
        <button
          className="border border-[#9ea8a2] bg-white hover:bg-[#e9e4d9] text-[#202e35] font-semibold px-3.5 py-2 text-xs rounded-md flex items-center gap-2 transition-colors shadow-2xs"
          data-testid="button-export-history"
        >
          <Download size={14} /> Export Audit Log
        </button>
      </PageHead>

      {/* Mandatory Fictional Prototype Disclaimer */}
      <div
        className="mb-6 p-4 rounded-lg bg-[#e7eeea] border-l-4 border-[#214f4e] flex items-center gap-3 text-xs text-[#202e35]"
        data-testid="banner-admin-demo-disclaimer"
      >
        <Shield className="w-4 h-4 text-[#214f4e] shrink-0" />
        <span className="font-medium">
          <strong>Demo access and audit data — fictional prototype records.</strong> None of the officials, login timestamps, or posts below represent real government personnel.
        </span>
      </div>

      {/* Summary Cards: Active Users, Today's Logins, Officers, Pending Access Reviews */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Active Users</SectionLabel>
            <Users size={16} className="text-[#214f4e]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#202e35] mt-2" data-testid="metric-active-users">
            04
          </div>
          <div className="text-xs text-[#52605d] mt-1 font-medium">Fictional prototype sessions</div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Today's Logins</SectionLabel>
            <Clock size={16} className="text-[#b26337]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#202e35] mt-2" data-testid="metric-todays-logins">
            12
          </div>
          <div className="text-xs text-[#52605d] mt-1 font-medium">Across 3 revenue circles</div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Officers</SectionLabel>
            <UserCheck size={16} className="text-emerald-700" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#202e35] mt-2" data-testid="metric-officers">
            05
          </div>
          <div className="text-xs text-[#52605d] mt-1 font-medium">Assigned demo posts</div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Pending Access Reviews</SectionLabel>
            <AlertCircle size={16} className="text-amber-700" />
          </div>
          <div className="font-serif text-3xl font-bold text-amber-800 mt-2" data-testid="metric-pending-reviews">
            01
          </div>
          <div className="text-xs text-[#52605d] mt-1 font-medium">Periodic role audit</div>
        </Panel>
      </div>

      {/* Section 1: Access & Login History */}
      <Panel className="p-6 mb-6" data-testid="section-access-login-history">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#d5cdbd]">
          <div className="flex items-center gap-2.5">
            <KeyRound size={18} className="text-[#214f4e]" />
            <div>
              <SectionLabel>Security & Session Ledger</SectionLabel>
              <h2 className="font-serif text-2xl text-[#202e35] mt-0.5">Access & Login History</h2>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#52605d] bg-[#f3eee3] px-2.5 py-1 rounded border border-[#d5cdbd]">
            Demo access and audit data — fictional prototype records.
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-[#e9e4d9] text-[11px] font-mono uppercase tracking-wider text-[#34484a] font-bold">
              <tr>
                <th className="p-3">Official ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Role / Post</th>
                <th className="p-3">Login Time</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_LOGIN_HISTORY.map((item) => (
                <tr key={item.officialId + item.loginTime} className="border-t border-[#e3dccf] hover:bg-[#f4f0e7]">
                  <td className="p-3.5 font-mono text-xs font-bold text-[#214f4e]">{item.officialId}</td>
                  <td className="p-3.5 text-xs font-semibold text-[#202e35]">{item.name}</td>
                  <td className="p-3.5 text-xs text-[#34484a]">{item.rolePost}</td>
                  <td className="p-3.5 font-mono text-xs text-[#52605d]">{item.loginTime}</td>
                  <td className="p-3.5">
                    <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Section 2: Assigned Posts / Roles */}
      <Panel className="p-6 mb-6" data-testid="section-assigned-posts-roles">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#d5cdbd]">
          <div className="flex items-center gap-2.5">
            <Building2 size={18} className="text-[#b26337]" />
            <div>
              <SectionLabel>Role-Based Access Control Matrix</SectionLabel>
              <h2 className="font-serif text-2xl text-[#202e35] mt-0.5">Assigned Posts / Roles</h2>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[#52605d] bg-[#f3eee3] px-2.5 py-1 rounded border border-[#d5cdbd]">
            Fictional Prototype Roster
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-[#e9e4d9] text-[11px] font-mono uppercase tracking-wider text-[#34484a] font-bold">
              <tr>
                <th className="p-3">Official ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Jurisdiction</th>
                <th className="p-3">Access Level</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ASSIGNED_POSTS.map((post) => (
                <tr key={post.officialId} className="border-t border-[#e3dccf] hover:bg-[#f4f0e7]">
                  <td className="p-3.5 font-mono text-xs font-bold text-[#214f4e]">{post.officialId}</td>
                  <td className="p-3.5 text-xs font-semibold text-[#202e35]">{post.name}</td>
                  <td className="p-3.5 text-xs text-[#34484a]">{post.department}</td>
                  <td className="p-3.5 text-xs font-medium text-[#202e35]">{post.designation}</td>
                  <td className="p-3.5 text-xs text-[#52605d]">{post.jurisdiction}</td>
                  <td className="p-3.5 font-mono text-[11px] text-[#34484a]">{post.accessLevel}</td>
                  <td className="p-3.5">
                    <StatusBadge tone={post.tone}>{post.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Section 3: Examination Case History */}
      <Panel className="p-6">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center pb-4 border-b border-[#d5cdbd]">
          <div>
            <SectionLabel>Case Examination Archive</SectionLabel>
            <h2 className="font-serif text-2xl text-[#202e35] mt-0.5">Processed Cases</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative sm:w-64">
              <Search size={15} className="absolute left-3 top-2.5 text-[#7a8682]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, owner, survey or village"
                className="w-full border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] placeholder:text-[#7a8682] py-2 pl-9 pr-3 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
                data-testid="input-history-search"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-[#52605d]" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-[#b8b6aa] bg-[#ffffff] text-[#1a262b] px-3 py-2 text-xs font-medium rounded-md outline-none focus:ring-2 focus:ring-[#214f4e]"
                data-testid="select-history-filter"
              >
                <option>All</option>
                <option>Verified</option>
                <option>Officer Review</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#e9e4d9] text-[11px] font-mono uppercase tracking-wider text-[#34484a] font-bold">
              <tr>
                <th className="p-3">Record</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Location</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#e3dccf] hover:bg-[#f4f0e7]">
                  <td className="p-4 font-mono text-xs font-bold text-[#214f4e]">
                    {r.id}
                    <span className="block text-[#52605d] font-normal mt-0.5">Survey {r.surveyNumber}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-[#202e35]">{r.ownerName}</td>
                  <td className="p-4 text-xs text-[#34484a]">
                    {r.village}, {r.district}
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-mono text-xs font-bold ${
                        r.riskScore > 69 ? 'text-red-700' : r.riskScore > 39 ? 'text-amber-700' : 'text-emerald-800'
                      }`}
                    >
                      {r.riskScore}/100
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={r.status === 'Verified' ? 'good' : r.riskScore > 69 ? 'danger' : 'warn'}>
                      {r.status}
                    </StatusBadge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={r.id === history[0].id ? '/record' : '/'}
                      className="text-xs font-semibold text-[#214f4e] underline"
                      data-testid={`link-history-record-${r.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="py-12 text-center text-sm text-[#52605d]">
            <Filter size={20} className="mx-auto mb-2 text-[#b26337]" />
            No records match this filter.
          </div>
        )}
      </Panel>
    </>
  );
}