'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';

export default function AuthPage() {
  const router = useRouter();
  const { login } = useUser();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });

  const handleChange = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };
  const hashPassword = pw => `hashed_${pw}`;

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data, error: dbErr } = await supabase.from('users').select('*').eq('email', form.email).single();
      if (dbErr || !data) { setError('Email tidak ditemukan.'); return; }
      if (data.password_hash !== hashPassword(form.password)) { setError('Password salah.'); return; }
      login({ id: data.id, full_name: data.full_name, email: data.email });
      setSuccess(`Selamat datang, ${data.full_name}!`);
      setTimeout(() => router.push('/'), 1000);
    } catch { setError('Terjadi kesalahan. Coba lagi.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault(); setLoading(true); setError('');
    if (!form.full_name.trim()) { setError('Nama lengkap wajib diisi.'); setLoading(false); return; }
    if (form.password !== form.confirm_password) { setError('Password tidak cocok.'); setLoading(false); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return; }
    try {
      const { data: ex } = await supabase.from('users').select('id').eq('email', form.email).single();
      if (ex) { setError('Email sudah terdaftar.'); return; }
      const { error: insertErr } = await supabase.from('users')
        .insert([{ full_name: form.full_name, email: form.email, password_hash: hashPassword(form.password) }]);
      if (insertErr) throw insertErr;
      setSuccess('Akun berhasil dibuat! Silakan login.');
      setForm({ full_name: '', email: '', password: '', confirm_password: '' });
      setTimeout(() => setMode('login'), 1500);
    } catch (err) { setError('Gagal mendaftar: ' + err.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none',
    background: '#F8FAFC', color: '#0F172A', transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#F8FAFC',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg,#1E3A5F 0%,#2563EB 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', color: '#fff',
      }}>
        <div style={{ maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>CF</div>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>CareerForge</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>
            Tempa kariermu bersama komunitas profesional
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.8, lineHeight: 1.6, marginBottom: '32px' }}>
            Platform karir berbasis AI untuk membantu kamu menemukan pekerjaan impian, meningkatkan skill, dan terhubung dengan mentor terbaik.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['💼 Ribuan lowongan kerja berkualitas', '🎓 Program pelatihan tersertifikasi', '🎤 Simulasi interview dengan AI'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', opacity: 0.9 }}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
            {mode === 'login' ? 'Masuk ke akun kamu' : 'Buat akun baru'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
            {mode === 'login' ? 'Lanjutkan perjalanan kariermu' : 'Bergabung dengan ribuan profesional'}
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }} style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontSize: '14px',
                fontWeight: mode === m ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0F172A' : '#64748B',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>{m === 'login' ? 'Masuk' : 'Daftar'}</button>
            ))}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', color: '#16A34A', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Nama Lengkap</label>
                <input style={inputStyle} type="text" name="full_name" placeholder="Contoh: Budi Santoso" value={form.full_name} onChange={handleChange} required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Email</label>
              <input style={inputStyle} type="email" name="email" placeholder="nama@email.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Password</label>
              <input style={inputStyle} type="password" name="password" placeholder={mode === 'register' ? 'Minimal 6 karakter' : '••••••••'} value={form.password} onChange={handleChange} required />
            </div>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Konfirmasi Password</label>
                <input style={inputStyle} type="password" name="confirm_password" placeholder="Ulangi password" value={form.confirm_password} onChange={handleChange} required />
              </div>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
              background: loading ? '#93C5FD' : '#2563EB', color: '#fff',
              fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', transition: 'background 0.2s',
            }}>
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
