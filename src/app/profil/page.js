'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, loaded } = useUser();

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loaded && !user) { router.push('/auth'); return; }
    if (user) fetchProfile();
  }, [loaded, user]);

  const fetchProfile = async () => {
    setLoading(true);
    const [{ data: u }, { data: sk }, { data: ex }, { data: tr }] = await Promise.all([
      supabase.from('users').select('full_name, job_title, location, bio, avatar_url').eq('id', user.id).single(),
      supabase.from('user_skills').select('*').eq('user_id', user.id),
      supabase.from('user_experience').select('*').eq('user_id', user.id).order('start_year', { ascending: false }),
      supabase.from('user_trainings').select('progress, trainings(title)').eq('user_id', user.id),
    ]);
    setProfile(u || {});
    setSkills(sk || []);
    setExperiences(ex || []);
    setTrainings((tr || []).filter(t => (t.progress || 0) >= 100));
    setLoading(false);
  };

  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) : '?';
  const levelBadge = (l) => l === 'Mahir' ? 'badge-green' : l === 'Menengah' ? 'badge-blue' : 'badge-gray';

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + '/profil/' + user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* abaikan */ }
  };

  if (!loaded || !user) return null;

  const Wrapper = ({ children }) => (
    <div className="pp-shell">
      <Sidebar />
      <main className="pp-main">
        <div className="pp-container">{children}</div>
      </main>
      <style jsx>{`
        .pp-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
          font-family: var(--font-sans);
        }
        .pp-main {
          margin-left: var(--sidebar-width, 240px);
          flex: 1;
          padding: 32px;
          min-width: 0;
        }
        .pp-container {
          max-width: 860px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .pp-main {
            margin-left: 0;
            padding: 16px;
            padding-top: 72px; /* ruang untuk header/hamburger Sidebar mobile */
          }
        }
      `}</style>
    </div>
  );

  if (loading) return (
    <Wrapper>
      <div className="skeleton" style={{ height: '180px', borderRadius: '16px', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
    </Wrapper>
  );

  return (
    <Wrapper>
      <div className="pp-pageheader">
        <h1 className="pp-title">Profil Saya</h1>
        <span className="pp-subtitle">Inilah tampilan profilmu yang dilihat orang lain & perusahaan</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pp-card pp-headercard">
        <div className="pp-headertop">
          <div className="pp-avatar">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : initials(profile.full_name)}
          </div>
          <div className="pp-info">
            <h2 className="pp-name">{profile.full_name || 'Pengguna'}</h2>
            {profile.job_title && <p className="pp-jobtitle">{profile.job_title}</p>}
            {profile.location && <p className="pp-location">📍 {profile.location}</p>}
          </div>
          <div className="pp-actions">
            <button onClick={() => router.push('/profil/edit')} className="pp-btn pp-btn-primary">✎ Edit Profil</button>
            <button onClick={() => router.push('/dokumen')} className="pp-btn pp-btn-secondary">📁 Dokumen Saya</button>
            <button onClick={handleShare} className="pp-btn pp-btn-secondary">
              {copied ? '✓ Tautan disalin' : '🔗 Bagikan'}
            </button>
          </div>
        </div>
        {profile.bio && <p className="pp-bio">{profile.bio}</p>}
      </motion.div>

      {/* Stats */}
      <div className="pp-stats">
        {[
          { label: 'Skills', value: skills.length, color: 'var(--text-brand)' },
          { label: 'Pengalaman', value: experiences.length, color: 'var(--text-success)' },
          { label: 'Pelatihan selesai', value: trainings.length, color: 'var(--text-warning)' },
        ].map((s, i) => (
          <div key={i} className="pp-statcard">
            <div className="pp-statvalue" style={{ color: s.color }}>{s.value}</div>
            <div className="pp-statlabel">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <Section title="Skills & Keahlian">
        {skills.length === 0 ? <Empty text="Belum ada skill. Tambahkan lewat Edit Profil." /> : (
          <div className="pp-skillwrap">
            {skills.map(s => (
              <span key={s.id} className={`badge ${levelBadge(s.level)} pp-skillbadge`}>
                {s.skill_name} · {s.level}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Pengalaman */}
      <Section title="Pengalaman Kerja">
        {experiences.length === 0 ? <Empty text="Belum ada pengalaman kerja. Tambahkan lewat Edit Profil." /> : experiences.map((ex, i) => (
          <div key={ex.id} className="pp-expitem" style={{ borderBottom: i < experiences.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
            <div className="pp-expicon">🏢</div>
            <div className="pp-expbody">
              <p className="pp-expposition">{ex.position}</p>
              <p className="pp-expcompany">{ex.company}</p>
              <p className="pp-expyears">{ex.start_year} – {ex.end_year || 'Sekarang'}</p>
              {ex.description && <p className="pp-expdesc">{ex.description}</p>}
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

      <style jsx>{`
        .pp-pageheader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pp-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .pp-subtitle {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .pp-card {
          background: var(--surface-primary);
          border: 1px solid var(--border-default);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 20px;
        }
        .pp-headercard { padding: 28px; }

        .pp-headertop {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pp-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid var(--brand-600);
          flex-shrink: 0;
          background: var(--brand-600);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 32px;
        }
        .pp-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .pp-info { flex: 1; min-width: 220px; }
        .pp-name {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
          word-break: break-word;
        }
        .pp-jobtitle { font-size: 15px; color: var(--text-brand); font-weight: 600; margin-bottom: 4px; }
        .pp-location { font-size: 13px; color: var(--text-secondary); word-break: break-word; }

        .pp-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .pp-btn {
          padding: 10px 18px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: var(--font-sans);
          white-space: nowrap;
        }
        .pp-btn-primary { border: none; background: var(--brand-600); color: #fff; box-shadow: var(--shadow-brand); }
        .pp-btn-secondary { border: 1px solid var(--border-default); background: var(--surface-primary); color: var(--text-primary); font-weight: 600; }

        .pp-bio {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border-default);
        }

        .pp-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .pp-statcard {
          background: var(--surface-primary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 16px 8px;
          text-align: center;
          box-shadow: var(--shadow-xs);
        }
        .pp-statvalue { font-size: 22px; font-weight: 800; }
        .pp-statlabel { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

        .pp-skillwrap { display: flex; flex-wrap: wrap; gap: 8px; }
        .pp-skillbadge { font-size: 13px; padding: 6px 12px; }

        .pp-expitem { display: flex; gap: 16px; padding-bottom: 18px; margin-bottom: 18px; }
        .pp-expicon {
          width: 44px; height: 44px; border-radius: 10px;
          background: var(--surface-brand);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .pp-expbody { flex: 1; min-width: 0; }
        .pp-expposition { margin: 0 0 2px; font-weight: 700; color: var(--text-primary); font-size: 15px; }
        .pp-expcompany { margin: 0 0 4px; font-weight: 600; color: var(--text-brand); font-size: 13px; }
        .pp-expyears { margin: 0 0 8px; font-size: 12px; color: var(--text-tertiary); }
        .pp-expdesc { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

        /* ===== Mobile breakpoint ===== */
        @media (max-width: 640px) {
          .pp-headercard { padding: 18px; }
          .pp-headertop {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 14px;
          }
          .pp-info { min-width: 0; }
          .pp-actions {
            width: 100%;
            flex-direction: column;
          }
          .pp-btn { width: 100%; text-align: center; }

          .pp-stats { gap: 8px; }
          .pp-statcard { padding: 12px 6px; }
          .pp-statvalue { font-size: 18px; }
          .pp-statlabel { font-size: 11px; }

          .pp-name { font-size: 20px; }
          .pp-title { font-size: 19px; }
        }

        @media (max-width: 380px) {
          .pp-stats { grid-template-columns: 1fr 1fr; }
          .pp-stats > div:last-child { grid-column: span 2; }
        }
      `}</style>
    </Wrapper>
  );
}

function Section({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pp-card pp-section">
      <h2 className="pp-sectiontitle">{title}</h2>
      {children}
      <style jsx>{`
        .pp-section { padding: 24px; }
        .pp-sectiontitle { font-size: 16px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px; }
        @media (max-width: 640px) {
          .pp-section { padding: 16px; }
        }
      `}</style>
    </motion.div>
  );
}

function Empty({ text }) {
  return <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>{text}</p>;
}