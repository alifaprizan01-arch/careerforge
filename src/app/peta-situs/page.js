'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const groups = [
  { title: 'Utama', links: [
    { label: 'Beranda', href: '/' },
    { label: 'Lowongan Kerja', href: '/trayek' },
    { label: 'Lamaran Saya', href: '/lamaran' },
    { label: 'Pelatihan', href: '/pelatihan' },
    { label: 'Mentoring', href: '/mentoring' },
    { label: 'Sertifikat', href: '/sertifikat' },
    { label: 'Pesan', href: '/pesan' },
  ]},
  { title: 'Akun & Dokumen', links: [
    { label: 'Profil', href: '/profil' },
    { label: 'Edit Profil', href: '/profil/edit' },
    { label: 'Dokumen Saya', href: '/dokumen' },
    { label: 'CV Builder', href: '/cv-builder' },
  ]},
  { title: 'Perusahaan', links: [
    { label: 'Tentang Kami', href: '/tentang' },
    { label: 'Karier', href: '/karier' },
    { label: 'Hubungi Kami', href: '/hubungi' },
    { label: 'Blog', href: '/blog' },
    { label: 'Bantuan & Dukungan', href: '/bantuan' },
  ]},
  { title: 'Legal & Aksesibilitas', links: [
    { label: 'Kebijakan Privasi', href: '/privasi' },
    { label: 'Syarat & Ketentuan', href: '/syarat' },
    { label: 'Pernyataan Aksesibilitas', href: '/aksesibilitas' },
    { label: 'Peta Situs', href: '/peta-situs' },
  ]},
];

export default function PetaSitusPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Peta Situs</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Semua halaman CareerForge dalam satu tempat.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
            {groups.map((g, i) => (
              <motion.div key={g.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.title}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {g.links.map(l => (
                    <Link key={l.href} href={l.href} style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-brand)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}