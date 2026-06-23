'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Data dummy untuk simulasi lowongan kerja
const MOCK_JOBS = [
  { id: 1, title: 'Frontend Developer', company: 'Tech Solutions', location: 'Jakarta', type: 'Full-time' },
  { id: 2, title: 'Backend Engineer', company: 'Code Crafters', location: 'Bandung', type: 'Remote' },
  { id: 3, title: 'UI/UX Designer', company: 'Creative Agency', location: 'Surabaya', type: 'Contract' },
  { id: 4, title: 'Data Scientist', company: 'Data Analytics Co', location: 'Jakarta', type: 'Full-time' },
  { id: 5, title: 'DevOps Engineer', company: 'Cloud Systems', location: 'Remote', type: 'Full-time' },
];

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Logika filter berdasarkan input pencarian (judul, perusahaan, atau lokasi)
  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.filter((job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header dengan back button - optimized for mobile */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 active:text-blue-800 transition-colors text-sm sm:text-base mb-4"
          >
            <span className="mr-2">←</span>Kembali ke Beranda
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Eksplorasi Lowongan
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Temukan pekerjaan impian Anda berikutnya.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Input Pencarian - optimized for mobile */}
        <div className="relative mb-6 sm:mb-8">
          <input
            type="text"
            placeholder="Cari posisi, perusahaan, atau lokasi..."
            className="w-full px-4 py-3 sm:py-4 pl-11 sm:pl-12 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black text-base placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Cari lowongan kerja"
          />
          <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            🔍
          </span>
        </div>

        {/* Job Count */}
        <div className="mb-4 text-sm text-gray-500">
          {filteredJobs.length > 0 ? (
            <p>Menampilkan <span className="font-semibold text-gray-700">{filteredJobs.length}</span> lowongan</p>
          ) : null}
        </div>

        {/* Daftar Hasil Lowongan - optimized for mobile */}
        <div className="space-y-3 sm:space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="p-4 sm:p-5 border border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-300 active:bg-blue-50 transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 line-clamp-2">
                      {job.title}
                    </h2>
                    <p className="text-blue-600 font-medium text-sm sm:text-base mt-1">
                      {job.company}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap">
                    {job.type}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-3 flex items-center">
                  <span className="mr-2 text-base">📍</span>
                  <span>{job.location}</span>
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 sm:py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-base sm:text-lg">Pencarian tidak ditemukan.</p>
              <p className="text-sm text-gray-400 mt-2">Coba kata kunci lain</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
