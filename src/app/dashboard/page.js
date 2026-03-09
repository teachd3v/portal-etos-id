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
  } catch (error) {
    redirect('/login');
  }

  // 2. Ambil Status Periode
  const { statusForm: periodeStatus, pesanStatus: periodePesan, periode: periodeSekarang, bulanLaporanInt } = getStatusPeriode();
  
  // AMBIL TAHUN PEMBINAAN MANUAL DARI DATA LOGIN (DATABASE)
  const tahunPembinaanValid = parseInt(user.tahun_pembinaan);
  
  let statusForm = periodeStatus;
  let pesanStatus = periodePesan;

  // 3. ATURAN KHUSUS (ALUMNI, CAMABA, & TAHUN 4)
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

  // 4. CEK DOUBLE INPUT
  if (statusForm === 'OPEN') {
    try {
      const sheetResponses = await getGoogleSheet('Response_PM');
      const rowsResponses = await sheetResponses.getRows();

      const sudahIsi = rowsResponses.find(
        (row) => row.get('ID_Etoser') === user.id && row.get('Bulan_Laporan') === periodeSekarang
      );

      if (sudahIsi) {
        statusForm = 'SUBMITTED';
        pesanStatus = `Kamu sudah mengisi Laporan Bulanan untuk periode ${periodeSekarang}. Terima kasih!`;
      }
    } catch (error) {
      console.error("Gagal mengecek status ke Google Sheets:", error);
    }
  }

  // 5. Tarik Soal Dinamis (Sesuai angka manual di database)
  let instrumen = [];
  if (statusForm === 'OPEN' && tahunPembinaanValid >= 1 && tahunPembinaanValid <= 4) {
    const sheetInstrumen = await getGoogleSheet('Data_Instrumen');
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Profile */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Self-Report</h1>
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

        {/* Status Handling & Render Form */}
        {statusForm !== 'OPEN' ? (
          <div className={`border rounded-xl p-8 text-center shadow-sm ${
            statusForm === 'SUBMITTED' ? 'bg-green-50 border-green-200' : 
            statusForm === 'ALUMNI' || statusForm === 'FINISHED' ? 'bg-blue-50 border-blue-200' :
            'bg-red-50 border-red-200'
          }`}>
            <h2 className={`text-xl font-bold mb-2 ${
              statusForm === 'SUBMITTED' ? 'text-green-800' : 
              statusForm === 'ALUMNI' || statusForm === 'FINISHED' ? 'text-blue-800' :
              'text-red-800'
            }`}>
              {statusForm === 'SUBMITTED' ? 'Laporan Selesai ✅' : 
               statusForm === 'ALUMNI' || statusForm === 'FINISHED' ? 'Masa Purna 🎓' :
               statusForm === 'ERROR' ? 'Data Belum Lengkap ⚠️' : 'Form Terkunci 🔒'}
            </h2>
            <p className="text-gray-700 font-medium">
              {pesanStatus}
            </p>
          </div>
        ) : (
          <FormSelfReport instrumen={instrumen} user={user} tahunPembinaan={tahunPembinaanValid} periode={periodeSekarang} />
        )}

      </div>
    </div>
  );
}