// src/lib/googleSheets.js
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getGoogleSheet(sheetTitle) {
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL is missing from environment variables.');
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY is missing from environment variables.');
    }
    if (!process.env.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID is missing from environment variables.');
    }

    // Bersihkan key dari escape newlines dan hilangkan tanda kutip pembungkus
    const formattedKey = process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, '\n')
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1');

    // Inisialisasi Autentikasi Service Account
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: formattedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Panggil ID Dokumen Spreadsheet
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
    
    // Load metadata dokumen (nama sheet, dll)
    await doc.loadInfo(); 
    
    // Pilih sheet berdasarkan nama tab yang dilempar dari parameter
    const sheet = doc.sheetsByTitle[sheetTitle];
    
    if (!sheet) {
      throw new Error(`Sheet dengan nama "${sheetTitle}" tidak ditemukan di Google Spreadsheet!`);
    }

    return sheet;
  } catch (error) {
    console.error('Google Sheets Connection Error:', error);
    throw error;
  }
}