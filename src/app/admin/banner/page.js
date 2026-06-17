'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';

const COLOR_PRESETS = [
  { label: 'Oranye', value: 'linear-gradient(120deg, #F97316, #FB923C)' },
  { label: 'Ungu', value: 'linear-gradient(120deg, #7C3AED, #A78BFA)' },
  { label: 'Biru', value: 'linear-gradient(120deg, #2563EB, #60A5FA)' },
  { label: 'Hijau', value: 'linear-gradient(120deg, #16A34A, #4ADE80)' },
  { label: 'Gelap', value: 'linear-gradient(120deg, #1E293B, #475569)' },
];

export default function AdminBannerPage() {
  const router = useRouter();
  const { user, loaded } = useUser();

  const [form, setForm] = useState({
    title: '', subtitle: '', button_text: '', button_link: '',
    image_url: '', hero_image_url: '', bg_color: COLOR_PRESETS[0].value, show_countdown: true, active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [msg, setMsg] = useState('');

  const isAdmin = user && (['admin', 'superadmin'].includes((user.role || '').toLowerCase()) || user.is_admin === true);

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.push('/auth'); return; }
    if (!isAdmin) { router.push('/'); return; }
    (async () => {
      const { data } = await supabase.from('promo_banner').select('*').eq('id', 1).single();
      if (data) setForm({
        title: data.title || '', subtitle: data.subtitle || '',
        button_text: data.button_text || '', button_link: data.button_link || '',
        image_url: data.image_url || '', hero_image_url: data.hero_image_url || '', bg_color: data.bg_color || COLOR_PRESETS[0].value,
        show_countdown: data.show_countdown ?? true, active: data.active ?? true,
      });
      setLoading(false);
    })();
  }, [loaded, user]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleUpload = async (file, field = 'image_url') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMsg('✕ File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg('✕ Ukuran gambar maksimal 5MB'); return; }
    setUploadingField(field); setMsg('');
    const ext = file.name.split('.').pop();
    const prefix = field === 'hero_image_url' ? 'hero' : 'banner';
    const path = `${prefix}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
    if (upErr) {
      setMsg('✕ Gagal upload: ' + upErr.message);
      setUploadingField(null);
      return;
    }
    const { data } = supabase.storage.from('banners').getPublicUrl(path);
    update(field, data.publicUrl);
    setUploadingField(null);
    setMsg('✓ Gambar terunggah');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    const { error } = await supabase.from('promo_banner')
      .update({ ...form, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    if (error) { setMsg('✕ Gagal menyimpan: ' + error.message); }
    else { setMsg('✓ Banner berhasil disimpan'); setTimeout(() => setMsg(''), 3000); }
  };

  if (!loaded || !user || !isAdmin) return null;

  const labelStyle = { fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-sans)' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: '900px' }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>← Kembali ke Beranda</button>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Atur Banner Promo</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Perubahan di sini langsung tampil di Beranda untuk semua user.</p>
        </motion.div>

        {/* PREVIEW LANGSUNG */}
        <div style={{ marginBottom: '24px' }}>
          <span style={labelStyle}>Pratinjau</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: form.bg_color, borderRadius: '18px', padding: '24px 28px', flexWrap: 'wrap', opacity: form.active ? 1 : 0.5 }}>
            <div style={{ flex: '1 1 300px' }}>
              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', marginBottom: '10px' }}>Promo Spesial</span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '6px' }}>{form.title || 'Judul banner...'}</h2>
              {form.subtitle && <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '12px', maxWidth: '420px' }}>{form.subtitle}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {form.button_text && <span style={{ background: '#fff', color: '#333', padding: '8px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '13px' }}>{form.button_text}</span>}
                {form.show_countdown && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>Berakhir dalam <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.22)', padding: '3px 8px', borderRadius: '5px' }}>12:34:56</span></span>}
              </div>
            </div>
            <div style={{ flex: '0 0 auto', width: '200px', height: '125px', borderRadius: '14px', background: form.image_url ? '#fff' : 'rgba(255,255,255,0.18)', padding: form.image_url ? '8px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', overflow: 'hidden', boxShadow: form.image_url ? '0 6px 18px rgba(0,0,0,0.20)' : 'none' }}>
              {form.image_url ? <img src={form.image_url} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} /> : '🚀'}
            </div>
          </div>
        </div>

        {/* FORM */}
        {loading ? (
          <div className="skeleton" style={{ height: '300px', borderRadius: '14px' }} />
        ) : (
          <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div>
              <label style={labelStyle}>Judul</label>
              <input style={inputStyle} value={form.title} onChange={e => update('title', e.target.value)} placeholder="Hemat 25% untuk satu tahun pembelajaran" />
            </div>

            <div>
              <label style={labelStyle}>Deskripsi</label>
              <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="Penjelasan singkat promo..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Teks Tombol</label>
                <input style={inputStyle} value={form.button_text} onChange={e => update('button_text', e.target.value)} placeholder="Hemat sekarang" />
              </div>
              <div>
                <label style={labelStyle}>Link Tombol</label>
                <input style={inputStyle} value={form.button_link} onChange={e => update('button_link', e.target.value)} placeholder="/pelatihan" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Gambar Banner (opsional)</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', border: '1.5px solid var(--brand-600)', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontSize: '13px', fontWeight: 700, cursor: uploadingField ? 'not-allowed' : 'pointer' }}>
                  {uploadingField === 'image_url' ? '⏳ Mengunggah...' : '⬆ Upload Gambar'}
                  <input type="file" accept="image/*" disabled={!!uploadingField}
                    onChange={e => handleUpload(e.target.files?.[0], 'image_url')}
                    style={{ display: 'none' }} />
                </label>
                {form.image_url && (
                  <button onClick={() => update('image_url', '')}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-error)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    ✕ Hapus gambar
                  </button>
                )}
              </div>
              <input style={inputStyle} value={form.image_url} onChange={e => update('image_url', e.target.value)} placeholder="…atau tempel URL gambar di sini" />
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Upload dari komputer (maks 5MB), atau tempel URL gambar dari internet. Kosongkan untuk pakai ikon 🚀.</p>
            </div>

            <div>
              <label style={labelStyle}>Gambar Latar Hero (opsional)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                {/* Thumbnail preview latar hero */}
                <div style={{ width: '120px', height: '68px', borderRadius: '8px', border: '1px solid var(--border-default)', overflow: 'hidden', background: form.hero_image_url ? '#0F172A' : 'var(--surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {form.hero_image_url
                    ? <img src={form.hero_image_url} alt="Latar hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Tanpa gambar</span>}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', border: '1.5px solid var(--brand-600)', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontSize: '13px', fontWeight: 700, cursor: uploadingField ? 'not-allowed' : 'pointer' }}>
                    {uploadingField === 'hero_image_url' ? '⏳ Mengunggah...' : '⬆ Upload Latar'}
                    <input type="file" accept="image/*" disabled={!!uploadingField}
                      onChange={e => handleUpload(e.target.files?.[0], 'hero_image_url')}
                      style={{ display: 'none' }} />
                  </label>
                  {form.hero_image_url && (
                    <button onClick={() => update('hero_image_url', '')}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-error)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      ✕ Hapus latar
                    </button>
                  )}
                </div>
              </div>
              <input style={inputStyle} value={form.hero_image_url} onChange={e => update('hero_image_url', e.target.value)} placeholder="…atau tempel URL gambar latar di sini" />
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Gambar ini menjadi latar bagian hero di Beranda (judul besar "Temukan ribuan kursus…"). Teks otomatis diberi lapisan gelap agar tetap terbaca. Kosongkan untuk latar polos.</p>
            </div>

            <div>
              <label style={labelStyle}>Warna Latar</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map(c => (
                  <button key={c.label} onClick={() => update('bg_color', c.value)}
                    style={{ width: '70px', height: '40px', borderRadius: '8px', background: c.value, border: form.bg_color === c.value ? '3px solid var(--text-primary)' : '1px solid var(--border-default)', cursor: 'pointer', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={form.show_countdown} onChange={e => update('show_countdown', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-600)' }} />
                Tampilkan hitung mundur
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--brand-600)' }} />
                Banner aktif (tampil di Beranda)
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '11px 26px', background: 'var(--brand-600)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              {msg && <span style={{ fontSize: '13px', fontWeight: 600, color: msg.startsWith('✓') ? 'var(--text-success)' : 'var(--text-error)' }}>{msg}</span>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}