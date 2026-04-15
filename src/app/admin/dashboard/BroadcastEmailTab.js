'use client';

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import EmailEditor from "@/components/EmailEditor";
import {
  Send, FileSpreadsheet, Loader2, Play, AlertCircle,
  CheckCircle2, Eye, Edit3, ChevronDown, Tag,
} from "lucide-react";
import { wrapInEmailTemplate, injectVariables } from "@/lib/email-template";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";

const DEFAULT_TEMPLATE_ID = "info-akses-portal";

export default function BroadcastEmailTab() {
  const [dataPendaftar, setDataPendaftar] = useState([]);
  const [fileName, setFileName] = useState("");

  const defaultTemplate = EMAIL_TEMPLATES.find(t => t.id === DEFAULT_TEMPLATE_ID);

  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [subject, setSubject] = useState(defaultTemplate.subject);
  const [templateHtml, setTemplateHtml] = useState(defaultTemplate.html);
  const [editorKey, setEditorKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Setelah mount, restore dari localStorage
  useEffect(() => {
    const savedId = localStorage.getItem("bc_templateId");
    const savedSubject = localStorage.getItem("bc_subject");
    const savedHtml = localStorage.getItem("bc_templateHtml");
    if (savedId && EMAIL_TEMPLATES.find(t => t.id === savedId)) {
      setSelectedTemplateId(savedId);
    }
    if (savedSubject) setSubject(savedSubject);
    if (savedHtml) {
      setTemplateHtml(savedHtml);
      setEditorKey(k => k + 1);
    }
  }, []);

  const handleSelectTemplate = (id) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    setSelectedTemplateId(id);
    setSubject(tpl.subject);
    setTemplateHtml(tpl.html);
    setEditorKey(k => k + 1);
    setShowPreview(false);
    localStorage.setItem("bc_templateId", id);
    localStorage.setItem("bc_subject", tpl.subject);
    localStorage.setItem("bc_templateHtml", tpl.html);
  };

  const handleSubjectChange = (value) => {
    setSubject(value);
    localStorage.setItem("bc_subject", value);
  };

  const handleTemplateHtmlChange = (value) => {
    setTemplateHtml(value);
    localStorage.setItem("bc_templateHtml", value);
  };

  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [shouldStop, setShouldStop] = useState(false);
  const stopTarget = useRef(false);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setDataPendaftar(results.data);
      },
    });
  };

  const addLog = (email, nama, status, keterangan) => {
    setLogs(prev => [...prev, { email, nama, status, keterangan }]);
  };

  const startBlast = async () => {
    if (dataPendaftar.length === 0) return alert("Upload data dulu!");
    if (!subject || !templateHtml) return alert("Pesan harus diisi!");

    setIsSending(true);
    setSentCount(0);
    setLogs([]);
    setShouldStop(false);
    stopTarget.current = false;

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < dataPendaftar.length; i++) {
      if (stopTarget.current) {
        addLog("SISTEM", "SISTEM", "gagal", "Tugas dihentikan oleh user.");
        break;
      }

      const user = dataPendaftar[i];

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, subject, templateHtml }),
        });

        const result = await response.json();

        if (response.ok) {
          addLog(user.Email || "-", user.Nama || user["Nama Lengkap"] || "-", "sukses", "Terkirim");
        } else {
          addLog(user.Email || "-", user.Nama || user["Nama Lengkap"] || "-", "gagal", result.error || "Gagal server");
        }
      } catch (error) {
        addLog(user.Email || "-", user.Nama || user["Nama Lengkap"] || "-", "gagal", error.message);
      }

      setSentCount(i + 1);
      await delay(2000);
    }

    setIsSending(false);
  };

  const stopBlast = () => {
    stopTarget.current = true;
    setShouldStop(true);
  };

  const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* Kiri: Editor & Setup */}
      <div className="lg:col-span-8 space-y-6">

        {/* File Uploader */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e2efe3]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#3c7a42] flex items-center gap-2">
              <FileSpreadsheet /> Data Penerima
            </h2>
            <a
              href={selectedTemplate?.csvTemplate ?? "/template-penerima.csv"}
              download
              className="text-sm font-semibold text-[#55a65b] hover:text-[#3c7a42] underline hover:no-underline transition-all"
            >
              Unduh Template CSV
            </a>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isSending}
              className="block w-full text-sm text-[#4d8f54] file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#e2efe3] file:text-[#2e5e33] hover:file:bg-[#d0e5d2] cursor-pointer"
            />
            {dataPendaftar.length > 0 && (
              <div className="shrink-0 bg-[#eef7ef] text-[#2e5e33] px-4 py-2 rounded-xl font-bold border border-[#c4e1c5]">
                {dataPendaftar.length} Data Termuat
              </div>
            )}
          </div>
          {fileName && (
            <p className="mt-2 text-xs text-gray-400">File: {fileName}</p>
          )}
        </div>

        {/* Editor Content */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e2efe3]">
          <h2 className="text-xl font-bold text-[#3c7a42] mb-4">Template Pesan</h2>

          {/* Template Selector */}
          <div className="mb-5">
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-[#5c8b60]">
              <Tag size={14} /> Pilih Template
            </label>
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                disabled={isSending}
                className="w-full appearance-none px-4 py-3 pr-10 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#55a65b] focus:border-transparent transition-all font-medium text-gray-700 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                {EMAIL_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.label}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {selectedTemplate?.variables && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 self-center">Variabel:</span>
                {selectedTemplate.variables.map((v) => (
                  <span key={v} className="text-xs bg-[#eef7ef] text-[#3c7a42] border border-[#c4e1c5] px-2 py-0.5 rounded-md font-mono font-semibold">{v}</span>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-[#5c8b60]">Subjek Email</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#55a65b] focus:border-transparent transition-all font-medium text-gray-800 placeholder:text-gray-400"
              placeholder="Contoh: Pengumuman Seleksi YES"
            />
          </div>

          {/* Editor / Preview */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#5c8b60]">
                Isi Pesan <span className="font-normal text-gray-400">(gunakan {'{Nama}'} untuk inject data)</span>
              </label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`text-sm flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg transition-colors ${showPreview ? "bg-[#e2efe3] text-[#3c7a42]" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {showPreview ? <><Edit3 size={16} /> Edit Pesan</> : <><Eye size={16} /> Preview Desain</>}
              </button>
            </div>
            {showPreview ? (
              <div className="border border-[#e2efe3] rounded-lg overflow-hidden h-[450px]">
                <iframe
                  className="w-full h-full bg-[#f4f8f4]"
                  srcDoc={wrapInEmailTemplate(injectVariables(templateHtml, {
                    Nama: "Ahmad Huda",
                    "Nama Lengkap": "Ahmad Huda Fathan",
                    Email: "huda@example.com",
                    ID: "ETOS1234",
                    Password: "MySecretPassword!"
                  }), subject || "Pratinjau Subjek")}
                />
              </div>
            ) : (
              <EmailEditor key={editorKey} content={templateHtml} onChange={handleTemplateHtmlChange} />
            )}
          </div>
        </div>
      </div>

      {/* Kanan: Monitor & Execute */}
      <div className="lg:col-span-4 space-y-6">

        {/* Execute Card */}
        <div className="bg-gradient-to-br from-[#e8f3e9] to-[#d0e5d2] p-6 rounded-2xl shadow-sm border border-[#c4e1c5]">
          <h2 className="text-xl font-bold text-[#2e5e33] mb-4">Eksekusi Blast</h2>

          {isSending ? (
            <div className="space-y-4">
              <div className="w-full bg-white/50 rounded-full h-3 mb-2 overflow-hidden border border-[#55a65b]/20">
                <div
                  className="bg-[#55a65b] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${dataPendaftar.length > 0 ? (sentCount / dataPendaftar.length) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-[#3c7a42]">
                <span>Mengirim...</span>
                <span>{sentCount} / {dataPendaftar.length}</span>
              </div>
              <button
                onClick={stopBlast}
                disabled={shouldStop}
                className="w-full mt-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {shouldStop ? 'Menghentikan...' : 'Hentikan Eksekusi'}
              </button>
            </div>
          ) : (
            <button
              onClick={startBlast}
              disabled={dataPendaftar.length === 0}
              className="w-full bg-[#55a65b] hover:bg-[#468e4c] disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(85,166,91,0.39)] hover:shadow-[0_6px_20px_rgba(85,166,91,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} /> Mulai Blast ({dataPendaftar.length} Orang)
            </button>
          )}
        </div>

        {/* Log Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e2efe3] h-[400px] flex flex-col">
          <h2 className="text-lg font-bold text-[#3c7a42] mb-3 flex items-center gap-2 border-b border-[#e2efe3] pb-3">
            <Loader2 className={isSending ? "animate-spin text-[#55a65b]" : "text-gray-400"} />
            Log Pengiriman
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {logs.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10 italic">Belum ada aktivitas pengiriman.</p>
            )}
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border text-sm flex flex-col ${log.status === 'sukses' ? 'bg-[#f4faeb] border-[#c1e1c1]' : 'bg-red-50 border-red-100'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <strong className={log.status === 'sukses' ? "text-[#3c7a42]" : "text-red-700"}>{log.nama}</strong>
                  {log.status === 'sukses'
                    ? <CheckCircle2 size={16} className="text-[#55a65b]" />
                    : <AlertCircle size={16} className="text-red-500" />
                  }
                </div>
                <span className="text-xs text-gray-500">{log.email}</span>
                {log.status === 'gagal' && (
                  <span className="text-xs text-red-500 mt-1">{log.keterangan}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
