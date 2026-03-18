// src/app/fasil/dashboard/FasilClient.js
'use client';
import { useState } from 'react';
import { Loader2, CheckCircle2, UserCheck, ChevronRight, Star, AlertTriangle, Lock, Plus, Trash2, BadgeCheck } from 'lucide-react';

// --- KOMPONEN BINTANG INTERAKTIF FASIL ---
const FasilStarRating = ({ kode, currentValue, onChange }) => {
  const [hover, setHover] = useState(0);
  const labels = ['Sangat Kurang (Butuh Intervensi)', 'Kurang (Inkonsisten)', 'Baik (Sesuai Harapan)', 'Sangat Baik (Role Model)'];
  const activeValue = hover || currentValue;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((starVal) => (
          <button
            key={starVal} type="button"
            className={`p-1.5 transition-all duration-200 transform ${starVal <= activeValue ? 'text-blue-500 scale-110 drop-shadow-md' : 'text-gray-200 hover:text-blue-200'}`}
            onMouseEnter={() => setHover(starVal)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(kode, starVal)}
          >
            <Star className={`w-8 h-8 md:w-10 md:h-10 ${starVal <= activeValue ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
      <div className="h-6 flex items-center">
        {activeValue > 0 && (
          <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full animate-in fade-in zoom-in-95">
            {labels[activeValue - 1]}
          </span>
        )}
      </div>
    </div>
  );
};

const indikatorFasil = [
  { kode: 'Integritas', label: 'Integritas', desc: 'PM menunjukkan kedisiplinan (kehadiran & komitmen tugas), kejujuran, serta menjaga adab dan etika komunikasi yang baik selama proses pembinaan.' },
  { kode: 'Profesional', label: 'Profesional', desc: 'PM menunjukkan sikap proaktif, responsif saat dihubungi, dan memiliki progres yang jelas terhadap target akademik maupun pengembangan skill-nya.' },
  { kode: 'Kontributif', label: 'Kontributif', desc: 'PM menunjukkan kepedulian dengan bersedia membantu rekan sekelompoknya dan aktif mengambil peran dalam agenda kebersamaan/sosial.' },
  { kode: 'Transformatif', label: 'Transformatif', desc: 'PM bersikap terbuka terhadap feedback (saran/kritik), tangguh mencari solusi saat menghadapi kendala, dan menunjukkan perbaikan kualitas diri.' },
];

export default function FasilClient({ user, listPM, statusForm, pesanStatus, dataSanksi = [] }) {
  const [selectedPM, setSelectedPM] = useState(null);
  const [jawaban, setJawaban] = useState({});
  const [rekomendasi, setRekomendasi] = useState('');
  const [catatanKualitatif, setCatatanKualitatif] = useState('');
  const [listSanksi, setListSanksi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  // Daftar kategori unik dari dataSanksi
  const kategoriList = [...new Set(dataSanksi.map(s => s.kategori))];

  const getDetailsForKategori = (kategori) =>
    dataSanksi.filter(s => s.kategori === kategori);

  const handlePilihPM = (pm) => {
    setSelectedPM(pm);
    setJawaban({});
    setRekomendasi('');
    setCatatanKualitatif('');
    setListSanksi([]);
    setSukses(false);
  };

  const handleSkorChange = (kode, num) => {
    setJawaban(p => ({ ...p, [kode]: { ...p[kode], skor: num, catatan: p[kode]?.catatan || '' } }));
  };

  const handleRekomendasiChange = (val) => {
    setRekomendasi(val);
    if (val !== 'Unacceptable (Sangat Kurang)') {
      setListSanksi([]);
    }
  };

  // --- Handler Sanksi ---
  const tambahSanksi = () => {
    setListSanksi(p => [...p, { kategori: '', detail: '', masa_perbaikan: '', poin: 0 }]);
  };

  const hapusSanksi = (idx) => {
    setListSanksi(p => p.filter((_, i) => i !== idx));
  };

  const updateKategori = (idx, kategori) => {
    setListSanksi(p => p.map((s, i) =>
      i === idx ? { kategori, detail: '', masa_perbaikan: '', poin: 0 } : s
    ));
  };

  const updateDetail = (idx, detail) => {
    const entry = listSanksi[idx];
    const sanksiItem = dataSanksi.find(s => s.kategori === entry.kategori && s.detail === detail);
    setListSanksi(p => p.map((s, i) =>
      i === idx ? { ...s, detail, masa_perbaikan: sanksiItem?.masa_perbaikan || '', poin: sanksiItem?.poin || 0 } : s
    ));
  };

  const totalPoin = listSanksi.reduce((sum, s) => sum + (s.poin || 0), 0);
  const isUnacceptable = rekomendasi === 'Unacceptable (Sangat Kurang)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(jawaban).length < 4 || !rekomendasi) {
      alert('Harap isi semua 4 indikator skor dan pilih Kesimpulan Rekomendasi!'); return;
    }
    if (isUnacceptable && listSanksi.length === 0) {
      alert('Harap tambahkan minimal 1 keterangan sanksi untuk rekomendasi Unacceptable!'); return;
    }
    if (isUnacceptable && listSanksi.some(s => !s.kategori || !s.detail)) {
      alert('Harap lengkapi semua data sanksi (kategori & detail pelanggaran)!'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/submit-fasil', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_fasil: user.id,
          id_etoser_dinilai: selectedPM.id,
          jawaban,
          rekomendasi,
          catatan_kualitatif: catatanKualitatif,
          sanksi: isUnacceptable ? listSanksi : [],
          total_poin: isUnacceptable ? totalPoin : 0,
        })
      });
      if (res.ok) {
        setSukses(true);
        setTimeout(() => { setSelectedPM(null); setSukses(false); setListSanksi([]); }, 3000);
      } else alert('Gagal mengirim data!');
    } catch (err) { alert('Terjadi kesalahan jaringan.'); } finally { setLoading(false); }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">

      {/* --- KOLOM KIRI: DAFTAR PM --- */}
      <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
        <div className="bg-blue-600 p-4 text-white font-bold flex items-center gap-2">
          <UserCheck className="w-5 h-5" /> Daftar Etoser
        </div>
        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
          {listPM.map(pm => (
            <button
              key={pm.id} onClick={() => handlePilihPM(pm)}
              className={`w-full text-left p-4 hover:bg-blue-50 transition-colors flex justify-between items-center ${
                selectedPM?.id === pm.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
            >
              <div>
                <p className="font-bold text-gray-800 text-sm">{pm.nama}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <p className="text-xs text-gray-500 font-medium">{pm.id}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    pm.sudah_lapor ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {pm.sudah_lapor ? '✓ Sudah Lapor' : 'X Belum Lapor'}
                  </span>
                  {pm.sudah_dinilai && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-0.5">
                      <BadgeCheck className="w-3 h-3" /> Sudah Dinilai
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 ${selectedPM?.id === pm.id ? 'text-blue-600' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* --- KOLOM KANAN: AREA EVALUASI --- */}
      <div className="md:col-span-2">
        {/* KONDISI 1: Di luar tanggal 25-7 (Form Tutup) */}
        {statusForm !== 'OPEN' ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-12 text-center text-gray-800 flex flex-col items-center justify-center h-full min-h-[400px]">
            <Lock className="w-16 h-16 mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">Masa Evaluasi Ditutup</h3>
            <p className="font-medium text-gray-500 max-w-sm">{pesanStatus}</p>
          </div>
        )

        /* KONDISI 2: Belum milih nama PM */
        : !selectedPM ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[400px]">
            <UserCheck className="w-16 h-16 mb-4 text-gray-200" />
            <p className="font-medium">Silakan pilih nama Etoser di daftar samping untuk mulai mengisi Peer-Review.</p>
          </div>
        )

        /* KONDISI 3: PM sudah dinilai bulan ini (tidak bisa dinilai ulang) */
        : selectedPM.sudah_dinilai ? (
          <div className="bg-teal-50 rounded-2xl border border-teal-200 p-8 md:p-12 text-center text-teal-900 flex flex-col items-center justify-center h-full min-h-[400px] animate-in zoom-in-95">
            <BadgeCheck className="w-20 h-20 mb-5 text-teal-500 drop-shadow-sm" />
            <h3 className="text-2xl font-bold mb-3">Evaluasi Sudah Selesai</h3>
            <p className="font-medium mb-6 leading-relaxed max-w-md text-teal-700">
              Kamu sudah menilai <span className="text-teal-900 font-bold bg-teal-200/50 px-2 rounded">{selectedPM.nama}</span> pada periode ini.<br /><br />
              Setiap PM hanya dapat dinilai satu kali per periode evaluasi.
            </p>
            <div className="bg-teal-100/80 text-teal-800 font-semibold py-3.5 px-6 rounded-xl border border-teal-200 flex items-center justify-center gap-2 shadow-sm">
              ✅ Penilaian telah tercatat di database pusat.
            </div>
          </div>
        )

        /* KONDISI 4: PM belum isi laporan (Form Diblokir) */
        // (kondisi ini hanya tercapai jika sudah_dinilai = false)
        : !selectedPM.sudah_lapor ? (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 md:p-12 text-center text-amber-900 flex flex-col items-center justify-center h-full min-h-[400px] animate-in zoom-in-95">
            <AlertTriangle className="w-20 h-20 mb-5 text-amber-500 drop-shadow-sm" />
            <h3 className="text-2xl font-bold mb-3">Akses Evaluasi Terkunci</h3>
            <p className="font-medium mb-6 leading-relaxed max-w-md text-amber-700">
              <span className="text-amber-900 font-bold bg-amber-200/50 px-2 rounded">{selectedPM.nama}</span> belum mengirimkan Laporan Bulanannya. <br/><br/>
              Sesuai aturan, Fasilitator baru dapat mengisi Peer-Review setelah PM yang bersangkutan menyelesaikan laporannya.
            </p>
            <div className="bg-amber-100/80 text-amber-800 font-semibold py-3.5 px-6 rounded-xl border border-amber-200 flex items-center justify-center gap-2 shadow-sm">
              💡 Silakan hubungi PM secara personal untuk mengingatkan.
            </div>
          </div>
        )

        /* KONDISI 5: PM sudah lapor, form siap diisi */
        : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-4 mb-6 flex justify-between items-center">
              <span>Evaluasi: <span className="text-blue-600">{selectedPM.nama}</span></span>
              <span className="text-sm font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4"/> Siap Dinilai
              </span>
            </h2>

            {sukses ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-24 h-24 text-green-500 mb-6 animate-bounce" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Evaluasi Tersimpan!</h3>
                <p className="text-gray-500 font-medium">Data penilaian untuk {selectedPM.nama} telah masuk ke database pusat.</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800 shadow-sm">
                  <strong>Panduan Skor:</strong> 1 = Sangat Kurang (Butuh Intervensi), 2 = Kurang (Inkonsisten), 3 = Baik (Sesuai Harapan), 4 = Sangat Baik (Role Model).
                  <br /><em className="mt-1 block text-red-600 font-medium">⚠️ Wajib mengisi catatan bukti observasi jika memberikan skor 1 atau 4.</em>
                </div>

                <div className="space-y-6">
                  {indikatorFasil.map((ind) => {
                    const skorSaatIni = jawaban[ind.kode]?.skor || 0;
                    const butuhCatatan = skorSaatIni === 1 || skorSaatIni === 4;

                    return (
                      <div key={ind.kode} className="p-5 border border-gray-100 bg-gray-50/50 rounded-2xl hover:shadow-md transition-shadow">
                        <p className="font-bold text-gray-800 text-lg">{ind.label}</p>
                        <p className="text-sm text-gray-500 mb-2">{ind.desc}</p>

                        <FasilStarRating kode={ind.kode} currentValue={skorSaatIni} onChange={handleSkorChange} />

                        {butuhCatatan && (
                          <div className="mt-5 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-4">
                            <label className="block text-sm font-semibold text-red-600 mb-2">
                              ✍️ Wajib berikan alasan/bukti untuk skor {skorSaatIni}:
                            </label>
                            <input
                              type="text" required placeholder="Tuliskan catatan observasimu di sini..."
                              className="w-full px-4 py-3 text-sm border border-red-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl text-gray-900 bg-white placeholder:text-gray-400 font-medium transition-all shadow-sm"
                              value={jawaban[ind.kode]?.catatan || ''}
                              onChange={(e) => setJawaban(p => ({ ...p, [ind.kode]: { ...p[ind.kode], skor: skorSaatIni, catatan: e.target.value } }))}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 pt-8 border-t-2 border-dashed border-gray-200">
                  <label className="block font-bold text-gray-900 mb-3 text-lg">Kesimpulan & Rekomendasi</label>
                  <select
                    required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold mb-6 shadow-sm cursor-pointer"
                    value={rekomendasi} onChange={(e) => handleRekomendasiChange(e.target.value)}
                  >
                    <option value="" disabled>-- Pilih Rekomendasi Tindak Lanjut --</option>
                    <option value="Unacceptable (Sangat Kurang)">Unacceptable (Sangat Kurang)</option>
                    <option value="Below Expectation (Kurang)">Below Expectation (Kurang)</option>
                    <option value="Meets Expectation (Sesuai)">Meets Expectation (Sesuai)</option>
                    <option value="Exceeds Expectation (Sangat Baik)">Exceeds Expectation (Sangat Baik)</option>
                    <option value="Outstanding (Luar Biasa)">Outstanding (Luar Biasa)</option>
                  </select>

                  {/* --- BAGIAN SANKSI (hanya muncul jika Unacceptable) --- */}
                  {isUnacceptable && (
                    <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h3 className="font-bold text-red-800 text-base">Keterangan Sanksi <span className="text-red-500">(Wajib)</span></h3>
                        </div>
                        <button
                          type="button" onClick={tambahSanksi}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Tambah Sanksi
                        </button>
                      </div>

                      {listSanksi.length === 0 && (
                        <p className="text-red-600 text-sm font-medium text-center py-5 bg-red-100/50 rounded-xl border border-red-200 border-dashed">
                          Klik &quot;Tambah Sanksi&quot; untuk mencatat pelanggaran. Minimal 1 sanksi wajib ditambahkan.
                        </p>
                      )}

                      <div className="space-y-4">
                        {listSanksi.map((sanksi, idx) => {
                          const detailOptions = getDetailsForKategori(sanksi.kategori);
                          return (
                            <div key={idx} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-red-700">Sanksi #{idx + 1}</span>
                                <button
                                  type="button" onClick={() => hapusSanksi(idx)}
                                  className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori Pelanggaran</label>
                                  <select
                                    value={sanksi.kategori}
                                    onChange={(e) => updateKategori(idx, e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-300 outline-none bg-white text-gray-900 cursor-pointer"
                                  >
                                    <option value="" disabled>-- Pilih Kategori --</option>
                                    {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
                                  </select>
                                </div>

                                {sanksi.kategori && (
                                  <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Detail Pelanggaran</label>
                                    <select
                                      value={sanksi.detail}
                                      onChange={(e) => updateDetail(idx, e.target.value)}
                                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-300 outline-none bg-white text-gray-900 cursor-pointer"
                                    >
                                      <option value="" disabled>-- Pilih Detail Pelanggaran --</option>
                                      {detailOptions.map(d => <option key={d.detail} value={d.detail}>{d.detail}</option>)}
                                    </select>
                                  </div>
                                )}

                                {sanksi.detail && (
                                  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                      <p className="text-xs text-gray-500 font-medium mb-0.5">Masa Perbaikan</p>
                                      <p className="text-sm font-bold text-gray-800">{sanksi.masa_perbaikan}</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                      <p className="text-xs text-red-600 font-medium mb-0.5">Poin Pelanggaran</p>
                                      <p className="text-sm font-bold text-red-800">{sanksi.poin} poin</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {listSanksi.length > 0 && (
                        <div className="mt-4 flex items-center justify-between bg-red-100 border border-red-300 rounded-xl px-4 py-3">
                          <span className="font-bold text-red-800">Total Poin Pelanggaran</span>
                          <span className="text-xl font-black text-red-700 bg-white border border-red-300 px-4 py-1 rounded-lg shadow-sm">{totalPoin} poin</span>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="block font-bold text-gray-900 mb-3 text-lg">Catatan Kualitatif Tambahan</label>
                  <textarea
                    rows={4} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white mb-8 placeholder:text-gray-400 font-medium shadow-sm"
                    placeholder="Deskripsikan kondisi mental, keluarga, atau kendala PM yang diamati bulan ini..."
                    value={catatanKualitatif} onChange={(e) => setCatatanKualitatif(e.target.value)}
                  />

                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 text-lg active:scale-95 disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin w-6 h-6" /> : null}
                    {loading ? 'Menyimpan ke Database...' : 'Simpan Evaluasi PM'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
