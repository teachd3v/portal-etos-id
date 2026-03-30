// /tmp/inspect-data.js
const { getGoogleSheet } = require('../src/lib/googleSheets');
require('dotenv').config({ path: '.env.local' });

async function inspect() {
  try {
    console.log('--- Inspecting Response_Fasil ---');
    const sheetResFasil = await getGoogleSheet('Response_Fasil');
    const rows = await sheetResFasil.getRows();
    rows.forEach((r, i) => {
      console.log(`Row ${i + 1}:`);
      console.log(`  Timestamp: ${r.get('Timestamp')}`);
      console.log(`  ID_Fasil: ${r.get('ID_Fasil')}`);
      console.log(`  ID_Etoser_Dinilai: ${r.get('ID_Etoser_Dinilai')}`);
      console.log(`  Skor_Integritas: ${r.get('Skor_Integritas')}`);
    });

    console.log('--- Inspecting Users_Fasil ---');
    const sheetFasil = await getGoogleSheet('Users_Fasil');
    const rowsFasil = await sheetFasil.getRows();
    rowsFasil.forEach((r, i) => {
      console.log(`Fasil ${i + 1}:`);
      console.log(`  ID_Fasil: ${r.get('ID_Fasil')}`);
      console.log(`  Relasi_PM: ${r.get('Relasi_PM')}`);
    });

  } catch (err) {
    console.error('INSPECT ERROR:', err);
  }
}

inspect();
