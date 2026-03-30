// src/app/api/submit-self-report-fasil/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { id_fasil, role_fasil, periode, jawaban } = await req.json();

    const sheet = await getGoogleSheet('Response_Self_Report_Fasil');

    // Pastikan kolom skor sudah ada di header sheet sebelum addRow()
    // Jika sheet benar-benar kosong, loadHeaderRow() akan melempar error
    try {
      await sheet.loadHeaderRow();
    } catch {
      // Abaikan error jika sheet kosong (belum ada header sama sekali)
    }

    const existingHeaders = [...(sheet.headerValues || ['Timestamp', 'ID_Fasil', 'Role_Fasil', 'Bulan_Laporan'])];

    let headersChanged = false;
    for (const kode in jawaban) {
      if (!existingHeaders.includes(`${kode}_Skor`)) {
        existingHeaders.push(`${kode}_Skor`);
        headersChanged = true;
      }
      if (!existingHeaders.includes(`${kode}_Val`)) {
        existingHeaders.push(`${kode}_Val`);
        headersChanged = true;
      }
    }

    if (headersChanged || !sheet.headerValues) {
      await sheet.setHeaderRow(existingHeaders);
      // RELOAD headers to ensure addRow mapping is updated!
      await sheet.loadHeaderRow();
    }

    const newRow = {
      Timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      ID_Fasil: id_fasil,
      Role_Fasil: role_fasil,
      Bulan_Laporan: periode,
    };

    for (const kode in jawaban) {
      // Pastikan nilai skor masuk sebagai angka (parseFloat)
      newRow[`${kode}_Skor`] = parseFloat(jawaban[kode].skor) || 0;
      if (jawaban[kode].val) {
        newRow[`${kode}_Val`] = jawaban[kode].val;
      }
    }

    await sheet.addRow(newRow);

    return NextResponse.json({ message: 'Laporan Fasil berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Submit Self-Report Fasil Error:', error);
    return NextResponse.json({ 
      message: 'Gagal menyimpan laporan', 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
