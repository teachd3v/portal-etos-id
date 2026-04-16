// src/app/absen-wilayah/page.js
import { getGoogleSheet } from '@/lib/googleSheets';
import AbsenWilayahForm from './AbsenWilayahForm';

export const metadata = {
  title: 'Absensi Pembinaan Wilayah — Etos ID',
};

export default async function AbsenWilayahPage() {
  // Halaman publik — tidak memerlukan autentikasi
  // Fetch daftar agenda Wilayah yang aktif di server untuk pass ke client

  let activeAgendas = [];
  try {
    const sheet = await getGoogleSheet('Agenda_Wilayah');
    const rows = await sheet.getRows();
    activeAgendas = rows
      .filter(r => r.get('Is_Active') === 'TRUE')
      .map(r => ({
        id: r.get('ID_Agenda'),
        nama: r.get('Nama_Agenda'),
        jenis_aktivitas: r.get('Jenis_Aktivitas') || '',
        tema: r.get('Tema') || '',
        tanggal: '',
      }));
  } catch (err) {
    console.error('Gagal mengambil agenda wilayah:', err);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Absensi Pembinaan Wilayah</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Etos ID — Fasilitator</p>
        </div>

        <AbsenWilayahForm initialActiveAgendas={activeAgendas} />
      </div>
    </div>
  );
}
