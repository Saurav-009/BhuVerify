def _stable_float(seed: str, min_value: float, max_value: float) -> float:
    if not seed:
        return (min_value + max_value) / 2
    checksum = sum(ord(ch) for ch in seed)
    ratio = (checksum % 1000) / 1000
    return min_value + (max_value - min_value) * ratio


def build_gis_result(structured_record: dict) -> dict:
    parcel_id = structured_record.get("parcel_id") or (
        f"{structured_record.get('survey_number', 'UNKNOWN')}-{structured_record.get('khata_number', 'UNKNOWN')}"
    )
    lat = _stable_float(parcel_id, 24.0, 28.0)
    lon = _stable_float(parcel_id[::-1], 80.0, 84.0)

    polygon = [
        [lat, lon],
        [lat, lon + 0.003],
        [lat + 0.003, lon + 0.003],
        [lat + 0.003, lon],
    ]

    return {
        "parcel_id": parcel_id,
        "center": {"lat": lat, "lon": lon},
        "polygon": polygon,
        "tile_provider": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    }
