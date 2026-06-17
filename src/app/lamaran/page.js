'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

// Aksen warna per status (untuk garis kiri kartu & angka statistik)
const ACCENT = { 'Menunggu': '#D97706', 'Diproses': '#2563EB', 'Wawancara': '#7C3AED', 'Diterima': '#16A34A', 'Ditolak': '#DC2626' };

// Stepper progres lamaran
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
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetch(); }, [user]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('applications')
      .select('*, trayek(tujuan, asal, jenis, company, salary_min, salary_max)')
      .eq('user_id', user.id).order('applied_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const statusConfig = {
    'Menunggu': { badge: 'badge-yellow', icon: '⏳', label: 'Menunggu Review' },
    'Diproses': { badge: 'badge-blue', icon: '🔍', label: 'Sedang Diproses' },
    'Wawancara': { badge: 'badge-purple', icon: '🎤', label: 'Jadwal Wawancara' },
    'Diterima': { badge: 'badge-green', icon: '✅', label: 'Diterima!' },
    'Ditolak': { badge: 'badge-red', icon: '❌', label: 'Tidak Dilanjutkan' },
  };

  const stats = {
    total: applications.length,
    menunggu: applications.filter(a => a.status === 'Menunggu').length,
    diproses: applications.filter(a => a.status === 'Diproses' || a.status === 'Wawancara').length,
    diterima: applications.filter(a => a.status === 'Diterima').length,
    ditolak: applications.filter(a => a.status === 'Ditolak').length,
  };

  const filtered = applications.filter(a => {
    const f = filter === 'semua' || a.status === filter;
    const s = !search || a.trayek?.tujuan?.toLowerCase().includes(search.toLowerCase()) || a.trayek?.company?.toLowerCase().includes(search.toLowerCase());
    return f && s;
  });

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = n => `${(n/1000000).toFixed(0)}jt`;
    if (min && max) return `Rp ${fmt(min)}–${fmt(max)}`;
    if (min) return `Rp ${fmt(min)}+`;
    return `s/d Rp ${fmt(max)}`;
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 240px)' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Riwayat Lamaran</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Pantau status semua lamaranmu</p>
          </div>
          <Link href="/trayek" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none', boxShadow: 'var(--shadow-brand)' }}>
            + Cari Lowongan
          </Link>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: stats.total, badge: 'badge-gray', color: 'var(--text-brand)', active: filter === 'semua', onClick: () => setFilter('semua') },
            { label: 'Menunggu', value: stats.menunggu, badge: 'badge-yellow', color: '#D97706', active: filter === 'Menunggu', onClick: () => setFilter('Menunggu') },
            { label: 'Diproses', value: stats.diproses, badge: 'badge-blue', color: '#2563EB', active: filter === 'Diproses', onClick: () => setFilter('Diproses') },
            { label: 'Diterima', value: stats.diterima, badge: 'badge-green', color: '#16A34A', active: filter === 'Diterima', onClick: () => setFilter('Diterima') },
            { label: 'Ditolak', value: stats.ditolak, badge: 'badge-red', color: '#DC2626', active: filter === 'Ditolak', onClick: () => setFilter('Ditolak') },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2 }} onClick={s.onClick}
              style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: `1.5px solid ${s.active ? 'var(--brand-400)' : 'var(--border-default)'}`, padding: '14px 16px', cursor: 'pointer', textAlign: 'center', boxShadow: s.active ? 'var(--shadow-brand)' : 'var(--shadow-xs)', transition: 'all 0.15s' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
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
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.4 }}>📋</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada lamaran</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Mulai lamar lowongan yang sesuai dengan profilmu</p>
            <Link href="/trayek" style={{ display: 'inline-flex', padding: '9px 20px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>Cari Lowongan</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((app, i) => {
              const sc = statusConfig[app.status] || statusConfig['Menunggu'];
              const salary = formatSalary(app.trayek?.salary_min, app.trayek?.salary_max);
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', borderLeft: `4px solid ${ACCENT[app.status] || 'var(--brand-600)'}`, padding: '18px 20px', boxShadow: 'var(--shadow-xs)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '11px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'var(--text-brand)', flexShrink: 0, border: '1px solid var(--border-brand)' }}>
                      {(app.trayek?.company || app.trayek?.tujuan)?.slice(0,2).toUpperCase() || 'CF'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{app.trayek?.tujuan || 'Posisi'}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {app.trayek?.company || 'Perusahaan'}
                            {app.trayek?.asal && <span> • 📍 {app.trayek.asal}</span>}
                            {salary && <span> • 💰 {salary}</span>}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <span className={`badge ${sc.badge}`}>{sc.icon} {app.status}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(app.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <StatusStepper status={app.status} />
                      {app.cover_letter && (
                        <div style={{ background: 'var(--surface-secondary)', borderRadius: '8px', padding: '10px 12px', border: '1px solid var(--border-subtle)', marginBottom: '10px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{app.cover_letter.slice(0,140)}...</p>
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
                    <Link href={`/trayek/${app.trayek_id}`} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, textDecoration: 'none', background: 'var(--surface-secondary)', flexShrink: 0, transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-brand)'; e.currentTarget.style.color = 'var(--text-brand)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      Detail →
                    </Link>
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