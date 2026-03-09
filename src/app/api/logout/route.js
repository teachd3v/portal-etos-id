// src/app/api/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout berhasil' });
  // Menghapus cookie session agar user tertendang keluar
  response.cookies.delete('session_etos');
  return response;
}