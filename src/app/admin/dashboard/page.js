// src/app/admin/dashboard/page.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getGoogleSheet } from '@/lib/googleSheets';
import LogoutButton from '@/app/dashboard/LogoutButton';
import AdminClient from './AdminClient';
import { getStatusPeriode } from '@/lib/utils';

const getAvg = (row, cols) => {
  let sum = 0; let count = 0;
  cols.forEach(col => {
    const val = parseFloat(row.get(col));
    if (!isNaN(val)) { sum += val; count += 1; }
  });
  return count > 0 ? parseFloat((sum / count).toFixed(4)) : 0;
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

  // Tarik Semua Data Sekaligus
  const [sheetPM, sheetResPM, sheetResFasil] = await Promise.all([
    getGoogleSheet('Users_PM'),
    getGoogleSheet('Response_PM'),
    getGoogleSheet('Response_Fasil'),
  ]);
  const [rowsPM, rowsResPM, rowsResFasil] = await Promise.all([
    sheetPM.getRows(),
    sheetResPM.getRows(),
    sheetResFasil.getRows(),
  ]);

  // 1. Master PM
  const allPM = rowsPM.map(row => ({
    id: row.get('ID'),
    nama: row.get('Nama_Etoser'),
    angkatan: row.get('Angkatan') || '-',
    wilayah: row.get('Wilayah') || '-',
    tahun_pembinaan: row.get('Tahun_Pembinaan') || '-',
  }));

  // 2. Semua laporan PM (semua periode) dengan skor variabel sudah dihitung
  const allResPM = rowsResPM.map(row => ({
    id_etoser: row.get('ID_Etoser'),
    bulan_laporan: row.get('Bulan_Laporan'),
    pm_int:  getAvg(row, ['A1_Skor','A2_Skor','A3_Skor','A4_Skor','A5_Skor','A6_Skor','A7_Skor','A8_Skor','A9_Skor','A10_Skor']),
    pm_prof: getAvg(row, ['B1_Skor','B2_Skor','B3_Skor','B4_Skor','B5_Skor','B6_Skor']),
    pm_trans: getAvg(row, ['C1_Skor','C2_Skor','C3_Skor','C4_Skor']),
  }));

  // 3. Semua evaluasi fasil dengan periode diturunkan dari Timestamp
  const allResFasil = rowsResFasil.map(row => {
    const ts = row.get('Timestamp') || '';
    const match = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const periode_fasil = match ? `${match[2].padStart(2, '0')}-${match[3]}` : '';
    return {
      id_etoser_dinilai: row.get('ID_Etoser_Dinilai'),
      periode_fasil,
      fasil_int:         parseFloat(row.get('Skor_Integritas'))  || 0,
      fasil_prof:        parseFloat(row.get('Skor_Profesional')) || 0,
      fasil_kontributif: parseFloat(row.get('Skor_Kontributif')) || 0,
      fasil_trans:       parseFloat(row.get('Skor_Transformatif')) || 0,
      rekomendasi:       row.get('Kesimpulan_Rekomendasi') || 'Belum Dievaluasi',
      total_poin:        parseInt(row.get('Total_Poin')) || 0,
    };
  });

  // 4. Daftar periode unik dari laporan PM, diurutkan kronologis
  const availablePeriodes = [...new Set(allResPM.map(r => r.bulan_laporan))]
    .filter(Boolean)
    .sort((a, b) => {
      const [mA, yA] = a.split('-');
      const [mB, yB] = b.split('-');
      return (parseInt(yA) * 12 + parseInt(mA)) - (parseInt(yB) * 12 + parseInt(mB));
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

        <AdminClient
          periodeAktif={periode}
          allPM={allPM}
          allResPM={allResPM}
          allResFasil={allResFasil}
          availablePeriodes={availablePeriodes}
        />
      </div>
    </div>
  );
}
