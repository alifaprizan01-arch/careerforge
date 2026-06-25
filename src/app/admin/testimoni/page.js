'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';

const FILTERS = [
  { id: 'menunggu', label: 'Menunggu' },
  { id: 'tayang', label: 'Tayang' },
  { id: 'semua', label: 'Semua' },
];

export default function AdminTestimoniPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('menunggu');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchRows(); }, [user]);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const setActive = async (id, active) => {
    const { error } = await supabase.from('testimonials').update({ active }).eq('id', id);
    if (error) flash('Gagal: ' + error.message);
    else { setRows(prev => prev.map(r => r.id === id ? { ...r, active } : r)); flash(active ? 'Testimoni disetujui & tayang.' : 'Testimoni disembunyikan.'); }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) flash('Gagal menghapus: ' + error.message);
    else { setRows(prev => prev.filter(r => r.id !== id)); flash('Testimoni dihapus.'); }
    setDeleteConfirm(null);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    slate: isDark ? '#94A3B8' : '#475569', slateBg: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
    green: '#16A34A', greenBg: isDark ? 'rgba(22,163,74,0.18)' : '#F0FDF4',
    amber: '#D97706', amberBg: isDark ? 'rgba(217,119,6,0.18)' : '#FFFBEB',
  };

  const fmtDate = (s) => {
    if (!s) return '';
    try { return new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
  };

  if (!loaded || !user || user.role !== 'admin') return null;

  const counts = {
    semua: rows.length,
    menunggu: rows.filter(r => !r.active).length,
    tayang: rows.filter(r => r.active).length,
  };

  const filtered = rows.filter(r => {
    if (filter === 'menunggu' && r.active) return false;
    if (filter === 'tayang' && !r.active) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.role, r.quote].filter(Boolean).some(v => v.toLowerCase().includes(q));
  });

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(15,23,42,0.25)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Testimoni</span>
        </div>
        <button onClick={fetchRows} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: c.card, color: c.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>↻ Muat Ulang</button>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 24px 70px' }}>
        {msg && <div style={{ padding: '12px 16px', background: msg.includes('Gagal') ? (isDark ? '#450A0A' : '#FEF2F2') : c.greenBg, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.green}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.green, marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total', value: counts.semua, icon: '💬', color: c.slate },
            { label: 'Menunggu', value: counts.menunggu, icon: '⏳', color: c.amber },
            { label: 'Tayang', value: counts.tayang, icon: '✅', color: c.green },
          ].map((s, i) => (
            <div key={i} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '12px', color: c.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari nama, peran, atau isi testimoni..."
            style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none', fontFamily: 'inherit', fontSize: '14px' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${filter === f.id ? c.slate : c.border}`, background: filter === f.id ? c.slate : c.card, color: filter === f.id ? '#fff' : c.muted }}>
              {f.label} ({counts[f.id]})
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
        filtered.length === 0 ? (
          <div style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '46px', marginBottom: '12px' }}>💬</div>
            <p style={{ color: c.muted }}>{rows.length === 0 ? 'Belum ada testimoni.' : 'Tidak ada testimoni yang cocok.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(r => {
              const badge = r.active
                ? { label: 'Tayang', bg: c.greenBg, color: c.green }
                : { label: 'Menunggu', bg: c.amberBg, color: c.amber };
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: badge.bg, color: badge.color, marginRight: '8px' }}>{badge.label}</span>
                      <span style={{ fontWeight: 700, color: c.text, fontSize: '14px' }}>{r.name}</span>
                      {r.role && <span style={{ fontSize: '12px', color: c.muted }}> · {r.role}</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: c.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(r.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: c.text, lineHeight: 1.6, fontStyle: 'italic', marginBottom: '14px' }}>&ldquo;{r.quote}&rdquo;</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!r.active ? (
                      <button onClick={() => setActive(r.id, true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: c.green, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>✓ Setujui</button>
                    ) : (
                      <button onClick={() => setActive(r.id, false)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Sembunyikan</button>
                    )}
                    <button onClick={() => setDeleteConfirm(r)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Hapus</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '360px', width: '100%' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Hapus testimoni ini?</h3>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '18px' }}>Testimoni dari &quot;{deleteConfirm.name}&quot; akan dihapus permanen.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer' }}>Batal</button>
                <button onClick={() => remove(deleteConfirm.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}