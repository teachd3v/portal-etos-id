import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getGoogleSheet } from '@/lib/googleSheets';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_etos')?.value;
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'Admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    const { target, id, periode, feedback } = await req.json();

    if (target === 'pm') {
      const sheet = await getGoogleSheet('Response_PM');
      const rows = await sheet.getRows();
      
      // Cari row yg sesuai (ID_Etoser & Periode Bulan Laporan)
      const row = rows.find(r => r.get('ID_Etoser') === id && r.get('Bulan_Laporan') === periode); 
      
      if (row) {
        row.set('Official_Feedback', feedback);
        await row.save();
      } else {
        // Jika belum lapor, buat entry feedback admin untuk periode tsb agar bisa terbaca saat lapor/dashboard
        await sheet.addRow({
          ID_Etoser: id,
          Bulan_Laporan: periode,
          Official_Feedback: feedback,
          Timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
        });
      }
    } else if (target === 'fasil') {
      const sheet = await getGoogleSheet('Response_Self_Report_Fasil');
      const rows = await sheet.getRows();
      // Cari row yg sesuai (ID_Fasil & Periode)
      const row = rows.find(r => r.get('ID_Fasil') === id && r.get('Bulan_Laporan') === periode);

      if (row) {
        row.set('Official_Feedback', feedback);
        await row.save();
      } else {
        await sheet.addRow({
          ID_Fasil: id,
          Bulan_Laporan: periode,
          Official_Feedback: feedback,
          Timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
        });
      }
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Feedback Save Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
