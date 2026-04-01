// src/app/api/submit-fasil/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      id_fasil, id_etoser_dinilai, jawaban, rekomendasi, 
      catatan_kualitatif, sanksi = [], total_poin = 0, periode 
    } = body;

    const sheet = await getGoogleSheet('Review_Fasil');

    // 1. Sinkronisasi Header (untuk memastikan kolom Bulan_Laporan tersedia)
    const mandatoryHeaders = [
      'Timestamp', 'ID_Fasil', 'ID_Etoser_Dinilai', 
      'Skor_Integritas', 'Catatan_Integritas', 
      'Skor_Profesional', 'Catatan_Profesional', 
      'Skor_Kontributif', 'Catatan_Kontributif', 
      'Skor_Transformatif', 'Catatan_Transformatif', 
      'Kesimpulan_Rekomendasi', 'Catatan_Kualitatif', 
      'Kategori_Sanksi', 'Detail_Pelanggaran', 'Total_Poin', 
      'Bulan_Laporan' // Kolom Baru
    ];

    try {
      await sheet.loadHeaderRow();
      const currentHeaders = sheet.headerValues || [];
      const isSame = mandatoryHeaders.every(h => currentHeaders.includes(h));

      if (!isSame) {
        // Gabungkan header lama dengan mandatory (tanpa duplikat)
        const newHeaders = Array.from(new Set([...currentHeaders, ...mandatoryHeaders]));
        await sheet.setHeaderRow(newHeaders);
      }
    } catch {
       // Jika sheet masih mentah/kosong, set header awal
       await sheet.setHeaderRow(mandatoryHeaders);
    }

    // 2. Susun data sesuai urutan kolom di sheet Review_Fasil
    const newRow = {
      Timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      ID_Fasil: id_fasil,
      ID_Etoser_Dinilai: id_etoser_dinilai,

      Skor_Integritas: jawaban.Integritas?.skor || '',
      Catatan_Integritas: jawaban.Integritas?.catatan || '',

      Skor_Profesional: jawaban.Profesional?.skor || '',
      Catatan_Profesional: jawaban.Profesional?.catatan || '',

      Skor_Kontributif: jawaban.Kontributif?.skor || '',
      Catatan_Kontributif: jawaban.Kontributif?.catatan || '',

      Skor_Transformatif: jawaban.Transformatif?.skor || '',
      Catatan_Transformatif: jawaban.Transformatif?.catatan || '',

      Kesimpulan_Rekomendasi: rekomendasi,
      Catatan_Kualitatif: catatan_kualitatif,

      Kategori_Sanksi: sanksi.length > 0 ? sanksi.map(s => s.kategori).join(', ') : '',
      Detail_Pelanggaran: sanksi.length > 0 ? sanksi.map(s => s.detail).join(', ') : '',
      Total_Poin: sanksi.length > 0 ? total_poin : '',
      
      Bulan_Laporan: periode || '' // Simpan periode eksplisit (e.g. "03-2026")
    };

    await sheet.addRow(newRow);

    return NextResponse.json({ message: 'Evaluasi berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Submit Fasil Error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan evaluasi', error: error.message }, { status: 500 });
  }
}
