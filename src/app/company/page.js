'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';

export default function CompanyDashboard() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [stats, setStats] = useState({ lowongan: 0, lamaran: 0, menunggu: 0, diterima: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'company') { router.push('/'); return; }
    if (user?.role === 'company') fetchAll();
  }, [loaded, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: jobs } = await supabase.from('trayek').select('*').eq('company_user_id', user.id);
      const jobIds = (jobs || []).map(j => j.id);
      let apps = [];
      if (jobIds.length > 0) {
        const { data } = await supabase.from('applications').select('*, users(full_name, email, avatar_url), trayek(tujuan)').in('trayek_id', jobIds).order('applied_at', { ascending: false });
        apps = data || [];
      }
      setMyJobs(jobs || []); setRecentApps(apps);
      setStats({ lowongan: jobs?.length || 0, lamaran: apps.length, menunggu: apps.filter(a => a.status === 'Menunggu').length, diterima: apps.filter(a => a.status === 'Diterima').length });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#fff';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const subtle = isDark ? '#334155' : '#F1F5F9';

  const statusBadge = s => {
    const map = { 'Diterima': 'badge-green', 'Ditolak': 'badge-red', 'Diproses': 'badge-blue', 'Wawancara': 'badge-purple', 'Menunggu': 'badge-yellow' };
    return map[s] || 'badge-gray';
  };

  if (!loaded || !user || user.role !== 'company') return null;

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: '0 32px', display: 'flex', alignItems: 'center', height: '64px', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px' }}>CF</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: text, letterSpacing: '-0.01em' }}>CareerForge</div>
            <div style={{ fontSize: '10px', color: muted, fontWeight: 500, letterSpacing: '0.04em' }}>PORTAL PERUSAHAAN</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${border}`, background: subtle, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isDark ? '☀️' : '🌙'}</button>
          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: '#7C3AED', color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>PERUSAHAAN</span>
          <span style={{ fontSize: '13px', color: text, fontWeight: 600 }}>{user.company_name || user.full_name}</span>
          <Link href="/" style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${border}`, color: muted, fontSize: '12px', textDecoration: 'none', fontWeight: 500, background: subtle }}>← App Utama</Link>
        </div>
      </div>

      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: text, letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Selamat datang, {user.company_name || user.full_name}! 🏢
          </h1>
          <p style={{ fontSize: '14px', color: muted }}>Kelola lowongan dan pelamar perusahaanmu</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Lowongan Aktif', value: stats.lowongan, icon: '💼', color: '#7C3AED', bg: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF' },
            { label: 'Total Pelamar', value: stats.lamaran, icon: '👥', color: '#2563EB', bg: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' },
            { label: 'Menunggu Review', value: stats.menunggu, icon: '⏳', color: '#D97706', bg: isDark ? 'rgba(217,119,6,0.15)' : '#FFFBEB' },
            { label: 'Diterima', value: stats.diterima, icon: '✅', color: '#16A34A', bg: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
              style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{loading ? '—' : s.value}</div>
                <div style={{ fontSize: '12px', color: muted, marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { href: '/company/lowongan', icon: '➕', label: 'Buat Lowongan', desc: 'Tambah posisi yang dibutuhkan', color: '#7C3AED', bg: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF' },
            { href: '/company/lamaran', icon: '📋', label: 'Kelola Pelamar', desc: `${stats.menunggu} menunggu review`, color: '#2563EB', bg: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' },
            { href: '/company/profil', icon: '⚙️', label: 'Pengaturan Profil', desc: 'Edit info & logo perusahaan', color: '#16A34A', bg: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
              onClick={() => router.push(item.href)}
              style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '4px', letterSpacing: '-0.01em' }}>{item.label}</h3>
              <p style={{ fontSize: '12px', color: muted, margin: 0 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent data */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Recent apps */}
          <div style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text }}>Pelamar Terbaru</h3>
              <Link href="/company/lamaran" style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Lihat semua →</Link>
            </div>
            {loading ? <div style={{ padding: '20px' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px' }} />)}</div> :
            recentApps.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>📭</div>
                <p style={{ fontSize: '13px', color: muted }}>Belum ada pelamar</p>
                <Link href="/company/lowongan" style={{ display: 'inline-block', marginTop: '12px', padding: '7px 16px', borderRadius: '8px', background: '#7C3AED', color: '#fff', fontWeight: 600, fontSize: '12px', textDecoration: 'none' }}>Buat Lowongan</Link>
              </div>
            ) : recentApps.slice(0,5).map((app, i) => (
              <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', borderBottom: i < Math.min(recentApps.length,5)-1 ? `1px solid ${border}` : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = subtle} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {app.users?.avatar_url ? <img src={app.users.avatar_url} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>
                    {app.users?.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                  </div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.users?.full_name}</div>
                  <div style={{ fontSize: '11px', color: muted }}>→ {app.trayek?.tujuan} • {new Date(app.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                </div>
                <span className={`badge ${statusBadge(app.status)}`}>{app.status}</span>
              </div>
            ))}
          </div>

          {/* My jobs */}
          <div style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text }}>Lowongan Aktif</h3>
              <Link href="/company/lowongan" style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Kelola →</Link>
            </div>
            {loading ? <div style={{ padding: '20px' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px' }} />)}</div> :
            myJobs.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>💼</div>
                <p style={{ fontSize: '13px', color: muted }}>Belum ada lowongan</p>
                <Link href="/company/lowongan" style={{ display: 'inline-block', marginTop: '12px', padding: '7px 16px', borderRadius: '8px', background: '#7C3AED', color: '#fff', fontWeight: 600, fontSize: '12px', textDecoration: 'none' }}>+ Buat Lowongan</Link>
              </div>
            ) : myJobs.slice(0,5).map((job, i) => (
              <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', borderBottom: i < Math.min(myJobs.length,5)-1 ? `1px solid ${border}` : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = subtle} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: '#7C3AED', flexShrink: 0 }}>
                  {job.tujuan?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.tujuan}</div>
                  <div style={{ fontSize: '11px', color: muted }}>📍 {job.asal || 'Remote'} • {job.jenis || 'Full Time'}</div>
                </div>
                {job.deadline && <span style={{ fontSize: '11px', color: muted }}>⏰ {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
