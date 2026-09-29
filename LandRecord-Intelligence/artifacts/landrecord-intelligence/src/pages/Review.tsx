import { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardCheck, FileCheck2, History, Send } from 'lucide-react';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { demoRecord } from '@/data/mockData';
import type { OfficialCase, OfficerDecision } from '@/data/officialData';
import { recordService } from '@/services/recordService';

const actions: Array<[OfficerDecision['action'], string, string]> = [['verify','Verify record','Accept after review'],['return','Return for correction','Request clarification'],['escalate','Escalate case','Send to senior officer']];

export function ReviewPage() {
  const [caseRecord, setCaseRecord] = useState<OfficialCase>();
  const [action, setAction] = useState<OfficerDecision['action']>();
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => recordService.getCase(demoRecord.id).then((saved) => {
      if (!active || !saved) return;
      setCaseRecord(saved);
      setAction(saved.decision?.action);
      setRemarks(saved.decision?.remarks ?? '');
    });
    void load();
    const unsubscribe = recordService.subscribe(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  const save = async () => {
    if (!action || !remarks.trim() || saving) return;
    setSaving(true);
    try {
      setCaseRecord(await recordService.saveOfficerDecision(demoRecord.id, { action, remarks: remarks.trim() }));
    } finally {
      setSaving(false);
    }
  };
  const saved = Boolean(caseRecord?.decision);
  const auditTrail = caseRecord?.auditTrail ?? [];

  return <><PageHead eyebrow="Officer decision / final step" title="Make the record decision"><StatusBadge tone="warn">{saved?'Decision recorded':'Awaiting officer action'}</StatusBadge></PageHead><div className="grid lg:grid-cols-[1fr_.72fr] gap-5"><Panel className="p-6 md:p-8"><div className="flex items-center gap-3 border-b border-[#d5cdbd] pb-5"><ClipboardCheck className="text-[#b26337]" size={23}/><div><SectionLabel>Decision for {demoRecord.id}</SectionLabel><h2 className="font-serif text-2xl mt-1">{demoRecord.ownerName} · Survey {demoRecord.surveyNumber}</h2></div></div><div className="mt-7"><SectionLabel>Select an action</SectionLabel><div className="grid sm:grid-cols-3 gap-3 mt-3">{actions.map(([id,title,sub])=><button key={id} onClick={()=>setAction(id)} aria-pressed={action===id} className={`text-left border p-4 transition-colors ${action===id?'border-[#214f4e] bg-[#e7eeea]':'border-[#d5cdbd] hover:border-[#899891]'}`} data-testid={`button-action-${id}`}><span className={`w-3 h-3 inline-block border mr-2 ${action===id?'bg-[#214f4e] border-[#214f4e]':'border-[#9ca59d]'}`}></span><span className="text-sm font-semibold">{title}</span><span className="block text-xs text-[#77837d] mt-2 ml-5">{sub}</span></button>)}</div></div><div className="mt-7"><label htmlFor="remarks" className="text-[10px] font-mono uppercase tracking-[.16em] text-[#8a928b]">Officer remarks</label><textarea id="remarks" value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Record the reasoning or next action…" rows={5} className="mt-3 w-full border border-[#c9c8bd] bg-[#fdfaf4] p-3 text-sm outline-none focus:border-[#214f4e]" data-testid="textarea-officer-remarks"/></div><div className="mt-6 bg-[#fbf1e5] border-l-2 border-[#b26337] p-4 flex gap-3 text-xs text-[#735e4f]"><AlertTriangle size={16} className="shrink-0 text-[#a65435]"/> <span>High risk and the area mismatch remain unresolved. A verification action should only be recorded after documentary review.</span></div><button disabled={!action||!remarks.trim()||saving} onClick={() => void save()} className="mt-6 bg-[#214f4e] disabled:opacity-40 text-white px-5 py-3 text-sm flex items-center gap-2" data-testid="button-submit-decision"><Send size={15}/>{saving?'Saving decision…':saved?'Decision saved to audit trail':'Record officer decision'}</button></Panel><Panel className="p-6 md:p-7"><div className="flex justify-between"><SectionLabel>Audit trail</SectionLabel><History size={18} className="text-[#b26337]"/></div><div className="mt-6 border-l border-[#c9c8bd] ml-2 space-y-6">{auditTrail.map((entry,index)=>{const [time,...eventParts]=entry.split(' — ');const [event,by] = eventParts.join(' — ').split(' · ');return <div key={`${entry}-${index}`} className="relative pl-5"><span className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${index===auditTrail.length-1?'bg-[#b26337]':'bg-[#7f9d8f]'}`}></span><p className="font-mono text-[10px] text-[#8a928b]">{time}</p><p className="text-sm mt-1">{event}</p>{by && <p className="text-xs text-[#77837d] mt-1">{by}</p>}</div>})}</div><div className="mt-8 pt-5 border-t border-[#d5cdbd] flex gap-3 text-xs text-[#77837d]"><FileCheck2 size={15} className="text-[#43736b]"/> Every decision is attributable to the demo officer.</div></Panel></div></>;
}