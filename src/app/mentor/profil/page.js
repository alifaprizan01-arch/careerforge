'use client';
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

export default function MentorProfilPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    full_name: '', title: '', expertise: '', bio: '', price_per_session: '',
    years_experience: '', linkedin_url: '', availability: 'Tersedia',
    expertise_tags: '',
  });

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'mentor') { router.push('/'); return; }
    if (user?.role === 'mentor') fetchMentor();
  }, [loaded, user]);

  const fetchMentor = async () => {
    setLoading(true);
    const { data } = await supabase.from('mentors').select('*').eq('user_id_ref', user.id).single();
    if (data) {
      setMentorData(data);
      setAvatarUrl(data.avatar_url || '');
      setForm({
        full_name: data.full_name || '',
        title: data.title || '',
        expertise: data.expertise || '',
        bio: data.bio || '',
        price_per_session: data.price_per_session || '',
        years_experience: data.years_experience || '',
        linkedin_url: data.linkedin_url || '',
        availability: data.availability || 'Tersedia',
        expertise_tags: Array.isArray(data.expertise_tags) ? data.expertise_tags.join(', ') : '',
      });
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('Ukuran foto maksimal 5MB.'); return; }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `mentor_${mentorData.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newUrl = urlData.publicUrl;
      await supabase.from('mentors').update({ avatar_url: newUrl }).eq('id', mentorData.id);
      setAvatarUrl(newUrl);
      setMsg('Foto profil berhasil diperbarui! ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Gagal upload foto: ' + err.message); }
    finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = form.expertise_tags ? form.expertise_tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await supabase.from('mentors').update({
        full_name: form.full_name,
        title: form.title,
        expertise: form.expertise,
        bio: form.bio,
        price_per_session: form.price_per_session ? parseInt(form.price_per_session) : 0,
        years_experience: form.years_experience ? parseInt(form.years_experience) : 0,
        linkedin_url: form.linkedin_url,
        availability: form.availability,
        expertise_tags: tags,
      }).eq('id', mentorData.id);
      setMsg('Profil berhasil diperbarui! ✓');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal menyimpan: ' + e.message); }
    finally { setSaving(false); }
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF', green: isDark ? '#4ADE80' : '#16A34A',
    greenLight: isDark ? '#14532D' : '#F0FDF4',
  };

  const inp = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };
  const label = (text, required = false) => (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>
      {text} {required && <span style={{ color: '#DC2626' }}>*</span>}
    </label>
  );

  if (!loaded || !user || user.role !== 'mentor') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#065F46 0%,#16A34A 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(22,163,74,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/mentor" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Edit Profil Mentor</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
          style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: saving ? '#86EFAC' : '#16A34A', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
        </motion.button>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '800px', margin: '0 auto' }}>
        <PageTransition>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '12px 16px', background: msg.includes('Gagal') ? isDark ? '#450A0A' : '#FEF2F2' : c.greenLight, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.green}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.green, marginBottom: '20px', fontSize: '13px' }}>
              {msg}
            </motion.div>
          )}

          {loading ? <p style={{ color: c.muted }}>Memuat...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Preview card with photo upload */}
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${c.green}44` }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '28px' }}>
                      {form.full_name?.slice(0,1) || '?'}
                    </div>
                  )}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: c.green, border: `2px solid ${c.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}
                    title="Ganti foto">
                    {uploadingPhoto ? '⏳' : '📷'}
                  </motion.button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: c.text }}>{form.full_name || 'Nama Mentor'}</div>
                  <div style={{ fontSize: '13px', color: c.muted }}>{form.expertise || 'Keahlian'}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: form.availability === 'Tersedia' ? c.greenLight : isDark ? '#334155' : '#F1F5F9', color: form.availability === 'Tersedia' ? c.green : c.muted }}>
                      {form.availability === 'Tersedia' ? '🟢 Tersedia' : '🔴 Tidak Tersedia'}
                    </span>
                    {form.price_per_session && <span style={{ fontSize: '11px', color: c.green, fontWeight: 600 }}>Rp {parseInt(form.price_per_session).toLocaleString('id-ID')}/jam</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: c.muted, marginTop: '6px' }}>Klik 📷 untuk ganti foto profil (JPG/PNG, maks 5MB)</p>
                </div>
              </div>

              {/* Form sections */}
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '18px' }}>📋 Informasi Dasar</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>{label('Nama Lengkap', true)}<input style={inp} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nama lengkap" /></div>
                  <div>{label('Jabatan/Title')}<input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Senior Product Manager" /></div>
                  <div>{label('Bidang Keahlian Utama', true)}<input style={inp} value={form.expertise} onChange={e => setForm({ ...form, expertise: e.target.value })} placeholder="Contoh: Product Management" /></div>
                  <div>{label('Tahun Pengalaman')}<input style={inp} type="number" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: e.target.value })} placeholder="Contoh: 5" /></div>
                  <div>{label('Harga per Sesi (Rp/jam)')}<input style={inp} type="number" value={form.price_per_session} onChange={e => setForm({ ...form, price_per_session: e.target.value })} placeholder="0 = Gratis, contoh: 200000" /></div>
                  <div>{label('Status Ketersediaan')}
                    <select style={{ ...inp, cursor: 'pointer' }} value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}>
                      <option value="Tersedia">🟢 Tersedia</option>
                      <option value="Sibuk">🔴 Sedang Sibuk</option>
                      <option value="Libur">⏸️ Sedang Libur</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '18px' }}>✍️ Bio & Keahlian</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    {label('Bio / Deskripsi Diri')}
                    <textarea style={{ ...inp, resize: 'vertical', minHeight: '100px', lineHeight: 1.6 }}
                      value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                      placeholder="Ceritakan pengalaman dan keahlianmu..." />
                    <div style={{ fontSize: '11px', color: c.muted, textAlign: 'right', marginTop: '4px' }}>{form.bio.length} karakter</div>
                  </div>
                  <div>
                    {label('Tag Keahlian (pisahkan dengan koma)')}
                    <input style={inp} value={form.expertise_tags} onChange={e => setForm({ ...form, expertise_tags: e.target.value })}
                      placeholder="Contoh: React, Node.js, System Design, Career Coaching" />
                    {form.expertise_tags && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {form.expertise_tags.split(',').map((t, i) => t.trim() && (
                          <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: c.greenLight, color: c.green }}>#{t.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    {label('URL LinkedIn')}
                    <input style={inp} value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/username" />
                  </div>
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                style={{ padding: '14px', borderRadius: '10px', border: 'none', background: saving ? '#86EFAC' : c.green, color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </motion.button>
            </div>
          )}
        </PageTransition>
      </main>
    </div>
  );
}