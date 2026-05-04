// src/app/dashboard/LogoutButton.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition border border-red-100"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>

      {/* Modal Konfirmasi Keluar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Keluar</h3>
            <p className="text-gray-600 text-sm mb-6">Apakah kamu yakin ingin keluar dari portal?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Keluar...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}