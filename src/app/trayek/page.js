'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function DetailLowonganPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user, loaded } = useUser();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user && params.id) fetchAll(); }, [user, params.id]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: j }, { data: a }] = await Promise.all([
      supabase.from('trayek').select('*').eq('id', params.id).single(),
      supabase.from('applications').select('*').eq('user_id', user.id).eq('trayek_id', params.id).single(),
    ]);
    setJob(j);
    if (a) { setHasApplied(true); setApplication(a); }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) { setMsg('Tulis cover letter terlebih dahulu.'); return; }
    setApplying(true);
    try {
      const { data } = await supabase.from('applications')
        .insert([{ user_id: user.id, trayek_id: parseInt(params.id), cover_letter: coverLetter, status: 'Menunggu' }])
        .select().single();
      setHasApplied(true);
      setApplication(data);
      setShowForm(false);
      setMsg('Lamaran berhasil dikirim! 🎉');
    } catch (err) { setMsg('Gagal melamar: ' + err.message); }
    finally { setApplying(false); }
  };

  const statusColor = (s) => {
    if (s === 'Diterima') return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
    if (s === 'Ditolak') return { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' };
    if (s === 'Diproses') return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
    return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (n) => n >= 1000000 ? `Rp ${(n/1000000).toFixed(0)} juta` : `Rp ${(n/1000).toFixed(0)} ribu`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}/bulan`;
    if (min) return `${fmt(min)}+/bulan`;
    return `s/d ${fmt(max)}/bulan`;
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100vw - 220px)' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: '#64748B' }}>
          <Link href="/trayek" style={{ color: '#2563EB', textDecoration: 'none' }}>← Kembali ke Lowongan</Link>
        </div>

        {loading ? (
          <p style={{ color: '#94A3B8' }}>Memuat detail lowongan...</p>
        ) : !job ? (
          <p style={{ color: '#94A3B8' }}>Lowongan tidak ditemukan.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

            {/* Left: Job detail */}
            <div>
              {/* Header card */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', color: '#2563EB', flexShrink: 0 }}>
                    {(job.company || job.tujuan)?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{job.tujuan}</h1>
                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '12px' }}>{job.company || 'Perusahaan'} • {job.asal}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { label: job.jenis || 'Full Time', bg: '#EFF6FF', color: '#2563EB' },
                        job.asal && { label: `📍 ${job.asal}`, bg: '#F8FAFC', color: '#475569' },
                      ].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: tag.bg, color: tag.color, border: '1px solid #E2E8F0', fontWeight: 500 }}>{tag.label}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key info row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: '#F8FAFC', borderRadius: '10px' }}>
                  {[
                    { icon: '💰', label: 'Gaji', value: formatSalary(job.salary_min, job.salary_max) || 'Negotiable' },
                    { icon: '⏰', label: 'Tipe', value: job.jenis || 'Full Time' },
                    { icon: '📅', label: 'Deadline', value: job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tidak ada' },
                  ].map((info, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{info.icon}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>{info.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{info.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {job.deskripsi && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>Tentang Pekerjaan</h2>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{job.deskripsi}</p>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>Persyaratan</h2>
                  <div>
                    {job.requirements.split('\n').map((req, i) => req.trim() && (
                      <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB', marginTop: '7px', flexShrink: 0 }} />
                        <span style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Apply panel */}
            <div style={{ position: 'sticky', top: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Status lamaran */}
              {hasApplied && application && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>Status Lamaran</h3>
                  {(() => { const sc = statusColor(application.status); return (
                    <div style={{ padding: '12px 16px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '8px', marginBottom: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                        {application.status === 'Diterima' ? '🎉' : application.status === 'Ditolak' ? '😔' : application.status === 'Diproses' ? '⚙️' : '⏳'}
                      </div>
                      <div style={{ fontWeight: 700, color: sc.color, fontSize: '15px' }}>{application.status}</div>
                      <div style={{ fontSize: '12px', color: sc.color, opacity: 0.8, marginTop: '2px' }}>
                        {application.status === 'Menunggu' ? 'Lamaranmu sedang ditinjau' : application.status === 'Diproses' ? 'Sedang dalam proses seleksi' : application.status === 'Diterima' ? 'Selamat! Kamu diterima!' : 'Lamaran tidak dilanjutkan'}
                      </div>
                    </div>
                  ); })()}
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    Dikirim: {new Date(application.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}

              {/* Apply form */}
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                {!hasApplied ? (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Lamar Posisi Ini</h3>
                    <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>Tulis cover letter yang menarik untuk meningkatkan peluangmu.</p>

                    {msg && <div style={{ padding: '10px', background: msg.includes('Gagal') ? '#FEF2F2' : '#F0FDF4', borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : '#16A34A', fontSize: '13px', marginBottom: '12px' }}>{msg}</div>}

                    {!showForm ? (
                      <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                        Lamar Sekarang
                      </button>
                    ) : (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>Cover Letter</label>
                          <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={6}
                            placeholder={`Perkenalkan diri kamu dan jelaskan mengapa kamu cocok untuk posisi ${job.tujuan}...`}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', color: '#0F172A', background: '#F8FAFC', lineHeight: 1.6, boxSizing: 'border-box' }} />
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', textAlign: 'right' }}>{coverLetter.length} karakter</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>Batal</button>
                          <button onClick={handleApply} disabled={applying} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: applying ? '#93C5FD' : '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: applying ? 'default' : 'pointer' }}>
                            {applying ? 'Mengirim...' : '✈️ Kirim Lamaran'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>Cover Letter Kamu</h3>
                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{application?.cover_letter || '-'}</p>
                    </div>
                    <Link href="/lamaran" style={{ display: 'block', textAlign: 'center', marginTop: '14px', color: '#2563EB', fontSize: '13px', fontWeight: 500 }}>
                      Lihat semua lamaran →
                    </Link>
                  </>
                )}
              </div>

              {/* Tips */}
              {!hasApplied && (
                <div style={{ background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#1D4ED8', marginBottom: '8px' }}>💡 Tips Cover Letter</h4>
                  {['Sebutkan nama posisi dan dari mana kamu tahu lowongan ini', 'Jelaskan pengalaman relevan yang kamu miliki', 'Tunjukkan antusiasme terhadap perusahaan', 'Akhiri dengan ajakan untuk interview'].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px', color: '#1E40AF' }}>
                      <span>•</span><span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
