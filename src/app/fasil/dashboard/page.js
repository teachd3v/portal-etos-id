// src/app/fasil/dashboard/page.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getGoogleSheet } from '@/lib/googleSheets';
import { getStatusPeriode } from '@/lib/utils';
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
  } catch (error) {
    redirect('/login');
  }

  // 2. Cek Status Periode (Jendela Waktu Tgl 25 - 7)
  const { statusForm, pesanStatus, periode } = getStatusPeriode();

  // 3. Tarik Data Base PM & Data Laporan Masuk
  const sheetPM = await getGoogleSheet('Users_PM');
  const rowsPM = await sheetPM.getRows();

  let submittedPMIds = new Set();
  
  try {
    // Cek sheet laporan PM untuk periode BULAN INI saja
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

  // 4. Filter PM sesuai wilayah binaan & injeksi status "sudah_lapor"
  const listPM = rowsPM
    .filter(row => row.get('Wilayah') === user.wilayah)
    .map(row => ({
      id: row.get('ID'),
      nama: row.get('Nama_Etoser'),
      angkatan: row.get('Angkatan'),
      tahun_pembinaan: row.get('Tahun_Pembinaan'),
      // True jika ID anak ini ada di dalam Set laporan bulan ini
      sudah_lapor: submittedPMIds.has(row.get('ID')) 
    }));

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

        {/* Komponen Interaktif & Logic Penguncian dilempar ke Client */}
        <FasilClient 
          user={user} 
          listPM={listPM} 
          statusForm={statusForm} 
          pesanStatus={pesanStatus}
        />
      </div>
    </div>
  );
}