// src/app/fasil/dashboard/FasilClient.js
'use client';
import { useState } from 'react';
import { Loader2, CheckCircle2, UserCheck, ChevronRight, Star, AlertTriangle, Lock } from 'lucide-react';

// --- KOMPONEN BINTANG INTERAKTIF FASIL ---
const FasilStarRating = ({ kode, currentValue, onChange }) => {
  const [hover, setHover] = useState(0);
  const labels = ['Sangat Kurang', 'Kurang', 'Baik', 'Sangat Baik'];
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
  { kode: 'Adab', label: 'Integritas & Adab', desc: 'PM menunjukkan adab, kesopanan, dan akhlak Islami yang baik.' },
  { kode: 'Ibadah', label: 'Integritas Ibadah', desc: 'PM konsisten menjaga shalat wajib, tilawah, dan menjauhi pelanggaran syariat.' },
  { kode: 'Komitmen', label: 'Komitmen Pembinaan', desc: 'PM menunjukkan antusiasme, kehadiran disiplin, dan mengerjakan tugas.' },
  { kode: 'Profesional', label: 'Daya Juang (Profesional)', desc: 'PM proaktif mengembangkan diri (aktif kampus, lomba, karier).' },
  { kode: 'Transformatif', label: 'Jiwa Sosial (Transformatif)', desc: 'PM berkontribusi nyata dan kooperatif di social project wilayah.' },
];

export default function FasilClient({ user, listPM, statusForm, pesanStatus }) {
  const [selectedPM, setSelectedPM] = useState(null);
  const [jawaban, setJawaban] = useState({});
  const [rekomendasi, setRekomendasi] = useState('');
  const [catatanKualitatif, setCatatanKualitatif] = useState('');
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  const handlePilihPM = (pm) => {
    setSelectedPM(pm);
    setJawaban({}); setRekomendasi(''); setCatatanKualitatif(''); setSukses(false);
  };

  const handleSkorChange = (kode, num) => {
    setJawaban(p => ({ ...p, [kode]: { ...p[kode], skor: num, catatan: p[kode]?.catatan || '' } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(jawaban).length < 5 || !rekomendasi) {
      alert('Harap isi semua 5 indikator skor dan pilih Kesimpulan Rekomendasi!'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/submit-fasil', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_fasil: user.id, id_etoser_dinilai: selectedPM.id, jawaban, rekomendasi, catatan_kualitatif: catatanKualitatif })
      });
      if (res.ok) {
        setSukses(true);
        setTimeout(() => { setSelectedPM(null); setSukses(false); }, 3000);
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
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-xs text-gray-500 font-medium">{pm.id}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    pm.sudah_lapor ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {pm.sudah_lapor ? '✓ Sudah Lapor' : 'X Belum Lapor'}
                  </span>
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
        
        /* KONDISI 3: PM belum isi laporan (Form Diblokir) */
        : !selectedPM.sudah_lapor ? (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-8 md:p-12 text-center text-amber-900 flex flex-col items-center justify-center h-full min-h-[400px] animate-in zoom-in-95">
            <AlertTriangle className="w-20 h-20 mb-5 text-amber-500 drop-shadow-sm" />
            <h3 className="text-2xl font-bold mb-3">Akses Evaluasi Terkunci</h3>
            <p className="font-medium mb-6 leading-relaxed max-w-md text-amber-700">
              <span className="text-amber-900 font-bold bg-amber-200/50 px-2 rounded">{selectedPM.nama}</span> belum mengirimkan Laporan Bulanannya. <br/><br/>
              Sesuai aturan, Fasilitator baru dapat mengisi Peer-Review setelah PM yang bersangkutan menyelesaikan laporannya.
            </p>
            {/* INI BAGIAN YANG DIUBAH JADI TEKS STATIS */}
            <div className="bg-amber-100/80 text-amber-800 font-semibold py-3.5 px-6 rounded-xl border border-amber-200 flex items-center justify-center gap-2 shadow-sm">
              💡 Silakan hubungi PM secara personal untuk mengingatkan.
            </div>
          </div>
        ) 
        
        /* KONDISI 4: PM sudah lapor, form siap diisi */
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
                  <strong>Panduan Skor:</strong> 1 (Sangat Kurang), 2 (Kurang), 3 (Baik / Sesuai Standar), 4 (Sangat Baik / Role Model).
                  <br /><em className="mt-1 block text-red-600 font-medium">⚠️ Wajib mengisi catatan bukti observasi jika memberikan skor ekstrem (1 atau 4).</em>
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
                    value={rekomendasi} onChange={(e) => setRekomendasi(e.target.value)}
                  >
                    <option value="" disabled>-- Pilih Rekomendasi Tindak Lanjut --</option>
                    <option value="Sangat Direkomendasikan Lanjut">Sangat Direkomendasikan Lanjut</option>
                    <option value="Lanjut dengan Catatan Biasa">Lanjut dengan Catatan Biasa</option>
                    <option value="Perlu Pendampingan Khusus">Perlu Pendampingan Khusus (Beresiko)</option>
                    <option value="Diberikan Surat Peringatan (SP)">Diberikan Surat Peringatan (SP)</option>
                  </select>

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