'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

export default function MentorBookingsPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [mentorData, setMentorData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [selected, setSelected] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'mentor') { router.push('/'); return; }
    if (user?.role === 'mentor') fetchAll();
  }, [loaded, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: mentor } = await supabase.from('mentors').select('*').eq('user_id_ref', user.id).single();
      setMentorData(mentor);
      const { data: b } = await supabase.from('mentor_bookings')
        .select('*, users(full_name, email, avatar_url, phone, bio, job_title)')
        .eq('mentor_id', mentor.id)
        .order('booking_date', { ascending: true });
      setBookings(b || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateBooking = async (id, updates, notifMsg) => {
    setSaving(id);
    try {
      await supabase.from('mentor_bookings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      const booking = bookings.find(b => b.id === id);
      if (booking && notifMsg) {
        await supabase.from('notifications').insert([{
          user_id: booking.user_id, title: 'Update Sesi Mentoring',
          message: notifMsg, type: 'mentoring', is_read: false,
        }]);
      }
      setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }));
      setMsg('Berhasil diperbarui!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setSaving(null); }
  };

  const confirmBooking = async (b) => {
    if (!meetingLink.trim()) { setMsg('Masukkan link meeting terlebih dahulu.'); return; }
    await updateBooking(b.id, { status: 'Dikonfirmasi', meeting_link: meetingLink },
      `Sesi mentoring kamu dengan ${mentorData?.full_name} pada ${new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} pukul ${b.booking_time} telah DIKONFIRMASI! 🎉\n\nLink Meeting: ${meetingLink}`
    );
    setMeetingLink('');
  };

  const rejectBooking = async (b) => {
    await updateBooking(b.id, { status: 'Ditolak', rejection_reason: rejectionReason },
      `Maaf, sesi mentoring kamu dengan ${mentorData?.full_name} pada ${new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} tidak dapat dikonfirmasi.${rejectionReason ? '\n\nAlasan: ' + rejectionReason : ''}`
    );
    setRejectionReason('');
  };

  const completeBooking = async (b) => {
    await updateBooking(b.id, { status: 'Selesai' },
      `Sesi mentoring kamu dengan ${mentorData?.full_name} telah selesai! 🏆 Terima kasih sudah belajar bersama. Jangan lupa berikan ulasan!`
    );
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
    'Menunggu': { bg: isDark ? '#451A03' : '#FFFBEB', color: isDark ? '#FCD34D' : '#D97706', border: isDark ? '#78350F' : '#FDE68A', icon: '⏳' },
    'Dikonfirmasi': { bg: c.greenLight, color: c.green, border: isDark ? '#166534' : '#BBF7D0', icon: '✅' },
    'Selesai': { bg: c.blueLight, color: c.blue, border: isDark ? '#1D4ED8' : '#BFDBFE', icon: '🏆' },
    'Dibatalkan': { bg: isDark ? '#450A0A' : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626', border: isDark ? '#7F1D1D' : '#FECACA', icon: '❌' },
    'Ditolak': { bg: isDark ? '#450A0A' : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626', border: isDark ? '#7F1D1D' : '#FECACA', icon: '❌' },
  };

  const DURATIONS = [{ value: 30, label: '30 mnt' }, { value: 60, label: '1 jam' }, { value: 90, label: '1.5 jam' }, { value: 120, label: '2 jam' }];

  const allStatuses = ['semua', 'Menunggu', 'Dikonfirmasi', 'Selesai', 'Ditolak', 'Dibatalkan'];
  const filtered = filter === 'semua' ? bookings : bookings.filter(b => b.status === filter);

  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '13px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  if (!loaded || !user || user.role !== 'mentor') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#065F46 0%,#16A34A 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(22,163,74,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/mentor" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Booking</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{bookings.length} total booking</span>
      </div>

      <main style={{ padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: c.greenLight, border: `1px solid ${c.green}44`, borderRadius: '8px', color: c.green, marginBottom: '16px', fontSize: '13px' }}>{msg}</motion.div>}

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {allStatuses.map(f => {
              const sc = f !== 'semua' ? statusConfig[f] : null;
              const count = f === 'semua' ? bookings.length : bookings.filter(b => b.status === f).length;
              return (
                <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)} style={{
                  padding: '7px 14px', borderRadius: '20px', border: `1px solid ${filter === f ? (sc?.color || c.green) : c.border}`,
                  background: filter === f ? (sc?.bg || c.greenLight) : 'transparent',
                  color: filter === f ? (sc?.color || c.green) : c.muted, fontSize: '13px', cursor: 'pointer', fontWeight: 500,
                }}>{f === 'semua' ? `Semua (${count})` : `${sc?.icon} ${f} (${count})`}</motion.button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px', alignItems: 'start' }}>
            {/* Booking list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {loading ? <p style={{ color: c.muted, padding: '20px', textAlign: 'center' }}>Memuat...</p> :
              filtered.length === 0 ? (
                <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  <p style={{ color: c.muted, fontSize: '13px' }}>Tidak ada booking.</p>
                </div>
              ) : filtered.map((b, i) => {
                const sc = statusConfig[b.status] || statusConfig['Menunggu'];
                const isSelected = selected?.id === b.id;
                const isPast = new Date(b.booking_date) < new Date();
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => { setSelected(b); setMeetingLink(b.meeting_link || ''); setRejectionReason(''); }}
                    whileHover={{ y: -1 }}
                    style={{ background: c.card, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer',
                      border: isSelected ? `2px solid ${c.green}` : `1px solid ${c.border}`,
                      boxShadow: isSelected ? `0 0 0 3px ${c.green}15` : 'none',
                      opacity: b.status === 'Dibatalkan' || b.status === 'Ditolak' ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {b.users?.avatar_url ? <img src={b.users.avatar_url} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '11px', flexShrink: 0 }}>
                          {b.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                        </div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: c.text, fontSize: '13px' }}>{b.users?.full_name}</div>
                        <div style={{ fontSize: '11px', color: c.muted }}>{b.topic}</div>
                        <div style={{ fontSize: '11px', color: c.muted, marginTop: '2px' }}>
                          {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {b.booking_time} • {DURATIONS.find(d => d.value === b.duration_minutes)?.label}
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: 500, flexShrink: 0 }}>{sc.icon} {b.status}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, overflow: 'hidden', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>

                {/* User info */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.border}`, background: isDark ? '#0F172A' : '#F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                    {selected.users?.avatar_url ? <img src={selected.users.avatar_url} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                        {selected.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                      </div>}
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{selected.users?.full_name}</h2>
                      <p style={{ fontSize: '13px', color: c.muted, marginBottom: '4px' }}>{selected.users?.job_title || 'Peserta'}</p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {selected.users?.email && <span style={{ fontSize: '12px', color: c.muted }}>✉️ {selected.users.email}</span>}
                        {selected.users?.phone && <span style={{ fontSize: '12px', color: c.muted }}>📞 {selected.users.phone}</span>}
                      </div>
                    </div>
                    {(() => { const sc = statusConfig[selected.status] || statusConfig['Menunggu']; return (
                      <span style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 600, flexShrink: 0 }}>{sc.icon} {selected.status}</span>
                    ); })()}
                  </div>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Booking detail */}
                  <div style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: '📅 Tanggal', value: new Date(selected.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                      { label: '🕐 Waktu', value: `${selected.booking_time} WIB` },
                      { label: '⏱ Durasi', value: DURATIONS.find(d => d.value === selected.duration_minutes)?.label },
                      { label: '💬 Topik', value: selected.topic },
                      { label: '💰 Biaya', value: selected.total_price > 0 ? `Rp ${selected.total_price?.toLocaleString('id-ID')}` : 'Gratis' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: c.muted }}>{item.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: c.text }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* User message */}
                  {selected.message && (
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '8px' }}>💬 Pesan dari Peserta</h3>
                      <div style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '8px', padding: '12px', border: `1px solid ${c.border}` }}>
                        <p style={{ fontSize: '13px', color: c.muted, lineHeight: 1.6, margin: 0 }}>{selected.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons by status */}
                  {selected.status === 'Menunggu' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '10px', border: `1px solid ${c.border}` }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: c.text, margin: 0 }}>⚡ Tindakan</h3>

                      {/* Confirm */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Link Meeting (Google Meet / Zoom)</label>
                        <input style={inp} value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
                          placeholder="https://meet.google.com/xxx-xxxx-xxx" />
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => confirmBooking(selected)} disabled={saving === selected.id}
                        style={{ padding: '10px', borderRadius: '8px', border: 'none', background: saving === selected.id ? '#93C5FD' : c.green, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                        {saving === selected.id ? 'Memproses...' : '✅ Konfirmasi & Kirim Link'}
                      </motion.button>

                      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Alasan Penolakan (opsional)</label>
                        <input style={inp} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Contoh: Jadwal bentrok, dll" />
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => rejectBooking(selected)} disabled={saving === selected.id}
                          style={{ width: '100%', padding: '9px', borderRadius: '8px', border: `1px solid ${isDark ? '#F87171' : '#DC2626'}`, background: 'transparent', color: isDark ? '#F87171' : '#DC2626', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}>
                          ❌ Tolak Booking
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {selected.status === 'Dikonfirmasi' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', background: c.greenLight, borderRadius: '10px', border: `1px solid ${c.green}44` }}>
                      <div>
                        <div style={{ fontSize: '12px', color: c.green, fontWeight: 500, marginBottom: '4px' }}>🔗 Link Meeting</div>
                        <a href={selected.meeting_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: c.blue, wordBreak: 'break-all' }}>{selected.meeting_link}</a>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => completeBooking(selected)} disabled={saving === selected.id}
                        style={{ padding: '10px', borderRadius: '8px', border: 'none', background: c.blue, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                        {saving === selected.id ? 'Memproses...' : '🏆 Tandai Sesi Selesai'}
                      </motion.button>
                    </div>
                  )}

                  {selected.status === 'Ditolak' && selected.rejection_reason && (
                    <div style={{ padding: '14px', background: isDark ? '#450A0A' : '#FEF2F2', borderRadius: '10px', border: `1px solid ${isDark ? '#7F1D1D' : '#FECACA'}` }}>
                      <div style={{ fontSize: '12px', color: isDark ? '#F87171' : '#DC2626', fontWeight: 500, marginBottom: '4px' }}>Alasan penolakan:</div>
                      <p style={{ fontSize: '13px', color: c.muted, margin: 0 }}>{selected.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
                <p style={{ color: c.muted, fontSize: '14px' }}>Pilih booking untuk melihat detail</p>
              </div>
            )}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}