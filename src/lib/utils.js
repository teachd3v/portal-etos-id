// src/lib/utils.js

export function getStatusPeriode() {
  const sekarang = new Date();
  // const sekarang = new Date('2026-03-26'); // 💡 Buka ini untuk test masa OPEN
  
  const tanggal = sekarang.getDate();
  let bulan = sekarang.getMonth() + 1;
  let tahun = sekarang.getFullYear();

  let status = 'CLOSED';
  let pesan = '';
  let targetBulanLaporan = bulan;
  let targetTahunLaporan = tahun;

  // LOGIKA JENDELA WAKTU (Tgl 25 s.d 7)
  if (tanggal >= 25) {
    status = 'OPEN';
    targetBulanLaporan = bulan;
  } else if (tanggal <= 7) {
    status = 'OPEN';
    targetBulanLaporan = bulan - 1;
    // Handle pergantian tahun (Januari isi untuk Desember tahun lalu)
    if (targetBulanLaporan === 0) {
      targetBulanLaporan = 12;
      targetTahunLaporan -= 1;
    }
  } else {
    status = 'CLOSED';
    pesan = `Masa pengisian laporan sedang ditutup. Form dibuka setiap tanggal 25 hingga tanggal 7. (Saat ini tanggal ${tanggal})`;
    targetBulanLaporan = bulan;
  }

  const periodeStr = `${String(targetBulanLaporan).padStart(2, '0')}-${targetTahunLaporan}`;

  status = 'OPEN'; // DIBUKA PAKSA UNTUK UJI COBA
  return {
    statusForm: 'OPEN',
    pesanStatus: pesan,
    periode: periodeStr,
    bulanLaporanInt: targetBulanLaporan
  };
}

export function getStatusPeriodeFasil() {
  const sekarang = new Date();
  // const sekarang = new Date('2026-03-05'); // 💡 Buka ini untuk test masa OPEN
  const tanggal = sekarang.getDate();
  const bulanSekarang = sekarang.getMonth(); // 0-indexed
  const tahunSekarang = sekarang.getFullYear();

  let statusForm, pesanStatus, bulanLaporan, tahunLaporan;

  statusForm = 'OPEN'; // DIBUKA PAKSA UNTUK UJI COBA
  if (true) {
    statusForm = 'OPEN';
    pesanStatus = 'Form laporan bulanan Fasil sedang terbuka (tgl 1-10).';
    // Laporan untuk bulan sebelumnya
    const prevDate = new Date(tahunSekarang, bulanSekarang - 1, 1);
    bulanLaporan = prevDate.getMonth() + 1; // 1-indexed
    tahunLaporan = prevDate.getFullYear();
  } else {
    statusForm = 'CLOSED';
    pesanStatus = `Form Laporan Bulanan Fasil hanya dibuka setiap tanggal 1 hingga 10. (Saat ini tanggal ${tanggal})`;
    // Periode referensi = bulan sebelumnya
    const prevDate = new Date(tahunSekarang, bulanSekarang - 1, 1);
    bulanLaporan = prevDate.getMonth() + 1;
    tahunLaporan = prevDate.getFullYear();
  }

  const bulanStr = String(bulanLaporan).padStart(2, '0');
  const periode = `${bulanStr}-${tahunLaporan}`;

  return { statusForm, pesanStatus, periode };
}