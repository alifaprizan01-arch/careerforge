'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import Sidebar from '../../components/Sidebar';

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return m;
}

const EXPERTISE_OPTIONS = [
  'UI/UX Design', 'Frontend Development', 'Backend Development', 'Full Stack',
  'Data Science', 'Machine Learning', 'Product Management', 'Digital Marketing',
  'Career Coaching', 'Business Strategy', 'Cybersecurity', 'DevOps',
  'Mobile Development', 'Cloud Computing', 'Graphic Design', 'Content Writing',
];

const STEPS = ['Info Dasar', 'Keahlian', 'Tarif & Sosial', 'Review'];

export default function DaftarMentorPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [pendingExists, setPendingExists] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    full_name: '', title: '', company: '', bio: '',
    expertise: '', expertise_tags: [],
    years_experience: '', price_per_session: '0',
    linkedin_url: '', avatar_url: '',
  });

  useEffect(() => {
    if (loaded && !user) router.push('/auth');
    if (loaded && user) setForm(f => ({ ...f, full_name: user.full_name || '' }));
  }, [loaded, user]);

  // Cek apakah sudah jadi mentor atau pending
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('mentors').select('id, status').eq('user_id', user.id).single();
      if (data?.status === 'approved') router.push('/mentor');
      if (data?.status === 'pending') setPendingExists(true);
    })();
  }, [user]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const addTag = (tag) => {
    const t = tag.trim();
    if (!t || form.expertise_tags.includes(t) || form.expertise_tags.length >= 8) return;
    set('expertise_tags', [...form.expertise_tags, t]);
    setTagInput('');
  };
  const removeTag = (tag) => set('expertise_tags', form.expertise_tags.filter(t => t !== tag));

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.full_name.trim()) e.full_name = 'Nama wajib diisi';
      if (!form.title.trim()) e.title = 'Jabatan wajib diisi';
      if (!form.bio.trim() || form.bio.length < 50) e.bio = 'Bio minimal 50 karakter';
    }
    if (s === 1) {
      if (!form.expertise.trim()) e.expertise = 'Bidang keahlian wajib diisi';
      if (form.expertise_tags.length === 0) e.expertise_tags = 'Tambahkan minimal 1 tag';
    }
    if (s === 2) {
      if (form.years_experience === '' || isNaN(form.years_experience)) e.years_experience = 'Masukkan tahun pengalaman';
      if (form.linkedin_url && !form.linkedin_url.includes('linkedin.com')) e.linkedin_url = 'URL LinkedIn tidak valid';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const prev = () => { setErrors({}); setStep(s => s - 1); };

  const submit = async () => {
    if (!validate(2)) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('mentors').insert([{
        user_id: user.id,
        full_name: form.full_name.trim(),
        title: form.title.trim(),
        company: form.company.trim() || null,
        bio: form.bio.trim(),
        expertise: form.expertise.trim(),
        expertise_tags: form.expertise_tags,
        years_experience: parseInt(form.years_experience) || 0,
        price_per_session: parseInt(form.price_per_session) || 0,
        linkedin_url: form.linkedin_url.trim() || null,
        avatar_url: user.avatar_url || null,
        availability: 'Tidak Tersedia',
        status: 'pending',           // ← pending dulu, tunggu admin
        rating: 0, total_reviews: 0, rating_avg: 0,
        is_available: false,
      }]);
      if (error) throw error;
      setDone(true);
    } catch (e) {
      setErrors({ submit: e.message });
    }
    setSubmitting(false);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    input: isDark ? '#0F172A' : '#F8FAFC',
    brand: '#7C3AED',
    brandBg: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF',
  };

  const inp = (key) => ({
    value: form[key],
    onChange: e => { set(key, e.target.value); if (errors[key]) setErrors(v => ({ ...v, [key]: null })); },
    style: {
      width: '100%', padding: '11px 14px', borderRadius: '10px',
      fontSize: '14px', outline: 'none',
      border: `1.5px solid ${errors[key] ? '#DC2626' : c.border}`,
      background: c.input, color: c.text, fontFamily: 'inherit',
      boxSizing: 'border-box', transition: 'border-color 0.15s',
    },
  });

  const Label = ({ children, required }) => (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>
      {children} {required && <span style={{ color: '#DC2626' }}>*</span>}
    </label>
  );
  const Err = ({ k }) => errors[k]
    ? <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0' }}>{errors[k]}</p>
    : null;

  if (!loaded || !user) return null;

  // ── Sudah pending ────────────────────────────────────────────────────────────
  if (pendingExists) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: c.card, borderRadius: '20px', border: `1px solid ${c.border}`, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: c.text, marginBottom: '10px' }}>Pendaftaran Sedang Ditinjau</h2>
          <p style={{ fontSize: '14px', color: c.muted, lineHeight: 1.7, marginBottom: '24px' }}>
            Kamu sudah mendaftar sebagai mentor. Tim admin sedang meninjau permohonanmu.
            Kamu akan mendapat notifikasi setelah disetujui.
          </p>
          <div style={{ background: isDark ? 'rgba(234,179,8,0.1)' : '#FEFCE8', border: '1px solid #FDE047', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: '#CA8A04', fontWeight: 600, margin: 0 }}>
              🕐 Proses peninjauan biasanya memakan waktu 1–3 hari kerja.
            </p>
          </div>
          <button onClick={() => router.push('/')} style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Kembali ke Beranda
          </button>
        </div>
      </main>
    </div>
  );

  // ── Selesai submit ───────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ maxWidth: '480px', width: '100%', background: c.card, borderRadius: '20px', border: `1px solid ${c.border}`, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: isDark ? 'rgba(124,58,237,0.2)' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 20px' }}>🎤</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: c.text, marginBottom: '10px' }}>Pendaftaran Terkirim!</h2>
          <p style={{ fontSize: '14px', color: c.muted, lineHeight: 1.7, marginBottom: '10px' }}>
            Permohonanmu sebagai mentor telah kami terima dan sedang dalam proses peninjauan oleh admin.
          </p>
          <div style={{ background: isDark ? 'rgba(234,179,8,0.1)' : '#FEFCE8', border: '1px solid #FDE047', borderRadius: '12px', padding: '14px 16px', marginBottom: '28px' }}>
            <p style={{ fontSize: '13px', color: '#CA8A04', fontWeight: 600, margin: 0 }}>
              ⏳ Estimasi peninjauan: 1–3 hari kerja
            </p>
          </div>

          {/* Timeline status */}
          <div style={{ textAlign: 'left', marginBottom: '28px' }}>
            {[
              { icon: '✅', label: 'Formulir dikirim', done: true },
              { icon: '🔍', label: 'Ditinjau oleh admin', done: false, active: true },
              { icon: '🎉', label: 'Akun mentor diaktifkan', done: false },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 2 ? `1px solid ${c.border}` : 'none' }}>
                <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{s.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: s.active ? 700 : 500, color: s.done ? '#16A34A' : s.active ? c.brand : c.muted }}>
                  {s.label}
                </span>
                {s.active && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#CA8A04', background: isDark ? 'rgba(234,179,8,0.15)' : '#FEFCE8', padding: '3px 8px', borderRadius: '6px' }}>Sedang berjalan</span>}
              </div>
            ))}
          </div>

          <button onClick={() => router.push('/')} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
            Kembali ke Beranda
          </button>
        </motion.div>
      </main>
    </div>
  );

  // ── Form utama ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: isMobile ? '16px' : '32px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: c.text, margin: '0 0 6px' }}>Daftar Jadi Mentor 🎤</h1>
            <p style={{ fontSize: '14px', color: c.muted, margin: 0 }}>Isi formulir berikut. Permohonan akan ditinjau admin sebelum diaktifkan.</p>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '28px' }}>
            {STEPS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                    background: i < step ? '#16A34A' : i === step ? c.brand : c.border,
                    color: i <= step ? '#fff' : c.muted,
                    transition: 'all 0.2s',
                  }}>{i < step ? '✓' : i + 1}</div>
                  {!isMobile && <span style={{ fontSize: '12px', fontWeight: i === step ? 700 : 400, color: i === step ? c.brand : c.muted }}>{label}</span>}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: i < step ? '#16A34A' : c.border, margin: '0 6px', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Card form */}
          <div style={{ background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, padding: isMobile ? '20px 16px' : '28px', boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>

                {/* Step 0 */}
                {step === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: c.text, margin: 0 }}>Informasi Dasar</h2>
                    <div>
                      <Label required>Nama Lengkap</Label>
                      <input {...inp('full_name')} placeholder="Nama lengkapmu" />
                      <Err k="full_name" />
                    </div>
                    <div>
                      <Label required>Jabatan / Posisi Saat Ini</Label>
                      <input {...inp('title')} placeholder="cth: Senior Product Designer" />
                      <Err k="title" />
                    </div>
                    <div>
                      <Label>Perusahaan / Institusi</Label>
                      <input {...inp('company')} placeholder="cth: Google, Tokopedia (opsional)" />
                    </div>
                    <div>
                      <Label required>Bio <span style={{ fontSize: '11px', fontWeight: 400, color: c.muted }}>({form.bio.length}/50 karakter min.)</span></Label>
                      <textarea {...inp('bio')} placeholder="Ceritakan pengalamanmu, keahlian, dan apa yang bisa kamu bantu..."
                        rows={5} style={{ ...inp('bio').style, resize: 'vertical', lineHeight: 1.6 }} />
                      <Err k="bio" />
                    </div>
                  </div>
                )}

                {/* Step 1 */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: c.text, margin: 0 }}>Keahlian</h2>
                    <div>
                      <Label required>Bidang Keahlian Utama</Label>
                      <select value={form.expertise} onChange={e => { set('expertise', e.target.value); if (errors.expertise) setErrors(v => ({ ...v, expertise: null })); }}
                        style={{ ...inp('expertise').style }}>
                        <option value="">Pilih bidang keahlian...</option>
                        {EXPERTISE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="Lainnya">Lainnya</option>
                      </select>
                      {form.expertise === 'Lainnya' && (
                        <input {...inp('expertise')} placeholder="Tulis bidang keahlianmu" style={{ ...inp('expertise').style, marginTop: '8px' }} />
                      )}
                      <Err k="expertise" />
                    </div>
                    <div>
                      <Label required>Tag Keahlian <span style={{ fontSize: '11px', fontWeight: 400, color: c.muted }}>(maks. 8 tag)</span></Label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        {form.expertise_tags.map(tag => (
                          <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: c.brandBg, color: c.brand, fontSize: '13px', fontWeight: 600 }}>
                            #{tag}
                            <button onClick={() => removeTag(tag)} style={{ border: 'none', background: 'none', color: c.brand, cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1 }}>×</button>
                          </span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                          placeholder="Ketik tag lalu Enter"
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none', border: `1.5px solid ${c.border}`, background: c.input, color: c.text, fontFamily: 'inherit' }} />
                        <button onClick={() => addTag(tagInput)} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>+ Add</button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {EXPERTISE_OPTIONS.filter(o => !form.expertise_tags.includes(o)).slice(0, 8).map(o => (
                          <button key={o} onClick={() => addTag(o)}
                            style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            + {o}
                          </button>
                        ))}
                      </div>
                      <Err k="expertise_tags" />
                    </div>
                    <div>
                      <Label required>Tahun Pengalaman</Label>
                      <input {...inp('years_experience')} type="number" min="0" max="50" placeholder="cth: 5" />
                      <Err k="years_experience" />
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: c.text, margin: 0 }}>Tarif & Sosial Media</h2>
                    <div>
                      <Label>Harga per Sesi (Rp)</Label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: c.muted, fontWeight: 600 }}>Rp</span>
                        <input {...inp('price_per_session')} type="number" min="0" placeholder="0"
                          style={{ ...inp('price_per_session').style, paddingLeft: '40px' }} />
                      </div>
                      <p style={{ fontSize: '12px', color: c.muted, marginTop: '5px' }}>Isi 0 untuk sesi gratis</p>
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <input {...inp('linkedin_url')} placeholder="https://linkedin.com/in/username" />
                      <Err k="linkedin_url" />
                    </div>
                    <div style={{ background: c.brandBg, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${c.border}` }}>
                      <p style={{ fontSize: '13px', color: c.brand, fontWeight: 600, margin: '0 0 4px' }}>📸 Foto Profil</p>
                      <p style={{ fontSize: '12px', color: c.muted, margin: 0 }}>
                        Foto diambil otomatis dari akun kamu.
                        {user?.avatar_url ? ' Foto sudah tersedia ✓' : ' Belum ada — upload di Edit Profil dulu.'}
                      </p>
                    </div>
                    {errors.submit && (
                      <div style={{ padding: '12px 16px', background: isDark ? '#450A0A' : '#FEF2F2', border: '1px solid #DC262644', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>
                        ⚠️ {errors.submit}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 - Review */}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: c.text, margin: 0 }}>Review & Konfirmasi</h2>
                    <p style={{ fontSize: '13px', color: c.muted, margin: 0 }}>Pastikan semua informasi sudah benar.</p>
                    {[
                      { label: 'Nama', value: form.full_name },
                      { label: 'Jabatan', value: form.title },
                      { label: 'Perusahaan', value: form.company || '—' },
                      { label: 'Bidang Keahlian', value: form.expertise },
                      { label: 'Pengalaman', value: `${form.years_experience} tahun` },
                      { label: 'Harga/Sesi', value: parseInt(form.price_per_session) > 0 ? `Rp ${parseInt(form.price_per_session).toLocaleString('id-ID')}` : 'Gratis' },
                      { label: 'LinkedIn', value: form.linkedin_url || '—' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '10px 0', borderBottom: `1px solid ${c.border}` }}>
                        <span style={{ fontSize: '13px', color: c.muted, flexShrink: 0 }}>{item.label}</span>
                        <span style={{ fontSize: '13px', color: c.text, fontWeight: 600, textAlign: 'right' }}>{item.value}</span>
                      </div>
                    ))}
                    <div style={{ padding: '10px 0', borderBottom: `1px solid ${c.border}` }}>
                      <span style={{ fontSize: '13px', color: c.muted, display: 'block', marginBottom: '8px' }}>Tag Keahlian</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {form.expertise_tags.map(tag => (
                          <span key={tag} style={{ padding: '3px 10px', borderRadius: '20px', background: c.brandBg, color: c.brand, fontSize: '12px', fontWeight: 600 }}>#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ padding: '10px 0', borderBottom: `1px solid ${c.border}` }}>
                      <span style={{ fontSize: '13px', color: c.muted, display: 'block', marginBottom: '6px' }}>Bio</span>
                      <p style={{ fontSize: '13px', color: c.text, lineHeight: 1.6, margin: 0 }}>{form.bio}</p>
                    </div>
                    {/* Notice pending */}
                    <div style={{ background: isDark ? 'rgba(234,179,8,0.1)' : '#FEFCE8', border: '1px solid #FDE047', borderRadius: '12px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '13px', color: '#CA8A04', fontWeight: 700, margin: '0 0 4px' }}>⏳ Perlu Persetujuan Admin</p>
                      <p style={{ fontSize: '12px', color: '#CA8A04', margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                        Setelah submit, permohonanmu akan ditinjau admin. Akun mentor akan diaktifkan setelah disetujui (estimasi 1–3 hari kerja).
                      </p>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'space-between' }}>
              <button onClick={step === 0 ? () => router.push('/mentoring') : prev}
                style={{ padding: '12px 24px', borderRadius: '10px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {step === 0 ? '← Batal' : '← Kembali'}
              </button>
              {step < 3 ? (
                <motion.button whileTap={{ scale: 0.97 }} onClick={next}
                  style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                  Lanjut →
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={submitting}
                  style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: submitting ? '#C4B5FD' : c.brand, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                  {submitting ? 'Mengirim...' : '📨 Kirim Permohonan'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
