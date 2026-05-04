'use client';
// src/app/absen-wilayah/AbsenWilayahForm.js
import { useState, useEffect } from 'react';

export default function AbsenWilayahForm({ initialActiveAgendas = [] }) {
  // ── PHASE: 'id' | 'checklist' | 'success'
  const [phase, setPhase] = useState('id');

  // Phase: id
  const [idInput, setIdInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Data setelah lookup
  const [fasil, setFasil] = useState(null);          // { id, nama, wilayah, role }
  const [etosers, setEtosers] = useState([]);         // [{ id, nama, angkatan, wilayah }]
  const [activeAgendas, setActiveAgendas] = useState(initialActiveAgendas);

  // Phase: checklist
  const [selectedAgendaId, setSelectedAgendaId] = useState('');
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState('');
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [existingLoading, setExistingLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Phase: success
  const [successCount, setSuccessCount] = useState(0);
  const [successAgendaNama, setSuccessAgendaNama] = useState('');

  // Saat agenda dipilih, fetch kehadiran yang sudah ada sebelumnya
  useEffect(() => {
    if (!selectedAgendaId || !fasil) { setCheckedIds(new Set()); return; }
    setExistingLoading(true);
    fetch(`/api/absensi-wilayah?type=existing&id_fasil=${encodeURIComponent(fasil.id)}&agenda_id=${encodeURIComponent(selectedAgendaId)}`)
      .then(r => r.json())
      .then(data => setCheckedIds(new Set(data.hadir_ids || [])))
      .catch(() => setCheckedIds(new Set()))
      .finally(() => setExistingLoading(false));
  }, [selectedAgendaId, fasil]);

  // ── TIDAK ADA AGENDA AKTIF ────────────────────────────────────────────────
  if (activeAgendas.length === 0) {
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
          Tidak ada agenda pembinaan wilayah yang sedang dibuka saat ini.<br />
          Silakan hubungi admin pusat untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  // ── LOOKUP ID FASIL ───────────────────────────────────────────────────────
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!idInput.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/absensi-wilayah?type=lookup&id_fasil=${encodeURIComponent(idInput.trim())}`);
      const data = await res.json();
      if (!res.ok) { setLookupError(data.message || 'ID tidak ditemukan.'); return; }
      setFasil(data.fasil);
      setEtosers(data.etosers || []);
      // Gunakan agenda dari server (sudah difilter aktif & wilayah) — fallback ke initialActiveAgendas
      if (data.active_agendas?.length > 0) setActiveAgendas(data.active_agendas);
      // Auto-select jika hanya ada satu agenda
      if ((data.active_agendas || activeAgendas).length === 1) {
        setSelectedAgendaId((data.active_agendas || activeAgendas)[0].id);
      }
      setPhase('checklist');
    } catch {
      setLookupError('Gagal terhubung ke server. Periksa koneksi internet.');
    } finally {
      setLookupLoading(false);
    }
  };

  // ── TOGGLE CENTANG ────────────────────────────────────────────────────────
  const toggleCheck = (id) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const checkAll = () => setCheckedIds(new Set(etosers.map(e => e.id)));
  const clearAll = () => setCheckedIds(new Set());

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedAgendaId) { setSubmitError('Pilih agenda terlebih dahulu.'); return; }
    if (!tanggalPelaksanaan) { setSubmitError('Input tanggal pelaksanaan terlebih dahulu.'); return; }
    
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/absensi-wilayah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_fasil: fasil.id,
          agenda_id: selectedAgendaId,
          id_etosers_hadir: Array.from(checkedIds),
          tanggal_pelaksanaan: tanggalPelaksanaan,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.message || 'Gagal menyimpan.'); return; }
      const agenda = activeAgendas.find(a => a.id === selectedAgendaId);
      setSuccessCount(data.count);
      setSuccessAgendaNama(agenda?.nama || '');
      setPhase('success');
    } catch {
      setSubmitError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setPhase('id');
    setIdInput('');
    setFasil(null);
    setEtosers([]);
    setSelectedAgendaId('');
    setTanggalPelaksanaan('');
    setCheckedIds(new Set());
    setSubmitError('');
    setLookupError('');
  };

  const selectedAgenda = activeAgendas.find(a => a.id === selectedAgendaId);

  // ── PHASE: SUCCESS ────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-green-700 mb-1">Absensi Tersimpan!</h2>
        <p className="text-gray-500 text-sm mb-6">
          <span className="font-bold text-gray-700">{successCount} Etoser</span> tercatat hadir di{' '}
          <span className="font-bold text-blue-700">{successAgendaNama}</span>.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 font-medium">Fasilitator</span>
            <span className="font-bold text-gray-800">{fasil?.nama}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Wilayah</span>
            <span className="font-bold text-gray-800">{fasil?.wilayah}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setPhase('checklist'); setSubmitError(''); }}
            className="flex-1 py-2.5 rounded-xl border border-blue-300 text-blue-600 text-sm font-bold hover:bg-blue-50 transition-colors"
          >
            Update Absensi
          </button>
          <button onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: CHECKLIST ──────────────────────────────────────────────────────
  if (phase === 'checklist') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Info Fasil */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-0.5">Fasilitator</p>
              <p className="font-black text-gray-800 text-base">{fasil?.nama}</p>
              <p className="text-xs text-gray-500 mt-0.5">{fasil?.id} · {fasil?.wilayah}</p>
            </div>
            <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Ganti ID
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Pilih Agenda */}
          {activeAgendas.length > 1 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Pilih Agenda / Aktivitas <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAgendaId}
                onChange={e => setSelectedAgendaId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-sm font-bold text-gray-800 cursor-pointer"
              >
                <option value="">— Pilih Agenda —</option>
                {activeAgendas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.jenis_aktivitas ? `${a.jenis_aktivitas} — ` : ''}{a.nama}{a.tema ? ` (${a.tema})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Input Tanggal Pelaksanaan (Mandatory) */}
          {selectedAgendaId && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <label className="block text-sm font-bold text-orange-800 mb-2">
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalPelaksanaan}
                onChange={e => setTanggalPelaksanaan(e.target.value)}
                className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm font-bold text-gray-800"
                required
              />
              <p className="text-[10px] text-orange-600 mt-1.5 font-medium italic">
                * Masukkan tanggal saat agenda ini dilaksanakan di wilayahmu.
              </p>
            </div>
          )}

          {/* Info agenda terpilih */}
          {selectedAgenda && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-sm space-y-0.5">
              <p className="font-bold text-gray-800">{selectedAgenda.nama}</p>
              {selectedAgenda.jenis_aktivitas && (
                <p className="text-gray-500">Jenis: <span className="font-semibold text-gray-700">{selectedAgenda.jenis_aktivitas}</span></p>
              )}
              {selectedAgenda.tema && (
                <p className="text-gray-500">📌 {selectedAgenda.tema}</p>
              )}
              {selectedAgenda.tanggal && (
                <p className="text-gray-400 text-xs">{selectedAgenda.tanggal}</p>
              )}
            </div>
          )}

          {/* Checklist Etoser */}
          {selectedAgendaId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">
                  Daftar Etoser Binaan
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({checkedIds.size}/{etosers.length} dipilih)
                  </span>
                </label>
                <div className="flex gap-2">
                  <button onClick={checkAll} className="text-xs font-bold text-blue-600 hover:underline">
                    Pilih Semua
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAll} className="text-xs font-bold text-gray-400 hover:underline">
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              {existingLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memuat data...
                </div>
              ) : etosers.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                  Tidak ada Etoser yang terdaftar dalam binaan ini.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {etosers.map(etoser => (
                    <label
                      key={etoser.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.has(etoser.id)}
                        onChange={() => toggleCheck(etoser.id)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{etoser.nama}</p>
                        <p className="text-xs text-gray-400">{etoser.id} · Angkatan {etoser.angkatan} · {etoser.wilayah}</p>
                      </div>
                      {checkedIds.has(etoser.id) && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 shrink-0">
                          Hadir
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{submitError}</p>
            </div>
          )}

          {/* Tombol simpan */}
          <button
            onClick={handleSubmit}
            disabled={submitLoading || !selectedAgendaId}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors text-sm"
          >
            {submitLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </span>
            ) : `Simpan Absensi (${checkedIds.size} Hadir)`}
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: ID INPUT ───────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Info agenda aktif */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">
          {activeAgendas.length} Agenda Aktif
        </p>
        {activeAgendas.length === 1 ? (
          <>
            <p className="font-black text-gray-800 text-base leading-tight">{activeAgendas[0].nama}</p>
            {activeAgendas[0].jenis_aktivitas && (
              <p className="text-xs text-gray-500 mt-0.5">{activeAgendas[0].jenis_aktivitas}{activeAgendas[0].tema ? ` · ${activeAgendas[0].tema}` : ''}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-600 font-medium">
            {activeAgendas.map(a => a.jenis_aktivitas || a.nama).join(', ')}
          </p>
        )}
      </div>

      <form onSubmit={handleLookup} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            ID Fasilitator <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={idInput}
            onChange={e => setIdInput(e.target.value.toUpperCase())}
            placeholder="Masukkan ID Fasilitator"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none text-sm font-bold tracking-wide text-gray-800 placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal"
            autoComplete="off"
            required
          />
          <p className="text-xs text-gray-400 mt-1.5">Masukkan ID kamu sesuai yang terdaftar di sistem.</p>
        </div>

        {lookupError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{lookupError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={lookupLoading || !idInput.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors text-sm"
        >
          {lookupLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memverifikasi...
            </span>
          ) : 'Lanjut'}
        </button>
      </form>
    </div>
  );
}
