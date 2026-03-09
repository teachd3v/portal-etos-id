// src/lib/utils.js

export function getStatusPeriode() {
  //const sekarang = new Date();
  const sekarang = new Date('2026-03-26'); // 💡 Buka ini untuk test masa OPEN
  
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

  return {
    statusForm: status,
    pesanStatus: pesan,
    periode: periodeStr,
    bulanLaporanInt: targetBulanLaporan
  };
}