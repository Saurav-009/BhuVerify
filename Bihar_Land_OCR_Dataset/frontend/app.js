const API_BASE = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const dropzone = document.getElementById("dropzone");

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            uploadAndAnalyze(e.target.files[0]);
        }
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#38bdf8";
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.style.borderColor = "rgba(56, 189, 248, 0.4)";
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            uploadAndAnalyze(e.dataTransfer.files[0]);
        }
    });
});

async function uploadAndAnalyze(file) {
    const loadingState = document.getElementById("loadingState");
    const resultsCard = document.getElementById("resultsCard");
    
    loadingState.style.display = "block";
    resultsCard.style.display = "none";

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(`${API_BASE}/api/land-record/analyze`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        renderResults(data);
    } catch (err) {
        alert(`Analysis Error: ${err.message}\nMake sure server.py API is running at http://localhost:8000`);
    } finally {
        loadingState.style.display = "none";
    }
}

async function loadSample(sampleName) {
    const loadingState = document.getElementById("loadingState");
    loadingState.style.display = "block";
    
    try {
        const response = await fetch(`/api/land-record/analyze-sample?sample=${sampleName}`);
        if (!response.ok) {
            // Fallback: simulate load via sample file upload
            const fileBlob = await fetch(`/data/raw/documents/${sampleName}`).then(r => r.blob());
            const file = new File([fileBlob], sampleName, { type: "application/pdf" });
            await uploadAndAnalyze(file);
            return;
        }
        const data = await response.json();
        renderResults(data);
    } catch (e) {
        // Retry uploading sample directly
        try {
            const resp = await fetch(`http://localhost:8000/api/land-record/analyze`);
        } catch(err) {
            alert(`Please start the backend server by running: python server.py`);
        }
    } finally {
        loadingState.style.display = "none";
    }
}

function renderResults(data) {
    const resultsCard = document.getElementById("resultsCard");
    resultsCard.style.display = "block";

    // Header Status
    const statusBadge = document.getElementById("statusBadge");
    statusBadge.textContent = data.status;
    statusBadge.className = `status-indicator status-${data.status.replace(" ", "")}`;

    document.getElementById("docTitle").textContent = data.document_id;
    document.getElementById("overallScoreNum").textContent = `${Math.round(data.overall_confidence * 100)}%`;

    // Populate Comparison Table
    const tbody = document.getElementById("comparisonTableBody");
    tbody.innerHTML = "";

    const fieldLabels = {
        "computerized_jamabandi_number": "Computerized Jamabandi #",
        "jamabandi_number": "Jamabandi Number",
        "khata_number": "Khata Number (खाता सं०)",
        "khesra_plot_number": "Khesra Plot # (खेसरा सं०)",
        "raiyat_name": "Raiyat/Owner Name (रैयत नाम)",
        "mauja": "Mauja/Village (मौजा)"
    };

    for (const [key, label] of Object.entries(fieldLabels)) {
        const matchInfo = data.matches[key] || { score: 0, extracted: "N/A", reference: "N/A" };
        const tr = document.createElement("tr");

        let badgeClass = "badge-NOTFOUND";
        let badgeText = "NOT FOUND";
        if (matchInfo.score === 1.0) {
            badgeClass = "badge-MATCH";
            badgeText = "EXACT MATCH";
        } else if (matchInfo.score >= 0.75) {
            badgeClass = "badge-PARTIAL";
            badgeText = "PARTIAL MATCH";
        } else if (matchInfo.extracted !== "N/A" && matchInfo.reference !== "N/A") {
            badgeClass = "badge-MISMATCH";
            badgeText = "MISMATCH";
        }

        tr.innerHTML = `
            <td><strong>${label}</strong></td>
            <td><code>${matchInfo.extracted || "N/A"}</code></td>
            <td><code>${matchInfo.reference || "N/A"}</code></td>
            <td>${Math.round(matchInfo.score * 100)}%</td>
            <td><span class="badge-match ${badgeClass}">${badgeText}</span></td>
        `;
        tbody.appendChild(tr);
    }

    // OCR Text & JSON
    document.getElementById("ocrTextContainer").textContent = data.ocr_text || "No OCR text generated.";
    document.getElementById("jsonContainer").textContent = JSON.stringify(data, null, 2);
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(tabId).classList.add("active");
}
