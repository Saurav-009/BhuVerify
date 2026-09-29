export interface EvidenceItem {
  page: number;
  text: string;
  bbox?: [number, number, number, number];
}

export interface ExtractedField {
  original: string | null;
  normalized: string | null;
  confidence: number;
  evidence: EvidenceItem[];
}

export interface FieldMatch {
  score: number;
  extracted: string | null;
  reference: string | null;
  status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
}

export interface RiskFactor {
  code: string;
  category: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  penalty: number;
  description: string;
}

export interface RiskAnalysis {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  status_text: string;
  color: string;
  factors_count: number;
  factors: RiskFactor[];
}

export interface GisParcel {
  plot_number: string;
  khata_number: string;
  mauza: string;
  anchal: string;
  district: string;
  state: string;
  center: [number, number];
  boundary_polygon: [number, number][];
  area_acres: string;
  is_simulated_cadastral: boolean;
}

// ─────────────────────────────────────────────────────────────
// State Land Portal Verification Types
// ─────────────────────────────────────────────────────────────

export type PortalDataSource =
  | 'REFERENCE_DATA'
  | 'LIVE_RESULT'
  | 'DEMO_DATA'
  | 'MANUAL_REQUIRED';

export type PortalMode = 'AUTO' | 'USER_ASSISTED';

export interface PortalLandRecord {
  owner_name: string | null;
  khata_number: string | null;
  plot_number: string | null;
  land_area: string | null;
  district: string | null;
  block_circle: string | null;
  village_mouza: string | null;
  mutation_status: string | null;
  jamabandi_number: string | null;
  registration_year: string | null;
  tenure_type: string | null;
  extra: Record<string, any>;
}

export interface PortalFieldComparison {
  field_name: string;
  field_label: string;
  extracted: string | null;
  portal: string | null;
  match: boolean;
  variance_note: string | null;
  inconsistency_flag: boolean;
}

export interface PortalVerification {
  state: string;
  data_source: PortalDataSource;
  mode: PortalMode;
  portal_name: string;
  portal_url: string;
  portal_deeplink: string | null;
  portal_record: PortalLandRecord | null;
  field_comparisons: PortalFieldComparison[];
  has_inconsistency: boolean;
  inconsistency_summary: string | null;
  confidence: number;
  instructions: string | null;
  cached_at: number | null;
}

// ─────────────────────────────────────────────────────────────

export interface AnalysisResult {
  document_id: string;
  file_name: string;
  ocr_path_used: 'DIGITAL_PDF_TEXT_LAYER' | 'SCANNED_OCR_PREPROCESSED' | 'IMAGE_OCR_PREPROCESSED' | 'UNKNOWN';
  page_count: number;
  overall_confidence: number;
  status: 'VERIFIED' | 'REVIEW_REQUIRED' | 'DISCREPANCY_FLAGGED';
  fields: {
    raiyat_name?: ExtractedField;
    father_or_husband_name?: ExtractedField;
    computerized_jamabandi_number?: ExtractedField;
    jamabandi_number?: ExtractedField;
    bhag_vartaman?: ExtractedField;
    prishth_sankhya?: ExtractedField;
    district?: ExtractedField;
    anchal?: ExtractedField;
    halka?: ExtractedField;
    mauza?: ExtractedField;
    khata_number?: ExtractedField;
    khesra_plot_number?: ExtractedField;
    land_area?: ExtractedField;
    mutation_status?: ExtractedField;
    [key: string]: ExtractedField | undefined;
  };
  matches: {
    [key: string]: FieldMatch;
  };
  matched_reference_record?: Record<string, any>;
  risk_analysis: RiskAnalysis;
  gis_parcel: GisParcel;
  preview_urls?: string[];
  ocr_text_length?: number;
  ocr_text_sample?: string;
  detected_state?: string | null;
  portal_verification?: PortalVerification | null;
}

