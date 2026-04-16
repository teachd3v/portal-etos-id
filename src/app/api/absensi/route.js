// src/app/api/absensi/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// POST — Submit absensi (public, no auth required)
export async function POST(req) {
  try {
    const { id_etoser } = await req.json();

    if (!id_etoser || !id_etoser.trim()) {
      return NextResponse.json({ message: 'ID Etoser tidak boleh kosong.' }, { status: 400 });
    }

    const idTrimmed = id_etoser.trim().toUpperCase();

    // Fetch Users_PM dan Agenda_Nasional secara paralel
    const [sheetPM, sheetAgenda] = await Promise.all([
      getGoogleSheet('Users_PM'),
      getGoogleSheet('Agenda_Nasional'),
    ]);

    const [rowsPM, rowsAgenda] = await Promise.all([
      sheetPM.getRows(),
      sheetAgenda.getRows(),
    ]);

    // Cek ID Etoser
    const etoserRow = rowsPM.find(r => r.get('ID')?.trim().toUpperCase() === idTrimmed);
    if (!etoserRow) {
      return NextResponse.json({ message: 'ID Etoser tidak ditemukan. Pastikan ID yang kamu masukkan sudah benar.' }, { status: 400 });
    }

    const nama = etoserRow.get('Nama_Etoser') || '';
    const angkatan = etoserRow.get('Angkatan') || '-';
    const wilayah = etoserRow.get('Wilayah') || '-';

    // Cek agenda aktif
    const agendaRow = rowsAgenda.find(r => r.get('Is_Active') === 'TRUE');
    if (!agendaRow) {
      return NextResponse.json({ message: 'Tidak ada agenda pembinaan yang sedang aktif saat ini.' }, { status: 400 });
    }

    const idAgenda = agendaRow.get('ID_Agenda');
    const namaAgenda = agendaRow.get('Nama_Agenda');

    // Cek duplikat absensi
    const sheetAbsensi = await getGoogleSheet('Absensi_Nasional');

    // Sync header jika perlu
    const mandatoryHeaders = ['Timestamp', 'ID_Etoser', 'Nama_Etoser', 'Angkatan', 'Wilayah', 'ID_Agenda', 'Nama_Agenda'];
    try { await sheetAbsensi.loadHeaderRow(); } catch { /* kosong */ }
    const currentHeaders = sheetAbsensi.headerValues || [];
    const headerSet = new Set([...mandatoryHeaders, ...currentHeaders]);
    const finalHeaders = Array.from(headerSet);
    const isSame = finalHeaders.length === currentHeaders.length &&
                   finalHeaders.every((h, i) => h === currentHeaders[i]);
    if (!isSame) await sheetAbsensi.setHeaderRow(finalHeaders);

    const rowsAbsensi = await sheetAbsensi.getRows();

    const sudahAbsen = rowsAbsensi.find(
      r => r.get('ID_Etoser')?.trim().toUpperCase() === idTrimmed && r.get('ID_Agenda') === idAgenda
    );
    if (sudahAbsen) {
      return NextResponse.json({
        message: 'Kamu sudah tercatat hadir di agenda pembinaan ini.',
        nama, angkatan, wilayah, nama_agenda: namaAgenda,
      }, { status: 409 });
    }

    // Simpan absensi
    await sheetAbsensi.addRow({
      Timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      ID_Etoser: idTrimmed,
      Nama_Etoser: nama,
      Angkatan: angkatan,
      Wilayah: wilayah,
      ID_Agenda: idAgenda,
      Nama_Agenda: namaAgenda,
    });

    return NextResponse.json({
      message: 'Kehadiran berhasil dicatat!',
      nama, angkatan, wilayah, nama_agenda: namaAgenda,
    }, { status: 200 });

  } catch (error) {
    console.error('Absensi Submit Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server. Coba lagi.', error: error.message }, { status: 500 });
  }
}

// GET — List absensi per agenda (Admin only)
export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_etos')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const agendaId = searchParams.get('agenda_id');

    if (!agendaId) {
      return NextResponse.json({ message: 'Parameter agenda_id diperlukan.' }, { status: 400 });
    }

    const sheet = await getGoogleSheet('Absensi_Nasional');
    const rows = await sheet.getRows();

    const absensi = rows
      .filter(r => r.get('ID_Agenda') === agendaId)
      .map(r => ({
        timestamp: r.get('Timestamp'),
        id_etoser: r.get('ID_Etoser'),
        nama: r.get('Nama_Etoser'),
        angkatan: r.get('Angkatan'),
        wilayah: r.get('Wilayah'),
      }));

    return NextResponse.json({ absensi }, { status: 200 });

  } catch (error) {
    console.error('Absensi GET Error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data absensi.', error: error.message }, { status: 500 });
  }
}
