'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// 1. Tambahkan AnimatePresence untuk animasi pop-up badge notifikasi
import { motion, AnimatePresence } from 'framer-motion'; 
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../lib/userContext';
import { useTheme } from '../lib/themeContext';
import Landing from './components/Landing';
import Sidebar from './components/Sidebar';
import { useSidebar } from '../lib/sidebarContext';
import { useLang } from '../lib/langContext';
import Footer from './components/Footer';
import PromoBanner from './components/Promobanner';
import InterviewBanner from './components/InterviewBanner';

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
  [/(web|program|develop|coding|software|it|teknolog|perangkat)/, '💻'],
  [/(desain|design|ux|ui|grafis)/, '🎨'],
  [/(bisnis|business|manaj|management|wirausaha)/, '💼'],
  [/(market|pemasaran|digital|iklan)/, '📣'],
  [/(bahasa|language|english)/, '🗣️'],
  [/(keuang|finance|akun)/, '💰'],
  [/(produktiv|karir|career|soft|gaya hidup|hidup)/, '🚀'],
];
const emojiFor = (name) => {
  const n = (name || '').toLowerCase();
  for (const [re, e] of EMOJI_RULES) if (re.test(n)) return e;
  return '📘';
};

// Hook deteksi layar HP untuk tata letak responsif
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

export default function Home() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [heroSeed] = useState(() => Math.random());
  const isMobile = useIsMobile();
  const { isDark } = useTheme();

  // State Utama
  const [trayek, setTrayek] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [certCount, setCertCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [homeCat, setHomeCat] = useState('semua');
  const [saved, setSaved] = useState([]);
  const carRef = useRef(null);
  const gridRef = useRef(null);
  const [carIdx, setCarIdx] = useState(0);

  // State Sidebar & Promo
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const { t } = useLang();
  
  // 2. STATE BARU UNTUK NOTIFIKASI
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  // 3. EFFECT UNTUK MENGAMBIL DATA NOTIFIKASI SECARA REAL-TIME
  useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();
    
    const channel = supabase.channel('notif-badge-home')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchUnread)
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: tr }, { data: ut }, { count: cc }, { count: ac }] = await Promise.all([
        supabase.from('trayek').select('*').order('id', { ascending: false }),
        supabase.from('trainings').select('*, training_categories(name, image_url)'),
        supabase.from('user_trainings').select('*, trainings(title)').eq('user_id', user.id),
        supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setTrayek(t || []);
      setTrainings(tr || []);
      setUserTrainings(ut || []);
      setCertCount(cc || 0);
      setAppliedCount(ac || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainings = trainings.filter(course => {
    const matchSearch = !search || course.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = homeCat === 'semua' || course.training_categories?.name === homeCat;
    return matchSearch && matchCat;
  });

  const courseCats = [...new Set(trainings.map(t => t.training_categories?.name).filter(Boolean))];
  const catImages = {};
  trainings.forEach(tr => { const c = tr.training_categories; if (c?.name && c.image_url) catImages[c.name] = c.image_url; });
  const countFor = (name) => trainings.filter(t => t.training_categories?.name === name).length;
  const toggleSaved = (id) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const CAR_STEP = 252;
  const scrollCar = (dir) => carRef.current?.scrollBy({ left: dir * CAR_STEP * 2, behavior: 'smooth' });
  const onCarScroll = () => { const el = carRef.current; if (el) setCarIdx(Math.round(el.scrollLeft / CAR_STEP)); };
  const pickCat = (name) => {
    setHomeCat(name);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const initials = n => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) || '?';
  const adminHero = null; // gambar promo dipindah ke komponen PromoBanner
  const paletteAt = (i) => (isDark ? PALETTES_DARK : PALETTES_LIGHT)[i % 5];
  const visualFor = (name) => {
    let h = 0; for (const ch of (name || '')) h += ch.charCodeAt(0);
    return { ...paletteAt(h), emoji: emojiFor(name) };
  };

  if (!loaded) return null;
  if (!user) return <Landing />;

  const isAdmin = ['admin', 'superadmin'].includes((user.role || '').toLowerCase()) || user.is_admin === true;

  // Background hero sesuai peran (user diacak antara 2 gambar)
  const roleBg = {
    mentor: ['/BackGround_1.png'],
    company: ['/BackGround_2.png'],
    admin: ['/BackGround_3.png'],
    superadmin: ['/BackGround_3.png'],
    user: ['/BackGround_4.png', '/BackGround_5.png'],
  };
  const roleKey = (user.role || '').toLowerCase();
  const roleImgs = roleBg[roleKey] || roleBg.user;
  const heroImg = roleImgs[Math.floor(heroSeed * roleImgs.length)] || adminHero;
  const hasHero = !!heroImg;

  const heroStats = [
    { label: 'Pelatihan diikuti', value: userTrainings.length, emoji: '📚', color: 'var(--text-brand)' },
    { label: 'Sertifikat', value: certCount, emoji: '🏆', color: 'var(--text-success)' },
    { label: 'Lamaran terkirim', value: appliedCount, emoji: '📨', color: 'var(--text-warning)' },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', minHeight: '100vh' }}>

      <Sidebar />

      <div style={{
        paddingLeft: sidebarOpen ? '240px' : '0px',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'padding-left',
      }}>

        {/* NAVBAR ATAS */}
        <header style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border-default)', gap: '20px', background: 'var(--surface-primary)', position: 'sticky', top: 0, zIndex: 99 }}>

          <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover' }} />
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>SiapKerja.id</span>
          </div>

          <button onClick={() => router.push('/pelatihan')} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {t('Kategori')} ▾
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('Cari kursus atau pelatihan apa saja...')}
              style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: '24px', border: '1.5px solid var(--border-default)', fontSize: '14px', background: 'var(--surface-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>🔍</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '14px' }}>
            <Link href="/pelatihan" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500 }}>
              📚 {t('Pelatihanku')} ({userTrainings.length})
            </Link>
            <Link href="/interview" style={{ textDecoration: 'none', color: 'var(--text-brand)', fontWeight: 700 }}>
              🤖 Interview AI
            </Link>

            {/* 4. TOMBOL NOTIFIKASI YANG DIPINDAHKAN KE SINI */}
            <Link href="/notifikasi" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#fff', fontSize: '9px', fontWeight: 800, minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--surface-primary)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </header>

        {/* HERO SECTION */}
        <section style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: isMobile ? '32px 18px' : '56px 48px', margin: isMobile ? '14px 12px 0' : '20px 24px 0', borderRadius: '24px', background: hasHero ? '#E2E8F0' : 'var(--surface-secondary)', backgroundImage: hasHero ? `url(${heroImg})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          {hasHero && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.74) 0%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0.12) 100%)' }} />}

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1, maxWidth: '520px', flex: '1 1 420px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: hasHero ? 'rgba(255,255,255,0.88)' : 'var(--surface-brand)', borderRadius: '6px', padding: '5px 10px', marginBottom: '14px', boxShadow: hasHero ? '0 2px 6px rgba(0,0,0,0.06)' : 'none' }}>
              <span style={{ fontSize: '12px', color: hasHero ? '#6D28D9' : 'var(--text-brand)', fontWeight: 700, letterSpacing: '0.02em' }}>{t('Selamat datang')}, {user.full_name?.split(' ')[0]} 👋</span>
            </div>
            <h1 style={{ fontSize: isMobile ? '26px' : '38px', fontWeight: 800, lineHeight: 1.15, marginBottom: '16px', color: hasHero ? '#1E293B' : 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {t('Temukan ribuan kursus, mulai belajar hari ini')}
            </h1>
            <p style={{ fontSize: '16px', color: hasHero ? '#334155' : 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
              {t('Materi terbaik langsung dari instruktur ahli untuk mendukung perjalanan karier Anda.')}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/pelatihan')} style={{ padding: '13px 24px', background: 'var(--brand-600)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                {t('Jelajahi Kursus')} →
              </button>
              <button onClick={() => router.push('/lowongan')} style={{ padding: '13px 24px', background: hasHero ? 'rgba(255,255,255,0.95)' : 'var(--surface-primary)', color: hasHero ? '#1E293B' : 'var(--text-primary)', border: hasHero ? '1px solid rgba(0,0,0,0.08)' : '1px solid var(--border-default)', borderRadius: '10px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: hasHero ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                {t('Lihat Lowongan')}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            style={{ position: 'relative', zIndex: 1, flex: '1 1 320px', maxWidth: '420px', background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('Ringkasan Aktivitas Anda')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {heroStats.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.emoji}</div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{t(s.label)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ===== BANNER PROMO (CAROUSEL) ===== */}
        <PromoBanner />

        {/* ===== CAROUSEL: Pelajari skill penting ===== */}
        {courseCats.length > 0 && (
          <div style={{ padding: isMobile ? '24px 14px 0' : '40px 24px 0', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 0.8fr) minmax(0, 1.8fr)', gap: isMobile ? '16px' : '32px', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  Pelajari skill penting terkait karier dan kehidupan
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  SiapKerja.id membantu Anda membangun keahlian yang dibutuhkan dengan cepat dan memajukan karier di pasar kerja yang terus berubah.
                </p>
              </div>

              <div>
                <div ref={carRef} onScroll={onCarScroll}
                  style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: '4px' }}>
                  {courseCats.map((name) => {
                    const v = visualFor(name);
                    return (
                      <div key={name} onClick={() => pickCat(name)}
                        style={{ position: 'relative', flex: '0 0 240px', height: '300px', scrollSnapAlign: 'start', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', background: v.bg, transition: 'transform 0.15s', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '50px' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                        {catImages[name] ? (
                          <img src={catImages[name]} alt={name} onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '80px' }}>{v.emoji}</span>
                        )}
                        <div style={{ position: 'absolute', left: '14px', right: '14px', bottom: '14px', background: 'var(--surface-primary)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-md)' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{countFor(name)} kursus</div>
                          </div>
                          <span style={{ color: 'var(--text-brand)', fontSize: '18px' }}>→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '16px' }}>
                  <button onClick={() => scrollCar(-1)} aria-label="Sebelumnya"
                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: 'var(--shadow-xs)', fontSize: '16px' }}>‹</button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {courseCats.map((_, i) => (
                      <span key={i} style={{ width: i === carIdx ? '20px' : '8px', height: '8px', borderRadius: '999px', background: i === carIdx ? 'var(--brand-600)' : 'var(--border-strong)', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                  <button onClick={() => scrollCar(1)} aria-label="Berikutnya"
                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-secondary)', cursor: 'pointer', boxShadow: 'var(--shadow-xs)', fontSize: '16px' }}>›</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Banner Interview AI (interaktif) */}
        <InterviewBanner />
      

        {/* MAIN CONTENT SPLIT GRID */}
        <main ref={gridRef} style={{ padding: isMobile ? '24px 14px' : '40px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 3fr', gap: isMobile ? '20px' : '40px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '18px', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>{t('Kategori Utama')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ name: 'semua', label: 'Semua', emoji: '✨' }, ...courseCats.map(c => ({ name: c, label: c, emoji: emojiFor(c) }))].map((cat) => {
                const active = homeCat === cat.name;
                const iconBg = cat.name === 'semua' ? 'var(--surface-brand)' : visualFor(cat.name).bg;
                return (
                  <div key={cat.name} onClick={() => setHomeCat(cat.name)}
                    style={{ border: `1.5px solid ${active ? 'var(--brand-600)' : 'var(--border-default)'}`, borderRadius: '12px', padding: '16px 10px', textAlign: 'center', cursor: 'pointer', background: active ? 'var(--surface-brand)' : 'var(--surface-primary)', transition: 'all 0.15s', boxShadow: 'var(--shadow-xs)' }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}>
                    <div style={{ width: '42px', height: '42px', margin: '0 auto 8px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{cat.emoji}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--text-brand)' : 'var(--text-primary)' }}>{t(cat.label)}</div>
                    {cat.name !== 'semua' && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '3px' }}>{countFor(cat.name)} {t('kursus')}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                {homeCat === 'semua' ? t('Kursus Utama & Rekomendasi Untuk Anda') : `${t('Kursus')} ${homeCat}`}
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)', marginLeft: '8px' }}>({filteredTrainings.length})</span>
              </h2>
              <Link href="/pelatihan" style={{ fontSize: '13px', color: 'var(--text-brand)', fontWeight: 600, textDecoration: 'none' }}>{t('Lihat semua')} →</Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '250px' }} />)}
              </div>
            ) : filteredTrainings.length === 0 ? (
              <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>🔍</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Tidak ada kursus yang cocok')}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>{t('Coba kategori lain atau ubah kata kunci pencarian.')}</p>
                <button onClick={() => { setHomeCat('semua'); setSearch(''); }}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  {t('Tampilkan semua')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {filteredTrainings.map((course, i) => {
                  const v = visualFor(course.training_categories?.name || course.title);
                  const isSaved = saved.includes(course.id);
                  return (
                    <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      onClick={() => router.push(`/pelatihan/${course.id}`)}
                      className="course-card"
                      style={{ border: '1px solid var(--border-default)', borderRadius: '14px', display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'var(--surface-primary)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>

                      <div style={{ position: 'relative', height: '120px', background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden' }}>
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : v.emoji}
                        <button onClick={(e) => { e.stopPropagation(); toggleSaved(course.id); }}
                          aria-label={isSaved ? t('Hapus dari simpanan') : t('Simpan kursus')}
                          style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', color: isSaved ? '#EF4444' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
                          {isSaved ? '♥' : '♡'}
                        </button>
                      </div>

                      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          {course.training_categories?.name && <span className="badge badge-blue" style={{ marginBottom: '6px', display: 'inline-flex' }}>{course.training_categories.name}</span>}
                          <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '4px 0', lineHeight: 1.3, color: 'var(--text-primary)' }}>{course.title}</h3>
                          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '0 0 6px' }}>{course.instructor || t('Instruktur Ahli')}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-warning)', fontWeight: 700 }}>
                            <span>4.8</span><span>⭐</span><span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(12)</span>
                          </div>
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Rp 149.000</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-brand)' }}>{t('Lihat')} →</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}