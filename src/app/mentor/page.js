'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';

export default function MentorDashboard() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [mentorData, setMentorData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, menunggu: 0, dikonfirmasi: 0, selesai: 0, pendapatan: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'mentor') { router.push('/'); return; }
    if (user?.role === 'mentor') fetchAll();
  }, [loaded, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: mentor } = await supabase.from('mentors').select('*').eq('user_id_ref', user.id).single();
      if (!mentor) { router.push('/'); return; }
      setMentorData(mentor);
      const { data: b } = await supabase.from('mentor_bookings').select('*, users(full_name, email, avatar_url)').eq('mentor_id', mentor.id).order('booking_date', { ascending: true });
      setBookings(b || []);
      setStats({
        total: b?.length || 0,
        menunggu: b?.filter(x => x.status === 'Menunggu').length || 0,
        dikonfirmasi: b?.filter(x => x.status === 'Dikonfirmasi').length || 0,
        selesai: b?.filter(x => x.status === 'Selesai').length || 0,
        pendapatan: b?.filter(x => x.status === 'Selesai').reduce((s, x) => s + (x.total_price || 0), 0) || 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateBookingStatus = async (id, status) => {
    setUpdatingId(id);
    const { error } = await supabase.from('mentor_bookings').update({ status }).eq('id', id);
    setUpdatingId(null);
    if (error) { console.error(error); return; }
    const next = bookings.map(b => b.id === id ? { ...b, status } : b);
    setBookings(next);
    setStats({
      total: next.length,
      menunggu: next.filter(x => x.status === 'Menunggu').length,
      dikonfirmasi: next.filter(x => x.status === 'Dikonfirmasi').length,
      selesai: next.filter(x => x.status === 'Selesai').length,
      pendapatan: next.filter(x => x.status === 'Selesai').reduce((s, x) => s + (x.total_price || 0), 0),
    });
  };

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const card = isDark ? '#1E293B' : '#fff';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const subtle = isDark ? '#334155' : '#F1F5F9';

  const statusBadge = s => {
    const map = { 'Menunggu': 'badge-yellow', 'Dikonfirmasi': 'badge-green', 'Selesai': 'badge-blue', 'Ditolak': 'badge-red', 'Dibatalkan': 'badge-red' };
    return map[s] || 'badge-gray';
  };

  const DURATIONS = [{ value: 30, label: '30 mnt' }, { value: 60, label: '1 jam' }, { value: 90, label: '1.5 jam' }, { value: 120, label: '2 jam' }];

  const pendingBookings = bookings.filter(b => b.status === 'Menunggu').slice(0,4);
  const upcomingBookings = bookings.filter(b => b.status === 'Dikonfirmasi' && new Date(b.booking_date) >= new Date()).slice(0,4);

  if (!loaded || !user || user.role !== 'mentor') return null;

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, padding: '0 32px', display: 'flex', alignItems: 'center', height: '64px', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#16A34A,#15803D)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px' }}>CF</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: text, letterSpacing: '-0.01em' }}>SiapKerja.id</div>
            <div style={{ fontSize: '10px', color: muted, fontWeight: 500, letterSpacing: '0.04em' }}>PORTAL MENTOR</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{ width: '32px', height: '32px', borderRadius: '8px', border: `1px solid ${border}`, background: subtle, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isDark ? '☀️' : '🌙'}</button>
          <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: '#16A34A', color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>MENTOR</span>
          <span style={{ fontSize: '13px', color: text, fontWeight: 600 }}>{user.full_name}</span>
          <Link href="/" style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${border}`, color: muted, fontSize: '12px', textDecoration: 'none', fontWeight: 500, background: subtle }}>← App Utama</Link>
        </div>
      </div>

      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Mentor profile banner */}
        {mentorData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #16A34A 100%)', borderRadius: '14px', padding: '24px 28px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 14px rgba(22,163,74,0.2)' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            {mentorData.avatar_url ? <img src={mentorData.avatar_url} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 }} /> :
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '22px', flexShrink: 0, border: '3px solid rgba(255,255,255,0.3)' }}>
                {mentorData.full_name?.slice(0,1)}
              </div>}
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>{mentorData.full_name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginBottom: '10px' }}>{mentorData.expertise || 'Mentor'} {mentorData.years_experience ? `• ${mentorData.years_experience} tahun pengalaman` : ''}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)' }}>
                  ⭐ {mentorData.rating_avg > 0 ? parseFloat(mentorData.rating_avg).toFixed(1) : 'Baru'} ({mentorData.total_reviews || 0} ulasan)
                </span>
                {mentorData.price_per_session > 0 && <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.2)' }}>💰 Rp {(mentorData.price_per_session/1000).toFixed(0)}rb/jam</span>}
                <span style={{ background: mentorData.availability === 'Tersedia' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>
                  {mentorData.availability === 'Tersedia' ? '🟢' : '🔴'} {mentorData.availability}
                </span>
              </div>
            </div>
            <Link href="/mentor/profil" style={{ padding: '9px 18px', borderRadius: '9px', background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', flexShrink: 0 }}>Edit Profil</Link>
          </motion.div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Booking', value: stats.total, icon: '📋', color: '#2563EB' },
            { label: 'Menunggu', value: stats.menunggu, icon: '⏳', color: '#D97706' },
            { label: 'Terkonfirmasi', value: stats.dikonfirmasi, icon: '✅', color: '#16A34A' },
            { label: 'Selesai', value: stats.selesai, icon: '🏆', color: '#7C3AED' },
            { label: 'Pendapatan', value: stats.selesai > 0 ? `Rp ${(stats.pendapatan/1000).toFixed(0)}rb` : 'Rp 0', icon: '💰', color: '#16A34A' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -3 }} onClick={() => router.push('/mentor/bookings')}
              style={{ background: card, borderRadius: '10px', border: `1px solid ${border}`, borderTop: `3px solid ${s.color}`, padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px', fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { href: '/mentor/bookings', icon: '📋', label: 'Kelola Booking', desc: `${stats.menunggu} menunggu konfirmasi`, color: '#16A34A', bg: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4' },
            { href: '/mentor/profil', icon: '👤', label: 'Edit Profil Mentor', desc: 'Bio, keahlian, harga', color: '#2563EB', bg: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF' },
            { href: '/mentoring', icon: '🌐', label: 'Profil Publik', desc: 'Tampilan di halaman mentoring', color: '#7C3AED', bg: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
              onClick={() => router.push(item.href)}
              style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, padding: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '4px' }}>{item.label}</h3>
              <p style={{ fontSize: '12px', color: muted, margin: 0 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent bookings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { title: '⏳ Menunggu Konfirmasi', data: pendingBookings, emptyText: 'Tidak ada booking menunggu', link: '/mentor/bookings', color: '#D97706' },
            { title: '✅ Sesi Mendatang', data: upcomingBookings, emptyText: 'Belum ada sesi terjadwal', link: '/mentor/bookings', color: '#16A34A' },
          ].map((section, si) => (
            <div key={si} style={{ background: card, borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: text }}>{section.title}</h3>
                <Link href={section.link} style={{ fontSize: '12px', color: section.color, fontWeight: 600, textDecoration: 'none' }}>Lihat semua →</Link>
              </div>
              {loading ? <div style={{ padding: '16px' }}>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px' }} />)}</div> :
              section.data.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: muted, fontSize: '13px' }}>{section.emptyText}</div> :
              section.data.map((b, i) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: i < section.data.length-1 ? `1px solid ${border}` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = subtle} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {b.users?.avatar_url ? <img src={b.users.avatar_url} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>
                      {b.users?.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                    </div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.users?.full_name}</div>
                    <div style={{ fontSize: '11px', color: muted }}>{b.topic} • {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {b.booking_time}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <span className={`badge ${statusBadge(b.status)}`}>{b.status}</span>
                    {b.status === 'Menunggu' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => updateBookingStatus(b.id, 'Dikonfirmasi')} disabled={updatingId === b.id}
                          title="Konfirmasi" style={{ width: '26px', height: '26px', borderRadius: '7px', border: 'none', background: '#16A34A', color: '#fff', cursor: updatingId === b.id ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 700 }}>✓</button>
                        <button onClick={() => updateBookingStatus(b.id, 'Ditolak')} disabled={updatingId === b.id}
                          title="Tolak" style={{ width: '26px', height: '26px', borderRadius: '7px', border: `1px solid ${border}`, background: subtle, color: '#DC2626', cursor: updatingId === b.id ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 700 }}>✕</button>
                      </div>
                    )}
                    {b.status === 'Dikonfirmasi' && (
                      <button onClick={() => updateBookingStatus(b.id, 'Selesai')} disabled={updatingId === b.id}
                        style={{ padding: '4px 10px', borderRadius: '7px', border: 'none', background: '#2563EB', color: '#fff', cursor: updatingId === b.id ? 'wait' : 'pointer', fontSize: '11px', fontWeight: 700 }}>Tandai Selesai</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}