'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const sections = [
  { h: 'Komitmen Kami', p: 'CareerForge berkomitmen membuat platform yang dapat diakses oleh semua orang, termasuk penyandang disabilitas. Kami berupaya mengikuti praktik terbaik dan standar aksesibilitas web (WCAG) sebisa mungkin.' },
  { h: 'Fitur Aksesibilitas', p: 'Kami menyediakan kontras warna yang memadai, dukungan navigasi keyboard, teks alternatif pada elemen penting, serta mode gelap untuk kenyamanan membaca.' },
  { h: 'Keterbatasan yang Diketahui', p: 'Beberapa bagian mungkin masih dalam proses penyempurnaan. Kami terus memperbaiki pengalaman agar semakin inklusif.' },
  { h: 'Masukan', p: 'Jika kamu menemui hambatan aksesibilitas atau punya saran, kami sangat menghargai masukanmu agar dapat memperbaikinya.' },
];

export default function AksesibilitasPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pernyataan Aksesibilitas</h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>Kami ingin setiap orang dapat menggunakan CareerForge dengan nyaman.</p>
          </motion.div>
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)', marginTop: '20px' }}>
            {sections.map(s => (
              <div key={s.h} style={{ marginBottom: '22px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{s.h}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>{s.p}</p>
              </div>
            ))}
            <Link href="/hubungi" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '9px', background: 'var(--surface-brand)', color: 'var(--text-brand)', border: '1px solid var(--border-brand)', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Kirim Masukan Aksesibilitas</Link>
          </div>
        </div>
      </main>
    </div>
  );
}