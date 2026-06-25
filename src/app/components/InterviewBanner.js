'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

/*
  Banner "Coba Simulasi Interview Dengan AI" — interaktif + statistik ASLI.

  Sumber angka:
  - "simulasi"            -> COUNT baris interview_sessions (head count, ringan)
  - "pertanyaan dijawab"  -> COUNT interview_questions yang user_answer terisi
  - "rating"             -> rata-rata kolom score (sampel 300 terbaru), dinormalkan ke skala 5
    Jika belum ada skor, baris rating disembunyikan (tidak mengarang angka).
  Jika semua data masih 0, ditampilkan ajakan "jadilah yang pertama" agar tidak tampak kosong.
*/

const ROLES = ['Software Engineer', 'UI/UX Designer', 'Data Analyst', 'Digital Marketing', 'Product Manager', 'Akuntan'];

// 1.250 -> "1,2rb" ; 1000 -> "1rb" ; 950 -> "950"
function fmt(n) {
  if (n == null) return '–';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'rb';
  return String(n);
}

// rata-rata score -> skala bintang 5 (menebak rentang skor secara adaptif: /5, /10, atau /100)
function toStars(avg) {
  if (avg == null) return null;
  let max = 100;
  if (avg <= 5) max = 5;
  else if (avg <= 10) max = 10;
  const r = Math.max(0, Math.min(5, (avg / max) * 5));
  return r.toFixed(1).replace('.', ',');
}

function SmartImage({ src, alt, fallbackBg, emoji }) {
  const [ok, setOk] = useState(true);
  return (
    <div style={{ position: 'relative', flex: 1, borderRadius: '16px', overflow: 'hidden', background: fallbackBg, minWidth: 0 }}>
      {ok ? (
        <motion.img
          src={src}
          alt={alt}
          onError={() => setOk(false)}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>{emoji}</div>
      )}
      <div className="ib-img-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent 55%)', opacity: 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }} />
    </div>
  );
}

export default function InterviewBanner() {
  const router = useRouter();
  const go = () => router.push('/interview');

  // sorotan kursor (tanpa re-render)
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(460px circle at ${mx}% ${my}%, rgba(255,255,255,0.18), transparent 60%)`;
  const cardRef = useRef(null);
  const onMove = (e) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  // teks posisi berganti
  const [roleIdx, setRoleIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRoleIdx((i) => (i + 1) % ROLES.length), 2200);
    return () => clearInterval(id);
  }, []);

  // statistik asli dari Supabase
  const [stats, setStats] = useState(null); // null = memuat
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sesRes, ansRes, scoreRes] = await Promise.all([
          supabase.from('interview_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('interview_questions').select('*', { count: 'exact', head: true }).not('user_answer', 'is', null),
          supabase.from('interview_questions').select('score').not('score', 'is', null).order('answered_at', { ascending: false }).limit(300),
        ]);
        let avg = null;
        const scores = scoreRes.data || [];
        if (scores.length) avg = scores.reduce((s, r) => s + (Number(r.score) || 0), 0) / scores.length;
        if (alive) setStats({ sessions: sesRes.count || 0, answered: ansRes.count || 0, rating: toStars(avg) });
      } catch (e) {
        if (alive) setStats({ sessions: 0, answered: 0, rating: null });
      }
    })();
    return () => { alive = false; };
  }, []);

  const hasData = stats && (stats.sessions > 0 || stats.answered > 0);

  return (
    <section style={{ padding: '40px 24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      <style>{`
        .ib-card:hover .ib-img-overlay { opacity: 1; }
        .ib-card:hover .ib-arrow { transform: translateX(4px); }
        .ib-card:hover .ib-cta { box-shadow: 0 10px 30px rgba(0,0,0,0.28); }
        @keyframes ib-float-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes ib-float-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(9px); } }
        @keyframes ib-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.82); } }
        @media (prefers-reduced-motion: reduce) {
          .ib-floatA, .ib-floatB, .ib-livedot { animation: none !important; }
        }
      `}</style>

      <motion.div
        ref={cardRef}
        className="ib-card"
        onClick={go}
        onMouseMove={onMove}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4 }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}
        style={{
          position: 'relative', borderRadius: '24px', padding: '48px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '40px', flexWrap: 'wrap', color: '#fff', cursor: 'pointer', overflow: 'hidden',
          background: 'linear-gradient(120deg, #1A1F36 0%, #2D2850 45%, #3B3060 100%)',
          boxShadow: '0 18px 50px rgba(20,15,40,0.35)',
        }}
      >
        {/* sorotan kursor */}
        <motion.div style={{ position: 'absolute', inset: 0, background: spotlight, pointerEvents: 'none' }} />
        {/* glow latar */}
        <motion.div
          aria-hidden
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-120px', right: '8%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(8px)', pointerEvents: 'none' }}
        />
        <div aria-hidden style={{ position: 'absolute', bottom: '-90px', left: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(60,40,120,0.45)', pointerEvents: 'none' }} />

        {/* Teks Kiri */}
        <div style={{ flex: '1 1 450px', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '18px' }}>
            <span className="ib-livedot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', animation: 'ib-pulse 1.4s ease-in-out infinite' }} />
            SIMULASI BERTENAGA AI
          </span>

          <h2 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Coba Simulasi Interview Dengan AI
          </h2>

          {/* posisi berganti */}
          <div style={{ height: '26px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'rgba(255,255,255,0.92)' }}>
            <span>Latihan untuk posisi:</span>
            <span style={{ position: 'relative', display: 'inline-block', minWidth: '170px', fontWeight: 700 }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={roleIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', padding: '2px 10px', borderRadius: '8px' }}
                >
                  {ROLES[roleIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', marginBottom: '26px', maxWidth: '440px', lineHeight: 1.6 }}>
            Siapkan skill Anda untuk interview yang lebih profesional. Dapatkan akses ke berbagai bidang pekerjaan yang terasa nyata.
          </p>

          <button
            className="ib-cta"
            onClick={(e) => { e.stopPropagation(); go(); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '13px 26px', background: '#fff', color: '#111827', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 6px 18px rgba(0,0,0,0.18)', transition: 'box-shadow 0.25s ease' }}
          >
            Mulai Interview AI
            <span className="ib-arrow" style={{ display: 'inline-block', transition: 'transform 0.25s ease' }}>→</span>
          </button>

          {/* baris statistik ASLI */}
          <div style={{ minHeight: '20px', display: 'flex', alignItems: 'center', gap: '18px', marginTop: '22px', fontSize: '13px', color: 'rgba(255,255,255,0.9)', flexWrap: 'wrap' }}>
            {stats == null ? (
              <span style={{ opacity: 0.7 }}>Memuat statistik…</span>
            ) : hasData ? (
              <>
                {stats.rating && (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>⭐ <strong>{stats.rating}</strong> rating</span>
                    <span style={{ opacity: 0.4 }}>•</span>
                  </>
                )}
                <span><strong>{fmt(stats.sessions)}</strong> simulasi</span>
                {stats.answered > 0 && (
                  <>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span><strong>{fmt(stats.answered)}</strong> pertanyaan dijawab</span>
                  </>
                )}
              </>
            ) : (
              <span style={{ opacity: 0.9 }}>✨ Jadilah salah satu yang pertama mencoba!</span>
            )}
          </div>
        </div>

        {/* Area Gambar */}
        <div style={{ flex: '0 0 400px', height: '240px', display: 'flex', gap: '16px', position: 'relative', zIndex: 1, maxWidth: '100%' }}>
          <div className="ib-floatA" style={{ flex: 1, display: 'flex', animation: 'ib-float-a 6s ease-in-out infinite' }}>
            <SmartImage
              src="https://i.pinimg.com/736x/4e/1f/49/4e1f49060ffa40da3c9b3750a2dac383.jpg"
              alt="Simulasi Interview"
              fallbackBg="linear-gradient(135deg,#3B82F6,#1E40AF)"
              emoji="🧑‍💼"
            />
          </div>
          <div className="ib-floatB" style={{ flex: 1, display: 'flex', animation: 'ib-float-b 6s ease-in-out infinite', animationDelay: '0.4s', position: 'relative' }}>
            <SmartImage
              src="https://i.pinimg.com/webp85/1200x/10/4b/2b/104b2b613ca32b6bac89f7d2772061be.webp"
              alt="Asisten AI"
              fallbackBg="linear-gradient(135deg,#6366F1,#4338CA)"
              emoji="🤖"
            />
            <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.05em' }}>AI</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}