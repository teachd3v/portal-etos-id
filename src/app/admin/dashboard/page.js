// src/app/admin/dashboard/page.js
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getGoogleSheet } from '@/lib/googleSheets';
import LogoutButton from '@/app/dashboard/LogoutButton';
import AdminClient from './AdminClient';
import { getStatusPeriode, getStatusPeriodeFasil } from '@/lib/utils';

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
  } catch { redirect('/login'); }

  const { periode } = getStatusPeriode();
  const { periode: periodeFasil } = getStatusPeriodeFasil();

  try {
    // Tarik Semua Data Sekaligus (parallel)
    const [sheetPM, sheetResPM, sheetResFasil, sheetFasil, sheetSRFasil] = await Promise.all([
      getGoogleSheet('Users_PM'),
      getGoogleSheet('Response_PM'),
      getGoogleSheet('Review_Fasil'),
      getGoogleSheet('Users_Fasil'),
      getGoogleSheet('Response_Fasil'),
    ]);
    const [rowsPM, rowsResPM, rowsResFasil, rowsFasil, rowsSRFasil] = await Promise.all([
      sheetPM.getRows(),
      sheetResPM.getRows(),
      sheetResFasil.getRows(),
      sheetFasil.getRows(),
      sheetSRFasil.getRows(),
    ]);

    // 1. Master PM
    const allPM = rowsPM.map(row => ({
      id: row.get('ID'),
      nama: row.get('Nama_Etoser'),
      angkatan: row.get('Angkatan') || '-',
      wilayah: row.get('Wilayah') || '-',
      tahun_pembinaan: row.get('Tahun_Pembinaan') || '-',
      email: row.get('Email') || '',
    }));

    // (Scoring mapping moved below #7 for dynamic context from Data_Instrumen)

    // 3. Semua evaluasi fasil dengan periode dari kolom Bulan_Laporan (prioritas) atau Timestamp
    const allResFasil = rowsResFasil.map(row => {
      let periode_fasil = String(row.get('Bulan_Laporan') || '').trim();
      
      if (!periode_fasil) {
        const ts = String(row.get('Timestamp') || '');
        const match = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        periode_fasil = match ? `${match[2].padStart(2, '0')}-${match[3]}` : '';
      }

      return {
        id_fasil:          String(row.get('ID_Fasil') || '').trim(),
        id_etoser_dinilai: String(row.get('ID_Etoser_Dinilai') || '').trim(),
        periode_fasil,
        fasil_int:         parseFloat(row.get('Skor_Integritas'))  || 0,
        fasil_prof:        parseFloat(row.get('Skor_Profesional')) || 0,
        fasil_kontributif: parseFloat(row.get('Skor_Kontributif')) || 0,
        fasil_trans:       parseFloat(row.get('Skor_Transformatif')) || 0,
        rekomendasi:       row.get('Kesimpulan_Rekomendasi') || 'Belum Dievaluasi',
        total_poin:        parseInt(row.get('Total_Poin')) || 0,
        detail_pelanggaran: row.get('Detail_Pelanggaran') || '',
        feedback_admin:    row.get('Feedback_Admin') || '',
      };
    });


    // 5. Master Fasil
    const allFasil = rowsFasil.map(row => ({
      id: row.get('ID_Fasil'),
      nama: row.get('Nama_Fasil'),
      wilayah: row.get('Wilayah_Binaan') || '-',
      role_fasil: row.get('Role') || 'Team Leader',
      relasi_pm: row.get('Relasi_PM') || '',
      email: row.get('Email') || '',
    }));

    // 6. Self-Report Fasil — hitung rata-rata semua _Skor kolom per row
    const srFasilHeaders = sheetSRFasil.headerValues || [];
    const skorCols = srFasilHeaders.filter(h => h.endsWith('_Skor'));

    const allResSRFasil = rowsSRFasil.map(row => {
      let totalSkor = 0;
      let countSkor = 0;
      skorCols.forEach(col => {
        const val = parseFloat(row.get(col));
        if (!isNaN(val) && val > 0) { totalSkor += val; countSkor++; }
      });
      return {
        id_fasil: row.get('ID_Fasil'),
        role_fasil: row.get('Role_Fasil'),
        bulan_laporan: row.get('Bulan_Laporan'),
        avg_skor: countSkor > 0 ? parseFloat((totalSkor / countSkor).toFixed(4)) : 0,
        official_feedback: row.get('Official_Feedback') || '',
      };
    });


    // 7. Tarik Data Instrumen (untuk modal detail)
    const [sheetInstPM, sheetInstFasil] = await Promise.all([
      getGoogleSheet('Instrumen_Etoser'),
      getGoogleSheet('Instrumen_Fasil'),
    ]);
    const [rowsInstPM, rowsInstFasil] = await Promise.all([
      sheetInstPM.getRows(),
      sheetInstFasil.getRows(),
    ]);

    // Mapping Variabel PM dinamik dari Data_Instrumen
    const pmVarToCodes = {
      'Integritas': [],
      'Profesional': [],
      'Kontributif': [],
      'Transformatif': [],
    };
    
    const pmIndikatorToCodes = {};
    
    rowsInstPM.forEach(r => {
      const v = r.get('Variabel');
      const k = r.get('Kode');
      const ind = r.get('Indikator');

      if (pmVarToCodes[v]) {
        pmVarToCodes[v].push(`${k}_Skor`);
      }

      if (ind) {
        if (!pmIndikatorToCodes[ind]) pmIndikatorToCodes[ind] = [];
        pmIndikatorToCodes[ind].push(`${k}_Skor`);
      }
    });

    // Re-map allResPM dengan variabel dinamis & trim ID
    const allResPM = rowsResPM.map(row => {
      const res = {
        id_etoser: String(row.get('ID_Etoser') || '').trim(),
        bulan_laporan: String(row.get('Bulan_Laporan') || '').trim(),
        pm_int:    getAvg(row, pmVarToCodes['Integritas']),
        pm_prof:   getAvg(row, pmVarToCodes['Profesional']),
        pm_kont:   getAvg(row, pmVarToCodes['Kontributif']),
        pm_trans:  getAvg(row, pmVarToCodes['Transformatif']),
        feedback_admin: row.get('Official_Feedback') || '',
        indikator_scores: {},
      };

      // Hitung rata-rata per indikator
      Object.keys(pmIndikatorToCodes).forEach(ind => {
        res.indikator_scores[ind] = getAvg(row, pmIndikatorToCodes[ind]);
      });

      return res;
    });

    // 4. Daftar periode unik, pastikan menyertakan periodeAktif agar filter tidak kosong
    const periodSet = new Set(allResPM.map(r => r.bulan_laporan));
    if (periode) periodSet.add(periode);

    const availablePeriodes = Array.from(periodSet)
      .filter(Boolean)
      .sort((a, b) => {
        const [mA, yA] = a.split('-');
        const [mB, yB] = b.split('-');
        return (parseInt(yA) * 12 + parseInt(mA)) - (parseInt(yB) * 12 + parseInt(mB));
      });

    // Buat list instrumen unik untuk prop (ambil yg pertama ketemu)
    const seenPM = new Set();
    const instrumentPM = rowsInstPM
      .map(r => ({
        kode: r.get('Kode'),
        indikator: r.get('Indikator') || '',
        item: r.get('Item_Pernyataan'),
        tahun: r.get('Tahun'),
      }))
      .filter(item => {
        if (!item.kode || seenPM.has(item.kode)) return false;
        seenPM.add(item.kode);
        return true;
      });

    const seenFasil = new Set();
    const instrumentFasil = rowsInstFasil
      .map(r => ({
        kode: r.get('Kode'),
        item: r.get('Item_Pernyataan'),
        variabel: r.get('Variabel'),
      }))
      .filter(item => {
        const uniqueKey = `${item.variabel}-${item.kode}`;
        if (!item.kode || seenFasil.has(uniqueKey)) return false;
        seenFasil.add(uniqueKey);
        return true;
      });

    // 8. Raw Responses (untuk detail view tgl 25-3 / 1-10)
    // Kita kirim data mentah per row agar client bisa mapping dinamis
    const rawResponsesPM = rowsResPM.map(r => r.toObject());
    const rawResponsesSRFasil = rowsSRFasil.map(r => r.toObject());

    // 9. Agenda Pembinaan (Nasional & Wilayah)
    let agendas = [];
    try {
      const [sheetNasional, sheetWilayah] = await Promise.all([
        getGoogleSheet('Agenda_Nasional').catch(() => null),
        getGoogleSheet('Agenda_Wilayah').catch(() => null),
      ]);

      const nasionalAgendas = sheetNasional ? (await sheetNasional.getRows()).map(row => ({
        id: row.get('ID_Agenda'),
        nama: row.get('Nama_Agenda'),
        deskripsi: row.get('Deskripsi') || '',
        tanggal: row.get('Tanggal') || '',
        is_active: row.get('Is_Active') === 'TRUE',
        pelaksana: 'Nasional',
        jenis_aktivitas: row.get('Jenis_Aktivitas') || '',
        tema: row.get('Tema') || '',
      })) : [];

      const wilayahAgendas = sheetWilayah ? (await sheetWilayah.getRows()).map(row => ({
        id: row.get('ID_Agenda'),
        nama: row.get('Nama_Agenda'),
        deskripsi: '',
        tanggal: '',
        is_active: row.get('Is_Active') === 'TRUE',
        pelaksana: 'Wilayah',
        jenis_aktivitas: row.get('Jenis_Aktivitas') || '',
        tema: row.get('Tema') || '',
      })) : [];

      agendas = [...nasionalAgendas, ...wilayahAgendas].reverse();
    } catch (err) {
      console.error('Gagal mengambil data agenda:', err);
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard Nasional</h1>
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
            allFasil={allFasil}
            allResSRFasil={allResSRFasil}
            periodeFasil={periodeFasil}
            instrumentPM={instrumentPM}
            instrumentFasil={instrumentFasil}
            rawResponsesPM={rawResponsesPM}
            rawResponsesSRFasil={rawResponsesSRFasil}
            agendas={agendas}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Admin Dashboard Load Error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Koneksi Database Gagal</h2>
            <p className="text-gray-600 text-sm">
              Terjadi kesalahan server saat memuat data dari Google Sheets ke Dashboard.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm mb-6 text-gray-700">
            <h3 className="font-bold text-gray-900 mb-2">Penyebab Umum:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Environment Variables di Vercel belum lengkap (<strong>SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, JWT_SECRET</strong>).</li>
              <li>Format <strong>GOOGLE_PRIVATE_KEY</strong> tidak sesuai (butuh di-replace newlines / hilangkan tanda kutip ganda pembungkus di Vercel).</li>
              <li>Ada tab / sheet name yang terhapus atau berubah namanya di Google Spreadsheet.</li>
            </ul>
          </div>
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detail Error (Server logs):</h4>
            <pre className="text-xs bg-red-50 text-red-700 p-4 rounded-xl overflow-x-auto border border-red-100 font-mono">
              {error.stack || error.message || String(error)}
            </pre>
          </div>
          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

}
