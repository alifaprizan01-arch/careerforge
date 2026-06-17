'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState('');
  const [notifForm, setNotifForm] = useState({ title: '', message: '', targetUserId: null });
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchUsers(); }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*, applications(count), user_trainings(count)').order('id', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const updateRole = async (userId, role) => {
    setUpdating(userId);
    await supabase.from('users').update({ role }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    setUpdating(null);
    setMsg(`Role berhasil diperbarui!`);
    setTimeout(() => setMsg(''), 3000);
  };

  const sendNotif = async () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) { setMsg('Judul dan pesan wajib diisi.'); return; }
    setSendingNotif(true);
    try {
      if (notifForm.targetUserId) {
        await supabase.from('notifications').insert([{ user_id: notifForm.targetUserId, title: notifForm.title, message: notifForm.message, type: 'info', is_read: false }]);
        setMsg('Notifikasi terkirim ke user!');
      } else {
        const notifs = users.map(u => ({ user_id: u.id, title: notifForm.title, message: notifForm.message, type: 'info', is_read: false }));
        await supabase.from('notifications').insert(notifs);
        setMsg(`Notifikasi broadcast ke ${users.length} user!`);
      }
      setShowNotifModal(false);
      setNotifForm({ title: '', message: '', targetUserId: null });
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setSendingNotif(false); }
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF',
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };
  const filtered = users.filter(u => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  if (!loaded || !user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: isDark ? 'linear-gradient(135deg,#172554,#1E3A8A)' : 'linear-gradient(135deg,#1E40AF,#2563EB)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>🛡️ ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola User</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setNotifForm({ title: '', message: '', targetUserId: null }); setShowNotifModal(true); }}
          style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          📢 Broadcast Notifikasi
        </motion.button>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: c.blueLight, border: `1px solid ${c.blue}44`, borderRadius: '8px', color: c.blue, marginBottom: '20px', fontSize: '13px' }}>{msg}</motion.div>}

          {/* Notif Modal */}
          {showNotifModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '460px', width: '100%' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '16px' }}>
                  {notifForm.targetUserId ? '📩 Kirim ke User' : '📢 Broadcast ke Semua User'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Judul</label>
                    <input style={inputStyle} value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} placeholder="Contoh: Lowongan Baru Tersedia" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Pesan</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} value={notifForm.message} onChange={e => setNotifForm({ ...notifForm, message: e.target.value })} placeholder="Isi pesan notifikasi..." />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowNotifModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer' }}>Batal</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={sendNotif} disabled={sendingNotif} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: c.blue, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    {sendingNotif ? 'Mengirim...' : '📤 Kirim'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '20px' }}>
            <span style={{ color: c.muted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.inputText }} />
            <span style={{ fontSize: '13px', color: c.muted }}>{filtered.length} user</span>
          </div>

          <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'grid', gridTemplateColumns: '1fr 180px 80px 80px 150px', gap: '12px' }}>
              {['User', 'Email', 'Lamaran', 'Role', 'Aksi'].map(h => (
                <div key={h} style={{ fontSize: '12px', fontWeight: 600, color: c.muted, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: c.muted }}>Memuat...</div> :
            filtered.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                style={{ padding: '12px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${c.border}` : 'none', display: 'grid', gridTemplateColumns: '1fr 180px 80px 80px 150px', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {u.avatar_url ? <img src={u.avatar_url} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '11px', flexShrink: 0 }}>
                      {u.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                    </div>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: c.text, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name}</div>
                    {u.job_title && <div style={{ fontSize: '11px', color: c.muted }}>{u.job_title}</div>}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                <div style={{ fontSize: '13px', color: c.text, textAlign: 'center' }}>{u.applications?.length || 0}</div>
                <div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: u.role === 'admin' ? c.blueLight : isDark ? '#334155' : '#F1F5F9', color: u.role === 'admin' ? c.blue : c.muted, fontWeight: 500 }}>{u.role || 'user'}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {u.id !== user.id && (
                    <motion.button whileTap={{ scale: 0.95 }} disabled={updating === u.id} onClick={() => updateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                      style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${c.blue}`, background: 'transparent', color: c.blue, fontSize: '11px', cursor: 'pointer' }}>
                      {updating === u.id ? '...' : u.role === 'admin' ? '→ User' : '→ Admin'}
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setNotifForm({ title: '', message: '', targetUserId: u.id }); setShowNotifModal(true); }}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '11px', cursor: 'pointer' }}>
                    📩
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
