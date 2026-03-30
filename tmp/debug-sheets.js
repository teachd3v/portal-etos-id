// /tmp/debug-sheets.js
const { getGoogleSheet } = require('../src/lib/googleSheets');
require('dotenv').config({ path: '.env.local' });

async function debug() {
  try {
    console.log('Testing sheet access for Response_Self_Report_Fasil...');
    const sheet = await getGoogleSheet('Response_Self_Report_Fasil');
    console.log('Sheet found:', sheet.title);
    
    try {
      await sheet.loadHeaderRow();
      console.log('Current headers:', sheet.headerValues);
    } catch (e) {
      console.log('LoadHeaderRow failed (Empty sheet?):', e.message);
    }

    console.log('Accessing Instrumen_Fasil to see codes...');
    const instSheet = await getGoogleSheet('Instrumen_Fasil');
    const rows = await instSheet.getRows();
    const codes = rows.map(r => ({ role: r.get('Variabel'), kode: r.get('Kode') }));
    console.log('All available codes in Instrumen_Fasil:', codes);

  } catch (err) {
    console.error('DEBUG ERROR:', err);
  }
}

debug();
