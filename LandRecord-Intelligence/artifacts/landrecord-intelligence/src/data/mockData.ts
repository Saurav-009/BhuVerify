export type LandRecord = {
  id: string; ownerName: string; fatherName: string; surveyNumber: string; khataNumber: string;
  area: string; areaUnit: string; village: string; district: string; state: string;
  registrationNumber: string; registrationDate: string; riskScore: number; riskLevel: string;
  status: string; lastVerified: string;
};
export type ValidationField = { field: string; extracted: string; database: string; status: 'match' | 'mismatch' | 'review'; note: string };
export type FraudIndicator = { kind: string; title: string; evidence: string; severity: string; confidence: number };
export type Parcel = { surveyNumber: string; area: string; boundaryStatus: string; overlap: string; coordinates: string };
export type OfficerDecision = { action: string; remarks: string; timestamp: string; officer: string; auditTrail: string[] };

export const demoRecord: LandRecord = {
  id: 'LR-2026-01482', ownerName: 'Ramesh Kumar', fatherName: 'Mahesh Kumar', surveyNumber: '142/3A',
  khataNumber: '391', area: '2.40', areaUnit: 'acre', village: 'Rampur', district: 'Darbhanga',
  state: 'Bihar', registrationNumber: 'REG-2024-018392', registrationDate: '18 Nov 2024',
  riskScore: 78, riskLevel: 'High', status: 'Officer Review', lastVerified: '06 Feb 2026, 14:32 IST',
};
export const validationFields: ValidationField[] = [
  { field: 'Owner name', extracted: 'Ramesh Kumar', database: 'Ramesh Kumar', status: 'match', note: 'Exact text match' },
  { field: 'Father / guardian', extracted: 'Mahesh Kumar', database: 'Mahesh Kumar', status: 'match', note: 'Exact text match' },
  { field: 'Survey number', extracted: '142/3A', database: '142/3A', status: 'match', note: 'Normalized slash format' },
  { field: 'Area', extracted: '2.40 acre', database: '2.84 acre', status: 'mismatch', note: 'Difference of 0.44 acre' },
  { field: 'Registration number', extracted: 'REG-2024-018392', database: 'REG-2024-018392', status: 'match', note: 'State format valid' },
  { field: 'Village', extracted: 'Rampur', database: 'Rampur', status: 'match', note: 'Village code BR-DAR-104' },
];
export const indicators: FraudIndicator[] = [
  { kind: 'Conflict', title: 'Ownership conflict', evidence: 'Suresh Kumar appears as claimant on a related registry for survey 142/3A.', severity: 'Critical', confidence: 86 },
  { kind: 'Similarity', title: 'Duplicate-like registry', evidence: '92% text similarity to LR-2025-00931, filed 11 months earlier.', severity: 'High', confidence: 92 },
  { kind: 'Document', title: 'Possible alteration', evidence: 'Ink density and baseline shift detected near registration date field.', severity: 'Medium', confidence: 68 },
];
export const parcel: Parcel = { surveyNumber: '142/3A', area: '2.84 acre', boundaryStatus: 'Potential overlap', overlap: '0.18 acre with 142/3B', coordinates: '25.9841° N, 85.9193° E' };
export const history = [
  demoRecord,
  { ...demoRecord, id: 'LR-2026-01476', ownerName: 'Sunita Devi', surveyNumber: '88/2', khataNumber: '208', area: '1.16', riskScore: 19, riskLevel: 'Low', status: 'Verified', village: 'Keshopur', registrationNumber: 'REG-2025-071104' },
  { ...demoRecord, id: 'LR-2026-01391', ownerName: 'Amit Kumar', surveyNumber: '217/B', khataNumber: '415', area: '4.05', riskScore: 54, riskLevel: 'Medium', status: 'Officer Review', village: 'Rampur', registrationNumber: 'REG-2025-064820' },
  { ...demoRecord, id: 'LR-2026-01288', ownerName: 'Farida Khatoon', surveyNumber: '19/1', khataNumber: '94', area: '0.74', riskScore: 8, riskLevel: 'Low', status: 'Verified', village: 'Bahadurpur', registrationNumber: 'REG-2025-042116' },
];
export const stages = ['Document received', 'Text and field extraction', 'Registry comparison', 'Parcel boundary check', 'Risk calculation', 'Officer review'];

export const demoAnalysisResult = {
  document_id: 'BR_PATNA_SAMPATCHAK_001',
  file_name: 'BR_PATNA_SAMPATCHAK_001.pdf',
  ocr_path_used: 'DIGITAL_PDF_TEXT_LAYER' as const,
  page_count: 1,
  overall_confidence: 0.94,
  status: 'VERIFIED' as const,
  document_classification: 'LAND_RECORD' as const,
  document_classification_confidence: 0.99,
  document_classification_reason: 'Verified Bihar Jamabandi Panji-II digital registry record with 14 grounded attributes.',
  fields: {
    raiyat_name: {
      original: 'श्रीमती कान्ती देवी',
      normalized: 'Smt. Kanti Devi',
      confidence: 0.96,
      evidence: [
        {
          page: 1,
          text: 'रैयत का नाम : श्रीमती कान्ती देवी , पति - स्व० राम चन्द्र राय',
          bbox: [180, 120, 210, 480] as [number, number, number, number]
        }
      ]
    },
    father_or_husband_name: {
      original: 'स्व० राम चन्द्र राय',
      normalized: 'Late Ram Chandra Rai',
      confidence: 0.94,
      evidence: [
        {
          page: 1,
          text: 'पति - स्व० राम चन्द्र राय',
          bbox: [180, 490, 210, 720] as [number, number, number, number]
        }
      ]
    },
    computerized_jamabandi_number: {
      original: '211500100010001',
      normalized: '211500100010001',
      confidence: 0.99,
      evidence: [
        {
          page: 1,
          text: 'कम्प्यूटरीकृत जमाबंदी संख्या : 211500100010001',
          bbox: [120, 120, 150, 480] as [number, number, number, number]
        }
      ]
    },
    jamabandi_number: {
      original: '1',
      normalized: '1',
      confidence: 0.95,
      evidence: [
        {
          page: 1,
          text: 'जमाबंदी संख्या : 1',
          bbox: [120, 520, 150, 700] as [number, number, number, number]
        }
      ]
    },
    bhag_vartaman: {
      original: '1',
      normalized: '1',
      confidence: 0.98,
      evidence: [
        {
          page: 1,
          text: 'भाग वर्तमान : 1',
          bbox: [90, 120, 115, 300] as [number, number, number, number]
        }
      ]
    },
    prishth_sankhya: {
      original: '1',
      normalized: '1',
      confidence: 0.98,
      evidence: [
        {
          page: 1,
          text: 'पृष्ठ संख्या : 1',
          bbox: [90, 320, 115, 500] as [number, number, number, number]
        }
      ]
    },
    district: {
      original: 'पटना',
      normalized: 'Patna',
      confidence: 0.99,
      evidence: [
        {
          page: 1,
          text: 'जिला का नाम : पटना',
          bbox: [60, 120, 85, 350] as [number, number, number, number]
        }
      ]
    },
    anchal: {
      original: 'सम्पतचक',
      normalized: 'Sampatchak',
      confidence: 0.99,
      evidence: [
        {
          page: 1,
          text: 'अंचल का नाम : सम्पतचक',
          bbox: [60, 360, 85, 600] as [number, number, number, number]
        }
      ]
    },
    halka: {
      original: 'बैरियर करनपुरा',
      normalized: 'BAIRIYA KARNPURA',
      confidence: 0.95,
      evidence: [
        {
          page: 1,
          text: 'हलका का नाम : बैरियर करनपुरा',
          bbox: [60, 610, 85, 850] as [number, number, number, number]
        }
      ]
    },
    mauja: {
      original: 'करनपुरा-121',
      normalized: 'Karnpura-121',
      confidence: 0.97,
      evidence: [
        {
          page: 1,
          text: 'मौजा का नाम : करनपुरा-121',
          bbox: [60, 860, 85, 1050] as [number, number, number, number]
        }
      ]
    },
    khata_number: {
      original: '14',
      normalized: '14',
      confidence: 0.96,
      evidence: [
        {
          page: 1,
          text: 'खाता संख्या : 14',
          bbox: [240, 120, 270, 300] as [number, number, number, number]
        }
      ]
    },
    khesra_plot_number: {
      original: '108',
      normalized: '108',
      confidence: 0.96,
      evidence: [
        {
          page: 1,
          text: 'खेसरा संख्या : 108',
          bbox: [240, 320, 270, 500] as [number, number, number, number]
        }
      ]
    },
    land_area: {
      original: '0 एकड़ 12.5 डिसमिल',
      normalized: '0.125 Acre (12.5 Dismil)',
      confidence: 0.93,
      evidence: [
        {
          page: 1,
          text: 'रकबा : 0 एकड़ 12.5 डिसमिल',
          bbox: [240, 520, 270, 780] as [number, number, number, number]
        }
      ]
    },
    mutation_status: {
      original: 'Mutation Cases Not Found',
      normalized: 'No Dispute / Regular',
      confidence: 0.90,
      evidence: [
        {
          page: 1,
          text: 'दाखिल खारिज स्थिति : Mutation Cases Not Found',
          bbox: [320, 120, 350, 600] as [number, number, number, number]
        }
      ]
    }
  },
  matches: {
    computerized_jamabandi_number: {
      score: 1.0,
      extracted: '211500100010001',
      reference: '211500100010001',
      status: 'MATCH' as const
    },
    jamabandi_number: {
      score: 1.0,
      extracted: '1',
      reference: '1',
      status: 'MATCH' as const
    },
    khata_number: {
      score: 1.0,
      extracted: '14',
      reference: '14',
      status: 'MATCH' as const
    },
    khesra_plot_number: {
      score: 1.0,
      extracted: '108',
      reference: '108',
      status: 'MATCH' as const
    },
    raiyat_name: {
      score: 0.95,
      extracted: 'श्रीमती कान्ती देवी',
      reference: 'श्रीमती कान्ती देवी',
      status: 'MATCH' as const
    },
    mauja: {
      score: 1.0,
      extracted: 'Karnpura-121',
      reference: 'Karnpura-121',
      status: 'MATCH' as const
    }
  },
  matched_reference_record: {
    document_id: 'BR_PATNA_SAMPATCHAK_001',
    state: 'Bihar',
    district: 'Patna',
    anchal: 'Sampatchak',
    halka: 'BAIRIYA KARNPURA',
    mauja: 'Karnpura-121',
    jamabandi_number: 1,
    computerized_jamabandi_number: '211500100010001',
    khata_number: 14,
    khesra_plot_number: 108,
    raiyat_name: 'श्रीमती कान्ती देवी',
    father_or_husband_name: 'स्व० राम चन्द्र राय',
    land_area: '0.125 Acre',
    document_type: 'Jamabandi Panji II',
    verified: true
  },
  risk_analysis: {
    risk_score: 18,
    risk_level: 'LOW' as const,
    status_text: 'Verified — Clean Record',
    color: 'emerald',
    factors_count: 1,
    factors: [
      {
        code: 'MUTATION_PENDING',
        category: 'Legal & Encumbrance',
        title: 'Mutation Record Not Synchronized',
        severity: 'MEDIUM' as const,
        penalty: 15,
        description: 'Standard informational notice: No new Dakhil-Kharij (mutation) case pending on record for this Jamabandi entry.'
      }
    ]
  },
  gis_parcel: {
    plot_number: '108',
    khata_number: '14',
    mauza: 'Karnpura-121',
    anchal: 'Sampatchak',
    district: 'Patna',
    state: 'Bihar',
    center: [25.5642, 85.1824] as [number, number],
    boundary_polygon: [
      [25.5642, 85.1824],
      [25.5650, 85.1824],
      [25.5650, 85.1835],
      [25.5642, 85.1835]
    ] as [number, number][],
    area_acres: '0.125 Acres',
    is_simulated_cadastral: true
  },
  ocr_text_length: 1298,
  ocr_text_sample: 'बिहार सरकार \nराजस्व एवं भूमि सुधार विभाग \nजमाबंदी पंजी प्रति (डिजिटल हस्ताक्षरित प्रति) \nजिला: पटना, अंचल: सम्पतचक...'
};