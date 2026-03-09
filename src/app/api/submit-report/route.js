// src/app/api/submit-report/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_etoser, tahun_pembinaan, periode, jawaban } = body;

    const sheet = await getGoogleSheet('Response_PM');

    // 1. Susun data dasar (Timestamp & Identitas)
    const newRow = {
      Timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      ID_Etoser: id_etoser,
      Tahun_Pembinaan: tahun_pembinaan,
      Bulan_Laporan: periode, // ⚠️ PASTIKAN ADA KOLOM "Bulan_Laporan" DI SHEET KAMU
    };

    // 2. Looping jawaban untuk mengisi kolom A1_Skor, A1_Val, dst.
    for (const kodeSoal in jawaban) {
      newRow[`${kodeSoal}_Skor`] = jawaban[kodeSoal].skor;
      
      // Jika ada teks isian validasi, masukkan ke kolom _Val
      if (jawaban[kodeSoal].val) {
        newRow[`${kodeSoal}_Val`] = jawaban[kodeSoal].val;
      }
    }

    // 3. Simpan sebagai baris baru di Google Sheets
    await sheet.addRow(newRow);

    return NextResponse.json({ message: 'Laporan berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Submit Error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan laporan ke database' }, { status: 500 });
  }
}