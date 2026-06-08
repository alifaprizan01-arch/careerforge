'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';

export default function AuthPage() {
  const router = useRouter();
  const { login } = useUser();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', company_name: '', account_type: 'user' });

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };
  const hashPassword = pw => `hashed_${pw}`;

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data, error: dbErr } = await supabase.from('users').select('*').eq('email', form.email).single();
      if (dbErr || !data) { setError('Email tidak ditemukan.'); return; }
      if (data.password_hash !== hashPassword(form.password)) { setError('Password salah.'); return; }
      login({ id: data.id, full_name: data.full_name, email: data.email, role: data.role || 'user', avatar_url: data.avatar_url || null, company_name: data.company_name || null });
      const roleMap = { admin: 'Admin', company: 'Perusahaan', mentor: 'Mentor' };
      setSuccess(`Selamat datang${roleMap[data.role] ? ', ' + roleMap[data.role] : ''} ${data.full_name}!`);
      setTimeout(() => {
        if (data.role === 'admin') router.push('/admin');
        else if (data.role === 'company') router.push('/company');
        else if (data.role === 'mentor') router.push('/mentor');
        else router.push('/');
      }, 1000);
    } catch { setError('Terjadi kesalahan. Coba lagi.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault(); setLoading(true); setError('');
    if (!form.full_name.trim()) { setError('Nama wajib diisi.'); setLoading(false); return; }
    if (form.password !== form.confirm_password) { setError('Password tidak cocok.'); setLoading(false); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return; }
    if (form.account_type === 'company' && !form.company_name.trim()) { setError('Nama perusahaan wajib diisi.'); setLoading(false); return; }
    try {
      const { data: ex } = await supabase.from('users').select('id').eq('email', form.email).single();
      if (ex) { setError('Email sudah terdaftar.'); return; }
      const payload = { full_name: form.full_name, email: form.email, password_hash: hashPassword(form.password), role: form.account_type === 'company' ? 'company' : 'user' };
      if (form.account_type === 'company') payload.company_name = form.company_name;
      const { error: insertErr } = await supabase.from('users').insert([payload]);
      if (insertErr) throw insertErr;
      setSuccess('Akun berhasil dibuat! Silakan login.');
      setForm({ full_name: '', email: '', password: '', confirm_password: '', company_name: '', account_type: 'user' });
      setTimeout(() => setMode('login'), 1500);
    } catch (err) { setError('Gagal mendaftar: ' + err.message); }
    finally { setLoading(false); }
  };

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid var(--border-default)', fontSize: '14px', outline: 'none',
    background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const roles = [
    { icon: '👤', title: 'Pencari Kerja', desc: 'Cari lowongan, lamar, pantau status', color: '#2563EB' },
    { icon: '🏢', title: 'Perusahaan', desc: 'Posting lowongan, kelola pelamar', color: '#7C3AED' },
    { icon: '🎤', title: 'Mentor', desc: 'Kelola sesi dan booking mentoring', color: '#16A34A' },
    { icon: '🛡️', title: 'Superadmin', desc: 'Kelola seluruh platform', color: '#D97706' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', background: '#F8FAFC' }}>

      {/* Left Panel */}
      <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ flex: 1, background: 'linear-gradient(145deg, #0F172A 0%, #1E3A5F 50%, #1D4ED8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: '#fff', position: 'relative', overflow: 'hidden' }}>

        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>CF</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>CareerForge</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Platform Karir</div>
            </div>
          </div>

          <h1 style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-0.03em' }}>
            Platform karir<br />untuk semua
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '40px' }}>
            Satu ekosistem untuk pencari kerja, perusahaan, mentor, dan admin.
          </p>

          {/* Role cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roles.map((r, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.08 }}
                style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: r.color, marginBottom: '2px' }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{r.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
              🔄 Login otomatis diarahkan sesuai role akun kamu
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{ width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#fff', overflowY: 'auto', boxShadow: '-20px 0 60px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {mode === 'login' ? 'Masuk ke akun' : 'Buat akun baru'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              {mode === 'login' ? 'Diarahkan otomatis sesuai role' : 'Pilih jenis akun yang sesuai'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {[{ id: 'login', label: 'Masuk' }, { id: 'register', label: 'Daftar' }].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setError(''); setSuccess(''); }} style={{
                flex: 1, padding: '9px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: mode === m.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: mode === m.id ? '#fff' : 'transparent', color: mode === m.id ? '#0F172A' : '#64748B',
                boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>{m.label}</button>
            ))}
          </div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>⚠️ {error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '11px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', color: '#16A34A', fontSize: '13px', marginBottom: '16px' }}>✓ {success}</motion.div>}
          </AnimatePresence>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Daftar sebagai</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                    {[{ value: 'user', label: '👤 Pencari Kerja' }, { value: 'company', label: '🏢 Perusahaan' }].map(t => (
                      <button type="button" key={t.value} onClick={() => setForm({ ...form, account_type: t.value })} style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${form.account_type === t.value ? '#2563EB' : '#E2E8F0'}`,
                        background: form.account_type === t.value ? '#EFF6FF' : '#fff',
                        color: form.account_type === t.value ? '#2563EB' : '#64748B',
                        fontSize: '13px', fontWeight: form.account_type === t.value ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}>{t.label}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{form.account_type === 'company' ? 'Nama Penanggung Jawab' : 'Nama Lengkap'}</label>
                  <input style={inp} type="text" name="full_name" placeholder="Nama lengkap" value={form.full_name} onChange={handleChange} required
                    onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode === 'register' && form.account_type === 'company' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Nama Perusahaan *</label>
                  <input style={inp} type="text" name="company_name" placeholder="PT. Nama Perusahaan" value={form.company_name} onChange={handleChange} required
                    onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }} />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Email</label>
              <input style={inp} type="email" name="email" placeholder="nama@email.com" value={form.email} onChange={handleChange} required
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Password</label>
              <input style={inp} type="password" name="password" placeholder={mode === 'register' ? 'Minimal 6 karakter' : '••••••••'} value={form.password} onChange={handleChange} required
                onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }} />
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Konfirmasi Password</label>
                  <input style={inp} type="password" name="confirm_password" placeholder="Ulangi password" value={form.confirm_password} onChange={handleChange} required
                    onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }} style={{
              width: '100%', padding: '12px', borderRadius: '9px', border: 'none',
              background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.15s',
            }}>
              {loading ? 'Memproses...' : mode === 'login' ? '→ Masuk' : '✨ Buat Akun'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: '#64748B' }}>
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </button>
          </p>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.6 }}>
              Dengan masuk, kamu menyetujui syarat & ketentuan CareerForge
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
