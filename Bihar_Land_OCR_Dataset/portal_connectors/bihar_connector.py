"""
BhuVerify — Bihar State Land Portal Connector
SIH 2026 — State Land Portal Verification

Portal: Bihar Bhumi / Bihar Apna Khata
URL   : https://land.bihar.gov.in/ | http://biharbhumi.bihar.gov.in/

Strategy:
  Phase 1 (current): REFERENCE_DATA — cross-checks against the bundled
                      bihar_records_clean.csv ground-truth dataset.
  Phase 2 (future):  LIVE_RESULT — official API if/when Bihar Bhumi opens
                      a public REST gateway.
  Fallback:          USER_ASSISTED — pre-filled portal deeplink so the
                      officer can verify manually.

Bihar land record fields:
  District → Anchal (Revenue Circle) → Halka → Mauza (Revenue Village)
  → Khata No. → Khesra/Plot No. → Raiyat Name
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

from .base_connector import (
    LandPortalConnector,
    PortalFieldComparison,
    PortalLandRecord,
    PortalVerificationResult,
    build_inconsistency_summary,
    cross_validate,
)

# ─────────────────────────────────────────────────────────────
# Reference dataset
# ─────────────────────────────────────────────────────────────
_REF_CSV = (
    Path(__file__).parent.parent / "data" / "reference" / "bihar_records_clean.csv"
)

_BIHAR_REF_DF: Optional[pd.DataFrame] = None


def _load_ref_df() -> Optional[pd.DataFrame]:
    global _BIHAR_REF_DF
    if _BIHAR_REF_DF is None and _REF_CSV.exists():
        try:
            df = pd.read_csv(_REF_CSV, dtype=str)
            df = df.astype(object).where(pd.notnull(df), None)
            _BIHAR_REF_DF = df
        except Exception as e:
            print(f"[BiharConnector] Could not load reference CSV: {e}")
    return _BIHAR_REF_DF


# ─────────────────────────────────────────────────────────────
# Deeplink builder  (Bihar Apna Khata / Bihar Bhumi)
# ─────────────────────────────────────────────────────────────
_DISTRICT_CODES: Dict[str, str] = {
    "patna": "01",
    "gaya": "02",
    "bhagalpur": "03",
    "muzaffarpur": "04",
    "nalanda": "05",
    "saran": "06",
    "siwan": "07",
    "vaishali": "08",
    "aurangabad": "09",
    "begusarai": "10",
}


def _build_deeplink(district: Optional[str], anchal: Optional[str],
                    khata: Optional[str], plot: Optional[str]) -> str:
    base = "https://land.bihar.gov.in/Bhumi/Bhumi.aspx"
    params = []
    if district:
        code = _DISTRICT_CODES.get(district.lower().strip())
        if code:
            params.append(f"distcode={code}")
    if anchal:
        params.append(f"anchal={anchal.strip()}")
    if khata:
        params.append(f"khata={khata.strip()}")
    if plot:
        params.append(f"plot={plot.strip()}")
    return base + ("?" + "&".join(params) if params else "")


# ─────────────────────────────────────────────────────────────
# Connector
# ─────────────────────────────────────────────────────────────

class BiharPortalConnector(LandPortalConnector):
    state_name = "Bihar"
    portal_name = "Bihar Bhumi — Apna Khata (Bihar Land Revenue Records)"
    portal_url = "https://land.bihar.gov.in/"

    def _do_verify(
        self, extracted_fields: Dict[str, Optional[str]]
    ) -> PortalVerificationResult:

        district = extracted_fields.get("district") or ""
        anchal   = extracted_fields.get("anchal") or ""
        mauja    = extracted_fields.get("mauja") or ""
        khata    = extracted_fields.get("khata_number") or ""
        plot     = extracted_fields.get("khesra_plot_number") or ""
        raiyat   = extracted_fields.get("raiyat_name") or ""
        comp_jam = extracted_fields.get("computerized_jamabandi_number") or ""

        deeplink = _build_deeplink(district or None, anchal or None,
                                   khata or None, plot or None)

        ref_df = _load_ref_df()
        portal_record: Optional[PortalLandRecord] = None
        data_source = "REFERENCE_DATA"

        if ref_df is not None and not ref_df.empty:
            # Match strategy: computerized Jamabandi ID first (most precise)
            match_row = None
            if comp_jam and len(comp_jam) >= 12:
                m = ref_df[ref_df["computerized_jamabandi_number"].astype(str) == str(comp_jam)]
                if not m.empty:
                    match_row = m.iloc[0]

            # Fallback: Khata + district fuzzy match
            if match_row is None and khata:
                m = ref_df[ref_df["khata_number"].astype(str) == str(khata)]
                if district:
                    m = m[m["district"].str.lower().str.contains(district.lower(), na=False)]
                if not m.empty:
                    match_row = m.iloc[0]

            # Fallback: Raiyat name
            if match_row is None and raiyat and len(raiyat) > 3:
                m = ref_df[
                    ref_df["raiyat_name"].astype(str).str.contains(
                        re.escape(raiyat[:10]), case=False, na=False
                    )
                ]
                if not m.empty:
                    match_row = m.iloc[0]

            if match_row is not None:
                portal_record = PortalLandRecord(
                    owner_name=match_row.get("raiyat_name"),
                    khata_number=match_row.get("khata_number"),
                    plot_number=match_row.get("khesra_plot_number"),
                    land_area=match_row.get("land_area"),
                    district=match_row.get("district"),
                    block_circle=match_row.get("anchal"),
                    village_mouza=match_row.get("mauja"),
                    mutation_status=match_row.get("mutation_status"),
                    jamabandi_number=match_row.get("jamabandi_number"),
                )

        mode = "AUTO"
        instructions = None
        confidence = 0.75

        if portal_record is None:
            # No reference match — switch to USER_ASSISTED
            data_source = "MANUAL_REQUIRED"
            mode = "USER_ASSISTED"
            confidence = 0.0
            instructions = (
                "No matching record found in the local Bihar reference dataset. "
                "Please open the Bihar Bhumi portal using the pre-filled link below, "
                "search for the record, and paste the official land area and owner name "
                "back into the BhuVerify form to complete verification."
            )
        else:
            confidence = 0.80

        # Cross-validate extracted vs portal
        comparisons = (
            cross_validate(extracted_fields, portal_record)
            if portal_record
            else []
        )
        has_inconsistency = any(c.inconsistency_flag for c in comparisons)
        summary = build_inconsistency_summary(comparisons)

        return PortalVerificationResult(
            state="Bihar",
            data_source=data_source,
            mode=mode,
            portal_name=self.portal_name,
            portal_url=self.portal_url,
            portal_deeplink=deeplink,
            portal_record=portal_record,
            field_comparisons=comparisons,
            has_inconsistency=has_inconsistency,
            inconsistency_summary=summary,
            confidence=confidence,
            instructions=instructions,
        )
