'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const VALUES = [
  { icon: '🌱', title: 'Pertumbuhan Nyata', desc: 'Kesempatan belajar dan berkembang bersama produk yang berdampak.' },
  { icon: '🏠', title: 'Kerja Fleksibel', desc: 'Dukungan kerja remote dan jam kerja yang manusiawi.' },
  { icon: '🤝', title: 'Tim Suportif', desc: 'Budaya kolaboratif, terbuka, dan saling mendukung.' },
  { icon: '💡', title: 'Dampak Sosial', desc: 'Bantu lebih banyak orang mendapatkan pekerjaan layak (SDG 8).' },
];
const JOBS = [
  { title: 'Frontend Engineer', type: 'Full-time', loc: 'Remote' },
  { title: 'UI/UX Designer', type: 'Full-time', loc: 'Jakarta' },
  { title: 'Content & Community', type: 'Kontrak', loc: 'Remote' },
  { title: 'Partnership Associate', type: 'Full-time', loc: 'Jakarta' },
];
const TYPES = ['Semua', 'Full-time', 'Kontrak'];

export default function KarierPage() {
  const { isDark } = useTheme();
  const [type, setType] = useState('Semua');
  const [search, setSearch] = useState('');
  const [applyFor, setApplyFor] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [applyErr, setApplyErr] = useState('');

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED', brandDark: '#6D28D9',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF', input: isDark ? '#0F0A1F' : '#FAF8FF',
  };
  const inp = { width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.text, fontFamily: 'inherit', boxSizing: 'border-box' };

  const filtered = JOBS.filter(j => (type === 'Semua' || j.type === type) && (!search || j.title.toLowerCase().includes(search.toLowerCase()) || j.loc.toLowerCase().includes(search.toLowerCase())));

  const openApply = (job) => { setApplyFor(job); setForm({ name: '', email: '', message: '' }); setSent(false); setApplyErr(''); };
  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setApplyErr('');
    const { error } = await supabase.from('contact_messages').insert([{
      type: 'karier', name: form.name.trim(), email: form.email.trim(),
      message: form.message?.trim() || null, position: applyFor?.title || null,
    }]);
    if (error) { setApplyErr('Gagal mengirim: ' + error.message); return; }
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '64px 24px 72px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)' }}>KARIER</span>
          <h1 style={{ fontSize: '42px', fontWeight: 800, margin: '18px 0 12px', letterSpacing: '-0.02em' }}>Berkarier di SiapKerja.id</h1>
          <p style={{ fontSize: '17px', opacity: 0.92, maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>Bergabunglah dengan tim yang percaya bahwa setiap orang berhak atas pekerjaan yang layak. Kami membangun produk yang membantu ribuan orang menemukan jalan kariernya.</p>
        </motion.div>
      </div>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px', transform: 'translateY(-36px)' }}>
        {/* Values */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '44px' }}>
          {VALUES.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }}
              style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '22px', boxShadow: '0 4px 20px rgba(124,58,237,0.08)' }}>
              <div style={{ fontSize: '30px', marginBottom: '12px' }}>{v.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '6px' }}>{v.title}</h3>
              <p style={{ fontSize: '13px', color: c.muted, lineHeight: 1.6 }}>{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Jobs */}
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: c.text, marginBottom: '16px' }}>Lowongan Internal</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '12px 18px', marginBottom: '14px' }}>
          <span style={{ color: c.muted }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari posisi atau lokasi..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: c.text, fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)} style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${type === t ? c.brand : c.border}`, background: type === t ? c.brand : c.card, color: type === t ? '#fff' : c.muted }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '44px' }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((j, i) => (
              <motion.div key={j.title} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.01 }}
                style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s', flexWrap: 'wrap' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 28px rgba(124,58,237,0.14)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '5px' }}>{j.title}</h3>
                  <div style={{ fontSize: '13px', color: c.muted, display: 'flex', gap: '14px' }}>
                    <span>💼 {j.type}</span><span>📍 {j.loc}</span>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => openApply(j)} style={{ padding: '9px 22px', borderRadius: '10px', border: `1px solid ${c.brand}`, background: c.brandBg, color: c.brand, fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>Lamar</motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: c.muted, padding: '30px' }}>Tidak ada posisi yang cocok.</p>}
        </div>

        {/* CTA */}
        <div style={{ background: c.brandBg, border: `1px solid ${c.brand}33`, borderRadius: '18px', padding: '40px', textAlign: 'center', marginBottom: '60px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: c.text, marginBottom: '8px' }}>Tidak menemukan posisi yang cocok?</h3>
          <p style={{ fontSize: '14px', color: c.muted, marginBottom: '20px' }}>Kirimkan profilmu, kami akan menghubungi jika ada peluang yang sesuai.</p>
          <Link href="/hubungi" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '10px', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Hubungi Kami</Link>
        </div>
      </main>

      {/* Apply modal */}
      <AnimatePresence>
        {applyFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setApplyFor(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '18px', padding: '28px', maxWidth: '440px', width: '100%' }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '54px', marginBottom: '14px' }}>✅</div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: c.text, marginBottom: '8px' }}>Lamaran Terkirim!</h3>
                  <p style={{ fontSize: '14px', color: c.muted, marginBottom: '22px', lineHeight: 1.6 }}>Terima kasih sudah melamar sebagai <b style={{ color: c.text }}>{applyFor.title}</b>. Tim kami akan meninjau dan menghubungimu lewat email.</p>
                  <button onClick={() => setApplyFor(null)} style={{ padding: '11px 26px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Selesai</button>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: c.text, marginBottom: '4px' }}>Lamar: {applyFor.title}</h3>
                  <p style={{ fontSize: '13px', color: c.muted, marginBottom: '20px' }}>💼 {applyFor.type} · 📍 {applyFor.loc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input style={inp} placeholder="Nama lengkap *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input style={inp} placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <textarea style={{ ...inp, minHeight: '90px', resize: 'vertical' }} placeholder="Ceritakan singkat tentang dirimu..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                  </div>
                  {applyErr && <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '10px', fontWeight: 500 }}>{applyErr}</p>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                    <button onClick={() => setApplyFor(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer', fontWeight: 500 }}>Batal</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={!form.name.trim() || !form.email.trim()} style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: (!form.name.trim() || !form.email.trim()) ? '#C4B5FD' : c.brand, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Kirim Lamaran</motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}