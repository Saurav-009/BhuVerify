import { useState } from 'react';
import ParcelMap from './components/ParcelMap';
import { downloadReadableDocument, reviewDocument, uploadDocument, voiceSearch } from './api';

function App() {
  const [file, setFile] = useState(null);
  const [stateCode, setStateCode] = useState('up');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResult, setVoiceResult] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await uploadDocument(file, stateCode);
      setResult(data);
    } catch (err) {
      setError(String(err));
    }
  };

  const onReview = async (decision) => {
    if (!result) return;
    const officerName = prompt('Officer name');
    const comments = prompt('Comments') || '';
    const updated = await reviewDocument(result.id, decision, officerName || 'Officer', comments);
    setResult(updated);
  };

  const onVoiceSearch = async (e) => {
    e.preventDefault();
    const data = await voiceSearch(stateCode, voiceQuery);
    setVoiceResult(data);
  };

  return (
    <main className="container">
      <h1>BhuVerify Prototype</h1>
      <p>Upload → OCR/HTR → Gemini extraction → validation → GIS → risk → officer review.</p>

      <form onSubmit={onSubmit} className="card">
        <h2>Upload Land Record</h2>
        <label>
          State connector
          <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
            <option value="up">Uttar Pradesh</option>
            <option value="bihar">Bihar</option>
          </select>
        </label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        <button type="submit" disabled={!file}>Process Document</button>
      </form>

      <form onSubmit={onVoiceSearch} className="card">
        <h2>Voice-based Land Search</h2>
        <input value={voiceQuery} onChange={(e) => setVoiceQuery(e.target.value)} placeholder="Speak/query owner/parcel" />
        <button type="submit">Search</button>
        {voiceResult && <pre>{JSON.stringify(voiceResult, null, 2)}</pre>}
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card">
          <h2>Structured Digital Record</h2>
          <pre>{JSON.stringify(result.structured_record, null, 2)}</pre>
          <h3>Source Evidence & Highlight</h3>
          <pre>{JSON.stringify(result.evidence, null, 2)}</pre>
          <h3>Validation</h3>
          <pre>{JSON.stringify(result.validation_result, null, 2)}</pre>
          <h3>Risk Analysis</h3>
          <p>
            Risk: <strong>{result.risk_level}</strong> ({result.risk_score})
          </p>
          <ParcelMap gis={result.gis_result} />
          <div className="actions">
            <button onClick={() => downloadReadableDocument(result.id)}>Download Readable Record</button>
            <button onClick={() => onReview('approve')}>Approve</button>
            <button onClick={() => onReview('reject')}>Reject</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
