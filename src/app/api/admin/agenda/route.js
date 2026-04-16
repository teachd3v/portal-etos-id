// src/app/api/admin/agenda/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_etos')?.value;
  if (!token) return null;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'Admin') return null;
    return user;
  } catch {
    return null;
  }
}

// GET — Daftar semua agenda (Admin only)
export async function GET() {
  const user = await checkAdminAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [sheetNasional, sheetWilayah] = await Promise.all([
      getGoogleSheet('Agenda_Nasional'),
      getGoogleSheet('Agenda_Wilayah'),
    ]);

    const [rowsNasional, rowsWilayah] = await Promise.all([
      sheetNasional.getRows(),
      sheetWilayah.getRows(),
    ]);

    const agendasNasional = rowsNasional.map(row => ({
      id: row.get('ID_Agenda'),
      nama: row.get('Nama_Agenda'),
      tanggal: row.get('Tanggal') || '',
      is_active: row.get('Is_Active') === 'TRUE',
      pelaksana: row.get('Pelaksana') || 'Nasional',
      jenis_aktivitas: row.get('Jenis_Aktivitas') || '',
      tema: row.get('Tema') || '',
    }));

    const agendasWilayah = rowsWilayah.map(row => ({
      id: row.get('ID_Agenda'),
      nama: row.get('Nama_Agenda'),
      tanggal: '',
      is_active: row.get('Is_Active') === 'TRUE',
      pelaksana: row.get('Pelaksana') || 'Wilayah',
      jenis_aktivitas: row.get('Jenis_Aktivitas') || '',
      tema: row.get('Tema') || '',
    }));

    const agendas = [...agendasNasional, ...agendasWilayah].reverse();

    return NextResponse.json({ agendas }, { status: 200 });
  } catch (error) {
    console.error('GET Agenda Error:', error);
    return NextResponse.json({ message: 'Gagal mengambil data agenda.', error: error.message }, { status: 500 });
  }
}

// POST — Buat agenda baru (Admin only)
export async function POST(req) {
  const user = await checkAdminAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { nama, tanggal, pelaksana, jenis_aktivitas, tema } = await req.json();

    const pelaksanaVal = pelaksana === 'Pusat' || pelaksana === 'Nasional' ? 'Nasional' : 'Wilayah';
    const jenisVal = pelaksanaVal === 'Nasional' ? 'Tematik' : (jenis_aktivitas || '');
    const finalNama = (nama?.trim() || (pelaksanaVal === 'Wilayah' ? jenisVal : '')).trim();

    if (!finalNama && pelaksanaVal === 'Nasional') {
      return NextResponse.json({ message: 'Nama agenda nasional tidak boleh kosong.' }, { status: 400 });
    }
    if (!finalNama) {
      return NextResponse.json({ message: 'Nama agenda atau jenis aktivitas diperlukan.' }, { status: 400 });
    }

    const sheetTitle = pelaksanaVal === 'Nasional' ? 'Agenda_Nasional' : 'Agenda_Wilayah';
    const sheet = await getGoogleSheet(sheetTitle);

    // Sync header jika sheet baru/kosong
    try { await sheet.loadHeaderRow(); } catch { /* kosong */ }
    
    const mandatoryHeaders = pelaksanaVal === 'Nasional'
      ? ['ID_Agenda', 'Nama_Agenda', 'Tanggal', 'Is_Active', 'Pelaksana', 'Jenis_Aktivitas', 'Tema']
      : ['ID_Agenda', 'Nama_Agenda', 'Is_Active', 'Pelaksana', 'Jenis_Aktivitas', 'Tema'];

    const currentHeaders = sheet.headerValues || [];
    const headerSet = new Set([...mandatoryHeaders, ...currentHeaders]);
    const finalHeaders = Array.from(headerSet);
    const isSame = finalHeaders.length === currentHeaders.length &&
                   finalHeaders.every((h, i) => h === currentHeaders[i]);
    if (!isSame) await sheet.setHeaderRow(finalHeaders);

    const idAgenda = 'AGD-' + Date.now();
    const temaVal = tema?.trim() || '';

    const rowData = pelaksanaVal === 'Nasional' 
      ? {
          ID_Agenda: idAgenda,
          Nama_Agenda: finalNama,
          Tanggal: tanggal || '',
          Is_Active: 'FALSE',
          Pelaksana: pelaksanaVal,
          Jenis_Aktivitas: jenisVal,
          Tema: temaVal,
        }
      : {
          ID_Agenda: idAgenda,
          Nama_Agenda: finalNama,
          Is_Active: 'FALSE',
          Pelaksana: pelaksanaVal,
          Jenis_Aktivitas: jenisVal,
          Tema: temaVal,
        };

    await sheet.addRow(rowData);

    return NextResponse.json({
      message: 'Agenda berhasil dibuat!',
      agenda: {
        id: idAgenda, nama: finalNama, 
        tanggal: pelaksanaVal === 'Nasional' ? (tanggal || '') : '', 
        is_active: false,
        pelaksana: pelaksanaVal, jenis_aktivitas: jenisVal, 
        tema: temaVal,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('POST Agenda Error:', error);
    return NextResponse.json({ message: 'Gagal membuat agenda.', error: error.message }, { status: 500 });
  }
}

// DELETE — Hapus agenda (Admin only)
export async function DELETE(req) {
  const user = await checkAdminAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id_agenda } = await req.json();

    if (!id_agenda) {
      return NextResponse.json({ message: 'ID agenda diperlukan.' }, { status: 400 });
    }

    // Cek di kedua sheet
    const [sheetNasional, sheetWilayah] = await Promise.all([
      getGoogleSheet('Agenda_Nasional'),
      getGoogleSheet('Agenda_Wilayah'),
    ]);

    const [rowsNasional, rowsWilayah] = await Promise.all([
      sheetNasional.getRows(),
      sheetWilayah.getRows(),
    ]);

    const rowNasional = rowsNasional.find(r => r.get('ID_Agenda') === id_agenda);
    const rowWilayah = rowsWilayah.find(r => r.get('ID_Agenda') === id_agenda);

    if (!rowNasional && !rowWilayah) {
      return NextResponse.json({ message: 'Agenda tidak ditemukan.' }, { status: 404 });
    }

    if (rowNasional) await rowNasional.delete();
    if (rowWilayah) await rowWilayah.delete();

    return NextResponse.json({ message: 'Agenda berhasil dihapus.' }, { status: 200 });

  } catch (error) {
    console.error('DELETE Agenda Error:', error);
    return NextResponse.json({ message: 'Gagal menghapus agenda.', error: error.message }, { status: 500 });
  }
}
