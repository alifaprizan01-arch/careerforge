'use client';
import { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', company_name: '', account_type: 'user' });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '1.5px solid #E2E8F0', fontSize: '14px', outline: 'none',
    background: '#F8FAFC', color: '#0F172A', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const roles = [
    { icon: '👤', title: 'Pencari Kerja', desc: 'Cari lowongan, lamar, pantau status', color: '#2563EB' },
    { icon: '🏢', title: 'Perusahaan', desc: 'Posting lowongan, kelola pelamar', color: '#7C3AED' },
    { icon: '🎤', title: 'Mentor', desc: 'Kelola sesi dan booking mentoring', color: '#16A34A' },
    { icon: '🛡️', title: 'Superadmin', desc: 'Kelola seluruh platform', color: '#D97706' },
  ];

  // Form panel (dipakai di desktop sebagai right panel, di mobile sebagai full page)
  const FormPanel = (
    <motion.div
      initial={{ x: isMobile ? 0 : 40, opacity: 0, y: isMobile ? 20 : 0 }}
      animate={{ x: 0, opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        width: isMobile ? '100%' : '440px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '32px 20px 48px' : '48px 40px',
        background: '#fff',
        boxShadow: isMobile ? 'none' : '-4px 0 24px rgba(0,0,0,0.06)',
        minHeight: isMobile ? '100vh' : 'auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? '28px' : '36px' }}>
        <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>SiapKerja.id</div>
          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Platform Karir</div>
        </div>
      </div>

      <h2 style={{ fontSize: isMobile ? '24px' : '22px', fontWeight: 800, color: '#0F172A', marginBottom: '4px', letterSpacing: '-0.02em' }}>
        {mode === 'login' ? 'Selamat datang kembali 👋' : 'Buat akun baru ✨'}
      </h2>
      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
        {mode === 'login' ? 'Masuk ke akun SiapKerja.id kamu' : 'Bergabung dengan ribuan pengguna SiapKerja.id'}
      </p>

      {/* Tab Masuk / Daftar */}
      <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
        {[{ id: 'login', label: 'Masuk' }, { id: 'register', label: 'Daftar' }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setError(''); setSuccess(''); }} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '14px',
            fontWeight: mode === m.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            background: mode === m.id ? '#fff' : 'transparent',
            color: mode === m.id ? '#0F172A' : '#64748B',
            boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{m.label}</button>
        ))}
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          ⚠️ {error}
        </motion.div>}
        {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ padding: '11px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', color: '#16A34A', fontSize: '13px', marginBottom: '14px' }}>
          ✓ {success}
        </motion.div>}
      </AnimatePresence>

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <AnimatePresence>
          {mode === 'register' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Daftar sebagai</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ value: 'user', label: '👤 Pencari Kerja' }, { value: 'company', label: '🏢 Perusahaan' }].map(t => (
                  <button type="button" key={t.value} onClick={() => setForm({ ...form, account_type: t.value })} style={{
                    flex: 1, padding: '10px 8px', borderRadius: '8px',
                    border: `2px solid ${form.account_type === t.value ? '#2563EB' : '#E2E8F0'}`,
                    background: form.account_type === t.value ? '#EFF6FF' : '#fff',
                    color: form.account_type === t.value ? '#2563EB' : '#64748B',
                    fontSize: '13px', fontWeight: form.account_type === t.value ? 700 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>{t.label}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode === 'register' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {form.account_type === 'company' ? 'Nama Penanggung Jawab' : 'Nama Lengkap'}
              </label>
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

        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={{
            width: '100%', padding: '13px', borderRadius: '9px', border: 'none',
            background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#fff', fontWeight: 700, fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '4px', fontFamily: 'inherit',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            transition: 'all 0.15s',
          }}>
          {loading ? 'Memproses...' : mode === 'login' ? '→ Masuk' : '✨ Buat Akun'}
        </motion.button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
        {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
          style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
        </button>
      </p>

      <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
          Dengan masuk, kamu menyetujui syarat & ketentuan SiapKerja.id
        </p>
      </div>
    </motion.div>
  );

  // Mobile: hanya tampilkan form dengan background gradient kecil di atas
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', position: 'relative' }}>
        {/* Banner kecil di atas untuk mobile */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(145deg, rgba(30,58,138,0.92) 0%, rgba(37,99,235,0.85) 55%, rgba(59,130,246,0.80) 100%), url(/Hana_2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          padding: '32px 20px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Orb dekoratif */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>SiapKerja.id</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform Karir</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.70)', margin: 0, lineHeight: 1.5 }}>
              Platform karir untuk semua — pencari kerja, perusahaan, mentor, dan admin.
            </p>
          </div>
        </div>

        {/* Form card muncul di atas banner dengan rounded top */}
        <div style={{
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          marginTop: '-20px',
          position: 'relative',
          zIndex: 2,
          minHeight: 'calc(100vh - 130px)',
          padding: '28px 20px 48px',
          boxSizing: 'border-box',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}>
          {/* Handle bar */}
          <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '0 auto 24px' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>SiapKerja.id</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Platform Karir</div>
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Selamat datang kembali 👋' : 'Buat akun baru ✨'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            {mode === 'login' ? 'Masuk ke akun SiapKerja.id kamu' : 'Bergabung dengan ribuan pengguna SiapKerja.id'}
          </p>

          {/* Tab */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '4px', marginBottom: '18px' }}>
            {[{ id: 'login', label: 'Masuk' }, { id: 'register', label: 'Daftar' }].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setError(''); setSuccess(''); }} style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '14px',
                fontWeight: mode === m.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: mode === m.id ? '#fff' : 'transparent',
                color: mode === m.id ? '#0F172A' : '#64748B',
                boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>{m.label}</button>
            ))}
          </div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              ⚠️ {error}
            </motion.div>}
            {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '11px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', color: '#16A34A', fontSize: '13px', marginBottom: '14px' }}>
              ✓ {success}
            </motion.div>}
          </AnimatePresence>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Daftar sebagai</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ value: 'user', label: '👤 Pencari Kerja' }, { value: 'company', label: '🏢 Perusahaan' }].map(t => (
                      <button type="button" key={t.value} onClick={() => setForm({ ...form, account_type: t.value })} style={{
                        flex: 1, padding: '10px 8px', borderRadius: '8px',
                        border: `2px solid ${form.account_type === t.value ? '#2563EB' : '#E2E8F0'}`,
                        background: form.account_type === t.value ? '#EFF6FF' : '#fff',
                        color: form.account_type === t.value ? '#2563EB' : '#64748B',
                        fontSize: '13px', fontWeight: form.account_type === t.value ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}>{t.label}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {form.account_type === 'company' ? 'Nama Penanggung Jawab' : 'Nama Lengkap'}
                  </label>
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

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                width: '100%', padding: '14px', borderRadius: '9px', border: 'none',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff', fontWeight: 700, fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px', fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                transition: 'all 0.15s',
              }}>
              {loading ? 'Memproses...' : mode === 'login' ? '→ Masuk' : '✨ Buat Akun'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </button>
          </p>

          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
              Dengan masuk, kamu menyetujui syarat & ketentuan SiapKerja.id
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: layout 2 kolom seperti semula
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', background: '#F8FAFC' }}>

      {/* Left Panel */}
      <motion.div
        initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        style={{
          flex: 1,
          background: 'linear-gradient(145deg, rgba(30,58,138,0.85) 0%, rgba(37,99,235,0.76) 55%, rgba(59,130,246,0.70) 100%), url(/Hana_2.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '60px', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>

        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>SiapKerja.id</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Platform Karir</div>
            </div>
          </div>

          <h1 style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-0.03em' }}>
            Platform karir<br />untuk semua
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '40px' }}>
            Satu ekosistem untuk pencari kerja, perusahaan, mentor, dan admin.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roles.map((r, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.08 }}
                style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '1px' }}>{r.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      {FormPanel}
    </div>
  );
}