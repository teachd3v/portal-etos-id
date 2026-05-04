import { NextResponse } from 'next/server';
import { gmailAPI, sheetsAPI } from '@/lib/google-api';
import { wrapInEmailTemplate, injectVariables } from '@/lib/email-template';

function createMimeMessage(to, from, subject, htmlBody) {
  const emailLines = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    htmlBody,
  ];

  const email = emailLines.join('\r\n');

  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body tidak valid' }, { status: 400 });
  }

  const { user, subject, templateHtml } = body;

  try {
    if (!user || (!user.Email && !user.email)) {
      return NextResponse.json({ error: 'Tidak ada email penerima' }, { status: 400 });
    }

    const recipientEmail = user.Email || user.email;
    const recipientName = user.Nama || user["Nama Lengkap"] || recipientEmail;

    // 1. Inject Variables
    const finalHtml = injectVariables(templateHtml, user);

    // 2. Wrap HTML inside professional email template
    const styledHtml = wrapInEmailTemplate(finalHtml, subject);

    // 3. Prepare Base64 Message
    const sender = process.env.SENDER_EMAIL || "admin@example.com";
    const rawMessage = createMimeMessage(recipientEmail, sender, subject, styledHtml);

    // 4. Send Email via Gmail API
    await gmailAPI.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    // 5. Record to Google Sheets
    if (process.env.BROADCAST_SPREADSHEET_ID) {
      try {
        const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        await sheetsAPI.spreadsheets.values.append({
          spreadsheetId: process.env.BROADCAST_SPREADSHEET_ID,
          range: 'Sheet1!A:E',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[timestamp, recipientName, recipientEmail, 'Sukses', '-']],
          },
        });
      } catch (sheetError) {
        console.warn("Gagal append ke Google Sheets:", sheetError);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Kesalahan API:", error);

    if (process.env.BROADCAST_SPREADSHEET_ID) {
      try {
        const u = user || {};
        const email = u.Email || u.email || "Unknown";
        const nama = u.Nama || u["Nama Lengkap"] || email;
        const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

        await sheetsAPI.spreadsheets.values.append({
          spreadsheetId: process.env.BROADCAST_SPREADSHEET_ID,
          range: 'Sheet1!A:E',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[timestamp, nama, email, 'Gagal', error.message]],
          },
        });
      } catch (_) {}
    }

    return NextResponse.json({ error: error.message || 'Gagal mengirim email' }, { status: 500 });
  }
}
