"""
BhuVerify — Assam State Land Portal Connector
SIH 2026 — State Land Portal Verification

Portal: ILRMS Assam / Dharitree (Integrated Land Records Management System)
URL   : https://ilrms.assam.gov.in/ | https://dharitree.assam.gov.in/

Assam land record structure:
  District → Revenue Circle → Village → Patta No. → Dag No. → Owner Name
  (Jamabandi = Revenue Record of Rights)

Access controls: ILRMS requires registration/login for full owner records.
  BhuVerify NEVER bypasses this — switches to USER_ASSISTED mode.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from .base_connector import (
    LandPortalConnector,
    PortalLandRecord,
    PortalVerificationResult,
    build_inconsistency_summary,
    cross_validate,
)

# ─────────────────────────────────────────────────────────────
# Curated Assam Reference Records
# ─────────────────────────────────────────────────────────────
_ASSAM_REFERENCE_RECORDS = [
    {
        "district": "Kamrup",
        "circle": "Jalukbari",
        "village": "Jalukbari",
        "patta": "120",
        "dag": "501",
        "owner_name": "Ranjit Kumar Das",
        "land_area": "0.20 Acres",
        "tenure_type": "Periodic Patta",
        "mutation_status": "Recorded",
    },
    {
        "district": "Jorhat",
        "circle": "Jorhat",
        "village": "Senchoa",
        "patta": "88",
        "dag": "32",
        "owner_name": "Malabika Bora",
        "land_area": "0.50 Acres",
        "tenure_type": "Permanent Raiyati",
        "mutation_status": "स्वीकृत",
    },
    {
        "district": "Dibrugarh",
        "circle": "Dibrugarh",
        "village": "Bhogpur",
        "patta": "345",
        "dag": "77",
        "owner_name": "Ajit Gogoi",
        "land_area": "0.38 Acres",
        "tenure_type": "Annual Patta",
        "mutation_status": "Mutation Cases Not Found",
    },
    {
        "district": "Nagaon",
        "circle": "Nagaon",
        "village": "Kaliabor",
        "patta": "212",
        "dag": "143",
        "owner_name": "Prabhat Hazarika",
        "land_area": "0.15 Acres",
        "tenure_type": "Permanent Raiyati",
        "mutation_status": "Recorded",
    },
    {
        "district": "Sonitpur",
        "circle": "Tezpur",
        "village": "Tezpur",
        "patta": "55",
        "dag": "28",
        "owner_name": "Gita Devi Sharma",
        "land_area": "0.12 Acres",
        "tenure_type": "Allotment Patta",
        "mutation_status": "Recorded",
    },
]


def _match_assam_reference(
    district: str, circle: str, patta: str, dag: str
) -> Optional[dict]:
    for rec in _ASSAM_REFERENCE_RECORDS:
        score = 0
        if district and district.lower() in rec["district"].lower():
            score += 3
        if patta and patta.strip() == rec["patta"]:
            score += 4
        if dag and dag.strip() == rec["dag"]:
            score += 3
        if circle and circle.lower() in rec["circle"].lower():
            score += 2
        if score >= 5:
            return rec
    return None


def _build_assam_deeplink(district: str, circle: str,
                           village: str, patta: str, dag: str) -> str:
    base = "https://ilrms.assam.gov.in/citizen/citizenrequest"
    params = []
    if district:
        params.append(f"district={district.strip()}")
    if circle:
        params.append(f"circle={circle.strip()}")
    if village:
        params.append(f"village={village.strip()}")
    if patta:
        params.append(f"pattaNo={patta.strip()}")
    if dag:
        params.append(f"dagNo={dag.strip()}")
    return base + ("?" + "&".join(params) if params else "")


class AssamPortalConnector(LandPortalConnector):
    state_name = "Assam"
    portal_name = "ILRMS Assam / Dharitree (Integrated Land Records Management System)"
    portal_url = "https://ilrms.assam.gov.in/"

    def _do_verify(
        self, extracted_fields: Dict[str, Optional[str]]
    ) -> PortalVerificationResult:

        district = extracted_fields.get("district") or ""
        # Assam: anchal ≈ circle, mauja ≈ village, khata ≈ patta, plot ≈ dag
        circle  = extracted_fields.get("anchal") or extracted_fields.get("circle") or ""
        village = extracted_fields.get("mauja") or extracted_fields.get("village") or ""
        patta   = extracted_fields.get("khata_number") or ""
        dag     = extracted_fields.get("khesra_plot_number") or ""

        deeplink = _build_assam_deeplink(district, circle, village, patta, dag)

        match = _match_assam_reference(district, circle, patta, dag)

        if match:
            portal_record = PortalLandRecord(
                owner_name=match["owner_name"],
                khata_number=match["patta"],
                plot_number=match["dag"],
                land_area=match["land_area"],
                district=match["district"],
                block_circle=match["circle"],
                village_mouza=match["village"],
                mutation_status=match["mutation_status"],
                tenure_type=match["tenure_type"],
            )
            data_source = "REFERENCE_DATA"
            mode = "AUTO"
            confidence = 0.70
            instructions = None
        else:
            portal_record = None
            data_source = "MANUAL_REQUIRED"
            mode = "USER_ASSISTED"
            confidence = 0.0
            instructions = (
                "ILRMS Assam / Dharitree requires registered login access for full "
                "Jamabandi (Patta/Dag) record retrieval. BhuVerify does not bypass "
                "this authentication requirement. Please open the portal using the "
                "pre-filled link, log in with your credentials, retrieve the official "
                "Patta details, and return the owner name and land area to BhuVerify."
            )

        comparisons = (
            cross_validate(extracted_fields, portal_record) if portal_record else []
        )
        has_inconsistency = any(c.inconsistency_flag for c in comparisons)
        summary = build_inconsistency_summary(comparisons)

        return PortalVerificationResult(
            state="Assam",
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
