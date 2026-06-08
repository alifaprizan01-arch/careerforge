'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';
import PageTransition from '../../components/PageTransition';

export default function CompanyLamaranPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [docs, setDocs] = useState([]);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (loaded && user && user.role !== 'company') { router.push('/'); return; }
    if (user?.role === 'company') fetchAll();
  }, [loaded, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: jobs } = await supabase.from('trayek').select('id').eq('company_user_id', user.id);
      const jobIds = jobs?.map(j => j.id) || [];
      if (jobIds.length === 0) { setApplications([]); setLoading(false); return; }
      const { data: apps } = await supabase.from('applications')
        .select('*, users(full_name, email, avatar_url, phone, location, job_title, bio), trayek(tujuan, asal, jenis, required_documents)')
        .in('trayek_id', jobIds).order('applied_at', { ascending: false });
      setApplications(apps || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchDocs = async (appId) => {
    const { data } = await supabase.from('application_documents').select('*').eq('application_id', appId);
    setDocs(data || []);
  };

  const selectApp = (app) => {
    setSelected(app);
    setNotes(app.company_notes || '');
    setInterviewDate(app.interview_date ? app.interview_date.slice(0,16) : '');
    fetchDocs(app.id);
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      const app = applications.find(a => a.id === id);
      if (app) {
        const notifMsg = status === 'Diterima'
          ? `Selamat! Lamaranmu untuk posisi ${app.trayek?.tujuan} telah DITERIMA! 🎉`
          : status === 'Ditolak'
          ? `Lamaranmu untuk posisi ${app.trayek?.tujuan} tidak dilanjutkan.`
          : `Status lamaranmu untuk ${app.trayek?.tujuan} diperbarui: ${status}`;
        await supabase.from('notifications').insert([{ user_id: app.user_id, title: 'Update Status Lamaran', message: notifMsg, type: 'job', is_read: false }]);
      }
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
      setMsg('Status diperbarui & notifikasi terkirim!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal: ' + e.message); }
    finally { setUpdating(null); }
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    try {
      const updates = { company_notes: notes };
      if (interviewDate) updates.interview_date = new Date(interviewDate).toISOString();
      await supabase.from('applications').update(updates).eq('id', selected.id);
      setApplications(prev => prev.map(a => a.id === selected.id ? { ...a, ...updates } : a));
      setSelected(prev => ({ ...prev, ...updates }));
      if (interviewDate) {
        const app = applications.find(a => a.id === selected.id);
        await supabase.from('notifications').insert([{
          user_id: app?.user_id, title: 'Jadwal Interview',
          message: `Kamu dijadwalkan interview untuk posisi ${selected.trayek?.tujuan} pada ${new Date(interviewDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`,
          type: 'job', is_read: false
        }]);
      }
      setMsg('Catatan & jadwal interview tersimpan!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal menyimpan.'); }
    finally { setSavingNotes(false); }
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF', green: isDark ? '#4ADE80' : '#16A34A',
    greenLight: isDark ? '#14532D' : '#F0FDF4',
  };

  const statusConfig = {
    'Menunggu': { bg: isDark ? '#451A03' : '#FFFBEB', color: isDark ? '#FCD34D' : '#D97706', border: isDark ? '#78350F' : '#FDE68A', icon: '⏳' },
    'Diproses': { bg: c.blueLight, color: c.blue, border: isDark ? '#1D4ED8' : '#BFDBFE', icon: '🔍' },
    'Wawancara': { bg: isDark ? '#2E1065' : '#F5F3FF', color: isDark ? '#C084FC' : '#7C3AED', border: isDark ? '#4C1D95' : '#DDD6FE', icon: '🎤' },
    'Diterima': { bg: c.greenLight, color: c.green, border: isDark ? '#166534' : '#BBF7D0', icon: '✅' },
    'Ditolak': { bg: isDark ? '#450A0A' : '#FEF2F2', color: isDark ? '#F87171' : '#DC2626', border: isDark ? '#7F1D1D' : '#FECACA', icon: '❌' },
  };

  const allStatuses = ['Menunggu', 'Diproses', 'Wawancara', 'Diterima', 'Ditolak'];
  const filtered = applications.filter(a => {
    const f = filter === 'semua' || a.status === filter;
    const s = !search || a.users?.full_name?.toLowerCase().includes(search.toLowerCase()) || a.trayek?.tujuan?.toLowerCase().includes(search.toLowerCase());
    return f && s;
  });

  const inp = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '13px', outline: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  const docTypeLabel = (t) => ({ cv: '📄 CV/Resume', portfolio: '🗂️ Portfolio', certificate: '🏆 Sertifikat', cover_letter: '✉️ Cover Letter', other: '📎 Dokumen Lain' }[t] || '📎 Dokumen');

  if (!loaded || !user || user.role !== 'company') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: isDark ? '#1E293B' : '#1E3A5F', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/company" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Pelamar</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{applications.length} total pelamar</span>
      </div>

      <main style={{ padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <PageTransition>
          {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: c.blueLight, border: `1px solid ${c.blue}44`, borderRadius: '8px', color: c.blue, marginBottom: '16px', fontSize: '13px' }}>{msg}</motion.div>}

          {/* Filter */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '9px 14px' }}>
              <span style={{ color: c.muted }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau posisi..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.inputText }} />
            </div>
            {['semua', ...allStatuses].map(f => {
              const sc = f !== 'semua' ? statusConfig[f] : null;
              const count = f === 'semua' ? applications.length : applications.filter(a => a.status === f).length;
              return (
                <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filter === f ? (sc?.color || c.blue) : c.border}`,
                  background: filter === f ? (sc?.bg || c.blueLight) : 'transparent',
                  color: filter === f ? (sc?.color || c.blue) : c.muted, fontSize: '12px', cursor: 'pointer', fontWeight: 500,
                }}>{f === 'semua' ? `Semua (${count})` : `${sc?.icon} ${f} (${count})`}</motion.button>
              );
            })}
          </div>

          {/* Split view */}
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '16px', alignItems: 'start' }}>

            {/* Left: Applicant list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {loading ? <p style={{ color: c.muted, padding: '20px', textAlign: 'center' }}>Memuat...</p> :
              filtered.length === 0 ? (
                <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  <p style={{ color: c.muted, fontSize: '13px' }}>Belum ada pelamar.</p>
                </div>
              ) : filtered.map((app, i) => {
                const sc = statusConfig[app.status] || statusConfig['Menunggu'];
                const isSelected = selected?.id === app.id;
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => selectApp(app)} whileHover={{ y: -1 }}
                    style={{ background: c.card, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer',
                      border: isSelected ? `2px solid ${c.blue}` : `1px solid ${c.border}`,
                      boxShadow: isSelected ? `0 0 0 3px ${c.blue}22` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {app.users?.avatar_url ? <img src={app.users.avatar_url} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>
                          {app.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                        </div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: c.text, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.users?.full_name}</div>
                        <div style={{ fontSize: '11px', color: c.muted }}>→ {app.trayek?.tujuan}</div>
                        <div style={{ fontSize: '11px', color: c.muted }}>{new Date(app.applied_at).toLocaleDateString('id-ID')}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: 500, whiteSpace: 'nowrap' }}>{sc.icon} {app.status}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Right: Detail panel */}
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, overflow: 'hidden', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>

                {/* Applicant header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${c.border}`, background: isDark ? '#1E293B' : '#F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                    {selected.users?.avatar_url ? <img src={selected.users.avatar_url} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `3px solid ${c.blue}44` }} /> :
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px', flexShrink: 0 }}>
                        {selected.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                      </div>}
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{selected.users?.full_name}</h2>
                      <p style={{ fontSize: '13px', color: c.muted, marginBottom: '4px' }}>{selected.users?.job_title || 'Pelamar'}</p>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {selected.users?.email && <span style={{ fontSize: '12px', color: c.muted }}>✉️ {selected.users.email}</span>}
                        {selected.users?.phone && <span style={{ fontSize: '12px', color: c.muted }}>📞 {selected.users.phone}</span>}
                        {selected.users?.location && <span style={{ fontSize: '12px', color: c.muted }}>📍 {selected.users.location}</span>}
                      </div>
                    </div>
                    {(() => { const sc = statusConfig[selected.status] || statusConfig['Menunggu']; return (
                      <span style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 600, flexShrink: 0 }}>{sc.icon} {selected.status}</span>
                    ); })()}
                  </div>

                  {/* Status update buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: c.muted, alignSelf: 'center' }}>Ubah status:</span>
                    {allStatuses.map(s => {
                      const ss = statusConfig[s];
                      const isActive = selected.status === s;
                      return (
                        <motion.button key={s} whileTap={{ scale: 0.95 }} disabled={isActive || updating === selected.id} onClick={() => updateStatus(selected.id, s)}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${ss.border}`, background: isActive ? ss.bg : 'transparent', color: ss.color, fontSize: '12px', cursor: isActive ? 'default' : 'pointer', fontWeight: isActive ? 600 : 400, opacity: updating === selected.id ? 0.5 : 1 }}>
                          {ss.icon} {s}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Bio */}
                  {selected.users?.bio && (
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '8px' }}>Tentang Pelamar</h3>
                      <p style={{ fontSize: '13px', color: c.muted, lineHeight: 1.6, margin: 0 }}>{selected.users.bio}</p>
                    </div>
                  )}

                  {/* Cover letter */}
                  {selected.cover_letter && (
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '8px' }}>✉️ Cover Letter</h3>
                      <div style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '8px', padding: '14px', border: `1px solid ${c.border}` }}>
                        <p style={{ fontSize: '13px', color: c.muted, lineHeight: 1.7, margin: 0 }}>{selected.cover_letter}</p>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '10px' }}>📎 Dokumen Pelamar</h3>
                    {docs.length === 0 ? (
                      <div style={{ padding: '20px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '8px', border: `1px dashed ${c.border}`, textAlign: 'center' }}>
                        <p style={{ color: c.muted, fontSize: '13px', margin: 0 }}>Belum ada dokumen yang diunggah.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {docs.map(doc => (
                          <motion.a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '8px', border: `1px solid ${c.border}`, textDecoration: 'none' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                              {doc.doc_type === 'cv' ? '📄' : doc.doc_type === 'portfolio' ? '🗂️' : doc.doc_type === 'certificate' ? '🏆' : '📎'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{doc.file_name}</div>
                              <div style={{ fontSize: '11px', color: c.muted }}>{docTypeLabel(doc.doc_type)} • {doc.file_size ? `${(doc.file_size/1024).toFixed(0)} KB` : ''}</div>
                            </div>
                            <span style={{ fontSize: '12px', color: c.blue, fontWeight: 500 }}>Lihat →</span>
                          </motion.a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interview scheduling */}
                  <div style={{ background: isDark ? '#0F172A' : '#F8FAFC', borderRadius: '10px', border: `1px solid ${c.border}`, padding: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '14px' }}>🗓️ Jadwal Interview & Catatan</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Tanggal & Waktu Interview</label>
                        <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                          style={{ ...inp, fontSize: '13px' }} />
                        <p style={{ fontSize: '11px', color: c.muted, marginTop: '4px' }}>Pelamar akan menerima notifikasi otomatis saat disimpan.</p>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: c.muted, marginBottom: '6px' }}>Catatan Internal (tidak terlihat pelamar)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                          placeholder="Tulis catatan tentang pelamar ini..."
                          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={saveNotes} disabled={savingNotes}
                        style={{ padding: '10px', borderRadius: '8px', border: 'none', background: savingNotes ? '#93C5FD' : c.blue, color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                        {savingNotes ? 'Menyimpan...' : '💾 Simpan Catatan & Jadwal'}
                      </motion.button>
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👈</div>
                <p style={{ color: c.muted, fontSize: '14px' }}>Pilih pelamar untuk melihat detail dan dokumen</p>
              </div>
            )}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}
