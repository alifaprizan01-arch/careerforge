'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition, { StaggerContainer, StaggerItem } from '../../components/PageTransition';

const emptyForm = { tujuan: '', asal: '', jenis: 'Full Time', company: '', deskripsi: '', requirements: '', salary_min: '', salary_max: '', deadline: '' };

export default function AdminLowonganPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [trayek, setTrayek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if (loaded && (!user || user.role !== 'admin')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'admin') fetchTrayek(); }, [user]);

  const fetchTrayek = async () => {
    setLoading(true);
    const { data } = await supabase.from('trayek').select('*').order('id', { ascending: false });
    setTrayek(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.tujuan.trim()) { setMsg('Nama posisi wajib diisi.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, salary_min: form.salary_min ? parseInt(form.salary_min) : null, salary_max: form.salary_max ? parseInt(form.salary_max) : null, deadline: form.deadline || null };
      if (editItem) {
        await supabase.from('trayek').update(payload).eq('id', editItem.id);
        setTrayek(prev => prev.map(t => t.id === editItem.id ? { ...t, ...payload } : t));
        setMsg('Lowongan berhasil diperbarui!');
      } else {
        const { data } = await supabase.from('trayek').insert([payload]).select().single();
        setTrayek(prev => [data, ...prev]);
        setMsg('Lowongan berhasil ditambahkan!');
      }
      setShowForm(false); setEditItem(null); setForm(emptyForm);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal menyimpan: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ tujuan: item.tujuan||'', asal: item.asal||'', jenis: item.jenis||'Full Time', company: item.company||'', deskripsi: item.deskripsi||'', requirements: item.requirements||'', salary_min: item.salary_min||'', salary_max: item.salary_max||'', deadline: item.deadline||'' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('trayek').delete().eq('id', id);
    setTrayek(prev => prev.filter(t => t.id !== id));
    setDeleteConfirm(null);
    setMsg('Lowongan dihapus.');
    setTimeout(() => setMsg(''), 3000);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF',
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };
  const filtered = trayek.filter(t => !search || t.tujuan?.toLowerCase().includes(search.toLowerCase()) || t.company?.toLowerCase().includes(search.toLowerCase()));

  if (!loaded || !user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: isDark ? '#1E293B' : '#1E3A5F', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Lowongan</span>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setShowForm(true); setEditItem(null); setForm(emptyForm); }}
          style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          + Tambah Lowongan
        </motion.button>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: msg.includes('Gagal') ? isDark ? '#450A0A' : '#FEF2F2' : c.blueLight, border: `1px solid ${msg.includes('Gagal') ? '#DC2626' : c.blue}44`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.blue, marginBottom: '20px', fontSize: '13px' }}>{msg}</motion.div>}

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '20px' }}>
            <span style={{ color: c.muted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari lowongan..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.inputText }} />
            <span style={{ fontSize: '13px', color: c.muted }}>{filtered.length} lowongan</span>
          </div>

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  style={{ background: c.card, borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: c.card, zIndex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, margin: 0 }}>{editItem ? 'Edit Lowongan' : 'Tambah Lowongan Baru'}</h3>
                    <button onClick={() => { setShowForm(false); setEditItem(null); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: c.muted }}>×</button>
                  </div>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Nama Posisi *</label><input style={inputStyle} value={form.tujuan} onChange={e => setForm({ ...form, tujuan: e.target.value })} placeholder="Contoh: UI/UX Designer" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Perusahaan</label><input style={inputStyle} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Nama perusahaan" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Lokasi</label><input style={inputStyle} value={form.asal} onChange={e => setForm({ ...form, asal: e.target.value })} placeholder="Contoh: Jakarta" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Tipe</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}>
                          <option>Full Time</option><option>Remote</option><option>Setengah Hari</option><option>Freelance</option>
                        </select>
                      </div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Gaji Min (Rp)</label><input style={inputStyle} type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })} placeholder="5000000" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Gaji Max (Rp)</label><input style={inputStyle} type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })} placeholder="10000000" /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Deadline</label><input style={inputStyle} type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                    </div>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Deskripsi Pekerjaan</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Jelaskan tentang pekerjaan ini..." /></div>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Persyaratan (satu per baris)</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="Minimal S1&#10;Pengalaman 2 tahun&#10;Menguasai Figma" /></div>
                  </div>
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '10px', position: 'sticky', bottom: 0, background: c.card }}>
                    <button onClick={() => { setShowForm(false); setEditItem(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '14px', cursor: 'pointer' }}>Batal</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: saving ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      {saving ? 'Menyimpan...' : editItem ? '💾 Perbarui' : '+ Tambah'}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirm */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: c.card, borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%', margin: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '14px' }}>🗑️</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Hapus Lowongan?</h3>
                  <p style={{ fontSize: '13px', color: c.muted, marginBottom: '20px' }}>Lowongan <strong>{deleteConfirm.tujuan}</strong> akan dihapus permanen.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer' }}>Batal</button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 120px', gap: '12px' }}>
              {['Posisi / Perusahaan', 'Lokasi', 'Tipe', 'Gaji', 'Aksi'].map(h => (
                <div key={h} style={{ fontSize: '12px', fontWeight: 600, color: c.muted, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: c.muted }}>Memuat...</div> :
            filtered.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: c.muted }}>Belum ada lowongan.</div> :
            filtered.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${c.border}` : 'none', display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 120px', gap: '12px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: c.text, fontSize: '14px', marginBottom: '2px' }}>{item.tujuan}</div>
                  <div style={{ fontSize: '12px', color: c.muted }}>{item.company || 'Perusahaan'}</div>
                </div>
                <div style={{ fontSize: '13px', color: c.muted }}>{item.asal || '-'}</div>
                <div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: c.blueLight, color: c.blue, fontWeight: 500 }}>{item.jenis || 'Full Time'}</span>
                </div>
                <div style={{ fontSize: '12px', color: c.muted }}>
                  {item.salary_min ? `${(item.salary_min/1000000).toFixed(0)}jt` : '-'}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleEdit(item)} style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${c.blue}`, background: 'transparent', color: c.blue, fontSize: '12px', cursor: 'pointer' }}>Edit</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirm(item)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', fontSize: '12px', cursor: 'pointer' }}>Hapus</motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
