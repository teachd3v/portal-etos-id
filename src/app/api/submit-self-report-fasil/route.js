// src/app/api/submit-self-report-fasil/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { id_fasil, role_fasil, periode, jawaban } = await req.json();

    const sheet = await getGoogleSheet('Response_Fasil');

    const mandatoryHeaders = ['Timestamp', 'ID_Fasil', 'Role_Fasil', 'Bulan_Laporan', 'Official_Feedback'];
    let currentHeaders = [];
    try {
      await sheet.loadHeaderRow();
      currentHeaders = sheet.headerValues || [];
    } catch {
      // Sheet kosong
    }

    const headerSet = new Set(mandatoryHeaders);
    currentHeaders.forEach(h => headerSet.add(h));

    for (const kode in jawaban) {
      if (!kode || kode === 'undefined' || kode === 'null') continue;
      headerSet.add(`${kode}_Skor`);
      headerSet.add(`${kode}_Val`);
    }

    const finalHeaders = Array.from(headerSet);

    // 2. Cek apakah ada perubahan (tambah kolom baru atau perbaikan A-E)
    // Gunakan "Double-Check Sync" untuk skalabilitas tinggi
    const isSame = finalHeaders.length === currentHeaders.length && 
                   finalHeaders.every((h, i) => h === currentHeaders[i]);

    if (!isSame) {
      console.log('Detected Fasil Header Change, Syncing Latest...');
      // Re-load sekali lagi detik terakhir biar nggak tabrakan sama user lain
      await sheet.loadHeaderRow();
      const latestHeaders = sheet.headerValues || [];
      const syncSet = new Set([...mandatoryHeaders, ...latestHeaders, ...finalHeaders]);
      const syncedHeaders = Array.from(syncSet);

      // PRO-FIX: Jika jumlah kolom baru melebihi kapasitas sheet saat ini, kita harus RESIZE dulu
      const currentColCount = sheet.gridProperties?.columnCount || 26;
      if (syncedHeaders.length > currentColCount) {
        console.log(`Resizing Fasil sheet to fit ${syncedHeaders.length} columns...`);
        await sheet.resize({ 
          rowCount: sheet.gridProperties?.rowCount || 1000, 
          columnCount: syncedHeaders.length + 5 // Kasih extra 5 biar nggak sering resize
        });
      }

      await sheet.setHeaderRow(syncedHeaders);
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
