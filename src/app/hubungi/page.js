'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../components/Sidebar';

const CONTACTS = [
  { icon: '✉️', label: 'Email', value: 'support@SiapKerja.id.id' },
  { icon: '📞', label: 'Telepon', value: '+62 21 1234 5678' },
  { icon: '📍', label: 'Alamat', value: 'Jakarta, Indonesia' },
  { icon: '🕐', label: 'Jam Operasional', value: 'Senin–Jumat, 09.00–17.00 WIB' },
];

export default function HubungiPage() {
  const { isDark } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF', input: isDark ? '#0F0A1F' : '#FAF8FF',
  };
  const inp = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.text, fontFamily: 'inherit', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '13px', fontWeight: 700, color: c.text, marginBottom: '7px' };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { setError('Semua kolom wajib diisi.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Format email tidak valid.'); return; }
    setError('');
    const { error: e } = await supabase.from('contact_messages').insert([{
      type: 'hubungi', name: form.name.trim(), email: form.email.trim(), message: form.message.trim(),
    }]);
    if (e) { setError('Gagal mengirim: ' + e.message); return; }
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 0px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '60px 24px 70px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✉️</div>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Hubungi Kami</h1>
          <p style={{ fontSize: '17px', opacity: 0.92, maxWidth: '560px', margin: '0 auto' }}>Ada pertanyaan atau masukan? Kami senang mendengarnya.</p>
        </motion.div>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 60px', transform: 'translateY(-36px)' }}>
        {/* Contact cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {CONTACTS.map((ct, i) => (
            <motion.div key={ct.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }}
              style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 20px rgba(124,58,237,0.08)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: c.brandBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{ct.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: c.muted, marginBottom: '2px' }}>{ct.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: c.text, wordBreak: 'break-word' }}>{ct.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: c.card, borderRadius: '18px', border: `1px solid ${c.border}`, padding: '32px', boxShadow: '0 8px 30px rgba(124,58,237,0.10)' }}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '14px' }}>✅</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: c.text, marginBottom: '8px' }}>Pesan Terkirim!</h3>
                <p style={{ fontSize: '14px', color: c.muted, marginBottom: '24px', lineHeight: 1.6 }}>Terima kasih, <b style={{ color: c.text }}>{form.name}</b>. Pesanmu sudah kami terima dan akan kami balas ke <b style={{ color: c.text }}>{form.email}</b>.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }} style={{ padding: '11px 26px', borderRadius: '10px', border: `1px solid ${c.brand}`, background: 'transparent', color: c.brand, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Kirim Pesan Lain</button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: c.text, marginBottom: '20px' }}>Kirim Pesan</h2>
                {error && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '10px 14px', borderRadius: '8px', background: isDark ? '#450A0A' : '#FEF2F2', border: '1px solid #DC262644', color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>{error}</motion.div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={lbl}>Nama</label>
                    <input style={inp} placeholder="Nama lengkap" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Email</label>
                    <input style={inp} placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label style={lbl}>Pesan</label>
                    <textarea style={{ ...inp, minHeight: '120px', resize: 'vertical', lineHeight: 1.6 }} placeholder="Tulis pesanmu di sini..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={submit} style={{ padding: '13px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>Kirim Pesan</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}