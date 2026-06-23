'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';

const POSTS = [
  { cat: 'Karier', date: '12 Jun 2026', icon: '📄', title: '5 Cara Membuat CV yang Dilirik Rekruter', excerpt: 'Pelajari struktur dan kata kunci yang membuat CV-mu menonjol di tumpukan lamaran.', body: 'CV yang baik bukan soal panjang, tapi soal relevansi. Mulai dari ringkasan profil yang kuat, gunakan kata kunci dari deskripsi lowongan, tonjolkan pencapaian terukur (angka, persentase), jaga format yang bersih dan konsisten, serta sesuaikan tiap CV dengan posisi yang dilamar. Hindari template berlebihan—rekruter hanya butuh beberapa detik untuk memutuskan.' },
  { cat: 'Tren', date: '8 Jun 2026', icon: '📈', title: 'Skill Paling Dicari di 2026', excerpt: 'Dari data analytics hingga komunikasi, inilah keahlian yang paling dibutuhkan perusahaan.', body: 'Permintaan terhadap kemampuan analitis data, pemahaman AI, dan literasi digital terus naik. Namun soft skill seperti komunikasi, kolaborasi, dan kemampuan belajar cepat tetap menjadi pembeda. Kombinasi keahlian teknis dan interpersonal adalah yang paling dicari pemberi kerja tahun ini.' },
  { cat: 'Tips', date: '2 Jun 2026', icon: '🎤', title: 'Persiapan Wawancara Kerja Pertama', excerpt: 'Panduan langkah demi langkah agar kamu percaya diri menghadapi wawancara.', body: 'Riset perusahaan dan posisi, siapkan jawaban untuk pertanyaan umum dengan metode STAR (Situation, Task, Action, Result), latih dengan teman, siapkan pertanyaan balik yang cerdas, dan datang lebih awal. Percaya diri datang dari persiapan.' },
  { cat: 'Mentoring', date: '28 Mei 2026', icon: '🧭', title: 'Manfaat Mentoring untuk Pengembangan Karier', excerpt: 'Mengapa punya mentor bisa mempercepat pertumbuhan profesionalmu.', body: 'Mentor memberi perspektif, jaringan, dan umpan balik jujur yang sulit didapat sendirian. Mereka membantu kamu menghindari kesalahan umum dan mempercepat kurva belajar. Carilah mentor yang pengalamannya relevan dengan tujuanmu.' },
  { cat: 'Karier', date: '20 Mei 2026', icon: '📁', title: 'Membangun Portofolio yang Kuat', excerpt: 'Tips menyusun portofolio yang menunjukkan kemampuan nyatamu.', body: 'Portofolio yang kuat menampilkan proses, bukan hanya hasil. Sertakan studi kasus, jelaskan masalah dan solusimu, tampilkan dampak nyata, dan kurasi hanya karya terbaik. Kualitas selalu mengalahkan kuantitas.' },
  { cat: 'Tren', date: '14 Mei 2026', icon: '🏆', title: 'Sertifikasi: Worth It atau Tidak?', excerpt: 'Kapan sertifikasi memberi nilai tambah dan kapan sebaiknya fokus ke pengalaman.', body: 'Sertifikasi bermanfaat saat membuktikan keahlian spesifik yang diminta industri atau saat berpindah karier. Namun untuk banyak peran, proyek nyata dan pengalaman lebih berbicara. Pilih sertifikasi yang diakui dan relevan dengan tujuan kariermu.' },
];
const CATS = ['Semua', 'Karier', 'Tren', 'Tips', 'Mentoring'];
const catColor = { Karier: '#7C3AED', Tren: '#2563EB', Tips: '#16A34A', Mentoring: '#D97706' };

export default function BlogPage() {
  const { isDark } = useTheme();
  const [cat, setCat] = useState('Semua');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF',
  };

  const filtered = POSTS.filter(p =>
    (cat === 'Semua' || p.cat === cat) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '64px 24px 72px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)' }}>BLOG</span>
          <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '18px 0 10px', letterSpacing: '-0.02em' }}>Blog SiapKerja.id</h1>
          <p style={{ fontSize: '17px', opacity: 0.92, maxWidth: '600px', margin: '0 auto' }}>Wawasan, tips, dan tren seputar dunia kerja dan pengembangan karier.</p>
        </motion.div>
      </div>

      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', transform: 'translateY(-32px)' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '14px 20px', boxShadow: '0 8px 30px rgba(124,58,237,0.10)', marginBottom: '20px' }}>
          <span style={{ color: c.muted, fontSize: '18px' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari artikel..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: c.text, fontFamily: 'inherit' }} />
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {CATS.map(ct => (
            <button key={ct} onClick={() => setCat(ct)} style={{
              padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${cat === ct ? c.brand : c.border}`,
              background: cat === ct ? c.brand : c.card,
              color: cat === ct ? '#fff' : c.muted,
              transition: 'all 0.15s',
            }}>{ct}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px', paddingBottom: '60px' }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.article key={p.title} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: i * 0.04 }}
                onClick={() => setActive(p)} whileHover={{ y: -6 }}
                style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.16)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}>
                <div style={{ height: '140px', background: `linear-gradient(135deg, ${catColor[p.cat]}22, ${c.brandBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>{p.icon}</div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${catColor[p.cat]}1A`, color: catColor[p.cat] }}>{p.cat}</span>
                    <span style={{ fontSize: '12px', color: c.muted }}>{p.date}</span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: c.text, marginBottom: '8px', lineHeight: 1.35 }}>{p.title}</h3>
                  <p style={{ fontSize: '14px', color: c.muted, lineHeight: 1.6 }}>{p.excerpt}</p>
                  <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600, color: c.brand }}>Baca selengkapnya →</div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && <p style={{ textAlign: 'center', color: c.muted, padding: '40px' }}>Tidak ada artikel yang cocok.</p>}
      </main>

      {/* Article modal */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '18px', maxWidth: '620px', width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
              <div style={{ height: '160px', background: `linear-gradient(135deg, ${catColor[active.cat]}33, ${c.brandBg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', position: 'relative' }}>
                {active.icon}
                <button onClick={() => setActive(null)} style={{ position: 'absolute', top: '14px', right: '14px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer', fontSize: '15px' }}>✕</button>
              </div>
              <div style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${catColor[active.cat]}1A`, color: catColor[active.cat] }}>{active.cat}</span>
                  <span style={{ fontSize: '12px', color: c.muted }}>{active.date}</span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: c.text, marginBottom: '14px', lineHeight: 1.3 }}>{active.title}</h2>
                <p style={{ fontSize: '15px', color: c.text, lineHeight: 1.8, opacity: 0.9 }}>{active.body}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}