import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Archive, BookOpen, ChevronRight, FileCheck2, GitCompareArrows, LandPlot, LayoutDashboard, Menu, Network, ShieldCheck, Upload, Landmark } from 'lucide-react';
import type { LandRecord } from '@/data/mockData';

const nav = [
  { href: '/', label: 'Workspace', icon: LayoutDashboard },
  { href: '/upload', label: 'New examination', icon: Upload },
  { href: '/record', label: 'Extracted record', icon: FileCheck2 },
  { href: '/digital-reference', label: 'Bhu-Abhilekh Portal', icon: FileCheck2 },
  { href: '/validation', label: 'Validation', icon: GitCompareArrows },
  { href: '/gis', label: 'Parcel & boundary', icon: LandPlot },
  { href: '/risk', label: 'Risk assessment', icon: ShieldCheck },
  { href: '/review', label: 'Officer decision', icon: BookOpen },
  { href: '/official', label: 'Official Portal', icon: Landmark },
];
export function AppShell({ children, record }: { children: ReactNode; record: LandRecord }) {
  const [location] = useLocation(); const [open, setOpen] = useState(false);
  return <div className="min-h-[100dvh] flex bg-[#f2eee5]">
    <aside className={`fixed inset-y-0 left-0 z-40 w-[258px] bg-[#202e35] text-[#eee9dc] flex flex-col transition-transform duration-200 md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-6 pt-7 pb-6 border-b border-[#3b4a4e]">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" data-testid="link-brand">
          <span className="w-9 h-9 border border-[#d98549] text-[#d98549] grid place-items-center font-serif text-2xl">L</span>
          <span><span className="block text-[13px] font-semibold tracking-[.12em] uppercase">LandRecord</span><span className="block text-[11px] text-[#a9b5b4] tracking-[.08em]">INTELLIGENCE · SIH26018</span></span>
        </Link>
      </div>
      <div className="px-4 py-5">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-[#8ea09f]">Examination desk</p>
        <nav className="space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${location === href ? 'bg-[#d98549] text-[#202e35]' : 'text-[#d3d8d0] hover:bg-[#2e4145]'}`}><Icon size={16} strokeWidth={1.7}/><span>{label}</span>{location === href && <ChevronRight size={14} className="ml-auto"/>}</Link>)}</nav>
      </div>
      <div className="mt-auto px-6 py-5 border-t border-[#3b4a4e]">
        <Link href="/history" className="flex items-center gap-3 text-sm text-[#b8c3bd] hover:text-white" data-testid="link-history"><Archive size={16}/> Record history</Link>
        <Link href="/architecture" className="flex items-center gap-3 mt-4 text-sm text-[#b8c3bd] hover:text-white" data-testid="link-architecture"><Network size={16}/> How it works</Link>
        <div className="mt-7 flex items-center gap-2"><span className="w-7 h-7 bg-[#dfb76d] text-[#202e35] grid place-items-center text-xs font-semibold">AK</span><span className="text-xs"><b className="block text-[#eee9dc]">Anita Kumari</b><span className="text-[#8ea09f]">Registry Officer · Bihar</span></span></div>
      </div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-[#142127]/60 md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" data-testid="button-close-nav"/>}
    <main className="flex-1 min-w-0">
      <header className="h-[72px] border-b border-[#d5cdbd] bg-[#f7f3eb] flex items-center justify-between px-5 md:px-9">
        <button onClick={() => setOpen(true)} className="mobile-only p-2 -ml-2" aria-label="Open navigation" data-testid="button-open-nav"><Menu size={21}/></button>
        <div className="flex items-center gap-2 text-xs text-[#6b7774]"><span className="w-2 h-2 bg-[#d98549] rounded-full"></span> Demo environment <span className="hidden sm:inline">/ Protected officer workspace</span><span className="hidden lg:inline font-mono text-[10px] text-[#43736b]"> · HUMAN VERIFIED after sign-off</span></div>
        <div className="flex items-center gap-4"><span className="hidden sm:block text-xs font-mono text-[#6b7774]">{record.id}</span><span className="h-7 w-px bg-[#d5cdbd] hidden sm:block"/><span className="text-xs text-[#34484a]">EN <span className="text-[#9a9f98]">हिन्दी</span></span></div>
      </header>
      <div className="max-w-[1440px] mx-auto p-5 md:p-9">{children}</div>
    </main>
  </div>;
}
export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) { return <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7"><div><div className="text-[11px] font-mono uppercase tracking-[.15em] text-[#b26337] mb-2">{eyebrow}</div><h1 className="font-serif text-4xl md:text-[46px] leading-none text-[#202e35]">{title}</h1></div>{children}</div>; }
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'good' | 'danger' }) { const c = { neutral: 'bg-[#e4e2d9] text-[#52605d]', warn: 'bg-[#f1dfbf] text-[#885a29]', good: 'bg-[#d7e4d7] text-[#386244]', danger: 'bg-[#f0d5ca] text-[#8b3e32]' }[tone]; return <span className={`inline-flex items-center px-2 py-1 text-[11px] font-semibold tracking-wide ${c}`}>{children}</span>; }
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`bg-[#fbf8f1] border border-[#d5cdbd] ink-shadow ${className}`}>{children}</section>; }
export function SectionLabel({ children }: { children: ReactNode }) { return <div className="text-[10px] font-mono uppercase tracking-[.16em] text-[#8a928b]">{children}</div>; }