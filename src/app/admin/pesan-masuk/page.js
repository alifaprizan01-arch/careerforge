'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';

const FILTERS = [
  { id: 'semua', label: 'Semua' },
  { id: 'hubungi', label: 'Pesan Kontak' },
  { id: 'karier', label: 'Lamaran Karier' },
];

export default function AdminPesanMasukPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchRows(); }, [user]);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const remove = async (id) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) flash('Gagal menghapus: ' + error.message);
    else { setRows(prev => prev.filter(r => r.id !== id)); flash('Pesan dihapus.'); }
    setDeleteConfirm(null); setSelected(null);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    slate: isDark ? '#94A3B8' : '#475569', slateBg: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
  };

  const fmtDate = (s) => {
    if (!s) return '';
    try { return new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
  };
  const badgeOf = (type) => type === 'karier'
    ? { label: 'Lamaran Karier', bg: isDark ? 'rgba(124,58,237,0.2)' : '#F5F3FF', color: '#7C3AED' }
    : { label: 'Pesan Kontak', bg: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF', color: '#2563EB' };

  if (!loaded || !user || user.role !== 'admin') return null;

  const counts = {
    semua: rows.length,
    hubungi: rows.filter(r => r.type !== 'karier').length,
    karier: rows.filter(r => r.type === 'karier').length,
  };

  const filtered = rows.filter(r => {
    if (filter === 'karier' && r.type !== 'karier') return false;
    if (filter === 'hubungi' && r.type === 'karier') return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.email, r.message, r.position].filter(Boolean).some(v => v.toLowerCase().includes(q));
  });

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Pesan Masuk</span>
        </div>
        <button onClick={fetchRows} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: c.card, color: c.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>↻ Muat Ulang</button>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 24px 70px' }}>
        {msg && <div style={{ padding: '12px 16px', background: msg.includes('Gagal') ? (isDark ? '#450A0A' : '#FEF2F2') : c.slateBg, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.slate}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.slate, marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Total Pesan', value: counts.semua, icon: '📥', color: c.slate },
            { label: 'Pesan Kontak', value: counts.hubungi, icon: '✉️', color: '#2563EB' },
            { label: 'Lamaran Karier', value: counts.karier, icon: '💼', color: '#7C3AED' },
          ].map((s, i) => (
            <div key={i} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '12px', color: c.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari nama, email, pesan, atau posisi..."
            style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.input, color: c.text, outline: 'none', fontFamily: 'inherit', fontSize: '14px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${filter === f.id ? c.slate : c.border}`, background: filter === f.id ? c.slate : c.card, color: filter === f.id ? '#fff' : c.muted }}>
              {f.label} ({f.id === 'semua' ? counts.semua : counts[f.id]})
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
        filtered.length === 0 ? (
          <div style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '46px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: c.muted }}>{rows.length === 0 ? 'Belum ada pesan masuk.' : 'Tidak ada pesan yang cocok.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(r => {
              const b = badgeOf(r.type);
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(r)}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = c.slate}
                  onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: b.bg, color: b.color, marginRight: '8px' }}>{b.label}</span>
                      <span style={{ fontWeight: 700, color: c.text, fontSize: '14px' }}>{r.name}</span>
                      {r.type === 'karier' && r.position && <span style={{ fontSize: '12px', color: c.muted }}> · melamar {r.position}</span>}
                    </div>
                    <span style={{ fontSize: '11px', color: c.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(r.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: c.slate, marginBottom: '6px' }}>{r.email}</div>
                  {r.message && <div style={{ fontSize: '13px', color: c.muted, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.message}</div>}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.93, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 14 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '16px', padding: '26px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 11px', borderRadius: '20px', background: badgeOf(selected.type).bg, color: badgeOf(selected.type).color }}>{badgeOf(selected.type).label}</span>
                <span style={{ fontSize: '12px', color: c.muted }}>{fmtDate(selected.created_at)}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: c.text, marginBottom: '2px' }}>{selected.name}</div>
              <div style={{ fontSize: '13px', color: c.slate, marginBottom: '4px' }}>{selected.email}</div>
              {selected.type === 'karier' && selected.position && <div style={{ fontSize: '13px', color: c.muted, marginBottom: '4px' }}>💼 Posisi dilamar: <b style={{ color: c.text }}>{selected.position}</b></div>}
              <div style={{ marginTop: '16px', padding: '16px', background: c.input, borderRadius: '10px', border: `1px solid ${c.border}`, fontSize: '14px', color: c.text, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {selected.message || <span style={{ color: c.muted }}>(Tanpa pesan)</span>}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent('Balasan dari SiapKerja.id')}`}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: c.slate, color: '#fff', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontSize: '14px' }}>✉️ Balas via Email</a>
                <button onClick={() => setDeleteConfirm(selected)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Hapus</button>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Tutup</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '360px', width: '100%' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Hapus pesan ini?</h3>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '18px' }}>Pesan dari "{deleteConfirm.name}" akan dihapus permanen.</p>
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