'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../lib/userContext';
import Sidebar from './components/Sidebar';

const S = {
  wrap: { display: 'flex', minHeight: '100vh', background: '#F8FAFC' },
  main: { marginLeft: '220px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100vw - 220px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' },
  badge: (color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
    background: color === 'blue' ? '#EFF6FF' : color === 'green' ? '#F0FDF4' : color === 'amber' ? '#FFFBEB' : '#F1F5F9',
    color: color === 'blue' ? '#2563EB' : color === 'green' ? '#16A34A' : color === 'amber' ? '#D97706' : '#64748B',
  }),
  btn: (variant) => ({
    padding: variant === 'sm' ? '6px 14px' : '9px 20px',
    borderRadius: '8px', border: 'none', fontWeight: 600,
    fontSize: variant === 'sm' ? '12px' : '14px', cursor: 'pointer',
    background: '#2563EB', color: '#fff', transition: 'background 0.15s',
  }),
  btnOutline: {
    padding: '7px 16px', borderRadius: '8px', border: '1px solid #2563EB',
    background: '#fff', color: '#2563EB', fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
  },
};

export default function Home() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [trayek, setTrayek] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [certCount, setCertCount] = useState(0);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: tr }, { data: ut }, { count }] = await Promise.all([
        supabase.from('trayek').select('*'),
        supabase.from('trainings').select('*'),
        supabase.from('user_trainings').select('*, trainings(title)').eq('user_id', user.id),
        supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setTrayek(t || []);
      setTrainings(tr || []);
      setUserTrainings(ut || []);
      setCertCount(count || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = trayek.filter(d => {
    const f = filter === 'semua' || d.jenis === filter;
    const s = !search || d.tujuan?.toLowerCase().includes(search.toLowerCase()) || d.asal?.toLowerCase().includes(search.toLowerCase());
    return f && s;
  });

  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) : '?';
  if (!loaded || !user) return null;

  return (
    <div style={S.wrap}>
      <Sidebar />
      <main style={S.main}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '2px' }}>Selamat datang kembali</p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>Hai, {user.full_name}! 👋</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href="/notifikasi" style={{
              width: '38px', height: '38px', borderRadius: '8px', background: '#fff',
              border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', textDecoration: 'none', fontSize: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>🔔</Link>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '13px',
            }}>{initials(user.full_name)}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Lowongan Tersedia', value: trayek.length, icon: '💼', color: '#EFF6FF', text: '#2563EB' },
            { label: 'Program Aktif', value: `${userTrainings.length}/${trainings.length}`, icon: '📚', color: '#F0FDF4', text: '#16A34A' },
            { label: 'Sertifikat', value: certCount, icon: '🏆', color: '#FFFBEB', text: '#D97706' },
            { label: 'Mentor', value: '8+', icon: '🎤', color: '#F5F3FF', text: '#7C3AED' },
          ].map((s, i) => (
            <div key={i} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: s.text }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
              borderRadius: '12px', padding: '28px 32px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '12px' }}>
                  SDGs 8 — Pekerjaan Layak
                </span>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Tingkatkan kariermu hari ini</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '0 0 20px' }}>Rekomendasi pekerjaan berbasis AI sesuai profilmu.</p>
                <Link href="/trayek" style={{ display: 'inline-block', background: '#fff', color: '#2563EB', fontWeight: 600, fontSize: '13px', padding: '9px 20px', borderRadius: '8px', textDecoration: 'none' }}>
                  Cari Lowongan →
                </Link>
              </div>
              <div style={{ fontSize: '80px', opacity: 0.2 }}>💼</div>
            </div>

            {/* Search + Filter */}
            <div style={S.card}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 14px' }}>
                  <span style={{ color: '#94A3B8' }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari posisi atau lokasi..."
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: '#0F172A' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['semua', 'Full Time', 'Remote', 'Setengah Hari'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                    fontSize: '12px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                    background: filter === f ? '#2563EB' : '#fff',
                    color: filter === f ? '#fff' : '#64748B',
                    borderColor: filter === f ? '#2563EB' : '#E2E8F0',
                  }}>{f}</button>
                ))}
              </div>

              {/* Job list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {loading ? (
                  <p style={{ color: '#94A3B8', padding: '20px 0', textAlign: 'center' }}>Memuat lowongan...</p>
                ) : filtered.length === 0 ? (
                  <p style={{ color: '#94A3B8', padding: '20px 0', textAlign: 'center' }}>Tidak ada lowongan ditemukan.</p>
                ) : filtered.slice(0, 6).map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 0', borderBottom: '1px solid #F1F5F9',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', background: '#EFF6FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '13px', color: '#2563EB', flexShrink: 0,
                    }}>{item.tujuan?.slice(0,2).toUpperCase() || 'CF'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '14px', marginBottom: '3px' }}>{item.tujuan || 'Lowongan'}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>{item.asal || '-'}</span>
                        <span style={S.badge(item.jenis === 'Remote' ? 'blue' : item.jenis === 'Full Time' ? 'green' : 'amber')}>
                          {item.jenis || 'Full Time'}
                        </span>
                      </div>
                    </div>
                    <Link href="/trayek" style={S.btnOutline}>Lamar</Link>
                  </div>
                ))}
              </div>
              {filtered.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Link href="/trayek" style={{ color: '#2563EB', fontSize: '13px', fontWeight: 600 }}>
                    Lihat semua {filtered.length} lowongan →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Profile completion */}
            <div style={S.card}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '14px' }}>Profil Kamu</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '16px',
                }}>{initials(user.full_name)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>{user.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ background: '#F1F5F9', borderRadius: '6px', height: '6px', marginBottom: '6px' }}>
                <div style={{ width: '65%', height: '100%', background: '#2563EB', borderRadius: '6px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Kelengkapan profil</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB' }}>65%</span>
              </div>
            </div>

            {/* Active trainings */}
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Pelatihan Aktif</h3>
                <Link href="/pelatihan" style={{ fontSize: '12px', color: '#2563EB', fontWeight: 500 }}>Lihat semua</Link>
              </div>
              {userTrainings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>Belum ada pelatihan aktif.</p>
                  <Link href="/pelatihan" style={{ ...S.btnOutline, fontSize: '12px', padding: '6px 14px' }}>+ Daftar Sekarang</Link>
                </div>
              ) : userTrainings.slice(0,3).map(ut => (
                <div key={ut.id} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>📚</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155', flex: 1 }}>{ut.trainings?.title || 'Pelatihan'}</span>
                    <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 600 }}>{ut.progress || 0}%</span>
                  </div>
                  <div style={{ height: '5px', background: '#EFF6FF', borderRadius: '3px' }}>
                    <div style={{ width: `${ut.progress || 0}%`, height: '100%', background: '#2563EB', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Interview AI */}
            <div style={{
              background: 'linear-gradient(135deg,#1E3A5F,#1E293B)',
              borderRadius: '12px', padding: '20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎤</div>
              <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: '14px', fontWeight: 700 }}>Simulasi Interview AI</h4>
              <p style={{ color: '#94A3B8', fontSize: '12px', margin: '0 0 14px', lineHeight: 1.5 }}>
                Latih wawancara & dapatkan feedback instan.
              </p>
              <Link href="/mentoring" style={{
                display: 'inline-block', background: '#2563EB', color: '#fff',
                fontWeight: 600, fontSize: '13px', padding: '9px 20px', borderRadius: '8px', textDecoration: 'none',
              }}>Mulai Simulasi</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
