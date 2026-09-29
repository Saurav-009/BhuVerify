import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, CheckCircle2, ClipboardList, FileSearch, LockKeyhole, Search, ShieldAlert, UsersRound, type LucideIcon } from 'lucide-react';
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
    const load = () => recordService.getGrievances().then((saved) => { if (active) setGrievances(saved); });
    void load();
    const unsubscribe = recordService.subscribe(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return grievances;
}

function useSavedCases() {
  const [cases, setCases] = useState<OfficialCase[]>([]);
  useEffect(() => {
    let active = true;
    const load = () => recordService.getCases().then((saved) => { if (active) setCases(saved); });
    void load();
    const unsubscribe = recordService.subscribe(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return cases;
}

export function OfficialLogin({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState('SIH-DEMO-047');
  const [password, setPassword] = useState('registry-demo');
  return <div className="max-w-xl mx-auto"><div className="text-center mb-8"><div className="w-12 h-12 bg-[#202e35] text-[#d98549] grid place-items-center font-serif text-3xl mx-auto">L</div><div className="text-[11px] font-mono uppercase tracking-[.16em] text-[#b26337] mt-5">Separate access area · demo only</div><h1 className="font-serif text-4xl mt-2">Official Portal</h1><p className="text-sm text-[#687571] mt-2">Registry officer workspace for case management and grievance response</p></div><Panel className="p-7 md:p-9"><div className="bg-[#e7eeea] border-l-2 border-[#43736b] p-4 text-xs text-[#52605d]"><b>Demo Official Access</b><br/>Prototype role-based access control. No real government authentication is connected.</div><form className="mt-7 space-y-5" onSubmit={e=>{e.preventDefault();onLogin()}}><div><label htmlFor="official-id" className="text-[10px] font-mono uppercase tracking-[.16em] text-[#8a928b]">Official ID</label><input id="official-id" autoComplete="username" value={id} onChange={e=>setId(e.target.value)} className="mt-2 w-full border border-[#c9c8bd] bg-[#fdfaf4] p-3 text-sm" data-testid="input-official-id"/></div><div><label htmlFor="official-password" className="text-[10px] font-mono uppercase tracking-[.16em] text-[#8a928b]">Password</label><input id="official-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full border border-[#c9c8bd] bg-[#fdfaf4] p-3 text-sm" data-testid="input-official-password"/></div><button type="submit" disabled={!id||!password} className="w-full bg-[#214f4e] disabled:opacity-40 text-white px-4 py-3 text-sm flex items-center justify-center gap-2" data-testid="button-demo-official-login"><LockKeyhole size={15}/> Demo Official Login</button></form></Panel></div>;
}

export function OfficialDashboard() {
  const grievances = useSavedGrievances();
  const cases = useSavedCases();
  const [citizenGrievance, setCitizenGrievance] = useState<Grievance>();
  useEffect(() => {
    let active = true;
    const load = () => recordService.getCitizenGrievance().then((saved) => { if (active) setCitizenGrievance(saved); });
    void load();
    const unsubscribe = recordService.subscribe(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, []);
  const metrics: Array<[string,string,string,LucideIcon]> = [['Total cases','128','+14 this month',ClipboardList],['Pending verification','23','7 urgent',FileSearch],['High-risk cases','09','Needs attention',ShieldAlert],['Potential conflicts','06','2 new today',UsersRound]];
  return <><PageHead eyebrow="Official Portal / demo access" title="Officer dashboard"><div className="flex items-center gap-2 text-xs text-[#687571]"><span className="w-2 h-2 rounded-full bg-[#43736b]"/> Anita Kumari · Demo Official</div></PageHead><div className="bg-[#e7eeea] border border-[#b7ccc1] px-4 py-3 text-xs text-[#52605d] mb-5"><b>Demo Official Access</b> · Prototype role-based access control · All records and metrics below are fictional.</div><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{metrics.map(([a,b,c,I])=><Panel key={a} className="p-5"><I size={18} className="text-[#b26337]"/><SectionLabel>{a}</SectionLabel><div className="font-serif text-4xl mt-2">{b}</div><div className="text-xs text-[#77837d] mt-1">{c}</div></Panel>)}</div><div className="grid grid-cols-2 gap-4 mt-5"><Panel className="p-4"><SectionLabel>Open grievances</SectionLabel><div className="font-serif text-3xl mt-1">{grievances.filter((grievance) => grievance.status !== 'Resolved').length}</div><div className="text-xs text-[#77837d]">Saved demo records</div></Panel><Panel className="p-4"><SectionLabel>Resolved grievances</SectionLabel><div className="font-serif text-3xl mt-1 text-[#43736b]">{grievances.filter((grievance) => grievance.status === 'Resolved').length}</div><div className="text-xs text-[#77837d]">Saved in this browser</div></Panel></div><div className="grid lg:grid-cols-[1.2fr_.8fr] gap-5 mt-5"><Panel className="p-6"><div className="flex justify-between items-center"><div><SectionLabel>Priority queue</SectionLabel><h2 className="font-serif text-2xl mt-2">Cases needing a human</h2></div><Link href="/official/grievances" className="text-xs text-[#214f4e] underline" data-testid="link-dashboard-grievances">Open grievances</Link></div><div className="mt-5 space-y-3">{cases.map(c=><div key={c.id} className="flex gap-3 items-center border-t border-[#e3dccf] pt-3"><span className={`w-2 h-2 ${c.priority==='Urgent'?'bg-[#a65435]':c.priority==='High'?'bg-[#d09b50]':'bg-[#43736b]'}`}></span><div className="flex-1"><div className="font-mono text-xs text-[#214f4e]">{c.id}</div><div className="text-sm mt-1">{c.owner} · {c.village}</div></div><span className="font-mono text-xs">{c.risk}</span><StatusBadge tone={c.priority==='Urgent'?'danger':c.priority==='High'?'warn':'good'}>{c.priority}</StatusBadge></div>)}</div></Panel><Panel className="p-6"><div className="flex justify-between"><SectionLabel>Notifications</SectionLabel><Bell size={17} className="text-[#b26337]"/></div><div className="space-y-4 mt-5 text-sm"><p className="border-l-2 border-[#a65435] pl-3"><b>{citizenGrievance?.id === demoGrievance.id ? 'Demo grievance ready for review' : 'New high-priority grievance'}</b><span className="block text-xs text-[#77837d] mt-1">{citizenGrievance?.id ?? demoGrievance.id} · {demoGrievance.caseId}</span></p><p className="border-l-2 border-[#d09b50] pl-3"><b>Boundary review requested</b><span className="block text-xs text-[#77837d] mt-1">2 cases waiting for map check</span></p></div><div className="mt-7 pt-5 border-t border-[#d5cdbd]"><SectionLabel>Weekly throughput</SectionLabel><div className="flex items-end gap-1 h-20 mt-4">{[32,46,39,62,52,76,66].map((h,i)=><div key={i} className="flex-1 bg-[#71988a]" style={{height:`${h}%`}}></div>)}</div><div className="flex justify-between font-mono text-[9px] text-[#87918a] mt-2"><span>Mon</span><span>Sun</span></div></div></Panel></div><Panel className="mt-5 p-6"><div className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#43736b]"/><div className="flex-1"><SectionLabel>Government services</SectionLabel><p className="text-sm mt-1">External official websites are kept empty and unverified in this prototype configuration.</p><div className="mt-3 space-y-2">{governmentServices.map(service=><div key={service.label} className="flex items-center justify-between text-xs text-[#77837d] border-t border-[#e3dccf] pt-2"><span>{service.label}</span><span className="font-mono text-[#a65435]">URL UNVERIFIED / NOT CONFIGURED</span></div>)}</div><Link href="/architecture" className="inline-block text-[#214f4e] underline text-xs mt-4" data-testid="link-services-note">Read the system note.</Link></div></div></Panel></>;
}

export function OfficialGrievances() {
  const grievances = useSavedGrievances();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const rows = useMemo(() => grievances.filter((grievance) => (filter === 'All' || grievance.status === filter) && (grievance.id + grievance.subject + grievance.citizen).toLowerCase().includes(query.toLowerCase())), [grievances, query, filter]);
  return <><PageHead eyebrow="Official Portal / case management" title="Grievances & concerns"><Link href="/official/dashboard" className="text-sm text-[#214f4e] underline" data-testid="link-back-official-dashboard">Back to dashboard</Link></PageHead><Panel className="p-5"><div className="flex flex-col sm:flex-row gap-3 justify-between"><div className="relative max-w-md w-full"><Search size={15} className="absolute left-3 top-3 text-[#87918a]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search grievance, citizen or subject" className="w-full border border-[#c9c8bd] bg-[#fdfaf4] py-2.5 pl-9 pr-3 text-sm" data-testid="input-grievance-search"/></div><select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-[#c9c8bd] bg-[#fdfaf4] px-3 text-sm" data-testid="select-grievance-status"><option>All</option><option>Submitted</option><option>In Review</option><option>Resolved</option></select></div><div className="overflow-x-auto mt-5"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#e9e4d9] text-[10px] font-mono uppercase text-[#6f7a75]"><tr><th className="p-3 font-normal">Grievance</th><th className="p-3 font-normal">Concern</th><th className="p-3 font-normal">Citizen</th><th className="p-3 font-normal">Priority</th><th className="p-3 font-normal">Status</th><th></th></tr></thead><tbody>{rows.map(g=><tr key={g.id} className="border-t border-[#e3dccf]"><td className="p-4 font-mono text-xs text-[#214f4e]">{g.id}<span className="block text-[#87918a] mt-1">{g.caseId}</span></td><td className="p-4 text-sm">{g.subject}</td><td className="p-4 text-sm">{g.citizen}<span className="block text-xs text-[#87918a] mt-1">{g.village}</span></td><td className="p-4"><StatusBadge tone={g.priority==='Urgent'?'danger':g.priority==='High'?'warn':'neutral'}>{g.priority}</StatusBadge></td><td className="p-4"><StatusBadge tone={g.status==='Resolved'?'good':g.status==='In Review'?'warn':'neutral'}>{g.status}</StatusBadge></td><td className="p-4"><Link href={`/official/grievances/${g.id}`} className="text-xs text-[#214f4e] underline" data-testid={`link-grievance-${g.id}`}>Open</Link></td></tr>)}</tbody></table></div></Panel></>;
}

export function GrievanceDetail() {
  const [, params] = useRoute('/official/grievances/:id');
  const id = params?.id ?? demoGrievance.id;
  const [grievance, setGrievance] = useState<Grievance>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => recordService.getGrievance(id).then((current) => {
      if (!active) return;
      setGrievance(current);
      if (current) setNote(current.resolution);
    });
    void load();
    const unsubscribe = recordService.subscribe(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, [id]);

  if (!grievance) return <><PageHead eyebrow="Official Portal / grievance detail" title="Loading grievance…"><Link href="/official/grievances" className="text-sm text-[#214f4e] underline">Back to grievance list</Link></PageHead></>;
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
  return <><PageHead eyebrow="Official Portal / grievance detail" title={grievance.id}><Link href="/official/grievances" className="text-sm text-[#214f4e] underline" data-testid="link-back-grievances">Back to grievance list</Link></PageHead><div className="grid lg:grid-cols-[1fr_.7fr] gap-5"><Panel className="p-6 md:p-8"><div className="flex justify-between items-start"><div><SectionLabel>Case linked · {grievance.caseId}</SectionLabel><h2 className="font-serif text-2xl mt-2">{grievance.subject}</h2><p className="text-xs text-[#77837d] mt-2">Submitted by {grievance.citizen} · {grievance.created}</p></div><StatusBadge tone={grievance.status==='Resolved'?'good':'warn'}>{grievance.status}</StatusBadge></div><div className="mt-7 p-5 bg-[#f3eee3] border border-[#d5cdbd] text-sm leading-relaxed">{grievance.concern}</div><div className="mt-7"><SectionLabel>Case action</SectionLabel><div className="flex flex-wrap gap-2 mt-3">{(['In Review','Resolved'] as const).map(status=><button key={status} onClick={() => void updateStatus(status)} className={`border px-3 py-2 text-sm ${grievance.status===status?'bg-[#214f4e] text-white border-[#214f4e]':'border-[#bfc3b8]'}`} data-testid={`button-grievance-${status.toLowerCase().replace(' ','-')}`}>{status}</button>)}</div></div><div className="mt-6"><label htmlFor="resolution-note" className="text-[10px] font-mono uppercase tracking-[.16em] text-[#8a928b]">Officer response (visible to citizen)</label><textarea id="resolution-note" value={note} onChange={e=>{setNote(e.target.value);setSaved(false)}} rows={4} placeholder="Add a clear, attributable response…" className="mt-2 w-full border border-[#c9c8bd] bg-[#fdfaf4] p-3 text-sm" data-testid="textarea-resolution-note"/></div><button disabled={!note.trim()} onClick={() => void saveNote()} className="mt-4 bg-[#214f4e] text-white disabled:opacity-40 px-4 py-2.5 text-sm" data-testid="button-save-resolution">{saved?'Response saved':'Save response'}</button>{grievance.resolution && <div className="mt-5 border-l-2 border-[#43736b] bg-[#e7eeea] p-4 text-sm"><SectionLabel>Saved officer response</SectionLabel><p className="mt-2 text-[#52605d]">{grievance.resolution}</p></div>}</Panel><Panel className="p-6"><SectionLabel>Audit history</SectionLabel><div className="mt-5 border-l border-[#c9c8bd] ml-2 space-y-5">{grievance.audit.map(a=><p key={a} className="relative pl-5 text-xs text-[#66736e]"><span className="absolute -left-[5px] top-1 w-2 h-2 bg-[#71988a] rounded-full"></span>{a}</p>)}</div><div className="mt-7 pt-5 border-t border-[#d5cdbd] text-xs text-[#77837d]">Official actions update the saved demo record. Citizens see the latest status and response when they return to the concern page.</div></Panel></div></>;
}