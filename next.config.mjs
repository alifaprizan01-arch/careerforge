/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bjexrvzyfxcetkdzuytx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Tambahkan domain lain di sini kalau ada sumber gambar eksternal
      // (contoh: foto Google login, logo perusahaan dari layanan lain, dll)
    ],
  },
};

export default nextConfig;
