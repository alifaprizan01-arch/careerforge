'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';

export default function DetailLowonganPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loaded } = useUser();

  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user && id) fetchData(); }, [user, id]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: j }, { data: app }] = await Promise.all([
      supabase.from('trayek').select('*').eq('id', id).single(),
      supabase.from('applications').select('*').eq('user_id', user.id).eq('trayek_id', id).maybeSingle(),
    ]);
    if (!j) { setNotFound(true); setLoading(false); return; }
    setJob(j);
    setApplication(app || null);
    setLoading(false);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Gaji dirahasiakan';
    const fmt = n => `${(n / 1000000).toFixed(0)} juta`;
    if (min && max) return `Rp ${fmt(min)} – ${fmt(max)}`;
    if (min) return `Rp ${fmt(min)}+`;
    return `s/d Rp ${fmt(max)}`;
  };

  const handleApply = async () => {
    setSubmitting(true); setMsg('');
    const { data, error } = await supabase.from('applications')
      .insert([{ user_id: user.id, trayek_id: job.id, status: 'Menunggu', cover_letter: coverLetter, applied_at: new Date().toISOString() }])
      .select('*').single();
    setSubmitting(false);
    if (error) { setMsg('✕ Gagal mengirim lamaran: ' + error.message); return; }
    setApplication(data);
    setShowForm(false);
    setMsg('✓ Lamaran berhasil dikirim!');
  };

  const Wrapper = ({ children }) => (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );

  if (!loaded || !user) return null;

  if (loading) return (
    <Wrapper>
      <div className="skeleton" style={{ height: '120px', borderRadius: '16px', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '360px', borderRadius: '16px' }} />
    </Wrapper>
  );

  if (notFound) return (
    <Wrapper>
      <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>💼</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Lowongan tidak ditemukan</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>Lowongan ini mungkin sudah dihapus atau ditutup.</p>
        <button onClick={() => router.push('/trayek')} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Cari Lowongan Lain</button>
      </div>
    </Wrapper>
  );

  const reqList = (job.requirements || '').split('\n').map(r => r.trim()).filter(Boolean);

  return (
    <Wrapper>
      <button onClick={() => router.push('/trayek')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>← Kembali ke daftar lowongan</button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '22px', color: 'var(--text-brand)', flexShrink: 0 }}>
          {(job.company || job.tujuan)?.slice(0, 2).toUpperCase() || 'CF'}
        </div>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>{job.tujuan || 'Posisi'}</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>{job.company || 'Perusahaan'}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {job.asal && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-secondary)', padding: '4px 10px', borderRadius: '6px' }}>📍 {job.asal}</span>}
            {job.jenis && <span style={{ fontSize: '12px', color: 'var(--text-brand)', background: 'var(--surface-brand)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>🗂️ {job.jenis}</span>}
          </div>
        </div>
      </motion.div>

      {msg && <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 600, background: msg.startsWith('✓') ? 'var(--success-50, var(--surface-secondary))' : 'var(--surface-secondary)', color: msg.startsWith('✓') ? 'var(--text-success)' : 'var(--text-error)', border: '1px solid var(--border-default)' }}>{msg}</div>}

      {/* Body: 2 kolom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Kiri: detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Section title="Tentang Pekerjaan">
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {job.deskripsi || job.description || 'Belum ada deskripsi tambahan untuk lowongan ini.'}
            </p>
          </Section>

          <Section title="Kualifikasi & Persyaratan">
            {reqList.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Persyaratan belum dicantumkan.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reqList.map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--text-brand)', flexShrink: 0 }}>✓</span> {r}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Kanan: kartu lamar (sticky) */}
        <div style={{ position: 'sticky', top: '32px', background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Estimasi Gaji</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px' }}>{formatSalary(job.salary_min, job.salary_max)}</div>

          {application ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px' }}>✓</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}>Anda sudah melamar</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: {application.status}</div>
                </div>
              </div>
              <button onClick={() => router.push('/lamaran')} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                Lihat di Riwayat Lamaran →
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!showForm ? (
                <motion.button key="apply" whileTap={{ scale: 0.98 }} onClick={() => setShowForm(true)}
                  style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  🚀 Lamar Sekarang
                </motion.button>
              ) : (
                <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Cover Letter (opsional)</label>
                  <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={5}
                    placeholder="Ceritakan singkat kenapa Anda cocok untuk posisi ini..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleApply} disabled={submitting}
                      style={{ flex: 1, padding: '11px', borderRadius: '9px', border: 'none', background: submitting ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {submitting ? 'Mengirim...' : 'Kirim Lamaran'}
                    </button>
                    <button onClick={() => setShowForm(false)} disabled={submitting}
                      style={{ padding: '11px 16px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      Batal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 }}>
            Pastikan profil & dokumenmu sudah lengkap sebelum melamar.
          </p>
        </div>
      </div>
    </Wrapper>
  );
}

function Section({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>{title}</h2>
      {children}
    </motion.div>
  );
}