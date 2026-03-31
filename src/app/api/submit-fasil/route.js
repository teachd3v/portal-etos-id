// src/app/api/submit-fasil/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_fasil, id_etoser_dinilai, jawaban, rekomendasi, catatan_kualitatif, sanksi = [], total_poin = 0 } = body;

    const sheet = await getGoogleSheet('Review_Fasil');

    // Susun data sesuai urutan kolom di sheet Review_Fasil (A1-P1)
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

      // Kolom Sanksi (terisi hanya jika rekomendasi Unacceptable)
      Kategori_Sanksi: sanksi.length > 0 ? sanksi.map(s => s.kategori).join(', ') : '',
      Detail_Pelanggaran: sanksi.length > 0 ? sanksi.map(s => s.detail).join(', ') : '',
      Total_Poin: sanksi.length > 0 ? total_poin : '',
    };

    await sheet.addRow(newRow);

    return NextResponse.json({ message: 'Evaluasi berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Submit Fasil Error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan evaluasi' }, { status: 500 });
  }
}
