'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../lib/userContext';
import { useTheme } from '../lib/themeContext';
import Sidebar from './components/Sidebar';

export default function Home() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [trayek, setTrayek] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [certCount, setCertCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: tr }, { data: ut }, { count: cc }, { count: ac }] = await Promise.all([
        supabase.from('trayek').select('*').order('id', { ascending: false }),
        supabase.from('trainings').select('*'),
        supabase.from('user_trainings').select('*, trainings(title)').eq('user_id', user.id),
        supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setTrayek(t || []); setTrainings(tr || []); setUserTrainings(ut || []);
      setCertCount(cc || 0); setAppliedCount(ac || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = trayek.filter(d => {
    const f = filter === 'semua' || d.jenis === filter;
    const s = !search || d.tujuan?.toLowerCase().includes(search.toLowerCase()) || d.asal?.toLowerCase().includes(search.toLowerCase());
    return f && s;
  });

  const initials = n => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) || '?';

  const jenisColor = (j) => {
    if (j === 'Remote') return { bg: 'var(--brand-50)', color: 'var(--brand-700)', border: 'var(--brand-200)' };
    if (j === 'Full Time') return { bg: 'var(--success-50)', color: 'var(--success-600)', border: '#BBF7D0' };
    return { bg: 'var(--warning-50)', color: 'var(--warning-600)', border: '#FDE68A' };
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 240px)' }}>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px', letterSpacing: '0.02em' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Selamat datang, {user.full_name?.split(' ')[0]}! 👋
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/interview" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', background: isDark ? 'rgba(37,99,235,0.15)' : 'var(--brand-50)', border: '1px solid var(--border-brand)', color: 'var(--text-brand)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              🤖 Interview AI
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/profil')}
              style={{ width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', border: '2px solid var(--border-brand)', flexShrink: 0 }}>
              {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>{initials(user.full_name)}</div>}
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Lowongan', value: trayek.length, icon: '💼', color: 'var(--brand-600)', bg: 'var(--brand-50)', link: '/trayek' },
            { label: 'Pelatihan Aktif', value: `${userTrainings.length}/${trainings.length}`, icon: '📚', color: 'var(--success-600)', bg: 'var(--success-50)', link: '/pelatihan' },
            { label: 'Sertifikat', value: certCount, icon: '🏆', color: 'var(--warning-600)', bg: 'var(--warning-50)', link: '/sertifikat' },
            { label: 'Lamaran', value: appliedCount, icon: '📋', color: '#7C3AED', bg: '#F5F3FF', link: '/lamaran' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <Link href={s.link} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -3, boxShadow: 'var(--shadow-lg)' }}
                  style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '11px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <motion.div key={s.value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '24px', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{loading ? '—' : s.value}</motion.div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Hero Banner */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              style={{ background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 60%, var(--brand-500) 100%)', borderRadius: '14px', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative */}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-20px', right: '80px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px', padding: '4px 12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>SDGs 8 — Pekerjaan Layak</span>
                </div>
                <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em', lineHeight: 1.25 }}>Tingkatkan kariermu hari ini</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>Temukan lowongan yang sesuai dan latih skill interview dengan AI.</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/trayek" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', color: 'var(--brand-700)', fontWeight: 700, fontSize: '13px', padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      💼 Cari Lowongan
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Link href="/interview" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: '13px', padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)' }}>
                      🤖 Simulasi Interview
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Job listings */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Lowongan Terbaru</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{filtered.length} lowongan tersedia</p>
                </div>
                <Link href="/trayek" style={{ fontSize: '12px', color: 'var(--text-brand)', fontWeight: 600, textDecoration: 'none' }}>Lihat semua →</Link>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '7px 12px' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari posisi atau lokasi..."
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['semua', 'Full Time', 'Remote', 'Setengah Hari'].map(f => (
                    <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)} style={{
                      padding: '6px 12px', borderRadius: '20px', border: `1px solid ${filter === f ? 'var(--brand-400)' : 'var(--border-default)'}`,
                      fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)',
                      background: filter === f ? 'var(--surface-brand)' : 'transparent',
                      color: filter === f ? 'var(--text-brand)' : 'var(--text-secondary)',
                    }}>{f}</motion.button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '4px 0' }}>
                {loading ? (
                  <div style={{ padding: '20px' }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px' }} />)}
                  </div>
                ) : filtered.slice(0,6).map((item, i) => {
                  const jc = jenisColor(item.jenis);
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px', borderBottom: i < Math.min(filtered.length, 6) - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'var(--text-brand)', flexShrink: 0, border: '1px solid var(--border-brand)' }}>
                        {(item.company || item.tujuan)?.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tujuan}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.company || 'Perusahaan'}</span>
                          {item.asal && <><span style={{ color: 'var(--border-strong)' }}>•</span><span>📍 {item.asal}</span></>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: jc.bg, color: jc.color, border: `1px solid ${jc.border}`, fontWeight: 500 }}>{item.jenis || 'Full Time'}</span>
                        <Link href={`/trayek/${item.id}`} style={{ padding: '5px 12px', borderRadius: '7px', border: '1.5px solid var(--brand-400)', color: 'var(--text-brand)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: 'var(--surface-brand)' }}>Lamar</Link>
                      </div>
                    </motion.div>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                    <p style={{ fontSize: '14px' }}>Tidak ada lowongan yang sesuai</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Profile card */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <motion.div whileHover={{ scale: 1.05 }} onClick={() => router.push('/profil')}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', border: '2px solid var(--border-brand)', flexShrink: 0 }}>
                  {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>{initials(user.full_name)}</div>}
                </motion.div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{user.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Kelengkapan Profil</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-brand)' }}>65%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg,var(--brand-500),var(--brand-400))', borderRadius: '3px' }} />
                </div>
              </div>
              <Link href="/profil" style={{ display: 'block', textAlign: 'center', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', background: 'var(--surface-secondary)', transition: 'all var(--transition-base)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Lengkapi Profil →
              </Link>
            </motion.div>

            {/* Training progress */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Pelatihan Aktif</h3>
                <Link href="/pelatihan" style={{ fontSize: '12px', color: 'var(--text-brand)', fontWeight: 600, textDecoration: 'none' }}>Lihat semua</Link>
              </div>
              {userTrainings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>Belum ada pelatihan aktif</p>
                  <Link href="/pelatihan" style={{ fontSize: '12px', color: 'var(--text-brand)', fontWeight: 600, textDecoration: 'none' }}>+ Daftar Pelatihan</Link>
                </div>
              ) : userTrainings.slice(0,3).map((ut, i) => (
                <div key={ut.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{ut.trainings?.title || 'Pelatihan'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: ut.progress >= 100 ? 'var(--text-success)' : 'var(--text-brand)' }}>{ut.progress || 0}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ut.progress || 0}%` }} transition={{ duration: 0.7, delay: 0.4 + i * 0.1 }}
                      style={{ height: '100%', background: ut.progress >= 100 ? 'var(--success-500)' : 'linear-gradient(90deg,var(--brand-500),var(--brand-400))', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Interview AI CTA */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'linear-gradient(135deg, var(--brand-900) 0%, #1E293B 100%)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ width: '44px', height: '44px', background: 'rgba(37,99,235,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid rgba(37,99,235,0.4)' }}>🤖</motion.div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em' }}>Interview AI</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '2px' }}>Powered by Groq</div>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', lineHeight: 1.6, marginBottom: '14px' }}>Latih wawancara dengan AI dan dapatkan feedback personal secara instan.</p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link href="/interview" style={{ display: 'block', textAlign: 'center', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', padding: '10px', borderRadius: '9px', textDecoration: 'none', boxShadow: 'var(--shadow-brand)' }}>
                  🚀 Mulai Simulasi
                </Link>
              </motion.div>
            </motion.div>

            {/* Quick links */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Akses Cepat</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { href: '/lamaran', icon: '📋', label: 'Lamaranku' },
                  { href: '/mentoring', icon: '🎤', label: 'Mentoring' },
                  { href: '/sertifikat', icon: '🏆', label: 'Sertifikat' },
                  { href: '/notifikasi', icon: '🔔', label: 'Notifikasi' },
                ].map(item => (
                  <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '9px', textDecoration: 'none', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, background: 'var(--surface-secondary)', transition: 'all var(--transition-base)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-brand)'; e.currentTarget.style.color = 'var(--text-brand)'; e.currentTarget.style.borderColor = 'var(--border-brand)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                    <span style={{ fontSize: '15px' }}>{item.icon}</span>{item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
