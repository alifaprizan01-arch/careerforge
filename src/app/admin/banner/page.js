'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';

const PRESETS = [
  'linear-gradient(120deg,#2563EB,#4F46E5)',
  'linear-gradient(120deg,#7C3AED,#6D28D9)',
  'linear-gradient(120deg,#F97316,#FB923C)',
  'linear-gradient(120deg,#16A34A,#22C55E)',
  'linear-gradient(120deg,#0EA5E9,#2563EB)',
  'linear-gradient(120deg,#DB2777,#7C3AED)',
];
const EMPTY = { title: '', subtitle: '', button_text: '', button_link: '', image_url: '', bg_color: PRESETS[0], show_countdown: false, active: true };

// Dipindah ke luar agar tidak di-mount ulang setiap render (P9 fix)
// c.card & c.text dipass sebagai prop agar ikut dark mode (P2 fix)
function Preview({ b, small, cardBg, cardText }) {
  return (
    <div style={{ position: 'relative', borderRadius: small ? '12px' : '16px', overflow: 'hidden', background: b.bg_color || PRESETS[0], padding: small ? '16px 18px' : '26px 30px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: small ? '90px' : '150px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', marginBottom: '8px' }}>PROMO</span>
        <div style={{ fontSize: small ? '15px' : '20px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{b.title || 'Judul banner'}</div>
        {b.subtitle && <div style={{ fontSize: small ? '11px' : '13px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>{b.subtitle}</div>}
        {b.button_text && <span style={{ display: 'inline-block', marginTop: '10px', background: cardBg, color: cardText, fontSize: '11px', fontWeight: 700, padding: '6px 14px', borderRadius: '8px' }}>{b.button_text}</span>}
      </div>
      {b.image_url && <img src={b.image_url} alt="Banner preview" style={{ width: small ? '70px' : '120px', height: small ? '60px' : '100px', objectFit: 'contain', background: cardBg, borderRadius: '8px', padding: '6px' }} />}
    </div>
  );
}

export default function AdminBannerPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchBanners(); }, [user]);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_banner').select('*').order('id');
    setBanners(data || []);
    setLoading(false);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (b) => { setEditItem(b); setForm({ ...EMPTY, ...b }); setShowForm(true); };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `promo/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('banners').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    } catch (e) { flash('Gagal unggah gambar: ' + e.message); }
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) { flash('Gagal: Judul wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), subtitle: form.subtitle || null,
        button_text: form.button_text || null, button_link: form.button_link || null,
        image_url: form.image_url || null, bg_color: form.bg_color || null,
        show_countdown: !!form.show_countdown, active: !!form.active,
      };
      if (editItem) {
        const { error } = await supabase.from('promo_banner').update(payload).eq('id', editItem.id);
        if (error) throw error;
        flash('Banner diperbarui!');
      } else {
        const { error } = await supabase.from('promo_banner').insert([payload]);
        if (error) throw error;
        flash('Banner ditambahkan!');
      }
      setShowForm(false); fetchBanners();
    } catch (e) { flash('Gagal: ' + e.message); }
    setSaving(false);
  };

  const toggleActive = async (b) => {
    const { error } = await supabase.from('promo_banner').update({ active: !b.active }).eq('id', b.id);
    if (!error) setBanners(prev => prev.map(x => x.id === b.id ? { ...x, active: !x.active } : x));
  };

  const remove = async (id) => {
    const { error } = await supabase.from('promo_banner').delete().eq('id', id);
    if (error) flash('Gagal menghapus: ' + error.message);
    else { setBanners(prev => prev.filter(b => b.id !== id)); flash('Banner dihapus.'); }
    setDeleteConfirm(null);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC', inputText: isDark ? '#F1F5F9' : '#0F172A',
    slate: isDark ? '#94A3B8' : '#475569', slateBg: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
  };
  const inp = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'inherit', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: c.muted, marginBottom: '6px' };

  if (!loaded || !user || user.role !== 'admin') return null;



  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Banner</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: c.card, color: c.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>➕ Tambah Banner</motion.button>
      </div>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px 70px' }}>
        {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: msg.includes('Gagal') ? (isDark ? '#450A0A' : '#FEF2F2') : c.slateBg, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.slate}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.slate, marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</motion.div>}

        {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
        banners.length === 0 ? (
          <div style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '46px', marginBottom: '12px' }}>🖼️</div>
            <p style={{ color: c.muted, marginBottom: '16px' }}>Belum ada banner. Tambahkan banner promo pertamamu.</p>
            <button onClick={openAdd} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: c.slate, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>➕ Tambah Banner</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {banners.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '16px', opacity: b.active ? 1 : 0.6 }}>
                <Preview b={b} small cardBg={c.card} cardText={c.text} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <button onClick={() => toggleActive(b)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: b.active ? '#16A34A' : c.muted }}>
                    <span style={{ width: '42px', height: '24px', borderRadius: '20px', background: b.active ? '#16A34A' : (isDark ? '#475569' : '#CBD5E1'), position: 'relative', transition: 'background 0.2s', display: 'inline-block' }}>
                      <span style={{ position: 'absolute', top: '3px', left: b.active ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </span>
                    {b.active ? 'Aktif' : 'Nonaktif'}
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(b)} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${c.slate}`, background: 'transparent', color: c.slate, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
                    <button onClick={() => setDeleteConfirm(b)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Hapus</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.93, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 14 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '16px', padding: '26px', maxWidth: '560px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: c.text, marginBottom: '16px' }}>{editItem ? '✏️ Edit Banner' : '➕ Tambah Banner'}</h3>
              <div style={{ marginBottom: '18px' }}><Preview b={form} cardBg={c.card} cardText={c.text} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={lbl}>Judul *</label><input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Hemat 25% untuk satu tahun pembelajaran" /></div>
                <div><label style={lbl}>Subjudul</label><input style={inp} value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Deskripsi singkat promo..." /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}><label style={lbl}>Teks Tombol</label><input style={inp} value={form.button_text} onChange={e => setForm({ ...form, button_text: e.target.value })} placeholder="Hemat sekarang" /></div>
                  <div style={{ flex: 1 }}><label style={lbl}>Link Tombol</label><input style={inp} value={form.button_link} onChange={e => setForm({ ...form, button_link: e.target.value })} placeholder="/pelatihan" /></div>
                </div>
                <div>
                  <label style={lbl}>Warna / Gradien Latar</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {PRESETS.map(p => (
                      <button key={p} onClick={() => setForm({ ...form, bg_color: p })} style={{ width: '40px', height: '28px', borderRadius: '8px', cursor: 'pointer', background: p, border: form.bg_color === p ? `2px solid ${c.text}` : `1px solid ${c.border}` }} />
                    ))}
                  </div>
                  <input style={inp} value={form.bg_color} onChange={e => setForm({ ...form, bg_color: e.target.value })} placeholder="warna CSS atau linear-gradient(...)" />
                </div>
                <div>
                  <label style={lbl}>Gambar Banner</label>
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} style={{ fontSize: '13px', color: c.text }} />
                  {uploading && <div style={{ fontSize: '12px', color: c.muted, marginTop: '6px' }}>Mengunggah...</div>}
                  {form.image_url && <div style={{ fontSize: '12px', color: c.slate, marginTop: '6px' }}>✓ Gambar terpasang <button onClick={() => setForm({ ...form, image_url: '' })} style={{ border: 'none', background: 'transparent', color: c.muted, cursor: 'pointer' }}>✕ hapus</button></div>}
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: c.text, fontSize: '14px' }}>
                    <input type="checkbox" checked={!!form.show_countdown} onChange={e => setForm({ ...form, show_countdown: e.target.checked })} /> Tampilkan hitung mundur
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: c.text, fontSize: '14px' }}>
                    <input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Aktif (tampil di Beranda)
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer', fontWeight: 500 }}>Batal</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: saving ? c.muted : c.slate, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : (editItem ? '💾 Simpan' : '➕ Tambah')}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '360px', width: '100%' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Hapus banner?</h3>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '18px' }}>"{deleteConfirm.title}" akan dihapus permanen.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer' }}>Batal</button>
                <button onClick={() => remove(deleteConfirm.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}