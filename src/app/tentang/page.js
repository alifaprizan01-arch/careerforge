'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, delay },
});

const features = [
  { icon: '💼', title: 'Lowongan Kerja', desc: 'Ribuan lowongan dari berbagai perusahaan, lengkap dengan filter dan pelacakan status lamaran.' },
  { icon: '🎓', title: 'Pelatihan', desc: 'Kursus dan pelatihan untuk meningkatkan keahlian sesuai kebutuhan dunia kerja terkini.' },
  { icon: '🧭', title: 'Mentoring', desc: 'Terhubung dengan mentor berpengalaman untuk membimbing langkah kariermu.' },
  { icon: '📄', title: 'CV Builder', desc: 'Buat CV profesional dengan mudah, langsung dari profil dan dokumenmu.' },
  { icon: '🏆', title: 'Sertifikasi', desc: 'Kumpulkan sertifikat sebagai bukti kompetensi yang diakui.' },
  { icon: '📁', title: 'Manajemen Dokumen', desc: 'Simpan CV, portofolio, dan sertifikat di satu tempat, siap dilampirkan saat melamar.' },
];

const values = [
  { icon: '🌍', title: 'Aksesibilitas', desc: 'Membuka peluang kerja dan belajar untuk semua orang, tanpa terkecuali.' },
  { icon: '⚡', title: 'Pemberdayaan', desc: 'Membekali setiap individu dengan keahlian dan kepercayaan diri untuk berkembang.' },
  { icon: '✨', title: 'Kualitas', desc: 'Menghadirkan konten dan peluang yang relevan, terkurasi, dan tepercaya.' },
  { icon: '🤝', title: 'Kolaborasi', desc: 'Menjembatani pencari kerja, perusahaan, dan mentor dalam satu ekosistem.' },
];

const stats = [
  { value: '10K+', label: 'Pencari Kerja' },
  { value: '500+', label: 'Perusahaan Mitra' },
  { value: '1.2K+', label: 'Pelatihan' },
  { value: '95%', label: 'Tingkat Kepuasan' },
];

export default function TentangKamiPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, var(--brand-600), var(--brand-700))', padding: '72px 32px', color: '#fff', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ maxWidth: '760px', margin: '0 auto' }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '18px' }}>Tentang Kami</span>
            <h1 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>Membangun Karier, Memberdayakan Masa Depan</h1>
            <p style={{ fontSize: '17px', lineHeight: 1.7, opacity: 0.92 }}>
              CareerForge adalah platform karier yang menghubungkan pencari kerja dengan peluang, pelatihan, dan mentor terbaik —
              membantu setiap orang mendapatkan pekerjaan yang layak dan terus bertumbuh.
            </p>
          </motion.div>
        </section>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '56px 32px' }}>

          {/* Misi & Visi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '64px' }}>
            <motion.div {...fade(0)} style={cardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎯</div>
              <h2 style={headingStyle}>Misi Kami</h2>
              <p style={bodyStyle}>Memberi akses yang setara terhadap peluang kerja dan pengembangan keahlian, sehingga setiap individu dapat meraih karier yang bermakna dan berkelanjutan.</p>
            </motion.div>
            <motion.div {...fade(0.1)} style={cardStyle}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔭</div>
              <h2 style={headingStyle}>Visi Kami</h2>
              <p style={bodyStyle}>Menjadi ekosistem karier tepercaya yang mendorong pertumbuhan ekonomi inklusif dan menciptakan dampak nyata bagi dunia kerja di Indonesia.</p>
            </motion.div>
          </div>

          {/* Apa yang kami tawarkan */}
          <motion.div {...fade(0)} style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>Apa yang Kami Tawarkan</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Satu platform untuk seluruh perjalanan kariermu</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px', marginBottom: '64px' }}>
            {features.map((f, i) => (
              <motion.div key={f.title} {...fade(i * 0.06)} style={cardStyle}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{f.title}</h3>
                <p style={bodyStyle}>{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Statistik */}
          <motion.div {...fade(0)} style={{ background: 'var(--surface-brand)', border: '1px solid var(--border-brand)', borderRadius: '18px', padding: '36px', marginBottom: '64px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '24px', textAlign: 'center' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-brand)', letterSpacing: '-0.02em' }}>{s.value}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Nilai */}
          <motion.div {...fade(0)} style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px' }}>Nilai yang Kami Pegang</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Prinsip yang memandu setiap langkah kami</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px', marginBottom: '64px' }}>
            {values.map((v, i) => (
              <motion.div key={v.title} {...fade(i * 0.06)} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{v.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{v.title}</h3>
                <p style={bodyStyle}>{v.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* SDG 8 */}
          <motion.div {...fade(0)} style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '32px', marginBottom: '64px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: '#A21942', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textAlign: 'center', fontWeight: 800, fontSize: '13px', lineHeight: 1.1, padding: '8px' }}>SDG<br />8</div>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Komitmen pada SDG 8</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                CareerForge mendukung <strong>Tujuan Pembangunan Berkelanjutan ke-8</strong>: pekerjaan layak dan pertumbuhan ekonomi.
                Kami berupaya memperluas akses ke pekerjaan produktif, mendorong pengembangan keterampilan, dan menciptakan kesempatan yang adil bagi semua.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div {...fade(0)} style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--brand-600), var(--brand-700))', borderRadius: '20px', padding: '48px 32px', color: '#fff' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Siap memulai perjalanan kariermu?</h2>
            <p style={{ fontSize: '15px', opacity: 0.92, marginBottom: '24px' }}>Temukan lowongan, tingkatkan keahlian, dan wujudkan masa depan yang kamu impikan.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/trayek" style={{ padding: '12px 26px', borderRadius: '10px', background: '#fff', color: 'var(--brand-700)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Cari Lowongan</Link>
              <Link href="/pelatihan" style={{ padding: '12px 26px', borderRadius: '10px', background: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.35)' }}>Mulai Belajar</Link>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

const cardStyle = { background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' };
const headingStyle = { fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' };
const bodyStyle = { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 };