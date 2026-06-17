'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition, { StaggerItem } from '../../components/PageTransition';

export default function AdminLamaranPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('applications').select('*, users(full_name, email, avatar_url), trayek(tujuan, asal, company)').order('applied_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      // Kirim notifikasi otomatis ke user
      const app = applications.find(a => a.id === id);
      if (app) {
        const msg = status === 'Diterima' ? 'Selamat! Lamaranmu untuk posisi ' + app.trayek?.tujuan + ' telah DITERIMA!' : status === 'Ditolak' ? 'Lamaranmu untuk posisi ' + app.trayek?.tujuan + ' tidak dilanjutkan.' : 'Status lamaranmu untuk ' + app.trayek?.tujuan + ' diperbarui menjadi: ' + status;
        await supabase.from('notifications').insert([{ user_id: app.user_id, title: 'Update Lamaran', message: msg, type: 'job', is_read: false }]);
      }
      setMsg('Status berhasil diperbarui & notifikasi terkirim!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setUpdating(null); }
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF',
  };

  const statusConfig = {
    'Menunggu': { bg: isDark ? '#451A03' : '#FFFBEB', color: isDark ? '#FCD34D' : '#D97706', border: isDark ? '#78350F' : '#FDE68A' },
    'Diproses': { bg: c.blueLight, color: c.blue, border: isDark ? '#1D4ED8' : '#BFDBFE' },
    'Diterima': { bg: isDark ? '#14532D' : '#F0FDF4', color: isDark ? '#4ADE80' : '#16A34A', border: isDark ? '#166534' : '#BBF7D0' },
    'Ditolak':  { bg: isDark ? '#450A0A' : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626', border: isDark ? '#7F1D1D' : '#FECACA' },
  };

  const statuses = ['Menunggu', 'Diproses', 'Diterima', 'Ditolak'];
  const filtered = applications.filter(a => {
    const f = filter === 'semua' || a.status === filter;
    const s = !search || a.users?.full_name?.toLowerCase().includes(search.toLowerCase()) || a.trayek?.tujuan?.toLowerCase().includes(search.toLowerCase());
    return f && s;
  });

  if (!loaded || !user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: isDark ? 'linear-gradient(135deg,#172554,#1E3A8A)' : 'linear-gradient(135deg,#1E40AF,#2563EB)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>🛡️ ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Lamaran</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{applications.length} total lamaran</span>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: c.blueLight, border: `1px solid ${c.blue}44`, borderRadius: '8px', color: c.blue, marginBottom: '20px', fontSize: '13px' }}>{msg}</motion.div>}

          {/* Stats + Filter */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '9px 14px' }}>
              <span style={{ color: c.muted }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama user atau posisi..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.inputText }} />
            </div>
            {['semua', ...statuses].map(f => {
              const sc = f !== 'semua' ? statusConfig[f] : null;
              const count = f === 'semua' ? applications.length : applications.filter(a => a.status === f).length;
              return (
                <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)} style={{
                  padding: '7px 14px', borderRadius: '20px', border: `1px solid ${filter === f ? (sc?.color || c.blue) : c.border}`,
                  background: filter === f ? (sc?.bg || c.blueLight) : 'transparent',
                  color: filter === f ? (sc?.color || c.blue) : c.muted, fontSize: '13px', cursor: 'pointer', fontWeight: 500,
                }}>{f === 'semua' ? `Semua (${count})` : `${f} (${count})`}</motion.button>
              );
            })}
          </div>

          {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
          filtered.length === 0 ? <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '60px', textAlign: 'center', color: c.muted }}>Tidak ada lamaran.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((app, i) => {
                const sc = statusConfig[app.status] || statusConfig['Menunggu'];
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      {app.users?.avatar_url ? <img src={app.users.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>
                          {app.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                        </div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: c.text, fontSize: '14px' }}>{app.users?.full_name || 'User'}</div>
                            <div style={{ fontSize: '12px', color: c.muted }}>{app.users?.email} → <strong>{app.trayek?.tujuan}</strong> di {app.trayek?.company || app.trayek?.asal}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 500 }}>{app.status}</span>
                            <span style={{ fontSize: '11px', color: c.muted }}>{new Date(app.applied_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                        {app.cover_letter && <p style={{ fontSize: '12px', color: c.muted, marginBottom: '12px', lineHeight: 1.5 }}>{app.cover_letter.slice(0,150)}...</p>}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: c.muted, alignSelf: 'center' }}>Ubah status:</span>
                          {statuses.map(s => {
                            const ss = statusConfig[s];
                            const isActive = app.status === s;
                            return (
                              <motion.button key={s} whileTap={{ scale: 0.95 }} disabled={isActive || updating === app.id} onClick={() => updateStatus(app.id, s)}
                                style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${ss.border}`, background: isActive ? ss.bg : 'transparent', color: ss.color, fontSize: '12px', cursor: isActive ? 'default' : 'pointer', fontWeight: isActive ? 600 : 400, opacity: updating === app.id ? 0.5 : 1 }}>
                                {updating === app.id ? '...' : s}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </PageTransition>
      </main>
    </div>
  );
}