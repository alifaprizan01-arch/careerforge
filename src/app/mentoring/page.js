'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function MentoringPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [mentors, setMentors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ mentor_id: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: m }, { data: r }] = await Promise.all([
      supabase.from('mentors').select('*'),
      supabase.from('mentoring_reviews').select('*, mentors(name)').order('created_at', { ascending: false }),
    ]);
    setMentors(m || []);
    setReviews(r || []);
    setLoading(false);
  };

  const handleReview = async e => {
    e.preventDefault();
    if (!reviewForm.mentor_id) { setMsg('Pilih mentor terlebih dahulu.'); return; }
    setSubmitting(true);
    try {
      await supabase.from('mentoring_reviews').insert([{
        user_id: user.id, mentor_id: parseInt(reviewForm.mentor_id),
        rating: reviewForm.rating, comment: reviewForm.comment,
      }]);
      setMsg('Review berhasil dikirim!');
      setReviewForm({ mentor_id: '', rating: 5, comment: '' });
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Gagal mengirim review.'); }
    finally { setSubmitting(false); }
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Mentoring</h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Bimbingan dari mentor berpengalaman & simulasi interview AI</p>

        {/* Interview AI Banner */}
        <div style={{
          background: 'linear-gradient(135deg,#1E3A5F,#2563EB)',
          borderRadius: '12px', padding: '24px 32px', display: 'flex', alignItems: 'center',
          gap: '24px', marginBottom: '28px',
        }}>
          <div style={{ fontSize: '48px' }}>🎤</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#fff', margin: '0 0 6px', fontSize: '18px', fontWeight: 700 }}>Simulasi Interview AI</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '13px' }}>Latih kemampuan wawancaramu dan dapatkan feedback instan dari AI.</p>
          </div>
          <button style={{ padding: '11px 24px', borderRadius: '8px', border: 'none', background: '#fff', color: '#2563EB', fontWeight: 700, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Mulai Simulasi →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>

          {/* Mentor list */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '16px' }}>Daftar Mentor</h3>
            {loading ? <p style={{ color: '#94A3B8' }}>Memuat...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mentors.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8', fontSize: '14px' }}>Belum ada mentor terdaftar.</p>
                  </div>
                ) : mentors.map(m => (
                  <div key={m.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                      {m.name?.slice(0,1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>{m.name}</p>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748B' }}>{m.expertise || 'Mentor'}</p>
                      {m.bio && <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{m.bio.slice(0,80)}...</p>}
                    </div>
                    <button onClick={() => setReviewForm(f => ({ ...f, mentor_id: String(m.id) }))} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #2563EB', color: '#2563EB', background: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                      Beri Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Review form + list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '14px' }}>Tulis Review</h3>
              {msg && <div style={{ padding: '8px 12px', background: '#F0FDF4', borderRadius: '6px', color: '#16A34A', fontSize: '13px', marginBottom: '12px' }}>{msg}</div>}
              <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select value={reviewForm.mentor_id} onChange={e => setReviewForm(f => ({ ...f, mentor_id: e.target.value }))}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', background: '#fff', color: '#0F172A' }}>
                  <option value="">Pilih Mentor</option>
                  {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Rating:</span>
                  {[1,2,3,4,5].map(n => (
                    <button type="button" key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                      style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', background: reviewForm.rating >= n ? '#FEF3C7' : '#F1F5F9' }}>⭐</button>
                  ))}
                </div>
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Tulis pengalamanmu..." rows={3}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#0F172A' }} />
                <button type="submit" disabled={submitting} style={{ padding: '9px', borderRadius: '8px', border: 'none', background: submitting ? '#93C5FD' : '#2563EB', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                  {submitting ? 'Mengirim...' : 'Kirim Review'}
                </button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '14px' }}>Review Terbaru</h3>
              {reviews.slice(0,4).map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{r.mentors?.name || 'Mentor'}</span>
                    <span style={{ fontSize: '12px', color: '#F59E0B' }}>{'⭐'.repeat(r.rating || 5)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{r.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && <p style={{ fontSize: '13px', color: '#94A3B8' }}>Belum ada review.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
