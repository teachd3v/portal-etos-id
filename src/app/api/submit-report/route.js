// src/app/api/submit-report/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_etoser, tahun_pembinaan, periode, jawaban } = body;

    const sheet = await getGoogleSheet('Response_PM');

    const mandatoryHeaders = ['Timestamp', 'ID_Etoser', 'Tahun_Pembinaan', 'Bulan_Laporan', 'Official_Feedback'];
    let currentHeaders = [];
    try {
      await sheet.loadHeaderRow();
      currentHeaders = sheet.headerValues || [];
    } catch {
      // Sheet kosong
    }

    // Gunakan Set untuk menjamin keunikan dan mempertahankan urutan
    const headerSet = new Set(mandatoryHeaders);
    currentHeaders.forEach(h => headerSet.add(h));

    for (const kode in jawaban) {
      if (!kode || kode === 'undefined' || kode === 'null') continue;
      headerSet.add(`${kode}_Skor`);
      if (jawaban[kode].val) {
        headerSet.add(`${kode}_Val`);
      }
    }

    const finalHeaders = Array.from(headerSet);

    // 2. Cek apakah ada perubahan (tambah kolom baru atau perbaikan A-E)
    // Gunakan "Double-Check Sync" untuk skalabilitas tinggi
    const isSame = finalHeaders.length === currentHeaders.length && 
                   finalHeaders.every((h, i) => h === currentHeaders[i]);

    if (!isSame) {
      console.log('Detected Header Change, Syncing Latest Before Update...');
      // Re-load sekali lagi detik terakhir biar nggak tabrakan sama user lain
      await sheet.loadHeaderRow();
      const latestHeaders = sheet.headerValues || [];
      const syncSet = new Set([...mandatoryHeaders, ...latestHeaders, ...finalHeaders]);
      const syncedHeaders = Array.from(syncSet);

      // PRO-FIX: Jika jumlah kolom baru melebihi kapasitas sheet saat ini, kita harus RESIZE dulu
      const currentColCount = sheet.gridProperties?.columnCount || 26;
      if (syncedHeaders.length > currentColCount) {
        console.log(`Resizing sheet to fit ${syncedHeaders.length} columns...`);
        await sheet.resize({ 
          rowCount: sheet.gridProperties?.rowCount || 1000, 
          columnCount: syncedHeaders.length + 5 // Kasih extra 5 biar nggak sering resize
        });
      }

      await sheet.setHeaderRow(syncedHeaders);
      await sheet.loadHeaderRow(); 
    }

    // 2. Susun data baris baru
    const newRow = {
      Timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      ID_Etoser: id_etoser,
      Tahun_Pembinaan: tahun_pembinaan,
      Bulan_Laporan: periode,
    };

    for (const kode in jawaban) {
      if (!kode || kode === 'undefined' || kode === 'null') continue;
      
      newRow[`${kode}_Skor`] = parseFloat(jawaban[kode].skor) || 0;
      if (jawaban[kode].val) {
        newRow[`${kode}_Val`] = jawaban[kode].val;
      }
    }

    // 3. Simpan ke Google Sheets
    const rowKeys = Object.keys(newRow);
    console.log(`Submitting ${rowKeys.length} items to PM (Row Data Keys):`, rowKeys);

    try {
      await sheet.addRow(newRow);
    } catch (err) {
      console.error('Core addRow Error:', err);
      // Sertakan semua kunci baris dalam pesan error agar bisa di-debug oleh user di browser
      throw new Error(`Google API Error: ${err.message}. Keys being sent: ${rowKeys.join(', ')}`);
    }

    return NextResponse.json({ message: 'Laporan berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Submit Error Log:', error);
    return NextResponse.json({ 
      message: 'Gagal menyimpan laporan ke database', 
      error: error.message,
      // Jika ada detail tambahan dari google-spreadsheet (misal: error response body)
      details: error.response?.data || null,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}