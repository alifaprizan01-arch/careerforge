'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import Sidebar from '../../components/Sidebar';
import Cropper from 'react-easy-crop';

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '15px',
    outline: 'none',
    background: '#F8FAFC',
    color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  },
  btn: {
    padding: '14px 24px',
    borderRadius: '12px',
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.01em',
  },
  btnOutline: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    background: '#fff',
    color: '#475569',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  btnDanger: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid #FECACA',
    background: '#FEF2F2',
    color: '#DC2626',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    marginBottom: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

// ─── Crop Helper ──────────────────────────────────────────────────────────────
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
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
    canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.95);
  });
}

// ─── Photo Editor Modal (Mobile Optimized) ────────────────────────────────────
function PhotoEditorModal({ imageSrc, onSave, onCancel, uploading }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [shape, setShape] = useState('round');

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
    onSave(croppedImage);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: '#0F172A',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none',
          color: '#94A3B8', fontSize: '15px', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', padding: '4px 8px',
        }}>Batal</button>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>Edit Foto</h3>
        <button onClick={handleSave} disabled={uploading} style={{
          background: '#2563EB', border: 'none', color: '#fff',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          padding: '8px 16px', borderRadius: '8px',
          fontFamily: 'Inter, sans-serif', opacity: uploading ? 0.7 : 1,
        }}>
          {uploading ? '...' : 'Simpan'}
        </button>
      </div>

      {/* Crop Area */}
      <div style={{ position: 'relative', flex: 1, background: '#000' }}>
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
      <div style={{
        background: '#0F172A',
        padding: '16px 20px 32px',
        flexShrink: 0,
      }}>
        {/* Shape Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
          {[{ id: 'round', label: '⭕ Bulat' }, { id: 'rect', label: '⬜ Kotak' }].map(s => (
            <button key={s.id} onClick={() => setShape(s.id)} style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              background: shape === s.id ? '#1D4ED8' : 'transparent',
              color: shape === s.id ? '#fff' : '#64748B',
              borderColor: shape === s.id ? '#2563EB' : '#1E293B',
            }}>{s.label}</button>
          ))}
        </div>

        {/* Zoom */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>🔍 Zoom</label>
            <span style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600 }}>{zoom.toFixed(1)}x</span>
          </div>
          <input type="range" min={1} max={3} step={0.05} value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#2563EB', height: '4px' }} />
        </div>

        {/* Rotation */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>🔄 Rotasi</label>
            <span style={{ fontSize: '12px', color: '#60A5FA', fontWeight: 600 }}>{rotation}°</span>
          </div>
          <input type="range" min={-180} max={180} step={1} value={rotation}
            onChange={e => setRotation(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#2563EB', height: '4px' }} />
        </div>

        {/* Quick rotate */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setRotation(r => r - 90)} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #1E293B', background: 'transparent',
            color: '#94A3B8', fontSize: '13px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>↺ -90°</button>
          <button onClick={() => setRotation(r => r + 90)} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #1E293B', background: 'transparent',
            color: '#94A3B8', fontSize: '13px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>↻ +90°</button>
          <button onClick={() => setRotation(0)} style={{
            flex: 1, padding: '10px', borderRadius: '10px',
            border: '1px solid #1E293B', background: 'transparent',
            color: '#94A3B8', fontSize: '13px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>Reset</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilEditPage() {
  const router = useRouter();
  const { user, loaded, login } = useUser();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    full_name: '', email: '', bio: '', phone: '',
    location: '', job_title: '', avatar_url: '',
  });
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('profil');
  const [skillForm, setSkillForm] = useState({ skill_name: '', level: 'Pemula' });
  const [addingSkill, setAddingSkill] = useState(false);
  const [expForm, setExpForm] = useState({
    company: '', position: '', start_year: '', end_year: '', description: '',
  });
  const [addingExp, setAddingExp] = useState(false);
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
    if (u) setProfile({
      full_name: u.full_name || '', email: u.email || '', bio: u.bio || '',
      phone: u.phone || '', location: u.location || '',
      job_title: u.job_title || '', avatar_url: u.avatar_url || '',
    });
    setSkills(sk || []);
    setExperiences(ex || []);
    setLoading(false);
  };

  const showMsg = (text, isError = false) => {
    setMsg({ text, type: isError ? 'error' : 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg('Ukuran foto maksimal 5MB.', true); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showMsg('Format foto harus JPG, PNG, atau WebP.', true); return;
    }
    const reader = new FileReader();
    reader.onload = () => { setRawImageSrc(reader.result); setShowEditor(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveCroppedPhoto = async (croppedBlobUrl) => {
    setUploadingPhoto(true);
    try {
      const response = await fetch(croppedBlobUrl);
      const blob = await response.blob();
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      login({ ...user, avatar_url: publicUrl });
      setShowEditor(false);
      setRawImageSrc(null);
      showMsg('Foto profil berhasil diperbarui! ✅');
    } catch (err) {
      showMsg('Gagal upload foto: ' + err.message, true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
      setProfile(prev => ({ ...prev, avatar_url: '' }));
      login({ ...user, avatar_url: null });
      showMsg('Foto profil dihapus.');
    } catch { showMsg('Gagal menghapus foto.', true); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await supabase.from('users').update({
        full_name: profile.full_name, bio: profile.bio,
        phone: profile.phone, location: profile.location, job_title: profile.job_title,
      }).eq('id', user.id);
      login({ ...user, full_name: profile.full_name });
      showMsg('Profil berhasil disimpan! ✅');
    } catch (e) { showMsg('Gagal menyimpan: ' + e.message, true); }
    finally { setSaving(false); }
  };

  const addSkill = async () => {
    if (!skillForm.skill_name.trim()) return;
    setAddingSkill(true);
    try {
      const { data } = await supabase.from('user_skills')
        .insert([{ user_id: user.id, skill_name: skillForm.skill_name, level: skillForm.level }])
        .select().single();
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
      const { data } = await supabase.from('user_experience').insert([{
        user_id: user.id, ...expForm,
        start_year: parseInt(expForm.start_year) || null,
        end_year: expForm.end_year ? parseInt(expForm.end_year) : null,
      }]).select().single();
      setExperiences(prev => [data, ...prev]);
      setExpForm({ company: '', position: '', start_year: '', end_year: '', description: '' });
    } catch (e) { console.error(e); }
    finally { setAddingExp(false); }
  };

  const deleteExperience = async (id) => {
    await supabase.from('user_experience').delete().eq('id', id);
    setExperiences(prev => prev.filter(e => e.id !== id));
  };

  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) : '?';
  const levelColor = (l) =>
    l === 'Mahir' ? { bg: '#F0FDF4', color: '#16A34A' } :
    l === 'Menengah' ? { bg: '#EFF6FF', color: '#2563EB' } :
    { bg: '#F1F5F9', color: '#64748B' };
  const completeness = Math.round(
    ([profile.bio, profile.phone, profile.location, profile.job_title, profile.avatar_url, skills.length > 0, experiences.length > 0]
      .filter(Boolean).length / 7) * 100
  );

  const tabs = [
    { id: 'profil', label: 'Profil', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'pengalaman', label: 'Pengalaman', icon: '💼' },
  ];

  if (!loaded || !user) return null;

  return (
    <>
      {/* Global mobile styles */}
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            padding-top: 52px !important;
            padding-bottom: 80px !important;
          }
          .bottom-tab-bar { display: flex !important; }
          .mobile-header { display: none !important; }
          .desktop-header { display: none !important; }
        }
        @media (min-width: 769px) {
          .bottom-tab-bar { display: none !important; }
          .mobile-header { display: none !important; }
        }
        input, textarea, select {
          font-size: 16px !important;
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
        {/* Sidebar - sudah handle mobile topbar & desktop sendiri */}
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

        {/* Main */}
        <main
          className="main-content"
          style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '24px 28px' }}
        >
          {/* Desktop Header */}
          <div className="desktop-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Profil Saya</h1>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Kelola informasi profil dan pengalaman kariermu</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => router.push('/dokumen')} style={{ ...S.btnOutline, width: 'auto', padding: '10px 18px' }}>📁 Dokumen</button>
              <button onClick={() => router.push('/profil')} style={{ ...S.btnOutline, width: 'auto', padding: '10px 18px' }}>👁 Lihat Profil</button>
            </div>
          </div>

          {/* Toast Notification */}
          {msg.text && (
            <div style={{
              margin: '0 16px 12px',
              padding: '14px 16px',
              background: msg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${msg.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
              borderRadius: '12px',
              color: msg.type === 'error' ? '#DC2626' : '#16A34A',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {msg.text}
            </div>
          )}

          {/* Profile Card (Mobile Hero) */}
          <div style={{ padding: '0 16px', marginBottom: '4px' }}>
            <div style={{
              ...S.card,
              padding: '24px 20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #fff 100%)',
              border: '1px solid #BFDBFE',
            }}>
              {/* Avatar */}
              <div style={{ position: 'relative', width: '90px', margin: '0 auto 16px', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid #BFDBFE', display: 'block',
                  }} />
                ) : (
                  <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '28px',
                  }}>
                    {initials(profile.full_name)}
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#2563EB', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                }}>📷</div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect} style={{ display: 'none' }} />
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                {profile.full_name || 'Nama Kamu'}
              </h2>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 2px', fontWeight: 500 }}>
                {profile.job_title || 'Tambahkan jabatan'}
              </p>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '0 0 16px' }}>
                {profile.location ? `📍 ${profile.location}` : 'Tambahkan lokasi'}
              </p>

              {/* Photo buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{
                  flex: 1, maxWidth: '180px',
                  padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid #BFDBFE', background: '#EFF6FF',
                  color: '#2563EB', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px',
                }}>
                  📷 {profile.avatar_url ? 'Ganti Foto' : 'Upload Foto'}
                </button>
                {profile.avatar_url && (
                  <button onClick={handleRemovePhoto} style={{
                    padding: '10px 14px', borderRadius: '10px',
                    border: '1px solid #FECACA', background: '#FEF2F2',
                    color: '#DC2626', fontSize: '13px', cursor: 'pointer',
                  }}>🗑️</button>
                )}
              </div>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>JPG, PNG, WebP • Maks 5MB</p>

              {/* Completeness */}
              <div style={{
                marginTop: '16px', paddingTop: '16px',
                borderTop: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Kelengkapan profil</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: completeness === 100 ? '#16A34A' : '#2563EB' }}>
                    {completeness}%
                  </span>
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${completeness}%`, height: '100%',
                    background: completeness === 100
                      ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                      : 'linear-gradient(90deg, #2563EB, #3B82F6)',
                    borderRadius: '4px', transition: 'width 0.5s ease',
                  }} />
                </div>
                {completeness < 100 && (
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', textAlign: 'left' }}>
                    Belum lengkap: {!profile.avatar_url && 'Foto • '}{!profile.bio && 'Bio • '}{!profile.job_title && 'Jabatan • '}{!profile.location && 'Lokasi'}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                <div style={{
                  background: '#F8FAFC', borderRadius: '10px',
                  padding: '12px', textAlign: 'center', border: '1px solid #F1F5F9',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563EB' }}>{skills.length}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Skills</div>
                </div>
                <div style={{
                  background: '#F8FAFC', borderRadius: '10px',
                  padding: '12px', textAlign: 'center', border: '1px solid #F1F5F9',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#16A34A' }}>{experiences.length}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Pengalaman</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '0 16px' }}>
            {loading ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <p style={{ color: '#94A3B8', fontSize: '14px' }}>Memuat profil...</p>
              </div>
            ) : activeTab === 'profil' ? (
              /* ── Info Dasar ── */
              <div style={S.card}>
                <div style={S.sectionTitle}>
                  <span>Informasi Dasar</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={S.label}>Nama Lengkap</label>
                    <input style={S.input} value={profile.full_name}
                      onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Nama lengkapmu" />
                  </div>
                  <div>
                    <label style={S.label}>Email</label>
                    <input style={{ ...S.input, background: '#F1F5F9', color: '#94A3B8' }}
                      value={profile.email} disabled />
                  </div>
                  <div>
                    <label style={S.label}>Jabatan / Posisi</label>
                    <input style={S.input} value={profile.job_title}
                      onChange={e => setProfile({ ...profile, job_title: e.target.value })}
                      placeholder="Contoh: Frontend Developer" />
                  </div>
                  <div>
                    <label style={S.label}>Nomor Telepon</label>
                    <input style={S.input} type="tel" value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Contoh: 08123456789" />
                  </div>
                  <div>
                    <label style={S.label}>Lokasi</label>
                    <input style={S.input} value={profile.location}
                      onChange={e => setProfile({ ...profile, location: e.target.value })}
                      placeholder="Contoh: Jakarta, Indonesia" />
                  </div>
                  <div>
                    <label style={S.label}>Bio / Tentang Saya</label>
                    <textarea style={{ ...S.input, resize: 'vertical', minHeight: '110px', lineHeight: 1.7 }}
                      value={profile.bio}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Ceritakan tentang dirimu, pengalaman, dan tujuan karier..." />
                  </div>
                  <button onClick={saveProfile} disabled={saving} style={{
                    ...S.btn,
                    background: saving ? '#93C5FD' : '#2563EB',
                    marginTop: '4px',
                  }}>
                    {saving ? '⏳ Menyimpan...' : '💾 Simpan Profil'}
                  </button>
                </div>
              </div>

            ) : activeTab === 'skills' ? (
              /* ── Skills ── */
              <div>
                <div style={S.card}>
                  <div style={S.sectionTitle}><span>Tambah Skill Baru</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Nama Skill</label>
                      <input style={S.input} value={skillForm.skill_name}
                        onChange={e => setSkillForm({ ...skillForm, skill_name: e.target.value })}
                        placeholder="Contoh: React.js, Figma..."
                        onKeyDown={e => e.key === 'Enter' && addSkill()} />
                    </div>
                    <div>
                      <label style={S.label}>Level</label>
                      <select style={{ ...S.input, cursor: 'pointer' }}
                        value={skillForm.level}
                        onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}>
                        <option>Pemula</option>
                        <option>Menengah</option>
                        <option>Mahir</option>
                      </select>
                    </div>
                    <button onClick={addSkill} disabled={addingSkill} style={{
                      ...S.btn,
                      background: addingSkill ? '#93C5FD' : '#2563EB',
                    }}>
                      {addingSkill ? '⏳ Menambahkan...' : '+ Tambah Skill'}
                    </button>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.sectionTitle}><span>Skills Saya ({skills.length})</span></div>
                  {skills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
                      <p style={{ color: '#94A3B8', fontSize: '14px' }}>Belum ada skill. Tambahkan skill pertamamu!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {skills.map(s => {
                        const lc = levelColor(s.level);
                        return (
                          <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: lc.bg, border: `1px solid ${lc.color}40`,
                            borderRadius: '10px', padding: '10px 14px',
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: lc.color }}>
                              {s.skill_name}
                            </span>
                            <span style={{ fontSize: '11px', color: lc.color, opacity: 0.8 }}>
                              · {s.level}
                            </span>
                            <button onClick={() => deleteSkill(s.id)} style={{
                              background: 'none', border: 'none', color: lc.color,
                              cursor: 'pointer', fontSize: '18px', opacity: 0.7,
                              padding: '0 0 0 4px', lineHeight: 1,
                            }}>×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            ) : (
              /* ── Pengalaman ── */
              <div>
                <div style={S.card}>
                  <div style={S.sectionTitle}><span>Tambah Pengalaman</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={S.label}>Perusahaan</label>
                      <input style={S.input} value={expForm.company}
                        onChange={e => setExpForm({ ...expForm, company: e.target.value })}
                        placeholder="Nama perusahaan" />
                    </div>
                    <div>
                      <label style={S.label}>Posisi</label>
                      <input style={S.input} value={expForm.position}
                        onChange={e => setExpForm({ ...expForm, position: e.target.value })}
                        placeholder="Posisimu di perusahaan" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={S.label}>Tahun Mulai</label>
                        <input style={S.input} type="number" value={expForm.start_year}
                          onChange={e => setExpForm({ ...expForm, start_year: e.target.value })}
                          placeholder="2022" />
                      </div>
                      <div>
                        <label style={S.label}>Tahun Selesai</label>
                        <input style={S.input} type="number" value={expForm.end_year}
                          onChange={e => setExpForm({ ...expForm, end_year: e.target.value })}
                          placeholder="2024 / kosong" />
                      </div>
                    </div>
                    <div>
                      <label style={S.label}>Deskripsi</label>
                      <textarea style={{ ...S.input, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }}
                        value={expForm.description}
                        onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                        placeholder="Jelaskan tanggung jawab dan pencapaianmu..." />
                    </div>
                    <button onClick={addExperience} disabled={addingExp} style={{
                      ...S.btn,
                      background: addingExp ? '#93C5FD' : '#2563EB',
                    }}>
                      {addingExp ? '⏳ Menyimpan...' : '+ Tambah Pengalaman'}
                    </button>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.sectionTitle}><span>Riwayat Pengalaman ({experiences.length})</span></div>
                  {experiences.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>💼</div>
                      <p style={{ color: '#94A3B8', fontSize: '14px' }}>Belum ada pengalaman kerja.</p>
                    </div>
                  ) : experiences.map((ex, i) => (
                    <div key={ex.id} style={{
                      display: 'flex', gap: '14px',
                      paddingBottom: '20px', marginBottom: '20px',
                      borderBottom: i < experiences.length - 1 ? '1px solid #F1F5F9' : 'none',
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: '#EFF6FF', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                      }}>🏢</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>
                              {ex.position}
                            </p>
                            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#2563EB', fontSize: '13px' }}>
                              {ex.company}
                            </p>
                            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94A3B8' }}>
                              {ex.start_year} – {ex.end_year || 'Sekarang'}
                            </p>
                          </div>
                          <button onClick={() => deleteExperience(ex.id)} style={{ ...S.btnDanger, flexShrink: 0 }}>
                            Hapus
                          </button>
                        </div>
                        {ex.description && (
                          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                            {ex.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── Bottom Tab Bar (Mobile Only) ── */}
        <nav className="bottom-tab-bar" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '1px solid #E2E8F0',
          display: 'flex', zIndex: 200,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '12px 8px 10px',
              border: 'none', background: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              borderTop: `2px solid ${activeTab === tab.id ? '#2563EB' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{
                fontSize: '11px', fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#2563EB' : '#94A3B8',
              }}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}