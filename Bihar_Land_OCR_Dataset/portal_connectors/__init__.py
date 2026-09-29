"""
BhuVerify — Portal Connectors Package
SIH 2026

Factory function: get_portal_connector(state) → LandPortalConnector
"""

from .base_connector import (
    LandPortalConnector,
    PortalLandRecord,
    PortalFieldComparison,
    PortalVerificationResult,
    portal_result_to_dict,
)
from .state_detector import detect_state, SUPPORTED_STATES
from .bihar_connector import BiharPortalConnector
from .west_bengal_connector import WestBengalPortalConnector
from .assam_connector import AssamPortalConnector


_CONNECTOR_MAP = {
    "Bihar": BiharPortalConnector,
    "West Bengal": WestBengalPortalConnector,
    "Assam": AssamPortalConnector,
}


def get_portal_connector(state: str) -> LandPortalConnector:
    """
    Returns the appropriate portal connector for the given state name.
    Defaults to BiharPortalConnector if the state is unsupported.
    """
    cls = _CONNECTOR_MAP.get(state, BiharPortalConnector)
    return cls()


__all__ = [
    "LandPortalConnector",
    "PortalLandRecord",
    "PortalFieldComparison",
    "PortalVerificationResult",
    "portal_result_to_dict",
    "detect_state",
    "SUPPORTED_STATES",
    "get_portal_connector",
]
