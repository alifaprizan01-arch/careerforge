'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function NotifikasiPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchNotifs(); }, [user]);

  const fetchNotifs = async () => {
    setLoading(true);
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotifs(data || []);
    setLoading(false);
  };

  const markRead = async id => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async id => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const typeConfig = {
    job: { icon: '💼', color: 'var(--text-brand)', bg: 'var(--surface-brand)' },
    training: { icon: '🎓', color: 'var(--text-success)', bg: 'var(--success-50)' },
    mentoring: { icon: '🎤', color: '#7C3AED', bg: '#F5F3FF' },
    interview: { icon: '🤖', color: 'var(--text-brand)', bg: 'var(--surface-brand)' },
    info: { icon: '📢', color: 'var(--text-warning)', bg: 'var(--warning-50)' },
  };

  const unread = notifs.filter(n => !n.is_read).length;
  const filtered = filter === 'semua' ? notifs : filter === 'belum' ? notifs.filter(n => !n.is_read) : notifs.filter(n => n.is_read);

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: '800px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Notifikasi
              {unread > 0 && <span className="badge badge-blue">{unread} baru</span>}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Update terbaru untuk kamu</p>
          </div>
          {unread > 0 && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={markAllRead}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              ✓ Tandai semua dibaca
            </motion.button>
          )}
        </motion.div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '4px', marginBottom: '20px', boxShadow: 'var(--shadow-xs)' }}>
          {[{ id: 'semua', label: `Semua (${notifs.length})` }, { id: 'belum', label: `Belum Dibaca (${unread})` }, { id: 'sudah', label: 'Sudah Dibaca' }].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: filter === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              background: filter === tab.id ? 'var(--brand-600)' : 'transparent',
              color: filter === tab.id ? '#fff' : 'var(--text-secondary)',
            }}>{tab.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '76px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.4 }}>🔔</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Tidak ada notifikasi</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Semua notifikasi akan muncul di sini</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {filtered.map((n, i) => {
              const tc = typeConfig[n.type] || typeConfig.info;
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 20px', cursor: n.is_read ? 'default' : 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', background: n.is_read ? 'transparent' : 'var(--surface-brand)', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--surface-brand)'; }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                    {tc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: n.is_read ? 500 : 700, color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.4 }}>{n.title || n.message}</p>
                    {n.title && n.message && <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>}
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-600)', flexShrink: 0 }} />}
                    <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '16px', padding: '2px', lineHeight: 1, borderRadius: '4px', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-error)'; e.currentTarget.style.background = 'var(--error-50)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none'; }}>×</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
