'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

/*
  Banner promo terisolasi + transisi CROSSFADE.

  Kenapa crossfade, bukan mode="wait":
  - mode="wait" membuat banner lama keluar SAMPAI HILANG dulu, baru banner baru
    masuk. Di antaranya ada satu momen kosong/transparan -> terlihat patah.
  - Crossfade: banner lama & baru ditumpuk (absolute) lalu saling memudar.
    Tidak ada momen kosong, jadi mulus.
  - Sebuah "sizer" tak terlihat di bawahnya menjaga tinggi kontainer selalu pas
    (di desktop maupun HP saat konten membungkus), supaya tidak ada loncatan tinggi.
*/

function BannerInner({ b, timeLeft, router }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '28px', background: b.bg_color || 'linear-gradient(120deg,#1E1B3A 0%,#2D2850 50%,#1A2540 100%)', padding: '34px 40px', flexWrap: 'wrap', overflow: 'hidden', minHeight: '210px', height: '100%', borderRadius: '24px' }}>
      <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '28%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

      <div style={{ flex: '1 1 360px', position: 'relative', zIndex: 1 }}>
        <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px', marginBottom: '14px', letterSpacing: '0.04em' }}>✨ PROMO SPESIAL</span>
        <h2 style={{ fontSize: '27px', fontWeight: 800, color: '#fff', lineHeight: 1.18, marginBottom: '10px', letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>{b.title}</h2>
        {b.subtitle && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.94)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '480px' }}>{b.subtitle}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {b.button_text && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => router.push(b.button_link || '/pelatihan')} style={{ background: '#fff', color: '#1E293B', border: 'none', padding: '12px 26px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
              {b.button_text}
            </motion.button>
          )}
          {b.show_countdown && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
              Berakhir dalam
              <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.28)', padding: '5px 12px', borderRadius: '8px', letterSpacing: '0.08em', fontWeight: 700 }}>{timeLeft}</span>
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: '0 0 auto', width: '260px', height: '160px', borderRadius: '18px', background: b.image_url ? '#fff' : 'rgba(255,255,255,0.18)', padding: b.image_url ? '10px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', overflow: 'hidden', boxShadow: b.image_url ? '0 14px 34px rgba(0,0,0,0.26)' : 'none', position: 'relative', zIndex: 1 }}>
        {b.image_url ? <img src={b.image_url} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} /> : '🚀'}
      </div>
    </div>
  );
}

export default function PromoBanner() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [bIdx, setBIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  // Ambil banner promo aktif
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('promo_banner')
        .select('*')
        .eq('active', true)
        .order('id');
      if (data) setBanners(data);
    })();
  }, []);

  // Auto-slide (satu timer, ganti tiap 6 detik)
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setBIdx((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(id);
  }, [banners.length]);

  // Countdown sampai akhir hari (hanya jika ada banner ber-countdown)
  const needCountdown = banners.some((b) => b.show_countdown);
  useEffect(() => {
    if (!needCountdown) return;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      let diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [needCountdown]);

  if (banners.length === 0) return null;

  const b = banners[bIdx];
  const go = (dir) => setBIdx((i) => (i + dir + banners.length) % banners.length);

  return (
    <div style={{ padding: '28px 24px 0', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
      <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 18px 44px rgba(10,8,30,0.28)' }}>

        {/* Stage crossfade: pengukur tinggi (tak terlihat) + lapisan animasi (absolute) */}
        <div style={{ position: 'relative' }}>
          {/* sizer: menentukan tinggi kontainer sesuai konten aktif */}
          <div aria-hidden style={{ visibility: 'hidden', pointerEvents: 'none' }}>
            <BannerInner b={b} timeLeft={timeLeft} router={router} />
          </div>

          {/* lapisan beranimasi, ditumpuk di atas sizer */}
          <AnimatePresence initial={false}>
            <motion.div
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <BannerInner b={b} timeLeft={timeLeft} router={router} />
            </motion.div>
          </AnimatePresence>
        </div>

        {banners.length > 1 && (<>
          <button onClick={() => go(-1)} aria-label="Sebelumnya" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.85)', color: '#1E293B', fontSize: '20px', cursor: 'pointer', zIndex: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <button onClick={() => go(1)} aria-label="Berikutnya" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.85)', color: '#1E293B', fontSize: '20px', cursor: 'pointer', zIndex: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </>)}

        {banners.length > 1 && (
          <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
            {banners.map((_, i) => (
              <button key={i} onClick={() => setBIdx(i)} aria-label={`Banner ${i + 1}`} style={{ width: i === bIdx ? '26px' : '9px', height: '9px', borderRadius: '999px', border: 'none', cursor: 'pointer', background: i === bIdx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width 0.25s ease, background 0.25s ease' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}