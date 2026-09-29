const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

export async function uploadDocument(file, state) {
  const form = new FormData();
  form.append('state', state);
  form.append('file', file);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function reviewDocument(documentId, decision, officerName, comments) {
  const response = await fetch(`${API_BASE}/documents/${documentId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, officer_name: officerName, comments }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export function downloadReadableDocument(documentId) {
  window.open(`${API_BASE}/documents/${documentId}/download`, '_blank');
}

export async function voiceSearch(state, queryText) {
  const form = new FormData();
  form.append('state', state);
  form.append('query_text', queryText);
  const response = await fetch(`${API_BASE}/voice/search`, { method: 'POST', body: form });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
