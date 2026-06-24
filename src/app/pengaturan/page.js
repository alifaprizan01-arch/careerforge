'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';
import { useLang } from '../../lib/langContext';
import Sidebar from '../components/Sidebar';

const TABS = [
  { id: 'keamanan', label: 'Keamanan', icon: '🔒' },
  { id: 'tampilan', label: 'Tampilan', icon: '🎨' },
  { id: 'notif', label: 'Notifikasi & Privasi', icon: '🔔' },
];

const DEFAULT_PREFS = { emailNotif: true, notifLamaran: true, notifPelatihan: true, profilPublik: true, tampilkanEmail: false };

// Dipindah ke luar komponen agar tidak dibuat ulang (dan ikut di-unmount/mount ulang)
// setiap kali PengaturanPage re-render. Warna diterima lewat prop `c` karena
// komponen ini sekarang di luar closure state milik PengaturanPage.
function Toggle({ on, onClick, c, isDark }) {
  return (
    <button onClick={onClick} style={{ width: '46px', height: '26px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: on ? c.brand : (isDark ? '#3A3350' : '#D8D2E8'), position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <motion.span animate={{ left: on ? '23px' : '3px' }} style={{ position: 'absolute', top: '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

function Row({ title, desc, children, c }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: `1px solid ${c.border}` }}>
      <div><div style={{ fontSize: '14px', fontWeight: 600, color: c.text }}>{title}</div>{desc && <div style={{ fontSize: '12px', color: c.muted, marginTop: '3px' }}>{desc}</div>}</div>
      {children}
    </div>
  );
}

export default function PengaturanPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const [tab, setTab] = useState('keamanan');

  // Security
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null); // {type, text}

  // Appearance — bahasa diambil dari LanguageProvider (context)

  // Notif & privacy
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      // cadangan cepat dari perangkat
      try {
        const l = localStorage.getItem('cf_lang'); if (l) setLang(l);
        const p = localStorage.getItem('cf_prefs'); if (p) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(p) });
      } catch (err) {
        // localStorage bisa berisi data rusak (mis. JSON tidak valid setelah update versi lama);
        // log agar kelihatan di console saat debugging, tapi jangan hentikan render halaman.
        console.warn('Gagal memuat preferensi tersimpan dari localStorage:', err);
      }
      // sumber utama: database
      const { data } = await supabase.from('users')
        .select('email_notif, notif_lamaran, notif_pelatihan, profil_publik, tampilkan_email, bahasa')
        .eq('id', user.id).single();
      if (data) {
        setPrefs({
          emailNotif: data.email_notif ?? DEFAULT_PREFS.emailNotif,
          notifLamaran: data.notif_lamaran ?? DEFAULT_PREFS.notifLamaran,
          notifPelatihan: data.notif_pelatihan ?? DEFAULT_PREFS.notifPelatihan,
          profilPublik: data.profil_publik ?? DEFAULT_PREFS.profilPublik,
          tampilkanEmail: data.tampilkan_email ?? DEFAULT_PREFS.tampilkanEmail,
        });
        if (data.bahasa) setLang(data.bahasa);
      }
    })();
  }, [user]);

  const c = {
    bg: isDark ? '#0F0A1F' : '#FAF8FF', card: isDark ? '#1A1426' : '#fff',
    border: isDark ? '#2D2640' : '#ECE9F5', text: isDark ? '#F5F3FF' : '#1E1B2E',
    muted: isDark ? '#A99FC4' : '#6B6480', brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.18)' : '#F5F3FF', input: isDark ? '#0F0A1F' : '#FAF8FF',
  };
  const inp = { width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.text, fontFamily: 'inherit', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '7px' };

  const changePassword = async () => {
    setPwMsg(null);
    if (!pw.current || !pw.next || !pw.confirm) { setPwMsg({ type: 'err', text: 'Semua kolom wajib diisi.' }); return; }
    if (pw.next.length < 6) { setPwMsg({ type: 'err', text: 'Kata sandi baru minimal 6 karakter.' }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ type: 'err', text: 'Konfirmasi kata sandi tidak cocok.' }); return; }
    setSavingPw(true);
    try {
      const { data, error } = await supabase.from('users').select('password').eq('id', user.id).single();
      if (error) throw new Error('Tidak dapat memverifikasi kata sandi. (Pastikan kolom "password" ada di tabel users.)');
      if ((data?.password ?? '') !== pw.current) { setPwMsg({ type: 'err', text: 'Kata sandi saat ini salah.' }); setSavingPw(false); return; }
      const { error: uErr } = await supabase.from('users').update({ password: pw.next }).eq('id', user.id);
      if (uErr) throw uErr;
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ type: 'ok', text: 'Kata sandi berhasil diperbarui!' });
    } catch (e) { setPwMsg({ type: 'err', text: e.message }); }
    setSavingPw(false);
  };

  const changeLang = async (l) => {
    setLang(l);
    try { localStorage.setItem('cf_lang', l); } catch (err) { console.warn('localStorage tidak tersedia:', err); }
    if (user) await supabase.from('users').update({ bahasa: l }).eq('id', user.id);
  };
  const savePrefs = async (next) => {
    setPrefs(next);
    try { localStorage.setItem('cf_prefs', JSON.stringify(next)); } catch (err) { console.warn('localStorage tidak tersedia:', err); }
    setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 1500);
    if (user) await supabase.from('users').update({
      email_notif: next.emailNotif,
      notif_lamaran: next.notifLamaran,
      notif_pelatihan: next.notifPelatihan,
      profil_publik: next.profilPublik,
      tampilkan_email: next.tampilkanEmail,
    }).eq('id', user.id);
  };
  const toggle = (key) => savePrefs({ ...prefs, [key]: !prefs[key] });

  if (!loaded || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', marginLeft: 'var(--sidebar-width, 240px)', transition: 'margin-left 0.3s ease' }}>
      <Sidebar />
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.82) 0%, rgba(109,40,217,0.72) 100%), url(/Hana_2.png)', backgroundSize: 'cover', backgroundPosition: 'center', padding: '44px 32px', color: '#fff' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>⚙️ Pengaturan</h1>
        <p style={{ fontSize: '15px', opacity: 0.9, marginTop: '6px' }}>Kelola keamanan, tampilan, dan preferensimu.</p>
      </div>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 24px 70px', display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Tab nav */}
        <aside style={{ flex: '0 0 220px', minWidth: '200px' }}>
          <div style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '8px', position: 'sticky', top: '20px' }}>
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '11px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', marginBottom: '2px',
                background: tab === tb.id ? c.brandBg : 'transparent', color: tab === tb.id ? c.brand : c.muted, fontWeight: tab === tb.id ? 700 : 500,
              }}><span>{tb.icon}</span>{t(tb.label)}</button>
            ))}
          </div>
        </aside>

        {/* Panel */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <AnimatePresence mode="wait">
            {tab === 'keamanan' && (
              <motion.div key="keamanan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: c.text, marginBottom: '4px' }}>Ubah Kata Sandi</h2>
                <p style={{ fontSize: '13px', color: c.muted, marginBottom: '20px' }}>Gunakan kata sandi yang kuat dan tidak dipakai di tempat lain.</p>
                {pwMsg && <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '11px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 500, background: pwMsg.type === 'ok' ? (isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4') : (isDark ? '#450A0A' : '#FEF2F2'), color: pwMsg.type === 'ok' ? '#16A34A' : '#DC2626', border: `1px solid ${pwMsg.type === 'ok' ? '#16A34A' : '#DC2626'}44` }}>{pwMsg.text}</motion.div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                  <div><label style={lbl}>Kata sandi saat ini</label><input type="password" style={inp} value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} placeholder="••••••••" /></div>
                  <div><label style={lbl}>Kata sandi baru</label><input type="password" style={inp} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} placeholder="Minimal 6 karakter" /></div>
                  <div><label style={lbl}>Konfirmasi kata sandi baru</label><input type="password" style={inp} value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} placeholder="Ulangi kata sandi baru" /></div>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={changePassword} disabled={savingPw} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: savingPw ? '#C4B5FD' : c.brand, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', paddingLeft: '28px', paddingRight: '28px' }}>{savingPw ? 'Menyimpan...' : 'Simpan Kata Sandi'}</motion.button>
                </div>
              </motion.div>
            )}

            {tab === 'tampilan' && (
              <motion.div key="tampilan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '28px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: c.text, marginBottom: '20px' }}>Tampilan</h2>
                <Row title="Mode Gelap" desc="Tampilan lebih nyaman di kondisi minim cahaya." c={c}>
                  <Toggle on={isDark} onClick={toggleTheme} c={c} isDark={isDark} />
                </Row>
              </motion.div>
            )}

            {tab === 'notif' && (
              <motion.div key="notif" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: c.text }}>Notifikasi & Privasi</h2>
                  <AnimatePresence>{prefsSaved && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>✓ Tersimpan</motion.span>}</AnimatePresence>
                </div>
                <p style={{ fontSize: '13px', color: c.muted, marginBottom: '8px' }}>Notifikasi</p>
                <Row title="Notifikasi Email" desc="Terima pembaruan penting lewat email." c={c}><Toggle on={prefs.emailNotif} onClick={() => toggle('emailNotif')} c={c} isDark={isDark} /></Row>
                <Row title="Update Lamaran" desc="Beri tahu saat status lamaran berubah." c={c}><Toggle on={prefs.notifLamaran} onClick={() => toggle('notifLamaran')} c={c} isDark={isDark} /></Row>
                <Row title="Pelatihan & Mentoring" desc="Pengingat pelatihan dan jadwal mentoring." c={c}><Toggle on={prefs.notifPelatihan} onClick={() => toggle('notifPelatihan')} c={c} isDark={isDark} /></Row>
                <p style={{ fontSize: '13px', color: c.muted, margin: '20px 0 8px' }}>Privasi</p>
                <Row title="Profil Publik" desc="Izinkan orang lain melihat profilmu." c={c}><Toggle on={prefs.profilPublik} onClick={() => toggle('profilPublik')} c={c} isDark={isDark} /></Row>
                <Row title="Tampilkan Email di Profil" desc="Email kamu terlihat di profil publik." c={c}><Toggle on={prefs.tampilkanEmail} onClick={() => toggle('tampilkanEmail')} c={c} isDark={isDark} /></Row>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}