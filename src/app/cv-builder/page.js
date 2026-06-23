'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

const TEMPLATES = [
  { id: 'modern', label: 'Modern', desc: 'Bersih & profesional', color: '#2563EB' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple & elegan', color: '#475569' },
  { id: 'bold', label: 'Bold', desc: 'Mencolok & berkarakter', color: '#7C3AED' },
];

const emptyCV = {
  title: 'CV Saya', template: 'modern',
  full_name: '', job_title: '', email: '', phone: '', location: '', website: '', linkedin: '', summary: '',
  experience: [], education: [], skills: [], languages: [], certifications: [], projects: [],
};

export default function CVBuilderPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [cvList, setCvList] = useState([]);
  const [selectedCV, setSelectedCV] = useState(null);
  const [form, setForm] = useState(emptyCV);
  const [activeSection, setActiveSection] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchCVs(); }, [user]);

  const fetchCVs = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_cvs').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    setCvList(data || []);
    if (data?.length > 0) { setSelectedCV(data[0]); setForm(data[0]); }
    else { setForm({ ...emptyCV, full_name: user.full_name || '', email: user.email || '' }); }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString() };
      if (selectedCV?.id) {
        await supabase.from('user_cvs').update(payload).eq('id', selectedCV.id);
        setCvList(prev => prev.map(c => c.id === selectedCV.id ? { ...c, ...payload } : c));
        setMsg('✓ CV berhasil disimpan!');
      } else {
        const { data } = await supabase.from('user_cvs').insert([payload]).select().single();
        setCvList(prev => [data, ...prev]);
        setSelectedCV(data);
        setMsg('✓ CV berhasil dibuat!');
      }
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg('Gagal menyimpan: ' + e.message); }
    finally { setSaving(false); }
  };

  const createNewCV = () => {
    setSelectedCV(null);
    setForm({ ...emptyCV, full_name: user.full_name || '', email: user.email || '' });
    setActiveSection('personal');
  };

  const deleteCV = async (id) => {
    await supabase.from('user_cvs').delete().eq('id', id);
    setCvList(prev => prev.filter(c => c.id !== id));
    if (selectedCV?.id === id) { setSelectedCV(null); setForm(emptyCV); }
    setMsg('CV dihapus.');
    setTimeout(() => setMsg(''), 3000);
  };

  const addItem = (section) => {
    const templates = {
      experience: { company: '', position: '', start_date: '', end_date: '', current: false, description: '' },
      education: { institution: '', degree: '', field: '', start_date: '', end_date: '', gpa: '' },
      skills: { name: '', level: 'Menengah' },
      languages: { language: '', proficiency: 'Menengah' },
      certifications: { name: '', issuer: '', date: '', url: '' },
      projects: { name: '', description: '', url: '', technologies: '' },
    };
    const newItemData = { ...templates[section], id: Date.now() };
    setForm(prev => ({ ...prev, [section]: [...(prev[section] || []), newItemData] }));
  };

  const updateItem = (section, id, field, value) => {
    setForm(prev => ({ ...prev, [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const removeItem = (section, id) => {
    setForm(prev => ({ ...prev, [section]: prev[section].filter(item => item.id !== id) }));
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '13px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', transition: 'border-color 0.15s' };

  const sections = [
    { id: 'personal', icon: '👤', label: 'Informasi Pribadi' },
    { id: 'summary', icon: '📝', label: 'Ringkasan' },
    { id: 'experience', icon: '💼', label: 'Pengalaman' },
    { id: 'education', icon: '🎓', label: 'Pendidikan' },
    { id: 'skills', icon: '⚡', label: 'Keahlian' },
    { id: 'languages', icon: '🌐', label: 'Bahasa' },
    { id: 'certifications', icon: '🏆', label: 'Sertifikasi' },
    { id: 'projects', icon: '🚀', label: 'Proyek' },
  ];

  const listSections = ['experience', 'education', 'skills', 'languages', 'certifications', 'projects'];
  const sectionDone = (id) => {
    if (id === 'personal') return !!(form.full_name && form.email);
    if (id === 'summary') return !!(form.summary && form.summary.trim());
    return (form[id]?.length || 0) > 0;
  };
  const completedCount = sections.filter(s => sectionDone(s.id)).length;
  const progressPct = Math.round((completedCount / sections.length) * 100);

  const CVPreview = ({ cv, template }) => {
    const colors = { modern: '#2563EB', minimal: '#475569', bold: '#7C3AED' };
    const accent = colors[template] || colors.modern;
    return (
      <div style={{ background: '#fff', minHeight: '297mm', width: '210mm', padding: '12mm', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A', fontSize: '11px', lineHeight: 1.5, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ borderBottom: `3px solid ${accent}`, paddingBottom: '10px', marginBottom: '14px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{cv.full_name || 'Nama Lengkap'}</h1>
          {cv.job_title && <p style={{ fontSize: '13px', color: accent, fontWeight: 600, margin: '0 0 8px' }}>{cv.job_title}</p>}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px', color: '#475569' }}>
            {cv.email && <span>✉ {cv.email}</span>}
            {cv.phone && <span>📞 {cv.phone}</span>}
            {cv.location && <span>📍 {cv.location}</span>}
            {cv.website && <span>🌐 {cv.website}</span>}
            {cv.linkedin && <span>in {cv.linkedin}</span>}
          </div>
        </div>

        {cv.summary && (
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Ringkasan Profesional</h2>
            <p style={{ color: '#334155', lineHeight: 1.6, margin: 0 }}>{cv.summary}</p>
          </div>
        )}

        {cv.experience?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Pengalaman Kerja</h2>
            {cv.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: `2px solid ${i === 0 ? accent : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '12px', color: '#0F172A' }}>{exp.position}</strong>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{exp.start_date} — {exp.current ? 'Sekarang' : exp.end_date}</span>
                </div>
                <div style={{ fontSize: '11px', color: accent, fontWeight: 600, marginBottom: '3px' }}>{exp.company}</div>
                {exp.description && <p style={{ fontSize: '10px', color: '#475569', margin: 0, lineHeight: 1.5 }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {cv.education?.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Pendidikan</h2>
            {cv.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '8px', paddingLeft: '12px', borderLeft: `2px solid ${i === 0 ? accent : '#E2E8F0'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '12px', color: '#0F172A' }}>{edu.degree} {edu.field && `— ${edu.field}`}</strong>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{edu.start_date} — {edu.end_date}</span>
                </div>
                <div style={{ fontSize: '11px', color: accent, fontWeight: 600 }}>{edu.institution}</div>
                {edu.gpa && <span style={{ fontSize: '10px', color: '#64748B' }}>GPA: {edu.gpa}</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: cv.languages?.length > 0 ? '1fr 1fr' : '1fr', gap: '14px' }}>
          {cv.skills?.length > 0 && (
            <div>
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Keahlian</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {cv.skills.map((skill, i) => (
                  <span key={i} style={{ padding: '3px 8px', background: `${accent}15`, color: accent, borderRadius: '20px', fontSize: '10px', fontWeight: 600, border: `1px solid ${accent}30` }}>{skill.name}</span>
                ))}
              </div>
            </div>
          )}
          {cv.languages?.length > 0 && (
            <div>
              <h2 style={{ fontSize: '12px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Bahasa</h2>
              {cv.languages.map((lang, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{lang.language}</span>
                  <span style={{ color: '#64748B' }}>{lang.proficiency}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {cv.certifications?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Sertifikasi</h2>
            {cv.certifications.map((cert, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{cert.name}</span>
                <span style={{ color: '#64748B' }}>{cert.issuer} {cert.date && `• ${cert.date}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>✨ CV Builder</h1>
            {form.title && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>— {form.title}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/dokumen"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 16px', borderRadius: '9px', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600, background: 'var(--surface-primary)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              📁 Dokumen
            </Link>
            <button onClick={() => setShowPreview(!showPreview)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 16px', borderRadius: '9px', border: `1px solid ${showPreview ? 'var(--border-brand)' : 'var(--border-default)'}`, background: showPreview ? 'var(--surface-brand)' : 'var(--surface-primary)', color: showPreview ? 'var(--text-brand)' : 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600, transition: 'all 0.15s' }}>
              {showPreview ? '✏️ Edit' : '👁️ Preview'}
            </button>
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }} onClick={handleSave} disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 20px', borderRadius: '9px', border: 'none', background: saving ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
              {saving ? '⏳ Menyimpan...' : '💾 Simpan CV'}
            </motion.button>
          </div>
        </div>

        {msg && <div style={{ padding: '10px 24px', background: msg.includes('Gagal') ? 'var(--error-50)' : 'var(--success-50)', borderBottom: '1px solid var(--border-default)', color: msg.includes('Gagal') ? 'var(--error-600)' : 'var(--success-600)', fontSize: '13px', fontWeight: 500 }}>{msg}</div>}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: CV list + sections */}
          <div style={{ width: '220px', borderRight: '1px solid var(--border-default)', background: 'var(--surface-primary)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* CV list */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <button onClick={createNewCV}
                style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px dashed var(--border-brand)', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-brand)'}>
                + Buat CV Baru
              </button>
            </div>
            {cvList.length > 0 && (
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', maxHeight: '140px', overflowY: 'auto' }}>
                {cvList.map(cv => (
                  <div key={cv.id} onClick={() => { setSelectedCV(cv); setForm(cv); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer', background: selectedCV?.id === cv.id ? 'var(--surface-brand)' : 'transparent', marginBottom: '2px', transition: 'background 0.15s' }}>
                    <span style={{ fontSize: '14px' }}>📄</span>
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: selectedCV?.id === cv.id ? 600 : 400, color: selectedCV?.id === cv.id ? 'var(--text-brand)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cv.title}</span>
                    <button onClick={e => { e.stopPropagation(); deleteCV(cv.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '13px', padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Section nav */}
            <nav style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
              <div style={{ padding: '4px 4px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bagian CV</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-brand)' }}>{progressPct}%</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--surface-secondary)', overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', background: 'var(--brand-600)', borderRadius: '3px' }} />
                </div>
              </div>
              {sections.map(sec => {
                const active = activeSection === sec.id;
                const done = sectionDone(sec.id);
                const count = listSections.includes(sec.id) ? (form[sec.id]?.length || 0) : 0;
                return (
                  <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', border: 'none', background: active ? 'var(--surface-brand)' : 'transparent', color: active ? 'var(--text-brand)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'left', marginBottom: '2px', transition: 'all 0.15s', borderLeft: `2px solid ${active ? 'var(--brand-600)' : 'transparent'}` }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontSize: '14px' }}>{sec.icon}</span>
                    <span style={{ flex: 1 }}>{sec.label}</span>
                    {count > 0 && <span style={{ background: 'var(--brand-600)', color: '#fff', borderRadius: '20px', fontSize: '10px', fontWeight: 700, padding: '1px 6px' }}>{count}</span>}
                    {done && count === 0 && <span style={{ color: 'var(--text-success)', fontSize: '13px', fontWeight: 700 }}>✓</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Center: Form or Preview */}
          <div style={{ flex: 1, overflowY: 'auto', background: showPreview ? '#E2E8F0' : 'var(--bg-base)' }}>
            {showPreview ? (
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                <CVPreview cv={form} template={form.template} />
              </div>
            ) : (
              <div style={{ padding: '24px', maxWidth: '700px' }}>

                {/* Personal Info */}
                {activeSection === 'personal' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.01em' }}>👤 Informasi Pribadi</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Data diri yang akan muncul di header CV</p>

                    {/* Title & Template */}
                    <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', marginBottom: '16px', boxShadow: 'var(--shadow-xs)' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nama CV</label>
                      <input style={{ ...inp, marginBottom: '14px' }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: CV Senior Developer 2025" />

                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Template</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {TEMPLATES.map(t => (
                          <button key={t.id} onClick={() => setForm({ ...form, template: t.id })} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: `2px solid ${form.template === t.id ? t.color : 'var(--border-default)'}`, background: form.template === t.id ? `${t.color}15` : 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'center', transition: 'all 0.15s' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: t.color, margin: '0 auto 6px', opacity: form.template === t.id ? 1 : 0.5 }} />
                            <div style={{ fontSize: '12px', fontWeight: 700, color: form.template === t.id ? t.color : 'var(--text-secondary)' }}>{t.label}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                          { key: 'full_name', label: 'Nama Lengkap *', placeholder: 'Alif Aprizan' },
                          { key: 'job_title', label: 'Jabatan/Posisi', placeholder: 'UI/UX Designer' },
                          { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                          { key: 'phone', label: 'Nomor Telepon', placeholder: '+62 812 3456 7890' },
                          { key: 'location', label: 'Lokasi', placeholder: 'Bandung, Indonesia' },
                          { key: 'website', label: 'Website/Portfolio', placeholder: 'portfolio.com' },
                          { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/username' },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                            <input style={inp} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                              onFocus={e => e.target.style.borderColor = 'var(--border-brand)'}
                              onBlur={e => e.target.style.borderColor = 'var(--border-default)'} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Summary */}
                {activeSection === 'summary' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>📝 Ringkasan Profesional</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>2-4 kalimat tentang dirimu dan keahlian utama</p>
                    <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', boxShadow: 'var(--shadow-xs)' }}>
                      <textarea value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} rows={6}
                        placeholder="Contoh: Saya adalah UI/UX Designer dengan 3 tahun pengalaman dalam merancang produk digital yang berpusat pada pengguna. Berpengalaman menggunakan Figma, Adobe XD, dan Principle untuk menciptakan pengalaman yang intuitif dan menarik."
                        style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Rekomendasi: 50-150 kata</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{(form.summary || '').split(' ').filter(Boolean).length} kata</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Experience */}
                {activeSection === 'experience' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>💼 Pengalaman Kerja</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mulai dari yang paling baru</p>
                      </div>
                      <button onClick={() => addItem('experience')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>+ Tambah</button>
                    </div>
                    {(form.experience || []).length === 0 ? (
                      <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px dashed var(--border-default)', padding: '48px', textAlign: 'center' }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.3 }}>💼</div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Belum ada pengalaman kerja</p>
                        <button onClick={() => addItem('experience')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah Pengalaman</button>
                      </div>
                    ) : (form.experience || []).map((exp, i) => (
                      <motion.div key={exp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', marginBottom: '12px', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Pengalaman {i + 1}</span>
                          <button onClick={() => removeItem('experience', exp.id)} style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Hapus</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { key: 'position', label: 'Posisi/Jabatan *', placeholder: 'UI/UX Designer', full: true },
                            { key: 'company', label: 'Perusahaan *', placeholder: 'PT. Maju Bersama' },
                            { key: 'start_date', label: 'Tanggal Mulai', placeholder: 'Jan 2023' },
                            { key: 'end_date', label: 'Tanggal Selesai', placeholder: 'Des 2024' },
                          ].map(f => (
                            <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                              <input style={inp} value={exp[f.key] || ''} onChange={e => updateItem('experience', exp.id, f.key, e.target.value)} placeholder={f.placeholder} />
                            </div>
                          ))}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deskripsi Pekerjaan</label>
                            <textarea style={{ ...inp, resize: 'vertical', minHeight: '70px', lineHeight: 1.6 }} value={exp.description || ''} onChange={e => updateItem('experience', exp.id, 'description', e.target.value)} placeholder="Jelaskan tanggung jawab dan pencapaian kamu di posisi ini..." />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Education */}
                {activeSection === 'education' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>🎓 Pendidikan</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Riwayat pendidikan formal</p>
                      </div>
                      <button onClick={() => addItem('education')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>+ Tambah</button>
                    </div>
                    {(form.education || []).map((edu, i) => (
                      <motion.div key={edu.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', marginBottom: '12px', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Pendidikan {i + 1}</span>
                          <button onClick={() => removeItem('education', edu.id)} style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Hapus</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { key: 'institution', label: 'Institusi *', placeholder: 'Universitas Indonesia', full: true },
                            { key: 'degree', label: 'Gelar', placeholder: 'S1 / D3 / SMA' },
                            { key: 'field', label: 'Jurusan', placeholder: 'Desain Komunikasi Visual' },
                            { key: 'start_date', label: 'Tahun Masuk', placeholder: '2020' },
                            { key: 'end_date', label: 'Tahun Lulus', placeholder: '2024' },
                            { key: 'gpa', label: 'IPK', placeholder: '3.85' },
                          ].map(f => (
                            <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                              <input style={inp} value={edu[f.key] || ''} onChange={e => updateItem('education', edu.id, f.key, e.target.value)} placeholder={f.placeholder} />
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    {(form.education || []).length === 0 && (
                      <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px dashed var(--border-default)', padding: '48px', textAlign: 'center' }}>
                        <button onClick={() => addItem('education')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah Pendidikan</button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Skills */}
                {activeSection === 'skills' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>⚡ Keahlian</h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Technical dan soft skills</p>
                      </div>
                      <button onClick={() => addItem('skills')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {(form.skills || []).map((skill, i) => (
                        <div key={skill.id} style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '14px', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
                          <input style={{ ...inp, flex: 1 }} value={skill.name || ''} onChange={e => updateItem('skills', skill.id, 'name', e.target.value)} placeholder="Contoh: Figma, React, Python" />
                          <select value={skill.level || 'Menengah'} onChange={e => updateItem('skills', skill.id, 'level', e.target.value)} style={{ padding: '9px 8px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '12px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
                            <option>Dasar</option><option>Menengah</option><option>Mahir</option><option>Expert</option>
                          </select>
                          <button onClick={() => removeItem('skills', skill.id)} style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer', fontSize: '16px', padding: 0, flexShrink: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                    {(form.skills || []).length === 0 && (
                      <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px dashed var(--border-default)', padding: '48px', textAlign: 'center' }}>
                        <button onClick={() => addItem('skills')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah Keahlian</button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Languages */}
                {activeSection === 'languages' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>🌐 Bahasa</h2>
                      <button onClick={() => addItem('languages')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {(form.languages || []).map(lang => (
                        <div key={lang.id} style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '14px', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
                          <input style={{ ...inp, flex: 1 }} value={lang.language || ''} onChange={e => updateItem('languages', lang.id, 'language', e.target.value)} placeholder="Indonesia, Inggris..." />
                          <select value={lang.proficiency || 'Menengah'} onChange={e => updateItem('languages', lang.id, 'proficiency', e.target.value)} style={{ padding: '9px 8px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '12px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
                            <option>Pemula</option><option>Menengah</option><option>Mahir</option><option>Native</option>
                          </select>
                          <button onClick={() => removeItem('languages', lang.id)} style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                    {(form.languages || []).length === 0 && (
                      <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px dashed var(--border-default)', padding: '48px', textAlign: 'center' }}>
                        <button onClick={() => addItem('languages')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah Bahasa</button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Certifications */}
                {activeSection === 'certifications' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>🏆 Sertifikasi</h2>
                      <button onClick={() => addItem('certifications')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah</button>
                    </div>
                    {(form.certifications || []).map((cert, i) => (
                      <div key={cert.id} style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', marginBottom: '12px', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Sertifikasi {i + 1}</span>
                          <button onClick={() => removeItem('certifications', cert.id)} style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Hapus</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { key: 'name', label: 'Nama Sertifikasi *', placeholder: 'Google UX Design Certificate', full: true },
                            { key: 'issuer', label: 'Penerbit', placeholder: 'Google, Coursera, dll' },
                            { key: 'date', label: 'Tanggal', placeholder: 'Jun 2024' },
                            { key: 'url', label: 'URL Verifikasi', placeholder: 'https://credential.net/...' },
                          ].map(f => (
                            <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                              <input style={inp} value={cert[f.key] || ''} onChange={e => updateItem('certifications', cert.id, f.key, e.target.value)} placeholder={f.placeholder} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(form.certifications || []).length === 0 && (
                      <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px dashed var(--border-default)', padding: '48px', textAlign: 'center' }}>
                        <button onClick={() => addItem('certifications')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah Sertifikasi</button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Projects */}
                {activeSection === 'projects' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>🚀 Proyek</h2>
                      <button onClick={() => addItem('projects')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah</button>
                    </div>
                    {(form.projects || []).map((proj, i) => (
                      <div key={proj.id} style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '18px', marginBottom: '12px', boxShadow: 'var(--shadow-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Proyek {i + 1}</span>
                          <button onClick={() => removeItem('projects', proj.id)} style={{ background: 'none', border: 'none', color: 'var(--error-600)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Hapus</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {[
                            { key: 'name', label: 'Nama Proyek *', placeholder: 'SiapKerja.id Platform', full: true },
                            { key: 'technologies', label: 'Teknologi', placeholder: 'Next.js, Supabase, Tailwind' },
                            { key: 'url', label: 'URL Proyek', placeholder: 'github.com/username/project' },
                          ].map(f => (
                            <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                              <input style={inp} value={proj[f.key] || ''} onChange={e => updateItem('projects', proj.id, f.key, e.target.value)} placeholder={f.placeholder} />
                            </div>
                          ))}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deskripsi</label>
                            <textarea style={{ ...inp, resize: 'vertical', minHeight: '60px', lineHeight: 1.6 }} value={proj.description || ''} onChange={e => updateItem('projects', proj.id, 'description', e.target.value)} placeholder="Jelaskan proyek dan kontribusimu..." />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(form.projects || []).length === 0 && (
                      <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px dashed var(--border-default)', padding: '48px', textAlign: 'center' }}>
                        <button onClick={() => addItem('projects')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>+ Tambah Proyek</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}