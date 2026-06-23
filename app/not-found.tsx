import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl sm:text-8xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mb-8 text-base sm:text-lg max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-lg sm:rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px] flex items-center justify-center"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
