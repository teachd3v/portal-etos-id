// src/app/dashboard/page.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getGoogleSheet } from '@/lib/googleSheets';
import { getStatusPeriode } from '@/lib/utils';
import FormSelfReport from './FormSelfReport';
import LogoutButton from './LogoutButton';

export default async function DashboardPM() {
  // 1. Verifikasi Session
  const cookieStore = await cookies();
  const token = cookieStore.get('session_etos')?.value;
  if (!token) redirect('/login');

  let user = null;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'PM') redirect('/login');
  } catch {
    redirect('/login');
  }

  // 2. Ambil Status Periode
  const { statusForm: periodeStatus, pesanStatus: periodePesan, periode: periodeSekarang, bulanLaporanInt } = getStatusPeriode();
  
  // AMBIL TAHUN PEMBINAAN MANUAL DARI DATA LOGIN (DATABASE)
  const tahunPembinaanValid = parseInt(user.tahun_pembinaan);

  // 3. Tarik Soal Dinamis (Sesuai angka manual di database)
  let instrumen = [];
  if (tahunPembinaanValid >= 1 && tahunPembinaanValid <= 4) {
    const sheetInstrumen = await getGoogleSheet('Instrumen_Etoser');
    const rowsInstrumen = await sheetInstrumen.getRows();

    instrumen = rowsInstrumen
      .filter(row => parseInt(row.get('Tahun')) === tahunPembinaanValid)
      .map(row => ({
        variabel: row.get('Variabel'),
        kode: row.get('Kode'),
        jenisSkala: row.get('Jenis_Skala'),
        item: row.get('Item_Pernyataan'),
        validasi: row.get('Pertanyaan_Validasi') || null
      }));
  }
  
  let statusForm = periodeStatus;
  let pesanStatus = periodePesan;

  // 4. ATURAN KHUSUS (ALUMNI, CAMABA, & TAHUN 4)
  if (tahunPembinaanValid > 4) {
    statusForm = 'ALUMNI';
    pesanStatus = 'Selamat! Kamu telah menyelesaikan 4 tahun masa pembinaan Etos ID. Pengisian laporan sudah tidak diperlukan.';
  } else if (isNaN(tahunPembinaanValid) || tahunPembinaanValid < 1) {
    statusForm = 'ERROR';
    pesanStatus = 'Tahun pembinaanmu belum diatur oleh admin. Silakan hubungi Fasilitator.';
  } else if (tahunPembinaanValid === 4 && bulanLaporanInt === 8) {
    statusForm = 'FINISHED';
    pesanStatus = 'Laporan bulanan terakhirmu di Tahun ke-4 adalah laporan bulan Juli. Selamat menikmati masa purnamu!';
  }

  let adminFeedback = '';

  // 5. CEK DOUBLE INPUT
  if (statusForm === 'OPEN') {
    try {
      const sheetResponses = await getGoogleSheet('Response_PM');
      const rowsResponses = await sheetResponses.getRows();

      const currentRow = rowsResponses.find(
        (row) => String(row.get('ID_Etoser')) === String(user.id) && row.get('Bulan_Laporan') === periodeSekarang
      );

      if (currentRow) {
        // Cek apakah sudah benar-benar isi skor (dinamis cek salah satu kode dari instrumen bulan ini)
        const firstCode = instrumen.length > 0 ? instrumen[0].kode : 'A1';
        const hasScores = !!currentRow.get(`${firstCode}_Skor`); 

        if (hasScores) {
          statusForm = 'SUBMITTED';
          pesanStatus = `Kamu telah mengisi laporan untuk periode ${periodeSekarang}. Data sedang dievaluasi oleh Fasilitator.`;
        }
        // Ambil feedback admin bulan berjalan (jika ada)
        adminFeedback = currentRow.get('Official_Feedback') || '';
      }
    } catch (error) {
      console.error("Gagal mengecek status ke Google Sheets:", error);
    }
  }

  // 6. Tarik Data Performa & Feedback (TAMPILKAN DI DASHBOARD)
  let evaluationData = null;
  try {
    const [sheetResPM, sheetResFasil] = await Promise.all([
      getGoogleSheet('Response_PM'),
      getGoogleSheet('Review_Fasil'),
    ]);
    const [rowsResPM, rowsResFasil] = await Promise.all([
      sheetResPM.getRows(),
      sheetResFasil.getRows(),
    ]);

    const myFasilEvals = rowsResFasil
      .filter(r => String(r.get('ID_Etoser_Dinilai')) === String(user.id))
      .reverse();

    if (myFasilEvals.length > 0) {
      const latestFasil = myFasilEvals[0];
      
      // Hitung Periode dari Timestamp Fasil
      const ts = latestFasil.get('Timestamp') || '';
      const match = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const periodeFasilEval = match ? `${match[2].padStart(2, '0')}-${match[3]}` : '';

      // Cari Self-Report PM yang sesuai dengan periode evaluasi tsb
      const latestPM = rowsResPM
        .filter(r => String(r.get('ID_Etoser')) === String(user.id) && r.get('Bulan_Laporan') === periodeFasilEval)
        .reverse()[0];

      // Helper hitung rata-rata PM dinamis
      const getPMAvg = (row, varName) => {
        if (!row) return 0;
        const codes = instrumen.filter(i => i.variabel === varName).map(i => `${i.kode}_Skor`);
        let sum = 0; let count = 0;
        codes.forEach(c => {
          const val = parseFloat(row.get(c));
          if (!isNaN(val)) { sum += val; count++; }
        });
        return count > 0 ? sum / count : 0;
      };

      const pmI = getPMAvg(latestPM, 'Integritas');
      const pmP = getPMAvg(latestPM, 'Profesional');
      const pmK = getPMAvg(latestPM, 'Kontributif');
      const pmT = getPMAvg(latestPM, 'Transformatif');

      const fasilI = parseFloat(latestFasil.get('Skor_Integritas')) || 0;
      const fasilP = parseFloat(latestFasil.get('Skor_Profesional')) || 0;
      const fasilK = parseFloat(latestFasil.get('Skor_Kontributif')) || 0;
      const fasilT = parseFloat(latestFasil.get('Skor_Transformatif')) || 0;

      // Bobot: 70% Fasil, 30% PM (Hanya jika laporan PM ada, jika tidak, 100% Fasil)
      const blend = (pm, fasil) => {
        if (pm && fasil) return (fasil * 0.70) + (pm * 0.30);
        return fasil || pm || 0;
      };

      const finalI = blend(pmI, fasilI);
      const finalP = blend(pmP, fasilP);
      const finalK = blend(pmK, fasilK);
      const finalT = blend(pmT, fasilT);

      const scores = [finalI, finalP, finalK, finalT].filter(s => s > 0);
      const avgIPK = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      evaluationData = {
        integritas: finalI,
        profesional: finalP,
        kontributif: finalK,
        transformatif: finalT,
        avg: avgIPK.toFixed(2),
        rekomendasi: latestFasil.get('Kesimpulan_Rekomendasi'),
        catatan_kualitatif: latestFasil.get('Catatan_Kualitatif') || '',
        feedback: latestPM?.get('Official_Feedback') || '',
        periode: periodeFasilEval
      };
    }
  } catch (err) {
    console.error("Gagal tarik data evaluasi:", err);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Profile */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Portal Evaluasi Etoser</h1>
              <p className="text-gray-500 mt-1">Selamat datang kembali, <span className="font-semibold text-green-600">{user.nama}</span>!</p>
            </div>
            {/* INI TOMBOL LOGOUT-NYA */}
            <LogoutButton />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-sm text-gray-700">
            <div className="bg-gray-100 px-3 py-1.5 rounded-md border">ID: <strong>{user.id}</strong></div>
            <div className="bg-gray-100 px-3 py-1.5 rounded-md border">Angkatan: <strong>{user.angkatan}</strong></div>
            <div className="bg-gray-100 px-3 py-1.5 rounded-md border">Wilayah: <strong>{user.wilayah}</strong></div>
            
            {!isNaN(tahunPembinaanValid) && tahunPembinaanValid > 0 && (
              <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-md border border-green-200">
                Tahun Pembinaan: <strong>Ke-{tahunPembinaanValid}</strong>
              </div>
            )}
            <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md border border-blue-200">
              Periode: <strong>{periodeSekarang}</strong>
            </div>
          </div>
        </div>

        {/* Render Form with Evaluation Data */}
        <FormSelfReport 
          instrumen={instrumen} 
          user={user} 
          tahunPembinaan={tahunPembinaanValid} 
          periode={periodeSekarang} 
          statusForm={statusForm}
          pesanStatus={pesanStatus}
          evaluationData={evaluationData}
          adminFeedback={adminFeedback}
          isEvaluating={statusForm === 'SUBMITTED' && !evaluationData}
        />
      </div>
    </div>
  );
}