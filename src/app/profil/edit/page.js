'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';
import Cropper from 'react-easy-crop';

const S = {
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, sans-serif' },
  btn: { padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
  btnOutline: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 500, fontSize: '13px', cursor: 'pointer' },
  btnDanger: { padding: '7px 14px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 500, fontSize: '12px', cursor: 'pointer' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
};

// Helper: crop image canvas
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.95);
  });
}

// Modal Editor Foto
function PhotoEditorModal({ imageSrc, onSave, onCancel, uploading }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [shape, setShape] = useState('round'); // round | rect

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
    onSave(croppedImage);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Edit Foto Profil</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B', lineHeight: 1 }}>×</button>
        </div>

        {/* Crop area */}
        <div style={{ position: 'relative', height: '340px', background: '#1E293B' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape={shape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9' }}>

          {/* Shape toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', alignSelf: 'center', marginRight: '4px' }}>Bentuk:</span>
            {[{ id: 'round', label: '⭕ Bulat' }, { id: 'rect', label: '⬜ Kotak' }].map(s => (
              <button key={s.id} onClick={() => setShape(s.id)} style={{
                padding: '6px 14px', borderRadius: '8px', border: '1px solid',
                fontSize: '12px', cursor: 'pointer', fontWeight: 500,
                background: shape === s.id ? '#EFF6FF' : '#fff',
                color: shape === s.id ? '#2563EB' : '#64748B',
                borderColor: shape === s.id ? '#2563EB' : '#E2E8F0',
              }}>{s.label}</button>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>🔍 Zoom</label>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>{zoom.toFixed(1)}x</span>
            </div>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#2563EB' }} />
          </div>

          {/* Rotation */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>🔄 Rotasi</label>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>{rotation}°</span>
            </div>
            <input type="range" min={-180} max={180} step={1} value={rotation} onChange={e => setRotation(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#2563EB' }} />
          </div>

          {/* Quick rotate buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => setRotation(r => r - 90)} style={S.btnOutline}>↺ -90°</button>
            <button onClick={() => setRotation(r => r + 90)} style={S.btnOutline}>↻ +90°</button>
            <button onClick={() => setRotation(0)} style={{ ...S.btnOutline, marginLeft: 'auto' }}>Reset</button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onCancel} style={{ ...S.btnOutline, flex: 1 }}>Batal</button>
            <button onClick={handleSave} disabled={uploading} style={{ ...S.btn, flex: 2, opacity: uploading ? 0.7 : 1 }}>
              {uploading ? '⏳ Mengupload...' : '✓ Simpan Foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const router = useRouter();
  const { user, loaded, login } = useUser();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({ full_name: '', email: '', bio: '', phone: '', location: '', job_title: '', avatar_url: '' });
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('profil');
  const [skillForm, setSkillForm] = useState({ skill_name: '', level: 'Pemula' });
  const [addingSkill, setAddingSkill] = useState(false);
  const [expForm, setExpForm] = useState({ company: '', position: '', start_year: '', end_year: '', description: '' });
  const [addingExp, setAddingExp] = useState(false);

  // Photo editor state
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: u }, { data: sk }, { data: ex }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('user_skills').select('*').eq('user_id', user.id),
      supabase.from('user_experience').select('*').eq('user_id', user.id).order('start_year', { ascending: false }),
    ]);
    if (u) setProfile({ full_name: u.full_name || '', email: u.email || '', bio: u.bio || '', phone: u.phone || '', location: u.location || '', job_title: u.job_title || '', avatar_url: u.avatar_url || '' });
    setSkills(sk || []);
    setExperiences(ex || []);
    setLoading(false);
  };

  // Step 1: Pilih file → buka editor
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('Ukuran foto maksimal 5MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setMsg('Format foto harus JPG, PNG, atau WebP.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setRawImageSrc(reader.result); setShowEditor(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Step 2: Setelah crop → upload ke Supabase
  const handleSaveCroppedPhoto = async (croppedBlobUrl) => {
    setUploadingPhoto(true);
    setMsg('');
    try {
      const response = await fetch(croppedBlobUrl);
      const blob = await response.blob();
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      login({ ...user, avatar_url: publicUrl });
      setShowEditor(false);
      setRawImageSrc(null);
      setMsg('Foto profil berhasil diperbarui!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Gagal upload foto: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
      setProfile(prev => ({ ...prev, avatar_url: '' }));
      login({ ...user, avatar_url: null });
      setMsg('Foto profil dihapus.');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Gagal menghapus foto.'); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await supabase.from('users').update({ full_name: profile.full_name, bio: profile.bio, phone: profile.phone, location: profile.location, job_title: profile.job_title }).eq('id', user.id);
      login({ ...user, full_name: profile.full_name });
      setMsg('Profil berhasil disimpan!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal menyimpan: ' + e.message); }
    finally { setSaving(false); }
  };

  const addSkill = async () => {
    if (!skillForm.skill_name.trim()) return;
    setAddingSkill(true);
    try {
      const { data } = await supabase.from('user_skills').insert([{ user_id: user.id, skill_name: skillForm.skill_name, level: skillForm.level }]).select().single();
      setSkills(prev => [...prev, data]);
      setSkillForm({ skill_name: '', level: 'Pemula' });
    } catch (e) { console.error(e); }
    finally { setAddingSkill(false); }
  };

  const deleteSkill = async (id) => {
    await supabase.from('user_skills').delete().eq('id', id);
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const addExperience = async () => {
    if (!expForm.company.trim() || !expForm.position.trim()) return;
    setAddingExp(true);
    try {
      const { data } = await supabase.from('user_experience').insert([{ user_id: user.id, ...expForm, start_year: parseInt(expForm.start_year) || null, end_year: expForm.end_year ? parseInt(expForm.end_year) : null }]).select().single();
      setExperiences(prev => [data, ...prev]);
      setExpForm({ company: '', position: '', start_year: '', end_year: '', description: '' });
    } catch (e) { console.error(e); }
    finally { setAddingExp(false); }
  };

  const deleteExperience = async (id) => {
    await supabase.from('user_experience').delete().eq('id', id);
    setExperiences(prev => prev.filter(e => e.id !== id));
  };

  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) : '?';
  const levelColor = (l) => l === 'Mahir' ? { bg: '#F0FDF4', color: '#16A34A' } : l === 'Menengah' ? { bg: '#EFF6FF', color: '#2563EB' } : { bg: '#F1F5F9', color: '#64748B' };
  const completeness = Math.round(([profile.bio, profile.phone, profile.location, profile.job_title, profile.avatar_url, skills.length > 0, experiences.length > 0].filter(Boolean).length / 7) * 100);

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />

      {/* Photo Editor Modal */}
      {showEditor && rawImageSrc && (
        <PhotoEditorModal
          imageSrc={rawImageSrc}
          uploading={uploadingPhoto}
          onSave={handleSaveCroppedPhoto}
          onCancel={() => { setShowEditor(false); setRawImageSrc(null); }}
        />
      )}

      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Profil Saya</h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Kelola informasi profil dan pengalaman kariermu</p>
          </div>
          {user?.id && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
              <button onClick={() => router.push('/dokumen')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', border: '1px solid #D1D7DC', background: '#fff', color: '#0F172A', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                📁 Dokumen Saya
              </button>
              <button onClick={() => router.push('/profil')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '9px', border: '1px solid #D1D7DC', background: '#fff', color: '#0F172A', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                👁 Lihat Profil
              </button>
            </div>
          )}
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', background: msg.includes('Gagal') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${msg.includes('Gagal') ? '#FECACA' : '#BBF7D0'}`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : '#16A34A', marginBottom: '20px', fontSize: '13px' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          {/* Left */}
          <div>
            <div style={S.card}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {/* Avatar */}
                <div style={{ position: 'relative', width: '96px', margin: '0 auto 14px' }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar"
                      style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #BFDBFE', display: 'block' }} />
                  ) : (
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '30px' }}>
                      {initials(profile.full_name)}
                    </div>
                  )}
                  {/* Camera button overlay */}
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ position: 'absolute', bottom: 2, right: 2, width: '30px', height: '30px', borderRadius: '50%', background: '#2563EB', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}
                    title="Edit foto profil">
                    📷
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
                </div>

                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{profile.full_name}</h2>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>{profile.job_title || 'Tambahkan jabatan'}</p>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '14px' }}>{profile.location || 'Tambahkan lokasi'}</p>

                {/* Photo action buttons */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📷 {profile.avatar_url ? 'Ganti' : 'Upload'} Foto
                  </button>
                  {profile.avatar_url && (
                    <button onClick={handleRemovePhoto}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>JPG, PNG, WebP • Maks 5MB</p>
              </div>

              {/* Completeness */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Kelengkapan profil</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: completeness === 100 ? '#16A34A' : '#2563EB' }}>{completeness}%</span>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px' }}>
                  <div style={{ width: `${completeness}%`, height: '100%', background: completeness === 100 ? '#16A34A' : '#2563EB', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
                {completeness < 100 && (
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', lineHeight: 1.4 }}>
                    {!profile.avatar_url && '• Foto profil  '}{!profile.bio && '• Bio  '}{!profile.job_title && '• Jabatan  '}{!profile.location && '• Lokasi'}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#2563EB' }}>{skills.length}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Skills</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#16A34A' }}>{experiences.length}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Pengalaman</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {[{ id: 'profil', label: '👤 Info Dasar' }, { id: 'skills', label: '⚡ Skills' }, { id: 'pengalaman', label: '💼 Pengalaman' }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ width: '100%', padding: '12px 16px', border: 'none', textAlign: 'left', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', background: activeTab === tab.id ? '#EFF6FF' : '#fff', color: activeTab === tab.id ? '#2563EB' : '#475569', borderLeft: activeTab === tab.id ? '3px solid #2563EB' : '3px solid transparent', borderBottom: '1px solid #F1F5F9', transition: 'all 0.15s' }}>{tab.label}</button>
              ))}
            </div>
          </div>

          {/* Right */}
          <div>
            {loading ? (
              <div style={S.card}><p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Memuat profil...</p></div>
            ) : activeTab === 'profil' ? (
              <div style={S.card}>
                <div style={S.sectionTitle}>
                  <span>Informasi Dasar</span>
                  <button onClick={saveProfile} disabled={saving} style={{ ...S.btn, padding: '8px 20px', fontSize: '13px', opacity: saving ? 0.7 : 1 }}>{saving ? 'Menyimpan...' : '💾 Simpan'}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={S.label}>Nama Lengkap</label><input style={S.input} value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} placeholder="Nama lengkapmu" /></div>
                  <div><label style={S.label}>Email</label><input style={{ ...S.input, background: '#F1F5F9', color: '#94A3B8' }} value={profile.email} disabled /></div>
                  <div><label style={S.label}>Jabatan / Posisi</label><input style={S.input} value={profile.job_title} onChange={e => setProfile({ ...profile, job_title: e.target.value })} placeholder="Contoh: Frontend Developer" /></div>
                  <div><label style={S.label}>Nomor Telepon</label><input style={S.input} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="Contoh: 08123456789" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Lokasi</label><input style={S.input} value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} placeholder="Contoh: Jakarta, Indonesia" /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Bio / Tentang Saya</label><textarea style={{ ...S.input, resize: 'vertical', minHeight: '100px', lineHeight: 1.6 }} value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Ceritakan tentang dirimu, pengalaman, dan tujuan karier..." /></div>
                </div>
              </div>
            ) : activeTab === 'skills' ? (
              <div style={S.card}>
                <div style={S.sectionTitle}><span>Skills & Keahlian</span></div>
                <div style={{ background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>+ Tambah Skill Baru</p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}><label style={S.label}>Nama Skill</label><input style={S.input} value={skillForm.skill_name} onChange={e => setSkillForm({ ...skillForm, skill_name: e.target.value })} placeholder="Contoh: React.js, Figma..." onKeyDown={e => e.key === 'Enter' && addSkill()} /></div>
                    <div style={{ width: '140px' }}><label style={S.label}>Level</label><select style={{ ...S.input, cursor: 'pointer' }} value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}><option>Pemula</option><option>Menengah</option><option>Mahir</option></select></div>
                    <button onClick={addSkill} disabled={addingSkill} style={{ ...S.btn, whiteSpace: 'nowrap', padding: '10px 18px' }}>{addingSkill ? '...' : '+ Tambah'}</button>
                  </div>
                </div>
                {skills.length === 0 ? (
                  <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Belum ada skill. Tambahkan skill pertamamu!</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {skills.map(s => { const lc = levelColor(s.level); return (<div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: lc.bg, border: `1px solid ${lc.color}40`, borderRadius: '8px', padding: '8px 12px' }}><span style={{ fontSize: '14px', fontWeight: 600, color: lc.color }}>{s.skill_name}</span><span style={{ fontSize: '11px', color: lc.color, opacity: 0.8 }}>· {s.level}</span><button onClick={() => deleteSkill(s.id)} style={{ background: 'none', border: 'none', color: lc.color, cursor: 'pointer', fontSize: '16px', opacity: 0.6, padding: '0 0 0 4px' }}>×</button></div>); })}
                  </div>
                )}
              </div>
            ) : (
              <div style={S.card}>
                <div style={S.sectionTitle}><span>Pengalaman Kerja</span></div>
                <div style={{ background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>+ Tambah Pengalaman</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div><label style={S.label}>Perusahaan</label><input style={S.input} value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} placeholder="Nama perusahaan" /></div>
                    <div><label style={S.label}>Posisi</label><input style={S.input} value={expForm.position} onChange={e => setExpForm({ ...expForm, position: e.target.value })} placeholder="Posisimu" /></div>
                    <div><label style={S.label}>Tahun Mulai</label><input style={S.input} type="number" value={expForm.start_year} onChange={e => setExpForm({ ...expForm, start_year: e.target.value })} placeholder="2022" /></div>
                    <div><label style={S.label}>Tahun Selesai <span style={{ color: '#94A3B8', fontWeight: 400 }}>(kosong = masih)</span></label><input style={S.input} type="number" value={expForm.end_year} onChange={e => setExpForm({ ...expForm, end_year: e.target.value })} placeholder="2024" /></div>
                  </div>
                  <div style={{ marginBottom: '12px' }}><label style={S.label}>Deskripsi</label><textarea style={{ ...S.input, resize: 'vertical', minHeight: '70px' }} value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="Jelaskan tanggung jawab dan pencapaianmu..." /></div>
                  <button onClick={addExperience} disabled={addingExp} style={{ ...S.btn, fontSize: '13px', padding: '9px 20px' }}>{addingExp ? 'Menyimpan...' : '+ Tambah Pengalaman'}</button>
                </div>
                {experiences.length === 0 ? (
                  <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Belum ada pengalaman.</p>
                ) : experiences.map((ex, i) => (
                  <div key={ex.id} style={{ display: 'flex', gap: '16px', paddingBottom: '20px', marginBottom: '20px', borderBottom: i < experiences.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>{ex.position}</p>
                          <p style={{ margin: '0 0 4px', fontWeight: 500, color: '#2563EB', fontSize: '13px' }}>{ex.company}</p>
                          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94A3B8' }}>{ex.start_year} – {ex.end_year || 'Sekarang'}</p>
                        </div>
                        <button onClick={() => deleteExperience(ex.id)} style={S.btnDanger}>Hapus</button>
                      </div>
                      {ex.description && <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{ex.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}