// src/app/page.js
import Link from 'next/link';
import { GraduationCap, UserCheck, PieChart, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Ornamen Background */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-400/20 rounded-full blur-3xl"></div>

      <div className="max-w-5xl w-full z-10 text-center">
        
        {/* Header Section */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-block bg-blue-100 text-blue-800 font-bold px-4 py-1.5 rounded-full text-sm mb-6 border border-blue-200 shadow-sm">
            Sistem Informasi Terpadu
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
            Portal Evaluasi & Pembinaan <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
              Etos ID
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Platform pelaporan instrumen evaluasi bulanan yang terintegrasi untuk Etoser, pemantauan Fasilitator, dan analisis data pusat.
          </p>
        </div>

        {/* Cards Section (Penjelasan Peran) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          
          {/* Card PM */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-white hover:shadow-md transition-shadow">
            <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-green-600 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Self-Report Etoser</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Pengisian instrumen evaluasi mandiri bulanan bagi Penerima Manfaat (PM) mencakup Integritas, Profesional, dan Transformatif.
            </p>
          </div>

          {/* Card Fasil */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-white hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-inner">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Peer-Review Fasil</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Portal penilaian objektif bagi Fasilitator untuk mengevaluasi perkembangan PM di wilayah binaannya beserta pemberian rekomendasi.
            </p>
          </div>

          {/* Card Admin */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-sm border border-white hover:shadow-md transition-shadow">
            <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-purple-600 shadow-inner">
              <PieChart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Executive Dashboard</h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              Pusat komando Admin untuk memonitoring kepatuhan pelaporan, mendeteksi *gap analysis*, dan memantau PM berisiko.
            </p>
          </div>

        </div>

        {/* Tombol Call to Action */}
        <div className="animate-in fade-in zoom-in-95 duration-700 delay-300">
          <Link href="/login" className="inline-flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg py-4 px-10 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
            Masuk ke Portal <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="mt-5 text-sm font-bold text-gray-400">
            Akses aman menggunakan ID dan Password terdaftar.
          </p>
        </div>

      </div>
    </div>
  );
}