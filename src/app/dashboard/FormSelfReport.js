// src/app/dashboard/FormSelfReport.js
'use client';
import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Star } from 'lucide-react';

// --- KOMPONEN BINTANG INTERAKTIF ---
const StarRating = ({ kode, jenisSkala, currentValue, onChange }) => {
  const [hover, setHover] = useState(0);

  // Menentukan label dinamis berdasarkan jenis skala dari database
  const getLabels = (jenis) => {
    switch (jenis) {
      case 'Frekuensi': return ['Tidak Pernah', 'Jarang', 'Sering', 'Selalu'];
      case 'Intensitas': return ['Tidak Ada', 'Rendah (1x)', 'Sedang (2-3x)', 'Tinggi (>3x)'];
      case 'Persetujuan': return ['Sangat Tidak Setuju', 'Tidak Setuju', 'Setuju', 'Sangat Setuju'];
      case 'Kemampuan': return ['Tidak Mampu', 'Mampu', 'Sangat Mampu', 'Luar Biasa'];
      default: return ['Skor 1', 'Skor 2', 'Skor 3', 'Skor 4'];
    }
  };

  const labels = getLabels(jenisSkala);
  const activeValue = hover || currentValue;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((starVal) => (
          <button
            key={starVal}
            type="button"
            className={`p-1.5 transition-all duration-200 transform ${
              starVal <= activeValue 
                ? 'text-yellow-400 scale-110 drop-shadow-md' 
                : 'text-gray-200 hover:text-yellow-200'
            }`}
            onMouseEnter={() => setHover(starVal)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(kode, starVal)}
          >
            <Star className={`w-8 h-8 md:w-10 md:h-10 ${starVal <= activeValue ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
      
      {/* Label Teks Dinamis */}
      <div className="h-6 flex items-center">
        {activeValue > 0 && (
          <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full animate-in fade-in zoom-in-95">
            {labels[activeValue - 1]}
          </span>
        )}
      </div>
    </div>
  );
};

// --- KOMPONEN FORM UTAMA ---
export default function FormSelfReport({ instrumen, user, tahunPembinaan, periode }) {
  const [jawaban, setJawaban] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '' });

  const handleSkorChange = (kode, nilai) => {
    setJawaban(prev => ({
      ...prev,
      [kode]: { ...prev[kode], skor: nilai, val: prev[kode]?.val || '' }
    }));
  };

  const handleValChange = (kode, teks) => {
    setJawaban(prev => ({
      ...prev,
      [kode]: { ...prev[kode], val: teks, skor: prev[kode]?.skor || '' }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi Kelengkapan
    const missingFields = [];
    instrumen.forEach(item => {
      const skor = jawaban[item.kode]?.skor;
      
      if (!skor) {
        missingFields.push(item.kode);
      } else {
        const perluValidasi = item.validasi !== '-' && item.validasi !== '' && skor > 1;
        const teksVal = jawaban[item.kode]?.val;
        if (perluValidasi && (!teksVal || teksVal.trim() === '')) {
          missingFields.push(`${item.kode} (Teks Isian)`);
        }
      }
    });

    if (missingFields.length > 0) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Data Belum Lengkap!',
        message: `Tolong lengkapi pertanyaan berikut sebelum mengirim: ${missingFields.join(', ')}`
      });
      return;
    }
    
    setModal({
      isOpen: true, type: 'loading', title: 'Mengirim Laporan...',
      message: 'Mohon tunggu sebentar, data sedang disimpan ke server.'
    });
    
    try {
      const res = await fetch('/api/submit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_etoser: user.id,
          tahun_pembinaan: tahunPembinaan,
          periode: periode,
          jawaban: jawaban
        })
      });

      if (res.ok) {
        setModal({
          isOpen: true, type: 'success', title: 'Berhasil!',
          message: 'Laporan Bulananmu berhasil dikirim. Terima kasih!'
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal', message: 'Gagal mengirim laporan.' });
      }
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error Jaringan', message: 'Pastikan koneksimu stabil.' });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border rounded-xl p-4 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Jawablah pernyataan berikut berdasarkan apa yang kamu lakukan/rasakan DALAM SATU BULAN TERAKHIR</h2>
          
          {instrumen.map((item) => {
            const skorSaatIni = jawaban[item.kode]?.skor || 0;
            const perluValidasi = item.validasi !== '-' && item.validasi !== '' && skorSaatIni > 1;

            return (
              <div key={item.kode} className="mb-8 p-5 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex gap-3 mb-3">
                  <span className="bg-green-600 text-white px-2.5 py-1 rounded text-xs font-bold h-fit shadow-sm">
                    {item.kode}
                  </span>
                  <p className="font-medium text-gray-800 text-sm md:text-base leading-relaxed">
                    {item.item}
                  </p>
                </div>

                {/* Komponen Bintang Gantikan Radio Button */}
                <StarRating 
                  kode={item.kode}
                  jenisSkala={item.jenisSkala}
                  currentValue={skorSaatIni}
                  onChange={handleSkorChange}
                />

                {perluValidasi && (
                  <div className="mt-5 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <label className="block text-sm font-semibold text-blue-800 mb-2">
                      ✍️ {item.validasi}
                    </label>
                    <textarea
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder:text-gray-400 font-medium transition-shadow"
                      placeholder="Tuliskan jawabanmu di sini..."
                      value={jawaban[item.kode]?.val || ''}
                      onChange={(e) => handleValChange(item.kode, e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={modal.type === 'loading'}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 text-lg"
        >
          {modal.type === 'loading' ? <Loader2 className="animate-spin w-6 h-6" /> : null}
          {modal.type === 'loading' ? 'Memproses...' : 'Kirim Laporan Bulanan'}
        </button>
      </form>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95">
            <div className="flex justify-center mb-5">
              {modal.type === 'loading' && <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />}
              {modal.type === 'success' && <CheckCircle2 className="w-16 h-16 text-green-500" />}
              {modal.type === 'error' && <AlertCircle className="w-16 h-16 text-red-500" />}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{modal.title}</h3>
            <p className="text-gray-600 text-base mb-8 leading-relaxed">{modal.message}</p>
            
            {modal.type === 'error' && (
              <button 
                onClick={() => setModal({ isOpen: false, type: '', title: '', message: '' })}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-transform active:scale-95"
              >
                Mengerti
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}