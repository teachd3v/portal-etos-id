// src/lib/utils.js

export function getStatusPeriode() {
  const sekarang = new Date();
  // const sekarang = new Date('2026-04-26'); // 💡 Buka ini untuk test masa OPEN

  const tanggal = sekarang.getDate();
  let bulan = sekarang.getMonth() + 1;
  let tahun = sekarang.getFullYear();

  let status = 'CLOSED';
  let pesan = '';
  let targetBulanLaporan = bulan;
  let targetTahunLaporan = tahun;

  // LOGIKA JENDELA WAKTU (Tgl 25 s.d 3 bln depannya)
  if (tanggal >= 25) {
    status = 'OPEN';
    targetBulanLaporan = bulan;
  } else if (tanggal <= 3) {
    status = 'OPEN';
    targetBulanLaporan = bulan - 1;
    if (targetBulanLaporan === 0) {
      targetBulanLaporan = 12;
      targetTahunLaporan -= 1;
    }
  } else {
    status = 'CLOSED';
    pesan = `Masa pengisian laporan sedang ditutup. Form dibuka setiap tanggal 25 hingga tanggal 3 bulan depannya. (Saat ini tanggal ${tanggal})`;
    targetBulanLaporan = bulan;
  }

  const periodeStr = `${String(targetBulanLaporan).padStart(2, '0')}-${targetTahunLaporan}`;

  return {
    statusForm: status,
    pesanStatus: pesan,
    periode: periodeStr,
    bulanLaporanInt: targetBulanLaporan
  };
}

export function getStatusPeriodeFasil() {
  const sekarang = new Date();
  // const sekarang = new Date('2026-04-26'); // 💡 Buka ini untuk test masa OPEN
  const tanggal = sekarang.getDate();
  const bulanSekarang = sekarang.getMonth(); // 0-indexed
  const tahunSekarang = sekarang.getFullYear();

  let statusForm = 'CLOSED';
  let pesanStatus = '';
  let bulanLaporan, tahunLaporan;

  // Laporan untuk bulan sebelumnya, Window: tgl 25 s.d tgl 7
  if (tanggal >= 25) {
    statusForm = 'OPEN';
    bulanLaporan = bulanSekarang + 1;
    tahunLaporan = tahunSekarang;
  } else if (tanggal <= 7) {
    statusForm = 'OPEN';
    const prevDate = new Date(tahunSekarang, bulanSekarang - 1, 1);
    bulanLaporan = prevDate.getMonth() + 1;
    tahunLaporan = prevDate.getFullYear();
  } else {
    statusForm = 'CLOSED';
    pesanStatus = `Form Laporan Bulanan Fasil dibuka setiap tanggal 25 hingga tanggal 7 bulan depannya. (Saat ini tanggal ${tanggal})`;
    const prevDate = new Date(tahunSekarang, bulanSekarang - 1, 1);
    bulanLaporan = prevDate.getMonth() + 1;
    tahunLaporan = prevDate.getFullYear();
  }

  const bulanStr = String(bulanLaporan).padStart(2, '0');
  const periode = `${bulanStr}-${tahunLaporan}`;

  return { statusForm, pesanStatus, periode };
}
