'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const perks = [
  { icon: '🌱', title: 'Pertumbuhan Nyata', desc: 'Kesempatan belajar dan berkembang bersama produk yang berdampak.' },
  { icon: '🏠', title: 'Kerja Fleksibel', desc: 'Dukungan kerja remote dan jam kerja yang manusiawi.' },
  { icon: '🤝', title: 'Tim Suportif', desc: 'Budaya kolaboratif, terbuka, dan saling mendukung.' },
  { icon: '💡', title: 'Dampak Sosial', desc: 'Bantu lebih banyak orang mendapatkan pekerjaan layak (SDG 8).' },
];

const roles = [
  { title: 'Frontend Engineer', type: 'Full-time', loc: 'Remote' },
  { title: 'UI/UX Designer', type: 'Full-time', loc: 'Jakarta' },
  { title: 'Content & Community', type: 'Kontrak', loc: 'Remote' },
  { title: 'Partnership Associate', type: 'Full-time', loc: 'Jakarta' },
];

export default function KarierPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Berkarier di CareerForge</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.7 }}>
              Bergabunglah dengan tim yang percaya bahwa setiap orang berhak atas pekerjaan yang layak. Kami membangun produk yang membantu ribuan orang menemukan jalan kariernya.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {perks.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{p.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{p.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>Lowongan Internal</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {roles.map((r, i) => (
              <motion.div key={r.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px 20px', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>🗂️ {r.type} • 📍 {r.loc}</div>
                </div>
                <Link href="/hubungi" style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--surface-brand)', color: 'var(--text-brand)', border: '1px solid var(--border-brand)', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>Lamar</Link>
              </motion.div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Tidak menemukan posisi yang cocok?</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Kirimkan profilmu, kami akan menghubungi jika ada peluang yang sesuai.</p>
            <Link href="/hubungi" style={{ display: 'inline-block', padding: '11px 24px', borderRadius: '9px', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: 'var(--shadow-brand)' }}>Hubungi Kami</Link>
          </div>
        </div>
      </main>
    </div>
  );
}