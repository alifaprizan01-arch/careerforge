'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';

const FAQS = [
  { q: 'Bagaimana cara melamar pekerjaan?', a: 'Buka halaman Lowongan, pilih pekerjaan yang sesuai, lalu klik "Lamar Sekarang". Lengkapi dokumen yang diminta perusahaan dan kirim lamaranmu. Status lamaran bisa dipantau di halaman Lamaran Saya.' },
  { q: 'Bagaimana cara mengunggah dokumen saya?', a: 'Masuk ke halaman Dokumen Saya melalui menu Profil. Klik "Unggah Dokumen", pilih kategori (CV, portofolio, atau sertifikat), lalu pilih file dari perangkatmu. Dokumen yang tersimpan bisa langsung dilampirkan saat melamar.' },
  { q: 'Apa itu CV Builder?', a: 'CV Builder membantumu membuat CV profesional langkah demi langkah lewat formulir terpandu, lalu mengunduhnya dalam format siap pakai — tanpa perlu aplikasi desain apa pun.' },
  { q: 'Bagaimana cara mengikuti pelatihan?', a: 'Buka halaman Pelatihan, pilih kursus yang kamu minati, lalu mulai modul pertamanya. Progres belajarmu tersimpan otomatis sehingga kamu bisa melanjutkan kapan saja.' },
  { q: 'Bagaimana cara menghubungi mentor?', a: 'Buka halaman Mentoring, pilih mentor sesuai bidang yang kamu butuhkan, lalu ajukan jadwal sesi. Mentor akan mengonfirmasi waktu yang tersedia.' },
  { q: 'Apakah akun saya aman?', a: 'Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi datamu. Jaga kerahasiaan kata sandimu dan jangan membagikannya ke siapa pun. Lihat Kebijakan Privasi untuk detail selengkapnya.' },
];

export default function BantuanPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(0);

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF',
  };

  const filtered = FAQS.filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '60px 24px 70px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Bantuan &amp; Dukungan</h1>
          <p style={{ fontSize: '17px', opacity: 0.92, maxWidth: '560px', margin: '0 auto' }}>Pertanyaan yang sering diajukan. Tidak menemukan jawabannya? Hubungi kami.</p>
        </motion.div>
      </div>

      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '0 24px', transform: 'translateY(-32px)' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px 20px', boxShadow: '0 8px 30px rgba(124,58,237,0.10)', marginBottom: '24px' }}>
          <span style={{ color: c.muted, fontSize: '18px' }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setOpen(null); }} placeholder="Cari pertanyaan..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: c.text, fontFamily: 'inherit' }} />
        </div>

        {/* FAQ accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div key={f.q} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: c.card, borderRadius: '14px', border: `1px solid ${isOpen ? c.brand : c.border}`, overflow: 'hidden', boxShadow: isOpen ? '0 8px 26px rgba(124,58,237,0.12)' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 0.2s, box-shadow 0.2s' }}>
                <button onClick={() => setOpen(isOpen ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: c.text }}>{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ color: c.brand, fontSize: '14px', flexShrink: 0 }}>▼</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                      <p style={{ padding: '0 22px 20px', fontSize: '14px', color: c.muted, lineHeight: 1.7 }}>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: c.muted, padding: '30px' }}>Tidak ada pertanyaan yang cocok. Coba kata kunci lain.</p>}
        </div>

        {/* CTA */}
        <div style={{ background: c.brandBg, border: `1px solid ${c.brand}33`, borderRadius: '18px', padding: '36px', textAlign: 'center', margin: '32px 0 60px' }}>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: c.text, marginBottom: '6px' }}>Masih butuh bantuan?</h3>
          <p style={{ fontSize: '14px', color: c.muted, marginBottom: '20px' }}>Tim dukungan kami siap membantu.</p>
          <Link href="/hubungi" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '10px', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Hubungi Kami</Link>
        </div>
      </main>
    </div>
  );
}