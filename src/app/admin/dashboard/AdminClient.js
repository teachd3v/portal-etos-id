// src/app/admin/dashboard/AdminClient.js
'use client';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Users, FileCheck, AlertTriangle, Search, Filter } from 'lucide-react';

export default function AdminClient({ periodeAktif, mergedData }) {
  // --- STATE UNTUK FILTER ---
  const [search, setSearch] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('Semua');
  const [filterAngkatan, setFilterAngkatan] = useState('Semua');

  // Ambil opsi unik untuk dropdown
  const listWilayah = ['Semua', ...new Set(mergedData.map(d => d.wilayah))];
  const listAngkatan = ['Semua', ...new Set(mergedData.map(d => d.angkatan))].sort();

  // --- LOGIKA FILTERING DATA ---
  const filteredData = useMemo(() => {
    return mergedData.filter(d => {
      const matchSearch = d.nama.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
      const matchWilayah = filterWilayah === 'Semua' || d.wilayah === filterWilayah;
      const matchAngkatan = filterAngkatan === 'Semua' || d.angkatan === filterAngkatan;
      return matchSearch && matchWilayah && matchAngkatan;
    });
  }, [mergedData, search, filterWilayah, filterAngkatan]);

  // --- OLAH DATA UNTUK WIDGETS ---
  const totalPM = filteredData.length;
  const laporanBulanIni = filteredData.filter(d => d.status_lapor_pm).length;
  const pmBerisiko = filteredData.filter(d => d.rekomendasi.includes('SP') || d.rekomendasi.includes('Khusus')).length;

  // --- OLAH DATA UNTUK PIE CHART ---
  const dataPieKepatuhan = [
    { name: 'Sudah Lapor', value: laporanBulanIni, color: '#16a34a' },
    { name: 'Belum Lapor', value: totalPM - laporanBulanIni, color: '#ef4444' }
  ];

  // --- OLAH DATA UNTUK RADAR CHART (GAP ANALYSIS) ---
  // Menghitung rata-rata skor PM vs Fasil dari data yang sudah difilter
  let avgPMInt = 0, avgPMProf = 0, avgPMTrans = 0;
  let avgFasilInt = 0, avgFasilProf = 0, avgFasilTrans = 0;
  let countPM = 0, countFasil = 0;

  filteredData.forEach(d => {
    if(d.status_lapor_pm) { avgPMInt += d.pm_int; avgPMProf += d.pm_prof; avgPMTrans += d.pm_trans; countPM++; }
    if(d.status_dinilai_fasil) { avgFasilInt += d.fasil_int; avgFasilProf += d.fasil_prof; avgFasilTrans += d.fasil_trans; countFasil++; }
  });

  const radarData = [
    { subject: 'Integritas', PM: countPM ? (avgPMInt/countPM).toFixed(2) : 0, Fasil: countFasil ? (avgFasilInt/countFasil).toFixed(2) : 0 },
    { subject: 'Profesional', PM: countPM ? (avgPMProf/countPM).toFixed(2) : 0, Fasil: countFasil ? (avgFasilProf/countFasil).toFixed(2) : 0 },
    { subject: 'Transformatif', PM: countPM ? (avgPMTrans/countPM).toFixed(2) : 0, Fasil: countFasil ? (avgFasilTrans/countFasil).toFixed(2) : 0 },
  ];

  return (
    <div className="space-y-6">
      
      {/* --- PANEL FILTER --- */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 font-bold text-gray-800 w-full md:w-auto">
          <Filter className="w-5 h-5 text-blue-600"/> Filter Data:
        </div>
        
        <div className="relative w-full md:w-1/3">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" placeholder="Cari Nama atau ID Etoser..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 placeholder:text-gray-400 shadow-sm transition-all"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="w-full md:w-48 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm cursor-pointer transition-all"
          value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)}>
          {listWilayah.map(w => <option key={w} value={w}>{w === 'Semua' ? 'Semua Wilayah' : w}</option>)}
        </select>

        <select 
          className="w-full md:w-48 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 shadow-sm cursor-pointer transition-all"
          value={filterAngkatan} onChange={(e) => setFilterAngkatan(e.target.value)}>
          {listAngkatan.map(a => <option key={a} value={a}>{a === 'Semua' ? 'Semua Angkatan' : `Angkatan ${a}`}</option>)}
        </select>
      </div>
      {/* --- KARTU RINGKASAN (WIDGETS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-8 h-8"/></div>
          <div>
            <p className="text-gray-500 font-bold text-sm">Total PM Terfilter</p>
            <h3 className="text-3xl font-black text-gray-900">{totalPM}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><FileCheck className="w-8 h-8"/></div>
          <div>
            <p className="text-gray-500 font-bold text-sm">Sudah Lapor ({periodeAktif})</p>
            <h3 className="text-3xl font-black text-gray-900">{laporanBulanIni}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl"><AlertTriangle className="w-8 h-8"/></div>
          <div>
            <p className="text-gray-500 font-bold text-sm">PM Berisiko / SP</p>
            <h3 className="text-3xl font-black text-red-600">{pmBerisiko}</h3>
          </div>
        </div>
      </div>

      {/* --- AREA GRAFIK --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart: Kepatuhan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Rasio Kepatuhan Laporan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataPieKepatuhan} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {dataPieKepatuhan.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart: Sebaran Nilai Per Variabel (Gap Analysis) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Sebaran Nilai Rata-Rata (PM vs Fasil)</h3>
          <p className="text-xs text-gray-500 mb-4">Mendeteksi kesenjangan antara penilaian mandiri dengan penilaian fasilitator.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{fontSize: 12, fontWeight: 'bold'}} />
                <PolarRadiusAxis angle={30} domain={[0, 4]} />
                <Radar name="Skor Self-Report (PM)" dataKey="PM" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="Skor Evaluasi (Fasil)" dataKey="Fasil" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                <Legend />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- MASTER DATA TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Detail Data Etoser</h3>
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Skor Maksimal: 4.00</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold border-b">
              <tr>
                <th className="px-6 py-4">Nama PM & ID</th>
                <th className="px-6 py-4">Wil/Angkatan</th>
                <th className="px-6 py-4">Status Laporan</th>
                <th className="px-6 py-4 text-center">Akumulasi Integritas</th>
                <th className="px-6 py-4 text-center">Akumulasi Profesional</th>
                <th className="px-6 py-4 text-center">Akumulasi Transformatif</th>
                <th className="px-6 py-4">Rekomendasi Fasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map(d => (
                <tr key={d.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{d.nama}</p>
                    <p className="text-xs text-gray-500 font-medium">{d.id}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{d.wilayah} - {d.angkatan}</td>
                  <td className="px-6 py-4">
                    {d.status_lapor_pm 
                      ? <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Selesai</span>
                      : <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">Belum</span>}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-800">{d.total_int ? d.total_int.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-800">{d.total_prof ? d.total_prof.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-800">{d.total_trans ? d.total_trans.toFixed(2) : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
                      d.rekomendasi.includes('Sangat') ? 'bg-green-50 text-green-700 border-green-200' :
                      d.rekomendasi.includes('Catatan') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      d.rekomendasi.includes('Belum') ? 'bg-gray-100 text-gray-600 border-gray-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {d.rekomendasi}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                    Tidak ada data yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}