'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';

const GROUPS = [
  { title: 'Utama', icon: '🧭', links: [
    { label: 'Beranda', href: '/', icon: '🏠' },
    { label: 'Lowongan Kerja', href: '/trayek', icon: '💼' },
    { label: 'Lamaran Saya', href: '/lamaran', icon: '📋' },
    { label: 'Pelatihan', href: '/pelatihan', icon: '🎓' },
    { label: 'Mentoring', href: '/mentoring', icon: '🎤' },
    { label: 'Sertifikat', href: '/sertifikat', icon: '🏆' },
    { label: 'Pesan', href: '/chat', icon: '💬' },
  ]},
  { title: 'Akun & Dokumen', icon: '👤', links: [
    { label: 'Profil', href: '/profil', icon: '🪪' },
    { label: 'Edit Profil', href: '/profil/edit', icon: '✏️' },
    { label: 'Dokumen Saya', href: '/dokumen', icon: '📁' },
    { label: 'CV Builder', href: '/cv-builder', icon: '✨' },
  ]},
  { title: 'Perusahaan', icon: '🏢', links: [
    { label: 'Tentang Kami', href: '/tentang', icon: '💡' },
    { label: 'Karier', href: '/karier', icon: '🌱' },
    { label: 'Hubungi Kami', href: '/hubungi', icon: '✉️' },
    { label: 'Blog', href: '/blog', icon: '📰' },
    { label: 'Bantuan & Dukungan', href: '/bantuan', icon: '💬' },
  ]},
  { title: 'Legal & Aksesibilitas', icon: '⚖️', links: [
    { label: 'Kebijakan Privasi', href: '/privasi', icon: '🔒' },
    { label: 'Syarat & Ketentuan', href: '/syarat', icon: '📜' },
    { label: 'Pernyataan Aksesibilitas', href: '/aksesibilitas', icon: '♿' },
    { label: 'Peta Situs', href: '/peta-situs', icon: '🗺️' },
  ]},
];

export default function PetaSitusPage() {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF', hover: isDark ? '#241C36' : '#F6F2FF',
  };

  const q = search.toLowerCase();
  const groups = GROUPS.map(g => ({ ...g, links: g.links.filter(l => !search || l.label.toLowerCase().includes(q)) })).filter(g => g.links.length > 0);

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '56px 24px 64px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🗺️</div>
          <h1 style={{ fontSize: '38px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Peta Situs</h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>Semua halaman SiapKerja.id dalam satu tempat.</p>
        </motion.div>
      </div>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 70px', transform: 'translateY(-30px)' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px 20px', boxShadow: '0 8px 30px rgba(124,58,237,0.10)', marginBottom: '28px' }}>
          <span style={{ color: c.muted, fontSize: '18px' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari halaman..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: c.text, fontFamily: 'inherit' }} />
          {search && <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', color: c.muted, cursor: 'pointer', fontSize: '14px' }}>✕</button>}
        </div>

        {/* Groups */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '18px' }}>
          {groups.map((g, gi) => (
            <motion.div key={g.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}
              style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '20px', boxShadow: '0 4px 20px rgba(124,58,237,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: c.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>{g.icon}</div>
                <h2 style={{ fontSize: '13px', fontWeight: 800, color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.title}</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {g.links.map(l => (
                  <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '9px', textDecoration: 'none', color: c.muted, fontSize: '14px', fontWeight: 500, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = c.hover; e.currentTarget.style.color = c.brand; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c.muted; }}>
                    <span style={{ fontSize: '15px' }}>{l.icon}</span>
                    <span>{l.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        {groups.length === 0 && <p style={{ textAlign: 'center', color: c.muted, padding: '50px' }}>Tidak ada halaman yang cocok dengan pencarian.</p>}
      </main>
    </div>
  );
}