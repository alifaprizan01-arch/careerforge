'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

const emptyTraining = { title: '', category_id: '', description: '', thumbnail_url: '' };
const emptyModule = { title: '', content_url: '', duration_mins: '' };

export default function AdminPelatihanPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [trainings, setTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [msg, setMsg] = useState('');

  // Training form (add/edit)
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyTraining);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Module manager
  const [moduleFor, setModuleFor] = useState(null);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [moduleFile, setModuleFile] = useState(null);
  const [savingModule, setSavingModule] = useState(false);

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') { fetchTrainings(); fetchCategories(); } }, [user]);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trainings')
        .select('*, training_categories(name), training_modules(count), user_trainings(count)')
        .order('id', { ascending: false });
      if (error) console.error('Fetch error:', error);
      setTrainings((data || []).filter(t => t != null));
    } catch (e) { console.error(e); setTrainings([]); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('training_categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // ---- Training add/edit ----
  const openAdd = () => { setEditItem(null); setForm(emptyTraining); setShowForm(true); };
  const openEdit = (t) => {
    setEditItem(t);
    setForm({ title: t.title || '', category_id: t.category_id || '', description: t.description || '', thumbnail_url: t.thumbnail_url || '' });
    setShowForm(true);
  };

  const saveTraining = async () => {
    if (!form.title.trim()) { flash('Gagal: Judul pelatihan wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category_id: form.category_id ? parseInt(form.category_id) : null,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
      };
      if (editItem) {
        const { error } = await supabase.from('trainings').update(payload).eq('id', editItem.id);
        if (error) throw error;
        flash('Pelatihan berhasil diperbarui!');
      } else {
        const { error } = await supabase.from('trainings').insert([payload]);
        if (error) throw error;
        flash('Pelatihan berhasil ditambahkan!');
      }
      setShowForm(false); setEditItem(null); setForm(emptyTraining);
      fetchTrainings();
    } catch (e) { flash('Gagal: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash('Gagal: file harus berupa gambar.'); return; }
    if (file.size > 5 * 1024 * 1024) { flash('Gagal: ukuran gambar maksimal 5MB.'); return; }
    setUploadingImage(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `trainings/${editItem?.id || 'new'}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from('training-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('training-images').getPublicUrl(path);
      setForm(f => ({ ...f, thumbnail_url: urlData.publicUrl }));
      flash('Gambar berhasil diunggah!');
    } catch (e) { flash('Gagal mengunggah gambar: ' + e.message); }
    finally { setUploadingImage(false); }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('trainings').delete().eq('id', id);
      if (error) throw error;
      setTrainings(prev => prev.filter(t => t.id !== id));
      flash('Pelatihan berhasil dihapus.');
    } catch (e) { flash('Gagal menghapus (mungkin masih punya modul/peserta terkait): ' + e.message); }
    setDeleteConfirm(null);
  };

  // ---- Module manager ----
  const openModules = async (t) => {
    setModuleFor(t); setModuleForm(emptyModule); setModuleFile(null); setModules([]); setLoadingModules(true);
    const { data } = await supabase.from('training_modules').select('*').eq('training_id', t.id).order('order_index');
    setModules(data || []);
    setLoadingModules(false);
  };

  const addModule = async () => {
    if (!moduleForm.title.trim()) { flash('Gagal: Judul modul wajib diisi.'); return; }
    setSavingModule(true);
    try {
      let contentUrl = moduleForm.content_url || null;
      if (moduleFile) {
        const safe = moduleFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `training-modules/${moduleFor.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from('training-materials').upload(path, moduleFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('training-materials').getPublicUrl(path);
        contentUrl = urlData.publicUrl;
      }
      const nextOrder = modules.length ? Math.max(...modules.map(m => m.order_index || 0)) + 1 : 1;
      const payload = {
        training_id: moduleFor.id,
        title: moduleForm.title.trim(),
        content_url: contentUrl,
        duration_mins: moduleForm.duration_mins ? parseInt(moduleForm.duration_mins) : null,
        order_index: nextOrder,
      };
      const { error } = await supabase.from('training_modules').insert([payload]);
      if (error) throw error;
      setModuleForm(emptyModule); setModuleFile(null);
      const { data } = await supabase.from('training_modules').select('*').eq('training_id', moduleFor.id).order('order_index');
      setModules(data || []);
      fetchTrainings();
    } catch (e) { flash('Gagal menambah modul: ' + e.message); }
    finally { setSavingModule(false); }
  };

  const deleteModule = async (id) => {
    try {
      const { error } = await supabase.from('training_modules').delete().eq('id', id);
      if (error) throw error;
      setModules(prev => prev.filter(m => m.id !== id));
      fetchTrainings();
    } catch (e) { flash('Gagal menghapus modul: ' + e.message); }
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC', inputText: isDark ? '#F1F5F9' : '#0F172A',
    slate: isDark ? '#94A3B8' : '#475569', slateBg: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
  };
  const inp = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'inherit', boxSizing: 'border-box' };

  const modCount = t => t.training_modules?.[0]?.count ?? 0;
  const enrolledCount = t => t.user_trainings?.[0]?.count ?? 0;

  const usedCategories = ['all', ...Array.from(new Set(trainings.map(t => t.training_categories?.name).filter(Boolean)))];
  const filtered = trainings.filter(t =>
    (!search || (t.title || '').toLowerCase().includes(search.toLowerCase()))
    && (catFilter === 'all' || t.training_categories?.name === catFilter)
  );
  const totalModules = trainings.reduce((s, t) => s + modCount(t), 0);
  const totalEnrolled = trainings.reduce((s, t) => s + enrolledCount(t), 0);

  if (!loaded || !user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>🛡️ ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Pelatihan</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd}
          style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: c.card, color: c.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          ➕ Tambah Pelatihan
        </motion.button>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: msg.includes('Gagal') ? (isDark ? '#450A0A' : '#FEF2F2') : c.slateBg, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.slate}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.slate, marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</motion.div>}

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Total Pelatihan', value: trainings.length, icon: '🎓' },
              { label: 'Total Modul', value: totalModules, icon: '📚' },
              { label: 'Total Peserta', value: totalEnrolled, icon: '👥' },
            ].map((s, i) => (
              <div key={i} style={{ background: c.card, borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', borderColor: c.border, borderTopWidth: '3px', borderTopColor: c.slate, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px' }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: c.text, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
                  <div style={{ fontSize: '12px', color: c.muted, marginTop: '3px' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '12px' }}>
            <span style={{ color: c.muted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pelatihan berdasarkan judul..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.text, fontFamily: 'inherit' }} />
            <span style={{ fontSize: '13px', color: c.muted }}>{filtered.length} pelatihan</span>
          </div>

          {/* Category filter */}
          {usedCategories.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {usedCategories.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${catFilter === cat ? c.slate : c.border}`,
                  background: catFilter === cat ? c.slateBg : 'transparent',
                  color: catFilter === cat ? c.slate : c.muted,
                }}>{cat === 'all' ? 'Semua Kategori' : cat}</button>
              ))}
            </div>
          )}

          {/* List */}
          {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
          filtered.length === 0 ? (
            <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '70px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
              <p style={{ color: c.muted, marginBottom: '16px' }}>{trainings.length === 0 ? 'Belum ada pelatihan.' : 'Tidak ada pelatihan yang cocok.'}</p>
              {trainings.length === 0 && <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: c.slate, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>➕ Tambah Pelatihan</motion.button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '14px' }}>
              {filtered.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3 }}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.10)'} onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: c.slateBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, overflow: 'hidden' }}>
                      {t.thumbnail_url ? <img src={t.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎓'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '6px', lineHeight: 1.3 }}>{t.title || 'Tanpa Judul'}</h3>
                      {t.training_categories?.name && (
                        <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: c.slateBg, color: c.slate, fontWeight: 600 }}>{t.training_categories.name}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: c.muted }}>
                    <span>📚 {modCount(t)} modul</span>
                    <span>👥 {enrolledCount(t)} peserta</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => openModules(t)}
                      style={{ flex: 1, minWidth: '100px', padding: '8px', borderRadius: '8px', border: 'none', background: c.slate, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      🧩 Kelola Modul
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(t)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${c.slate}`, background: 'transparent', color: c.slate, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push(`/pelatihan/${t.id}`)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>👁️</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirm(t)}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️</motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </PageTransition>
      </main>

      {/* ===== Add/Edit Training Modal ===== */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 10 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: c.text, marginBottom: '18px' }}>{editItem ? '✏️ Edit Pelatihan' : '➕ Tambah Pelatihan'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.muted, marginBottom: '6px' }}>Judul Pelatihan *</label>
                  <input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Dasar Pemrograman Web" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.muted, marginBottom: '6px' }}>Kategori</label>
                  <select style={inp} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">— Pilih kategori —</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.muted, marginBottom: '6px' }}>Deskripsi</label>
                  <textarea style={{ ...inp, resize: 'vertical', minHeight: '90px', lineHeight: 1.6 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Penjelasan singkat tentang pelatihan ini..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.muted, marginBottom: '6px' }}>Gambar Pelatihan (opsional)</label>
                  <div style={{ border: `1px dashed ${c.border}`, borderRadius: '8px', padding: '12px', background: c.input }}>
                    {form.thumbnail_url ? (
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <img src={form.thumbnail_url} alt="Pratinjau gambar" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
                        <button type="button" onClick={() => setForm({ ...form, thumbnail_url: '' })} style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: c.muted, marginBottom: '8px' }}>🖼️ Unggah gambar (JPG / PNG / WebP, maks 5MB)</div>
                    )}
                    <input type="file" accept="image/*" disabled={uploadingImage} onChange={e => handleImageUpload(e.target.files?.[0])} style={{ fontSize: '12px', color: c.text, maxWidth: '100%' }} />
                    {uploadingImage && <div style={{ marginTop: '8px', fontSize: '12px', color: c.slate }}>⏳ Mengunggah gambar...</div>}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer', fontWeight: 500 }}>Batal</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={saveTraining} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: saving ? c.muted : c.slate, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : (editItem ? '💾 Simpan Perubahan' : '➕ Tambah Pelatihan')}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Module Manager Modal ===== */}
      <AnimatePresence>
        {moduleFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModuleFor(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 10 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: c.text }}>🧩 Kelola Modul</h3>
                <button onClick={() => setModuleFor(null)} style={{ border: 'none', background: 'transparent', color: c.muted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '18px' }}>{moduleFor.title}</p>

              {/* Existing modules */}
              {loadingModules ? <p style={{ color: c.muted, fontSize: '13px' }}>Memuat modul...</p> :
              modules.length === 0 ? <p style={{ color: c.muted, fontSize: '13px', marginBottom: '16px' }}>Belum ada modul. Tambahkan di bawah.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {modules.map((m, idx) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.input }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: c.slateBg, color: c.slate, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                        <div style={{ fontSize: '11px', color: c.muted }}>{m.duration_mins ? `${m.duration_mins} menit` : 'Durasi -'}{m.content_url ? ' • 📎 ada materi' : ''}</div>
                      </div>
                      {m.content_url && <a href={m.content_url} target="_blank" rel="noreferrer" style={{ border: `1px solid ${c.border}`, color: c.slate, borderRadius: '6px', padding: '4px 8px', fontSize: '11px', textDecoration: 'none' }}>Lihat</a>}
                      <button onClick={() => deleteModule(m.id)} style={{ border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>Hapus</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add module form */}
              <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, marginBottom: '10px' }}>Tambah Modul Baru</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input style={inp} value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Judul modul *" />
                  <input style={inp} value={moduleForm.content_url} onChange={e => setModuleForm({ ...moduleForm, content_url: e.target.value })} placeholder="URL video/link (opsional jika mengunggah file)" />
                  <div style={{ border: `1px dashed ${c.border}`, borderRadius: '8px', padding: '12px', background: c.input }}>
                    <div style={{ fontSize: '12px', color: c.muted, marginBottom: '8px' }}>📎 Unggah file materi (PDF / PPT / PPTX) — dapat dibuka & dipelajari peserta</div>
                    <input type="file" accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={e => setModuleFile(e.target.files?.[0] || null)} style={{ fontSize: '12px', color: c.text, maxWidth: '100%' }} />
                    {moduleFile && <div style={{ marginTop: '8px', fontSize: '12px', color: c.slate, display: 'flex', alignItems: 'center', gap: '8px' }}>📄 {moduleFile.name} <button onClick={() => setModuleFile(null)} style={{ border: 'none', background: 'transparent', color: c.muted, cursor: 'pointer' }}>✕</button></div>}
                  </div>
                  <input style={inp} type="number" value={moduleForm.duration_mins} onChange={e => setModuleForm({ ...moduleForm, duration_mins: e.target.value })} placeholder="Durasi (menit)" />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={addModule} disabled={savingModule} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: savingModule ? c.muted : c.slate, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{savingModule ? (moduleFile ? 'Mengunggah...' : 'Menambah...') : '➕ Tambah Modul'}</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Delete confirm ===== */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '14px', padding: '24px', maxWidth: '380px', width: '100%' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Hapus pelatihan?</h3>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '18px' }}>"{deleteConfirm.title}" akan dihapus permanen.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer' }}>Batal</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}