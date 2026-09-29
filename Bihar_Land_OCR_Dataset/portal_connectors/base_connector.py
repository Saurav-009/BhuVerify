"""
BhuVerify — State Land Portal Connector: Base Classes
SIH 2026 — API Security & Multi-State Portal Integration

Provides:
  - Data models (PortalLandRecord, PortalVerificationResult, etc.)
  - Shared logic: caching, rate limiting, cross-validation, evidence building
  - Abstract base class LandPortalConnector for all state connectors

IMPORTANT: This module NEVER bypasses CAPTCHA, OTP, or government auth.
           If a portal has access controls, switch to USER_ASSISTED mode.
"""

from __future__ import annotations

import hashlib
import time
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


# ─────────────────────────────────────────────────────────────
# Data Models
# ─────────────────────────────────────────────────────────────

@dataclass
class PortalLandRecord:
    """Normalized land record returned from (or constructed for) a state portal."""
    owner_name: Optional[str] = None
    khata_number: Optional[str] = None
    plot_number: Optional[str] = None
    land_area: Optional[str] = None
    district: Optional[str] = None
    block_circle: Optional[str] = None
    village_mouza: Optional[str] = None
    mutation_status: Optional[str] = None
    jamabandi_number: Optional[str] = None
    registration_year: Optional[str] = None
    tenure_type: Optional[str] = None      # Ryotwari, Khatian, etc.
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PortalFieldComparison:
    """One field comparison between extracted document value and portal value."""
    field_name: str
    field_label: str
    extracted: Optional[str]
    portal: Optional[str]
    match: bool                            # True if values are sufficiently close
    variance_note: Optional[str] = None    # e.g. area variance %, spelling diff
    inconsistency_flag: bool = False       # "Potential inconsistency detected"


@dataclass
class PortalVerificationResult:
    """
    Complete portal verification result returned by any state connector.

    data_source:
        REFERENCE_DATA  — matched against local curated reference dataset
        LIVE_RESULT     — fetched directly from the official portal (future)
        DEMO_DATA       — synthetic / demonstration data
        MANUAL_REQUIRED — access-restricted; user must check portal manually

    mode:
        AUTO            — automatic cross-check completed
        USER_ASSISTED   — user must open portal, retrieve data, paste it back
    """
    state: str
    data_source: str                       # REFERENCE_DATA | LIVE_RESULT | DEMO_DATA | MANUAL_REQUIRED
    mode: str                              # AUTO | USER_ASSISTED
    portal_name: str
    portal_url: str
    portal_deeplink: Optional[str]         # Pre-filled query URL for the official portal
    portal_record: Optional[PortalLandRecord]
    field_comparisons: List[PortalFieldComparison]
    has_inconsistency: bool
    inconsistency_summary: Optional[str]
    confidence: float                      # 0.0–1.0
    instructions: Optional[str]           # Steps for user in USER_ASSISTED mode
    cached_at: Optional[float] = None      # unix timestamp


# Simple in-process LRU-style cache  {cache_key: (result, timestamp)}
_PORTAL_CACHE: Dict[str, tuple] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour


def _make_cache_key(state: str, district: str, village: str,
                    khata: str, plot: str) -> str:
    raw = f"{state}:{district}:{village}:{khata}:{plot}".lower().replace(" ", "_")
    return hashlib.sha1(raw.encode()).hexdigest()


def _get_cached(cache_key: str) -> Optional[PortalVerificationResult]:
    entry = _PORTAL_CACHE.get(cache_key)
    if entry:
        result, ts = entry
        if time.time() - ts < CACHE_TTL_SECONDS:
            return result
        del _PORTAL_CACHE[cache_key]
    return None


def _set_cached(cache_key: str, result: PortalVerificationResult) -> None:
    result.cached_at = time.time()
    _PORTAL_CACHE[cache_key] = (result, result.cached_at)


# ─────────────────────────────────────────────────────────────
# Shared Helpers
# ─────────────────────────────────────────────────────────────

def _normalize_area(area_str: Optional[str]) -> Optional[float]:
    """Parse area strings like '12.5', '0.125 Acres', '12.5 डिसमिल' → decimal."""
    if not area_str:
        return None
    nums = re.findall(r"[\d.]+", str(area_str))
    if nums:
        try:
            return float(nums[0])
        except ValueError:
            pass
    return None


def _fuzzy_text_match(a: Optional[str], b: Optional[str],
                       threshold: float = 0.75) -> bool:
    """Token-set overlap match, case-insensitive."""
    if not a or not b:
        return False
    a_tokens = set(re.sub(r"[^a-z0-9]", " ", a.lower()).split())
    b_tokens = set(re.sub(r"[^a-z0-9]", " ", b.lower()).split())
    if not a_tokens or not b_tokens:
        return False
    overlap = len(a_tokens & b_tokens) / max(len(a_tokens), len(b_tokens))
    return overlap >= threshold


def cross_validate(extracted: Dict[str, Optional[str]],
                   portal: PortalLandRecord) -> List[PortalFieldComparison]:
    """
    Compare extracted document fields against portal record.
    Returns a list of PortalFieldComparison objects.
    Never calls discrepancies 'fraud' — uses 'Potential inconsistency detected'.
    """
    comparisons: List[PortalFieldComparison] = []

    field_map = [
        ("owner_name",      "Owner / Raiyat Name",    extracted.get("raiyat_name"),       portal.owner_name),
        ("khata_number",    "Khata / Account No.",    extracted.get("khata_number"),       portal.khata_number),
        ("plot_number",     "Khesra / Plot No.",      extracted.get("khesra_plot_number"), portal.plot_number),
        ("village_mouza",   "Village / Mauza",        extracted.get("mauja"),             portal.village_mouza),
        ("district",        "District",               extracted.get("district"),           portal.district),
        ("block_circle",    "Anchal / Block / Circle",extracted.get("anchal"),             portal.block_circle),
        ("mutation_status", "Mutation Status",         extracted.get("mutation_status"),    portal.mutation_status),
        ("land_area",       "Land Area",               extracted.get("land_area"),          portal.land_area),
    ]

    for f_key, f_label, ext_val, por_val in field_map:
        match = False
        variance_note = None
        inconsistency = False

        if ext_val and por_val:
            if f_key == "land_area":
                ext_num = _normalize_area(ext_val)
                por_num = _normalize_area(por_val)
                if ext_num is not None and por_num is not None and por_num > 0:
                    variance_pct = abs(ext_num - por_num) / por_num * 100
                    match = variance_pct <= 5.0
                    if not match:
                        variance_note = f"Area variance: {variance_pct:.1f}%"
                        inconsistency = True
                else:
                    match = ext_val.strip() == por_val.strip()
            else:
                match = _fuzzy_text_match(ext_val, por_val)
                if not match:
                    inconsistency = True
                    variance_note = "Values differ"

        comparisons.append(PortalFieldComparison(
            field_name=f_key,
            field_label=f_label,
            extracted=ext_val,
            portal=por_val,
            match=match,
            variance_note=variance_note if not match else None,
            inconsistency_flag=inconsistency,
        ))

    return comparisons


def build_inconsistency_summary(comparisons: List[PortalFieldComparison]) -> Optional[str]:
    bad = [c for c in comparisons if c.inconsistency_flag]
    if not bad:
        return None
    labels = ", ".join(c.field_label for c in bad)
    return (
        f"Potential inconsistency detected in {len(bad)} field(s): {labels}. "
        "Verify with official portal before certification."
    )


def portal_result_to_dict(result: PortalVerificationResult) -> Dict[str, Any]:
    """Serialize PortalVerificationResult to a JSON-safe dict."""
    def _rec(obj: Any) -> Any:
        if isinstance(obj, (str, int, float, bool, type(None))):
            return obj
        if isinstance(obj, list):
            return [_rec(i) for i in obj]
        if isinstance(obj, dict):
            return {k: _rec(v) for k, v in obj.items()}
        if hasattr(obj, "__dataclass_fields__"):
            return {k: _rec(v) for k, v in asdict(obj).items()}
        return str(obj)
    return _rec(asdict(result))


# ─────────────────────────────────────────────────────────────
# Abstract Base Connector
# ─────────────────────────────────────────────────────────────

class LandPortalConnector(ABC):
    """Abstract base — each state subclasses this."""

    state_name: str = ""
    portal_name: str = ""
    portal_url: str = ""

    def verify(
        self,
        extracted_fields: Dict[str, Optional[str]],
        use_cache: bool = True,
    ) -> PortalVerificationResult:
        district = extracted_fields.get("district") or ""
        village  = extracted_fields.get("mauja") or extracted_fields.get("village") or ""
        khata    = extracted_fields.get("khata_number") or ""
        plot     = extracted_fields.get("khesra_plot_number") or ""

        if use_cache:
            key = _make_cache_key(self.state_name, district, village, khata, plot)
            cached = _get_cached(key)
            if cached:
                return cached

        result = self._do_verify(extracted_fields)

        if use_cache:
            key = _make_cache_key(self.state_name, district, village, khata, plot)
            _set_cached(key, result)

        return result

    @abstractmethod
    def _do_verify(
        self, extracted_fields: Dict[str, Optional[str]]
    ) -> PortalVerificationResult:
        """Implement state-specific portal verification logic."""
        ...
