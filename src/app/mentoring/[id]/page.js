'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function MentoringPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  const [mentors, setMentors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mentorReviews, setMentorReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ mentor_id: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: m }, { data: r }] = await Promise.all([
      supabase.from('mentors').select('*'),
      supabase.from('mentoring_reviews').select('*, mentors(full_name), users(full_name, avatar_url)').order('created_at', { ascending: false }),
    ]);
    setMentors(m || []); setReviews(r || []); setLoading(false);
  };

  const fetchMentorReviews = async id => {
    const { data } = await supabase.from('mentoring_reviews').select('*, users(full_name, avatar_url)').eq('mentor_id', id).order('created_at', { ascending: false });
    setMentorReviews((data || []).filter(r => r != null && r.rating != null));
  };

  const selectMentor = m => { setSelectedMentor(m); fetchMentorReviews(m.id); setReviewForm(f => ({ ...f, mentor_id: String(m.id) })); };

  const handleReview = async e => {
    e.preventDefault();
    if (!reviewForm.mentor_id || !reviewForm.comment.trim()) { setMsg('Tulis komentar terlebih dahulu.'); return; }
    setSubmitting(true);
    try {
      const { data: newReview } = await supabase.from('mentoring_reviews').insert([{ user_id: user.id, mentor_id: parseInt(reviewForm.mentor_id), rating: reviewForm.rating, comment: reviewForm.comment }]).select('*, users(full_name, avatar_url)').single();
      if (newReview) setMentorReviews(prev => [newReview, ...prev.filter(r => r != null)]);
      setMsg('Review berhasil dikirim! ✓');
      setReviewForm(f => ({ ...f, rating: 5, comment: '' }));
      setShowReviewModal(false);
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Gagal mengirim review.'); }
    finally { setSubmitting(false); }
  };

  const filteredMentors = mentors.filter(m => m != null).filter(m => {
    const s = !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.expertise?.toLowerCase().includes(search.toLowerCase());
    const r = filterRating === 0 || (m.rating_avg || 0) >= filterRating;
    return s && r;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating_avg || 0) - (a.rating_avg || 0);
    if (sortBy === 'reviews') return (b.total_reviews || 0) - (a.total_reviews || 0);
    if (sortBy === 'experience') return (b.years_experience || 0) - (a.years_experience || 0);
    return 0;
  });

  const renderStars = (rating, size = 14) => (
    <div style={{ display: 'flex', gap: '1px' }}>
      {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: `${size}px`, color: n <= Math.round(rating) ? '#F59E0B' : 'var(--border-strong)' }}>★</span>)}
    </div>
  );

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, minWidth: 0, padding: isMobile ? '70px 16px 24px' : '32px', boxSizing: 'border-box', overflowX: 'hidden' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Mentoring</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Temukan mentor terbaik dan booking sesi learning</p>
        </motion.div>

        {msg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: 'var(--success-50)', border: '1px solid #BBF7D0', borderRadius: '8px', color: 'var(--text-success)', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>✓ {msg}</motion.div>}

        {/* Interview AI banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 100%)', borderRadius: '14px', padding: isMobile ? '18px' : '22px 28px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '14px' : '20px', marginBottom: '24px', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', background: 'rgba(255,255,255,0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '22px' : '26px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.2)' }}>🤖</motion.div>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em' }}>Simulasi Interview AI</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '13px' }}>Latih wawancara & dapatkan feedback instan — gratis!</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/interview')}
            style={{ padding: '11px 20px', borderRadius: '9px', border: 'none', background: '#fff', color: 'var(--brand-700)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-sans)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: isMobile ? '100%' : 'auto' }}>
            Mulai Sekarang →
          </motion.button>
        </motion.div>

        {/* Search & filter */}
        <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: isMobile ? '14px' : '14px 16px', marginBottom: '20px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', border: '1.5px solid var(--border-default)', borderRadius: '9px', padding: '9px 14px', minWidth: 0 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari mentor atau keahlian..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, minWidth: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '9px 12px', borderRadius: '9px', border: '1.5px solid var(--border-default)', fontSize: '13px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', cursor: 'pointer', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}>
              <option value="rating">Rating Tertinggi</option>
              <option value="reviews">Ulasan Terbanyak</option>
              <option value="experience">Pengalaman Terlama</option>
            </select>
          </div>
          <div className="no-scrollbar" style={{ display: 'flex', gap: '6px', alignItems: 'center', overflowX: isMobile ? 'auto' : 'visible' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, flexShrink: 0 }}>Min Rating:</span>
            {[0,3,4,5].map(r => (
              <button key={r} onClick={() => setFilterRating(r)} style={{
                padding: '4px 12px', borderRadius: '20px', border: `1px solid ${filterRating === r ? '#F59E0B' : 'var(--border-default)'}`,
                background: filterRating === r ? '#FFFBEB' : 'transparent', color: filterRating === r ? '#D97706' : 'var(--text-secondary)',
                fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{r === 0 ? 'Semua' : `${r}★+`}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (selectedMentor ? '1fr 380px' : '1fr'), gap: '20px' }}>
          {/* Mentor grid */}
          {(!isMobile || mobileView === 'list') && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px' }}>
              {filteredMentors.length} mentor tersedia
            </div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '180px' }} />)}
              </div>
            ) : filteredMentors.length === 0 ? (
              <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: isMobile ? '32px 20px' : '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🎤</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tidak ada mentor yang sesuai</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {filteredMentors.map((m, i) => {
                  const isSelected = selectedMentor?.id === m.id;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => { selectMentor(m); if (isMobile) setMobileView('detail'); }}
                      style={{ background: 'var(--surface-primary)', borderRadius: '12px', padding: '18px', cursor: 'pointer',
                        border: `${isSelected ? '2' : '1'}px solid ${isSelected ? 'var(--border-brand)' : 'var(--border-default)'}`,
                        boxShadow: isSelected ? 'var(--shadow-brand)' : 'var(--shadow-xs)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; } }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        {m.avatar_url ? <Image src={m.avatar_url} alt={m.full_name || 'Foto mentor'} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border-brand)' }} /> :
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                            {m.full_name?.slice(0,1)}
                          </div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.full_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.expertise || 'Mentor'}</div>
                        </div>
                        {m.availability === 'Tersedia' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                        {renderStars(m.rating_avg || 0)}
                        <span style={{ fontSize: '13px', fontWeight: 700, color: (m.rating_avg || 0) > 0 ? '#D97706' : 'var(--text-tertiary)' }}>{(m.rating_avg || 0) > 0 ? parseFloat(m.rating_avg).toFixed(1) : 'Baru'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>({m.total_reviews || 0})</span>
                      </div>

                      {m.expertise_tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {m.expertise_tags.slice(0,3).map((tag, j) => <span key={j} className="badge badge-blue">#{tag}</span>)}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{m.years_experience ? `${m.years_experience} thn pengalaman` : 'Mentor'}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-success)' }}>{m.price_per_session > 0 ? `Rp ${(m.price_per_session/1000).toFixed(0)}rb/jam` : 'Gratis'}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Detail panel */}
          <AnimatePresence>
            {selectedMentor && (!isMobile || mobileView === 'detail') && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                style={{ position: isMobile ? 'static' : 'sticky', top: '32px', maxHeight: isMobile ? 'none' : 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: isMobile ? 'visible' : 'auto' }}>

                {isMobile && (
                  <button onClick={() => setMobileView('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-brand)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-sans)' }}>
                    ← Kembali ke daftar mentor
                  </button>
                )}

                {/* Profile card */}
                <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: isMobile ? '16px' : '20px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    {selectedMentor.avatar_url ? <Image src={selectedMentor.avatar_url} alt={selectedMentor.full_name || 'Foto mentor'} width={60} height={60} style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-brand)', flexShrink: 0 }} /> :
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '22px', flexShrink: 0 }}>
                        {selectedMentor.full_name?.slice(0,1)}
                      </div>}
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.01em' }}>{selectedMentor.full_name}</h2>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{selectedMentor.expertise}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderStars(selectedMentor.rating_avg || 0, 16)}
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#D97706' }}>{(selectedMentor.rating_avg || 0) > 0 ? parseFloat(selectedMentor.rating_avg).toFixed(1) : 'Baru'}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>({selectedMentor.total_reviews || 0} ulasan)</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    {[
                      { label: 'Pengalaman', value: selectedMentor.years_experience ? `${selectedMentor.years_experience} thn` : '—' },
                      { label: 'Ulasan', value: selectedMentor.total_reviews || 0 },
                      { label: 'Harga/Jam', value: selectedMentor.price_per_session > 0 ? `Rp ${(selectedMentor.price_per_session/1000).toFixed(0)}rb` : 'Gratis' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'var(--surface-secondary)', borderRadius: '8px', padding: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-brand)', letterSpacing: '-0.02em' }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {selectedMentor.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>{selectedMentor.bio}</p>}

                  {selectedMentor.expertise_tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {selectedMentor.expertise_tags.map((tag, i) => <span key={i} className="badge badge-blue">#{tag}</span>)}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push(`/mentoring/${selectedMentor.id}`)}
                      style={{ flex: 2, padding: '10px', borderRadius: '9px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                      📅 Book Sesi
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setReviewForm(f => ({ ...f, mentor_id: String(selectedMentor.id) })); setShowReviewModal(true); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1.5px solid var(--border-brand)', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      ⭐ Review
                    </motion.button>
                  </div>
                </div>

                {/* Reviews */}
                <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Ulasan ({mentorReviews.length})</h3>
                    {mentorReviews.length > 0 && <span style={{ fontSize: '18px', fontWeight: 800, color: '#D97706' }}>{parseFloat(selectedMentor.rating_avg || 0).toFixed(1)} ★</span>}
                  </div>

                  {/* Rating bars */}
                  {mentorReviews.length > 0 && (
                    <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[5,4,3,2,1].map(star => {
                        const count = mentorReviews.filter(r => r != null && r.rating === star).length;
                        const pct = mentorReviews.length > 0 ? (count / mentorReviews.length) * 100 : 0;
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '20px', textAlign: 'right', fontWeight: 500 }}>{star}★</span>
                            <div style={{ flex: 1, height: '5px', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                                style={{ height: '100%', background: '#F59E0B', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', width: '16px' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {mentorReviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '10px' }}>Belum ada ulasan</p>
                      <button onClick={() => setShowReviewModal(true)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                        ⭐ Tulis Ulasan
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '260px', overflowY: 'auto' }}>
                      {mentorReviews.filter(r => r != null).map((r, i) => (
                        <div key={r.id} style={{ borderBottom: i < mentorReviews.length-1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            {r.users?.avatar_url ? <Image src={r.users.avatar_url} alt={r.users?.full_name || 'Foto pengguna'} width={26} height={26} style={{ borderRadius: '50%', objectFit: 'cover' }} /> :
                              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '9px', flexShrink: 0 }}>
                                {r.users?.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                              </div>}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.users?.full_name || 'User'}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1px' }}>
                              {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: '12px', color: n <= r.rating ? '#F59E0B' : 'var(--border-strong)' }}>★</span>)}
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                style={{ background: 'var(--surface-primary)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.01em' }}>⭐ Beri Ulasan</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>untuk <strong>{selectedMentor?.full_name}</strong></p>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                    {[1,2,3,4,5].map(n => (
                      <motion.span key={n} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
                        style={{ fontSize: '36px', cursor: 'pointer', color: n <= (hoverRating || reviewForm.rating) ? '#F59E0B' : 'var(--border-strong)', lineHeight: 1, userSelect: 'none' }}>★</motion.span>
                    ))}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>
                    {['', 'Mengecewakan', 'Kurang Baik', 'Cukup Baik', 'Bagus', 'Luar Biasa! 🎉'][reviewForm.rating]}
                  </p>
                </div>

                <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ulasanmu</label>
                    <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="Bagikan pengalamanmu dengan mentor ini..." rows={4}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '9px', border: '1.5px solid var(--border-default)', fontSize: '14px', outline: 'none', resize: 'vertical', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, boxSizing: 'border-box' }} required />
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right', marginTop: '4px' }}>{reviewForm.comment.length} karakter</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setShowReviewModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Batal</button>
                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: '11px', borderRadius: '9px', border: 'none', background: submitting ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                      {submitting ? 'Mengirim...' : '✓ Kirim Ulasan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}