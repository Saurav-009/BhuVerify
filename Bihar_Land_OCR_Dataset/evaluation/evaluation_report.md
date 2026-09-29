# Land Record Digitization & Verification System — Evaluation Report

## Evaluation Metrics Summary

- **Total Documents Evaluated**: 10
- **Total Fields Evaluated**: 28
- **Exact Match Accuracy**: 35.71%
- **Fuzzy Match Accuracy (>= 80% similarity)**: 46.43%
- **Precision**: 0.00%
- **Recall**: 100.00%
- **F1 Score**: 0.00%

---

## Verification Status Summary
```json
{
  "MISMATCH": 10
}
```

---

## Error Analysis & Field Discrepancies
Below is the empirical error report listing discrepancies between extracted OCR values and reference records:

| Document ID | Field Name | Extracted OCR Value | Reference GT Value | Score | Error Type |
|---|---|---|---|---|---|
| `BR_PATNA_SAMPATCHAK_006` | `computerized_jamabandi_number` | `212140100157117` | `212140100157117.0` | 0.85 | Partial/Fuzzy Match |
| `BR_PATNA_SAMPATCHAK_006` | `raiyat_name` | `` | `"AABHA DEVI"` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_007` | `computerized_jamabandi_number` | `212140100126423` | `212140100153737.0` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_007` | `khata_number` | `0` | `["46"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_007` | `khesra_plot_number` | `0` | `["189"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_007` | `raiyat_name` | `AGAMKUAN` | `["Abhay Kumar"]` | 0.4348 | Partial/Fuzzy Match |
| `BR_PATNA_SAMPATCHAK_008` | `computerized_jamabandi_number` | `212140100153737` | `212140100126423.0` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_008` | `khata_number` | `0` | `["40"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_008` | `khesra_plot_number` | `0` | `["91"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_008` | `raiyat_name` | `` | `["Raj Kumar Prasad"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_009` | `computerized_jamabandi_number` | `212140100153737` | `212140100153737.0` | 0.85 | Partial/Fuzzy Match |
| `BR_PATNA_SAMPATCHAK_009` | `khata_number` | `0` | `["46"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_009` | `khesra_plot_number` | `0` | `["189"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_009` | `raiyat_name` | `` | `["Abhay Kumar"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_010` | `computerized_jamabandi_number` | `212140100126229` | `212140100126229.0` | 0.85 | Partial/Fuzzy Match |
| `BR_PATNA_SAMPATCHAK_010` | `khata_number` | `0` | `["46"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_010` | `khesra_plot_number` | `0` | `["594"]` | 0.0 | Exact Mismatch |
| `BR_PATNA_SAMPATCHAK_010` | `raiyat_name` | `Ben` | `["Abhilasha Ranjan"]` | 0.1739 | Partial/Fuzzy Match |
