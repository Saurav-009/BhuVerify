export type Grievance = {
  id: string; caseId: string; subject: string; citizen: string; village: string;
  status: 'Draft' | 'Submitted' | 'In Review' | 'Resolved'; priority: 'Urgent' | 'High' | 'Normal';
  created: string; concern: string; resolution: string; audit: string[];
};
export type OfficerDecision = {
  action: 'verify' | 'return' | 'escalate' | 'grievance' | 'reject';
  remarks: string;
  timestamp: string;
  officer: string;
};
export type OfficialCase = {
  id: string; owner: string; village: string; risk: number;
  status: string; priority: 'Urgent' | 'High' | 'Normal';
  decision?: OfficerDecision;
  auditTrail: string[];
};
export const demoGrievance: Grievance = {
  id: 'GRV-2026-00047', caseId: 'LR-2026-01482', subject: 'Area shown on deed differs from register',
  citizen: 'Priya Kumari', village: 'Rampur, Darbhanga', status: 'Submitted', priority: 'High',
  created: '06 Feb 2026, 14:41 IST',
  concern: 'The registry document appears to show 2.40 acre, while the existing register shows 2.84 acre for survey 142/3A. Please review the discrepancy and the related ownership entry.',
  resolution: '', audit: ['06 Feb 2026 · 14:41 — Concern submitted by citizen', '06 Feb 2026 · 14:41 — Demo-generated draft edited and submitted'],
};
export const officialGrievances: Grievance[] = [
  demoGrievance,
  { id: 'GRV-2026-00042', caseId: 'LR-2026-01391', subject: 'Boundary marker not visible on site', citizen: 'Amit Kumar', village: 'Rampur, Darbhanga', status: 'In Review', priority: 'Urgent', created: '05 Feb 2026, 11:08 IST', concern: 'The eastern marker referenced in the deed could not be located.', resolution: '', audit: ['05 Feb 2026 · 11:08 — Concern submitted', '05 Feb 2026 · 16:20 — Assigned to field survey team'] },
  { id: 'GRV-2026-00031', caseId: 'LR-2026-01288', subject: 'Request for certified copy status', citizen: 'Farida Khatoon', village: 'Bahadurpur, Darbhanga', status: 'Resolved', priority: 'Normal', created: '03 Feb 2026, 09:12 IST', concern: 'Please confirm when the certified copy can be collected.', resolution: 'Copy made available at the registry counter on 04 Feb 2026.', audit: ['03 Feb 2026 · 09:12 — Concern submitted', '04 Feb 2026 · 12:04 — Resolved by Anita Kumari'] },
];
export const officialCases: OfficialCase[] = [
  {
    id: 'LR-2026-01482', owner: 'Ramesh Kumar', village: 'Rampur', risk: 78,
    status: 'Officer Review', priority: 'Urgent',
    auditTrail: ['06 Feb 2026 · 14:32 — Document received · System', '06 Feb 2026 · 14:33 — Structured fields extracted · Examination service', '06 Feb 2026 · 14:34 — Risk calculated · 78 / High · Decision support'],
  },
  {
    id: 'LR-2026-01391', owner: 'Amit Kumar', village: 'Rampur', risk: 54,
    status: 'Officer Review', priority: 'High',
    auditTrail: [],
  },
  {
    id: 'LR-2026-01476', owner: 'Sunita Devi', village: 'Keshopur', risk: 19,
    status: 'Verified', priority: 'Normal',
    auditTrail: [],
  },
];