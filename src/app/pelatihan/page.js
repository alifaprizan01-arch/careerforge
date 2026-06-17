'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';

/* ---- Visual helper: warna + emoji per kategori (aman untuk dark mode) ---- */
const PALETTES_LIGHT = [
  { bg: '#F5F3FF', fg: '#7C3AED' },
  { bg: '#EFF6FF', fg: '#1D4ED8' },
  { bg: '#F0FDF4', fg: '#16A34A' },
  { bg: '#FFFBEB', fg: '#D97706' },
  { bg: '#FDF2F8', fg: '#DB2777' },
];
const PALETTES_DARK = [
  { bg: 'rgba(124,58,237,0.16)', fg: '#C084FC' },
  { bg: 'rgba(37,99,235,0.15)', fg: '#93C5FD' },
  { bg: 'rgba(34,197,94,0.12)', fg: '#4ADE80' },
  { bg: 'rgba(245,158,11,0.12)', fg: '#FCD34D' },
  { bg: 'rgba(236,72,153,0.14)', fg: '#F9A8D4' },
];
const EMOJI_RULES = [
  [/(ai|kecerdasan|gener|machine|ml)/, '🤖'],
  [/(data|analis|analyt|statist)/, '📊'],
  [/(web|program|develop|coding|software|it|teknolog)/, '💻'],
  [/(desain|design|ux|ui|grafis)/, '🎨'],
  [/(bisnis|business|manaj|management|wirausaha)/, '💼'],
  [/(market|pemasaran|digital|iklan)/, '📣'],
  [/(bahasa|language|english)/, '🗣️'],
  [/(keuang|finance|akun)/, '💰'],
  [/(produktiv|karir|career|soft)/, '🚀'],
];
const emojiFor = (name) => {
  const n = (name || '').toLowerCase();
  for (const [re, e] of EMOJI_RULES) if (re.test(n)) return e;
  return '📘';
};

export default function PelatihanPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [trainings, setTrainings] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('semua');
  const [activeTab, setActiveTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [msg, setMsg] = useState('');
  const [showPromo, setShowPromo] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const trackRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: tr }, { data: ut }, { data: cat }] = await Promise.all([
      supabase.from('trainings').select('*, training_categories(name)'),
      supabase.from('user_trainings').select('*, trainings(title,description)').eq('user_id', user.id),
      supabase.from('training_categories').select('*'),
    ]);
    setTrainings(tr || []); setUserTrainings(ut || []); setCategories(cat || []);
    setLoading(false);
  };

  const handleDaftar = async (training) => {
    if (userTrainings.find(u => u.training_id === training.id)) return;
    setEnrolling(training.id);
    try {
      const { data } = await supabase.from('user_trainings')
        .insert([{ user_id: user.id, training_id: training.id, progress: 0 }])
        .select('*, trainings(title,description)').single();
      setUserTrainings(prev => [...prev, data]);
      setMsg('✓ Berhasil mendaftar: ' + training.title);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
    finally { setEnrolling(null); }
  };

  const getModuleCount = async (trainingId) => {
    const { count } = await supabase.from('training_modules')
      .select('*', { count: 'exact', head: true }).eq('training_id', trainingId);
    return count || 0;
  };

  const filtered = trainings.filter(t => {
    const cat = catFilter === 'semua' || t.training_categories?.name === catFilter;
    const s = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return cat && s;
  });

  const completedCount = userTrainings.filter(u => u.progress >= 100).length;

  const levelColor = (level) => {
    if (level === 'Pemula') return 'badge-green';
    if (level === 'Menengah') return 'badge-yellow';
    if (level === 'Mahir') return 'badge-red';
    return 'badge-gray';
  };

  /* ---- Carousel + kategori helpers ---- */
  const catIndex = (name) => {
    const i = categories.findIndex(c => c.name === name);
    if (i >= 0) return i;
    let h = 0; for (const ch of (name || '')) h += ch.charCodeAt(0);
    return h;
  };
  const visualFor = (name) => {
    const p = (isDark ? PALETTES_DARK : PALETTES_LIGHT)[catIndex(name) % 5];
    return { ...p, emoji: emojiFor(name) };
  };
  const CARD_STEP = 196; // lebar kartu (180) + gap (16)
  const scrollCarousel = (dir) => trackRef.current?.scrollBy({ left: dir * CARD_STEP * 2, behavior: 'smooth' });
  const onTrackScroll = () => {
    const el = trackRef.current; if (!el) return;
    setCarouselIdx(Math.round(el.scrollLeft / CARD_STEP));
  };
  const pickCategory = (name) => {
    setCatFilter(name);
    setActiveTab('semua');
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pelatihan</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Tingkatkan skill dengan modul interaktif, video, dan kuis</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Terdaftar', value: userTrainings.length, color: 'var(--text-brand)' },
              { label: 'Selesai', value: completedCount, color: 'var(--text-success)' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '12px 18px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Promo banner */}
        <AnimatePresence>
          {showPromo && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--brand-600)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ flex: 1, color: '#fff', zIndex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px', lineHeight: 1.25 }}>Hemat 25% untuk satu tahun pembelajaran</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '16px', maxWidth: '440px' }}>
                  Paket Personal jadi pendamping karier Anda untuk skill AI dan keahlian terkini. Promo berakhir 14 Juni.
                </p>
                <button style={{ background: '#fff', color: 'var(--brand-700)', border: 'none', padding: '9px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  Hemat sekarang
                </button>
              </div>
              <div style={{ width: '120px', height: '100px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', flexShrink: 0 }}>🚀</div>
              <button onClick={() => setShowPromo(false)} aria-label="Tutup promo"
                style={{ position: 'absolute', top: '12px', right: '14px', background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {msg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 16px', background: 'var(--success-50)', border: '1px solid #BBF7D0', borderRadius: '8px', color: 'var(--text-success)', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</motion.div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '4px', marginBottom: '20px', boxShadow: 'var(--shadow-xs)' }}>
          {[{ id: 'semua', label: `Semua (${trainings.length})` }, { id: 'saya', label: `Pelatihanku (${userTrainings.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '9px', borderRadius: '8px', border: 'none', fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--brand-600)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
            }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'semua' && (
          <>
            {/* Carousel kategori — "Pelajari skill penting" */}
            {categories.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.7fr)', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '8px' }}>
                    Pelajari skill penting untuk karier dan kehidupan
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    CareerForge membantu Anda membangun keahlian yang dibutuhkan untuk maju di pasar kerja yang terus berubah.
                  </p>
                </div>

                <div>
                  <div ref={trackRef} onScroll={onTrackScroll}
                    style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '4px' }}>
                    {categories.map((c) => {
                      const v = visualFor(c.name);
                      const count = trainings.filter(t => t.training_categories?.name === c.name).length;
                      return (
                        <div key={c.id} onClick={() => pickCategory(c.name)}
                          style={{ flex: '0 0 180px', scrollSnapAlign: 'start', background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                          <div style={{ height: '96px', background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>{v.emoji}</div>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{c.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{count} kursus</span>
                              <span style={{ color: v.fg, fontSize: '15px' }}>→</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigasi carousel */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '14px' }}>
                    <button onClick={() => scrollCarousel(-1)} aria-label="Sebelumnya"
                      style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}>‹</button>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {categories.map((_, i) => (
                        <span key={i} style={{ width: i === carouselIdx ? '18px' : '7px', height: '7px', borderRadius: '999px', background: i === carouselIdx ? 'var(--brand-600)' : 'var(--border-strong)', transition: 'all 0.2s' }} />
                      ))}
                    </div>
                    <button onClick={() => scrollCarousel(1)} aria-label="Berikutnya"
                      style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}>›</button>
                  </div>
                </div>
              </div>
            )}

            {/* Search & filter */}
            <div ref={gridRef} style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '14px 16px', marginBottom: '16px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', border: '1.5px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pelatihan..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['semua', ...categories.map(c => c.name)].map(f => (
                  <button key={f} onClick={() => setCatFilter(f)} style={{
                    padding: '5px 12px', borderRadius: '20px',
                    border: `1px solid ${catFilter === f ? 'var(--border-brand)' : 'var(--border-default)'}`,
                    background: catFilter === f ? 'var(--surface-brand)' : 'transparent',
                    color: catFilter === f ? 'var(--text-brand)' : 'var(--text-secondary)',
                    fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)',
                  }}>{f === 'semua' ? 'Semua Kategori' : f}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '240px' }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🔍</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Tidak ada pelatihan yang cocok</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Coba ubah kata kunci atau kategori.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {filtered.map((t, i) => {
                  const enrolled = userTrainings.find(u => u.training_id === t.id);
                  const v = visualFor(t.training_categories?.name);
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: `1.5px solid ${enrolled ? 'var(--border-brand)' : 'var(--border-default)'}`, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>

                      {/* Card thumbnail — header berwarna sesuai kategori */}
                      <div style={{ position: 'relative', height: '110px', background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '46px' }}>
                        {v.emoji}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {enrolled && <span className="badge badge-green">✓ Terdaftar</span>}
                          {t.level && <span className={`badge ${levelColor(t.level)}`}>{t.level}</span>}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '14px 20px 16px' }}>
                        <span className="badge badge-blue" style={{ marginBottom: '8px', display: 'inline-flex' }}>{t.training_categories?.name || 'Umum'}</span>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 6px', lineHeight: 1.3 }}>{t.title}</h3>
                        {t.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{t.description.slice(0, 100)}...</p>}

                        {/* Meta info */}
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {t.duration_hours && <span>⏱️ {t.duration_hours} jam</span>}
                          {t.module_count && <span>📖 {t.module_count} modul</span>}
                          {t.quiz_count && <span>❓ {t.quiz_count} kuis</span>}
                        </div>

                        {/* Progress bar if enrolled */}
                        {enrolled && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Progress</span>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: enrolled.progress >= 100 ? 'var(--text-success)' : 'var(--text-brand)' }}>{enrolled.progress || 0}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${enrolled.progress || 0}%` }} transition={{ duration: 0.7 }}
                                style={{ height: '100%', background: enrolled.progress >= 100 ? 'var(--success-500)' : 'linear-gradient(90deg,var(--brand-500),var(--brand-400))', borderRadius: '3px' }} />
                            </div>
                          </div>
                        )}

                        {enrolled ? (
                          <Link href={`/pelatihan/${t.id}`} style={{ display: 'block', padding: '10px', borderRadius: '9px', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', textAlign: 'center', boxShadow: 'var(--shadow-brand)' }}>
                            {enrolled.progress >= 100 ? '✓ Selesai — Lihat Materi' : '▶ Lanjutkan Belajar'}
                          </Link>
                        ) : (
                          <button onClick={() => handleDaftar(t)} disabled={enrolling === t.id}
                            style={{ width: '100%', padding: '10px', borderRadius: '9px', border: 'none', background: enrolling === t.id ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                            {enrolling === t.id ? 'Mendaftar...' : 'Daftar Sekarang'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'saya' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {userTrainings.length === 0 ? (
              <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.4 }}>📚</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada pelatihan aktif</h3>
                <button onClick={() => setActiveTab('semua')} style={{ marginTop: '12px', padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Jelajahi Pelatihan</button>
              </div>
            ) : userTrainings.filter(ut => ut != null).map((ut, i) => (
              <motion.div key={ut.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '20px', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: ut.progress >= 100 ? 'var(--success-50)' : 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                  {ut.progress >= 100 ? '🏆' : '📚'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{ut.trainings?.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: ut.progress >= 100 ? 'var(--text-success)' : 'var(--text-brand)' }}>{ut.progress || 0}%</span>
                      {ut.progress >= 100 && <span className="badge badge-green">✓ Selesai</span>}
                    </div>
                  </div>
                  <div style={{ height: '8px', background: 'var(--surface-secondary)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ut.progress || 0}%` }} transition={{ duration: 0.8 }}
                      style={{ height: '100%', background: ut.progress >= 100 ? 'var(--success-500)' : 'linear-gradient(90deg,var(--brand-500),var(--brand-400))', borderRadius: '4px' }} />
                  </div>
                  <Link href={`/pelatihan/${ut.training_id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none', boxShadow: 'var(--shadow-brand)' }}>
                    {ut.progress >= 100 ? '✓ Lihat Materi' : '▶ Lanjutkan'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}