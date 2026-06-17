'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTheme } from '../../lib/themeContext';

// ====== DATA KONTEN (Terintegrasi Struktur Database Supabase) ======
const HEADLINE = 'Tempa Keahlian Profesional, Wujudkan Karier Impian.';
const SUBHEAD = 'Akses pelatihan komprehensif dari mentor ahli, bangun portofolio sertifikat, dan hubungkan keahlian Anda langsung dengan lowongan kerja industri dalam satu platform.';

const CATEGORIES = [
  'Semua Pelatihan', 'Pengembangan Web', 'Data & Analitik', 'Bisnis & Manajemen', 
  'Logistik & Supply Chain', 'Desain Grafis', 'Digital Marketing', 'Pengembangan Diri'
];

const COURSES = [
  { title: 'Dasar Pengembangan Web Modern dengan Next.js', cat: 'Pengembangan Web', icon: '💻', grad: 'linear-gradient(135deg, #2563EB, #7C3AED)', rating: 4.8, count: 1240, level: 'Pemula', price: 'Rp149.000' },
  { title: 'Manajemen Logistik & Operasional Pergudangan', cat: 'Logistik & Supply Chain', icon: '📦', grad: 'linear-gradient(135deg, #F59E0B, #D97706)', rating: 4.9, count: 850, level: 'Semua Tingkat', price: 'Rp199.000' },
  { title: 'Strategi Digital Marketing untuk UMKM Berkelanjutan', cat: 'Digital Marketing', icon: '📈', grad: 'linear-gradient(135deg, #16A34A, #0EA5E9)', rating: 4.7, count: 980, level: 'Pemula', price: 'Gratis' },
  { title: 'Google Data Analytics Kesiapan Kerja Profesional', cat: 'Data & Analitik', icon: '📊', grad: 'linear-gradient(135deg, #EF4444, #DB2777)', rating: 4.9, count: 2100, level: 'Menengah', price: 'Rp249.000' },
  { title: 'Persiapan Interview Kerja & Bedah CV Komprehensif', cat: 'Pengembangan Diri', icon: '🎤', grad: 'linear-gradient(135deg, #7C3AED, #4C1D95)', rating: 4.8, count: 760, level: 'Pemula', price: 'Gratis' },
  { title: 'Manajemen Rantai Pasok (Supply Chain) Internasional', cat: 'Logistik & Supply Chain', icon: '🚢', grad: 'linear-gradient(135deg, #6366F1, #3B82F6)', rating: 4.9, count: 420, level: 'Lanjutan', price: 'Rp299.000' },
];

const JOBS = [
  { title: 'Staff Operasional Gudang & Distribusi', company: 'PT. Logistik Nusantara Jaya', location: 'Bandung, Jawa Barat', type: 'Full-Time', salary: 'Kompetitif' },
  { title: 'Junior Frontend Developer (React/Next.js)', company: 'TechForge Solutions Indonessia', location: 'Jakarta Barat, DKI', type: 'Remote / WFH', salary: 'Rp6.000.000 - Rp9.000.000' },
  { title: 'Supervisor Supply Chain & Inventory Control', company: 'PT. Manufaktur Niaga Utama', location: 'Cimahi, Jawa Barat', type: 'Full-Time', salary: 'Negosiasi' },
];

const STATS = [
  { n: '15rb+', l: 'Peserta Aktif' },
  { n: '120+', l: 'Mitra Perusahaan' },
  { n: '50+', l: 'Mentor Praktisi Ahli' },
  { n: '94%', l: 'Tingkat Keterserapan Kerja' },
];

const TESTIMONIALS = [
  { quote: 'Lewat pelatihan intensif dan simulasi interview, saya berhasil diterima kerja di perusahaan impian saya di Bandung kurang dari satu bulan setelah lulus.', name: 'Alif A.', role: 'Alumni Logistik' },
  { quote: 'Modul pengajarannya sangat terstruktur seperti Udemy, namun keunggulannya adalah langsung terhubung ke bursa lowongan kerja industri lokal.', name: 'Rani K.', role: 'Career Switcher' },
  { quote: 'CV Builder dan fitur sertifikat otomatisnya sangat membantu merapikan portofolio saya hingga dilirik oleh HRD perusahaan nasional.', name: 'Dimas P.', role: 'Fresh Graduate' },
];

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('Semua Pelatihan');

  // Skema Pewarnaan Dinamis Udemy Modern
  const c = {
    bg: isDark ? '#0B1120' : '#FFFFFF',
    bgAlt: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#1C1D1F',
    muted: isDark ? '#94A3B8' : '#475569',
    purple: '#5624D0', // Warna Ungu Khas Udemy yang Sangat Elegan
    purpleHover: '#401B9C',
    star: '#E59819',
    purpleSoft: isDark ? 'rgba(86,36,208,0.18)' : '#F3E8FF',
  };

  const Stars = ({ r }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontWeight: 700, fontSize: '13px', color: c.star }}>{r.toFixed(1)}</span>
      <span style={{ color: c.star, fontSize: '12px', letterSpacing: '1px' }}>★★★★★</span>
    </div>
  );

  // Filter pelatihan berdasarkan kategori yang dipilih user
  const filteredCourses = activeCategory === 'Semua Pelatihan' 
    ? COURSES 
    : COURSES.filter(course => course.cat === activeCategory);

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: c.bg, color: c.text, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif', overflowX: 'hidden' }}>
      
      {/* ===== 1. NAVIGATION BAR ===== */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: isDark ? 'rgba(11,17,32,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'linear-gradient(135deg,#5624D0,#7C3AED)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff', fontWeight: 800, fontSize: '15px', justifyContent: 'center' }}>CF</div>
            <span style={{ fontWeight: 800, fontSize: '19px', letterSpacing: '-0.03em' }}>CareerForge</span>
          </div>

          {/* Search Bar Container */}
          <Link href="/auth" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', height: '44px', padding: '0 18px', borderRadius: '999px', border: `1px solid ${c.border}`, background: c.bgAlt, color: c.muted, textDecoration: 'none', fontSize: '14px', maxWidth: '500px' }}>
            <span>🔍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Mau tingkatkan skill atau cari kerja apa hari ini?</span>
          </Link>

          {/* Right Action Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button onClick={toggleTheme} aria-label="Ganti tema" style={{ width: '40px', height: '40px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.bgAlt, cursor: 'pointer', fontSize: '16px' }}>{isDark ? '☀️' : '🌙'}</button>
            <Link href="/auth" style={{ padding: '10px 18px', borderRadius: '4px', border: `1px solid ${c.text}`, color: c.text, fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Masuk</Link>
            <Link href="/auth" style={{ padding: '10px 18px', borderRadius: '4px', background: c.purple, color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Daftar</Link>
          </div>
        </div>
      </nav>

      {/* ===== 2. HERO SECTION (Udemy Premium Layout) ===== */}
      <section className="hero-grid" style={{ position: 'relative', overflow: 'hidden', background: c.bgAlt, borderBottom: `1px solid ${c.border}`, padding: '80px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '48px', alignItems: 'center' }}>
          
          {/* Teks Kiri */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '4px', background: c.purpleSoft, color: c.purple, fontSize: '12px', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              🌍 Platform Kesiapan Kerja · Mendukung SDGs 8
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 20px', color: c.text }}>
              {HEADLINE}
            </h1>
            <p style={{ fontSize: '16px', color: c.muted, lineHeight: 1.65, maxWidth: '580px', margin: '0 0 32px' }}>
              {SUBHEAD}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 32px', borderRadius: '4px', background: c.purple, color: '#fff', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(86,36,208,0.25)' }}>Mulai Secara Gratis</Link>
              <a href="#pelatihan" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', borderRadius: '4px', border: `1px solid ${c.border}`, background: c.card, color: c.text, fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Jelajahi Kursus</a>
            </div>
          </div>

          {/* Banner Kanan (Featured Card Promonental) */}
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '4px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', width: '100%', maxWidth: '400px', justifySelf: 'center' }}>
            <div style={{ height: '180px', background: 'linear-gradient(135deg,#5624D0,#4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>📦</div>
            <div style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: c.purple, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rekomendasi Utama</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '8px 0 6px', lineHeight: 1.3 }}>Manajemen Logistik & Operasional Pergudangan</h3>
              <p style={{ fontSize: '13px', color: c.muted, margin: '0 0 12px' }}>Oleh Tim Praktisi Industri CareerForge</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Stars r={4.9} />
                <span style={{ fontSize: '12px', color: c.muted }}>(850 peserta)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '10px', borderTop: `1px solid ${c.border}` }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: c.text }}>Rp199.000</span>
                <Link href="/auth" style={{ padding: '10px 20px', borderRadius: '4px', background: c.purple, color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Ikuti Kelas</Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ===== 3. LOGO MITRA REKANAN TRADING BANNER ===== */}
      <section style={{ borderBottom: `1px solid ${c.border}`, background: c.bg, py: '32px', padding: '24px 0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ fontSize: '13px', color: c.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '18px' }}>
            Telah Dipercaya oleh Berbagai Perusahaan & UMKM Penyalur Kerja Nasional
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '48px', opacity: 0.5, fontWeight: 700, fontSize: '18px', color: c.text }}>
            <span>LOGISTIK INDONESIA</span>
            <span>TECH SOLUTIONS</span>
            <span>MANUFAKTUR UTAMA</span>
            <span>DISTRIBUSI NUSANTARA</span>
          </div>
        </div>
      </section>

      {/* ===== 4. SECTION PELATIHAN POPULER (Udemy Tab Interface) ===== */}
      <section id="pelatihan" style={{ maxWidth: '1240px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Pilih Pelatihan yang Sesuai dengan Kebutuhanmu</h2>
          <p style={{ fontSize: '15px', color: c.muted }}>Kurikulum komprehensif yang dirancang khusus oleh mentor ahli untuk kesiapan dunia kerja nyata.</p>
        </div>

        {/* Tab Filter Navigasi */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: '16px', borderBottom: `1px solid ${c.border}`, marginBottom: '32px', overflowX: 'auto', pb: '2px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                paddingBottom: '12px',
                background: 'none',
                border: 'none',
                borderBottom: activeCategory === cat ? `2px solid ${isDark ? '#8B5CF6' : c.text}` : '2px solid transparent',
                color: activeCategory === cat ? c.text : c.muted,
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid Kartu Kursus */}
        <div className="grid-responsive-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, i) => (
              <motion.div 
                key={course.title} 
                initial={{ opacity: 0, y: 16 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.3, delay: (i % 4) * 0.05 }}
              >
                <Link href="/auth" className="udemy-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '4px', background: c.card, overflow: 'hidden' }}>
                  <div style={{ height: '140px', background: course.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>{course.icon}</div>
                  <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{course.cat}</span>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0', lineHeight: 1.35, color: c.text, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
                      <p style={{ fontSize: '12px', color: c.muted, marginBottom: '8px' }}>Oleh Praktisi CareerForge</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <Stars r={course.rating} />
                        <span style={{ fontSize: '11px', color: c.muted }}>({course.count})</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${c.border}` }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: c.text }}>{course.price}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: c.purpleSoft, color: c.purple }}>{course.level}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: c.muted }}>
              Belum ada pelatihan untuk kategori ini.
            </div>
          )}
        </div>
      </section>

      {/* ===== 5. SECTION LOWONGAN KERJA TERBARU (Database Jobs Section) ===== */}
      <section style={{ background: isDark ? '#0F172A' : '#1C1D1F', color: '#FFFFFF', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFF', marginBottom: '8px' }}>Eksplorasi Peluang Kerja Terbaru</h2>
              <p style={{ fontSize: '15px', color: '#94A3B8' }}>Lamar lowongan kerja strategis yang terintegrasi langsung dengan keahlian pelatihan Anda.</p>
            </div>
            <Link href="/auth" style={{ fontSize: '14px', fontWeight: 700, color: '#A78BFA', textDecoration: 'none' }}>Lihat Semua Lowongan →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {JOBS.map((job, idx) => (
              <div 
                key={idx} 
                className="job-card" 
                style={{ background: isDark ? '#1E293B' : '#2D2F31', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#C084FC', padding: '4px 10px', borderRadius: '2px', textTransform: 'uppercase' }}>{job.type}</span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFF', marginTop: '14px', marginBottom: '4px' }}>{job.title}</h3>
                  <p style={{ fontSize: '13px', color: '#CBD5E1' }}>{job.company}</p>
                </div>
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94A3B8' }}>
                  <span>📍 {job.location}</span>
                  <span style={{ color: '#FFF', fontWeight: 700 }}>Lamar Cepat</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. DASHBOARD STATS BAND ===== */}
      <section style={{ background: c.bgAlt, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '54px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {STATS.map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: c.purple, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: '14px', color: c.muted, marginTop: '8px', fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 7. TESTIMONIALS SECTION ===== */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>Cerita Sukses Alumni CareerForge</h2>
          <p style={{ fontSize: '15px', color: c.muted }}>Testimoni nyata dari para peserta yang berhasil mentransformasikan masa depan karier mereka.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: '4px', padding: '28px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '36px', color: c.purple, lineHeight: 1, marginBottom: '4px', fontFamily: 'serif' }}>“</div>
                <p style={{ fontSize: '14.5px', color: c.text, lineHeight: 1.6, fontStyle: 'italic', marginBottom: '20px' }}>{t.quote}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: `1px solid ${c.border}`, pt: '14px', paddingTop: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#5624D0,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                  {t.name.substring(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: c.text }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: c.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 8. SERTIFIKASI & TRUST SECTION ===== */}
      <section style={{ background: c.bgAlt, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>Dapatkan Sertifikasi Resmi Setiap Penyelesaian Pelatihan</h2>
          <p style={{ fontSize: '15px', color: c.muted, lineHeight: 1.7, marginBottom: '28px' }}>
            Setiap kelulusan kursus menghasilkan sertifikat digital tervalidasi yang dapat diunduh, disematkan langsung ke CV Builder CareerForge, serta dibagikan ke profil LinkedIn profesional Anda untuk menarik perhatian HRD rekanan.
          </p>
          <Link href="/auth" style={{ display: 'inline-flex', padding: '14px 32px', borderRadius: '4px', background: c.purple, color: '#fff', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Mulai Belajar Sekarang</Link>
        </div>
      </section>

      {/* ===== 9. HIGH-CONVERTING FINAL CTA ===== */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ overflow: 'hidden', borderRadius: '4px', background: 'linear-gradient(135deg, #1C1D1F 0%, #2D2F31 60%, #5624D0 100%)', padding: '60px 40px', textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' }}>Siap Mengakselerasi Masa Depan Kariermu?</h2>
          <p style={{ fontSize: '16px', color: '#E2E8F0', maxW: '500px', margin: '0 auto 32px', maxWidth: '550px', lineHeight: 1.6 }}>Bergabunglah bersama ribuan talenta terampil lainnya. Akses platform gratis hari ini tanpa biaya pendaftaran.</p>
          <Link href="/auth" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 36px', borderRadius: '4px', background: '#fff', color: '#1C1D1F', fontWeight: 800, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>Daftar Akun Gratis →</Link>
        </div>
      </section>

      {/* ===== 10. CLEAN FOOTER ===== */}
      <footer style={{ borderTop: `1px solid ${c.border}`, background: c.bg, padding: '32px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '4px', background: 'linear-gradient(135deg,#5624D0,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12px' }}>CF</div>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em' }}>CareerForge</span>
          </div>
          <span style={{ fontSize: '13px', color: c.muted }}>© {new Date().getFullYear()} CareerForge · Mendukung SDGs 8 (Pertumbuhan Ekonomi & Pekerjaan Layak)</span>
        </div>
      </footer>

    </div>
  );
}