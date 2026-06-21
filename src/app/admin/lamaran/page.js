'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

const STATUSES = ['Menunggu', 'Diproses', 'Wawancara', 'Diterima', 'Ditolak'];

export default function AdminLamaranPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [msg, setMsg] = useState('');

  // Document viewer
  const [docsFor, setDocsFor] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchApps(); }, [user]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*, users(full_name, email, avatar_url), trayek(tujuan, company)')
        .order('applied_at', { ascending: false });
      if (error) console.error('Fetch error:', error);
      setApps((data || []).filter(a => a != null));
    } catch (e) { console.error(e); setApps([]); }
    finally { setLoading(false); }
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('applications').update({ status }).eq('id', id);
      if (error) throw error;
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      flash('Status lamaran diperbarui.');
    } catch (e) { flash('Gagal: ' + e.message); }
    setUpdatingId(null);
  };

  const openDocs = async (app) => {
    setDocsFor(app); setDocs([]); setLoadingDocs(true);
    const { data } = await supabase.from('application_documents').select('*').eq('application_id', app.id);
    setDocs(data || []);
    setLoadingDocs(false);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC', inputText: isDark ? '#F1F5F9' : '#0F172A',
    slate: isDark ? '#94A3B8' : '#475569', slateBg: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
  };

  const statusStyle = (s) => {
    const map = {
      'Menunggu':  { bg: isDark ? 'rgba(217,119,6,0.15)'  : '#FFFBEB', color: isDark ? '#FBBF24' : '#D97706' },
      'Diproses':  { bg: isDark ? 'rgba(37,99,235,0.15)'  : '#EFF6FF', color: isDark ? '#60A5FA' : '#2563EB' },
      'Wawancara': { bg: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF', color: isDark ? '#C084FC' : '#7C3AED' },
      'Diterima':  { bg: isDark ? 'rgba(22,163,74,0.15)'  : '#F0FDF4', color: isDark ? '#4ADE80' : '#16A34A' },
      'Ditolak':   { bg: isDark ? 'rgba(220,38,38,0.15)'  : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626' },
    };
    return map[s] || { bg: c.slateBg, color: c.muted };
  };

  const count = (s) => apps.filter(a => a.status === s).length;
  const filtered = apps.filter(a => {
    const okStatus = statusFilter === 'all' || a.status === statusFilter;
    const q = search.toLowerCase();
    const okSearch = !search
      || (a.users?.full_name || '').toLowerCase().includes(q)
      || (a.users?.email || '').toLowerCase().includes(q)
      || (a.trayek?.tujuan || '').toLowerCase().includes(q)
      || (a.trayek?.company || '').toLowerCase().includes(q);
    return okStatus && okSearch;
  });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const isImage = (u = '') => /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(u);

  if (!loaded || !user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>🛡️ ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Lamaran</span>
        </div>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: msg.includes('Gagal') ? (isDark ? '#450A0A' : '#FEF2F2') : c.slateBg, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.slate}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.slate, marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</motion.div>}

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total Lamaran', value: apps.length, color: c.slate },
              { label: 'Menunggu', value: count('Menunggu'), color: statusStyle('Menunggu').color },
              { label: 'Diterima', value: count('Diterima'), color: statusStyle('Diterima').color },
              { label: 'Ditolak', value: count('Ditolak'), color: statusStyle('Ditolak').color },
            ].map((s, i) => (
              <div key={i} style={{ background: c.card, borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', borderColor: c.border, borderTopWidth: '3px', borderTopColor: s.color, padding: '16px 18px' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
                <div style={{ fontSize: '12px', color: c.muted, marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '12px' }}>
            <span style={{ color: c.muted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pelamar, email, atau posisi..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.inputText, fontFamily: 'inherit' }} />
            <span style={{ fontSize: '13px', color: c.muted }}>{filtered.length} lamaran</span>
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {['all', ...STATUSES].map(s => {
              const active = statusFilter === s;
              const st = s === 'all' ? { bg: c.slateBg, color: c.slate } : statusStyle(s);
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${active ? st.color : c.border}`,
                  background: active ? st.bg : 'transparent',
                  color: active ? st.color : c.muted,
                }}>{s === 'all' ? `Semua (${apps.length})` : `${s} (${count(s)})`}</button>
              );
            })}
          </div>

          {/* List */}
          {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
          filtered.length === 0 ? (
            <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '70px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p style={{ color: c.muted }}>{apps.length === 0 ? 'Belum ada lamaran masuk.' : 'Tidak ada lamaran yang cocok.'}</p>
            </div>
          ) : (
            <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
              {filtered.map((a, i) => {
                const st = statusStyle(a.status);
                return (
                  <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${c.border}` : 'none', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.15s', flexWrap: 'wrap' }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? '#334155' : '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {/* Applicant */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
                      {a.users?.avatar_url ? <img src={a.users.avatar_url} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#475569,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                          {(a.users?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.users?.full_name || 'Pengguna'}</div>
                        <div style={{ fontSize: '12px', color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.users?.email || '-'}</div>
                      </div>
                    </div>
                    {/* Job */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{a.trayek?.tujuan || 'Posisi'}</div>
                      <div style={{ fontSize: '12px', color: c.muted }}>{a.trayek?.company || '-'}</div>
                    </div>
                    {/* Date */}
                    <div style={{ fontSize: '12px', color: c.muted, minWidth: '110px' }}>📅 {fmtDate(a.applied_at)}</div>
                    {/* Status badge */}
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: st.bg, color: st.color, fontWeight: 700, minWidth: '74px', textAlign: 'center' }}>{a.status || 'Menunggu'}</span>
                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select value={a.status || 'Menunggu'} disabled={updatingId === a.id} onChange={e => updateStatus(a.id, e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.input, color: c.inputText, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => openDocs(a)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${c.slate}`, background: 'transparent', color: c.slate, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>📎 Dokumen</motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </PageTransition>
      </main>

      {/* ===== Documents Modal ===== */}
      <AnimatePresence>
        {docsFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDocsFor(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 10 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: c.text }}>📎 Dokumen Pelamar</h3>
                <button onClick={() => setDocsFor(null)} style={{ border: 'none', background: 'transparent', color: c.muted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '18px' }}>{docsFor.users?.full_name} — {docsFor.trayek?.tujuan}</p>

              {loadingDocs ? <p style={{ color: c.muted, fontSize: '13px' }}>Memuat dokumen...</p> :
              docs.length === 0 ? <p style={{ color: c.muted, fontSize: '13px' }}>Pelamar tidak melampirkan dokumen.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {docs.map(d => (
                    <div key={d.id} style={{ border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: c.input }}>
                        <span style={{ fontSize: '18px' }}>{isImage(d.file_url) ? '🖼️' : '📄'}</span>
                        <div style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.file_name || 'Dokumen'}</div>
                        <a href={d.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: c.slate, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Buka ↗</a>
                      </div>
                      {isImage(d.file_url)
                        ? <img src={d.file_url} style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', background: isDark ? '#0F172A' : '#F1F5F9' }} />
                        : <iframe src={d.file_url} title={d.file_name} style={{ width: '100%', height: '320px', border: 'none' }} />}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}