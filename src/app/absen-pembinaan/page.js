// src/app/absen-pembinaan/page.js
import { getGoogleSheet } from '@/lib/googleSheets';
import AbsensiForm from './AbsensiForm';

export const metadata = {
  title: 'Absensi Pembinaan Nasional — Etos ID',
};

export default async function AbsenPembinaanPage() {
  // Halaman publik — tidak memerlukan autentikasi

  let activeAgenda = null;
  try {
    const sheet = await getGoogleSheet('Agenda_Nasional');
    const rows = await sheet.getRows();
    const activeRow = rows.find(r => r.get('Is_Active') === 'TRUE');
    if (activeRow) {
      activeAgenda = {
        id: activeRow.get('ID_Agenda'),
        nama: activeRow.get('Nama_Agenda'),
        deskripsi: activeRow.get('Deskripsi') || '',
        tanggal: activeRow.get('Tanggal') || '',
        pelaksana: activeRow.get('Pelaksana') || '',
        jenis_aktivitas: activeRow.get('Jenis_Aktivitas') || '',
        tema: activeRow.get('Tema') || '',
      };
    }
  } catch (err) {
    console.error('Gagal mengambil agenda aktif:', err);
    // Non-fatal: form tetap render dengan activeAgenda=null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Absensi Pembinaan Nasional</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Etos ID</p>
        </div>

        <AbsensiForm activeAgenda={activeAgenda} />
      </div>
    </div>
  );
}
