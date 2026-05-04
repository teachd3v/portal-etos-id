// src/app/dashboard/FormSelfReport.js
'use client';
import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Star, LayoutDashboard, ClipboardList, AlertTriangle, TrendingUp, MessageSquareText } from 'lucide-react';

// --- KOMPONEN BINTANG INTERAKTIF ---
const StarRating = ({ kode, jenisSkala, currentValue, onChange }) => {
  const [hover, setHover] = useState(0);

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
export default function FormSelfReport({ instrumen, user, tahunPembinaan, periode, statusForm, pesanStatus, evaluationData, adminFeedback, isEvaluating }) {
  const [activeTab, setActiveTab] = useState('lapor');
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
    
    setModal({ isOpen: true, type: 'loading', title: 'Mengirim Laporan...', message: 'Mohon tunggu sebentar...' });
    
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
        setModal({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Laporan Bulananmu berhasil dikirim.' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Gagal', message: 'Gagal mengirim laporan.' });
      }
    } catch (error) {
      setModal({ isOpen: true, type: 'error', title: 'Error', message: 'Koneksi bermasalah.' });
    }
  };

  return (
    <>
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('lapor')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${
            activeTab === 'lapor' ? 'bg-green-600 text-white shadow-lg scale-[1.02]' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-5 h-5" /> Isi Laporan
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${
            activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard Performa
        </button>
      </div>

      {activeTab === 'lapor' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {statusForm !== 'OPEN' ? (
            <div className={`p-8 rounded-3xl border-2 text-center shadow-sm ${
              statusForm === 'SUBMITTED' ? 'bg-green-50 border-green-200' : 
              statusForm === 'ALUMNI' || statusForm === 'FINISHED' ? 'bg-blue-50 border-blue-200' :
              'bg-red-50 border-red-200'
            }`}>
              <h2 className={`text-xl font-bold mb-2 ${
                statusForm === 'SUBMITTED' ? 'text-green-800' : 
                statusForm === 'ALUMNI' || statusForm === 'FINISHED' ? 'text-blue-800' :
                'text-red-800'
              }`}>{statusForm === 'SUBMITTED' ? 'Laporan Selesai ✅' : 'Form Terkunci 🔒'}</h2>
              <p className="text-gray-700 font-medium">{pesanStatus}</p>
            </div>
          ) : (
            <>
              {/* Feedback Section (New Month Feedback) */}
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 mb-8 relative shadow-sm">
                <div className="absolute top-[-10px] left-8 bg-white px-3 py-1 rounded-full border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest">Catatan Admin</div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Star className="w-5 h-5 fill-current" /></div>
                  <p className="text-blue-900 font-bold text-lg leading-relaxed italic">
                    &quot;{adminFeedback || "Semangat terus dalam mengisi laporan bulanan dan mengikuti pembinaan Etos ID! Pertahankan prestasimu."}&quot;
                  </p>
                </div>
              </div>



              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                  {instrumen.map((item) => {
                    const skorSaatIni = jawaban[item.kode]?.skor || 0;
                    const perluValidasi = item.validasi !== '-' && item.validasi !== '' && skorSaatIni > 1;
                    return (
                      <div key={item.kode} className="mb-8 p-5 bg-gray-50 border border-gray-100 rounded-2xl hover:shadow-md transition-all">
                        <div className="flex gap-3 mb-3">
                          <span className="bg-green-600 text-white px-2.5 py-1 rounded text-xs font-bold h-fit shadow-sm">{item.kode}</span>
                          <p className="font-bold text-gray-800 text-sm md:text-base">{item.item}</p>
                        </div>
                        <StarRating kode={item.kode} jenisSkala={item.jenisSkala} currentValue={skorSaatIni} onChange={handleSkorChange} />
                        {perluValidasi && (
                          <div className="mt-5 pt-4 border-t border-gray-200">
                            <label className="block text-sm font-black text-blue-800 mb-2 underline tracking-wide cursor-help" title="Fasil butuh bukti tambahan">{item.validasi}</label>
                            <textarea rows={2} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white" placeholder="Jawaban detail..." value={jawaban[item.kode]?.val || ''} onChange={(e) => handleValChange(item.kode, e.target.value)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button type="submit" disabled={modal.type === 'loading'} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl shadow-lg flex justify-center items-center gap-2 text-xl">
                  {modal.type === 'loading' ? <Loader2 className="animate-spin w-6 h-6" /> : 'Kirim Laporan Bulanan'}
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {!evaluationData ? (
            <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
              {isEvaluating ? (
                <>
                  <Loader2 className="w-16 h-16 mx-auto text-blue-500 mb-4 animate-spin" />
                  <h3 className="text-xl font-bold text-gray-800">Data sedang di evaluasi Fasilitator</h3>
                  <p className="text-gray-500 mt-2">Terima kasih sudah melapor! Tunggu fasilitator memberikan penilaian ya.</p>
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800">Belum Ada Data Performa</h3>
                </>
              )}
            </div>
          ) : (
            <>
              {(() => {
                const avgVal = parseFloat(evaluationData.avg) || 0;
                let bgGradient = "from-blue-600 to-blue-700 shadow-blue-200";
                let badgeColor = "bg-white/20 border-white/30 text-white";
                
                if (avgVal >= 3) {
                  bgGradient = "from-blue-600 to-indigo-700 shadow-blue-200";
                } else if (avgVal >= 2) {
                  bgGradient = "from-orange-500 to-amber-600 shadow-orange-200";
                } else if (avgVal > 0) {
                  bgGradient = "from-red-600 to-rose-700 shadow-red-200";
                }

                return (
                  <div className={`bg-gradient-to-br ${bgGradient} rounded-3xl p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500`}>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10"><TrendingUp className="w-48 h-48" /></div>
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                          <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-[10px] mb-2">Rata-rata Skor Pembinaan</p>
                          <h2 className="text-7xl font-black mb-3">{evaluationData.avg}</h2>
                          <div className="flex flex-wrap gap-2">
                             <span className={`px-4 py-1.5 rounded-full border font-bold text-xs backdrop-blur-md ${badgeColor}`}>
                               {evaluationData.rekomendasi}
                             </span>

                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                          <MiniScore label="INT" val={evaluationData.integritas} />
                          <MiniScore label="PRO" val={evaluationData.profesional} />
                          <MiniScore label="KON" val={evaluationData.kontributif} />
                          <MiniScore label="TRA" val={evaluationData.transformatif} />
                        </div>
                      </div>


                    </div>
                  </div>
                );
              })()}
              {evaluationData.catatan_kualitatif && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-purple-600 font-black">
                    <MessageSquareText className="w-5 h-5" /> Catatan & Saran Fasilitator
                  </div>
                  <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100 italic text-purple-900 font-bold text-lg">
                    &quot;{evaluationData.catatan_kualitatif}&quot;
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-blue-600 font-black"><AlertCircle className="w-5 h-5" /> Catatan & Feedback Admin</div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 italic text-gray-700 font-bold text-lg">&quot;{evaluationData.feedback || 'Pertahankan prestasimu!'}&quot;</div>
              </div>
            </>
          )}
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="flex justify-center mb-5">
              {modal.type === 'loading' && <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />}
              {modal.type === 'success' && <CheckCircle2 className="w-16 h-16 text-green-500" />}
              {modal.type === 'error' && <AlertCircle className="w-16 h-16 text-red-500" />}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{modal.title}</h3>
            <p className="text-gray-600 text-base mb-8">{modal.message}</p>
            {modal.type === 'error' && <button onClick={() => setModal({ isOpen: false, type: '', title: '', message: '' })} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl">Mengerti</button>}
          </div>
        </div>
      )}
    </>
  );
}

const MiniScore = ({ label, val }) => {
  const score = parseFloat(val) || 0;
  
  // Logika Warna Dinamis
  let bgColor = "bg-white/10";
  let borderColor = "border-white/20";
  let textColor = "text-white";

  if (score >= 3) {
    bgColor = "bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]";
    borderColor = "border-blue-300/40";
  } else if (score >= 2) {
    bgColor = "bg-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
    borderColor = "border-orange-300/40";
  } else if (score >= 1) {
    bgColor = "bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
    borderColor = "border-red-300/40";
  }

  return (
    <div className={`${bgColor} ${borderColor} border p-3 rounded-2xl text-center backdrop-blur-md transition-all hover:scale-105 duration-300`}>
      <p className="text-[10px] font-black opacity-80 mb-1 tracking-widest uppercase">{label}</p>
      <p className={`text-xl font-black ${textColor}`}>{score > 0 ? score.toFixed(1) : '0'}</p>
    </div>
  );
};