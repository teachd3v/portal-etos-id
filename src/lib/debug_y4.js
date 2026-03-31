// src/lib/debug_y4.js
import { getGoogleSheet } from './googleSheets.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debug() {
  try {
    console.log('--- TESTING CONNECTION (Instrumen_Etoser) ---');
    const sheet = await getGoogleSheet('Instrumen_Etoser');
    const rows = await sheet.getRows();
    const y4 = rows.filter(r => parseInt(r.get('Tahun')) === 4);
    
    console.log('Year 4 Instrument Count:', y4.length);
    y4.forEach(r => {
      console.log(`Kode: [${r.get('Kode')}] | Variabel: ${r.get('Variabel')}`);
    });

    console.log('--- TESTING PM HEADERS (Response_PM) ---');
    const responsePM = await getGoogleSheet('Response_PM');
    await responsePM.loadHeaderRow();
    console.log('Current PM Headers Count:', responsePM.headerValues.length);
    console.log('Current PM Headers (Sample):', responsePM.headerValues.slice(0, 10));

  } catch (err) {
    console.error('Debug Error:', err);
  }
}

debug();
