'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';

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
    // Hanya ambil kolom yang layak publik — email & phone sengaja TIDAK diambil
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
  const levelBadge = (l) => l === 'Mahir' ? 'badge-green' : l === 'Menengah' ? 'badge-blue' : 'badge-gray';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* abaikan */ }
  };

  const Wrapper = ({ children }) => (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      {showSidebar && <Sidebar />}
      <main style={{ marginLeft: showSidebar ? '240px' : 0, flex: 1, padding: '32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );

  if (loading) return (
    <Wrapper>
      <div className="skeleton" style={{ height: '180px', borderRadius: '16px', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
    </Wrapper>
  );

  if (notFound) return (
    <Wrapper>
      <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🔍</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Profil tidak ditemukan</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>Pengguna ini mungkin tidak ada atau telah dihapus.</p>
        <button onClick={() => router.push('/')} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Ke Beranda</button>
      </div>
    </Wrapper>
  );

  return (
    <Wrapper>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', fontFamily: 'var(--font-sans)' }}>← Kembali</button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '28px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--brand-600)', flexShrink: 0, background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '32px' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(profile.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>{profile.full_name || 'Pengguna'}</h1>
            {profile.job_title && <p style={{ fontSize: '15px', color: 'var(--text-brand)', fontWeight: 600, marginBottom: '4px' }}>{profile.job_title}</p>}
            {profile.location && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📍 {profile.location}</p>}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {isOwner && (
              <button onClick={() => router.push('/profil/edit')} style={{ padding: '10px 18px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>✎ Edit Profil</button>
            )}
            <button onClick={handleShare} style={{ padding: '10px 18px', borderRadius: '9px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
              {copied ? '✓ Tautan disalin' : '🔗 Bagikan'}
            </button>
          </div>
        </div>
        {profile.bio && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-default)' }}>{profile.bio}</p>}
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Skills', value: skills.length, color: 'var(--text-brand)' },
          { label: 'Pengalaman', value: experiences.length, color: 'var(--text-success)' },
          { label: 'Pelatihan selesai', value: trainings.length, color: 'var(--text-warning)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <Section title="Skills & Keahlian">
        {skills.length === 0 ? <Empty text="Belum ada skill yang ditambahkan." /> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map(s => (
              <span key={s.id} className={`badge ${levelBadge(s.level)}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
                {s.skill_name} · {s.level}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Pengalaman */}
      <Section title="Pengalaman Kerja">
        {experiences.length === 0 ? <Empty text="Belum ada pengalaman kerja." /> : experiences.map((ex, i) => (
          <div key={ex.id} style={{ display: 'flex', gap: '16px', paddingBottom: i < experiences.length - 1 ? '18px' : 0, marginBottom: i < experiences.length - 1 ? '18px' : 0, borderBottom: i < experiences.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏢</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{ex.position}</p>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-brand)', fontSize: '13px' }}>{ex.company}</p>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{ex.start_year} – {ex.end_year || 'Sekarang'}</p>
              {ex.description && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ex.description}</p>}
            </div>
          </div>
        ))}
      </Section>

      {/* Pelatihan selesai */}
      {trainings.length > 0 && (
        <Section title="Pelatihan yang Diselesaikan">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trainings.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-success)', fontSize: '16px' }}>🏆</span>
                {t.trainings?.title || 'Pelatihan'}
              </div>
            ))}
          </div>
        </Section>
      )}
    </Wrapper>
  );
}

function Section({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>{title}</h2>
      {children}
    </motion.div>
  );
}

function Empty({ text }) {
  return <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>{text}</p>;
}