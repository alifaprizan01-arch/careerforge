'use client';
import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import Sidebar from '../../components/Sidebar';

export default function DetailLowonganPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('cv');
  const [existingDocs, setExistingDocs] = useState([]);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user && params.id) fetchAll(); }, [user, params.id]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: j }, { data: a }] = await Promise.all([
      supabase.from('trayek').select('*').eq('id', params.id).single(),
      supabase.from('applications').select('*').eq('user_id', user.id).eq('trayek_id', params.id).single(),
    ]);
    setJob(j);
    if (a) {
      setHasApplied(true);
      setApplication(a);
      const { data: docs } = await supabase.from('application_documents').select('*').eq('application_id', a.id);
      setExistingDocs(docs || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setMsg('Ukuran file maksimal 10MB.'); return; }
    setUploadingDoc(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `doc_${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('documents').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      setUploadedDocs(prev => [...prev, { file_name: file.name, file_url: urlData.publicUrl, doc_type: docType, file_size: file.size, file_type: file.type }]);
      setMsg('File berhasil diunggah!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Gagal upload: ' + err.message); }
    finally { setUploadingDoc(false); e.target.value = ''; }
  };

  const removeDoc = (idx) => setUploadedDocs(prev => prev.filter((_, i) => i !== idx));

  const handleApply = async () => {
    if (!coverLetter.trim()) { setMsg('Tulis cover letter terlebih dahulu.'); return; }
    setApplying(true);
    try {
      const { data: appData } = await supabase.from('applications')
        .insert([{ user_id: user.id, trayek_id: parseInt(params.id), cover_letter: coverLetter, status: 'Menunggu' }])
        .select().single();
      // Upload dokumen yang sudah disiapkan
      if (uploadedDocs.length > 0) {
        await supabase.from('application_documents').insert(
          uploadedDocs.map(d => ({ application_id: appData.id, user_id: user.id, ...d }))
        );
      }
      setHasApplied(true);
      setApplication(appData);
      setExistingDocs(uploadedDocs);
      setShowForm(false);
      setMsg('Lamaran berhasil dikirim! 🎉');
    } catch (err) { setMsg('Gagal melamar: ' + err.message); }
    finally { setApplying(false); }
  };

  const addMoreDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !application) return;
    setUploadingDoc(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `doc_${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('documents').upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      const { data: docData } = await supabase.from('application_documents').insert([{
        application_id: application.id, user_id: user.id,
        file_name: file.name, file_url: urlData.publicUrl, doc_type: docType, file_size: file.size,
      }]).select().single();
      setExistingDocs(prev => [...prev, docData]);
      setMsg('Dokumen tambahan berhasil diunggah!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg('Gagal upload: ' + err.message); }
    finally { setUploadingDoc(false); e.target.value = ''; }
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF', green: isDark ? '#4ADE80' : '#16A34A',
    greenLight: isDark ? '#14532D' : '#F0FDF4',
  };

  const statusColor = (s) => {
    if (s === 'Diterima') return { bg: c.greenLight, color: c.green, border: isDark ? '#166534' : '#BBF7D0' };
    if (s === 'Ditolak') return { bg: isDark ? '#450A0A' : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626', border: isDark ? '#7F1D1D' : '#FECACA' };
    if (s === 'Wawancara') return { bg: isDark ? '#2E1065' : '#F5F3FF', color: isDark ? '#C084FC' : '#7C3AED', border: isDark ? '#4C1D95' : '#DDD6FE' };
    if (s === 'Diproses') return { bg: c.blueLight, color: c.blue, border: isDark ? '#1D4ED8' : '#BFDBFE' };
    return { bg: isDark ? '#451A03' : '#FFFBEB', color: isDark ? '#FCD34D' : '#D97706', border: isDark ? '#78350F' : '#FDE68A' };
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (n) => n >= 1000000 ? `Rp ${(n/1000000).toFixed(0)} juta` : `Rp ${(n/1000).toFixed(0)} ribu`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}/bulan`;
    if (min) return `${fmt(min)}+/bulan`;
    return `s/d ${fmt(max)}/bulan`;
  };

  const docTypes = [
    { value: 'cv', label: '📄 CV/Resume' },
    { value: 'portfolio', label: '🗂️ Portfolio' },
    { value: 'certificate', label: '🏆 Sertifikat' },
    { value: 'cover_letter', label: '✉️ Cover Letter' },
    { value: 'other', label: '📎 Dokumen Lain' },
  ];

  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '13px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  const requiredDocs = job?.required_documents || [];

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/trayek" style={{ color: c.blue, textDecoration: 'none', fontSize: '13px' }}>← Kembali ke Lowongan</Link>
        </div>

        {loading ? <p style={{ color: c.muted }}>Memuat...</p> : !job ? <p style={{ color: c.muted }}>Lowongan tidak ditemukan.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '14px', background: c.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', color: c.blue, flexShrink: 0 }}>
                    {(job.company || job.tujuan)?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: c.text, marginBottom: '4px' }}>{job.tujuan}</h1>
                    <p style={{ fontSize: '14px', color: c.muted, marginBottom: '10px' }}>{job.company || 'Perusahaan'} • {job.asal}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: c.blueLight, color: c.blue, border: `1px solid ${c.border}`, fontWeight: 500 }}>{job.jenis || 'Full Time'}</span>
                      {job.asal && <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: isDark ? '#334155' : '#F8FAFC', color: c.muted, border: `1px solid ${c.border}` }}>📍 {job.asal}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '10px' }}>
                  {[
                    { icon: '💰', label: 'Gaji', value: formatSalary(job.salary_min, job.salary_max) || 'Negotiable' },
                    { icon: '⏰', label: 'Tipe', value: job.jenis || 'Full Time' },
                    { icon: '📅', label: 'Deadline', value: job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID') : 'Tidak ada' },
                  ].map((info, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{info.icon}</div>
                      <div style={{ fontSize: '11px', color: c.muted, marginBottom: '2px' }}>{info.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{info.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {job.deskripsi && (
                <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '12px' }}>Tentang Pekerjaan</h2>
                  <p style={{ fontSize: '14px', color: c.muted, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{job.deskripsi}</p>
                </div>
              )}

              {job.requirements && (
                <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '24px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '12px' }}>Persyaratan</h2>
                  {job.requirements.split('\n').map((req, i) => req.trim() && (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.blue, marginTop: '7px', flexShrink: 0 }} />
                      <span style={{ fontSize: '14px', color: c.muted, lineHeight: 1.6 }}>{req}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Required documents info */}
              {requiredDocs.length > 0 && (
                <div style={{ background: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: '12px', border: `1px solid ${c.blue}44`, padding: '20px' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: c.blue, marginBottom: '10px' }}>📎 Dokumen yang Dibutuhkan</h2>
                  {requiredDocs.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '13px', color: c.blue }}>
                      <span>•</span><span>{doc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Apply panel */}
            <div style={{ position: 'sticky', top: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Status */}
              {hasApplied && application && (
                <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '14px' }}>Status Lamaran</h3>
                  {(() => { const sc = statusColor(application.status); return (
                    <div style={{ padding: '14px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '8px', marginBottom: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                        {application.status === 'Diterima' ? '🎉' : application.status === 'Ditolak' ? '😔' : application.status === 'Wawancara' ? '🎤' : application.status === 'Diproses' ? '🔍' : '⏳'}
                      </div>
                      <div style={{ fontWeight: 700, color: sc.color, fontSize: '16px', marginBottom: '4px' }}>{application.status}</div>
                      {application.interview_date && (
                        <div style={{ fontSize: '12px', color: sc.color, opacity: 0.8, marginTop: '6px', padding: '6px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px' }}>
                          🗓️ Interview: {new Date(application.interview_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      )}
                    </div>
                  ); })()}
                  <div style={{ fontSize: '12px', color: c.muted }}>Dikirim: {new Date(application.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              )}

              {/* Apply form / Uploaded docs */}
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px' }}>
                {!hasApplied ? (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '4px' }}>Lamar Posisi Ini</h3>
                    <p style={{ fontSize: '12px', color: c.muted, marginBottom: '16px' }}>Lengkapi cover letter dan unggah dokumen pendukung.</p>

                    {msg && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px', background: msg.includes('Gagal') ? isDark ? '#450A0A' : '#FEF2F2' : c.greenLight, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : c.green, fontSize: '13px', marginBottom: '12px' }}>{msg}</motion.div>}

                    {!showForm ? (
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForm(true)} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                        Lamar Sekarang
                      </motion.button>
                    ) : (
                      <>
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Cover Letter *</label>
                          <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={5}
                            placeholder={`Perkenalkan diri dan jelaskan mengapa kamu cocok untuk ${job.tujuan}...`}
                            style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                          <div style={{ fontSize: '11px', color: c.muted, textAlign: 'right', marginTop: '4px' }}>{coverLetter.length} karakter</div>
                        </div>

                        {/* Document upload */}
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: c.muted, marginBottom: '8px' }}>📎 Upload Dokumen</label>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inp, flex: 1, cursor: 'pointer' }}>
                              {docTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc}
                              style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.blue, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}>
                              {uploadingDoc ? '⏳' : '+ Upload'}
                            </motion.button>
                          </div>
                          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png,.zip" onChange={handleFileUpload} style={{ display: 'none' }} />
                          <p style={{ fontSize: '11px', color: c.muted, margin: '0 0 8px' }}>PDF, DOC, JPG, PNG, ZIP • Maks 10MB per file</p>

                          {/* Uploaded docs list */}
                          {uploadedDocs.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                              {uploadedDocs.map((doc, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '8px', border: `1px solid ${c.border}` }}>
                                  <span style={{ fontSize: '16px' }}>{doc.doc_type === 'cv' ? '📄' : doc.doc_type === 'portfolio' ? '🗂️' : doc.doc_type === 'certificate' ? '🏆' : '📎'}</span>
                                  <span style={{ flex: 1, fontSize: '12px', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                                  <button onClick={() => removeDoc(i)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '14px', padding: '0', flexShrink: 0 }}>×</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '13px', cursor: 'pointer' }}>Batal</button>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={handleApply} disabled={applying}
                            style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: applying ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                            {applying ? 'Mengirim...' : '✈️ Kirim Lamaran'}
                          </motion.button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '12px' }}>Dokumen Terkirim</h3>
                    {msg && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px', background: c.greenLight, borderRadius: '8px', color: c.green, fontSize: '13px', marginBottom: '12px' }}>{msg}</motion.div>}

                    {existingDocs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                        {existingDocs.map((doc, i) => (
                          <a key={i} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '8px', border: `1px solid ${c.border}`, textDecoration: 'none' }}>
                            <span style={{ fontSize: '16px' }}>{doc.doc_type === 'cv' ? '📄' : doc.doc_type === 'portfolio' ? '🗂️' : '📎'}</span>
                            <span style={{ flex: 1, fontSize: '12px', color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</span>
                            <span style={{ fontSize: '11px', color: c.blue }}>Lihat →</span>
                          </a>
                        ))}
                      </div>
                    ) : <p style={{ fontSize: '13px', color: c.muted, marginBottom: '14px' }}>Belum ada dokumen.</p>}

                    {/* Add more documents */}
                    <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '14px' }}>
                      <p style={{ fontSize: '12px', color: c.muted, marginBottom: '8px' }}>Tambah dokumen lagi:</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select value={docType} onChange={e => setDocType(e.target.value)} style={{ ...inp, flex: 1, fontSize: '12px', cursor: 'pointer' }}>
                          {docTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                        <input type="file" accept=".pdf,.doc,.docx,.jpg,.png,.zip" onChange={addMoreDoc} style={{ display: 'none' }} id="addMoreDoc" />
                        <label htmlFor="addMoreDoc" style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.blue, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                          {uploadingDoc ? '⏳' : '+ Upload'}
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Tips */}
              {!hasApplied && (
                <div style={{ background: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: '12px', border: `1px solid ${c.blue}44`, padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: c.blue, marginBottom: '8px' }}>💡 Tips Melamar</h4>
                  {['Tulis cover letter yang personal & spesifik', 'Unggah CV terbaru dalam format PDF', 'Sertakan portfolio jika ada', 'Perhatikan dokumen yang diminta perusahaan'].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '12px', color: c.blue }}>
                      <span>•</span><span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
