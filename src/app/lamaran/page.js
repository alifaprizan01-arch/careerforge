'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

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

const ACCENT = { 'Menunggu': '#D97706', 'Diproses': '#2563EB', 'Wawancara': '#7C3AED', 'Diterima': '#16A34A', 'Ditolak': '#DC2626' };
const STAGE_LABELS = ['Dilamar', 'Direview', 'Diproses', 'Hasil'];

const statusStage = (status) => {
  if (status === 'Menunggu') return 1;
  if (status === 'Diproses' || status === 'Wawancara') return 2;
  if (status === 'Diterima' || status === 'Ditolak') return 3;
  return 1;
};

function StatusStepper({ status }) {
  const current = statusStage(status);
  const doneColor = status === 'Ditolak' ? '#DC2626' : (status === 'Diterima' ? '#16A34A' : 'var(--brand-600)');
  return (
    <div style={{ marginTop: '12px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STAGE_LABELS.map((label, idx) => {
          const reached = idx <= current;
          const isLast = idx === STAGE_LABELS.length - 1;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0 0 auto' : 1 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: reached ? doneColor : 'var(--surface-secondary)', border: `2px solid ${reached ? doneColor : 'var(--border-strong)'}`, flexShrink: 0 }} />
              {!isLast && <div style={{ flex: 1, height: '2px', background: idx < current ? doneColor : 'var(--border-default)' }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
        {STAGE_LABELS.map((label, idx) => (
          <span key={idx} style={{ fontSize: '10px', color: idx <= current ? 'var(--text-secondary)' : 'var(--text-tertiary)', fontWeight: idx <= current ? 600 : 400 }}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export default function LamaranPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const isMobile = useIsMobile();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');

  // State untuk hapus lamaran
  const [deleteConfirm, setDeleteConfirm] = useState(null); // app object
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) loadApplications(); }, [user]);

  const loadApplications = async () => {
    setLoading(true);
    const { data } = await supabase.from('applications')
      .select('*, trayek(tujuan, asal, jenis, company, salary_min, salary_max)')
      .eq('user_id', user.id).order('applied_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const deleteApplication = async (id) => {
    setDeleting(true);
    try {
      // Hapus dokumen terkait dulu (jika ada)
      await supabase.from('application_documents').delete().eq('application_id', id);
      const { error } = await supabase.from('applications').delete().eq('id', id);
      if (error) throw error;
      setApplications(prev => prev.filter(a => a.id !== id));
      setMsg('✓ Lamaran berhasil dihapus.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('Gagal menghapus: ' + e.message);
      setTimeout(() => setMsg(''), 3000);
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const statusConfig = {
    'Menunggu':   { badge: 'badge-yellow', icon: '⏳', label: 'Menunggu Review' },
    'Diproses':   { badge: 'badge-blue',   icon: '🔍', label: 'Sedang Diproses' },
    'Wawancara':  { badge: 'badge-purple', icon: '🎤', label: 'Jadwal Wawancara' },
    'Diterima':   { badge: 'badge-green',  icon: '✅', label: 'Diterima!' },
    'Ditolak':    { badge: 'badge-red',    icon: '❌', label: 'Tidak Dilanjutkan' },
  };

  const stats = {
    total:    applications.length,
    menunggu: applications.filter(a => a.status === 'Menunggu').length,
    diproses: applications.filter(a => a.status === 'Diproses' || a.status === 'Wawancara').length,
    diterima: applications.filter(a => a.status === 'Diterima').length,
    ditolak:  applications.filter(a => a.status === 'Ditolak').length,
  };

  const filtered = applications.filter(a => {
    const f = filter === 'semua' || a.status === filter;
    const s = !search || a.trayek?.tujuan?.toLowerCase().includes(search.toLowerCase()) || a.trayek?.company?.toLowerCase().includes(search.toLowerCase());
    return f && s;
  });

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = n => `${(n / 1000000).toFixed(0)}jt`;
    if (min && max) return `Rp ${fmt(min)}–${fmt(max)}`;
    if (min) return `Rp ${fmt(min)}+`;
    return `s/d Rp ${fmt(max)}`;
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, minWidth: 0, padding: isMobile ? '70px 16px 24px' : '32px', maxWidth: isMobile ? '100vw' : 'calc(100vw - var(--sidebar-width, 240px))', boxSizing: 'border-box', overflowX: 'hidden' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Riwayat Lamaran</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Pantau status semua lamaranmu</p>
          </div>
          <Link href="/trayek" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: isMobile ? '11px 18px' : '9px 18px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none', boxShadow: 'var(--shadow-brand)' }}>
            + Cari Lowongan
          </Link>
        </motion.div>

        {/* Flash message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: '12px 16px', background: msg.includes('Gagal') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${msg.includes('Gagal') ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', color: msg.includes('Gagal') ? '#DC2626' : '#16A34A', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '10px' : '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total',    value: stats.total,    color: 'var(--text-brand)', active: filter === 'semua',     onClick: () => setFilter('semua') },
            { label: 'Menunggu', value: stats.menunggu, color: '#D97706',           active: filter === 'Menunggu',  onClick: () => setFilter('Menunggu') },
            { label: 'Diproses', value: stats.diproses, color: '#2563EB',           active: filter === 'Diproses',  onClick: () => setFilter('Diproses') },
            { label: 'Diterima', value: stats.diterima, color: '#16A34A',           active: filter === 'Diterima',  onClick: () => setFilter('Diterima') },
            { label: 'Ditolak',  value: stats.ditolak,  color: '#DC2626',           active: filter === 'Ditolak',   onClick: () => setFilter('Ditolak') },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2 }} onClick={s.onClick}
              style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: `1.5px solid ${s.active ? 'var(--brand-400)' : 'var(--border-default)'}`, padding: isMobile ? '12px 10px' : '14px 16px', cursor: 'pointer', textAlign: 'center', boxShadow: s.active ? 'var(--shadow-brand)' : 'var(--shadow-xs)', transition: 'all 0.15s' }}>
              <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-xs)' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari posisi atau perusahaan..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{filtered.length} hasil</span>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: isMobile ? '40px 20px' : '80px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.4 }}>📋</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada lamaran</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Mulai lamar lowongan yang sesuai dengan profilmu</p>
            <Link href="/trayek" style={{ display: 'inline-flex', padding: '9px 20px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>Cari Lowongan</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {filtered.map((app, i) => {
                const sc = statusConfig[app.status] || statusConfig['Menunggu'];
                const salary = formatSalary(app.trayek?.salary_min, app.trayek?.salary_max);
                return (
                  <motion.div key={app.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', borderLeft: `4px solid ${ACCENT[app.status] || 'var(--brand-600)'}`, padding: isMobile ? '16px' : '18px 20px', boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; }}>

                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', gap: isMobile ? '10px' : '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', width: '100%' }}>
                        {/* Icon perusahaan */}
                        <div style={{ width: '48px', height: '48px', borderRadius: '11px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--text-brand)', flexShrink: 0, border: '1px solid var(--border-brand)' }}>
                          {(app.trayek?.company || app.trayek?.tujuan)?.slice(0, 2).toUpperCase() || 'CF'}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', gap: isMobile ? '8px' : '0', marginBottom: '6px' }}>
                            <div>
                              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{app.trayek?.tujuan || 'Posisi'}</h3>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {app.trayek?.company || 'Perusahaan'}
                                {app.trayek?.asal && <span> • 📍 {app.trayek.asal}</span>}
                                {salary && <span> • 💰 {salary}</span>}
                              </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', justifyContent: isMobile ? 'space-between' : 'flex-start', alignItems: isMobile ? 'center' : 'flex-end', gap: '6px', flexShrink: 0 }}>
                              <span className={`badge ${sc.badge}`}>{sc.icon} {app.status}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                {new Date(app.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <StatusStepper status={app.status} />

                          {app.cover_letter && (
                            <div style={{ background: 'var(--surface-secondary)', borderRadius: '8px', padding: '10px 12px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{app.cover_letter.slice(0, 140)}...</p>
                            </div>
                          )}

                          {app.interview_date && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', background: 'var(--surface-brand)', border: '1px solid var(--border-brand)' }}>
                              <span style={{ fontSize: '12px' }}>🗓️</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-brand)', fontWeight: 600 }}>
                                Interview: {new Date(app.interview_date).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Tombol aksi — desktop */}
                        {!isMobile && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                            <Link href={`/trayek/${app.trayek_id}`}
                              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, textDecoration: 'none', background: 'var(--surface-secondary)', transition: 'all 0.15s', display: 'block', textAlign: 'center' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-brand)'; e.currentTarget.style.color = 'var(--text-brand)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                              Detail →
                            </Link>
                            {/* Tombol hapus */}
                            <button onClick={() => setDeleteConfirm(app)}
                              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #FECACA', color: '#DC2626', fontSize: '12px', fontWeight: 500, background: '#FEF2F2', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                              onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}>
                              🗑️ Hapus
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Tombol aksi — mobile */}
                      {isMobile && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link href={`/trayek/${app.trayek_id}`}
                            style={{ flex: 1, display: 'block', textAlign: 'center', padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: 'var(--surface-secondary)' }}>
                            Lihat Detail →
                          </Link>
                          <button onClick={() => setDeleteConfirm(app)}
                            style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #FECACA', color: '#DC2626', fontSize: '13px', fontWeight: 600, background: '#FEF2F2', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !deleting && setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface-primary)', borderRadius: '18px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: 'var(--font-sans)' }}>

              {/* Icon */}
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>🗑️</div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Hapus lamaran ini?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Kamu akan menghapus lamaran untuk posisi
                <strong style={{ color: 'var(--text-primary)' }}> {deleteConfirm.trayek?.tujuan || 'ini'}</strong>
                {deleteConfirm.trayek?.company && <span> di <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.trayek.company}</strong></span>}.
              </p>
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#DC2626', margin: 0, fontWeight: 500 }}>
                  ⚠️ Lamaran yang dihapus tidak dapat dikembalikan.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600 }}>
                  Batal
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteApplication(deleteConfirm.id)} disabled={deleting}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: deleting ? '#FCA5A5' : '#DC2626', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}