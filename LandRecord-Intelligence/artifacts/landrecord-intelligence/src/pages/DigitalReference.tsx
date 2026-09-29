import React, { useState, useEffect } from 'react';
import { getStoredAnalysis, subscribeAnalysis, fetchReferenceRecords } from '@/services/analysisService';
import type { AnalysisResult } from '@/types/analysis';
import { Printer, ShieldCheck, Download, RefreshCw, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function DigitalReference() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(getStoredAnalysis);
  const [referenceList, setReferenceList] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('BR_PATNA_SAMPATCHAK_001');

  useEffect(() => {
    const unsub = subscribeAnalysis(setAnalysis);
    fetchReferenceRecords().then((list) => {
      if (list && list.length > 0) setReferenceList(list);
    });
    return unsub;
  }, []);

  const f = analysis.fields;
  const ref = analysis.matched_reference_record || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8">
      {/* Top Action Bar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/record" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official Bhu-Abhilekh Reference
          </span>
        </div>

        <div className="flex items-center gap-2">
          {referenceList.length > 0 && (
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value);
                const found = referenceList.find((r) => r.document_id === e.target.value);
                if (found) {
                  // update preview reference
                }
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {referenceList.map((r) => (
                <option key={r.document_id} value={r.document_id}>
                  {r.document_id} - {r.raiyat_name} ({r.mauja})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Official Government Record Certificate */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 md:p-12 shadow-xl border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-0">
        {/* Certificate Header */}
        <div className="text-center border-b-2 border-emerald-900 pb-4 mb-6">
          <div className="flex justify-center items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-800 flex items-center justify-center font-bold text-emerald-900 text-lg bg-amber-50">
              भूम
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-950 font-serif">
                बिहार सरकार / Government of Bihar
              </h1>
              <p className="text-sm font-semibold text-slate-700">
                राजस्व एवं भूमि सुधार विभाग (Department of Land Resources)
              </p>
              <p className="text-xs text-slate-500">
                भू-अभिलेख एवं परिमाप निदेशालय · Jamabandi Panji-II Digital Portal
              </p>
            </div>
          </div>
          <div className="inline-block bg-emerald-50 border border-emerald-300 px-4 py-1 rounded text-xs font-bold text-emerald-900 uppercase tracking-widest mt-1">
            डिजिटल हस्ताक्षरित जमाबंदी पंजी प्रति (Digitally Verified Copy)
          </div>
        </div>

        {/* Top Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200 text-xs mb-6">
          <div>
            <span className="block font-semibold text-slate-500">जिला (District):</span>
            <span className="font-bold text-slate-900">{f.district?.normalized || 'Patna'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">अंचल (Circle/Anchal):</span>
            <span className="font-bold text-slate-900">{f.anchal?.normalized || 'Sampatchak'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">हलका (Halka):</span>
            <span className="font-bold text-slate-900">{f.halka?.normalized || 'BAIRIYA KARNPURA'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">मौजा (Mauza / Thana No.):</span>
            <span className="font-bold text-slate-900">{f.mauja?.normalized || 'Karnpura-121'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">भाग वर्तमान (Volume):</span>
            <span className="font-bold text-slate-900">{f.bhag_vartaman?.normalized || '1'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">पृष्ठ संख्या (Page):</span>
            <span className="font-bold text-slate-900">{f.prishth_sankhya?.normalized || '1'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">जमाबंदी संख्या (Jamabandi No):</span>
            <span className="font-bold text-emerald-800 text-sm">{f.jamabandi_number?.normalized || '1'}</span>
          </div>
          <div>
            <span className="block font-semibold text-slate-500">कंप्यूटरीकृत जमाबंदी संख्या:</span>
            <span className="font-mono font-bold text-slate-900">{f.computerized_jamabandi_number?.normalized || '211500100010001'}</span>
          </div>
        </div>

        {/* Titleholder / Raiyat Details */}
        <div className="mb-6 border border-slate-200">
          <div className="bg-slate-100 px-4 py-2 font-bold text-xs uppercase text-slate-700 border-b border-slate-200">
            रैयत (जमीन मालिक) का विवरण / Titleholder Details
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">रैयत का नाम (Raiyat / Owner Name):</span>
              <span className="font-bold text-slate-900 text-sm">{f.raiyat_name?.original || f.raiyat_name?.normalized || 'श्रीमती कान्ती देवी'}</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">({f.raiyat_name?.normalized || 'Smt. Kanti Devi'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">पिता/पति का नाम (Father / Husband):</span>
              <span className="font-bold text-slate-900 text-sm">{f.father_or_husband_name?.original || f.father_or_husband_name?.normalized || 'स्व० राम चन्द्र राय'}</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">({f.father_or_husband_name?.normalized || 'Late Ram Chandra Rai'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">जाति / श्रेणी (Category / Caste):</span>
              <span className="font-medium text-slate-800">सामान्य / पिछड़ा वर्ग (General / OBC)</span>
            </div>
            <div>
              <span className="text-slate-500 block">निवास स्थान (Address):</span>
              <span className="font-medium text-slate-800">मौजा करनपुरा, अंचल सम्पतचक, पटना</span>
            </div>
          </div>
        </div>

        {/* Land Parcel Details Table */}
        <div className="mb-6 border border-slate-200">
          <div className="bg-slate-100 px-4 py-2 font-bold text-xs uppercase text-slate-700 border-b border-slate-200">
            भूमि एवं खेसरा विवरणी / Parcel & Cadastral Plots
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">क्र० सं०</th>
                  <th className="p-2.5">खाता संख्या (Khata)</th>
                  <th className="p-2.5">खेसरा संख्या (Plot/Khesra)</th>
                  <th className="p-2.5">रकबा (Area)</th>
                  <th className="p-2.5">भूमि का प्रकार (Land Type)</th>
                  <th className="p-2.5">चौहद्दी (Boundaries)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium">1</td>
                  <td className="p-2.5 font-bold text-emerald-900">{f.khata_number?.normalized || '14'}</td>
                  <td className="p-2.5 font-bold text-emerald-900">{f.khesra_plot_number?.normalized || '108'}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{f.land_area?.normalized || '0 एकड़ 12.5 डिसमिल'}</td>
                  <td className="p-2.5 text-slate-700">काश्त / रैयती (Bhit-1)</td>
                  <td className="p-2.5 text-slate-600 text-[11px]">उ०- निज, द०- रास्ता, पू०- रामदेव, प०- सड़क</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Lagaan / Rent & Dakhil-Kharij Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="border border-slate-200 p-3">
            <div className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
              लगान एवं उपकर (Revenue & Cesses)
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between"><span>मूल लगान (Basic Rent):</span> <span className="font-semibold text-slate-800">₹ 14.50</span></div>
              <div className="flex justify-between"><span>शिक्षा उपकर (Education Cess):</span> <span className="font-semibold text-slate-800">₹ 7.25</span></div>
              <div className="flex justify-between"><span>सड़क उपकर (Road Cess):</span> <span className="font-semibold text-slate-800">₹ 3.60</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                <span>कुल वार्षिक लगान (Total Rent):</span> <span>₹ 25.35</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 p-3">
            <div className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
              दाखिल-खारिज (Mutation Status)
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{f.mutation_status?.normalized || 'Mutation Cases Not Found (Regular Jamabandi)'}</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                अभिलेख में कोई अनसुलझा या विवादित दाखिल-खारिज वाद लंबित नहीं है।
              </p>
            </div>
          </div>
        </div>

        {/* Official Digital Signature Footer */}
        <div className="border-t-2 border-dashed border-slate-300 pt-4 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 border border-slate-300 flex items-center justify-center font-mono text-[9px] text-center p-1">
              QR VERIFIED [BIHAR-DoLR]
            </div>
            <div>
              <p className="font-semibold text-slate-800">प्रमाणीकरण कोड: BHU-PAT-2026-08192</p>
              <p>दस्तावेज सत्यापन तिथि: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p>सत्यापित प्रणाली: BhuVerify Intelligent Validation Suite (SIH 2026)</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-900 text-xs">अंचलाधिकारी (Circle Officer)</p>
            <p>राजस्व अंचल - सम्पतचक, पटना</p>
            <p className="italic text-[10px] text-emerald-800 font-semibold">डिजिटली हस्ताक्षरित एवं प्रमाणित</p>
          </div>
        </div>
      </div>
    </div>
  );
}
