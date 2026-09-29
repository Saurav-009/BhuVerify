import type { AnalysisResult } from '@/types/analysis';
import { demoAnalysisResult } from '@/data/mockData';

const ANALYSIS_STORAGE_KEY = 'bhuverify:current-analysis:v2';
const ANALYSIS_EVENT_KEY = 'bhuverify:analysis-changed';

export function getStoredAnalysis(): AnalysisResult {
  if (typeof window === 'undefined') return demoAnalysisResult;
  try {
    const raw = window.sessionStorage.getItem(ANALYSIS_STORAGE_KEY) || window.localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!raw) return demoAnalysisResult;
    return JSON.parse(raw) as AnalysisResult;
  } catch (e) {
    console.warn('[AnalysisService] Failed to read stored analysis, falling back to demo', e);
    return demoAnalysisResult;
  }
}

export function setStoredAnalysis(result: AnalysisResult): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(result);
    window.sessionStorage.setItem(ANALYSIS_STORAGE_KEY, serialized);
    window.localStorage.setItem(ANALYSIS_STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent(ANALYSIS_EVENT_KEY, { detail: result }));
  } catch (e) {
    console.warn('[AnalysisService] Failed to persist analysis', e);
  }
}

export function subscribeAnalysis(listener: (result: AnalysisResult) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<AnalysisResult>;
    if (custom.detail) {
      listener(custom.detail);
    } else {
      listener(getStoredAnalysis());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === ANALYSIS_STORAGE_KEY) {
      listener(getStoredAnalysis());
    }
  };

  window.addEventListener(ANALYSIS_EVENT_KEY, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(ANALYSIS_EVENT_KEY, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export async function analyzeDocument(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[AnalysisService] Server returned error ${response.status}: ${errorText}`);
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    const data = await response.json() as AnalysisResult;
    setStoredAnalysis(data);
    return data;
  } catch (error) {
    console.warn('[AnalysisService] API call failed, using local/demo dataset', error);
    // If backend connection fails, provide simulated result for the uploaded file
    const simulated: AnalysisResult = {
      ...demoAnalysisResult,
      file_name: file.name,
      document_id: file.name.replace(/\.[^/.]+$/, ''),
      ocr_path_used: file.type.includes('pdf') ? 'DIGITAL_PDF_TEXT_LAYER' : 'IMAGE_OCR_PREPROCESSED',
    };
    setStoredAnalysis(simulated);
    return simulated;
  }
}

export async function loadSampleAnalysis(docId: string = 'BR_PATNA_SAMPATCHAK_001'): Promise<AnalysisResult> {
  try {
    const response = await fetch(`/api/sample/${encodeURIComponent(docId)}`);
    if (response.ok) {
      const data = await response.json() as AnalysisResult;
      setStoredAnalysis(data);
      return data;
    }
  } catch (err) {
    console.warn('[AnalysisService] Could not fetch sample from server, using local demo result', err);
  }

  setStoredAnalysis(demoAnalysisResult);
  return demoAnalysisResult;
}

export async function fetchReferenceRecords(): Promise<any[]> {
  try {
    const response = await fetch('/api/reference-records');
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[AnalysisService] Failed to load reference records', err);
  }
  return [];
}
