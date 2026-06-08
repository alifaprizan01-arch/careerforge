'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import styles from './auth.module.css';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  // Simple hash function (sama seperti pattern hashed_pw_X di DB-mu)
  // Di production, gunakan bcrypt atau Supabase Auth
  const hashPassword = (password) => {
    // Placeholder — ganti dengan logika hash sesungguhnya
    return `hashed_${password}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', form.email)
        .single();

      if (dbError || !data) {
        setError('Email tidak ditemukan.');
        return;
      }

      const hashedInput = hashPassword(form.password);
      if (data.password_hash !== hashedInput) {
        setError('Password salah.');
        return;
      }

      // Simpan session sederhana di localStorage
      localStorage.setItem('careerforge_user', JSON.stringify({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
      }));

      setSuccess(`Selamat datang, ${data.full_name}!`);
      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.full_name.trim()) {
      setError('Nama lengkap wajib diisi.');
      setLoading(false);
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Password dan konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      // Cek apakah email sudah terdaftar
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', form.email)
        .single();

      if (existing) {
        setError('Email sudah terdaftar.');
        return;
      }

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{
          full_name: form.full_name,
          email: form.email,
          password_hash: hashPassword(form.password),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess('Akun berhasil dibuat! Silakan login.');
      setForm({ full_name: '', email: '', password: '', confirm_password: '' });
      setTimeout(() => setMode('login'), 1500);
    } catch (err) {
      setError('Gagal mendaftar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background decoration */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgGrid} />

      <div className={styles.card}>
        {/* Logo / Brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 24L14 4L24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 17H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className={styles.brandName}>CareerForge</span>
        </div>

        {/* Tab Switch */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            Masuk
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          >
            Daftar
          </button>
          <div className={`${styles.tabSlider} ${mode === 'register' ? styles.tabSliderRight : ''}`} />
        </div>

        {/* Heading */}
        <div className={styles.heading}>
          <h1 className={styles.title}>
            {mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Masuk untuk melanjutkan perjalanan kariermu'
              : 'Bergabung dan mulai tempa kariermu bersama kami'}
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div className={styles.alertError}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className={styles.alertSuccess}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.28 5.28a.75.75 0 00-1.06-1.06L7 8.44 5.78 7.22a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.75-3.75z"/>
            </svg>
            {success}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={mode === 'login' ? handleLogin : handleRegister}
          className={styles.form}
        >
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Nama Lengkap</label>
              <input
                className={styles.input}
                type="text"
                name="full_name"
                placeholder="Contoh: Budi Santoso"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              name="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              name="password"
              placeholder={mode === 'register' ? 'Minimal 6 karakter' : '••••••••'}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Konfirmasi Password</label>
              <input
                className={styles.input}
                type="password"
                name="confirm_password"
                placeholder="Ulangi password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : mode === 'login' ? 'Masuk' : 'Buat Akun'}
          </button>
        </form>

        {/* Footer switch */}
        <p className={styles.switchText}>
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
          {' '}
          <button
            className={styles.switchBtn}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
          >
            {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
          </button>
        </p>
      </div>
    </div>
  );
}
