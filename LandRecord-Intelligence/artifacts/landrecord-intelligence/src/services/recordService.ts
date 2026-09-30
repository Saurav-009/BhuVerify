import { demoRecord, type LandRecord } from '@/data/mockData';
import { officialCases, officialGrievances, type Grievance, type OfficialCase, type OfficerDecision } from '@/data/officialData';

const STORAGE_KEY = 'landrecord-intelligence:official-state:v1';
const CHANGE_EVENT = 'landrecord-intelligence:official-state-changed';
const DEMO_OFFICER = 'Anita Kumari';
const isDemoMode = import.meta.env.MODE === 'test' || import.meta.env.VITE_RECORD_MODE !== 'server';

type StoredState = {
  grievances: Grievance[];
  cases: OfficialCase[];
  citizenGrievanceId?: string;
};
type StateListener = () => void;
type GrievanceInput = Pick<Grievance, 'caseId' | 'subject' | 'citizen' | 'village' | 'priority' | 'concern'>;
type StateService = {
  getDemo: () => Promise<LandRecord>;
  inspectFile: (file: File) => Promise<{ name: string; size: string; type: string }>;
  subscribe: (listener: StateListener) => () => void;
  getGrievances: () => Promise<Grievance[]>;
  getGrievance: (id: string) => Promise<Grievance | undefined>;
  getCitizenGrievance: () => Promise<Grievance | undefined>;
  createGrievance: (input: GrievanceInput) => Promise<Grievance>;
  updateGrievanceStatus: (id: string, status: Grievance['status']) => Promise<Grievance>;
  addGrievanceRemark: (id: string, note: string) => Promise<Grievance>;
  getCases: () => Promise<OfficialCase[]>;
  getCase: (id: string) => Promise<OfficialCase | undefined>;
  saveOfficerDecision: (id: string, decision: Pick<OfficerDecision, 'action' | 'remarks'>) => Promise<OfficialCase>;
};

const listeners = new Set<StateListener>();
let pollTimer: number | undefined;

function canUseStorage() {
  if (typeof window === 'undefined') return false;
  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function initialState(): StoredState {
  return {
    grievances: officialGrievances.map((grievance) => ({ ...grievance, audit: [...grievance.audit] })),
    cases: officialCases.map((officialCase) => ({ ...officialCase, auditTrail: [...officialCase.auditTrail] })),
  };
}

function readState(): StoredState {
  if (!canUseStorage()) return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!Array.isArray(parsed.grievances) || !Array.isArray(parsed.cases)) return initialState();
    return {
      grievances: parsed.grievances as Grievance[],
      cases: parsed.cases as OfficialCase[],
      citizenGrievanceId: typeof parsed.citizenGrievanceId === 'string' ? parsed.citizenGrievanceId : undefined,
    };
  } catch {
    return initialState();
  }
}

function notify() {
  if (isDemoMode && canUseStorage()) {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    return;
  }
  listeners.forEach((listener) => listener());
}

function writeState(state: StoredState) {
  if (canUseStorage()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify();
  return state;
}

function auditTimestamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('day')} ${value('month')} ${value('year')} · ${value('hour')}:${value('minute')}`;
}

function nextGrievanceId(grievances: Grievance[]) {
  const year = new Date().getFullYear();
  const prefix = `GRV-${year}-`;
  const largest = grievances.reduce((max, grievance) => {
    if (!grievance.id.startsWith(prefix)) return max;
    const sequence = Number(grievance.id.slice(prefix.length));
    return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
  }, 0);
  return `${prefix}${String(largest + 1).padStart(5, '0')}`;
}

function cloneGrievance(grievance: Grievance) {
  return { ...grievance, audit: [...grievance.audit] };
}

function cloneCase(officialCase: OfficialCase) {
  return {
    ...officialCase,
    auditTrail: [...officialCase.auditTrail],
    decision: officialCase.decision ? { ...officialCase.decision } : undefined,
  };
}

const demoService: StateService = {
  getDemo: () => new Promise((resolve) => setTimeout(() => resolve(demoRecord), 260)),
  inspectFile: (file) => Promise.resolve({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type || 'application/octet-stream' }),
  subscribe: (listener) => {
    listeners.add(listener);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) listener();
      });
      window.addEventListener(CHANGE_EVENT, listener);
    }
    return () => listeners.delete(listener);
  },
  getGrievances: async () => readState().grievances.map(cloneGrievance),
  getGrievance: async (id) => {
    const grievance = readState().grievances.find((item) => item.id === id);
    return grievance ? cloneGrievance(grievance) : undefined;
  },
  getCitizenGrievance: async () => {
    const state = readState();
    const grievance = state.grievances.find((item) => item.id === state.citizenGrievanceId);
    return grievance ? cloneGrievance(grievance) : undefined;
  },
  createGrievance: async (input) => {
    const state = readState();
    const timestamp = auditTimestamp();
    const created: Grievance = {
      ...input, id: nextGrievanceId(state.grievances), status: 'Submitted', created: `${timestamp} IST`, resolution: '',
      audit: [`${timestamp} — Concern submitted by citizen`, `${timestamp} — Demo-generated grievance ID created and submitted`],
    };
    writeState({ ...state, grievances: [...state.grievances, created], citizenGrievanceId: created.id });
    return cloneGrievance(created);
  },
  updateGrievanceStatus: async (id, status) => {
    const state = readState();
    const existing = state.grievances.find((grievance) => grievance.id === id);
    if (!existing) throw new Error(`Grievance ${id} was not found`);
    const updated = { ...existing, status, audit: [...existing.audit, `${auditTimestamp()} — Status changed to ${status} by ${DEMO_OFFICER}`] };
    writeState({ ...state, grievances: state.grievances.map((grievance) => grievance.id === id ? updated : grievance) });
    return cloneGrievance(updated);
  },
  addGrievanceRemark: async (id, note) => {
    const state = readState();
    const existing = state.grievances.find((grievance) => grievance.id === id);
    if (!existing) throw new Error(`Grievance ${id} was not found`);
    const updated = { ...existing, resolution: note, audit: [...existing.audit, `${auditTimestamp()} — Officer note saved by ${DEMO_OFFICER}`] };
    writeState({ ...state, grievances: state.grievances.map((grievance) => grievance.id === id ? updated : grievance) });
    return cloneGrievance(updated);
  },
  getCases: async () => readState().cases.map(cloneCase),
  getCase: async (id) => {
    const officialCase = readState().cases.find((item) => item.id === id);
    if (officialCase) return cloneCase(officialCase);
    return {
      id,
      owner: 'Active Case Applicant',
      village: 'Bihar Jurisdiction',
      risk: 18,
      status: 'Officer Review',
      priority: 'Normal',
      auditTrail: [
        `${auditTimestamp()} — Document received · System`,
        `${auditTimestamp()} — Queued for human officer review · Decision support`,
      ],
    };
  },
  saveOfficerDecision: async (id, decision) => {
    const state = readState();
    let existing = state.cases.find((officialCase) => officialCase.id === id);
    const timestamp = auditTimestamp();
    if (!existing) {
      existing = {
        id,
        owner: 'Active Case Applicant',
        village: 'Bihar Jurisdiction',
        risk: 18,
        status: 'Officer Review',
        priority: 'Normal',
        auditTrail: [`${timestamp} — Case initialized in Officer Decision workspace · System`],
      };
    }
    const savedDecision: OfficerDecision = { ...decision, timestamp, officer: DEMO_OFFICER };
    const eventMap: Record<OfficerDecision['action'], string> = {
      verify: 'Record verified',
      return: 'Clarification requested',
      grievance: 'Grievance raised for field inquiry',
      reject: 'Rejected / Flagged for discrepancy',
      escalate: 'Escalated to senior officer',
    };
    const statusMap: Record<OfficerDecision['action'], string> = {
      verify: 'Verified',
      return: 'Clarification Requested',
      grievance: 'Grievance Raised',
      reject: 'Flagged / Rejected',
      escalate: 'Senior Officer Review',
    };
    const event = eventMap[decision.action] || 'Officer decision recorded';
    const updated: OfficialCase = {
      ...existing,
      status: statusMap[decision.action] || 'Officer Review',
      decision: savedDecision,
      auditTrail: [
        ...existing.auditTrail,
        `${timestamp} — ${event} · ${DEMO_OFFICER}`,
        `${timestamp} — Officer remarks: ${decision.remarks}`,
      ],
    };
    const caseExists = state.cases.some((c) => c.id === id);
    const updatedCases = caseExists
      ? state.cases.map((officialCase) => (officialCase.id === id ? updated : officialCase))
      : [updated, ...state.cases];
    writeState({ ...state, cases: updatedCases });
    return cloneCase(updated);
  },
};

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json() as T | { error?: string };
  if (!response.ok) throw new Error(typeof body === 'object' && body && 'error' in body ? body.error || `Request failed (${response.status})` : `Request failed (${response.status})`);
  return body as T;
}

const serverService: StateService = {
  getDemo: () => new Promise((resolve) => setTimeout(() => resolve(demoRecord), 260)),
  inspectFile: (file) => Promise.resolve({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type || 'application/octet-stream' }),
  subscribe: (listener) => {
    listeners.add(listener);
    if (typeof window !== 'undefined' && pollTimer === undefined) {
      pollTimer = window.setInterval(() => listeners.forEach((current) => current()), 3000);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && pollTimer !== undefined && typeof window !== 'undefined') {
        window.clearInterval(pollTimer);
        pollTimer = undefined;
      }
    };
  },
  getGrievances: () => request<Grievance[]>('/grievances'),
  getGrievance: async (id) => {
    try { return await request<Grievance>(`/grievances/${encodeURIComponent(id)}`); }
    catch (error) { if (error instanceof Error && error.message.includes('(404)')) return undefined; throw error; }
  },
  getCitizenGrievance: async () => request<Grievance | null>('/grievances/citizen-latest').then((value) => value ?? undefined),
  createGrievance: (input) => request<Grievance>('/grievances', { method: 'POST', body: JSON.stringify(input) }),
  updateGrievanceStatus: (id, status) => request<Grievance>(`/grievances/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addGrievanceRemark: (id, note) => request<Grievance>(`/grievances/${encodeURIComponent(id)}/remark`, { method: 'PATCH', body: JSON.stringify({ note }) }),
  getCases: () => request<OfficialCase[]>('/cases'),
  getCase: async (id) => {
    try { return await request<OfficialCase>(`/cases/${encodeURIComponent(id)}`); }
    catch (error) { if (error instanceof Error && error.message.includes('(404)')) return undefined; throw error; }
  },
  saveOfficerDecision: (id, decision) => request<OfficialCase>(`/cases/${encodeURIComponent(id)}/decision`, { method: 'POST', body: JSON.stringify(decision) }),
};

if (isDemoMode && typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) listeners.forEach((listener) => listener());
  });
  window.addEventListener(CHANGE_EVENT, () => listeners.forEach((listener) => listener()));
}

export const recordService: StateService = isDemoMode ? demoService : serverService;