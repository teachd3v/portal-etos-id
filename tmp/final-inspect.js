// /tmp/final-inspect.js
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function getGoogleSheet(sheetTitle) {
  const serviceAccountAuth = new JWT({
    email: 'etos-db-admin@etos-id-self-report.iam.gserviceaccount.com',
    key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDWoAd5ovBKXgfC\n+qkojKotpIz2Z0BIVlxa/1Ii69nGhIbqVUn7qeJ6z+LigRL6q96R2Jd8YhsQYZR9\n/u/EUJnztVyjrbDPh7mdVCf6KDKzXAM6L/J/B51ScfBKtvSXkVKQZhcqa5+za3m1\nDXf9dJg05D3U1c1v0ZaAJu6G1huLOKRsRfacJ8VaH83v3zvwg/wx4COc+roppqXY\nBBC41VIAdVKIic1YN2AzYFnOcSwPVWCMmTmFbV26FhoIGMSLVQN9iX4b7C7zRI+3\nVLTrlxF0+licI5I+V+NsG9Hg2ieNuiefEwt7ww/6GaAlcMdhoEH42zWt/9O3Zj39\nSh2yLqLZAgMBAAECggEAFTzOoI2sA1/cmsGc/YM1z8BppnQ/GylYiDSdlxEJgqhY\nhVWdNYbw/0AU7l7hVuas5netPcSjcvKE9BbG+QEUytXWbefhCBghGN1b+1gA9FiV\nhSt7bnB9c8wMgAgsmdbqeZlwj2UI74MiDvVfOzhPW2R+bdIeOwNdRh8UGUmUfikV\nUFUUr2mbJGJOfJwFP4jG731PkvtJkKCCvfKULl7Ye9TUFFJq4iqMtMClwvbUG75t\neGbReVmtIGno14LsCiQ2oA5zzr7b/BXMl7w2J/HUrom14gU5gP8Y7u8HqpOe7/cv\nX2uk0ECjzZ24Og9g2bTGHJBoFOVBH9Gp52gVcQ7IEQKBgQDq3NYrUDt7eZqRcYjC\n+bDSg1Xgig8cmFxepbKGggL3j9m1qYjf48iLm9QkCh6MlzAnAVfBFCjZYRvUl90k\nYZ5TVRDzILt3at8d4jMSGKugyMhLiIIOha2ffOSlES0J/wLKpfBYJqVCm5mt8qW4\nSPsQm/oFbMMnSVXMYEr9uMrAzQKBgQDp8O0W34Ld1Rghap6Pj9TrscRyWrFT6MPt\nfVlj9tSb8V2FYIsVnjh6OFuYWmLYNnnkSH2tBHd2F+F4bKZivHluV2eIw0QwaN0b\ntwTm6dDtXKLvXLI7RlHXsNho3owX7cTZu2UW5PKxSrOqXH7Bhe3LvS4PyzsX/5SA\nQYgmrfF6PQKBgAYOb89qID6M4jmB7f7pJXAoRtylcsJQA4HFUBc73wu3P+v5VThA\nzXkcKZpMUIFbnLhExpiKBoukf206BU/c3JJVjTxXyb3ImbxRivOag0KAKvoXqRLq\ny5FjTRocmUa6tr23Db2YMYbIMGxV54QbDa5d91KQfW/T6kx85zInw8K5AoGBAKgs\nu7QKv+BLFYrIQ+5+fplldQykKABjP55V01IqmlL0o7+DVNkYog8yvp36tD4sg1nZ\nxwb/RAXQSxUwPjiSt1TcXqCRh06pw/HtkweRJNHOG4+perNj7Of6yMgy3FFDa5T+\nw0A/HDzZr+kTj0f9yKIDgL534iZxZEcDVSZBO2wdAoGAVG6izgXS71YYmATTSCvV\nf+f+LmHvdYlqt0ivw7hgSy7U30wAPyDDiyhbYtGMic8Px1EkZjBUXDp/mg9EvMuu\nFdDWcRSsrGsMUDtr0OXIzlSB38t2S8O7aMxyBwSBrzh7aLMFZdzsgXgznLkKiXpM\nSppX/Gee/+y1T/I2tRGXk9I=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet('1OL1DuPtuM-HwWYNkjJbJOUBbFDBURYzQOcN1mTcI3ec', serviceAccountAuth);
  await doc.loadInfo();
  return doc.sheetsByTitle[sheetTitle];
}

async function run() {
  try {
    console.log('Fetching Response_Fasil...');
    const sheet = await getGoogleSheet('Response_Fasil');
    const rows = await sheet.getRows();
    console.log(`Found ${rows.length} rows in Response_Fasil`);
    rows.forEach(r => {
      console.log(`- Fasil: ${r.get('ID_Fasil')}, PM: ${r.get('ID_Etoser_Dinilai')}, TS: ${r.get('Timestamp')}`);
    });

    console.log('Fetching Users_Fasil...');
    const sheetF = await getGoogleSheet('Users_Fasil');
    const rowsF = await sheetF.getRows();
    rowsF.forEach(r => {
      console.log(`- Fasil: ${r.get('ID_Fasil')}, Relasi: ${r.get('Relasi_PM')}`);
    });
  } catch (e) {
    console.error(e);
  }
}

run();
