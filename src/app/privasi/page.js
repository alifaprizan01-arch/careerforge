'use client';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const sections = [
  { h: '1. Informasi yang Kami Kumpulkan', p: 'Kami mengumpulkan informasi yang kamu berikan secara langsung, seperti nama, email, nomor telepon, data profil, dokumen (CV, portofolio, sertifikat), serta riwayat lamaran dan pelatihan. Kami juga dapat mengumpulkan data penggunaan untuk meningkatkan layanan.' },
  { h: '2. Cara Kami Menggunakan Informasi', p: 'Informasi digunakan untuk menyediakan dan meningkatkan layanan, menghubungkan kamu dengan lowongan dan pelatihan yang relevan, memproses lamaran, serta berkomunikasi terkait akun dan fitur.' },
  { h: '3. Berbagi Informasi', p: 'Data lamaran dan dokumen yang kamu kirimkan dapat dibagikan kepada perusahaan tempat kamu melamar. Kami tidak menjual data pribadimu kepada pihak ketiga.' },
  { h: '4. Keamanan Data', p: 'Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data. Namun, tidak ada metode transmisi melalui internet yang sepenuhnya aman.' },
  { h: '5. Hak Kamu', p: 'Kamu berhak mengakses, memperbarui, atau menghapus data pribadimu melalui halaman Profil dan Dokumen. Untuk permintaan lain, hubungi kami.' },
  { h: '6. Perubahan Kebijakan', p: 'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan kami informasikan melalui platform.' },
];

export default function PrivasiPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '8px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Kebijakan Privasi</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Terakhir diperbarui: Juni 2026</p>
          </motion.div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)', marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 0 }}>
              Privasimu penting bagi kami. Kebijakan ini menjelaskan bagaimana CareerForge mengumpulkan, menggunakan, dan melindungi informasimu.
            </p>
            {sections.map(s => (
              <div key={s.h} style={{ marginTop: '22px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{s.h}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}