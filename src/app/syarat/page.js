'use client';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const sections = [
  { h: '1. Penerimaan Ketentuan', p: 'Dengan mengakses dan menggunakan CareerForge, kamu menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika tidak setuju, mohon untuk tidak menggunakan layanan.' },
  { h: '2. Penggunaan Layanan', p: 'Kamu setuju menggunakan platform hanya untuk tujuan yang sah. Dilarang menyalahgunakan layanan, mengunggah konten yang melanggar hukum, atau mengganggu kerja sistem.' },
  { h: '3. Akun Pengguna', p: 'Kamu bertanggung jawab menjaga kerahasiaan akun dan seluruh aktivitas yang terjadi di dalamnya. Pastikan informasi yang kamu berikan akurat dan terkini.' },
  { h: '4. Konten Pengguna', p: 'Kamu mempertahankan kepemilikan atas dokumen dan konten yang kamu unggah, namun memberi kami izin untuk menampilkannya sesuai fungsi layanan (misalnya kepada perusahaan saat kamu melamar).' },
  { h: '5. Batasan Tanggung Jawab', p: 'CareerForge menyediakan platform "sebagaimana adanya". Kami tidak menjamin hasil tertentu seperti diterimanya sebuah lamaran kerja.' },
  { h: '6. Perubahan Ketentuan', p: 'Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Penggunaan berkelanjutan setelah perubahan berarti kamu menyetujui ketentuan yang baru.' },
];

export default function SyaratPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Syarat & Ketentuan</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Terakhir diperbarui: Juni 2026</p>
          </motion.div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)', marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 0 }}>
              Mohon baca Syarat & Ketentuan berikut sebelum menggunakan layanan CareerForge.
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