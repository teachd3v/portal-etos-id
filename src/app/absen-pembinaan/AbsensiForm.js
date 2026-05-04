'use client';
// src/app/absen-pembinaan/AbsensiForm.js
import { useState } from 'react';

export default function AbsensiForm({ activeAgenda }) {
  const [idInput, setIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // null | 'success' | 'duplicate' | 'error' | 'no_agenda'
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Tidak ada agenda aktif
  if (!activeAgenda) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">Belum Ada Agenda Aktif</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Tidak ada agenda pembinaan yang sedang dibuka saat ini.<br />
          Silakan hubungi panitia untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  const handleReset = () => {
    setIdInput('');
    setResult(null);
    setResultData(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idInput.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_etoser: idInput.trim() }),
      });

      const data = await res.json();

      if (res.status === 200) {
        setResult('success');
        setResultData(data);
      } else if (res.status === 409) {
        setResult('duplicate');
        setResultData(data);
      } else {
        setResult('error');
        setErrorMsg(data.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } catch {
      setResult('error');
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan hasil sukses
  if (result === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-green-700 mb-1">Kehadiran Tercatat!</h2>
        <p className="text-gray-500 text-sm mb-6">Terima kasih sudah hadir di pembinaan ini.</p>

        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Nama</span>
            <span className="font-bold text-gray-800">{resultData?.nama}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Angkatan</span>
            <span className="font-bold text-gray-800">{resultData?.angkatan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Wilayah</span>
            <span className="font-bold text-gray-800">{resultData?.wilayah}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Agenda</span>
            <span className="font-bold text-orange-700 text-right max-w-[60%]">{resultData?.nama_agenda}</span>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan hasil duplikat
  if (result === 'duplicate') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-blue-700 mb-1">Sudah Tercatat</h2>
        <p className="text-gray-500 text-sm mb-4">
          <span className="font-bold text-gray-700">{resultData?.nama}</span> sudah tercatat hadir di agenda{' '}
          <span className="font-bold text-orange-600">{resultData?.nama_agenda}</span>.
        </p>

        <button
          onClick={handleReset}
          className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
        >
          Coba ID Lain
        </button>
      </div>
    );
  }

  // Form utama
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Agenda aktif */}
      <div className="bg-orange-50 border-b border-orange-100 px-6 py-4">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">Agenda Saat Ini</p>
        <p className="font-black text-gray-800 text-base leading-tight">{activeAgenda.nama}</p>
        {(activeAgenda.pelaksana || activeAgenda.jenis_aktivitas) && (
          <p className="text-xs text-gray-500 mt-1">
            {activeAgenda.pelaksana && <span className="font-semibold">{activeAgenda.pelaksana}</span>}
            {activeAgenda.pelaksana && activeAgenda.jenis_aktivitas && <span> · </span>}
            {activeAgenda.jenis_aktivitas && <span>{activeAgenda.jenis_aktivitas}</span>}
          </p>
        )}
        {activeAgenda.tema && (
          <p className="text-xs text-gray-600 mt-0.5 font-medium">📌 {activeAgenda.tema}</p>
        )}
        {activeAgenda.tanggal && (
          <p className="text-xs text-gray-400 mt-0.5">{activeAgenda.tanggal}</p>
        )}
        {activeAgenda.deskripsi && (
          <p className="text-xs text-gray-400 mt-0.5">{activeAgenda.deskripsi}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            ID Etoser <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={idInput}
            onChange={e => setIdInput(e.target.value.toUpperCase())}
            placeholder="Contoh: EBZ2025000/E2025080/E2023080"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm font-bold tracking-wide text-gray-800 placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal"
            autoComplete="off"
            required
          />
          <p className="text-xs text-gray-400 mt-1.5">Masukkan ID kamu sesuai yang terdaftar di sistem.</p>
        </div>

        {/* Error message */}
        {result === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !idInput.trim()}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors text-sm tracking-wide"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mencatat...
            </span>
          ) : 'Catat Kehadiran'}
        </button>
      </form>
    </div>
  );
}
