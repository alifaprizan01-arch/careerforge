'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '../lib/userContext';
import { useTheme } from '../lib/themeContext';
import Sidebar from './components/Sidebar';
import { useSidebar } from '../lib/sidebarContext';
import { useLang } from '../lib/langContext';
import Footer from './components/Footer';
import PromoBanner from './components/Promobanner';
import InterviewBanner from './components/InterviewBanner';

/* ---- Visual helper: warna + emoji per kategori (aman untuk dark mode) ---- */
const PALETTES_LIGHT = [
  { bg: '#F5F3FF', fg: '#7C3AED', grad: 'linear-gradient(135deg, #7C3AED, #4C1D95)' },
  { bg: '#EFF6FF', fg: '#1D4ED8', grad: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
  { bg: '#F0FDF4', fg: '#16A34A', grad: 'linear-gradient(135deg, #16A34A, #0EA5E9)' },
  { bg: '#FFFBEB', fg: '#D97706', grad: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { bg: '#FDF2F8', fg: '#DB2777', grad: 'linear-gradient(135deg, #EF4444, #DB2777)' },
];
const PALETTES_DARK = [
  { bg: 'rgba(124,58,237,0.16)', fg: '#C084FC', grad: 'linear-gradient(135deg, #7C3AED, #4C1D95)' },
  { bg: 'rgba(37,99,235,0.15)', fg: '#93C5FD', grad: 'linear-gradient(135deg, #2563EB, #1D4ED8)' },
  { bg: 'rgba(34,197,94,0.12)', fg: '#4ADE80', grad: 'linear-gradient(135deg, #16A34A, #0EA5E9)' },
  { bg: 'rgba(245,158,11,0.12)', fg: '#FCD34D', grad: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { bg: 'rgba(236,72,153,0.14)', fg: '#F9A8D4', grad: 'linear-gradient(135deg, #EF4444, #DB2777)' },
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
  [/(logistik|gudang|supply|pergudangan)/, '📦'],
];
const emojiFor = (name) => {
  const n = (name || '').toLowerCase();
  for (const [re, e] of EMOJI_RULES) if (re.test(n)) return e;
  return '📘';
};

// Testimoni statis (belum ada tabel reviews di database, jadi dipertahankan sebagai konten pendukung)
// Testimoni diambil dari tabel 'testimonials' (dikelola sendiri lewat Supabase/admin)

const STATS = [
  { key: 'users', l: 'Peserta Aktif' },
  { key: 'companies', l: 'Mitra Perusahaan' },
  { key: 'mentors', l: 'Mentor Praktisi Ahli' },
  { key: 'trainings', l: 'Pelatihan Tersedia' },
];

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
  const isMobile = useIsMobile();
  const { isDark, toggleTheme } = useTheme();

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
  const gridRef = useRef(null);

  // State Sidebar & Promo
  const { isOpen: sidebarOpen } = useSidebar();
  const { t } = useLang();

  // Notifikasi
  const [unreadCount, setUnreadCount] = useState(0);
  const [statCounts, setStatCounts] = useState({});
  const [testimonials, setTestimonials] = useState([]);
  const [showTestiForm, setShowTestiForm] = useState(false);
  const [testiName, setTestiName] = useState('');
  const [testiRole, setTestiRole] = useState('');
  const [testiQuote, setTestiQuote] = useState('');
  const [testiBusy, setTestiBusy] = useState(false);
  const [testiMsg, setTestiMsg] = useState('');

  useEffect(() => {
    if (loaded && !user) router.push('/auth');
  }, [loaded, user]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

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

  useEffect(() => {
    (async () => {
      const tables = ['users', 'companies', 'mentors', 'trainings'];
      const res = await Promise.all(
        tables.map((tbl) => supabase.from(tbl).select('*', { count: 'exact', head: true }))
      );
      const next = {};
      tables.forEach((tbl, i) => {
        if (!res[i].error && typeof res[i].count === 'number') next[tbl] = res[i].count;
      });
      setStatCounts(next);

      const { data: tms } = await supabase
        .from('testimonials')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (tms) setTestimonials(tms);
    })();
  }, []);

  const submitTestimonial = async () => {
    if (!testiQuote.trim()) { setTestiMsg('Mohon tulis cerita Anda dulu.'); return; }
    setTestiBusy(true); setTestiMsg('');
    const { error } = await supabase.from('testimonials').insert({
      name: testiName.trim() || 'Anonim',
      role: testiRole.trim() || null,
      quote: testiQuote.trim(),
      active: false,
      sort_order: 0,
    });
    setTestiBusy(false);
    if (error) { setTestiMsg('Gagal mengirim. Coba lagi.'); return; }
    setTestiName(''); setTestiRole(''); setTestiQuote('');
    setShowTestiForm(false);
    setTestiMsg('Terima kasih! Testimoni Anda akan tampil setelah disetujui admin.');
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: tj }, { data: tr }, { data: ut }, { count: cc }, { count: ac }] = await Promise.all([
        supabase.from('trayek').select('*').order('id', { ascending: false }),
        supabase.from('trainings').select('*, training_categories(name, image_url)'),
        supabase.from('user_trainings').select('*, trainings(title)').eq('user_id', user.id),
        supabase.from('user_certifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setTrayek(tj || []);
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

  const courseCats = [...new Set(trainings.map(tn => tn.training_categories?.name).filter(Boolean))];
  const countFor = (name) => trainings.filter(tn => tn.training_categories?.name === name).length;
  const toggleSaved = (id) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const paletteAt = (i) => (isDark ? PALETTES_DARK : PALETTES_LIGHT)[i % 5];
  const visualFor = (name) => {
    let h = 0; for (const ch of (name || '')) h += ch.charCodeAt(0);
    return { ...paletteAt(h), emoji: emojiFor(name) };
  };
  const pickCat = (name) => {
    setHomeCat(name);
    setTimeout(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  if (!loaded) return null;
  if (!user) return null;

  // Kursus unggulan untuk kartu rekomendasi di hero (kursus pertama yang tersedia)
  const featured = trainings[0] || null;
  const featuredVisual = featured ? visualFor(featured.training_categories?.name || featured.title) : null;

  // 4 lowongan terbaru untuk section "Eksplorasi Peluang Kerja"
  const recentJobs = trayek.slice(0, 3);

  const cssVars = {
    radiusLg: '24px',
    radiusMd: '16px',
    radiusSm: '10px',
  };

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

        {/* ===== NAVBAR ATAS (gaya landing: logo + search pill + aksi) ===== */}
        <header style={{ position: 'sticky', top: 0, zIndex: 99, background: 'var(--surface-primary)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '10px 14px' : '14px 28px', gap: isMobile ? '10px' : '20px' }}>

            <div onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}>
              <img src="/logo.jpeg" alt="SiapKerja.id" style={{ width: isMobile ? '30px' : '34px', height: isMobile ? '30px' : '34px', borderRadius: cssVars.radiusSm, objectFit: 'cover' }} />
              {!isMobile && <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>SiapKerja.id</span>}
            </div>

            {!isMobile && (
              <button onClick={() => router.push('/pelatihan')} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>
                {t('Kategori')} ▾
              </button>
            )}

            {!isMobile && (
              <div style={{ flex: 1, position: 'relative', maxWidth: '440px' }}>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t('Mau tingkatkan skill atau cari kerja apa hari ini?')}
                  style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '999px', border: '1.5px solid var(--border-default)', fontSize: '14px', background: 'var(--surface-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>🔍</span>
              </div>
            )}

            {isMobile && <div style={{ flex: 1 }} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '14px' : '20px', fontSize: '14px', flexShrink: 0, marginLeft: isMobile ? 0 : 'auto' }}>
              <button onClick={toggleTheme} aria-label="Ganti tema" style={{ width: '36px', height: '36px', borderRadius: cssVars.radiusSm, border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', cursor: 'pointer', fontSize: '15px', display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isDark ? '☀️' : '🌙'}
              </button>

              {!isMobile && (
                <Link href="/pelatihan" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  📚 {t('Pelatihanku')} ({userTrainings.length})
                </Link>
              )}

              <Link href="/interview" style={{ textDecoration: 'none', color: 'var(--text-brand)', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', fontSize: isMobile ? '18px' : '14px' }}>
                🤖{!isMobile && ' Interview AI'}
              </Link>

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
          </div>

          {/* Baris search terpisah, full-width, khusus tampilan mobile */}
          {isMobile && (
            <div style={{ padding: '0 14px 12px', position: 'relative' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('Cari skill atau pekerjaan...')}
                style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '999px', border: '1.5px solid var(--border-default)', fontSize: '13px', background: 'var(--surface-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', left: '26px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '13px' }}>🔍</span>
            </div>
          )}
        </header>

        {/* ===== HERO SECTION (gaya landing: badge + judul besar + 2 CTA + kartu mengambang) ===== */}
        <section style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-default)', padding: isMobile ? '40px 18px' : '72px 32px' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: isMobile ? '32px' : '48px', alignItems: 'center' }}>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: cssVars.radiusSm, background: 'var(--surface-brand)', color: 'var(--text-brand)', fontSize: '12px', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                🌍 {t('Platform Kesiapan Kerja')} · {t('Mendukung SDGs 8')}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface-primary)', borderRadius: cssVars.radiusSm, padding: '6px 12px', marginBottom: '16px', boxShadow: 'var(--shadow-xs)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-brand)', fontWeight: 700 }}>{t('Selamat datang')}, {user.full_name?.split(' ')[0]} 👋</span>
              </div>

              <h1 style={{ fontSize: isMobile ? '28px' : 'clamp(32px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 18px', color: 'var(--text-primary)' }}>
                {t('Tempa Keahlian Profesional, Wujudkan Karier Impian.')}
              </h1>
              <p style={{ fontSize: isMobile ? '14px' : '16px', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '540px', margin: '0 0 24px' }}>
                {t('Akses pelatihan komprehensif dari mentor ahli, bangun portofolio sertifikat, dan hubungkan keahlian Anda langsung dengan lowongan kerja industri dalam satu platform.')}
              </p>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button onClick={() => router.push('/pelatihan')} style={{ padding: '14px 28px', background: 'var(--brand-600)', color: '#fff', border: 'none', borderRadius: cssVars.radiusSm, fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  {t('Jelajahi Kursus')} →
                </button>
                <button onClick={() => router.push('/trayek')} style={{ padding: '14px 26px', background: 'var(--surface-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: cssVars.radiusSm, fontWeight: 600, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  {t('Lihat trayek')}
                </button>
              </div>
            </motion.div>

            {/* Kartu kursus unggulan mengambang (data asli, bukan dummy) */}
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: cssVars.radiusLg, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.10)', width: '100%', maxWidth: '420px', justifySelf: isMobile ? 'stretch' : 'center' }}>
              {featured ? (
                <>
                  <div style={{ height: '160px', background: featuredVisual.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px', overflow: 'hidden', position: 'relative' }}>
                    {featured.thumbnail_url ? (
                      <img src={featured.thumbnail_url} alt={featured.title} onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : featuredVisual.emoji}
                  </div>
                  <div style={{ padding: '22px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('Rekomendasi Utama')}</span>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '8px 0 6px', lineHeight: 1.3, color: 'var(--text-primary)' }}>{featured.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '0 0 14px' }}>{featured.instructor || t('Oleh Praktisi SiapKerja.id')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-default)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-brand)' }}>{t('Ringkasan Aktivitas Anda')}</span>
                    </div>
                  </div>
                </>
              ) : null}

              <div style={{ padding: featured ? '0 22px 22px' : '22px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Pelatihan diikuti', value: userTrainings.length, emoji: '📚', color: 'var(--text-brand)' },
                    { label: 'Sertifikat', value: certCount, emoji: '🏆', color: 'var(--text-success)' },
                    { label: 'Lamaran terkirim', value: appliedCount, emoji: '📨', color: 'var(--text-warning)' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: cssVars.radiusSm, background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{s.emoji}</div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t(s.label)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== TRUST LOGOS BAND ===== */}
        <section style={{ borderBottom: '1px solid var(--border-default)', padding: isMobile ? '20px 16px' : '24px 24px' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
              {t('Telah Dipercaya oleh Berbagai Perusahaan & UMKM Penyalur Kerja Nasional')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '24px' : '48px', opacity: 0.55, fontWeight: 700, fontSize: isMobile ? '14px' : '17px', color: 'var(--text-primary)' }}>
              <span>LOGISTIK INDONESIA</span>
              <span>TECH SOLUTIONS</span>
              <span>MANUFAKTUR UTAMA</span>
              <span>DISTRIBUSI NUSANTARA</span>
            </div>
          </div>
        </section>

        {/* ===== BANNER PROMO (CAROUSEL) ===== */}
        <PromoBanner />

        {/* ===== SECTION PELATIHAN POPULER (gaya landing: tab kategori + grid gradient) ===== */}
        <section ref={gridRef} id="pelatihan" style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '40px 16px' : '64px 24px', width: '100%' }}>
          <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px', color: 'var(--text-primary)' }}>
                {t('Pilih Pelatihan yang Sesuai dengan Kebutuhanmu')}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {t('Kurikulum komprehensif yang dirancang khusus oleh mentor ahli untuk kesiapan dunia kerja nyata.')}
              </p>
            </div>
            <Link href="/pelatihan" style={{ fontSize: '13px', color: 'var(--text-brand)', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>{t('Lihat semua')} →</Link>
          </div>

          {/* Tab Filter Kategori */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '10px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['semua', ...courseCats].map((cat) => {
              const active = homeCat === cat;
              const label = cat === 'semua' ? t('Semua Pelatihan') : cat;
              return (
                <button
                  key={cat}
                  onClick={() => pickCat(cat)}
                  style={{
                    padding: '10px 18px',
                    background: active ? 'var(--brand-600)' : 'var(--surface-primary)',
                    border: active ? 'none' : '1px solid var(--border-default)',
                    borderRadius: '999px',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Grid Kartu Kursus (gradient warna-warni, border-radius besar) */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '260px', borderRadius: cssVars.radiusMd }} />)}
            </div>
          ) : filteredTrainings.length === 0 ? (
            <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: cssVars.radiusMd, padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>🔍</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{t('Tidak ada kursus yang cocok')}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>{t('Coba kategori lain atau ubah kata kunci pencarian.')}</p>
              <button onClick={() => { setHomeCat('semua'); setSearch(''); }}
                style={{ padding: '10px 20px', borderRadius: cssVars.radiusSm, border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                {t('Tampilkan semua')}
              </button>
            </div>
          ) : (
            <div className="grid-responsive-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {filteredTrainings.map((course, i) => {
                const v = visualFor(course.training_categories?.name || course.title);
                const isSaved = saved.includes(course.id);
                return (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}>
                    <div onClick={() => router.push(`/pelatihan/${course.id}`)}
                      className="course-card"
                      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: cssVars.radiusMd, background: 'var(--surface-primary)', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                      <div style={{ position: 'relative', height: '150px', background: v.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', overflow: 'hidden' }}>
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : v.emoji}
                        <button onClick={(e) => { e.stopPropagation(); toggleSaved(course.id); }}
                          aria-label={isSaved ? t('Hapus dari simpanan') : t('Simpan kursus')}
                          style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', color: isSaved ? '#EF4444' : 'var(--text-tertiary)', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
                          {isSaved ? '♥' : '♡'}
                        </button>
                      </div>
                      <div style={{ padding: '18px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          {course.training_categories?.name && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{course.training_categories.name}</span>
                          )}
                          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0', lineHeight: 1.35, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>{course.instructor || t('Oleh Praktisi SiapKerja.id')}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-warning)', fontWeight: 700 }}>
                            <span>4.8</span><span>⭐</span><span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(12)</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-default)' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Rp 149.000</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: 'var(--surface-brand)', color: 'var(--text-brand)' }}>{t('Lihat')} →</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ===== SECTION: Banner Interview AI (interaktif) ===== */}
        <InterviewBanner />

        {/* ===== SECTION LOWONGAN KERJA TERBARU (data asli dari tabel trayek) ===== */}
        <section style={{ background: isDark ? '#0F172A' : '#1C1D1F', padding: isMobile ? '40px 16px' : '64px 24px' }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <div>
                <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF', marginBottom: '8px' }}>{t('Eksplorasi Peluang Kerja Terbaru')}</h2>
                <p style={{ fontSize: '14px', color: '#94A3B8' }}>{t('Lamar lowongan kerja strategis yang terintegrasi langsung dengan keahlian pelatihan Anda.')}</p>
              </div>
              <Link href="/trayek" style={{ fontSize: '14px', fontWeight: 700, color: '#A78BFA', textDecoration: 'none', whiteSpace: 'nowrap' }}>{t('Lihat Semua Lowongan')} →</Link>
            </div>

            {recentJobs.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/trayek/${job.id}`)}
                    style={{ cursor: 'pointer', background: isDark ? '#1E293B' : '#2D2F31', border: '1px solid rgba(255,255,255,0.1)', padding: '22px', borderRadius: cssVars.radiusMd, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      {job.jenis && <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#C084FC', padding: '4px 10px', borderRadius: '999px', textTransform: 'uppercase' }}>{job.jenis}</span>}
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '14px', marginBottom: '4px' }}>{job.tujuan || job.title || t('Lowongan Tersedia')}</h3>
                      <p style={{ fontSize: '13px', color: '#CBD5E1' }}>{job.company || job.perusahaan || ''}</p>
                    </div>
                    <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94A3B8' }}>
                      <span>📍 {job.asal || job.location || '—'}</span>
                      <span style={{ color: '#FFF', fontWeight: 700 }}>{t('Lamar Cepat')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', background: 'rgba(255,255,255,0.03)', borderRadius: cssVars.radiusMd }}>
                {t('Belum ada lowongan tersedia saat ini.')}
              </div>
            )}
          </div>
        </section>

        {/* ===== DASHBOARD STATS BAND ===== */}
        <section style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '36px 16px' : '54px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '28px', textAlign: 'center' }}>
            {STATS.map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: 800, color: 'var(--text-brand)', letterSpacing: '-0.02em', lineHeight: 1 }}>{statCounts[s.key] == null ? '—' : statCounts[s.key].toLocaleString('id-ID')}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>{t(s.l)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TESTIMONIALS SECTION ===== */}
        {testimonials.length > 0 && (
        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: isMobile ? '40px 16px' : '64px 24px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: 'var(--text-primary)' }}>{t('Cerita Sukses Alumni SiapKerja.id')}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('Testimoni nyata dari para peserta yang berhasil mentransformasikan masa depan karier mereka.')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {testimonials.map((tm) => (
              <div key={tm.id} style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: cssVars.radiusMd, padding: '24px', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '32px', color: 'var(--text-brand)', lineHeight: 1, marginBottom: '4px', fontFamily: 'serif' }}>&ldquo;</div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '18px' }}>{tm.quote}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-default)', paddingTop: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                    {tm.name.substring(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{tm.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{tm.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Ajak pengguna berbagi testimoni */}
        <div style={{ textAlign: 'center', padding: isMobile ? '0 16px 36px' : '0 24px 44px' }}>
          <button onClick={() => { setTestiName(user?.name || user?.full_name || ''); setTestiMsg(''); setShowTestiForm(true); }}
            style={{ padding: '11px 22px', borderRadius: cssVars.radiusSm, border: '1px solid var(--border-default)', background: 'var(--surface-primary)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            ✍️ Punya cerita sukses? Bagikan
          </button>
          {testiMsg && !showTestiForm && <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{testiMsg}</p>}
        </div>

        {/* Modal form testimoni */}
        {showTestiForm && (
          <div onClick={() => setShowTestiForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-primary)', borderRadius: cssVars.radiusMd, border: '1px solid var(--border-default)', padding: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Bagikan Cerita Suksesmu</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Testimoni Anda akan ditampilkan setelah ditinjau admin.</p>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Nama</label>
              <input value={testiName} onChange={(e) => setTestiName(e.target.value)} placeholder="Nama Anda" style={{ width: '100%', padding: '10px 12px', borderRadius: cssVars.radiusSm, border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)', marginBottom: '12px', boxSizing: 'border-box' }} />
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Peran / Label</label>
              <input value={testiRole} onChange={(e) => setTestiRole(e.target.value)} placeholder="mis. Alumni 2026" style={{ width: '100%', padding: '10px 12px', borderRadius: cssVars.radiusSm, border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)', marginBottom: '12px', boxSizing: 'border-box' }} />
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Cerita Anda</label>
              <textarea value={testiQuote} onChange={(e) => setTestiQuote(e.target.value)} rows={4} placeholder="Ceritakan pengalaman Anda..." style={{ ...{ width: '100%', padding: '10px 12px', borderRadius: cssVars.radiusSm, border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)', marginBottom: '12px', boxSizing: 'border-box' }, resize: 'vertical' }} />
              {testiMsg && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{testiMsg}</p>}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button onClick={() => setShowTestiForm(false)} style={{ padding: '9px 16px', borderRadius: cssVars.radiusSm, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Batal</button>
                <button onClick={submitTestimonial} disabled={testiBusy} style={{ padding: '9px 18px', borderRadius: cssVars.radiusSm, border: 'none', background: 'var(--brand-600, #7C3AED)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: testiBusy ? 'default' : 'pointer', opacity: testiBusy ? 0.6 : 1 }}>{testiBusy ? 'Mengirim…' : 'Kirim'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SERTIFIKASI CTA ===== */}
        <section style={{ background: 'var(--surface-secondary)', borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', padding: isMobile ? '40px 16px' : '64px 24px' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>🏆</div>
            <h2 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px', color: 'var(--text-primary)' }}>{t('Dapatkan Sertifikasi Resmi Setiap Penyelesaian Pelatihan')}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              {t('Setiap kelulusan kursus menghasilkan sertifikat digital tervalidasi yang dapat diunduh, disematkan langsung ke CV Builder SiapKerja.id, serta dibagikan ke profil LinkedIn profesional Anda.')}
            </p>
            <button onClick={() => router.push('/pelatihan')} style={{ padding: '14px 30px', borderRadius: cssVars.radiusSm, border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {t('Mulai Belajar Sekarang')}
            </button>
          </div>
        </section>


        {/* ===== FINAL CTA ===== */}
        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: isMobile ? '40px 16px 0' : '0 24px 64px', width: '100%' }}>
          <div style={{ overflow: 'hidden', borderRadius: cssVars.radiusLg, background: 'linear-gradient(135deg, #1C1D1F 0%, #2D2F31 60%, var(--brand-600) 100%)', padding: isMobile ? '40px 24px' : '60px 40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' }}>{t('Siap Mengakselerasi Masa Depan Kariermu?')}</h2>
            <p style={{ fontSize: '15px', color: '#E2E8F0', maxWidth: '550px', margin: '0 auto 28px', lineHeight: 1.6 }}>{t('Lanjutkan pelatihanmu, lengkapi sertifikat, dan lamar lowongan terbaru yang sesuai keahlianmu.')}</p>
            <button onClick={() => router.push('/pelatihan')} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', borderRadius: cssVars.radiusSm, border: 'none', background: '#fff', color: '#1C1D1F', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
              {t('Lanjutkan Belajar')} →
            </button>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}