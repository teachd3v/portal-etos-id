// src/app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const [res] = await Promise.all([
        fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password }),
        }),
        new Promise(r => setTimeout(r, 1200)) // Jeda buatan 1.2 detik agar user tau proses sedang berjalan
      ]);

      const data = await res.json();

      if (res.ok) {
        setLoading(true); // Keep loading state
        setSuccess(true); // New state to show redirecting
        if (data.role === 'PM') router.push('/dashboard');
        else if (data.role === 'Fasilitator') router.push('/fasil/dashboard');
        else if (data.role === 'Admin') router.push('/admin/dashboard'); 
      } else {
        setError(data.message);
        setLoading(false);
      }
    } catch {
      setError('Gagal terhubung ke server');
      setLoading(false);
    }
  };

  const [success, setSuccess] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Portal Etos ID</h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">Masuk untuk mengisi laporan bulanan</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl text-center font-semibold border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              ID Etoser / ID Fasilitator
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-900 bg-gray-50/50 placeholder:text-gray-400 font-semibold disabled:opacity-50"
              placeholder="Contoh: E2025089"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-gray-900 bg-gray-50/50 placeholder:text-gray-400 font-semibold tracking-wider disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 mt-2 ${
              success ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {success ? 'Berhasil! Mengalihkan...' : loading ? 'Memproses Authentikasi...' : 'Masuk Dashboard'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-gray-400 font-medium">
          Mengalami kendala login? Hubungi Admin Pusat.
        </p>
      </div>
    </div>
  );
}