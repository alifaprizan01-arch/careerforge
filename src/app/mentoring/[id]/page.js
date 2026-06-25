'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';

function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < bp);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, [bp]);
  return m;
}

const DURATIONS = [
  { value: 30, label: '30 menit' },
  { value: 60, label: '1 jam' },
  { value: 90, label: '1.5 jam' },
  { value: 120, label: '2 jam' },
];

export default function MentorDetailPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const params = useParams();
  const mentorId = params?.id;
  const { user, loaded } = useUser();

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user && mentorId) fetchMentor(); }, [user, mentorId]);

  const fetchMentor = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('mentors').select('*').eq('id', mentorId).single();
    if (error) console.error(error);
    setMentor(data || null);
    setLoading(false);
  };

  const formatRupiah = (n) => 'Rp ' + (Number(n || 0)).toLocaleString('id-ID');

  // Harga per sesi dasar (per 1 jam), dipakai sebagai basis hitung total
  const baseRate = mentor?.price_per_session || mentor?.hourly_rate || 0;
  const totalPrice = Math.round((baseRate / 60) * duration);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!bookingDate || !bookingTime || !topic.trim()) {
      setError('Tanggal, jam, dan topik wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Buat booking dengan status "Menunggu" (mentor belum approve, terlepas dari status bayar)
      const { data: booking, error: bookingError } = await supabase
        .from('mentor_bookings')
        .insert([{
          user_id: user.id,
          mentor_id: mentor.id,
          booking_date: bookingDate,
          booking_time: bookingTime,
          duration_minutes: duration,
          topic: topic.trim(),
          message: message.trim() || null,
          status: 'Menunggu',
          total_price: totalPrice,
        }])
        .select('*')
        .single();

      if (bookingError) throw bookingError;

      // 2. Jika sesi gratis (harga 0), tidak perlu checkout — langsung selesai
      if (totalPrice <= 0) {
        router.push('/pembayaran?status=gratis');
        return;
      }

      // 3. Redirect ke checkout untuk simulasi pembayaran
      router.push(`/checkout?type=mentoring&refId=${booking.id}`);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat booking. Coba lagi.');
      setSubmitting(false);
    }
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, padding: isMobile ? '60px 12px 80px' : '32px', minWidth: 0 }}>

        {loading || !mentor ? (
          <div className="skeleton" style={{ height: '300px', borderRadius: '14px' }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: '24px', maxWidth: '1000px' }}>

            {/* Profil mentor */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '24px', boxShadow: 'var(--shadow-sm)', alignSelf: 'start' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                {mentor.avatar_url ? (
                  <img src={mentor.avatar_url} alt={mentor.full_name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-500),var(--brand-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '20px' }}>
                    {mentor.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <h1 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{mentor.full_name}</h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{mentor.title || 'Mentor'}{mentor.company ? ` • ${mentor.company}` : ''}</p>
                </div>
              </div>

              {mentor.bio && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>{mentor.bio}</p>}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {(mentor.expertise_tags || mentor.expertise || []).map((t, i) => (
                  <span key={i} className="badge badge-blue">{t}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <span>⭐ {mentor.rating_avg > 0 ? parseFloat(mentor.rating_avg).toFixed(1) : 'Baru'} ({mentor.total_reviews || 0} ulasan)</span>
                {mentor.years_experience > 0 && <span>💼 {mentor.years_experience} tahun</span>}
              </div>
            </motion.div>

            {/* Form booking */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>

              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Booking Sesi Mentoring</h2>

              {error && (
                <div style={{ padding: '10px 14px', background: 'var(--danger-50, #FEF2F2)', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '12.5px', marginBottom: '14px' }}>{error}</div>
              )}

              <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Tanggal</label>
                  <input type="date" min={today} value={bookingDate} onChange={e => setBookingDate(e.target.value)} required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Jam</label>
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Durasi</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {DURATIONS.map(d => (
                      <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                        style={{
                          padding: '7px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                          border: `1.5px solid ${duration === d.value ? 'var(--border-brand)' : 'var(--border-default)'}`,
                          background: duration === d.value ? 'var(--surface-brand)' : 'transparent',
                          color: duration === d.value ? 'var(--text-brand)' : 'var(--text-secondary)',
                        }}>{d.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Topik</label>
                  <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Misal: Review CV & strategi interview" required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>Catatan (opsional)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Ceritakan kebutuhanmu sebelum sesi..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-sans)', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--surface-brand)', borderRadius: '9px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total biaya</span>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-brand)' }}>{formatRupiah(totalPrice)}</span>
                </div>

                <button type="submit" disabled={submitting}
                  style={{ padding: '12px', borderRadius: '9px', border: 'none', background: submitting ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  {submitting ? 'Memproses...' : totalPrice > 0 ? 'Lanjut ke Pembayaran' : 'Booking Sekarang'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
