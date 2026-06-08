'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

const emptyForm = { tujuan: '', asal: '', jenis: 'Full Time', company: '', deskripsi: '', requirements: '', salary_min: '', salary_max: '', deadline: '', required_documents: '' };

export default function CompanyLowonganPage() {
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { if (loaded && (!user || user.role !== 'company')) router.push('/'); }, [loaded, user]);
  useEffect(() => { if (user?.role === 'company') fetchTrayek(); }, [user]);

  const fetchTrayek = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trayek')
        .select('*')
        .eq('company_user_id', user.id)
        .order('id', { ascending: false });
      if (error) console.error('Fetch error:', error);
      setTrayek((data || []).filter(item => item != null));
    } catch (e) {
      console.error(e);
      setTrayek([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.tujuan.trim()) { setMsg('Nama posisi wajib diisi.'); return; }
    setSaving(true);
    try {
      const requiredDocs = form.required_documents ? form.required_documents.split('\n').filter(d => d.trim()) : [];
      const payload = { ...form, salary_min: form.salary_min ? parseInt(form.salary_min) : null, salary_max: form.salary_max ? parseInt(form.salary_max) : null, deadline: form.deadline || null, company: form.company || user.company_name, company_user_id: user.id, required_documents: requiredDocs };
      delete payload.required_documents_text;
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
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ tujuan: item.tujuan||'', asal: item.asal||'', jenis: item.jenis||'Full Time', company: item.company||'', deskripsi: item.deskripsi||'', requirements: item.requirements||'', salary_min: item.salary_min||'', salary_max: item.salary_max||'', deadline: item.deadline||'', required_documents: Array.isArray(item.required_documents) ? item.required_documents.join('\n') : '' });
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

  const inp = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  if (!loaded || !user || user.role !== 'company') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: isDark ? '#1E293B' : '#1E3A5F', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/company" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Lowongan Saya</span>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowForm(true); setEditItem(null); setForm(emptyForm); }}
          style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          + Buat Lowongan
        </motion.button>
      </div>

      <main style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: c.blueLight, border: `1px solid ${c.blue}44`, borderRadius: '8px', color: c.blue, marginBottom: '20px', fontSize: '13px' }}>{msg}</motion.div>}

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  style={{ background: c.card, borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: c.card, zIndex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, margin: 0 }}>{editItem ? 'Edit Lowongan' : 'Buat Lowongan Baru'}</h3>
                    <button onClick={() => { setShowForm(false); setEditItem(null); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: c.muted }}>×</button>
                  </div>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Nama Posisi *</label><input style={inp} value={form.tujuan} onChange={e => setForm({ ...form, tujuan: e.target.value })} placeholder="Contoh: UI/UX Designer" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Perusahaan</label><input style={{ ...inp, background: isDark ? '#334155' : '#F1F5F9', color: c.muted }} value={user.company_name || ''} disabled /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Lokasi</label><input style={inp} value={form.asal} onChange={e => setForm({ ...form, asal: e.target.value })} placeholder="Contoh: Jakarta" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Tipe Kerja</label>
                        <select style={{ ...inp, cursor: 'pointer' }} value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}>
                          <option>Full Time</option><option>Remote</option><option>Setengah Hari</option><option>Freelance</option><option>Internship</option>
                        </select>
                      </div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Gaji Min (Rp)</label><input style={inp} type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })} placeholder="5000000" /></div>
                      <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Gaji Max (Rp)</label><input style={inp} type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })} placeholder="10000000" /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Deadline Lamaran</label><input style={inp} type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                    </div>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Deskripsi Pekerjaan</label><textarea style={{ ...inp, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Jelaskan tanggung jawab dan informasi pekerjaan..." /></div>
                    <div><label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Persyaratan (satu per baris)</label><textarea style={{ ...inp, resize: 'vertical', minHeight: '70px', lineHeight: 1.6 }} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} placeholder="Minimal S1&#10;Pengalaman 2 tahun&#10;Menguasai Figma" /></div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>📎 Dokumen yang Dibutuhkan (satu per baris)</label>
                      <textarea style={{ ...inp, resize: 'vertical', minHeight: '70px', lineHeight: 1.6 }} value={form.required_documents} onChange={e => setForm({ ...form, required_documents: e.target.value })} placeholder="CV terbaru (PDF)&#10;Portfolio desain&#10;Sertifikat relevan" />
                      <p style={{ fontSize: '11px', color: c.muted, marginTop: '4px' }}>Dokumen ini akan ditampilkan kepada pelamar sebagai panduan</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '10px', position: 'sticky', bottom: 0, background: c.card }}>
                    <button onClick={() => { setShowForm(false); setEditItem(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '14px', cursor: 'pointer' }}>Batal</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: saving ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      {saving ? 'Menyimpan...' : editItem ? '💾 Perbarui' : '+ Buat Lowongan'}
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
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: c.card, borderRadius: '14px', padding: '28px', maxWidth: '360px', width: '100%', margin: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.text, marginBottom: '8px' }}>Hapus Lowongan?</h3>
                  <p style={{ fontSize: '13px', color: c.muted, marginBottom: '20px' }}><strong>{deleteConfirm.tujuan}</strong> akan dihapus permanen beserta semua lamarannya.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer' }}>Batal</button>
                    <button onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? <p style={{ color: c.muted }}>Memuat...</p> :
          trayek.length === 0 ? (
            <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={{ color: c.muted, marginBottom: '20px' }}>Belum ada lowongan. Buat lowongan pertamamu!</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)} style={{ padding: '11px 24px', borderRadius: '8px', border: 'none', background: c.blue, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>+ Buat Lowongan</motion.button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trayek.filter(item => item != null).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: c.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: c.blue, flexShrink: 0 }}>
                      {item.tujuan?.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: c.text, marginBottom: '4px' }}>{item.tujuan}</h3>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: c.muted }}>📍 {item.asal || '-'}</span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: c.blueLight, color: c.blue, fontWeight: 500 }}>{item.jenis || 'Full Time'}</span>
                        {item.salary_min && <span style={{ fontSize: '12px', color: c.muted }}>💰 Rp {(item.salary_min/1000000).toFixed(0)}jt{item.salary_max ? `-${(item.salary_max/1000000).toFixed(0)}jt` : '+'}</span>}
                        {item.deadline && <span style={{ fontSize: '12px', color: c.muted }}>⏰ {new Date(item.deadline).toLocaleDateString('id-ID')}</span>}
                      </div>
                      {Array.isArray(item.required_documents) && item.required_documents.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: c.muted }}>Dokumen diperlukan:</span>
                          {item.required_documents.map((d, j) => (
                            <span key={j} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: isDark ? '#334155' : '#F1F5F9', color: c.muted }}>📎 {d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleEdit(item)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${c.blue}`, background: 'transparent', color: c.blue, fontSize: '13px', cursor: 'pointer' }}>Edit</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirm(item)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #DC2626', background: 'transparent', color: '#DC2626', fontSize: '13px', cursor: 'pointer' }}>Hapus</motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </PageTransition>
      </main>
    </div>
  );
}
