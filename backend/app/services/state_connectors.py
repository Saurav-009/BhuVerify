import json
from pathlib import Path
from typing import Protocol


class StateConnector(Protocol):
    state_code: str

    def list_records(self) -> list[dict]: ...


class JsonStateConnector:
    def __init__(self, state_code: str, file_name: str):
        self.state_code = state_code
        self._path = Path(__file__).resolve().parent.parent / "state_data" / file_name

    def list_records(self) -> list[dict]:
        with self._path.open("r", encoding="utf-8") as fp:
            return json.load(fp)


CONNECTORS: dict[str, JsonStateConnector] = {
    "up": JsonStateConnector("up", "up_records.json"),
    "bihar": JsonStateConnector("bihar", "bihar_records.json"),
}


def get_connector(state: str) -> JsonStateConnector:
    normalized = state.strip().lower()
    if normalized not in CONNECTORS:
        supported = ", ".join(sorted(CONNECTORS))
        raise ValueError(f"Unsupported state '{state}'. Supported connectors: {supported}")
    return CONNECTORS[normalized]
