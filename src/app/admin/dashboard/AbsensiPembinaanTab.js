'use client';
// src/app/admin/dashboard/AbsensiPembinaanTab.js
import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, CalendarCheck, ToggleLeft, ToggleRight, X, Users, KeyRound } from 'lucide-react';

// ================================================================
// KONSTANTA DATA TOPIK
// ================================================================
const KAJIAN_ISLAM_TOPICS = [
  'Fiqh Sholat', 'Fiqh Thoharoh', 'Fiqh Shoum (Puasa)', 'Fiqh Muammalah',
  'Birrul Walidain', 'Kajian Shiroh', 'Ahwalul Muslimunal Yaum', 'Ghazwul Fikri',
  'Afatul Lisan (Bahayanya Lisan)', 'Mengenal Batasan Aurat Muslim/Muslimah',
  'Adab Interaksi Lawan Jenis', "Ta'riful Qur'an",
  'Mengenal Ragam Gerakan Islam Liberal', 'Menyikapi Perbedaan Pandangan dalam Islam',
  'Keutamaan Ramadan', 'Penyakit Hati dan Obatnya', 'Istidraj', 'Lain-lain',
];

const BEDAH_BUKU_TOPICS = [
  'Start With Why (Simon Sinek)', 'Find Your Why (Simon Sinek)',
  'Atomic Habits (James Clear)', 'Tuhan Ada di Hatimu – Husein Ja\'far Al-Hadar',
  'The Islamic Way of Happiness – Agung Setiyo Wibowo',
  'You Do You – Fellexandro Ruby', 'Laut Bercerita – Leila S. Chudori',
  'Filosofi Teras', 'Lain-lain',
];

const BEDAH_FILM_TOPICS = [
  'Laskar Pelangi', 'Sang Pemimpi', 'The Billionaire', 'Dead Poets Society',
  'The Social Network', 'The Pursuit of Happyness', 'Taare Zamen Par',
  'A Beautiful Mind', 'Lain-lain',
];

const BEDAH_VALUES_TOPICS = {
  Integritas: [
    'Self Awareness: "Kenal Diri, Kendalikan Diri"',
    'Personal Values: "Pegangan Hidup, Penentu Arah"',
    'Honesty: "Jujur Tanpa Tapi"',
    'Discipline: "Disiplin adalah Kekuatan Diam"',
    'Responsibility (Amanah): "Dipercaya Itu Mahal"',
    'Time Management: "Waktu Tidak Menunggu"',
    'Resilience: "Tahan Uji, Tahan Banting"',
    'Consistency: "Kecil Tapi Rutin"',
    'Lain-lain',
  ],
  Profesional: [
    'Growth Mindset: "Bertumbuh atau Tertinggal"',
    'Goal Setting: "Target Jelas, Arah Tegas"',
    'Personal Branding: "Dikenal Karena Apa?"',
    'Communication Skill: "Ngomong Itu Skill"',
    'Critical Thinking: "Jangan Asal Setuju"',
    'Problem Solving: "Masalah = Peluang Berpikir"',
    'Work Ethics: "Kerja Bener, Bukan Sekadar Sibuk"',
    'Productivity: "Hasil Nyata, Bukan Wacana"',
    'Lain-lain',
  ],
  Kolaboratif: [
    'Networking: "Relasi adalah Aset"',
    'Team Role Awareness: "Paham Peran, Bukan Sekadar Ikut"',
    'Effective Communication (Tim): "Nyambung dalam Peran Itu Penting"',
    'Conflict Management: "Beda Itu Biasa, Ribut Itu Pilihan"',
    'Negotiation Skill: "Menang Tanpa Menjatuhkan"',
    'Collaboration Mindset: "Bertumbuh Bareng Lebih Kuat"',
    'Team Leadership: "Memimpin Tanpa Mendominasi"',
    'Community Building: "Bangun, Bukan Sekadar Kumpul"',
    'Lain-lain',
  ],
  Transformatif: [
    'Purpose Driven: "Hidup Harus Punya Alasan"',
    'Visioning: "Melihat yang Belum Terlihat"',
    'Empathy: "Rasa yang Menggerakkan"',
    'Design Thinking: "Solusi Berawal dari Empati"',
    'Innovation: "Berani Beda, Berani Baru"',
    'Change Management: "Siap Berubah, Siap Tumbuh"',
    'Impact Creation: "Bukan Sekadar Ada, Tapi Bermakna"',
    'Storytelling: "Cerita yang Menggerakkan"',
    'Lain-lain',
  ],
};

const JENIS_WILAYAH = ['Tahsin', 'Kajian Islam', 'Bedah Buku', 'Bedah Film', 'Bedah Values'];
const VALUES_CATEGORIES = ['Integritas', 'Profesional', 'Kolaboratif', 'Transformatif'];

const SELECT_CLS = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm text-gray-800 cursor-pointer';
const INPUT_CLS  = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-sm text-gray-800 placeholder:text-gray-400';

const EMPTY_FORM = {
  nama: '', tanggal: '',
  pelaksana: 'Nasional',
  jenis_aktivitas: 'Tematik',
  values_category: '',
  tema: '',
  tema_custom: '',
};

// Badge pelaksana + jenis
function AgendaBadge({ pelaksana, jenis_aktivitas }) {
  const isNasional = pelaksana === 'Nasional' || pelaksana === 'Pusat';
  return (
    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${
      isNasional
        ? 'bg-purple-50 text-purple-700 border-purple-200'
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      {isNasional ? 'Nasional' : (pelaksana || '—')}{jenis_aktivitas ? ` · ${jenis_aktivitas}` : ''}
    </span>
  );
}

function AgendaStatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
      Aktif
    </span>
  ) : (
    <span className="inline-flex text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
      Nonaktif
    </span>
  );
}

function AgendaActionButtons({ agenda, actionLoading, handleToggle, setViewTarget, setDeleteTarget }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => handleToggle(agenda)} disabled={actionLoading === agenda.id}
        title={agenda.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${agenda.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
      >
        {agenda.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
      </button>
      <button onClick={() => setViewTarget(agenda)} title="Lihat absensi"
        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Users className="w-4 h-4" />
      </button>
      <button onClick={() => setDeleteTarget(agenda)} disabled={actionLoading === agenda.id}
        title="Hapus"
        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AbsensiPembinaanTab({ initialAgendas = [] }) {
  const [agendas, setAgendas] = useState(initialAgendas);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [absensiList, setAbsensiList] = useState([]);
  const [absensiLoading, setAbsensiLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  // State untuk delete absensi
  const [deleteAbsensiTarget, setDeleteAbsensiTarget] = useState(null); // { absensi, type }
  const [deleteAbsensiPassword, setDeleteAbsensiPassword] = useState('');
  const [deleteAbsensiLoading, setDeleteAbsensiLoading] = useState(false);
  const [deleteAbsensiError, setDeleteAbsensiError] = useState('');

  // Ambil daftar absensi saat viewTarget berubah
  // Pusat → /api/absensi  |  Wilayah → /api/absensi-wilayah?type=all
  useEffect(() => {
    if (!viewTarget) { setAbsensiList([]); return; }
    setAbsensiLoading(true);
    const isWilayah = viewTarget.pelaksana === 'Wilayah';
    const url = isWilayah
      ? `/api/absensi-wilayah?type=all&agenda_id=${encodeURIComponent(viewTarget.id)}`
      : `/api/absensi?agenda_id=${encodeURIComponent(viewTarget.id)}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setAbsensiList(data.absensi || []))
      .catch(() => setAbsensiList([]))
      .finally(() => setAbsensiLoading(false));
  }, [viewTarget]);

  // Helpers untuk update formData dengan reset cascade
  const setPelaksana = (val) => setFormData({
    ...EMPTY_FORM,
    nama: formData.nama, tanggal: formData.tanggal,
    pelaksana: val,
    jenis_aktivitas: (val === 'Nasional' || val === 'Pusat') ? 'Tematik' : '',
  });

  const setJenis = (val) => setFormData(p => ({
    ...p, jenis_aktivitas: val, values_category: '', tema: '', tema_custom: '',
  }));

  const setValuesCategory = (val) => setFormData(p => ({
    ...p, values_category: val, tema: '', tema_custom: '',
  }));

  const setTema = (val) => setFormData(p => ({
    ...p, tema: val, tema_custom: '',
  }));

  // Topik dropdown berdasarkan jenis & values_category
  const getTopics = () => {
    if (formData.jenis_aktivitas === 'Kajian Islam') return KAJIAN_ISLAM_TOPICS;
    if (formData.jenis_aktivitas === 'Bedah Buku') return BEDAH_BUKU_TOPICS;
    if (formData.jenis_aktivitas === 'Bedah Film') return BEDAH_FILM_TOPICS;
    if (formData.jenis_aktivitas === 'Bedah Values' && formData.values_category)
      return BEDAH_VALUES_TOPICS[formData.values_category] || [];
    return null;
  };

  const topics = getTopics();
  const showTopicDropdown = topics !== null && topics.length > 0;
  const showCustomInput = formData.tema === 'Lain-lain';
  const showValuesCategory = formData.jenis_aktivitas === 'Bedah Values';

  // Nilai tema final yang dikirim ke API
  const finalTema = formData.tema === 'Lain-lain' ? formData.tema_custom : formData.tema;

  // === TOGGLE AKTIF ===
  const handleToggle = async (agenda) => {
    const willActivate = !agenda.is_active;

    // Konfirmasi hanya untuk Nasional (mutual exclusive)
    if (willActivate && (agenda.pelaksana === 'Nasional' || agenda.pelaksana === 'Pusat')) {
      const currentActiveNas = agendas.find(a => a.is_active && (a.pelaksana === 'Nasional' || a.pelaksana === 'Pusat') && a.id !== agenda.id);
      if (currentActiveNas) {
        const ok = window.confirm(
          `Agenda Nasional "${currentActiveNas.nama}" sedang aktif.\nYakin ingin menggantinya dengan "${agenda.nama}"?`
        );
        if (!ok) return;
      }
    }

    setActionLoading(agenda.id);
    try {
      const res = await fetch('/api/admin/agenda/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_agenda: agenda.id, activate: willActivate }),
      });
      if (!res.ok) { alert((await res.json()).message || 'Gagal.'); return; }

      // Update state lokal sesuai logika masing-masing pelaksana
      setAgendas(prev => prev.map(a => {
        if (a.id === agenda.id) return { ...a, is_active: willActivate };
        // Nasional: nonaktifkan semua Nasional lain saat aktivasi
        const isTargetNas = agenda.pelaksana === 'Nasional' || agenda.pelaksana === 'Pusat';
        const isCurrentNas = a.pelaksana === 'Nasional' || a.pelaksana === 'Pusat';
        if (willActivate && isTargetNas && isCurrentNas) return { ...a, is_active: false };
        // Wilayah: tidak mempengaruhi agenda lain sama sekali
        return a;
      }));
    } catch { alert('Terjadi kesalahan. Coba lagi.'); }
    finally { setActionLoading(null); }
  };

  // === TAMBAH AGENDA ===
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const isNasional = formData.pelaksana === 'Nasional' || formData.pelaksana === 'Pusat';
    
    if (isNasional && !formData.nama.trim()) { 
      setFormError('Nama agenda nasional tidak boleh kosong.'); return; 
    }
    if (!isNasional && !formData.jenis_aktivitas) {
      setFormError('Pilih jenis aktivitas terlebih dahulu.'); return;
    }
    if (showCustomInput && !formData.tema_custom.trim()) {
      setFormError('Tulis tema terlebih dahulu.'); return;
    }

    setFormLoading(true); setFormError('');
    try {
      const res = await fetch('/api/admin/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          tanggal: formData.pelaksana === 'Wilayah' ? '' : formData.tanggal,
          pelaksana: formData.pelaksana,
          jenis_aktivitas: (formData.pelaksana === 'Nasional' || formData.pelaksana === 'Pusat') ? 'Tematik' : formData.jenis_aktivitas,
          tema: finalTema,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || 'Gagal.'); return; }
      setAgendas(prev => [data.agenda, ...prev]);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
    } catch { setFormError('Terjadi kesalahan. Coba lagi.'); }
    finally { setFormLoading(false); }
  };

  // === HAPUS AGENDA ===
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      const res = await fetch('/api/admin/agenda', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_agenda: deleteTarget.id }),
      });
      if (!res.ok) { alert((await res.json()).message || 'Gagal.'); return; }
      setAgendas(prev => prev.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { alert('Terjadi kesalahan. Coba lagi.'); }
    finally { setActionLoading(null); }
  };

  // === HAPUS SATU ENTRI ABSENSI (dengan verifikasi password) ===
  const handleDeleteAbsensi = async () => {
    if (!deleteAbsensiTarget || !deleteAbsensiPassword.trim()) {
      setDeleteAbsensiError('Password tidak boleh kosong.');
      return;
    }
    setDeleteAbsensiLoading(true);
    setDeleteAbsensiError('');
    try {
      const { absensi, type } = deleteAbsensiTarget;
      const res = await fetch('/api/admin/absensi/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_etoser: absensi.id_etoser,
          id_agenda: viewTarget.id,
          timestamp: absensi.timestamp,
          password: deleteAbsensiPassword,
          type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteAbsensiError(data.message || 'Gagal menghapus.');
        return;
      }
      // Hapus dari state lokal
      setAbsensiList(prev => prev.filter(a => a !== absensi));
      setDeleteAbsensiTarget(null);
      setDeleteAbsensiPassword('');
    } catch {
      setDeleteAbsensiError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setDeleteAbsensiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* === HEADER PANEL === */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-orange-500" />
              Manajemen Agenda Pembinaan
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Buat agenda, aktifkan form absensi, dan lihat daftar kehadiran.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowAddModal(true); setFormError(''); setFormData(EMPTY_FORM); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Agenda
            </button>
          </div>
        </div>
      </div>

      {/* === TABEL AGENDA NASIONAL === */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-purple-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black text-purple-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            Daftar Agenda Nasional
          </h3>
          <a
            href="/absen-pembinaan" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-purple-600 text-[11px] font-bold hover:bg-purple-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Lihat Form Nasional
          </a>
        </div>
        {agendas.filter(a => a.pelaksana === 'Nasional' || a.pelaksana === 'Pusat').length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 text-xs italic">Belum ada agenda nasional yang dibuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-purple-900/50">Nama Agenda</th>
                  <th className="px-5 py-3">Tema</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agendas.filter(a => a.pelaksana === 'Nasional' || a.pelaksana === 'Pusat').map(agenda => (
                  <tr key={agenda.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-800">{agenda.nama}</p>
                    </td>
                    <td className="px-5 py-4">
                      {agenda.tema ? (
                        <span className="inline-flex text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {agenda.tema}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs font-medium">
                      {agenda.tanggal || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <AgendaStatusBadge isActive={agenda.is_active} />
                    </td>
                    <td className="px-5 py-4">
                      <AgendaActionButtons 
                        agenda={agenda} 
                        actionLoading={actionLoading} 
                        handleToggle={handleToggle} 
                        setViewTarget={setViewTarget} 
                        setDeleteTarget={setDeleteTarget} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === TABEL AGENDA WILAYAH === */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Daftar Agenda Wilayah
          </h3>
          <a
            href="/absen-wilayah" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 text-[11px] font-bold hover:bg-blue-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Lihat Form Wilayah
          </a>
        </div>
        {agendas.filter(a => a.pelaksana === 'Wilayah').length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 text-xs italic">Belum ada agenda wilayah yang dibuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-blue-900/50">Jenis Aktivitas</th>
                  <th className="px-5 py-3">Tema Rekomendasi</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agendas.filter(a => a.pelaksana === 'Wilayah').map(agenda => (
                  <tr key={agenda.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-800">{agenda.nama}</p>
                    </td>
                    <td className="px-5 py-4">
                      {agenda.tema ? (
                        <span className="text-[11px] text-gray-500 italic">
                          {agenda.tema}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <AgendaStatusBadge isActive={agenda.is_active} />
                    </td>
                    <td className="px-5 py-4">
                      <AgendaActionButtons 
                        agenda={agenda} 
                        actionLoading={actionLoading} 
                        handleToggle={handleToggle} 
                        setViewTarget={setViewTarget} 
                        setDeleteTarget={setDeleteTarget} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH AGENDA                                          */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="font-black text-gray-800">Tambah Agenda Pembinaan</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Nama — Hanya untuk Nasional */}
              {(formData.pelaksana === 'Nasional' || formData.pelaksana === 'Pusat') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Nama Agenda <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.nama}
                    onChange={e => setFormData(p => ({ ...p, nama: e.target.value }))}
                    placeholder="Contoh: Pembinaan Nasional 2025 - Sesi 1"
                    className={INPUT_CLS} required
                  />
                </div>
              )}

              {/* Pelaksana */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Pelaksana</label>
                <div className="flex gap-2">
                  {['Nasional', 'Wilayah'].map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setPelaksana(opt)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        (formData.pelaksana === opt || (opt === 'Nasional' && formData.pelaksana === 'Pusat'))
                          ? opt === 'Nasional'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jenis Aktivitas — hanya muncul jika Wilayah */}
              {formData.pelaksana === 'Wilayah' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Jenis Aktivitas <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.jenis_aktivitas} onChange={e => setJenis(e.target.value)} className={SELECT_CLS}>
                    <option value="">— Pilih Jenis Aktivitas —</option>
                    {JENIS_WILAYAH.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
              )}

              {/* Values Category — hanya muncul jika Bedah Values */}
              {showValuesCategory && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Kategori Values <span className="text-red-500">*</span>
                  </label>
                  <select value={formData.values_category} onChange={e => setValuesCategory(e.target.value)} className={SELECT_CLS}>
                    <option value="">— Pilih Kategori —</option>
                    {VALUES_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Dropdown Tema — Nasional (bebas) atau Wilayah sesuai jenis */}
              {(formData.pelaksana === 'Nasional' || formData.pelaksana === 'Pusat') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tema</label>
                  <input type="text" value={formData.tema}
                    onChange={e => setFormData(p => ({ ...p, tema: e.target.value }))}
                    placeholder="Tulis tema pembinaan..."
                    className={INPUT_CLS}
                  />
                </div>
              )}

              {showTopicDropdown && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Rekomendasi Tema
                  </label>
                  <select value={formData.tema} onChange={e => setTema(e.target.value)} className={SELECT_CLS}>
                    <option value="">— Pilih Tema —</option>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {/* Input bebas jika "Lain-lain" */}
              {showCustomInput && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Tulis Tema Lain <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formData.tema_custom}
                    onChange={e => setFormData(p => ({ ...p, tema_custom: e.target.value }))}
                    placeholder="Tulis tema sendiri..."
                    className={INPUT_CLS}
                  />
                </div>
              )}

              {/* Tanggal */}
              {(formData.pelaksana === 'Nasional' || formData.pelaksana === 'Pusat') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tanggal</label>
                  <input type="date" value={formData.tanggal}
                    onChange={e => setFormData(p => ({ ...p, tanggal: e.target.value }))}
                    className={`${INPUT_CLS} ${!formData.tanggal ? 'text-gray-400' : 'text-gray-800'}`}
                  />
                </div>
              )}

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{formError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-bold transition-colors"
                >
                  {formLoading ? 'Menyimpan...' : 'Buat Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS                                       */}
      {/* ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-gray-800 mb-2">Hapus Agenda?</h3>
            <p className="text-sm text-gray-500 mb-2">
              Agenda <span className="font-bold text-gray-700">{deleteTarget.nama}</span> akan dihapus permanen.
            </p>
            {deleteTarget.is_active && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-left">
                <p className="text-xs font-bold text-amber-700">
                  Perhatian: Agenda ini sedang aktif. Menghapusnya akan menonaktifkan form absensi publik.
                </p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button onClick={handleDelete} disabled={actionLoading === deleteTarget.id}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-bold transition-colors"
              >
                {actionLoading === deleteTarget.id ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DAFTAR ABSENSI                                         */}
      {/* ============================================================ */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-black text-gray-800">Daftar Absensi</h3>
                <p className="text-sm text-gray-700 font-bold mt-0.5">{viewTarget.nama}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <AgendaBadge pelaksana={viewTarget.pelaksana} jenis_aktivitas={viewTarget.jenis_aktivitas} />
                  {viewTarget.tema && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                      📌 {viewTarget.tema}
                    </span>
                  )}
                  {viewTarget.tanggal && (
                    <span className="text-xs text-gray-400">{viewTarget.tanggal}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten */}
            <div className="overflow-y-auto flex-1">
              {absensiLoading ? (
                <div className="py-12 text-center">
                  <svg className="animate-spin w-6 h-6 text-orange-400 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-400 text-sm mt-2">Mengambil data...</p>
                </div>
              ) : absensiList.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Belum ada yang absen di agenda ini.</p>
                </div>
              ) : (
                <div>
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500">{absensiList.length} peserta hadir</p>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-3">#</th>
                        <th className="px-5 py-3">Nama Etoser</th>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3 text-center">Angkatan</th>
                        <th className="px-5 py-3">Wilayah</th>
                        {viewTarget.pelaksana === 'Wilayah' && (
                          <>
                            <th className="px-5 py-3 text-orange-600">Tgl Agenda</th>
                            <th className="px-5 py-3">Oleh Fasil</th>
                          </>
                        )}
                        <th className="px-5 py-3">Waktu Input</th>
                        <th className="px-5 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {absensiList.map((a, i) => (
                        <tr key={i} className="hover:bg-red-50/30 group">
                          <td className="px-5 py-3 text-gray-400 text-xs text-center">{i + 1}</td>
                          <td className="px-5 py-3 font-bold text-gray-800">{a.nama}</td>
                          <td className="px-5 py-4 text-gray-600 font-mono text-xs">{a.id_etoser}</td>
                          <td className="px-5 py-3 text-gray-600 text-center">{a.angkatan}</td>
                          <td className="px-5 py-3 text-gray-600">{a.wilayah}</td>
                          {viewTarget.pelaksana === 'Wilayah' && (
                            <>
                              <td className="px-5 py-3 text-orange-600 font-bold text-xs">{a.tanggal_pelaksanaan || '—'}</td>
                              <td className="px-5 py-3 text-gray-500 text-xs">{a.nama_fasil || a.id_fasil || '—'}</td>
                            </>
                          )}
                          <td className="px-5 py-3 text-gray-400 text-[11px] leading-tight">{a.timestamp}</td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => {
                                setDeleteAbsensiTarget({
                                  absensi: a,
                                  type: viewTarget.pelaksana === 'Wilayah' ? 'wilayah' : 'nasional',
                                });
                                setDeleteAbsensiPassword('');
                                setDeleteAbsensiError('');
                              }}
                              title="Hapus absensi ini"
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setViewTarget(null)}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS ABSENSI (dengan verifikasi password)  */}
      {/* ============================================================ */}
      {deleteAbsensiTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {/* Icon */}
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="font-black text-gray-800 text-center mb-1">Hapus Data Absensi?</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Kamu akan menghapus absensi{' '}
              <span className="font-bold text-gray-700">{deleteAbsensiTarget.absensi.nama}</span>
              {' '}({deleteAbsensiTarget.absensi.id_etoser}).
            </p>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-xs font-bold text-amber-700">
                ⚠️ Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>
            </div>

            {/* Input Password */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Verifikasi Password Akun Admin
              </label>
              <input
                type="password"
                value={deleteAbsensiPassword}
                onChange={(e) => { setDeleteAbsensiPassword(e.target.value); setDeleteAbsensiError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleDeleteAbsensi()}
                placeholder="Masukkan password akunmu..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none text-sm text-gray-800 placeholder:text-gray-400"
                autoFocus
              />
              {deleteAbsensiError && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  {deleteAbsensiError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setDeleteAbsensiTarget(null); setDeleteAbsensiPassword(''); setDeleteAbsensiError(''); }}
                disabled={deleteAbsensiLoading}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAbsensi}
                disabled={deleteAbsensiLoading || !deleteAbsensiPassword.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-bold transition-colors"
              >
                {deleteAbsensiLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
