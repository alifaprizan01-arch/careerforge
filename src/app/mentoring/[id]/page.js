'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import Sidebar from '../../components/Sidebar';

const TIME_SLOTS = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
const DURATIONS = [{ value: 30, label: '30 menit' }, { value: 60, label: '1 jam' }, { value: 90, label: '1.5 jam' }, { value: 120, label: '2 jam' }];
const TOPICS = ['Persiapan Interview', 'Review CV/Portfolio', 'Career Advice', 'Technical Skills', 'Salary Negotiation', 'Leadership', 'Lainnya'];

export default function BookingPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: pilih jadwal, 2: detail, 3: konfirmasi, 4: sukses
  const [bookedSlots, setBookedSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    booking_date: '',
    booking_time: '',
    duration_minutes: 60,
    topic: '',
    message: '',
  });

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user && params.id) fetchAll(); }, [user, params.id]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: m }, { data: b }, { data: mb }] = await Promise.all([
      supabase.from('mentors').select('*').eq('id', params.id).single(),
      supabase.from('mentor_bookings').select('booking_date, booking_time').eq('mentor_id', params.id).eq('status', 'Dikonfirmasi'),
      supabase.from('mentor_bookings').select('*').eq('user_id', user.id).eq('mentor_id', params.id).order('created_at', { ascending: false }),
    ]);
    setMentor(m);
    setBookedSlots(b || []);
    setMyBookings(mb || []);
    setLoading(false);
  };

  const isSlotBooked = (date, time) => bookedSlots.some(b => b.booking_date === date && b.booking_time === time);

  const handleBook = async () => {
    if (!form.booking_date || !form.booking_time || !form.topic) { setMsg('Lengkapi semua field.'); return; }
    setSaving(true);
    try {
      const totalPrice = mentor?.price_per_session ? Math.round((mentor.price_per_session * form.duration_minutes) / 60) : 0;
      const { data } = await supabase.from('mentor_bookings').insert([{
        user_id: user.id, mentor_id: parseInt(params.id),
        booking_date: form.booking_date, booking_time: form.booking_time,
        duration_minutes: form.duration_minutes, topic: form.topic,
        message: form.message, status: 'Menunggu', total_price: totalPrice,
      }]).select().single();

      // Notifikasi ke user
      await supabase.from('notifications').insert([{
        user_id: user.id, title: 'Booking Sesi Berhasil! 🎉',
        message: `Booking sesi dengan ${mentor?.full_name} pada ${new Date(form.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} pukul ${form.booking_time} telah dikirim. Menunggu konfirmasi mentor.`,
        type: 'mentoring', is_read: false,
      }]);

      setMyBookings(prev => [data, ...prev]);
      setStep(4);
    } catch (e) { setMsg('Gagal booking: ' + e.message); }
    finally { setSaving(false); }
  };

  const cancelBooking = async (id) => {
    await supabase.from('mentor_bookings').update({ status: 'Dibatalkan' }).eq('id', id);
    setMyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Dibatalkan' } : b));
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF', green: isDark ? '#4ADE80' : '#16A34A',
    greenLight: isDark ? '#14532D' : '#F0FDF4',
  };

  const statusConfig = {
    'Menunggu': { bg: isDark ? '#451A03' : '#FFFBEB', color: isDark ? '#FCD34D' : '#D97706', icon: '⏳' },
    'Dikonfirmasi': { bg: c.greenLight, color: c.green, icon: '✅' },
    'Selesai': { bg: isDark ? '#1E3A5F' : '#EFF6FF', color: c.blue, icon: '🏆' },
    'Dibatalkan': { bg: isDark ? '#450A0A' : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626', icon: '❌' },
  };

  const inp = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  const totalPrice = mentor?.price_per_session ? Math.round((mentor.price_per_session * form.duration_minutes) / 60) : 0;

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100vw - 220px)' }}>

        <div style={{ marginBottom: '20px' }}>
          <Link href="/mentoring" style={{ color: c.blue, textDecoration: 'none', fontSize: '13px' }}>← Kembali ke Mentoring</Link>
        </div>

        {loading ? <p style={{ color: c.muted }}>Memuat...</p> : !mentor ? <p style={{ color: c.muted }}>Mentor tidak ditemukan.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

            {/* Left: Booking form */}
            <div>
              {/* Mentor card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                {mentor.avatar_url ? <img src={mentor.avatar_url} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '22px', flexShrink: 0 }}>
                    {mentor.full_name?.slice(0,1)}
                  </div>}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{mentor.full_name}</h2>
                  <p style={{ fontSize: '14px', color: c.muted, marginBottom: '6px' }}>{mentor.expertise || 'Mentor'} {mentor.years_experience ? `• ${mentor.years_experience} tahun pengalaman` : ''}</p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#F59E0B' }}>{'★'.repeat(Math.round(mentor.rating_avg || 0))}{'☆'.repeat(5 - Math.round(mentor.rating_avg || 0))}</span>
                    <span style={{ fontSize: '12px', color: c.muted }}>{mentor.rating_avg > 0 ? parseFloat(mentor.rating_avg).toFixed(1) : 'Baru'} ({mentor.total_reviews || 0} ulasan)</span>
                    {mentor.price_per_session > 0 ? <span style={{ fontSize: '13px', fontWeight: 600, color: c.green }}>Rp {mentor.price_per_session?.toLocaleString('id-ID')}/jam</span> : <span style={{ fontSize: '13px', fontWeight: 600, color: c.green }}>Gratis</span>}
                  </div>
                </div>
              </motion.div>

              {/* Step indicator */}
              {step < 4 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
                  {['Pilih Jadwal', 'Detail Sesi', 'Konfirmasi'].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                        background: step > i + 1 ? c.green : step === i + 1 ? c.blue : isDark ? '#334155' : '#F1F5F9',
                        color: step >= i + 1 ? '#fff' : c.muted }}>
                        {step > i + 1 ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? c.text : c.muted }}>{s}</span>
                      {i < 2 && <div style={{ width: '32px', height: '2px', background: step > i + 1 ? c.green : c.border, borderRadius: '1px' }} />}
                    </div>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* Step 1: Pilih Jadwal */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>📅 Pilih Jadwal</h3>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '8px' }}>Tanggal Sesi</label>
                      <input type="date" min={minDateStr} value={form.booking_date}
                        onChange={e => setForm({ ...form, booking_date: e.target.value, booking_time: '' })}
                        style={inp} />
                    </div>

                    {form.booking_date && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '10px' }}>
                          Waktu yang Tersedia — {new Date(form.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
                          {TIME_SLOTS.map(time => {
                            const booked = isSlotBooked(form.booking_date, time);
                            const selected = form.booking_time === time;
                            return (
                              <motion.button key={time} whileTap={{ scale: 0.95 }} disabled={booked}
                                onClick={() => !booked && setForm({ ...form, booking_time: time })}
                                style={{
                                  padding: '12px', borderRadius: '10px', border: `2px solid ${selected ? c.blue : booked ? c.border : c.border}`,
                                  background: selected ? c.blueLight : booked ? isDark ? '#1E293B' : '#F8FAFC' : 'transparent',
                                  color: selected ? c.blue : booked ? c.muted : c.text,
                                  fontWeight: selected ? 700 : 400, fontSize: '14px', cursor: booked ? 'not-allowed' : 'pointer',
                                  opacity: booked ? 0.5 : 1, position: 'relative',
                                }}>
                                {time}
                                {booked && <div style={{ position: 'absolute', top: '4px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }} />}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '10px' }}>Durasi Sesi</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {DURATIONS.map(d => (
                          <motion.button key={d.value} whileTap={{ scale: 0.95 }} onClick={() => setForm({ ...form, duration_minutes: d.value })}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `2px solid ${form.duration_minutes === d.value ? c.blue : c.border}`,
                              background: form.duration_minutes === d.value ? c.blueLight : 'transparent',
                              color: form.duration_minutes === d.value ? c.blue : c.muted, fontWeight: form.duration_minutes === d.value ? 600 : 400, fontSize: '13px', cursor: 'pointer' }}>
                            {d.label}
                            {mentor.price_per_session > 0 && <div style={{ fontSize: '11px', marginTop: '2px' }}>Rp {Math.round((mentor.price_per_session * d.value) / 60).toLocaleString('id-ID')}</div>}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} disabled={!form.booking_date || !form.booking_time} onClick={() => setStep(2)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: !form.booking_date || !form.booking_time ? isDark ? '#334155' : '#E2E8F0' : c.blue, color: !form.booking_date || !form.booking_time ? c.muted : '#fff', fontWeight: 600, fontSize: '14px', cursor: !form.booking_date || !form.booking_time ? 'not-allowed' : 'pointer' }}>
                      Lanjut →
                    </motion.button>
                  </motion.div>
                )}

                {/* Step 2: Detail */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>📝 Detail Sesi</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '8px' }}>Topik yang Ingin Dibahas *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                          {TOPICS.map(t => (
                            <motion.button key={t} whileTap={{ scale: 0.97 }} onClick={() => setForm({ ...form, topic: t })}
                              style={{ padding: '10px 14px', borderRadius: '8px', border: `2px solid ${form.topic === t ? c.blue : c.border}`,
                                background: form.topic === t ? c.blueLight : 'transparent', color: form.topic === t ? c.blue : c.text,
                                fontWeight: form.topic === t ? 600 : 400, fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}>
                              {t}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '8px' }}>Pesan untuk Mentor (opsional)</label>
                        <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                          placeholder="Ceritakan lebih detail tentang apa yang ingin kamu pelajari atau masalah yang ingin kamu diskusikan..."
                          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                        <div style={{ fontSize: '11px', color: c.muted, textAlign: 'right', marginTop: '4px' }}>{form.message.length} karakter</div>
                      </div>
                    </div>

                    {msg && <div style={{ padding: '10px', background: isDark ? '#450A0A' : '#FEF2F2', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginTop: '12px' }}>{msg}</div>}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '14px', cursor: 'pointer' }}>← Kembali</button>
                      <motion.button whileTap={{ scale: 0.97 }} disabled={!form.topic} onClick={() => setStep(3)}
                        style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: !form.topic ? isDark ? '#334155' : '#E2E8F0' : c.blue, color: !form.topic ? c.muted : '#fff', fontWeight: 600, fontSize: '14px', cursor: !form.topic ? 'not-allowed' : 'pointer' }}>
                        Lanjut →
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Konfirmasi */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>✅ Konfirmasi Booking</h3>

                    <div style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '10px', padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Mentor', value: mentor.full_name },
                        { label: 'Tanggal', value: new Date(form.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                        { label: 'Waktu', value: `${form.booking_time} WIB` },
                        { label: 'Durasi', value: DURATIONS.find(d => d.value === form.duration_minutes)?.label },
                        { label: 'Topik', value: form.topic },
                        { label: 'Total Biaya', value: totalPrice > 0 ? `Rp ${totalPrice.toLocaleString('id-ID')}` : 'Gratis' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '13px', color: c.muted }}>{item.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: item.label === 'Total Biaya' ? c.green : c.text, textAlign: 'right', maxWidth: '60%' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: '12px 16px', background: c.blueLight, borderRadius: '8px', border: `1px solid ${c.blue}44`, marginBottom: '20px' }}>
                      <p style={{ fontSize: '12px', color: c.blue, margin: 0, lineHeight: 1.6 }}>
                        ℹ️ Booking akan dikirim ke mentor untuk dikonfirmasi. Kamu akan mendapat notifikasi setelah mentor mengkonfirmasi jadwal dan mengirimkan link meeting.
                      </p>
                    </div>

                    {msg && <div style={{ padding: '10px', background: isDark ? '#450A0A' : '#FEF2F2', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>{msg}</div>}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setStep(2)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '14px', cursor: 'pointer' }}>← Kembali</button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleBook} disabled={saving}
                        style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: saving ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Memproses...' : '🚀 Konfirmasi Booking'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Sukses */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '48px 24px', textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</motion.div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Booking Berhasil!</h2>
                    <p style={{ fontSize: '14px', color: c.muted, marginBottom: '24px', lineHeight: 1.6 }}>
                      Sesi dengan <strong>{mentor.full_name}</strong> pada <strong>{new Date(form.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</strong> pukul <strong>{form.booking_time}</strong> telah dikirim. Tunggu konfirmasi dari mentor ya!
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setStep(1); setForm({ booking_date: '', booking_time: '', duration_minutes: 60, topic: '', message: '' }); }}
                        style={{ padding: '11px 20px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '14px', cursor: 'pointer' }}>
                        Booking Lagi
                      </motion.button>
                      <Link href="/mentoring" style={{ padding: '11px 24px', borderRadius: '8px', border: 'none', background: c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}>
                        Kembali ke Mentoring
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Booking history */}
              {myBookings.length > 0 && step !== 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '14px' }}>Riwayat Booking dengan {mentor.full_name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {myBookings.map((b, i) => {
                      const sc = statusConfig[b.status] || statusConfig['Menunggu'];
                      return (
                        <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '10px', border: `1px solid ${c.border}` }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{sc.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{b.topic}</div>
                            <div style={{ fontSize: '12px', color: c.muted }}>
                              {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {b.booking_time} • {DURATIONS.find(d => d.value === b.duration_minutes)?.label}
                            </div>
                            {b.meeting_link && b.status === 'Dikonfirmasi' && (
                              <a href={b.meeting_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: c.blue, fontWeight: 500 }}>🔗 Link Meeting →</a>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: 500 }}>{b.status}</span>
                            {b.status === 'Menunggu' && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => cancelBooking(b.id)}
                                style={{ fontSize: '11px', color: isDark ? '#F87171' : '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Batalkan</motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Info panel */}
            <div style={{ position: 'sticky', top: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Summary card */}
              {form.booking_date && form.booking_time && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: '12px', border: `1px solid ${c.blue}44`, padding: '18px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: c.blue, marginBottom: '12px' }}>📋 Ringkasan</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: '👤', label: mentor.full_name },
                      { icon: '📅', label: new Date(form.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) },
                      { icon: '🕐', label: `${form.booking_time} WIB` },
                      { icon: '⏱', label: DURATIONS.find(d => d.value === form.duration_minutes)?.label },
                      form.topic && { icon: '💬', label: form.topic },
                    ].filter(Boolean).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: c.blue }}>
                        <span>{item.icon}</span><span>{item.label}</span>
                      </div>
                    ))}
                    {totalPrice > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${c.blue}44`, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: c.blue }}>Total</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: c.blue }}>Rp {totalPrice.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tips */}
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '12px' }}>💡 Tips Sesi Mentoring</h4>
                {[
                  'Siapkan pertanyaan spesifik sebelum sesi',
                  'Bagikan konteks masalah yang ingin dibahas',
                  'Catat poin-poin penting selama sesi',
                  'Follow up setelah sesi selesai',
                  'Berikan review jujur untuk membantu mentor',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', color: c.muted }}>
                    <span style={{ color: c.blue, flexShrink: 0 }}>•</span><span>{tip}</span>
                  </div>
                ))}
              </div>

              {/* Mentor bio */}
              {mentor.bio && (
                <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '18px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '10px' }}>Tentang Mentor</h4>
                  <p style={{ fontSize: '13px', color: c.muted, lineHeight: 1.6, margin: 0 }}>{mentor.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
