'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

const DOC_CATEGORIES = [
  { value: 'cv', label: '📄 CV/Resume', color: 'badge-blue' },
  { value: 'portfolio', label: '🗂️ Portfolio', color: 'badge-purple' },
  { value: 'certificate', label: '🏆 Sertifikat', color: 'badge-yellow' },
  { value: 'cover_letter', label: '✉️ Cover Letter', color: 'badge-green' },
  { value: 'transcript', label: '📋 Transkrip', color: 'badge-blue' },
  { value: 'other', label: '📎 Lainnya', color: 'badge-gray' },
];

export default function DokumenPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const isMobile = useIsMobile();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('semua');
  const [msg, setMsg] = useState('');
  const [editDoc, setEditDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('cv');
  const [docDesc, setDocDesc] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchDocuments(); }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setMsg('Ukuran file maksimal 20MB.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `doc_${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('documents').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      const { data } = await supabase.from('user_documents').insert([{
        user_id: user.id,
        name: docName || file.name.replace(/\.[^/.]+$/, ''),
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        doc_category: docCategory,
        description: docDesc,
      }]).select().single();
      setDocuments(prev => [data, ...prev]);
      setMsg('✓ Dokumen berhasil diunggah!');
      setShowUpload(false); setDocName(''); setDocDesc(''); setDocCategory('cv');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Gagal upload: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleFileChange = e => { handleUpload(e.target.files?.[0]); e.target.value = ''; };

  const handleDrop = e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id, fileUrl) => {
    try {
      // Delete from storage
      const fileName = fileUrl.split('/').pop();
      await supabase.storage.from('documents').remove([fileName]);
      await supabase.from('user_documents').delete().eq('id', id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setDeleteConfirm(null);
      setMsg('✓ Dokumen dihapus.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal hapus: ' + e.message); }
  };

  const handleUpdateName = async (id, name) => {
    await supabase.from('user_documents').update({ name }).eq('id', id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, name } : d));
    setEditDoc(null);
  };

  const filtered = filter === 'semua' ? documents : documents.filter(d => d.doc_category === filter);

  const getCategoryConfig = cat => DOC_CATEGORIES.find(c => c.value === cat) || DOC_CATEGORIES[5];

  const formatSize = size => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size/1024).toFixed(0)} KB`;
    return `${(size/1048576).toFixed(1)} MB`;
  };

  const getFileIcon = type => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('zip') || type?.includes('archive')) return '🗜️';
    return '📎';
  };

  const stats = {
    total: documents.length,
    cv: documents.filter(d => d.doc_category === 'cv').length,
    portfolio: documents.filter(d => d.doc_category === 'portfolio').length,
    certificate: documents.filter(d => d.doc_category === 'certificate').length,
    totalSize: documents.reduce((s, d) => s + (d.file_size || 0), 0),
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, minWidth: 0, padding: isMobile ? '70px 16px 24px' : '32px', maxWidth: isMobile ? '100vw' : 'calc(100vw - var(--sidebar-width, 240px))', boxSizing: 'border-box', overflowX: 'hidden' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', gap: isMobile ? '16px' : '0', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Dokumen Saya</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Kelola CV, portfolio, dan dokumen pendukung lamaranmu</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'row' : 'row' }}>
            <Link href="/cv-builder" style={{ flex: isMobile ? 1 : 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: isMobile ? '10px 12px' : '9px 18px', borderRadius: '8px', border: '1.5px solid var(--border-brand)', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontWeight: 600, fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              ✨ Buat CV
            </Link>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowUpload(true)}
              style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: isMobile ? '10px 12px' : '9px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)', whiteSpace: 'nowrap' }}>
              ↑ Upload
            </motion.button>
          </div>
        </motion.div>

        {msg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: msg.includes('Gagal') ? 'var(--error-50)' : 'var(--success-50)', border: `1px solid ${msg.includes('Gagal') ? '#FECACA' : '#BBF7D0'}`, borderRadius: '8px', color: msg.includes('Gagal') ? 'var(--error-600)' : 'var(--success-600)', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>{msg}</motion.div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '10px' : '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Dokumen', value: stats.total, icon: '📁' },
            { label: 'CV/Resume', value: stats.cv, icon: '📄' },
            { label: 'Portfolio', value: stats.portfolio, icon: '🗂️' },
            { label: 'Sertifikat', value: stats.certificate, icon: '🏆' },
            { label: 'Total Ukuran', value: formatSize(stats.totalSize), icon: '💾' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: isMobile ? '12px 10px' : '14px 16px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: isMobile ? '18px' : '22px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('semua')} style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filter === 'semua' ? 'var(--border-brand)' : 'var(--border-default)'}`, background: filter === 'semua' ? 'var(--surface-brand)' : 'transparent', color: filter === 'semua' ? 'var(--text-brand)' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>Semua ({documents.length})</button>
          {DOC_CATEGORIES.map(cat => {
            const count = documents.filter(d => d.doc_category === cat.value).length;
            if (count === 0) return null;
            return (
              <button key={cat.value} onClick={() => setFilter(cat.value)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filter === cat.value ? 'var(--border-brand)' : 'var(--border-default)'}`, background: filter === cat.value ? 'var(--surface-brand)' : 'transparent', color: filter === cat.value ? 'var(--text-brand)' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                style={{ background: 'var(--surface-primary)', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>↑ Upload Dokumen</h3>
                  <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>

                {/* Drop zone */}
                <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? 'var(--brand-400)' : 'var(--border-default)'}`, borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--surface-brand)' : 'var(--surface-secondary)', marginBottom: '16px', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📎</div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Drag & drop atau klik untuk pilih file</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>PDF, DOC, DOCX, JPG, PNG, ZIP • Maks 20MB</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png,.zip,.pptx,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nama Dokumen</label>
                    <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Contoh: CV Alif - 2025"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '14px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Kategori</label>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '6px' }}>
                      {DOC_CATEGORIES.map(cat => (
                        <button key={cat.value} onClick={() => setDocCategory(cat.value)} style={{ padding: '8px', borderRadius: '8px', border: `1.5px solid ${docCategory === cat.value ? 'var(--border-brand)' : 'var(--border-default)'}`, background: docCategory === cat.value ? 'var(--surface-brand)' : 'transparent', color: docCategory === cat.value ? 'var(--text-brand)' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontWeight: docCategory === cat.value ? 600 : 400, fontFamily: 'var(--font-sans)' }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deskripsi (opsional)</label>
                    <input value={docDesc} onChange={e => setDocDesc(e.target.value)} placeholder="Contoh: CV untuk posisi UI/UX"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '14px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowUpload(false)} style={{ flex: 1, padding: '11px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Batal</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ flex: 2, padding: '11px', borderRadius: '9px', border: 'none', background: uploading ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {uploading ? '⏳ Mengupload...' : '↑ Pilih & Upload File'}
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
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} style={{ background: 'var(--surface-primary)', borderRadius: '14px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Hapus Dokumen?</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}><strong>{deleteConfirm.name}</strong> akan dihapus permanen.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Batal</button>
                  <button onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.file_url)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--error-600)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Hapus</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '160px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.3 }}>📁</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada dokumen</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Upload CV, portfolio, atau dokumen pendukung lamaranmu</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowUpload(true)}
              style={{ padding: '10px 22px', borderRadius: '9px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              ↑ Upload Dokumen
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {filtered.map((doc, i) => {
              const catConfig = getCategoryConfig(doc.doc_category);
              return (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; }}>
                  {/* File icon & category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '1px solid var(--border-subtle)' }}>
                      {getFileIcon(doc.file_type)}
                    </div>
                    <span className={`badge ${catConfig.color}`}>{catConfig.label}</span>
                  </div>

                  {/* Name */}
                  {editDoc === doc.id ? (
                    <input defaultValue={doc.name} autoFocus
                      onBlur={e => handleUpdateName(doc.id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateName(doc.id, e.target.value); if (e.key === 'Escape') setEditDoc(null); }}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid var(--border-brand)', fontSize: '13px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.3 }}>{doc.name}</h3>
                      {doc.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{doc.description}</p>}
                    </div>
                  )}

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {doc.file_size && <span>💾 {formatSize(doc.file_size)}</span>}
                    <span>📅 {new Date(doc.uploaded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 2, padding: '7px', borderRadius: '7px', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontWeight: 600, fontSize: '12px', textDecoration: 'none', textAlign: 'center', border: '1px solid var(--border-brand)' }}>
                      👁️ Lihat
                    </a>
                    <button onClick={() => setEditDoc(doc.id)} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>✏️</button>
                    <button onClick={() => setDeleteConfirm(doc)} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid #FECACA', background: 'transparent', color: 'var(--error-600)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>🗑️</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}