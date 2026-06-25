'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

function useIsTablet(min = 768, max = 1100) {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= min && w < max);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [min, max]);
  return isTablet;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [stats, setStats] = useState({ users: 0, trayek: 0, applications: 0, trainings: 0, mentors: 0, notifications: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'admin') { router.push('/'); return; }
    if (user?.role === 'admin') fetchAll();
  }, [loaded, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ count: uc }, { count: tc }, { count: ac }, { count: trc }, { count: mc }, { count: nc }, { data: apps }, { data: users }, { data: allU }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('trayek').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('trainings').select('*', { count: 'exact', head: true }),
        supabase.from('mentors').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*, users(full_name), trayek(tujuan)').order('applied_at', { ascending: false }).limit(6),
        supabase.from('users').select('*').order('id', { ascending: false }).limit(6),
        supabase.from('users').select('id, full_name, email'),
      ]);
      setStats({ users: uc||0, trayek: tc||0, applications: ac||0, trainings: trc||0, mentors: mc||0, notifications: nc||0 });
      setRecentApps(apps || []); setRecentUsers(users || []); setAllUsers(allU || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendBroadcast = async () => {
    if (!broadcast.title.trim() || !broadcast.message.trim()) { setMsg('Judul dan pesan wajib diisi.'); return; }
    setSending(true);
    try {
      const notifs = allUsers.map(u => ({ user_id: u.id, title: broadcast.title, message: broadcast.message, type: 'info', is_read: false }));
      await supabase.from('notifications').insert(notifs);
      setMsg(`✓ Notifikasi terkirim ke ${allUsers.length} user!`);
      setShowBroadcast(false); setBroadcast({ title: '', message: '' });
      fetchAll(); setTimeout(() => setMsg(''), 4000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setSending(false); }
  };

  const statusBadge = s => {
    const map = { 'Diterima': 'badge-green', 'Ditolak': 'badge-red', 'Diproses': 'badge-blue', 'Menunggu': 'badge-yellow' };
    return map[s] || 'badge-gray';
  };

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#fff';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const subtle = isDark ? '#334155' : '#F1F5F9';

  if (!loaded || !user || user.role !== 'admin') return null;

  const menuCards = [
    { href: '/admin/lowongan', icon: '💼', label: 'Kelola Lowongan', value: stats.trayek, unit: 'lowongan', color: isDark ? '#CBD5E1' : '#475569', bg: isDark ? 'rgba(71,85,105,0.15)' : '#F1F5F9' },
    { href: '/admin/users', icon: '👥', label: 'Kelola User', value: stats.users, unit: 'user', color: isDark ? '#4ADE80' : '#16A34A', bg: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4' },
    { href: '/admin/lamaran', icon: '📋', label: 'Kelola Lamaran', value: stats.applications, unit: 'lamaran', color: isDark ? '#C084FC' : '#7C3AED', bg: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF' },
    { href: '/admin/pelatihan', icon: '🎓', label: 'Kelola Pelatihan', value: stats?.trainings || 0, unit: 'pelatihan', color: isDark ? '#4ADE80' : '#16A34A', bg: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4' },
    { href: '/admin/mentor', icon: '🎤', label: 'Kelola Mentor', value: stats.mentors, unit: 'mentor', color: isDark ? '#F87171' : '#DC2626', bg: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2' },
    { href: '/admin/banner', icon: '🖼️', label: 'Kelola Banner', value: null, unit: 'banner promo', color: isDark ? '#60A5FA' : '#2563EB', bg: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' },
    { href: '/admin/pesan-masuk', icon: '📥', label: 'Pesan Masuk', value: null, unit: 'kontak & karier', color: isDark ? '#38BDF8' : '#0EA5E9', bg: isDark ? 'rgba(14,165,233,0.15)' : '#F0F9FF' },
    { href: '/admin/testimoni', icon: '💬', label: 'Kelola Testimoni', value: null, unit: 'cerita alumni', color: isDark ? '#34D399' : '#059669', bg: isDark ? 'rgba(5,150,105,0.15)' : '#ECFDF5' },
    { icon: '📢', label: 'Broadcast Notif', value: stats.notifications, unit: 'terkirim', color: isDark ? '#FBBF24' : '#D97706', bg: isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB', onClick: () => setShowBroadcast(true) },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: isDark ? '#1E293B' : '#fff', borderBottom: `1px solid ${border}`, padding: isMobile ? '0 16px' : '0 32px', display: 'flex', alignItems: 'center', height: '64px', gap: isMobile ? '8px' : '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexWrap: 'nowrap', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto', flexShrink: 0 }}>
          <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: text, letterSpacing: '-0.01em' }}>SiapKerja.id</div>
            <div style={{ fontSize: '10px', color: muted, fontWeight: 500, letterSpacing: '0.04em' }}>ADMIN PANEL</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={toggleTheme} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${border}`, background: subtle, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          {!isMobile && <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: '#475569', color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>SUPERADMIN</span>}
          {!isMobile && <span style={{ fontSize: '13px', color: text, fontWeight: 500 }}>{user.full_name}</span>}
          <Link href="/" style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${border}`, color: muted, fontSize: '12px', textDecoration: 'none', fontWeight: 500, background: subtle, whiteSpace: 'nowrap' }}>← {isMobile ? 'App' : 'App Utama'}</Link>
        </div>
      </div>

      <main style={{ padding: isMobile ? '20px 14px' : '32px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: text, letterSpacing: '-0.02em', marginBottom: '4px' }}>Dashboard Admin</h1>
          <p style={{ fontSize: '14px', color: muted }}>Kelola seluruh platform SiapKerja.id dari sini</p>
        </div>

        {msg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', border: `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}`, borderRadius: '8px', color: isDark ? '#4ADE80' : '#16A34A', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</motion.div>}

        {/* Stats */}
        <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total User', value: stats.users, icon: '👥', color: isDark ? '#CBD5E1' : '#475569', onClick: () => router.push('/admin/users') },
            { label: 'Lowongan', value: stats.trayek, icon: '💼', color: isDark ? '#4ADE80' : '#16A34A', onClick: () => router.push('/admin/lowongan') },
            { label: 'Lamaran', value: stats.applications, icon: '📋', color: isDark ? '#C084FC' : '#7C3AED', onClick: () => router.push('/admin/lamaran') },
            { label: 'Pelatihan', value: stats.trainings, icon: '🎓', color: isDark ? '#FBBF24' : '#D97706', onClick: () => router.push('/admin/pelatihan') },
            { label: 'Mentor', value: stats.mentors, icon: '🎤', color: isDark ? '#F87171' : '#DC2626', onClick: () => router.push('/admin/mentor') },
            { label: 'Notifikasi', value: stats.notifications, icon: '🔔', color: muted, onClick: () => setShowBroadcast(true) },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }} onClick={s.onClick}
              style={{ background: card, borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', borderColor: border, borderTopWidth: '3px', borderTopColor: s.color, padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Menu Cards */}
        <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {menuCards.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              onClick={() => item.onClick ? item.onClick() : router.push(item.href)}
              style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, padding: '22px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '4px', letterSpacing: '-0.01em' }}>{item.label}</h3>
              <p style={{ fontSize: '13px', color: item.color, fontWeight: 600, margin: 0 }}>{loading ? '—' : (item.value ?? 'Atur')} {item.unit}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent tables */}
        <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 1fr', gap: '20px' }}>
          {/* Recent Applications */}
          <div style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text, letterSpacing: '-0.01em' }}>Lamaran Terbaru</h3>
              <Link href="/admin/lamaran" style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#475569', fontWeight: 600, textDecoration: 'none' }}>Lihat semua →</Link>
            </div>
            {loading ? <div style={{ padding: '20px' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '48px', marginBottom: '8px' }} />)}</div> :
            recentApps.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: muted, fontSize: '13px' }}>Belum ada lamaran.</div> :
            recentApps.map((app, i) => (
              <div key={app.id} onClick={() => router.push('/admin/lamaran')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: i < recentApps.length - 1 ? `1px solid ${border}` : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = subtle}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: text }}>{app.users?.full_name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: muted }}>→ {app.trayek?.tujuan || 'Posisi'}</div>
                </div>
                <span className={`badge ${statusBadge(app.status)}`}>{app.status}</span>
              </div>
            ))}
          </div>

          {/* Recent Users */}
          <div style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text, letterSpacing: '-0.01em' }}>User Terbaru</h3>
              <Link href="/admin/users" style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#475569', fontWeight: 600, textDecoration: 'none' }}>Lihat semua →</Link>
            </div>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: muted, fontSize: '13px' }}>🔍</span>
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Cari user (nama atau email)..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: text, fontFamily: 'inherit' }} />
              {userSearch && <button onClick={() => setUserSearch('')} style={{ border: 'none', background: 'transparent', color: muted, cursor: 'pointer', fontSize: '12px' }}>✕</button>}
            </div>
            {recentUsers.filter(u => !userSearch || (u.full_name||'').toLowerCase().includes(userSearch.toLowerCase()) || (u.email||'').toLowerCase().includes(userSearch.toLowerCase())).map((u, i, arr) => (
              <div key={u.id} onClick={() => router.push('/admin/users')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = subtle}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {u.avatar_url ? <img src={u.avatar_url} alt={u.full_name || 'Foto pengguna'} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#475569,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>
                    {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                  </div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                  <div style={{ fontSize: '11px', color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'company' ? 'badge-purple' : u.role === 'mentor' ? 'badge-green' : 'badge-gray'}`}>{u.role || 'user'}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ background: card, borderRadius: '16px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${border}` }}>
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📢</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: text, marginBottom: '4px', letterSpacing: '-0.02em' }}>Broadcast Notifikasi</h3>
                <p style={{ fontSize: '13px', color: muted }}>Kirim ke <strong style={{ color: isDark ? '#CBD5E1' : '#475569' }}>{allUsers.length} user</strong> sekaligus</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Judul</label>
                  <input value={broadcast.title} onChange={e => setBroadcast({ ...broadcast, title: e.target.value })} placeholder="Contoh: Info Lowongan Baru!"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${border}`, fontSize: '14px', outline: 'none', background: isDark ? '#0F172A' : '#F8FAFC', color: text, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: muted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pesan</label>
                  <textarea value={broadcast.message} onChange={e => setBroadcast({ ...broadcast, message: e.target.value })} placeholder="Isi pesan yang akan diterima semua user..." rows={4}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${border}`, fontSize: '14px', outline: 'none', resize: 'vertical', background: isDark ? '#0F172A' : '#F8FAFC', color: text, fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowBroadcast(false)} style={{ flex: 1, padding: '11px', borderRadius: '9px', border: `1px solid ${border}`, background: 'transparent', color: muted, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Batal</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={sendBroadcast} disabled={sending}
                  style={{ flex: 2, padding: '11px', borderRadius: '9px', border: 'none', background: sending ? '#93C5FD' : 'linear-gradient(135deg,#475569,#334155)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(71,85,105,0.3)' }}>
                  {sending ? 'Mengirim...' : `📤 Kirim ke ${allUsers.length} User`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}