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
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Eksplorasi Lowongan</h1>
          <p className="text-gray-500">Temukan pekerjaan impian Anda berikutnya.</p>
        </div>

        {/* Input Pencarian */}
        <div className="relative mb-10">
          <input
            type="text"
            placeholder="Cari posisi, perusahaan, atau lokasi..."
            className="w-full p-4 pl-12 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-4 text-gray-400">🔍</span>
        </div>

        {/* Daftar Hasil Lowongan */}
        <div className="space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="p-5 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
                    <p className="text-blue-600 font-medium">{job.company}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    {job.type}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2 flex items-center">
                  <span className="mr-2">📍 {job.location}</span>
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">Pencarian tidak ditemukan.</div>
          )}
        </div>
      </div>
    </div>
  );
}