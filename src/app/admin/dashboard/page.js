// src/app/admin/dashboard/page.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getGoogleSheet } from '@/lib/googleSheets';
import LogoutButton from '@/app/dashboard/LogoutButton';
import AdminClient from './AdminClient';
import { getStatusPeriode } from '@/lib/utils';

// Fungsi bantuan untuk menghitung rata-rata dari sekumpulan kolom
const getAvg = (row, cols) => {
  let sum = 0; let count = 0;
  cols.forEach(col => {
    const val = parseFloat(row.get(col));
    if (!isNaN(val)) { sum += val; count += 1; }
  });
  return count > 0 ? (sum / count) : 0;
};

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_etos')?.value;
  if (!token) redirect('/login');

  let user = null;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'Admin') redirect('/login');
  } catch (error) { redirect('/login'); }

  const { periode } = getStatusPeriode();

  // Tarik Semua Data
  const sheetPM = await getGoogleSheet('Users_PM');
  const rowsPM = await sheetPM.getRows();
  
  const sheetResPM = await getGoogleSheet('Response_PM');
  const rowsResPM = await sheetResPM.getRows();

  const sheetResFasil = await getGoogleSheet('Response_Fasil');
  const rowsResFasil = await sheetResFasil.getRows();

  // 1. Ambil Laporan PM khusus bulan ini
  const responsePM_BulanIni = rowsResPM.filter(r => r.get('Bulan_Laporan') === periode);

  // 2. KONSOLIDASI DATA (Menggabungkan Nilai PM & Fasil ke dalam 1 Objek per Anak)
  const mergedData = rowsPM.map(pm => {
    const id = pm.get('ID');
    const resPM = responsePM_BulanIni.find(r => r.get('ID_Etoser') === id);
    // Ambil evaluasi fasil terbaru untuk anak ini
    const resFasil = rowsResFasil.filter(r => r.get('ID_Etoser_Dinilai') === id).pop(); 

    // Kalkulasi Skor PM (Rata-rata per variabel)
    let pm_int = 0, pm_prof = 0, pm_trans = 0;
    if (resPM) {
      pm_int = getAvg(resPM, ['A1_Skor','A2_Skor','A3_Skor','A4_Skor','A5_Skor','A6_Skor','A7_Skor','A8_Skor','A9_Skor','A10_Skor']);
      pm_prof = getAvg(resPM, ['B1_Skor','B2_Skor','B3_Skor','B4_Skor','B5_Skor','B6_Skor']);
      pm_trans = getAvg(resPM, ['C1_Skor','C2_Skor','C3_Skor','C4_Skor']);
    }

    // Kalkulasi Skor Fasil
    let fasil_int = 0, fasil_prof = 0, fasil_trans = 0;
    if (resFasil) {
      fasil_int = getAvg(resFasil, ['Skor_Integritas_Adab', 'Skor_Integritas_Ibadah', 'Skor_Komitmen_Pembinaan']);
      fasil_prof = parseFloat(resFasil.get('Skor_Profesional')) || 0;
      fasil_trans = parseFloat(resFasil.get('Skor_Transformatif')) || 0;
    }

    return {
      id: id,
      nama: pm.get('Nama_Etoser'),
      angkatan: pm.get('Angkatan'),
      wilayah: pm.get('Wilayah'),
      tahun_pembinaan: pm.get('Tahun_Pembinaan'),
      
      status_lapor_pm: !!resPM,
      status_dinilai_fasil: !!resFasil,
      rekomendasi: resFasil ? resFasil.get('Kesimpulan_Rekomendasi') : 'Belum Dievaluasi',
      
      // Skor Mentah (Skala 4)
      pm_int, pm_prof, pm_trans,
      fasil_int, fasil_prof, fasil_trans,

      // Skor Gabungan (Akumulasi 50% PM + 50% Fasil). Jika salah satu kosong, pakai yang ada.
      total_int: (pm_int && fasil_int) ? (pm_int + fasil_int)/2 : (pm_int || fasil_int),
      total_prof: (pm_prof && fasil_prof) ? (pm_prof + fasil_prof)/2 : (pm_prof || fasil_prof),
      total_trans: (pm_trans && fasil_trans) ? (pm_trans + fasil_trans)/2 : (pm_trans || fasil_trans),
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard Pusat</h1>
            <p className="text-gray-500 font-medium mt-1">Monitoring & Evaluasi Laporan Bulanan Etos ID</p>
          </div>
          <LogoutButton />
        </div>
        
        <AdminClient periodeAktif={periode} mergedData={mergedData} />
      </div>
    </div>
  );
}