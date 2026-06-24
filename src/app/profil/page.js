'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

// Dipindah ke luar MyProfilePage agar tidak dibuat ulang setiap render —
// sebelumnya didefinisikan di dalam komponen dan dipakai di 2 tempat (loading
// state & konten utama), sehingga Sidebar berisiko di-mount ulang dari nol
// setiap kali state berubah. Tidak butuh prop tambahan karena breakpoint
// mobile ditangani lewat CSS media query (styled-jsx), bukan JS conditional.
function Wrapper({ children, isMobile }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{
        marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)',
        flex: 1,
        padding: isMobile ? '72px 14px 60px' : '32px',
        minWidth: 0,
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return m;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const isMobile = useIsMobile();

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

  if (loading) return (
    <Wrapper isMobile={isMobile}>
      <div className="skeleton" style={{ height: '180px', borderRadius: '16px', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
    </Wrapper>
  );

  return (
    <Wrapper isMobile={isMobile}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
        <h1 style={{ fontSize: isMobile ? "19px" : "22px", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.02em", margin:0 }}>Profil Saya</h1>
        <span style={{ fontSize:"12px", color:"var(--text-tertiary)" }}>Inilah tampilan profilmu yang dilihat orang lain & perusahaan</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background:"var(--surface-primary)", border:"1px solid var(--border-default)", borderRadius:"18px", boxShadow:"var(--shadow-sm)", marginBottom:"20px", padding: isMobile ? "18px" : "28px" }}>
        <div style={{ display:"flex", gap:"24px", alignItems: isMobile ? "center" : "center", flexDirection: isMobile ? "column" : "row", flexWrap:"wrap", textAlign: isMobile ? "center" : "left" }}>
          <div style={{ width:"96px", height:"96px", borderRadius:"50%", overflow:"hidden", border:"3px solid var(--brand-600)", flexShrink:0, background:"var(--brand-600)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"32px" }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : initials(profile.full_name)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h2 style={{ fontSize: isMobile ? "20px" : "24px", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.02em", marginBottom:"4px", wordBreak:"break-word", margin:"0 0 4px" }}>{profile.full_name || 'Pengguna'}</h2>
            {profile.job_title && <p style={{ fontSize:"15px", color:"var(--text-brand)", fontWeight:600, margin:"0 0 4px" }}>{profile.job_title}</p>}
            {profile.location && <p style={{ fontSize:"13px", color:"var(--text-secondary)", wordBreak:"break-word", margin:0 }}>📍 {profile.location}</p>}
          </div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : "auto" }}>
            <button onClick={() => router.push('/profil/edit')} style={{ padding:"10px 18px", borderRadius:"9px", border:"none", background:"var(--brand-600)", color:"#fff", fontWeight:700, fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", whiteSpace:"nowrap", width: isMobile ? "100%" : "auto" }}>✎ Edit Profil</button>
            <button onClick={() => router.push('/dokumen')} style={{ padding:"10px 18px", borderRadius:"9px", border:"1px solid var(--border-default)", background:"var(--surface-primary)", color:"var(--text-primary)", fontWeight:600, fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", width: isMobile ? "100%" : "auto" }}>📁 Dokumen Saya</button>
            <button onClick={handleShare} style={{ padding:"10px 18px", borderRadius:"9px", border:"1px solid var(--border-default)", background:"var(--surface-primary)", color:"var(--text-primary)", fontWeight:600, fontSize:"13px", cursor:"pointer", fontFamily:"var(--font-sans)", width: isMobile ? "100%" : "auto" }}>
              {copied ? '✓ Tautan disalin' : '🔗 Bagikan'}
            </button>
          </div>
        </div>
        {profile.bio && <p style={{ fontSize:"14px", color:"var(--text-secondary)", lineHeight:1.7, marginTop:"20px", paddingTop:"20px", borderTop:"1px solid var(--border-default)" }}>{profile.bio}</p>}
      </motion.div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: isMobile ? "8px" : "12px", marginBottom:"20px" }}>
        {[
          { label: 'Skills', value: skills.length, color: 'var(--text-brand)' },
          { label: 'Pengalaman', value: experiences.length, color: 'var(--text-success)' },
          { label: 'Pelatihan selesai', value: trainings.length, color: 'var(--text-warning)' },
        ].map((s, i) => (
          <div key={i} style={{ background:"var(--surface-primary)", border:"1px solid var(--border-default)", borderRadius:"12px", padding: isMobile ? "12px 6px" : "16px", textAlign:"center", boxShadow:"var(--shadow-xs)" }}>
            <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight:800 }} style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: isMobile ? "11px" : "12px", color:"var(--text-secondary)", marginTop:"2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <Section title="Skills & Keahlian">
        {skills.length === 0 ? <Empty text="Belum ada skill. Tambahkan lewat Edit Profil." /> : (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {skills.map(s => (
              <span key={s.id} className={`badge ${levelBadge(s.level)}`} style={{ fontSize:"13px", padding:"6px 12px" }}>
                {s.skill_name} · {s.level}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Pengalaman */}
      <Section title="Pengalaman Kerja">
        {experiences.length === 0 ? <Empty text="Belum ada pengalaman kerja. Tambahkan lewat Edit Profil." /> : experiences.map((ex, i) => (
          <div key={ex.id} style={{ display:"flex", gap:"16px", paddingBottom:"18px", marginBottom:"18px" }} style ={{ borderBottom: i < experiences.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"10px", background:"var(--surface-brand)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🏢</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:"0 0 2px", fontWeight:700, color:"var(--text-primary)", fontSize:"15px" }}>{ex.position}</p>
              <p style={{ margin:"0 0 4px", fontWeight:600, color:"var(--text-brand)", fontSize:"13px" }}>{ex.company}</p>
              <p style={{ margin:"0 0 8px", fontSize:"12px", color:"var(--text-tertiary)" }}>{ex.start_year} – {ex.end_year || 'Sekarang'}</p>
              {ex.description && <p style={{ margin:0, fontSize:"13px", color:"var(--text-secondary)", lineHeight:1.6 }}>{ex.description}</p>}
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
      style={{ background:"var(--surface-primary)", border:"1px solid var(--border-default)", borderRadius:"16px", boxShadow:"var(--shadow-sm)", marginBottom:"20px", padding:"24px" }}>
      <h2 style={{ fontSize:"16px", fontWeight:800, color:"var(--text-primary)", marginBottom:"16px", margin:"0 0 16px" }}>{title}</h2>
      {children}
    </motion.div>
  );
}

function Empty({ text }) {
  return <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>{text}</p>;
}