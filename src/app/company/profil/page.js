'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

export default function CompanyProfilPage() {
  const router = useRouter();
  const { user, loaded, login } = useUser();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeTab, setActiveTab] = useState('profil');
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    full_name: '', company_name: '', email: '',
    phone: '', location: '', bio: '',
  });
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'company') { router.push('/'); return; }
    if (user?.role === 'company') fetchData();
  }, [loaded, user]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setAvatarUrl(data.avatar_url || '');
      setForm({ full_name: data.full_name || '', company_name: data.company_name || '', email: data.email || '', phone: data.phone || '', location: data.location || '', bio: data.bio || '' });
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
      const fileName = `company_${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
      setAvatarUrl(urlData.publicUrl);
      login({ ...user, avatar_url: urlData.publicUrl });
      setMsg('✓ Foto berhasil diperbarui!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Gagal upload: ' + err.message); }
    finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('users').update({ full_name: form.full_name, company_name: form.company_name, phone: form.phone, location: form.location, bio: form.bio }).eq('id', user.id);
      login({ ...user, full_name: form.full_name, company_name: form.company_name });
      setMsg('✓ Profil berhasil diperbarui!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.new || !pwForm.confirm) { setMsg('Semua field password wajib diisi.'); return; }
    if (pwForm.new !== pwForm.confirm) { setMsg('Password baru tidak cocok.'); return; }
    if (pwForm.new.length < 6) { setMsg('Password minimal 6 karakter.'); return; }
    setChangingPassword(true);
    try {
      const { data: userData } = await supabase.from('users').select('password_hash').eq('id', user.id).single();
      if (userData.password_hash !== `hashed_${pwForm.current}`) { setMsg('Password saat ini salah.'); return; }
      await supabase.from('users').update({ password_hash: `hashed_${pwForm.new}` }).eq('id', user.id);
      setPwForm({ current: '', new: '', confirm: '' });
      setMsg('✓ Password berhasil diubah!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setChangingPassword(false); }
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

  if (!loaded || !user || user.role !== 'company') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: isDark ? '#1E293B' : '#1E3A5F', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/company" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard Perusahaan</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Pengaturan Profil</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/" style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', textDecoration: 'none' }}>🌐 App Utama</Link>
        </div>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '860px', margin: '0 auto' }}>
        <PageTransition>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '12px 16px', background: msg.includes('Gagal') || msg.includes('salah') || msg.includes('cocok') ? isDark ? '#450A0A' : '#FEF2F2' : c.greenLight, border: `1px solid ${msg.includes('Gagal') || msg.includes('salah') ? '#DC2626' : c.green}44`, borderRadius: '8px', color: msg.includes('Gagal') || msg.includes('salah') || msg.includes('cocok') ? '#DC2626' : c.green, marginBottom: '20px', fontSize: '13px' }}>
              {msg}
            </motion.div>
          )}

          {/* Profile header */}
          <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} style={{ width: '96px', height: '96px', borderRadius: '16px', objectFit: 'cover', border: `3px solid ${c.blue}44` }} />
                ) : (
                  <div style={{ width: '96px', height: '96px', borderRadius: '16px', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '32px' }}>
                    {form.company_name?.slice(0,1) || '🏢'}
                  </div>
                )}
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                  style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '32px', height: '32px', borderRadius: '50%', background: c.blue, border: `3px solid ${c.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  {uploadingPhoto ? '⏳' : '📷'}
                </motion.button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: c.text, marginBottom: '4px' }}>{form.company_name || 'Nama Perusahaan'}</h2>
                <p style={{ fontSize: '14px', color: c.muted, marginBottom: '8px' }}>👤 {form.full_name} • ✉️ {form.email}</p>
                {form.location && <p style={{ fontSize: '13px', color: c.muted }}>📍 {form.location}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.blue, fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                    {uploadingPhoto ? '⏳ Upload...' : '📷 Ganti Logo/Foto'}
                  </motion.button>
                  <span style={{ fontSize: '11px', color: c.muted, alignSelf: 'center' }}>JPG, PNG • Maks 5MB</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <span style={{ background: isDark ? '#2E1065' : '#F5F3FF', color: isDark ? '#C084FC' : '#7C3AED', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>🏢 PERUSAHAAN</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: c.card, borderRadius: '10px', border: `1px solid ${c.border}`, padding: '4px', marginBottom: '20px' }}>
            {[
              { id: 'profil', icon: '🏢', label: 'Profil Perusahaan' },
              { id: 'akun', icon: '👤', label: 'Informasi Akun' },
              { id: 'keamanan', icon: '🔒', label: 'Keamanan' },
            ].map(tab => (
              <motion.button key={tab.id} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: '9px', borderRadius: '8px', border: 'none', fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer',
                background: activeTab === tab.id ? c.blue : 'transparent',
                color: activeTab === tab.id ? '#fff' : c.muted,
              }}>{tab.icon} {tab.label}</motion.button>
            ))}
          </div>

          {loading ? <p style={{ color: c.muted }}>Memuat...</p> : (
            <>
              {/* Tab: Profil Perusahaan */}
              {activeTab === 'profil' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>🏢 Data Perusahaan</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Nama Perusahaan *</label>
                      <input style={inp} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="PT. Nama Perusahaan" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Lokasi Perusahaan</label>
                      <input style={inp} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Jakarta, Indonesia" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Nomor Telepon</label>
                      <input style={inp} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="021-xxxxxxxx" />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Deskripsi Perusahaan</label>
                    <textarea style={{ ...inp, resize: 'vertical', minHeight: '120px', lineHeight: 1.6 }}
                      value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                      placeholder="Ceritakan tentang visi, misi, dan budaya perusahaan kamu..." />
                    <div style={{ fontSize: '11px', color: c.muted, textAlign: 'right', marginTop: '4px' }}>{form.bio.length} karakter</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                    style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: saving ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                    {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </motion.button>
                </motion.div>
              )}

              {/* Tab: Akun */}
              {activeTab === 'akun' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>👤 Informasi Penanggung Jawab</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Nama Lengkap</label>
                      <input style={inp} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nama penanggung jawab" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Email (tidak bisa diubah)</label>
                      <input style={{ ...inp, background: isDark ? '#334155' : '#F1F5F9', color: c.muted }} value={form.email} disabled />
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                    style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: saving ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                    {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                  </motion.button>
                </motion.div>
              )}

              {/* Tab: Keamanan */}
              {activeTab === 'keamanan' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>🔒 Ubah Password</h3>
                  <p style={{ fontSize: '13px', color: c.muted, marginBottom: '20px' }}>Pastikan gunakan password yang kuat dan tidak mudah ditebak.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
                    {[
                      { key: 'current', label: 'Password Saat Ini' },
                      { key: 'new', label: 'Password Baru' },
                      { key: 'confirm', label: 'Konfirmasi Password Baru' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>{f.label}</label>
                        <input type="password" style={inp} value={pwForm[f.key]} onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })} placeholder="••••••••" />
                      </div>
                    ))}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleChangePassword} disabled={changingPassword}
                      style={{ padding: '12px', borderRadius: '8px', border: 'none', background: changingPassword ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>
                      {changingPassword ? 'Mengubah...' : '🔒 Ubah Password'}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </PageTransition>
      </main>
    </div>
  );
}
