'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < bp);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, [bp]);
  return m;
}

export default function MentoringPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user, loaded } = useUser();
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mentorStatus, setMentorStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) { fetchMentors(); checkMentorStatus(); } }, [user]);

  const fetchMentors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('status', 'approved')
      .order('rating_avg', { ascending: false });
    if (error) console.error(error);
    setMentors(data || []);
    setLoading(false);
  };

  const checkMentorStatus = async () => {
    const { data } = await supabase
      .from('mentors')
      .select('status')
      .eq('user_id_ref', parseInt(user.id))
      .single();
    setMentorStatus(data?.status || null);
  };

  const filtered = mentors.filter(m => {
    if (!search) return true;
    const s = search.toLowerCase();
    const tags = (m.expertise_tags || m.expertise || []);
    const tagsText = Array.isArray(tags) ? tags.join(' ').toLowerCase() : String(tags).toLowerCase();
    return m.full_name?.toLowerCase().includes(s) || m.title?.toLowerCase().includes(s) || tagsText.includes(s);
  });

  const formatRupiah = (n) => 'Rp ' + (Number(n || 0)).toLocaleString('id-ID');

  if (!loaded || !user) return null;

  // Banner konten berdasarkan status mentor user
  const renderMentorBanner = () => {
    // Sudah jadi mentor aktif → tidak perlu banner
    if (mentorStatus === 'approved' || user?.role === 'mentor') return null;

    // Sedang pending
    if (mentorStatus === 'pending') return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #FEFCE8 0%, #FFF9C4 100%)',
          border: '1.5px solid #FDE047',
          borderRadius: '14px',
          padding: isMobile ? '16px' : '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}>
        <div style={{ fontSize: '32px', flexShrink: 0 }}>⏳</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#854D0E', margin: '0 0 2px' }}>
            Pendaftaran Mentor Sedang Ditinjau
          </p>
          <p style={{ fontSize: '13px', color: '#A16207', margin: 0 }}>
            Tim admin sedang memeriksa permohonanmu. Estimasi 1–3 hari kerja.
          </p>
        </div>
        <span style={{
          padding: '7px 14px', borderRadius: '20px',
          background: '#FDE047', color: '#854D0E',
          fontSize: '12px', fontWeight: 700, flexShrink: 0,
        }}>Menunggu Persetujuan</span>
      </motion.div>
    );

    // Ditolak → bisa daftar ulang
    if (mentorStatus === 'rejected') return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FFE4E4 100%)',
          border: '1.5px solid #FECACA',
          borderRadius: '14px',
          padding: isMobile ? '16px' : '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}>
        <div style={{ fontSize: '32px', flexShrink: 0 }}>❌</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B', margin: '0 0 2px' }}>
            Pendaftaran Mentor Tidak Disetujui
          </p>
          <p style={{ fontSize: '13px', color: '#B91C1C', margin: 0 }}>
            Kamu bisa memperbaiki profil dan mencoba mendaftar lagi.
          </p>
        </div>
        <Link href="/mentor/daftar" style={{
          padding: '9px 18px', borderRadius: '10px',
          background: '#DC2626', color: '#fff',
          fontSize: '13px', fontWeight: 700,
          textDecoration: 'none', flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>Daftar Ulang</Link>
      </motion.div>
    );

    // Belum pernah daftar → banner ajakan
    return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
          border: '1.5px solid #C4B5FD',
          borderRadius: '14px',
          padding: isMobile ? '18px 16px' : '20px 28px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
        <div style={{ fontSize: '36px', flexShrink: 0 }}>🎤</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 800, color: '#4C1D95', margin: '0 0 4px' }}>
            Punya keahlian yang bisa dibagikan?
          </p>
          <p style={{ fontSize: '13px', color: '#6D28D9', margin: 0, lineHeight: 1.5 }}>
            Daftar jadi mentor dan bantu ribuan jobseeker berkembang. Gratis, fleksibel, dan berdampak.
          </p>
        </div>
        <Link href="/mentor/daftar" style={{
          padding: '11px 22px', borderRadius: '10px',
          background: '#7C3AED', color: '#fff',
          fontSize: '13px', fontWeight: 700,
          textDecoration: 'none', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
          whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          ✨ Daftar Jadi Mentor
        </Link>
      </motion.div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, padding: isMobile ? '60px 12px 80px' : '32px', minWidth: 0 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                Cari Mentor 🎤
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Booking sesi 1-on-1 dengan mentor berpengalaman di bidangmu
              </p>
            </div>
            {/* Tombol daftar di header (desktop) */}
            {!isMobile && !mentorStatus && user?.role !== 'mentor' && (
              <Link href="/mentor/daftar" style={{
                padding: '10px 20px', borderRadius: '10px',
                background: '#7C3AED', color: '#fff',
                fontSize: '13px', fontWeight: 700,
                textDecoration: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              }}>
                🎤 Jadi Mentor
              </Link>
            )}
          </div>
        </motion.div>

        {/* Banner status mentor */}
        {renderMentorBanner()}

        {/* Search */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '14px 16px', marginBottom: '20px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', border: '1.5px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, keahlian, atau bidang..."
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Mentor Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '14px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: isMobile ? '40px 20px' : '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🔍</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Tidak ada mentor yang cocok</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Coba ubah kata kunci pencarian.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map((m, i) => {
              const tags = m.expertise_tags || m.expertise || [];
              const tagList = Array.isArray(tags) ? tags : [];
              const price = m.price_per_session || m.hourly_rate || 0;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>

                  <div style={{ padding: '18px 20px 16px' }}>
                    {/* Avatar + nama */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.full_name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-500),var(--brand-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                          {m.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.full_name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.title || 'Mentor'}{m.company ? ` • ${m.company}` : ''}
                        </p>
                      </div>
                    </div>

                    {m.bio && (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
                        {m.bio.slice(0, 90)}{m.bio.length > 90 ? '...' : ''}
                      </p>
                    )}

                    {tagList.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {tagList.slice(0, 3).map((t, ti) => (
                          <span key={ti} className="badge badge-blue" style={{ fontSize: '11px' }}>{t}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <span>⭐ {m.rating_avg > 0 ? parseFloat(m.rating_avg).toFixed(1) : 'Baru'} ({m.total_reviews || 0})</span>
                      {m.years_experience > 0 && <span>💼 {m.years_experience} thn</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-brand)' }}>{formatRupiah(price)}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>/sesi</span>
                    </div>

                    <Link href={`/mentoring/${m.id}`}
                      style={{ display: 'block', padding: '10px', borderRadius: '9px', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', textAlign: 'center', boxShadow: 'var(--shadow-brand)' }}>
                      Lihat Profil & Booking
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Floating tombol daftar mentor (mobile, hanya kalau belum daftar) */}
        {isMobile && !mentorStatus && user?.role !== 'mentor' && (
          <Link href="/mentor/daftar" style={{
            position: 'fixed', bottom: '80px', right: '16px',
            padding: '12px 18px', borderRadius: '50px',
            background: '#7C3AED', color: '#fff',
            fontSize: '13px', fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
            display: 'flex', alignItems: 'center', gap: '6px',
            zIndex: 50,
          }}>
            🎤 Jadi Mentor
          </Link>
        )}

      </main>
    </div>
  );
}