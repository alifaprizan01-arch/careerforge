'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const faqs = [
  { q: 'Bagaimana cara melamar pekerjaan?', a: 'Buka halaman Lowongan, pilih pekerjaan yang sesuai, lalu klik "Lamar Sekarang". Lengkapi dokumen yang diminta perusahaan dan kirim lamaranmu. Status lamaran bisa dipantau di halaman Lamaran Saya.' },
  { q: 'Bagaimana cara mengunggah dokumen saya?', a: 'Masuk ke halaman Dokumen (lewat menu Sidebar atau dari Profil), klik "Upload Dokumen", pilih kategori (CV, Portfolio, atau Sertifikat), lalu unggah file-nya. Dokumen ini bisa langsung kamu lampirkan saat melamar.' },
  { q: 'Apa itu CV Builder?', a: 'CV Builder membantumu membuat CV profesional dengan cepat, langsung dari data profil dan dokumenmu. Kamu bisa memilih template dan mengisi tiap bagian dengan panduan progres.' },
  { q: 'Bagaimana cara mengikuti pelatihan?', a: 'Kunjungi halaman Pelatihan, telusuri berdasarkan kategori, lalu pilih kursus yang ingin kamu ikuti. Progres belajarmu akan tersimpan otomatis.' },
  { q: 'Bagaimana cara menghubungi mentor?', a: 'Buka halaman Mentoring, pilih mentor yang sesuai dengan bidangmu, lalu ajukan sesi sesuai jadwal yang tersedia.' },
  { q: 'Apakah akun saya aman?', a: 'Kami menjaga keamanan datamu sesuai Kebijakan Privasi. Jaga kerahasiaan kata sandimu dan jangan bagikan ke siapa pun.' },
];

export default function BantuanPage() {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Bantuan & Dukungan</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Pertanyaan yang sering diajukan. Tidak menemukan jawabannya? Hubungi kami.</p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{ background: 'var(--surface-primary)', border: `1px solid ${isOpen ? 'var(--border-brand)' : 'var(--border-default)'}`, borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                  <button onClick={() => setOpen(isOpen ? -1 : i)}
                    style={{ width: '100%', textAlign: 'left', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.q}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-brand)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, padding: '0 18px 16px', margin: 0 }}>{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Masih butuh bantuan?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Tim dukungan kami siap membantu.</p>
            <Link href="/hubungi" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: '9px', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: 'var(--shadow-brand)' }}>Hubungi Kami</Link>
          </div>
        </div>
      </main>
    </div>
  );
}