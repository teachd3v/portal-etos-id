// src/app/api/submit-fasil/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export default async function POST(req) {
  try {
    const body = await req.json();
    const { id_fasil, id_etoser_dinilai, jawaban, rekomendasi, catatan_kualitatif } = body;
    
    const sheet = await getGoogleSheet('Response_Fasil');

    // Susun data sesuai header di sheet Response_Fasil
    const newRow = {
      Timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      ID_Fasil: id_fasil,
      ID_Etoser_Dinilai: id_etoser_dinilai,
      
      Skor_Integritas_Adab: jawaban.Adab.skor,
      Catatan_Integritas_Adab: jawaban.Adab.catatan,
      
      Skor_Integritas_Ibadah: jawaban.Ibadah.skor,
      Catatan_Integritas_Ibadah: jawaban.Ibadah.catatan,
      
      Skor_Komitmen_Pembinaan: jawaban.Komitmen.skor,
      Catatan_Komitmen_Pembinaan: jawaban.Komitmen.catatan,
      
      Skor_Profesional: jawaban.Profesional.skor,
      Catatan_Profesional: jawaban.Profesional.catatan,
      
      Skor_Transformatif: jawaban.Transformatif.skor,
      Catatan_Transformatif: jawaban.Transformatif.catatan,
      
      Kesimpulan_Rekomendasi: rekomendasi,
      Catatan_Kualitatif: catatan_kualitatif
    };

    await sheet.addRow(newRow);

    return NextResponse.json({ message: 'Evaluasi berhasil disimpan!' }, { status: 200 });
  } catch (error) {
    console.error('Submit Fasil Error:', error);
    return NextResponse.json({ message: 'Gagal menyimpan evaluasi' }, { status: 500 });
  }
}