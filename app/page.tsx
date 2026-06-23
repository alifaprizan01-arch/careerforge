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

export default function Home() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            CareerForge
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Temukan pekerjaan impian Anda berikutnya
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="bg-white rounded-lg sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-sm border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Jelajahi Ribuan Lowongan Kerja
            </h2>
            <p className="text-gray-600 mb-6 text-base sm:text-lg">
              Cari dan temukan posisi karir yang sempurna untuk Anda di berbagai industri dan lokasi.
            </p>

            {/* Search Input */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Cari posisi, perusahaan, atau lokasi..."
                className="w-full px-4 py-3 sm:py-4 pl-11 sm:pl-12 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base text-gray-900 placeholder-gray-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Cari lowongan kerja"
              />
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-lg">
                🔍
              </span>
            </div>

            {/* Job Count */}
            {filteredJobs.length > 0 && (
              <div className="mb-6 text-sm text-gray-600">
                Menampilkan <span className="font-semibold text-gray-900">{filteredJobs.length}</span> lowongan
              </div>
            )}

            {/* Daftar Hasil Lowongan */}
            <div className="space-y-3 sm:space-y-4">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 sm:p-5 border border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-300 hover:shadow-md active:bg-blue-50 transition-all cursor-pointer bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-blue-600 font-semibold text-sm sm:text-base mb-2">
                          {job.company}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap h-fit">
                        {job.type}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm mt-3">
                      <span className="mr-2 text-base">📍</span>
                      <span>{job.location}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 sm:py-20">
                  <div className="text-5xl sm:text-6xl mb-4">🔍</div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                    Pencarian tidak ditemukan
                  </p>
                  <p className="text-gray-500">Coba kata kunci lain</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg sm:rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">Cepat & Mudah</h3>
            <p className="text-sm text-gray-600">Temukan pekerjaan dalam hitungan menit</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">Tepat Sasaran</h3>
            <p className="text-sm text-gray-600">Filter sesuai dengan preferensi Anda</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">🌟</div>
            <h3 className="font-bold text-gray-900 mb-2">Terpercaya</h3>
            <p className="text-sm text-gray-600">Lowongan kerja dari perusahaan terkemuka</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; 2026 CareerForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
