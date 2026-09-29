from app.services.state_connectors import get_connector


def search_land_records(state: str, query: str) -> list[dict]:
    q = query.strip().lower()
    if not q:
        return []

    records = get_connector(state).list_records()
    matches = []
    for item in records:
        hay = " ".join(str(v).lower() for v in item.values())
        if q in hay:
            matches.append(item)
    return matches[:10]
