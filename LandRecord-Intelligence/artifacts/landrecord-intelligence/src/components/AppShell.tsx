import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ChevronRight, FileCheck2, GitCompareArrows, LandPlot,
  LayoutDashboard, Menu, Network, ShieldCheck, Upload, Shield, UserCog, Globe,
} from 'lucide-react';
import type { LandRecord } from '@/data/mockData';

const citizenNav = [
  { href: '/', label: 'Workspace', icon: LayoutDashboard },
  { href: '/upload', label: 'New examination', icon: Upload },
  { href: '/record', label: 'Extracted record', icon: FileCheck2 },
  { href: '/validation', label: 'Validation', icon: GitCompareArrows },
  { href: '/gis', label: 'Parcel & boundary', icon: LandPlot },
  { href: '/risk', label: 'Risk assessment', icon: ShieldCheck },
  { href: '/digital-reference', label: 'Digital Reference', icon: FileCheck2 },
];

function formatCleanCaseId(rawId?: string): string {
  if (!rawId || rawId === 'No active case') return 'No active case';
  // If rawId is already a clean system ID, keep it
  if (rawId.startsWith('BR_') || rawId.startsWith('LR-') || rawId.startsWith('CASE-')) {
    return rawId;
  }
  // Never show raw uploaded filenames like "Screenshot 2026-09-30 122448..." in the global header
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash * 31 + rawId.charCodeAt(i)) % 90000;
  }
  return `CASE-UPL-${Math.abs(hash) + 10000}`;
}

export function AppShell({ children, record }: { children: ReactNode; record: LandRecord }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [langToast, setLangToast] = useState(false);

  const isOfficerArea = location.startsWith('/official') || location.startsWith('/review') || location.startsWith('/officer');
  const isAdminArea = location.startsWith('/admin') || location.startsWith('/history') || location.startsWith('/architecture');

  const cleanCaseId = formatCleanCaseId(record?.id);

  const handleLanguageClick = () => {
    setLangToast(true);
    window.setTimeout(() => setLangToast(false), 3500);
  };

  return (
    <div className="min-h-[100dvh] flex bg-[#f2eee5]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[258px] bg-[#202e35] text-[#eee9dc] flex flex-col transition-transform duration-200 md:relative md:translate-x-0 print:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 pt-7 pb-6 border-b border-[#3b4a4e]">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" data-testid="link-brand">
            <span className="w-9 h-9 border border-[#d98549] text-[#d98549] grid place-items-center font-serif text-2xl">B</span>
            <span>
              <span className="block text-[13px] font-semibold tracking-[.12em] uppercase">BhuVerify</span>
              <span className="block text-[11px] text-[#a9b5b4] tracking-[.08em]">LAND INTELLIGENCE · SIH26018</span>
            </span>
          </Link>
        </div>

        <div className="px-4 py-5 flex-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-[#8ea09f]">Citizen workflow</p>
          <nav className="space-y-1">
            {citizenNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  location === href
                    ? 'bg-[#d98549] text-[#202e35] font-semibold'
                    : 'text-[#d3d8d0] hover:bg-[#2e4145] hover:text-white'
                }`}
              >
                <Icon size={16} strokeWidth={1.7} />
                <span>{label}</span>
                {location === href && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            ))}
          </nav>

          {/* Demo Officer / Admin separator */}
          <div className="mt-6 pt-5 border-t border-[#3b4a4e]">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-[#8ea09f]">Demo Workspaces</p>
            <Link
              href="/official"
              onClick={() => setOpen(false)}
              data-testid="link-officer-workspace"
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                isOfficerArea ? 'bg-[#3b5a4e] text-[#eee9dc] font-semibold' : 'text-[#b8c3bd] hover:bg-[#2e4145] hover:text-white'
              }`}
            >
              <Shield size={16} strokeWidth={1.7} />
              <span>Officer Workspace</span>
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-[#3b4a4e] text-[#eee9dc] rounded">DEMO</span>
            </Link>
            <Link
              href="/history"
              onClick={() => setOpen(false)}
              data-testid="link-admin-workspace"
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                isAdminArea ? 'bg-[#3b5a4e] text-[#eee9dc] font-semibold' : 'text-[#b8c3bd] hover:bg-[#2e4145] hover:text-white'
              }`}
            >
              <UserCog size={16} strokeWidth={1.7} />
              <span>Admin / History</span>
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 bg-[#3b4a4e] text-[#eee9dc] rounded">DEMO</span>
            </Link>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-[#3b4a4e]">
          <Link href="/architecture" className="flex items-center gap-3 text-sm text-[#b8c3bd] hover:text-white" data-testid="link-architecture">
            <Network size={16} /> How it works
          </Link>
          <div className="mt-5 flex items-center gap-2">
            <span className="w-7 h-7 bg-[#dfb76d] text-[#202e35] grid place-items-center text-xs font-semibold">BV</span>
            <span className="text-xs">
              <b className="block text-[#eee9dc]">BhuVerify SIH 2026</b>
              <span className="text-[#8ea09f]">Team Tesseract · Bihar</span>
            </span>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-[#142127]/60 md:hidden print:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          data-testid="button-close-nav"
        />
      )}

      <main className="flex-1 min-w-0 relative">
        <header className="h-[72px] border-b border-[#d5cdbd] bg-[#f7f3eb] flex items-center justify-between px-5 md:px-9 print:hidden">
          <button onClick={() => setOpen(true)} className="mobile-only p-2 -ml-2" aria-label="Open navigation" data-testid="button-open-nav">
            <Menu size={21} />
          </button>

          <div className="flex items-center gap-2 text-xs text-[#4a5754] font-medium">
            <span className="w-2 h-2 bg-[#d98549] rounded-full" />
            <span>Demo Environment</span>
            <span className="hidden sm:inline text-[#687571]">· BhuVerify</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs font-mono text-[#34484a] font-semibold" data-testid="header-case-id">
              Case ID: {cleanCaseId}
            </span>
            <span className="h-6 w-px bg-[#d5cdbd] hidden sm:block" />
            <button
              type="button"
              onClick={handleLanguageClick}
              className="text-xs font-semibold text-[#202e35] hover:bg-[#e9e4d9] px-2.5 py-1.5 rounded border border-[#c9c8bd] flex items-center gap-1.5 transition-colors cursor-pointer"
              data-testid="button-language-toggle"
              title="Switch interface language"
            >
              <Globe size={13} className="text-[#214f4e]" />
              <span>EN</span>
              <span className="text-[#687571]">/ हिंदी</span>
            </button>
          </div>
        </header>

        {/* Honest Language Toast */}
        {langToast && (
          <div
            role="status"
            data-testid="toast-language-coming-soon"
            className="fixed top-20 right-6 z-50 bg-[#202e35] text-[#eee9dc] border border-[#d98549] px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2"
          >
            <Globe size={15} className="text-[#d98549] shrink-0" />
            <div>
              <p className="font-bold text-white">Hindi interface — Coming Soon</p>
              <p className="text-[11px] text-[#a9b5b4] mt-0.5">Language switching will be available in a future version.</p>
            </div>
          </div>
        )}

        <div className="max-w-[1440px] mx-auto p-5 md:p-9">{children}</div>
      </main>
    </div>
  );
}

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[.15em] text-[#b26337] font-semibold mb-2">{eyebrow}</div>
        <h1 className="font-serif text-4xl md:text-[46px] leading-none text-[#202e35]">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'good' | 'danger' | 'success' }) {
  const c = {
    neutral: 'bg-[#e4e2d9] text-[#34484a]',
    warn: 'bg-[#f1dfbf] text-[#6e461d]',
    good: 'bg-[#d7e4d7] text-[#25492f]',
    success: 'bg-[#d7e4d7] text-[#25492f]',
    danger: 'bg-[#f0d5ca] text-[#752e23]',
  }[tone];
  return <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-xs ${c}`}>{children}</span>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-[#fbf8f1] border border-[#d5cdbd] ink-shadow ${className}`}>{children}</section>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[10px] font-mono uppercase tracking-[.16em] text-[#52605d] font-bold">{children}</div>;
}
