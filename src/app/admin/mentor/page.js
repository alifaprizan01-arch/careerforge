'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';

const EXPERTISE_OPTIONS = [
  'UI/UX Design', 'Frontend Development', 'Backend Development', 'Full Stack',
  'Data Science', 'Machine Learning', 'Product Management', 'Digital Marketing',
  'Career Coaching', 'Business Strategy', 'Cybersecurity', 'DevOps',
  'Mobile Development', 'Cloud Computing', 'Graphic Design', 'Content Writing',
];

const TABS = [
  { id: 'approved', label: 'Aktif', icon: '✅' },
  { id: 'pending',  label: 'Menunggu',  icon: '⏳' },
  { id: 'rejected', label: 'Ditolak', icon: '❌' },
];

export default function AdminMentorPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();

  const [mentors, setMentors]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState('approved');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [msg, setMsg]                 = useState('');
  const [updatingId, setUpdatingId]   = useState(null);

  // Modal tambah mentor
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({
    full_name: '', title: '', company: '', bio: '',
    expertise: '', years_experience: '', price_per_session: '0',
    linkedin_url: '', avatar_url: '',
  });
  const [addErrors, setAddErrors]     = useState({});
  const [addSaving, setAddSaving]     = useState(false);
  const [tagInput, setTagInput]       = useState('');
  const [expertiseTags, setExpertiseTags] = useState([]);

  useEffect(() => {
    if (loaded && (!user || user.role !== 'admin')) router.push('/');
  }, [loaded, user]);

  useEffect(() => {
    if (user?.role === 'admin') fetchMentors();
  }, [user]);

  const fetchMentors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mentors')
      .select('*, mentoring_reviews(count)')
      .order('id', { ascending: false });
    setMentors(data || []);
    setLoading(false);
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // ── Approve / Reject ──────────────────────────────────────────────────────
  const handleApprove = async (mentor) => {
    setUpdatingId(mentor.id);
    try {
      await supabase.from('mentors').update({ status: 'approved', availability: 'Tersedia', is_available: true }).eq('id', mentor.id);
      // Update role user jadi mentor
      if (mentor.user_id) {
        await supabase.from('users').update({ role: 'mentor' }).eq('id', mentor.user_id);
      }
      // Kirim notifikasi
      if (mentor.user_id) {
        await supabase.from('notifications').insert([{
          user_id: mentor.user_id,
          title: 'Selamat! Pendaftaran Mentor Disetujui 🎉',
          message: 'Permohonanmu sebagai mentor telah disetujui. Akun mentormu kini aktif!',
          type: 'mentor_approved',
          is_read: false,
        }]);
      }
      setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, status: 'approved', availability: 'Tersedia' } : m));
      flash('✓ Mentor berhasil disetujui dan diaktifkan.');
    } catch (e) { flash('Gagal menyetujui: ' + e.message); }
    setUpdatingId(null);
  };

  const handleReject = async (mentor) => {
    setUpdatingId(mentor.id);
    try {
      await supabase.from('mentors').update({ status: 'rejected', availability: 'Tidak Tersedia', is_available: false }).eq('id', mentor.id);
      // Kirim notifikasi
      if (mentor.user_id) {
        await supabase.from('notifications').insert([{
          user_id: mentor.user_id,
          title: 'Pendaftaran Mentor Tidak Disetujui',
          message: 'Maaf, permohonanmu sebagai mentor belum dapat kami setujui saat ini.',
          type: 'mentor_rejected',
          is_read: false,
        }]);
      }
      setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, status: 'rejected' } : m));
      flash('✓ Mentor ditolak.');
    } catch (e) { flash('Gagal menolak: ' + e.message); }
    setUpdatingId(null);
  };

  // ── Toggle availability ───────────────────────────────────────────────────
  const toggleAvailability = async (mentor) => {
    setUpdatingId(mentor.id);
    const next = mentor.availability === 'Tersedia' ? 'Tidak Tersedia' : 'Tersedia';
    await supabase.from('mentors').update({ availability: next }).eq('id', mentor.id);
    setMentors(prev => prev.map(m => m.id === mentor.id ? { ...m, availability: next } : m));
    setUpdatingId(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMentor = async (id) => {
    setDeleting(true);
    try {
      await supabase.from('mentoring_reviews').delete().eq('mentor_id', id);
      await supabase.from('mentor_bookings').delete().eq('mentor_id', id);
      await supabase.from('mentor_schedules').delete().eq('mentor_id', id);
      const { error } = await supabase.from('mentors').delete().eq('id', id);
      if (error) throw error;
      setMentors(prev => prev.filter(m => m.id !== id));
      flash('✓ Mentor berhasil dihapus.');
    } catch (e) { flash('Gagal menghapus: ' + e.message); }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  // ── Tambah mentor (admin langsung approved) ───────────────────────────────
  const addTag = (tag) => {
    const t = tag.trim();
    if (!t || expertiseTags.includes(t) || expertiseTags.length >= 8) return;
    setExpertiseTags(prev => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (tag) => setExpertiseTags(prev => prev.filter(t => t !== tag));

  const validateAdd = () => {
    const e = {};
    if (!addForm.full_name.trim()) e.full_name = 'Nama wajib diisi';
    if (!addForm.title.trim()) e.title = 'Jabatan wajib diisi';
    if (!addForm.bio.trim() || addForm.bio.length < 20) e.bio = 'Bio minimal 20 karakter';
    if (!addForm.expertise.trim()) e.expertise = 'Bidang keahlian wajib diisi';
    if (addForm.years_experience === '' || isNaN(addForm.years_experience)) e.years_experience = 'Masukkan tahun pengalaman';
    setAddErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitAdd = async () => {
    if (!validateAdd()) return;
    setAddSaving(true);
    try {
      const { error } = await supabase.from('mentors').insert([{
        full_name: addForm.full_name.trim(),
        title: addForm.title.trim(),
        company: addForm.company.trim() || null,
        bio: addForm.bio.trim(),
        expertise: addForm.expertise.trim(),
        expertise_tags: expertiseTags,
        years_experience: parseInt(addForm.years_experience) || 0,
        price_per_session: parseInt(addForm.price_per_session) || 0,
        linkedin_url: addForm.linkedin_url.trim() || null,
        avatar_url: addForm.avatar_url.trim() || null,
        availability: 'Tersedia',
        status: 'approved',          // ← admin langsung approved
        rating: 0, total_reviews: 0, rating_avg: 0,
        is_available: true,
        user_id: null,               // mentor manual, tidak terkait user
      }]);
      if (error) throw error;
      flash('✓ Mentor baru berhasil ditambahkan.');
      setShowAdd(false);
      setAddForm({ full_name: '', title: '', company: '', bio: '', expertise: '', years_experience: '', price_per_session: '0', linkedin_url: '', avatar_url: '' });
      setExpertiseTags([]);
      setAddErrors({});
      fetchMentors();
    } catch (e) {
      setAddErrors({ submit: e.message });
    }
    setAddSaving(false);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B',
    input: isDark ? '#0F172A' : '#F8FAFC',
  };

  const inpStyle = (key) => ({
    width: '100%', padding: '10px 13px', borderRadius: '9px', fontSize: '14px',
    outline: 'none', border: `1.5px solid ${addErrors[key] ? '#DC2626' : c.border}`,
    background: c.input, color: c.text, fontFamily: 'inherit', boxSizing: 'border-box',
  });

  // Filter per tab
  const filtered = mentors.filter(m => {
    const matchTab = (m.status || 'approved') === activeTab;
    const matchSearch = !search ||
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.expertise?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    approved: mentors.filter(m => (m.status || 'approved') === 'approved').length,
    pending:  mentors.filter(m => m.status === 'pending').length,
    rejected: mentors.filter(m => m.status === 'rejected').length,
  };

  if (!loaded || !user || user.role !== 'admin') return null;

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#334155 0%,#1E293B 100%)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 2px 10px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.18)', color: '#fff' }}>🛡️ ADMIN</span>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>← Dashboard</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Kelola Mentor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {counts.pending > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#FDE047', color: '#854D0E' }}>
              ⏳ {counts.pending} menunggu persetujuan
            </span>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
            style={{ padding: '9px 18px', borderRadius: '9px', border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
            + Tambah Mentor
          </motion.button>
        </div>
      </div>

      <main style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Flash message */}
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '12px 16px', background: msg.includes('Gagal') ? (isDark ? '#450A0A' : '#FEF2F2') : (isDark ? '#052E16' : '#F0FDF4'), border: `1px solid ${msg.includes('Gagal') ? '#DC262644' : '#16A34A44'}`, borderRadius: '8px', color: msg.includes('Gagal') ? '#DC2626' : '#16A34A', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>
            {msg}
          </motion.div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', border: '1px solid',
                background: activeTab === tab.id ? '#7C3AED' : c.card,
                color: activeTab === tab.id ? '#fff' : c.muted,
                borderColor: activeTab === tab.id ? '#7C3AED' : c.border,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              {tab.icon} {tab.label}
              <span style={{ padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : (tab.id === 'pending' && counts.pending > 0 ? '#FDE047' : c.border), color: activeTab === tab.id ? '#fff' : (tab.id === 'pending' && counts.pending > 0 ? '#854D0E' : c.muted) }}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 16px', marginBottom: '20px' }}>
          <span style={{ color: c.muted }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari mentor atau keahlian..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: c.text, fontFamily: 'inherit' }} />
          <span style={{ fontSize: '13px', color: c.muted }}>{filtered.length} mentor</span>
        </div>

        {/* ── PENDING: card-style besar dengan tombol Approve/Reject ── */}
        {activeTab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: c.muted }}>Memuat...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}` }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <p style={{ color: c.muted, fontSize: '14px' }}>Tidak ada pendaftaran yang menunggu</p>
              </div>
            ) : filtered.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: c.card, borderRadius: '14px', border: `2px solid #FDE04780`, padding: '20px 24px', display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }} alt={m.full_name} />
                    : <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#5624D0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>
                        {m.full_name?.slice(0, 1)}
                      </div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: c.text }}>{m.full_name}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: isDark ? 'rgba(234,179,8,0.15)' : '#FEFCE8', color: '#CA8A04', border: '1px solid #FDE047' }}>⏳ Menunggu</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 600, margin: '0 0 2px' }}>{m.title}{m.company ? ` · ${m.company}` : ''}</p>
                  <p style={{ fontSize: '12px', color: c.muted, margin: '0 0 10px' }}>{m.expertise} · {m.years_experience} thn pengalaman</p>
                  {m.bio && <p style={{ fontSize: '13px', color: c.muted, lineHeight: 1.6, margin: '0 0 10px' }}>{m.bio.slice(0, 200)}{m.bio.length > 200 ? '...' : ''}</p>}
                  {m.expertise_tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {m.expertise_tags.map(tag => (
                        <span key={tag} style={{ padding: '3px 10px', borderRadius: '20px', background: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF', color: '#7C3AED', fontSize: '12px', fontWeight: 600 }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: c.muted }}>💰 {parseInt(m.price_per_session) > 0 ? `Rp ${parseInt(m.price_per_session).toLocaleString('id-ID')}/sesi` : 'Gratis'}</span>
                    {m.linkedin_url && <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#7C3AED', textDecoration: 'none' }}>🔗 LinkedIn</a>}
                  </div>
                </div>

                {/* Aksi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleApprove(m)} disabled={updatingId === m.id}
                    style={{ padding: '10px 20px', borderRadius: '9px', border: 'none', background: updatingId === m.id ? '#86EFAC' : '#16A34A', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {updatingId === m.id ? '...' : '✅ Setujui'}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleReject(m)} disabled={updatingId === m.id}
                    style={{ padding: '10px 20px', borderRadius: '9px', border: '1px solid #DC262644', background: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {updatingId === m.id ? '...' : '❌ Tolak'}
                  </motion.button>
                  <button onClick={() => setDeleteConfirm(m)}
                    style={{ padding: '8px 20px', borderRadius: '9px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🗑️ Hapus
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── APPROVED / REJECTED: table ── */}
        {activeTab !== 'pending' && (
          <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 80px 100px 130px', gap: '12px' }}>
              {['Mentor', 'Keahlian', 'Rating', 'Ulasan', 'Status', 'Aksi'].map(h => (
                <div key={h} style={{ fontSize: '12px', fontWeight: 600, color: c.muted, textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: c.muted }}>Memuat...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎤</div>
                <p style={{ color: c.muted }}>Tidak ada mentor ditemukan</p>
              </div>
            ) : filtered.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${c.border}` : 'none', display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 80px 100px 130px', gap: '12px', alignItems: 'center', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? '#334155' : '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                {/* Nama */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={m.full_name} />
                    : <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#5624D0,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                        {m.full_name?.slice(0, 1)}
                      </div>
                  }
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: c.text, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.full_name}</div>
                    <div style={{ fontSize: '11px', color: c.muted }}>{m.years_experience ? `${m.years_experience} thn` : 'Mentor'}</div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.expertise || '—'}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#D97706' }}>{m.rating_avg ? `⭐ ${parseFloat(m.rating_avg).toFixed(1)}` : '—'}</div>
                <div style={{ fontSize: '13px', color: c.text, textAlign: 'center' }}>{m.total_reviews || 0}</div>

                {/* Status toggle (hanya untuk approved) */}
                <div>
                  {activeTab === 'approved' ? (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleAvailability(m)} disabled={updatingId === m.id}
                      style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                        background: m.availability === 'Tersedia' ? (isDark ? 'rgba(34,197,94,0.2)' : '#DCFCE7') : (isDark ? '#334155' : '#F1F5F9'),
                        color: m.availability === 'Tersedia' ? '#16A34A' : c.muted,
                      }}>
                      {updatingId === m.id ? '...' : m.availability === 'Tersedia' ? '● Tersedia' : '○ Tidak'}
                    </motion.button>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', background: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2', padding: '4px 10px', borderRadius: '20px' }}>Ditolak</span>
                  )}
                </div>

                {/* Aksi */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push(`/mentoring/${m.id}`)}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    👁️
                  </motion.button>
                  {activeTab === 'rejected' && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleApprove(m)} disabled={updatingId === m.id}
                      style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #16A34A44', background: isDark ? 'rgba(22,163,74,0.1)' : '#F0FDF4', color: '#16A34A', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✅
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDeleteConfirm(m)}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #DC262644', background: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2', color: '#DC2626', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🗑️
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal Tambah Mentor ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !addSaving && setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '18px', padding: '28px', maxWidth: '560px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: c.text, margin: 0 }}>➕ Tambah Mentor Baru</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: c.muted, padding: '4px' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Info */}
                <div style={{ background: isDark ? 'rgba(124,58,237,0.1)' : '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontSize: '13px', color: '#7C3AED', fontWeight: 600, margin: 0 }}>
                    ℹ️ Mentor yang ditambahkan admin akan langsung berstatus aktif tanpa perlu persetujuan.
                  </p>
                </div>

                {[
                  { key: 'full_name', label: 'Nama Lengkap', required: true, placeholder: 'Nama lengkap mentor' },
                  { key: 'title', label: 'Jabatan', required: true, placeholder: 'cth: Senior Product Designer' },
                  { key: 'company', label: 'Perusahaan', placeholder: 'cth: Google (opsional)' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>
                      {f.label} {f.required && <span style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    <input value={addForm[f.key]} onChange={e => { setAddForm(prev => ({ ...prev, [f.key]: e.target.value })); if (addErrors[f.key]) setAddErrors(v => ({ ...v, [f.key]: null })); }}
                      placeholder={f.placeholder} style={inpStyle(f.key)} />
                    {addErrors[f.key] && <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0' }}>{addErrors[f.key]}</p>}
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>Bio <span style={{ color: '#DC2626' }}>*</span></label>
                  <textarea value={addForm.bio} onChange={e => { setAddForm(prev => ({ ...prev, bio: e.target.value })); if (addErrors.bio) setAddErrors(v => ({ ...v, bio: null })); }}
                    placeholder="Deskripsi singkat tentang mentor..." rows={4}
                    style={{ ...inpStyle('bio'), resize: 'vertical', lineHeight: 1.6 }} />
                  {addErrors.bio && <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0' }}>{addErrors.bio}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>Bidang Keahlian <span style={{ color: '#DC2626' }}>*</span></label>
                  <select value={addForm.expertise} onChange={e => { setAddForm(prev => ({ ...prev, expertise: e.target.value })); if (addErrors.expertise) setAddErrors(v => ({ ...v, expertise: null })); }}
                    style={inpStyle('expertise')}>
                    <option value="">Pilih bidang keahlian...</option>
                    {EXPERTISE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  {addErrors.expertise && <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0' }}>{addErrors.expertise}</p>}
                </div>

                {/* Tags */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>Tag Keahlian</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {expertiseTags.map(tag => (
                      <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF', color: '#7C3AED', fontSize: '12px', fontWeight: 600 }}>
                        #{tag}
                        <button onClick={() => removeTag(tag)} style={{ border: 'none', background: 'none', color: '#7C3AED', cursor: 'pointer', padding: 0, fontSize: '13px' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                      placeholder="Ketik tag lalu Enter"
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '9px', fontSize: '13px', outline: 'none', border: `1px solid ${c.border}`, background: c.input, color: c.text, fontFamily: 'inherit' }} />
                    <button onClick={() => addTag(tagInput)} style={{ padding: '9px 14px', borderRadius: '9px', border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>+</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>Tahun Pengalaman <span style={{ color: '#DC2626' }}>*</span></label>
                    <input type="number" min="0" max="50" value={addForm.years_experience}
                      onChange={e => { setAddForm(prev => ({ ...prev, years_experience: e.target.value })); if (addErrors.years_experience) setAddErrors(v => ({ ...v, years_experience: null })); }}
                      placeholder="cth: 5" style={inpStyle('years_experience')} />
                    {addErrors.years_experience && <p style={{ fontSize: '12px', color: '#DC2626', margin: '4px 0 0' }}>{addErrors.years_experience}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>Harga/Sesi (Rp)</label>
                    <input type="number" min="0" value={addForm.price_per_session}
                      onChange={e => setAddForm(prev => ({ ...prev, price_per_session: e.target.value }))}
                      placeholder="0 = gratis" style={inpStyle('price_per_session')} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>LinkedIn URL</label>
                  <input value={addForm.linkedin_url} onChange={e => setAddForm(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/username" style={inpStyle('linkedin_url')} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>URL Foto Profil</label>
                  <input value={addForm.avatar_url} onChange={e => setAddForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="https://... (opsional)" style={inpStyle('avatar_url')} />
                </div>

                {addErrors.submit && (
                  <div style={{ padding: '12px 14px', background: isDark ? '#450A0A' : '#FEF2F2', border: '1px solid #DC262644', borderRadius: '8px', color: '#DC2626', fontSize: '13px' }}>
                    ⚠️ {addErrors.submit}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button onClick={() => setShowAdd(false)} disabled={addSaving}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600 }}>
                  Batal
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={submitAdd} disabled={addSaving}
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: addSaving ? '#C4B5FD' : '#7C3AED', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
                  {addSaving ? 'Menyimpan...' : '✅ Tambah & Aktifkan Mentor'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Delete ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !deleting && setDeleteConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: c.card, borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>🗑️</div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: c.text, marginBottom: '8px' }}>Hapus mentor ini?</h3>
              <p style={{ fontSize: '13px', color: c.muted, marginBottom: '6px' }}>
                Kamu akan menghapus <strong style={{ color: c.text }}>{deleteConfirm.full_name}</strong> secara permanen.
              </p>
              <p style={{ fontSize: '12px', color: '#DC2626', marginBottom: '24px', padding: '10px 14px', background: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2', borderRadius: '8px' }}>
                ⚠️ Semua ulasan, jadwal, dan booking mentor ini akan ikut terhapus.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                  style={{ flex: 1, padding: '11px', borderRadius: '9px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>
                  Batal
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteMentor(deleteConfirm.id)} disabled={deleting}
                  style={{ flex: 1, padding: '11px', borderRadius: '9px', border: 'none', background: deleting ? '#FCA5A5' : '#DC2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}