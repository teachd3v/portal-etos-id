// src/app/admin/dashboard/AdminClient.js
'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Users, FileCheck, AlertTriangle, Search, Filter, BadgeCheck, ShieldAlert, TrendingUp } from 'lucide-react';

// Konversi "MM-YYYY" ke integer untuk perbandingan kronologis
const periodeToInt = (p) => {
  const [m, y] = (p || '').split('-');
  return parseInt(y || 0) * 12 + parseInt(m || 0);
};

// Format label periode: "03-2026" → "Mar 2026"
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const formatPeriode = (p) => {
  const [m, y] = (p || '').split('-');
  return `${BULAN[parseInt(m) - 1] || '?'} ${y || ''}`;
};

// Warna badge rekomendasi
const getRekStyle = (rek) => {
  if (rek.includes('Outstanding'))  return 'bg-purple-50 text-purple-700 border-purple-200';
  if (rek.includes('Exceeds'))      return 'bg-green-50  text-green-700  border-green-200';
  if (rek.includes('Meets'))        return 'bg-blue-50   text-blue-700   border-blue-200';
  if (rek.includes('Below'))        return 'bg-amber-50  text-amber-700  border-amber-200';
  if (rek.includes('Unacceptable')) return 'bg-red-50    text-red-700    border-red-200';
  return 'bg-gray-100 text-gray-500 border-gray-200';
};

// Warna badge IPK
const getIPKStyle = (ipk) => {
  if (!ipk) return 'text-gray-400';
  if (ipk >= 3.5) return 'text-green-700 font-black';
  if (ipk >= 2.5) return 'text-blue-700 font-bold';
  return 'text-red-600 font-bold';
};

export default function AdminClient({ periodeAktif, allPM, allResPM, allResFasil, availablePeriodes }) {
  // --- STATE FILTER ---
  const [search, setSearch] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('Semua');
  const [filterAngkatan, setFilterAngkatan] = useState('Semua');
  const [filterStart, setFilterStart] = useState(periodeAktif);
  const [filterEnd, setFilterEnd] = useState(periodeAktif);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Reset ke halaman 1 setiap kali filter berubah
  useEffect(() => { setCurrentPage(1); }, [search, filterWilayah, filterAngkatan, filterStart, filterEnd]);

  const listWilayah  = ['Semua', ...new Set(allPM.map(d => d.wilayah))];
  const listAngkatan = ['Semua', ...new Set(allPM.map(d => d.angkatan))].sort();

  // Jika availablePeriodes kosong, pakai periodeAktif sebagai satu-satunya opsi
  const periodeOptions = availablePeriodes.length > 0 ? availablePeriodes : [periodeAktif];

  // --- MERGED DATA (hitung client-side berdasar filter periode) ---
  const mergedData = useMemo(() => {
    const startInt = periodeToInt(filterStart);
    const endInt   = periodeToInt(filterEnd);

    return allPM.map(pm => {
      // PM responses dalam rentang periode terpilih (ambil yang terbaru)
      const pmResponses = allResPM.filter(r =>
        r.id_etoser === pm.id &&
        periodeToInt(r.bulan_laporan) >= startInt &&
        periodeToInt(r.bulan_laporan) <= endInt
      );
      const latestPM = pmResponses.length > 0 ? pmResponses[pmResponses.length - 1] : null;

      // Evaluasi fasil terbaru (semua waktu, bukan filter periode)
      const fasilResponses = allResFasil.filter(r => r.id_etoser_dinilai === pm.id);
      const latestFasil = fasilResponses.length > 0 ? fasilResponses[fasilResponses.length - 1] : null;

      const pm_int  = latestPM?.pm_int  || 0;
      const pm_prof = latestPM?.pm_prof || 0;
      const pm_trans = latestPM?.pm_trans || 0;

      const fasil_int         = latestFasil?.fasil_int         || 0;
      const fasil_prof        = latestFasil?.fasil_prof        || 0;
      const fasil_kontributif = latestFasil?.fasil_kontributif || 0;
      const fasil_trans       = latestFasil?.fasil_trans       || 0;

      const blend = (a, b) => (a && b) ? (a + b) / 2 : (a || b);
      const total_int         = blend(pm_int, fasil_int);
      const total_prof        = blend(pm_prof, fasil_prof);
      const total_kontributif = fasil_kontributif; // fasil-only
      const total_trans       = blend(pm_trans, fasil_trans);

      // IPK: rata-rata dari variabel yang memiliki nilai (>0)
      const scores = [total_int, total_prof, total_kontributif, total_trans].filter(s => s > 0);
      const ipk_pembinaan = scores.length > 0
        ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : 0;

      return {
        id: pm.id, nama: pm.nama, angkatan: pm.angkatan,
        wilayah: pm.wilayah, tahun_pembinaan: pm.tahun_pembinaan,
        status_lapor_pm:    pmResponses.length > 0,
        status_dinilai_fasil: fasilResponses.length > 0,
        rekomendasi: latestFasil?.rekomendasi || 'Belum Dievaluasi',
        kena_sanksi: (latestFasil?.total_poin || 0) > 0,
        pm_int, pm_prof, pm_trans,
        fasil_int, fasil_prof, fasil_kontributif, fasil_trans,
        total_int, total_prof, total_kontributif, total_trans,
        ipk_pembinaan,
      };
    });
  }, [allPM, allResPM, allResFasil, filterStart, filterEnd]);

  // --- TREND DATA (semua periode, untuk line chart) ---
  const trendData = useMemo(() => {
    return periodeOptions.map(periode => {
      const pmRes = allResPM.filter(r => r.bulan_laporan === periode);

      // Fasil evaluasi untuk periode ini: timestamp bulan P atau P+1 (window 25-7)
      const pInt = periodeToInt(periode);
      const fasilRes = allResFasil.filter(r => {
        const fp = periodeToInt(r.periode_fasil);
        return fp === pInt || fp === pInt + 1;
      });

      const avgOf = (arr, key) => arr.length ? arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length : 0;

      const t_int  = (() => { const a = avgOf(pmRes,'pm_int'),  b = avgOf(fasilRes,'fasil_int');  return (a&&b)?(a+b)/2:(a||b); })();
      const t_prof = (() => { const a = avgOf(pmRes,'pm_prof'), b = avgOf(fasilRes,'fasil_prof'); return (a&&b)?(a+b)/2:(a||b); })();
      const t_kont = avgOf(fasilRes, 'fasil_kontributif');
      const t_trans = (() => { const a = avgOf(pmRes,'pm_trans'), b = avgOf(fasilRes,'fasil_trans'); return (a&&b)?(a+b)/2:(a||b); })();

      const scores = [t_int, t_prof, t_kont, t_trans].filter(s => s > 0);
      const avgIPK = scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;

      return {
        periode: formatPeriode(periode),
        'IPK Rata-rata': parseFloat(avgIPK.toFixed(2)),
        Integritas:   parseFloat(t_int.toFixed(2)),
        Profesional:  parseFloat(t_prof.toFixed(2)),
        Kontributif:  parseFloat(t_kont.toFixed(2)),
        Transformatif:parseFloat(t_trans.toFixed(2)),
      };
    });
  }, [periodeOptions, allResPM, allResFasil]);

  // --- FILTER PENCARIAN + WILAYAH + ANGKATAN ---
  const filteredData = useMemo(() => {
    return mergedData.filter(d => {
      const matchSearch   = d.nama.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
      const matchWilayah  = filterWilayah  === 'Semua' || d.wilayah  === filterWilayah;
      const matchAngkatan = filterAngkatan === 'Semua' || d.angkatan === filterAngkatan;
      return matchSearch && matchWilayah && matchAngkatan;
    });
  }, [mergedData, search, filterWilayah, filterAngkatan]);

  // --- PAGINATION ---
  const totalPages    = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- NILAI WIDGET ---
  const totalPM       = filteredData.length;
  const sudahLapor    = filteredData.filter(d => d.status_lapor_pm).length;
  const sudahDinilai  = filteredData.filter(d => d.status_dinilai_fasil).length;
  const pmKenaSanksi  = filteredData.filter(d => d.kena_sanksi).length;

  // --- PIE CHART ---
  const dataPie = [
    { name: 'Sudah Lapor',  value: sudahLapor,           color: '#16a34a' },
    { name: 'Belum Lapor',  value: totalPM - sudahLapor, color: '#ef4444' },
  ];

  // --- RADAR CHART ---
  let sPI=0,sPP=0,sPT=0,sFI=0,sFP=0,sFT=0,cP=0,cF=0;
  filteredData.forEach(d => {
    if (d.status_lapor_pm)    { sPI+=d.pm_int; sPP+=d.pm_prof; sPT+=d.pm_trans; cP++; }
    if (d.status_dinilai_fasil){ sFI+=d.fasil_int; sFP+=d.fasil_prof; sFT+=d.fasil_trans; cF++; }
  });
  const radarData = [
    { subject:'Integritas',   PM: cP?(sPI/cP).toFixed(2):0, Fasil: cF?(sFI/cF).toFixed(2):0 },
    { subject:'Profesional',  PM: cP?(sPP/cP).toFixed(2):0, Fasil: cF?(sFP/cF).toFixed(2):0 },
    { subject:'Transformatif',PM: cP?(sPT/cP).toFixed(2):0, Fasil: cF?(sFT/cF).toFixed(2):0 },
  ];

  return (
    <div className="space-y-6">

      {/* --- PANEL FILTER --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 font-bold text-gray-800 mb-4">
          <Filter className="w-5 h-5 text-blue-600"/> Filter Data
        </div>
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          {/* Pencarian */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text" placeholder="Cari Nama atau ID Etoser..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 placeholder:text-gray-400 shadow-sm"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Wilayah */}
          <select className="w-full md:w-44 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm cursor-pointer"
            value={filterWilayah} onChange={e => setFilterWilayah(e.target.value)}>
            {listWilayah.map(w => <option key={w} value={w}>{w === 'Semua' ? 'Semua Wilayah' : w}</option>)}
          </select>
          {/* Angkatan */}
          <select className="w-full md:w-44 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm cursor-pointer"
            value={filterAngkatan} onChange={e => setFilterAngkatan(e.target.value)}>
            {listAngkatan.map(a => <option key={a} value={a}>{a === 'Semua' ? 'Semua Angkatan' : `Angkatan ${a}`}</option>)}
          </select>
          {/* Dari Periode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Dari</span>
            <select className="px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm cursor-pointer"
              value={filterStart} onChange={e => {
                setFilterStart(e.target.value);
                if (periodeToInt(e.target.value) > periodeToInt(filterEnd)) setFilterEnd(e.target.value);
              }}>
              {periodeOptions.map(p => <option key={p} value={p}>{formatPeriode(p)}</option>)}
            </select>
          </div>
          {/* Sampai Periode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Sampai</span>
            <select className="px-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm cursor-pointer"
              value={filterEnd} onChange={e => setFilterEnd(e.target.value)}>
              {periodeOptions.filter(p => periodeToInt(p) >= periodeToInt(filterStart)).map(p => (
                <option key={p} value={p}>{formatPeriode(p)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- KARTU RINGKASAN (4 WIDGET) --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-7 h-7"/></div>
          <div>
            <p className="text-gray-500 font-bold text-xs">Total PM</p>
            <h3 className="text-3xl font-black text-gray-900">{totalPM}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><FileCheck className="w-7 h-7"/></div>
          <div>
            <p className="text-gray-500 font-bold text-xs">Sudah Lapor</p>
            <h3 className="text-3xl font-black text-gray-900">{sudahLapor}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><BadgeCheck className="w-7 h-7"/></div>
          <div>
            <p className="text-gray-500 font-bold text-xs">Sudah Dinilai Fasil</p>
            <h3 className="text-3xl font-black text-gray-900">{sudahDinilai}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><ShieldAlert className="w-7 h-7"/></div>
          <div>
            <p className="text-gray-500 font-bold text-xs">PM Kena Sanksi</p>
            <h3 className="text-3xl font-black text-red-600">{pmKenaSanksi}</h3>
          </div>
        </div>
      </div>

      {/* --- GRAFIK ROW 1: Trend IPK (full width) --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-blue-600"/>
            <h3 className="font-bold text-gray-900">Trend Rata-rata IPK Pembinaan Bulanan</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Rata-rata gabungan 4 variabel (Integritas, Profesional, Kontributif, Transformatif) per periode.</p>
          {trendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="periode" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(val) => [val, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="IPK Rata-rata" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="Integritas"    stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="Profesional"   stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="Kontributif"   stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="Transformatif" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm font-medium">
              Belum ada data untuk ditampilkan.
            </div>
          )}
        </div>

      {/* --- GRAFIK ROW 2: Pie + Radar (2 kolom sejajar) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pie: Rasio Kepatuhan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Rasio Kepatuhan Laporan</h3>
          <p className="text-xs text-gray-400 mb-2">Periode: {filterStart === filterEnd ? formatPeriode(filterStart) : `${formatPeriode(filterStart)} – ${formatPeriode(filterEnd)}`}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataPie} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {dataPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar: Sebaran Nilai */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">Sebaran Nilai Rata-Rata (PM vs Fasil)</h3>
          <p className="text-xs text-gray-400 mb-4">Mendeteksi kesenjangan antara penilaian mandiri PM dengan penilaian fasilitator.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fontSize: 10 }} />
                <Radar name="Skor Self-Report (PM)"  dataKey="PM"    stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.35} />
                <Radar name="Skor Evaluasi (Fasil)"  dataKey="Fasil" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- MASTER DATA TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Detail Data Etoser</h3>
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {filteredData.length} PM · Skor Maks: 4.00
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Nama PM & ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Wil / Angkatan</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Integritas</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Profesional</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Kontributif</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Transformatif</th>
                <th className="px-4 py-3 text-center whitespace-nowrap bg-blue-50 text-blue-700">IPK Pembinaan</th>
                <th className="px-4 py-3 whitespace-nowrap">Rekomendasi Fasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map(d => (
                <tr key={d.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900 text-sm">{d.nama}</p>
                    <p className="text-xs text-gray-400 font-medium">{d.id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium text-xs">{d.wilayah}<br/>{d.angkatan}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {d.status_lapor_pm
                        ? <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md w-fit">✓ Lapor</span>
                        : <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md w-fit">✗ Belum</span>}
                      {d.status_dinilai_fasil
                        ? <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md w-fit">✓ Dinilai</span>
                        : <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md w-fit">— Belum</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{d.total_int         ? d.total_int.toFixed(2)         : '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{d.total_prof        ? d.total_prof.toFixed(2)        : '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{d.total_kontributif ? d.total_kontributif.toFixed(2)  : '-'}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{d.total_trans       ? d.total_trans.toFixed(2)       : '-'}</td>
                  <td className="px-4 py-3 text-center bg-blue-50/30">
                    <span className={`text-base ${getIPKStyle(d.ipk_pembinaan)}`}>
                      {d.ipk_pembinaan ? d.ipk_pembinaan.toFixed(2) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${getRekStyle(d.rekomendasi)}`}>
                      {d.rekomendasi}
                    </span>
                    {d.kena_sanksi && (
                      <span className="ml-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">⚠ Sanksi</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400 font-medium">
                    Tidak ada data yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs font-medium text-gray-500">
              Menampilkan <span className="font-bold text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="font-bold text-gray-700">{filteredData.length}</span> PM
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >«</button>
              <button
                onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '...'
                    ? <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span>
                    : <button key={item} onClick={() => setCurrentPage(item)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${currentPage === item ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >{item}</button>
                )
              }
              <button
                onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Next</button>
              <button
                onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >»</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
