'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';

// Dipindah ke luar PublicProfilePage agar tidak dibuat ulang setiap render —
// sebelumnya didefinisikan di dalam komponen dan dipakai di 3 tempat (loading,
// not-found, konten utama), berisiko membuat Sidebar di-mount ulang dari nol
// setiap kali state berubah. showSidebar diterima lewat prop karena nilainya
// bergantung pada status login (closure milik PublicProfilePage).
function Wrapper({ children, showSidebar }) {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        @media (max-width: 768px) {
          .profile-main {
            margin-left: 0 !important;
            padding: 16px 16px 40px !important;
            padding-top: 64px !important;
          }
          .profile-back-btn { display: none !important; }
        }
        @media (min-width: 769px) {
          .profile-mobile-topbar { display: none !important; }
        }
      `}</style>
      <div style={{
        display: 'flex', minHeight: '100vh',
        background: '#F1F5F9',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {showSidebar && <Sidebar />}
        <main
          className="profile-main"
          style={{
            marginLeft: showSidebar ? '240px' : 0,
            flex: 1,
            padding: '28px 32px 40px',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = user && String(user.id) === String(id);
  const showSidebar = !!user;

  useEffect(() => { if (id) fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    const [{ data: u }, { data: sk }, { data: ex }, { data: tr }] = await Promise.all([
      supabase.from('users').select('full_name, job_title, location, bio, avatar_url').eq('id', id).single(),
      supabase.from('user_skills').select('*').eq('user_id', id),
      supabase.from('user_experience').select('*').eq('user_id', id).order('start_year', { ascending: false }),
      supabase.from('user_trainings').select('progress, trainings(title)').eq('user_id', id),
    ]);
    if (!u) { setNotFound(true); setLoading(false); return; }
    setProfile(u);
    setSkills(sk || []);
    setExperiences(ex || []);
    setTrainings((tr || []).filter(t => (t.progress || 0) >= 100));
    setLoading(false);
  };

  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) : '?';
  const levelColor = (l) =>
    l === 'Mahir' ? { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' } :
    l === 'Menengah' ? { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' } :
    { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <Wrapper showSidebar={showSidebar}>
      <style>{`.skeleton { background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 16px; } @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div className="skeleton" style={{ height: '200px', marginBottom: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
      </div>
      <div className="skeleton" style={{ height: '160px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ height: '200px' }} />
    </Wrapper>
  );

  // ── Not found ─────────────────────────────────────────────────────────────
  if (notFound) return (
    <Wrapper showSidebar={showSidebar}>
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: '20px', padding: '60px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>🔍</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          Profil tidak ditemukan
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px', lineHeight: 1.6 }}>
          Pengguna ini mungkin tidak ada atau telah dihapus.
        </p>
        <button onClick={() => router.push('/')} style={{
          padding: '12px 28px', borderRadius: '10px', border: 'none',
          background: '#2563EB', color: '#fff', fontWeight: 700,
          fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
        }}>Ke Beranda</button>
      </div>
    </Wrapper>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Wrapper showSidebar={showSidebar}>

      {/* Tombol kembali — desktop only */}
      <button
        className="profile-back-btn"
        onClick={() => router.back()}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#64748B', fontSize: '13px', fontWeight: 500,
          marginBottom: '16px', padding: '0', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >← Kembali</button>

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #fff 60%)',
          border: '1px solid #BFDBFE',
          borderRadius: '20px',
          padding: '28px 24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(37,99,235,0.07)',
        }}
      >
        {/* Avatar + Info */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
          {/* Avatar */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            overflow: 'hidden', border: '3px solid #BFDBFE',
            flexShrink: 0, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '26px',
          }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(profile.full_name)
            }
          </div>

          {/* Teks */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: '20px', fontWeight: 800, color: '#0F172A',
              letterSpacing: '-0.02em', margin: '0 0 4px',
              wordBreak: 'break-word',
            }}>
              {profile.full_name || 'Pengguna'}
            </h1>
            {profile.job_title && (
              <p style={{ fontSize: '14px', color: '#2563EB', fontWeight: 600, margin: '0 0 4px' }}>
                {profile.job_title}
              </p>
            )}
            {profile.location && (
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                📍 {profile.location}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{
            fontSize: '14px', color: '#475569', lineHeight: 1.7,
            margin: '0 0 20px',
            paddingTop: '16px', borderTop: '1px solid #E2E8F0',
          }}>
            {profile.bio}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isOwner && (
            <button
              onClick={() => router.push('/profil/edit')}
              style={{
                flex: 1, minWidth: '120px',
                padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #E2E8F0', background: '#fff',
                color: '#0F172A', fontWeight: 600, fontSize: '14px',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >✎ Edit Profil</button>
          )}
          <button
            onClick={handleShare}
            style={{
              flex: 1, minWidth: '120px',
              padding: '12px 16px', borderRadius: '10px',
              border: 'none', background: '#2563EB',
              color: '#fff', fontWeight: 600, fontSize: '14px',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            {copied ? '✓ Tautan disalin' : '🔗 Bagikan'}
          </button>
        </div>
      </motion.div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px', marginBottom: '16px',
      }}>
        {[
          { label: 'Skills', value: skills.length, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Pengalaman', value: experiences.length, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Pelatihan', value: trainings.length, color: '#D97706', bg: '#FFFBEB' },
        ].map((s, i) => (
          <div key={i} style={{
            background: s.bg, borderRadius: '14px',
            padding: '14px 8px', textAlign: 'center',
            border: `1px solid ${s.color}20`,
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Skills ─────────────────────────────────────────────────────────── */}
      <Section title="⚡ Skills & Keahlian">
        {skills.length === 0
          ? <Empty text="Belum ada skill yang ditambahkan." />
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map(s => {
                const lc = levelColor(s.level);
                return (
                  <span key={s.id} style={{
                    background: lc.bg, color: lc.color,
                    border: `1px solid ${lc.border}`,
                    borderRadius: '8px', padding: '7px 12px',
                    fontSize: '13px', fontWeight: 600,
                  }}>
                    {s.skill_name} · {s.level}
                  </span>
                );
              })}
            </div>
          )
        }
      </Section>

      {/* ── Pengalaman ─────────────────────────────────────────────────────── */}
      <Section title="💼 Pengalaman Kerja">
        {experiences.length === 0
          ? <Empty text="Belum ada pengalaman kerja." />
          : experiences.map((ex, i) => (
            <div key={ex.id} style={{
              display: 'flex', gap: '14px',
              paddingBottom: i < experiences.length - 1 ? '18px' : 0,
              marginBottom: i < experiences.length - 1 ? '18px' : 0,
              borderBottom: i < experiences.length - 1 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#EFF6FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>🏢</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>
                  {ex.position}
                </p>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#2563EB', fontSize: '13px' }}>
                  {ex.company}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94A3B8' }}>
                  {ex.start_year} – {ex.end_year || 'Sekarang'}
                </p>
                {ex.description && (
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    {ex.description}
                  </p>
                )}
              </div>
            </div>
          ))
        }
      </Section>

      {/* ── Pelatihan selesai ──────────────────────────────────────────────── */}
      {trainings.length > 0 && (
        <Section title="🏆 Pelatihan Diselesaikan">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trainings.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', background: '#F8FAFC',
                borderRadius: '10px', border: '1px solid #F1F5F9',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>🎓</span>
                <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>
                  {t.trainings?.title || 'Pelatihan'}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
                  color: '#16A34A', background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  padding: '3px 8px', borderRadius: '6px', flexShrink: 0,
                }}>Selesai</span>
              </div>
            ))}
          </div>
        </Section>
      )}

    </Wrapper>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: '16px', padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <h2 style={{
        fontSize: '15px', fontWeight: 800, color: '#0F172A',
        marginBottom: '16px', margin: '0 0 16px',
      }}>{title}</h2>
      {children}
    </motion.div>
  );
}

function Empty({ text }) {
  return (
    <p style={{
      fontSize: '13px', color: '#94A3B8',
      textAlign: 'center', padding: '16px 0', margin: 0,
    }}>{text}</p>
  );
}