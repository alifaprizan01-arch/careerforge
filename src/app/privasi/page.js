'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';

const SECTIONS = [
  { id: 'kumpul', title: 'Informasi yang Kami Kumpulkan', body: 'Kami mengumpulkan informasi yang kamu berikan secara langsung, seperti nama, email, nomor telepon, data profil, dokumen (CV, portofolio, sertifikat), serta riwayat lamaran dan pelatihan. Kami juga dapat mengumpulkan data penggunaan untuk meningkatkan layanan.' },
  { id: 'guna', title: 'Cara Kami Menggunakan Informasi', body: 'Informasi digunakan untuk menyediakan dan meningkatkan layanan, menghubungkan kamu dengan lowongan dan pelatihan yang relevan, memproses lamaran, serta berkomunikasi terkait akun dan fitur.' },
  { id: 'bagi', title: 'Berbagi Informasi', body: 'Data lamaran dan dokumen yang kamu kirimkan dapat dibagikan kepada perusahaan tempat kamu melamar. Kami tidak menjual data pribadimu kepada pihak ketiga.' },
  { id: 'aman', title: 'Keamanan Data', body: 'Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data. Namun, tidak ada metode transmisi melalui internet yang sepenuhnya aman.' },
  { id: 'hak', title: 'Hak Kamu', body: 'Kamu berhak mengakses, memperbarui, atau menghapus data pribadimu melalui halaman Profil dan Dokumen. Untuk permintaan lain, hubungi kami.' },
  { id: 'ubah', title: 'Perubahan Kebijakan', body: 'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan kami informasikan melalui platform.' },
];

export default function PrivasiPage() {
  const { isDark } = useTheme();
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF',
  };

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? Math.min(100, (h.scrollTop / total) * 100) : 0);
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) current = s.id;
      }
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Reading progress */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '4px', zIndex: 900 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)', transition: 'width 0.1s linear' }} />
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '56px 24px 64px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Kebijakan Privasi</h1>
          <p style={{ fontSize: '14px', opacity: 0.85 }}>Terakhir diperbarui: Juni 2026</p>
        </motion.div>
      </div>

      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '36px 24px 70px', display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* TOC */}
        <aside style={{ flex: '0 0 240px', position: 'sticky', top: '90px', minWidth: '220px' }}>
          <div style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '18px', boxShadow: '0 4px 20px rgba(124,58,237,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Daftar Isi</div>
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => goTo(s.id)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: '4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                background: activeId === s.id ? c.brandBg : 'transparent',
                color: activeId === s.id ? c.brand : c.muted,
                fontWeight: activeId === s.id ? 700 : 500, transition: 'all 0.15s',
              }}>{i + 1}. {s.title}</button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <p style={{ fontSize: '15px', color: c.muted, lineHeight: 1.8, marginBottom: '28px' }}>Privasimu penting bagi kami. Kebijakan ini menjelaskan bagaimana CareerForge mengumpulkan, menggunakan, dan melindungi informasimu.</p>
          {SECTIONS.map((s, i) => (
            <motion.section key={s.id} id={s.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
              style={{ scrollMarginTop: '90px', background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '24px 26px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: c.text, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: c.brandBg, color: c.brand, fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                {s.title}
              </h2>
              <p style={{ fontSize: '15px', color: c.muted, lineHeight: 1.8 }}>{s.body}</p>
            </motion.section>
          ))}
        </div>
      </main>
    </div>
  );
}