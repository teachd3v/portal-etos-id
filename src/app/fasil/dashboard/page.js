// src/app/fasil/dashboard/page.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getGoogleSheet } from '@/lib/googleSheets';
import { getStatusPeriode, getStatusPeriodeFasil } from '@/lib/utils';
import LogoutButton from '@/app/dashboard/LogoutButton';
import FasilClient from './FasilClient';

export default async function DashboardFasil() {
  // 1. Verifikasi Session
  const cookieStore = await cookies();
  const token = cookieStore.get('session_etos')?.value;
  if (!token) redirect('/login');

  let user = null;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'Fasilitator') redirect('/login');
  } catch {
    redirect('/login');
  }

  // 2. Cek Status Periode (Jendela Waktu Tgl 25 - 7)
  const { statusForm, pesanStatus, periode } = getStatusPeriode();

  // 2b. Cek Status Periode Self-Report Fasil (Jendela Waktu Tgl 1 - 10)
  const { statusForm: statusFormFasil, pesanStatus: pesanStatusFasil, periode: periodeFasil } = getStatusPeriodeFasil();

  // 3. Ambil Relasi_PM dari Users_Fasil (daftar ID PM yang boleh dinilai fasil ini)
  let relasiPMList = [];
  try {
    const sheetFasil = await getGoogleSheet('Users_Fasil');
    const rowsFasil = await sheetFasil.getRows();
    const fasilRow = rowsFasil.find(r => r.get('ID_Fasil') === user.id);
    const relasiPM = fasilRow?.get('Relasi_PM') || '';
    relasiPMList = relasiPM ? relasiPM.split(',').map(s => s.trim()).filter(Boolean) : [];
  } catch (e) {
    console.error("Gagal menarik Relasi_PM dari Users_Fasil", e);
  }

  // 4. Tarik Data Base PM & Data Laporan Masuk
  const sheetPM = await getGoogleSheet('Users_PM');
  const rowsPM = await sheetPM.getRows();

  let submittedPMIds = new Set();
  try {
    const sheetResponse = await getGoogleSheet('Response_PM');
    const rowsResponse = await sheetResponse.getRows();
    rowsResponse.forEach(row => {
      if (row.get('Bulan_Laporan') === periode) {
        submittedPMIds.add(row.get('ID_Etoser'));
      }
    });
  } catch (e) {
    console.error("Gagal menarik Response_PM", e);
  }

  // 4b. Cek PM mana saja yang sudah dinilai oleh fasil ini di periode saat ini
  let evaluatedPMIds = new Set();
  try {
    const sheetResFasil = await getGoogleSheet('Response_Fasil');
    const rowsResFasil = await sheetResFasil.getRows();
    const [periodeMonth, periodeYear] = periode.split('-'); // "03", "2026"

    rowsResFasil.forEach(row => {
      if (row.get('ID_Fasil') !== user.id) return;
      // Pakai regex untuk ekstrak tanggal dari format id-ID yang bisa berupa:
      // "18/3/2026 14.30.00" atau "18/3/2026, 14.30.00"
      const ts = row.get('Timestamp') || '';
      const match = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const tsMonth = match[2].padStart(2, '0'); // match[2] = bulan
        const tsYear = match[3];                   // match[3] = tahun
        if (tsMonth === periodeMonth && tsYear === periodeYear) {
          evaluatedPMIds.add(row.get('ID_Etoser_Dinilai'));
        }
      }
    });
  } catch (e) {
    console.error("Gagal menarik Response_Fasil", e);
  }

  // 5. Filter PM berdasarkan Relasi_PM (jika ada), fallback ke wilayah
  const listPM = rowsPM
    .filter(row => {
      const pmId = row.get('ID');
      if (relasiPMList.length > 0) return relasiPMList.includes(pmId);
      return row.get('Wilayah') === user.wilayah;
    })
    .map(row => ({
      id: row.get('ID'),
      nama: row.get('Nama_Etoser'),
      angkatan: row.get('Angkatan'),
      tahun_pembinaan: row.get('Tahun_Pembinaan'),
      sudah_lapor: submittedPMIds.has(row.get('ID')),
      sudah_dinilai: evaluatedPMIds.has(row.get('ID')),
    }));

  // 6. Tarik Data Instrumen Sanksi
  let dataSanksi = [];
  try {
    const sheetSanksi = await getGoogleSheet('Sanksi');
    const rowsSanksi = await sheetSanksi.getRows();
    dataSanksi = rowsSanksi.map(row => ({
      kategori: row.get('Kategori') || '',
      detail: row.get('Detail_Pelanggaran') || '',
      masa_perbaikan: row.get('Masa_Perbaikan') || '',
      poin: parseInt(row.get('Poin')) || 0,
    })).filter(s => s.kategori && s.detail);
  } catch (e) {
    console.error("Gagal menarik data Sanksi", e);
  }

  // 7. Ambil Instrumen_Fasil (filtered by Variabel = role_fasil)
  let instrumenFasil = [];
  const effectiveRoleFasil = user.role_fasil || 'Team Leader';
  try {
    const sheetInstrumenFasil = await getGoogleSheet('Instrumen_Fasil');
    const rowsInstrumenFasil = await sheetInstrumenFasil.getRows();
    instrumenFasil = rowsInstrumenFasil
      .filter(row => row.get('Variabel') === effectiveRoleFasil)
      .map(row => ({
        variabel: row.get('Variabel') || '',
        kode: row.get('Kode') || '',
        jenisSkala: row.get('Jenis_Skala') || '',
        item: row.get('Item_Pernyataan') || '',
        validasi: row.get('Pertanyaan_Validasi') || '',
      }));
  } catch (e) {
    console.error("Gagal menarik Instrumen_Fasil", e);
  }

  // 8. Tarik Data Performa & Feedback Fasil (TAMPILKAN DI DASHBOARD)
  let evaluationData = null;
  let sudahSelfReport = false;
  try {
    const sheetSR = await getGoogleSheet('Response_Self_Report_Fasil');
    const rowsSR = await sheetSR.getRows();
    
    // Check if already self-reported this period
    sudahSelfReport = rowsSR.some(
      row => row.get('ID_Fasil') === user.id && row.get('Bulan_Laporan') === periodeFasil
    );

    // Get latest evaluation (for performance dashboard)
    const myEvals = rowsSR
      .filter(r => r.get('ID_Fasil') === user.id)
      .reverse();
    
    if (myEvals.length > 0) {
      const latest = myEvals[0];
      const scores = [];
      // Dinamis ambil semua kolom Skor_
      Object.keys(latest.toObject()).forEach(key => {
        if (key.startsWith('Skor_')) {
          scores.push(parseFloat(latest.get(key)) || 0);
        }
      });
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      evaluationData = {
        avg: avg.toFixed(2),
        feedback: latest.get('Official_Feedback') || '',
        periode: latest.get('Bulan_Laporan')
      };
    }

    const currentPeriodRow = rowsSR.find(
      r => r.get('ID_Fasil') === user.id && r.get('Bulan_Laporan') === periodeFasil
    );
    const adminFeedback = currentPeriodRow?.get('Official_Feedback') || '';

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Profile Fasil */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Portal Evaluasi Fasilitator</h1>
                <p className="text-gray-500 mt-1">Selamat bertugas, <span className="font-bold text-blue-600">{user.nama}</span>!</p>
              </div>
              <LogoutButton />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <div className="bg-gray-100 px-3 py-1.5 rounded-md border text-gray-700">ID Fasil: <strong>{user.id}</strong></div>
              <div className="bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 text-blue-800">Wilayah Binaan: <strong>{user.wilayah}</strong></div>
              <div className="bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-100 text-indigo-800">Periode Aktif: <strong>{periode}</strong></div>
            </div>
          </div>

          <FasilClient
            user={user}
            listPM={listPM}
            statusForm={statusForm}
            pesanStatus={pesanStatus}
            dataSanksi={dataSanksi}
            instrumenFasil={instrumenFasil}
            sudahSelfReport={sudahSelfReport}
            statusFormFasil={statusFormFasil}
            pesanStatusFasil={pesanStatusFasil}
            periodeFasil={periodeFasil}
            evaluationData={evaluationData}
            adminFeedback={adminFeedback}
          />
        </div>
      </div>
    );
  } catch (e) {
    console.error("Gagal menarik data Performa Fasil", e);
    return <div>Error loading dashboard. Please try again.</div>;
  }
}