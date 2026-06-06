'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function NotifikasiPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const unreadCount = notifs.filter(n => !n.is_read).length;
  const typeIcon = (type) => type === 'job' ? '💼' : type === 'training' ? '📚' : '🔔';

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Notifikasi
              {unreadCount > 0 && (
                <span style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: '20px', fontSize: '12px', padding: '3px 10px', fontWeight: 600 }}>
                  {unreadCount} baru
                </span>
              )}
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Informasi dan update terbaru untukmu</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
              Tandai semua dibaca
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>Memuat notifikasi...</p>
        ) : notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Belum ada notifikasi.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {notifs.map((n, i) => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '16px 20px', cursor: n.is_read ? 'default' : 'pointer',
                background: n.is_read ? '#fff' : '#EFF6FF',
                borderBottom: i < notifs.length - 1 ? '1px solid #F1F5F9' : 'none',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: n.is_read ? '#F1F5F9' : '#DBEAFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>{typeIcon(n.type)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: n.is_read ? 400 : 600, color: '#0F172A', fontSize: '14px' }}>
                    {n.title || n.message}
                  </p>
                  {n.title && n.message && (
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748B' }}>{n.message}</p>
                  )}
                  <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString('id-ID') : ''}
                  </p>
                </div>
                {!n.is_read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: '6px' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
