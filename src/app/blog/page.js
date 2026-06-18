'use client';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const posts = [
  { title: '5 Cara Membuat CV yang Dilirik Rekruter', cat: 'Karier', date: '12 Jun 2026', excerpt: 'Pelajari struktur dan kata kunci yang membuat CV-mu menonjol di tumpukan lamaran.', emoji: '📄' },
  { title: 'Skill Paling Dicari di 2026', cat: 'Tren', date: '8 Jun 2026', excerpt: 'Dari data analytics hingga komunikasi, inilah keahlian yang paling dibutuhkan perusahaan.', emoji: '📈' },
  { title: 'Persiapan Wawancara Kerja Pertama', cat: 'Tips', date: '2 Jun 2026', excerpt: 'Panduan langkah demi langkah agar kamu percaya diri menghadapi wawancara.', emoji: '🎤' },
  { title: 'Manfaat Mentoring untuk Pengembangan Karier', cat: 'Mentoring', date: '28 Mei 2026', excerpt: 'Mengapa punya mentor bisa mempercepat pertumbuhan profesionalmu.', emoji: '🧭' },
  { title: 'Membangun Portofolio yang Kuat', cat: 'Karier', date: '20 Mei 2026', excerpt: 'Tips menyusun portofolio yang menunjukkan kemampuan nyatamu.', emoji: '🗂️' },
  { title: 'Sertifikasi: Worth It atau Tidak?', cat: 'Tren', date: '14 Mei 2026', excerpt: 'Kapan sertifikasi memberi nilai tambah dan kapan sebaiknya fokus ke pengalaman.', emoji: '🏆' },
];

export default function BlogPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Blog CareerForge</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Wawasan, tips, dan tren seputar dunia kerja dan pengembangan karier.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {posts.map((p, i) => (
              <motion.article key={p.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ height: '120px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px' }}>{p.emoji}</div>
                <div style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-purple">{p.cat}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{p.date}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '8px' }}>{p.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{p.excerpt}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}