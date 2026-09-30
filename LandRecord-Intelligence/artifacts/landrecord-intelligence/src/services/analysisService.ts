import type { AnalysisResult, DocumentClassification } from '@/types/analysis';
import { demoAnalysisResult } from '@/data/mockData';

const ANALYSIS_STORAGE_KEY = 'bhuverify:current-analysis:v3';
const ANALYSIS_EVENT_KEY = 'bhuverify:analysis-changed';

// ─────────────────────────────────────────────────────────────
// EMPTY_ANALYSIS: sentinel for "no document has been processed"
// document_id === '' means pages should show "No document processed"
// ─────────────────────────────────────────────────────────────
export const EMPTY_ANALYSIS: AnalysisResult = {
  document_id: '',
  file_name: '',
  ocr_path_used: 'UNKNOWN',
  page_count: 0,
  overall_confidence: 0,
  status: 'REVIEW_REQUIRED',
  fields: {},
  matches: {},
  matched_reference_record: undefined,
  risk_analysis: {
    risk_score: 0,
    risk_level: 'LOW',
    status_text: 'No document processed',
    color: 'slate',
    factors_count: 0,
    factors: [],
  },
  gis_parcel: {
    plot_number: '',
    khata_number: '',
    mauza: '',
    anchal: '',
    district: '',
    state: '',
    center: [25.5642, 85.1824],
    boundary_polygon: [],
    area_acres: '',
    is_simulated_cadastral: true,
  },
};

export function hasStoredAnalysis(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw =
      window.sessionStorage.getItem(ANALYSIS_STORAGE_KEY) ||
      window.localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as AnalysisResult;
    return Boolean(parsed?.document_id);
  } catch {
    return false;
  }
}

export function getStoredAnalysis(): AnalysisResult {
  if (typeof window === 'undefined') return EMPTY_ANALYSIS;
  try {
    const raw =
      window.sessionStorage.getItem(ANALYSIS_STORAGE_KEY) ||
      window.localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!raw) return EMPTY_ANALYSIS;
    const parsed = JSON.parse(raw) as AnalysisResult;
    if (!parsed || !parsed.document_id) return EMPTY_ANALYSIS;
    return parsed;
  } catch (e) {
    console.warn('[AnalysisService] Failed to read stored analysis, returning empty', e);
    return EMPTY_ANALYSIS;
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

export function clearStoredAnalysis(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ANALYSIS_STORAGE_KEY);
    window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(ANALYSIS_EVENT_KEY, { detail: EMPTY_ANALYSIS }));
  } catch {
    // ignore
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

// ─────────────────────────────────────────────────────────────
// CLIENT-SIDE DOCUMENT CONTENT CLASSIFICATION
// Inspects actual binary content (PDF text markers or image
// dimensions/aspect ratio) rather than filename keyword hacks.
// False-positive land-record classification is worse than UNCERTAIN.
// ─────────────────────────────────────────────────────────────
async function classifyDocumentClientSide(file: File): Promise<{
  classification: DocumentClassification;
  confidence: number;
  reason: string;
}> {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. If PDF, inspect raw bytes for embedded text markers
  if (mime === 'application/pdf' || ext === 'pdf') {
    try {
      const slice = file.slice(0, 262144); // Read first 256 KB
      const buf = await slice.arrayBuffer();
      const latin1 = new TextDecoder('latin1').decode(buf);
      const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
      const combined = (latin1 + ' ' + utf8).toLowerCase();

      const landMarkers = [
        'jamabandi', 'raiyat', 'khata', 'khesra', 'mauza', 'mauja', 'anchal',
        'halka', 'bihar', 'revenue', 'patna', 'sampatchak', '2115001',
        'जमाबंदी', 'रैयत', 'खाता', 'खेसरा', 'मौजा', 'अंचल'
      ];
      const hits = landMarkers.filter((m) => combined.includes(m));
      if (hits.length >= 2) {
        return {
          classification: 'UNCERTAIN',
          confidence: 0.65,
          reason: `Document contains revenue markers (${hits.slice(0, 3).join(', ')}), but the backend OCR engine is offline so full field verification could not be completed. Marked for officer review.`,
        };
      }
      return {
        classification: 'UNCERTAIN',
        confidence: 0.50,
        reason: 'Document type could not be verified — PDF content requires backend OCR/HTR extraction which is currently offline. Marked for human review.',
      };
    } catch {
      return {
        classification: 'UNCERTAIN',
        confidence: 0.50,
        reason: 'Document type could not be verified without the backend OCR engine.',
      };
    }
  }

  // 2. If image, inspect actual pixel dimensions & aspect ratio + MIME
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff'].includes(ext)) {
    const dims = await new Promise<{ width: number; height: number } | null>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });

    if (dims) {
      const ratio = dims.width / Math.max(1, dims.height);
      const isWidescreenScreen =
        (dims.width >= 1000 && ratio > 1.45) ||
        (dims.width === 1920 && dims.height === 1080) ||
        (dims.width === 1366 && dims.height === 768) ||
        (dims.width === 2560 && dims.height === 1440) ||
        (dims.width < 450 && dims.height < 450);

      if (isWidescreenScreen || ['image/png', 'image/webp', 'image/bmp', 'image/gif'].includes(mime)) {
        return {
          classification: 'NON_LAND_DOCUMENT',
          confidence: 0.86,
          reason: `Image characteristics (${dims.width}×${dims.height}px, ${mime || ext}) match a screen capture or non-document graphic rather than a scanned A4/legal land registry record.`,
        };
      }
    }

    if (['image/png', 'image/webp', 'image/bmp', 'image/gif'].includes(mime)) {
      return {
        classification: 'NON_LAND_DOCUMENT',
        confidence: 0.80,
        reason: 'The uploaded image format and colour profile do not match a scanned Jamabandi / Bhu-Abhilekh land record document.',
      };
    }

    return {
      classification: 'UNCERTAIN',
      confidence: 0.50,
      reason: 'Document type could not be verified — scanned image requires backend OCR/HTR analysis. Marked for manual review.',
    };
  }

  return {
    classification: 'NON_LAND_DOCUMENT',
    confidence: 0.85,
    reason: 'The uploaded file does not appear to contain a compatible land-record document.',
  };
}

// ─────────────────────────────────────────────────────────────
// Build an empty-field skeleton for an unrecognised upload.
// Nothing is fabricated — all field values are null.
// Pages must display "Not detected" for null fields.
// ─────────────────────────────────────────────────────────────
async function buildEmptySkeletonForFile(file: File): Promise<AnalysisResult> {
  // Generate a clean case ID from a hash of file size + lastModified so the raw filename isn't used as Case ID
  const hashNum = Math.abs((file.size * 31 + (file.lastModified % 100000)) % 90000) + 10000;
  const docId = `CASE-UPL-${hashNum}`;
  const emptyField = () => ({ original: null, normalized: null, confidence: 0, evidence: [] });
  const { classification, confidence: classConf, reason: classReason } = await classifyDocumentClientSide(file);

  return {
    document_id: docId,
    file_name: file.name,
    ocr_path_used: file.type.includes('pdf') ? 'DIGITAL_PDF_TEXT_LAYER' : 'IMAGE_OCR_PREPROCESSED',
    page_count: 1,
    overall_confidence: 0,
    status: 'REVIEW_REQUIRED',
    document_classification: classification,
    document_classification_confidence: classConf,
    document_classification_reason: classReason,
    fields: {
      raiyat_name: emptyField(),
      father_or_husband_name: emptyField(),
      computerized_jamabandi_number: emptyField(),
      jamabandi_number: emptyField(),
      bhag_vartaman: emptyField(),
      prishth_sankhya: emptyField(),
      district: emptyField(),
      anchal: emptyField(),
      halka: emptyField(),
      mauja: emptyField(),
      khata_number: emptyField(),
      khesra_plot_number: emptyField(),
      land_area: emptyField(),
      mutation_status: emptyField(),
    },
    matches: {},
    matched_reference_record: undefined,
    risk_analysis: {
      risk_score: 0,
      risk_level: 'LOW',
      status_text: classification === 'NON_LAND_DOCUMENT'
        ? 'Document not recognized as a land record'
        : 'Document type could not be verified — manual review required',
      color: 'slate',
      factors_count: classification === 'NON_LAND_DOCUMENT' ? 0 : 1,
      factors: classification === 'NON_LAND_DOCUMENT' ? [] : [
        {
          code: 'UNCERTAIN_DOCUMENT_TYPE',
          category: 'Verification Gate',
          title: 'Document Type Could Not Be Verified Automatically',
          severity: 'MEDIUM',
          penalty: 10,
          description:
            'Automated OCR/HTR verification could not confirm all Bihar Jamabandi registry markers. This case is marked for human officer review.',
        },
      ],
    },
    gis_parcel: {
      plot_number: '',
      khata_number: '',
      mauza: '',
      anchal: '',
      district: '',
      state: '',
      center: [25.5642, 85.1824],
      boundary_polygon: [],
      area_acres: '',
      is_simulated_cadastral: true,
    },
    ocr_text_length: 0,
    ocr_text_sample: '',
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
    // Ensure document_id is a clean Case ID rather than a raw uploaded filename
    if (data.document_id && !data.document_id.startsWith('BR_') && !data.document_id.startsWith('LR-') && !data.document_id.startsWith('CASE-')) {
      const hashNum = Math.abs((file.size * 31 + (file.lastModified % 100000)) % 90000) + 10000;
      data.document_id = `CASE-UPL-${hashNum}`;
    }
    setStoredAnalysis(data);
    return data;
  } catch (error) {
    console.warn('[AnalysisService] API call failed, creating empty skeleton for uploaded file', error);
    // CRITICAL: Do NOT fall back to demoAnalysisResult.
    // Create an empty "Not detected" skeleton for the actual uploaded file.
    const skeleton = await buildEmptySkeletonForFile(file);
    setStoredAnalysis(skeleton);
    return skeleton;
  }
}

export async function loadSampleAnalysis(docId: string = 'BR_PATNA_SAMPATCHAK_001'): Promise<AnalysisResult> {
  // If the standard Bihar demo case is requested, use the rich prepared demoAnalysisResult
  if (docId === 'BR_PATNA_SAMPATCHAK_001') {
    setStoredAnalysis(demoAnalysisResult);
    return demoAnalysisResult;
  }

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

  // Explicit demo load — intentional, labelled clearly to user
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
