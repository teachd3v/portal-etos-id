// tmp/check-instrumen.js
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Data_Instrumen'];
    const rows = await sheet.getRows();
    
    const mapping = {};
    rows.forEach(r => {
      const v = r.get('Variabel');
      const k = r.get('Kode');
      if (!mapping[v]) mapping[v] = new Set();
      mapping[v].add(k.substring(0, 1)); // Group by prefix A, B, C, D...
    });
    
    console.log('Mapping Variabel to Code Prefix:');
    for (const v in mapping) {
      console.log(`${v}: ${[...mapping[v]].join(', ')}`);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
