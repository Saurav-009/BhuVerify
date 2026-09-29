import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, FileWarning, Send } from 'lucide-react';
import { Link } from 'wouter';
import { PageHead, Panel, SectionLabel, StatusBadge } from '@/components/AppShell';
import { demoGrievance } from '@/data/officialData';
import { recordService } from '@/services/recordService';

function statusSummary(status: NonNullable<Awaited<ReturnType<typeof recordService.getCitizenGrievance>>>['status']) {
  switch (status) {
    case 'In Review':
      return {
        title: 'Official review in progress',
        description: 'An official has opened this concern and is reviewing the details.',
        tone: 'warn' as const,
      };
    case 'Resolved':
      return {
        title: 'Concern resolved',
        description: 'An official has completed the review of this concern.',
        tone: 'good' as const,
      };
    default:
      return {
        title: 'Awaiting official review',
        description: 'Your concern has been submitted. An official response will appear here after review.',
        tone: 'neutral' as const,
      };
  }
}

export function ConcernPage() {
  const [grievance, setGrievance] = useState<Awaited<ReturnType<typeof recordService.getCitizenGrievance>>>();
  const [text, setText] = useState(demoGrievance.concern);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => recordService.getCitizenGrievance().then((saved) => {
      if (!active) return;
      setGrievance(saved);
      if (saved) setText(saved.concern);
    });
    void load();
    const unsubscribe = recordService.subscribe(() => { void load(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  const submit = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const created = await recordService.createGrievance({
        caseId: demoGrievance.caseId,
        subject: demoGrievance.subject,
        citizen: demoGrievance.citizen,
        village: demoGrievance.village,
        priority: demoGrievance.priority,
        concern: text.trim(),
      });
      setGrievance(created);
    } finally {
      setSaving(false);
    }
  };

  return <><PageHead eyebrow="Citizen feedback / demo flow" title="Raise a concern"><Link href="/risk" className="text-sm flex items-center gap-2 text-[#214f4e]" data-testid="link-back-risk"><ArrowLeft size={15}/> Back to evidence</Link></PageHead>
    <div className="max-w-3xl"><Panel className="p-6 md:p-9">{grievance ? (() => {
      const summary = statusSummary(grievance.status);
      const response = grievance.resolution.trim();
      return <div className="py-10">
        <div className="text-center">
          <CheckCircle2 size={42} className="mx-auto text-[#43736b]"/>
          <h2 className="font-serif text-3xl mt-5">Concern submitted</h2>
          <p className="text-sm text-[#687571] mt-2">Your demo grievance has been sent to the Official Portal.</p>
          <div className="font-mono text-[#214f4e] mt-5" data-testid="submitted-grievance-id">{grievance.id}</div>
        </div>
        <div className="mt-7 border border-[#d5cdbd] bg-[#f3eee3] p-5" data-testid="citizen-grievance-status">
          <div className="flex items-start gap-3">
            {grievance.status === 'Submitted' ? <Clock3 size={20} className="mt-0.5 text-[#8a928b]"/> : <CheckCircle2 size={20} className={grievance.status === 'Resolved' ? 'mt-0.5 text-[#43736b]' : 'mt-0.5 text-[#b26337]'}/>}
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionLabel>Latest saved status</SectionLabel>
                <StatusBadge tone={summary.tone}>{grievance.status}</StatusBadge>
              </div>
              <h3 className="font-serif text-xl mt-3">{summary.title}</h3>
              <p className="text-sm text-[#687571] mt-1">{summary.description}</p>
            </div>
          </div>
        </div>
        <div className={`mt-4 p-5 ${response ? 'border-l-2 border-[#43736b] bg-[#e7eeea]' : 'border-l-2 border-[#c9c8bd] bg-[#f7f3eb]'}`} data-testid={response ? 'citizen-grievance-response' : 'citizen-grievance-no-response'}>
          <SectionLabel>{response ? 'Officer response' : 'Officer response'}</SectionLabel>
          {response ? <p className="mt-2 text-sm leading-relaxed text-[#52605d]">{response}</p> : <p className="mt-2 text-sm leading-relaxed text-[#687571]">{grievance.status === 'Resolved' ? 'This concern was marked resolved, but no officer remark was saved.' : 'No officer response has been saved yet. This section will update when the review team adds a remark.'}</p>}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/official/grievances" className="bg-[#214f4e] text-white px-4 py-2.5 text-sm" data-testid="link-view-official-grievance">View official review</Link>
          <Link href="/risk" className="border border-[#bfc3b8] px-4 py-2.5 text-sm" data-testid="link-return-risk">Return to case</Link>
        </div>
      </div>;
    })() : <><div className="flex gap-3 items-start"><FileWarning className="text-[#b26337]" size={22}/><div><SectionLabel>Concern about {demoGrievance.caseId}</SectionLabel><h2 className="font-serif text-2xl mt-2">{demoGrievance.subject}</h2><p className="text-sm text-[#687571] mt-2">This is a fictional citizen-side pathway attached to the current demo record.</p></div></div><div className="mt-7"><label htmlFor="concern" className="text-[10px] font-mono uppercase tracking-[.16em] text-[#8a928b]">Concern details</label><textarea id="concern" value={text} onChange={e=>setText(e.target.value)} rows={7} className="mt-3 w-full border border-[#c9c8bd] bg-[#fdfaf4] p-3 text-sm leading-relaxed outline-none focus:border-[#214f4e]" data-testid="textarea-concern"/></div><div className="mt-4 border-l-2 border-[#b26337] bg-[#fbf1e5] p-4 text-xs text-[#735e4f]"><b>AI EXPLANATION · EDITABLE DEMO-GENERATED DRAFT</b><p className="mt-1">This wording is non-legal, prepared for demonstration, and can be edited before submission. It is not legal advice.</p></div><button disabled={!text.trim() || saving} onClick={() => void submit()} className="mt-6 bg-[#214f4e] text-white disabled:opacity-40 px-5 py-3 text-sm flex items-center gap-2" data-testid="button-submit-concern"><Send size={15}/> {saving ? 'Saving grievance…' : 'Generate grievance ID and submit'}</button></>}</Panel></div></>;
}