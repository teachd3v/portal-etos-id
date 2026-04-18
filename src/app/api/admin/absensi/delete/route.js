// src/app/api/admin/absensi/delete/route.js
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

// DELETE — Hapus satu entri absensi dengan verifikasi password
// Body: { id_etoser, id_agenda, timestamp, password, type: 'nasional' | 'wilayah' }
export async function DELETE(req) {
  const user = await checkAdminAuth();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id_etoser, id_agenda, timestamp, password, type } = await req.json();

    // Validasi field wajib
    if (!id_etoser || !id_agenda || !password) {
      return NextResponse.json({ message: 'Data tidak lengkap.' }, { status: 400 });
    }

    // === Verifikasi Password Admin ===
    // Admin pusat: ID = 'ADMIN', password = 'adminpusat' (hardcoded sama seperti login)
    // Atau cek di sheet Users_PM untuk admin lain
    let passwordValid = false;

    if (user.id === 'ADMIN' && password === 'adminpusat') {
      passwordValid = true;
    } else {
      // Cek password di sheet Users_PM
      const sheetPM = await getGoogleSheet('Users_PM');
      const rowsPM = await sheetPM.getRows();
      const adminRow = rowsPM.find(
        (r) => r.get('ID') === user.id && r.get('Password') === password
      );
      if (adminRow) passwordValid = true;
    }

    if (!passwordValid) {
      return NextResponse.json({ message: 'Password salah. Penghapusan dibatalkan.' }, { status: 403 });
    }

    // === Tentukan sheet target ===
    const sheetName = type === 'wilayah' ? 'Absensi_Wilayah' : 'Absensi_Nasional';
    const idEtoserField = 'ID_Etoser';
    const idAgendaField = 'ID_Agenda';
    const timestampField = 'Timestamp';

    const sheet = await getGoogleSheet(sheetName);
    const rows = await sheet.getRows();

    // Cari baris yang cocok
    let targetRow = null;

    if (timestamp) {
      // Cari berdasarkan id_etoser + id_agenda + timestamp (paling spesifik)
      targetRow = rows.find(
        (r) =>
          r.get(idEtoserField)?.trim().toUpperCase() === id_etoser.trim().toUpperCase() &&
          r.get(idAgendaField) === id_agenda &&
          r.get(timestampField) === timestamp
      );
    }

    // Fallback: cari berdasarkan id_etoser + id_agenda saja (ambil yang pertama)
    if (!targetRow) {
      targetRow = rows.find(
        (r) =>
          r.get(idEtoserField)?.trim().toUpperCase() === id_etoser.trim().toUpperCase() &&
          r.get(idAgendaField) === id_agenda
      );
    }

    if (!targetRow) {
      return NextResponse.json({ message: 'Data absensi tidak ditemukan.' }, { status: 404 });
    }

    await targetRow.delete();

    return NextResponse.json({ message: 'Data absensi berhasil dihapus.' }, { status: 200 });
  } catch (error) {
    console.error('Delete Absensi Error:', error);
    return NextResponse.json({ message: 'Gagal menghapus data absensi.', error: error.message }, { status: 500 });
  }
}
