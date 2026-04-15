export const EMAIL_TEMPLATES = [
  {
    id: "reminder-laporan-etoser",
    label: "Reminder H-3 Penutupan Laporan Bulanan (Etoser)",
    subject: "[REMINDER] H-3 Deadline Laporan Bulanan Etos ID",
    variables: ["{Nama}", "{Deadline}"],
    csvTemplate: "/template-reminder-laporan-etoser.csv",
    html: `
<p>Halo, <strong>{Nama}</strong>! 👋</p>

<p>Ini adalah pengingat bahwa <strong>deadline pengisian Laporan Bulanan Etos ID</strong> tinggal <strong>3 hari lagi!</strong></p>

<div style="background-color: #fff8e1; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
  <p style="margin: 0; font-weight: bold; color: #92400e;">⏰ Deadline: <span style="color: #d97706;">{Deadline}</span></p>
  <p style="margin: 8px 0 0; color: #78350f; font-size: 14px;">Tidak ada toleransi keterlambatan setelah tanggal ini.</p>
</div>

<p>Pastikan kamu sudah mengisi laporan bulanan sebelum deadline. Berikut langkah-langkahnya:</p>
<ol>
  <li>Akses portal melalui link di bawah ini.</li>
  <li>Login menggunakan akun yang sudah kamu miliki.</li>
  <li>Isi laporan bulanan secara lengkap dan jujur sesuai progres aktivitasmu.</li>
  <li>Klik <strong>Submit</strong> dan pastikan muncul konfirmasi berhasil.</li>
  <li>Informasikan kepada fasilitatormu bahwa kamu sudah mengisi laporan.</li>
</ol>

<div class="button-container" style="text-align: center; margin: 30px 0;">
  <a href="http://portal-etos-id.vercel.app/login" target="_blank" rel="noopener noreferrer" class="button" style="display: inline-block; padding: 16px 36px; background-color: #55a65b; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(85,166,91,0.3); border: 1px solid #468e4c; box-sizing: border-box;">Isi Laporan Sekarang</a>
</div>

<p>Jika ada kendala saat mengakses portal atau mengisi laporan, segera hubungi fasilitatormu atau Tim Pusat.</p>

<p>Semangat terus, <strong>{Nama}</strong>! Konsistensi adalah kunci keberhasilan di Etos ID. 💪</p>

<p>Best regards,<br><strong>Tim Etos ID Scholarship</strong><br><span style="font-size: 13px; color: #718096;">Jl Raya Parung Bogor Km 42, Desa Jampang, Kec Kemang, Kab Bogor, Jawa Barat 16310</span></p>
`,
  },
  {
    id: "reminder-laporan-fasil",
    label: "Reminder H-3 Penutupan Laporan Bulanan (Fasil)",
    subject: "[REMINDER] H-3 Deadline Laporan Bulanan — Cek Etosermu!",
    variables: ["{Nama}", "{Deadline}", "{Jumlah Etoser}"],
    csvTemplate: "/template-reminder-laporan-fasil.csv",
    html: `
<p>Halo, <strong>{Nama}</strong>! 👋</p>

<p>Sebagai pengingat, <strong>deadline Laporan Bulanan Etos ID</strong> tinggal <strong>3 hari lagi</strong>. Mohon pastikan seluruh etoser di kelompokmu sudah mengisi laporan tepat waktu.</p>

<div style="background-color: #fff8e1; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
  <p style="margin: 0; font-weight: bold; color: #92400e;">⏰ Deadline: <span style="color: #d97706;">{Deadline}</span></p>
  <p style="margin: 8px 0 0; color: #78350f; font-size: 14px;">Tidak ada toleransi keterlambatan. Pastikan semua etosermu sudah submit sebelum batas waktu ini.</p>
</div>

<p><strong>Yang perlu kamu lakukan sebagai Fasil:</strong></p>
<ol>
  <li>Cek status pengisian laporan masing-masing etoser melalui dashboard Fasil di portal.</li>
  <li>Hubungi dan ingatkan etoser yang belum mengisi laporan.</li>
  <li>Pastikan laporan yang diisi sudah lengkap dan dapat kamu verifikasi.</li>
  <li>Lakukan validasi laporan dari etosermu sebelum atau sesaat setelah deadline.</li>
  <li>Laporkan ke Tim Pusat jika ada etoser yang mengalami kendala teknis.</li>
</ol>

<div class="button-container" style="text-align: center; margin: 30px 0;">
  <a href="http://portal-etos-id.vercel.app/login" target="_blank" rel="noopener noreferrer" class="button" style="display: inline-block; padding: 16px 36px; background-color: #55a65b; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(85,166,91,0.3); border: 1px solid #468e4c; box-sizing: border-box;">Buka Dashboard Fasil</a>
</div>

<p>Terima kasih atas dedikasi dan perhatianmu dalam mendampingi para etoser. Keberhasilan mereka ada di tanganmu juga! 🌟</p>

<p>Jika ada pertanyaan atau kendala, jangan ragu untuk menghubungi Tim Pusat.</p>

<p>Best regards,<br><strong>Tim Etos ID Scholarship</strong><br><span style="font-size: 13px; color: #718096;">Jl Raya Parung Bogor Km 42, Desa Jampang, Kec Kemang, Kab Bogor, Jawa Barat 16310</span></p>
`,
  },
  {
    id: "reminder-absensi-pembinaan",
    label: "Reminder Absensi Pembinaan",
    subject: "Reminder Pembinaan Etos ID — Catat Jadwalmu!",
    variables: ["{Nama}", "{Tanggal}", "{Waktu}", "{Lokasi}", "{Tema}"],
    csvTemplate: "/template-reminder-absensi-pembinaan.csv",
    html: `
<p>Halo, <strong>{Nama}</strong>! 👋</p>

<p>Kami ingin mengingatkan bahwa akan ada <strong>Sesi Pembinaan Etos ID</strong> yang akan segera dilaksanakan. Pastikan kamu hadir dan siap!</p>

<div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
  <p style="margin: 0 0 10px; font-size: 16px; font-weight: bold; color: #0369a1;">📅 Detail Kegiatan</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #0c4a6e;">
    <tr>
      <td style="padding: 6px 0; width: 120px;"><strong>Tanggal</strong></td>
      <td style="padding: 6px 0;">: {Tanggal}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0;"><strong>Waktu</strong></td>
      <td style="padding: 6px 0;">: {Waktu} WIB</td>
    </tr>
    <tr>
      <td style="padding: 6px 0;"><strong>Lokasi</strong></td>
      <td style="padding: 6px 0;">: {Lokasi}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0;"><strong>Tema</strong></td>
      <td style="padding: 6px 0;">: {Tema}</td>
    </tr>
  </table>
</div>

<p><strong>Yang perlu kamu persiapkan:</strong></p>
<ul>
  <li>Hadir tepat waktu sesuai jadwal yang tertera.</li>
  <li>Membawa buku catatan dan alat tulis.</li>
  <li>Menyiapkan pertanyaan atau hal-hal yang ingin didiskusikan bersama fasilitator.</li>
  <li>Jika berhalangan hadir, segera konfirmasikan kepada fasilitatormu <strong>minimal H-1</strong>.</li>
</ul>

<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
  <p style="margin: 0; color: #991b1b; font-size: 14px;">⚠️ <strong>Penting:</strong> Kehadiran dalam pembinaan merupakan salah satu indikator penilaian perkembangan etoser. Absensi tanpa keterangan yang valid dapat mempengaruhi penilaianmu.</p>
</div>

<p>Kami menantikan kehadiranmu. Semangat untuk terus tumbuh dan berkembang bersama keluarga besar Etos ID! 🌱</p>

<p>Best regards,<br><strong>Tim Etos ID Scholarship</strong><br><span style="font-size: 13px; color: #718096;">Jl Raya Parung Bogor Km 42, Desa Jampang, Kec Kemang, Kab Bogor, Jawa Barat 16310</span></p>
`,
  },
  {
    id: "info-akses-portal",
    label: "Info Akses Portal Etos ID (Template Default)",
    subject: "Informasi Akses Portal Etos ID Terbaru",
    variables: ["{Nama}", "{ID}", "{Password}"],
    csvTemplate: "/template-info-akses-portal.csv",
    html: `
<p>Halo, <strong>{Nama}</strong>!</p>
<p>Mulai periode April ini, pengisian laporan bulanan akan dialihkan ke halaman web baru untuk mempermudah proses administrasi dan pemantauan perkembanganmu di Etos ID Scholarship.</p>
<p>Berikut detail yang perlu kamu perhatikan:</p>
<div class="button-container" style="text-align: center; margin: 30px 0;">
  <a href="http://portal-etos-id.vercel.app/login" target="_blank" rel="noopener noreferrer" class="button" style="display: inline-block; padding: 16px 36px; background-color: #55a65b; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(85,166,91,0.3); border: 1px solid #468e4c; box-sizing: border-box;">Akses Portal Etos ID Terbaru</a>
</div>
<p>Alur Pengisian:&nbsp;</p>
<ol>
  <li>Setiap etoser mengakses link pengisian laporan terbaru.</li>
  <li>Login dengan akses personal yang sudah dibagikan secara pribadi melalui email yang sudah didaftarkan.</li>
  <li>Isi laporan bulanan sesuai dengan progresmu di bulan aktif, jelaskan secara detail jika ada yang perlu dijelaskan dalam pertanyaan yang tersedia.</li>
  <li>Submit dan konfirmasi pengisian laporan kepada fasilitator.</li>
  <li>Pastikan indikator sudah mengisi laporan bulanan tepat Deadline: 25 bulan aktif - 3 bulan berikutnya. Tidak ada toleransi keterlambatan.</li>
  <li>Akses Login Kamu:<br>
    <div style="background-color: #f4f8f4; padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px dashed #55a65b; display: inline-block;">
       ID User : <strong style="color: #2e5e33;">{ID}</strong><br>
       Password: <strong style="color: #2e5e33;">{Password}</strong>
    </div>
    <br><br>Mohon segera mencoba login untuk memastikan aksesmu tidak bermasalah.
  </li>
  <li>Jika ada kendala teknis, segera hubungi Tim Pusat.&nbsp;</li>
</ol>
<p>Selamat melanjutkan aktivitasmu di Etos!</p>
<p>Best regards,<br><strong>Etos Scholarship Team</strong><br><span style="font-size: 13px; color: #718096;">Jl Raya Parung Bogor Km 42, Desa Jampang, Kec Kemang, Kab Bogor, Jawa Barat 16310</span></p>
`,
  },
];
