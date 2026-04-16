// src/app/api/admin/agenda/toggle/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// POST — Toggle aktif/nonaktif agenda (Admin only)
// Hanya 1 agenda yang boleh aktif sekaligus
export async function POST(req) {
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

    const { id_agenda, activate } = await req.json();

    if (!id_agenda) {
      return NextResponse.json({ message: 'ID agenda diperlukan.' }, { status: 400 });
    }

    const [sheetNasional, sheetWilayah] = await Promise.all([
      getGoogleSheet('Agenda_Nasional'),
      getGoogleSheet('Agenda_Wilayah'),
    ]);

    const [rowsNasional, rowsWilayah] = await Promise.all([
      sheetNasional.getRows(),
      sheetWilayah.getRows(),
    ]);

    const targetRowNas = rowsNasional.find(r => r.get('ID_Agenda') === id_agenda);
    const targetRowWil = rowsWilayah.find(r => r.get('ID_Agenda') === id_agenda);

    if (!targetRowNas && !targetRowWil) {
      return NextResponse.json({ message: 'Agenda tidak ditemukan.' }, { status: 404 });
    }

    const targetSheet = targetRowNas ? 'Nasional' : 'Wilayah';
    const rows = targetRowNas ? rowsNasional : rowsWilayah;

    // Logika toggle:
    // - Nasional: mutual exclusive → aktifkan satu, nonaktifkan semua Nasional lain
    // - Wilayah: bebas multi-aktif → hanya toggle target, tidak mempengaruhi agenda lain (di sheet yang sama)
    rows.forEach(r => {
      if (r.get('ID_Agenda') === id_agenda) {
        r.set('Is_Active', activate ? 'TRUE' : 'FALSE');
      } else if (activate && targetSheet === 'Nasional') {
        // Nonaktifkan semua Nasional lain
        r.set('Is_Active', 'FALSE');
      }
    });

    // Simpan semua perubahan di sheet yang relevan saja
    await Promise.all(rows.map(r => r.save()));

    return NextResponse.json({ message: 'Status agenda berhasil diperbarui.' }, { status: 200 });

  } catch (error) {
    console.error('Toggle Agenda Error:', error);
    return NextResponse.json({ message: 'Gagal memperbarui status agenda.', error: error.message }, { status: 500 });
  }
}
