# REST API Documentation — Land Record Validation API

## Base URL
`http://localhost:8000`

---

## Endpoints

### 1. Land Record Analyze Endpoint
`POST /api/land-record/analyze`

Upload a Bihar Jamabandi PDF or scanned document image to process OCR, extract fields, match reference ground-truth records, and return validation metrics.

#### Request Headers
- `Content-Type: multipart/form-data`

#### Request Body
- `file` (UploadFile, required): PDF document (`.pdf`) or image file (`.png`, `.jpg`, `.jpeg`, `.tiff`).

#### Sample Response (`200 OK`)
```json
{
  "document_id": "BR_PATNA_SAMPATCHAK_006",
  "file_name": "BR_PATNA_SAMPATCHAK_006.pdf",
  "ocr_text": "बिहार सरकार राजस्व एवं भूमि सुधार विभाग जमाबंदी पंजी प्रति...",
  "fields": {
    "computerized_jamabandi_number": "212140100157117",
    "jamabandi_number": null,
    "bhag_vartaman": null,
    "prishth_sankhya": null,
    "district": "Patna",
    "anchal": "Sampatchak",
    "halka": "BAIRIYA KARNPURA",
    "mauja": "Karnpura-121",
    "raiyat_name": "AABHA DEVI",
    "father_or_husband_name": null,
    "khata_number": "22",
    "khesra_plot_number": "84",
    "land_area": "0 ए 1.5759 डिसमिल",
    "mutation_status": "Mutation Cases Not Found"
  },
  "matches": {
    "computerized_jamabandi_number": {
      "score": 1.0,
      "extracted": "212140100157117",
      "reference": "212140100157117"
    },
    "raiyat_name": {
      "score": 1.0,
      "extracted": "AABHA DEVI",
      "reference": "AABHA DEVI"
    },
    "khata_number": {
      "score": 1.0,
      "extracted": "22",
      "reference": "22"
    },
    "khesra_plot_number": {
      "score": 1.0,
      "extracted": "84",
      "reference": "84"
    }
  },
  "field_confidence": {
    "computerized_jamabandi_number": 1.0,
    "raiyat_name": 0.95,
    "khata_number": 1.0,
    "khesra_plot_number": 1.0
  },
  "overall_confidence": 0.9625,
  "status": "VERIFIED",
  "warnings": []
}
```

---

### 2. Serving Web Interface
`GET /`

Returns the interactive HTML5 Land Record Verification Portal.
