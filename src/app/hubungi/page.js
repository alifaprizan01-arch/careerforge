'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const contacts = [
  { icon: '✉️', label: 'Email', value: 'support@careerforge.id' },
  { icon: '📞', label: 'Telepon', value: '+62 21 1234 5678' },
  { icon: '📍', label: 'Alamat', value: 'Jakarta, Indonesia' },
  { icon: '🕐', label: 'Jam Operasional', value: 'Senin–Jumat, 09.00–17.00 WIB' },
];

export default function HubungiPage() {
  const [form, setForm] = useState({ nama: '', email: '', pesan: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.nama || !form.email || !form.pesan) return;
    setSent(true);
  };

  const inp = { width: '100%', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Hubungi Kami</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Ada pertanyaan atau masukan? Kami senang mendengarnya.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {contacts.map(c => (
              <div key={c.label} style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '18px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '22px' }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>Kirim Pesan</h2>
            {sent ? (
              <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>✓</div>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>Terima kasih, {form.nama}! Pesanmu sudah kami terima.</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Tim kami akan membalas ke {form.email} secepatnya.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Nama</label>
                  <input style={inp} value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input style={inp} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Pesan</label>
                  <textarea style={{ ...inp, resize: 'vertical', minHeight: '110px', lineHeight: 1.6 }} value={form.pesan} onChange={e => setForm({ ...form, pesan: e.target.value })} placeholder="Tulis pesanmu di sini..." />
                </div>
                <button onClick={handleSubmit} disabled={!form.nama || !form.email || !form.pesan}
                  style={{ padding: '12px', borderRadius: '10px', border: 'none', background: (!form.nama || !form.email || !form.pesan) ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: (!form.nama || !form.email || !form.pesan) ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  Kirim Pesan
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}