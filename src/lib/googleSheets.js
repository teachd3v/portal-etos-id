// src/lib/googleSheets.js
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getGoogleSheet(sheetTitle) {
  try {
    // Inisialisasi Autentikasi Service Account
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      // .replace ini penting untuk mengatasi error format enter (\n) di env Next.js
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Panggil ID Dokumen Spreadsheet
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
    
    // Load metadata dokumen (nama sheet, dll)
    await doc.loadInfo(); 
    
    // Pilih sheet berdasarkan nama tab yang dilempar dari parameter
    const sheet = doc.sheetsByTitle[sheetTitle];
    
    if (!sheet) {
      throw new Error(`Sheet dengan nama "${sheetTitle}" tidak ditemukan!`);
    }

    return sheet;
  } catch (error) {
    console.error('Google Sheets Connection Error:', error);
    throw error;
  }
}