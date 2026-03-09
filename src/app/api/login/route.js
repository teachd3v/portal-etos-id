// src/app/api/login/route.js
import { getGoogleSheet } from '@/lib/googleSheets';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, password } = body;

    // Tarik data dari kedua sheet
    const sheetPM = await getGoogleSheet('Users_PM');
    const sheetFasil = await getGoogleSheet('Users_Fasil');

    const rowsPM = await sheetPM.getRows();
    const rowsFasil = await sheetFasil.getRows();

    let user = null;

    // --- JALUR KHUSUS ADMIN PUSAT ---
    if (id === 'ADMIN' && password === 'adminpusat') {
      user = { 
        id: 'ADMIN', 
        nama: 'Super Admin Pusat', 
        role: 'Admin', 
        wilayah: 'Pusat' 
      };
    }

    // 1. Cek kecocokan di tabel PM (Hanya jika belum login sebagai admin)
    if (!user) {
      const foundPM = rowsPM.find(r => r.get('ID') === id && r.get('Password') === password);
      
      if (foundPM) {
        user = {
          id: foundPM.get('ID'),
          nama: foundPM.get('Nama_Etoser'),
          angkatan: foundPM.get('Angkatan'),
          wilayah: foundPM.get('Wilayah'),
          tahun_pembinaan: parseInt(foundPM.get('Tahun_Pembinaan')) || 0,
          role: 'PM'
        };
      }
    }

    // 2. Jika bukan PM & bukan Admin, cek di tabel Fasilitator
    if (!user) {
      const foundFasil = rowsFasil.find(r => r.get('ID_Fasil') === id && r.get('Password') === password);
      
      if (foundFasil) {
        user = {
          id: foundFasil.get('ID_Fasil'),
          nama: foundFasil.get('Nama_Fasil'),
          wilayah: foundFasil.get('Wilayah_Binaan'),
          role: 'Fasilitator'
        };
      }
    }

    // Jika ID & Password tidak ada di semua tabel
    if (!user) {
      return NextResponse.json({ message: 'ID atau Password salah!' }, { status: 401 });
    }

    // 3. Buat JWT Token (Session)
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d' });

    // 4. Set Cookie & Kirim Response
    const response = NextResponse.json({ 
      message: 'Login Berhasil!', 
      role: user.role 
    }, { status: 200 });

    response.cookies.set({
      name: 'session_etos',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 // Berlaku 1 Hari
    });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server database' }, { status: 500 });
  }
}