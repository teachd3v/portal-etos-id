// src/app/api/absensi-wilayah/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// GET — dua mode via query param ?type=
//   lookup  : verifikasi ID Fasil, kembalikan info Fasil + daftar Etoser binaan + agenda Wilayah aktif
//   existing: ambil Etoser yang sudah tercatat hadir untuk (id_fasil + agenda_id)
//   all     : admin — semua kehadiran untuk satu agenda (tanpa filter id_fasil)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // ── LOOKUP ──────────────────────────────────────────────────────────────
  if (type === 'lookup') {
    const idFasil = searchParams.get('id_fasil')?.trim().toUpperCase();
    if (!idFasil) return NextResponse.json({ message: 'ID Fasil diperlukan.' }, { status: 400 });

    try {
      const [sheetFasil, sheetPM, sheetAgenda] = await Promise.all([
        getGoogleSheet('Users_Fasil'),
        getGoogleSheet('Users_PM'),
        getGoogleSheet('Agenda_Wilayah'),
      ]);
      const [rowsFasil, rowsPM, rowsAgenda] = await Promise.all([
        sheetFasil.getRows(),
        sheetPM.getRows(),
        sheetAgenda.getRows(),
      ]);

      // Verifikasi ID Fasil
      const fasilRow = rowsFasil.find(r => r.get('ID_Fasil')?.trim().toUpperCase() === idFasil);
      if (!fasilRow) return NextResponse.json({ message: 'ID Fasil tidak ditemukan.' }, { status: 400 });

      const fasil = {
        id: fasilRow.get('ID_Fasil'),
        nama: fasilRow.get('Nama_Fasil') || '',
        wilayah: fasilRow.get('Wilayah_Binaan') || '-',
        role: fasilRow.get('Role') || '',
        relasi_pm: fasilRow.get('Relasi_PM') || '',
      };

      // Daftar Etoser binaan dari Relasi_PM
      const relasiIds = fasil.relasi_pm
        ? fasil.relasi_pm.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      // Fallback: ambil semua PM wilayah yang sama jika Relasi_PM kosong
      const etosers = relasiIds.length > 0
        ? relasiIds.map(id => {
            const row = rowsPM.find(r => r.get('ID')?.trim() === id);
            if (!row) return null;
            return {
              id: row.get('ID'),
              nama: row.get('Nama_Etoser') || '',
              angkatan: row.get('Angkatan') || '-',
              wilayah: row.get('Wilayah') || '-',
            };
          }).filter(Boolean)
        : rowsPM
            .filter(r => (r.get('Wilayah') || '') === fasil.wilayah)
            .map(r => ({
              id: r.get('ID'),
              nama: r.get('Nama_Etoser') || '',
              angkatan: r.get('Angkatan') || '-',
              wilayah: r.get('Wilayah') || '-',
            }));

      // Agenda Wilayah yang aktif
      const activeAgendas = rowsAgenda
        .filter(r => r.get('Is_Active') === 'TRUE' && r.get('Pelaksana') === 'Wilayah')
        .map(r => ({
          id: r.get('ID_Agenda'),
          nama: r.get('Nama_Agenda'),
          jenis_aktivitas: r.get('Jenis_Aktivitas') || '',
          tema: r.get('Tema') || '',
          tanggal: '', // Di wilayah, tanggal diinput saat absen
        }));

      return NextResponse.json({ fasil, etosers, active_agendas: activeAgendas }, { status: 200 });
    } catch (error) {
      console.error('Lookup Error:', error);
      return NextResponse.json({ message: 'Terjadi kesalahan server.', error: error.message }, { status: 500 });
    }
  }

  // ── EXISTING ─────────────────────────────────────────────────────────────
  if (type === 'existing') {
    const idFasil = searchParams.get('id_fasil')?.trim().toUpperCase();
    const agendaId = searchParams.get('agenda_id');
    if (!idFasil || !agendaId) return NextResponse.json({ message: 'id_fasil dan agenda_id diperlukan.' }, { status: 400 });

    try {
      const sheet = await getGoogleSheet('Absensi_Wilayah');
      const rows = await sheet.getRows();
      const hadir_ids = rows
        .filter(r => r.get('ID_Fasil')?.trim().toUpperCase() === idFasil && r.get('ID_Agenda') === agendaId)
        .map(r => r.get('ID_Etoser'));
      return NextResponse.json({ hadir_ids }, { status: 200 });
    } catch (error) {
      console.error('Existing Error:', error);
      return NextResponse.json({ hadir_ids: [] }, { status: 200 }); // Gagal fetch = anggap kosong
    }
  }

  // ── ALL (admin) ───────────────────────────────────────────────────────────
  if (type === 'all') {
    // Admin auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('session_etos')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      if (user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agendaId = searchParams.get('agenda_id');
    if (!agendaId) return NextResponse.json({ message: 'agenda_id diperlukan.' }, { status: 400 });

    try {
      const sheet = await getGoogleSheet('Absensi_Wilayah');
      const rows = await sheet.getRows();
      const absensi = rows
        .filter(r => r.get('ID_Agenda') === agendaId)
        .map(r => ({
          timestamp: r.get('Timestamp'),
          id_fasil: r.get('ID_Fasil'),
          nama_fasil: r.get('Nama_Fasil'),
          id_etoser: r.get('ID_Etoser'),
          nama: r.get('Nama_Etoser'),
          angkatan: r.get('Angkatan'),
          wilayah: r.get('Wilayah_Etoser'),
        }));
      return NextResponse.json({ absensi }, { status: 200 });
    } catch (error) {
      console.error('All Error:', error);
      return NextResponse.json({ message: 'Gagal mengambil data.', error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Parameter type tidak valid.' }, { status: 400 });
}

// POST — Simpan/update absensi wilayah (public, cukup ID Fasil)
// Strategi upsert: hapus semua baris (id_fasil + id_agenda) lama, lalu insert yang baru
export async function POST(req) {
  try {
    const { id_fasil, agenda_id, id_etosers_hadir, tanggal_pelaksanaan } = await req.json();

    if (!id_fasil || !agenda_id || !tanggal_pelaksanaan) {
      return NextResponse.json({ message: 'ID Fasil, ID Agenda, dan Tanggal Pelaksanaan diperlukan.' }, { status: 400 });
    }
    if (!Array.isArray(id_etosers_hadir)) {
      return NextResponse.json({ message: 'Data Etoser tidak valid.' }, { status: 400 });
    }

    const idFasilNorm = id_fasil.trim().toUpperCase();

    // Ambil semua data yang dibutuhkan secara paralel
    const [sheetFasil, sheetAgenda, sheetAbsensi, sheetPM] = await Promise.all([
      getGoogleSheet('Users_Fasil'),
      getGoogleSheet('Agenda_Wilayah'),
      getGoogleSheet('Absensi_Wilayah'),
      getGoogleSheet('Users_PM'),
    ]);
    const [rowsFasil, rowsAgenda, rowsAbsensi, rowsPM] = await Promise.all([
      sheetFasil.getRows(),
      sheetAgenda.getRows(),
      sheetAbsensi.getRows(),
      sheetPM.getRows(),
    ]);

    // Verifikasi Fasil
    const fasilRow = rowsFasil.find(r => r.get('ID_Fasil')?.trim().toUpperCase() === idFasilNorm);
    if (!fasilRow) return NextResponse.json({ message: 'ID Fasil tidak ditemukan.' }, { status: 400 });

    // Verifikasi Agenda
    const agendaRow = rowsAgenda.find(r => r.get('ID_Agenda') === agenda_id);
    if (!agendaRow) return NextResponse.json({ message: 'Agenda tidak ditemukan.' }, { status: 400 });
    if (agendaRow.get('Is_Active') !== 'TRUE') {
      return NextResponse.json({ message: 'Agenda sudah tidak aktif.' }, { status: 400 });
    }

    const namaFasil = fasilRow.get('Nama_Fasil') || '';
    const wilayahFasil = fasilRow.get('Wilayah_Binaan') || '';
    const namaAgenda = agendaRow.get('Nama_Agenda');
    const jenisAktivitas = agendaRow.get('Jenis_Aktivitas') || '';

    // Hapus semua baris lama (id_fasil + id_agenda)
    const oldRows = rowsAbsensi.filter(
      r => r.get('ID_Fasil')?.trim().toUpperCase() === idFasilNorm && r.get('ID_Agenda') === agenda_id
    );
    await Promise.all(oldRows.map(r => r.delete()));

    // Insert baris baru untuk setiap Etoser yang hadir
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const newRows = id_etosers_hadir.map(idEtoser => {
      const pmRow = rowsPM.find(r => r.get('ID')?.trim() === idEtoser.trim());
      return {
        Timestamp: timestamp,
        ID_Fasil: idFasilNorm,
        Nama_Fasil: namaFasil,
        Wilayah_Fasil: wilayahFasil,
        ID_Agenda: agenda_id,
        Nama_Agenda: namaAgenda,
        Jenis_Aktivitas: jenisAktivitas,
        Tanggal_Pelaksanaan: tanggal_pelaksanaan,
        ID_Etoser: idEtoser.trim(),
        Nama_Etoser: pmRow?.get('Nama_Etoser') || '',
        Angkatan: pmRow?.get('Angkatan') || '-',
        Wilayah_Etoser: pmRow?.get('Wilayah') || '-',
      };
    });

    // Sync header sheet jika perlu
    const mandatoryHeaders = [
      'Timestamp', 'ID_Fasil', 'Nama_Fasil', 'Wilayah_Fasil',
      'ID_Agenda', 'Nama_Agenda', 'Jenis_Aktivitas', 'Tanggal_Pelaksanaan',
      'ID_Etoser', 'Nama_Etoser', 'Angkatan', 'Wilayah_Etoser',
    ];
    try { await sheetAbsensi.loadHeaderRow(); } catch { /* kosong */ }
    const currentHeaders = sheetAbsensi.headerValues || [];
    const headerSet = new Set([...mandatoryHeaders, ...currentHeaders]);
    const finalHeaders = Array.from(headerSet);
    const isSame = finalHeaders.length === currentHeaders.length &&
                   finalHeaders.every((h, i) => h === currentHeaders[i]);
    if (!isSame) await sheetAbsensi.setHeaderRow(finalHeaders);

    // Simpan semua baris baru secara serial (addRow tidak bisa paralel)
    for (const row of newRows) {
      await sheetAbsensi.addRow(row);
    }

    return NextResponse.json({
      message: `Absensi berhasil disimpan! ${newRows.length} Etoser tercatat hadir.`,
      count: newRows.length,
    }, { status: 200 });

  } catch (error) {
    console.error('Absensi Wilayah POST Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server.', error: error.message }, { status: 500 });
  }
}
