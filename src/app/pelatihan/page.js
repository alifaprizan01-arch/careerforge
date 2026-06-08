'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function PelatihanPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [trainings, setTrainings] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('semua');
  const [activeTab, setActiveTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [updatingProgress, setUpdatingProgress] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: tr }, { data: ut }, { data: cat }] = await Promise.all([
      supabase.from('trainings').select('*, training_categories(name)'),
      supabase.from('user_trainings').select('*, trainings(title, description)').eq('user_id', user.id),
      supabase.from('training_categories').select('*'),
    ]);
    setTrainings(tr || []); setUserTrainings(ut || []); setCategories(cat || []);
    setLoading(false);
  };

  const handleDaftar = async (training) => {
    if (userTrainings.find(u => u.training_id === training.id)) return;
    setEnrolling(training.id);
    try {
      const { data } = await supabase.from('user_trainings').insert([{ user_id: user.id, training_id: training.id, progress: 0 }]).select('*, trainings(title, description)').single();
      setUserTrainings(prev => [...prev, data]);
      setMsg('Berhasil mendaftar: ' + training.title);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { console.error(err); }
    finally { setEnrolling(null); }
  };

  const updateProgress = async (utId, newProgress) => {
    setUpdatingProgress(utId);
    try {
      const updates = { progress: newProgress };
      if (newProgress >= 100) updates.completed_at = new Date().toISOString();
      await supabase.from('user_trainings').update(updates).eq('id', utId);
      setUserTrainings(prev => prev.map(ut => ut.id === utId ? { ...ut, ...updates } : ut));
      if (newProgress >= 100) { setMsg('Selamat! Pelatihan selesai! 🎉'); setTimeout(() => setMsg(''), 4000); }
    } catch (err) { console.error(err); }
    finally { setUpdatingProgress(null); }
  };

  const filtered = trainings.filter(t => {
    const cat = catFilter === 'semua' || t.training_categories?.name === catFilter;
    const s = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return cat && s;
  });

  const completedCount = userTrainings.filter(u => u.progress >= 100).length;

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pelatihan</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Tingkatkan skill dengan program pelatihan terkurasi</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '12px 18px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-brand)' }}>{userTrainings.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Terdaftar</div>
            </div>
            <div style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '12px 18px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-success)' }}>{completedCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Selesai</div>
            </div>
          </div>
        </motion.div>

        {msg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: 'var(--success-50)', border: '1px solid #BBF7D0', borderRadius: '8px', color: 'var(--text-success)', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>✓ {msg}</motion.div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '4px', marginBottom: '20px', boxShadow: 'var(--shadow-xs)' }}>
          {[{ id: 'semua', label: `Semua (${trainings.length})` }, { id: 'saya', label: `Pelatihanku (${userTrainings.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '9px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
              background: activeTab === tab.id ? 'var(--brand-600)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
            }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'semua' && (
          <>
            <div style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '14px 16px', marginBottom: '16px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pelatihan..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['semua', ...categories.map(c => c.name)].map(f => (
                  <button key={f} onClick={() => setCatFilter(f)} style={{
                    padding: '5px 12px', borderRadius: '20px', border: `1px solid ${catFilter === f ? 'var(--brand-400)' : 'var(--border-default)'}`,
                    fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                    background: catFilter === f ? 'var(--surface-brand)' : 'transparent',
                    color: catFilter === f ? 'var(--text-brand)' : 'var(--text-secondary)',
                  }}>{f === 'semua' ? 'Semua' : f}</button>
                ))}
              </div>
            </div>
            {loading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '200px' }} />)}</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filtered.map((t, i) => {
                  const enrolled = userTrainings.find(u => u.training_id === t.id);
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: `1px solid ${enrolled ? 'var(--border-brand)' : 'var(--border-default)'}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-xs)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid var(--border-brand)' }}>📚</div>
                        {enrolled && <span className="badge badge-green">✓ Terdaftar</span>}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>{t.title}</h3>
                        <span className="badge badge-blue">{t.training_categories?.name || 'Umum'}</span>
                      </div>
                      {t.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{t.description.slice(0,90)}...</p>}
                      {enrolled && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Progress</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: enrolled.progress >= 100 ? 'var(--text-success)' : 'var(--text-brand)' }}>{enrolled.progress}%</span>
                          </div>
                          <div style={{ height: '5px', background: 'var(--surface-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${enrolled.progress}%` }} transition={{ duration: 0.6 }}
                              style={{ height: '100%', background: enrolled.progress >= 100 ? 'var(--success-500)' : 'linear-gradient(90deg,var(--brand-500),var(--brand-400))', borderRadius: '3px' }} />
                          </div>
                        </div>
                      )}
                      <button onClick={() => handleDaftar(t)} disabled={!!enrolled || enrolling === t.id} style={{
                        padding: '9px', borderRadius: '8px', border: enrolled ? '1px solid var(--border-brand)' : 'none', fontWeight: 600, fontSize: '13px', cursor: enrolled ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                        background: enrolled ? 'var(--surface-brand)' : enrolling === t.id ? '#93C5FD' : 'var(--brand-600)',
                        color: enrolled ? 'var(--text-brand)' : '#fff',
                      }}>{enrolling === t.id ? 'Mendaftar...' : enrolled ? '✓ Sudah Terdaftar' : 'Daftar Sekarang'}</button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'saya' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {userTrainings.length === 0 ? (
              <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.4 }}>📚</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada pelatihan aktif</h3>
                <button onClick={() => setActiveTab('semua')} style={{ marginTop: '12px', padding: '9px 20px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Jelajahi Pelatihan</button>
              </div>
            ) : userTrainings.map((ut, i) => (
              <motion.div key={ut.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '20px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: ut.progress >= 100 ? 'var(--success-50)' : 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{ut.progress >= 100 ? '🏆' : '📚'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{ut.trainings?.title || 'Pelatihan'}</h3>
                        {ut.progress >= 100 && <span className="badge badge-green">✓ Selesai</span>}
                      </div>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: ut.progress >= 100 ? 'var(--text-success)' : 'var(--text-brand)' }}>{ut.progress}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--surface-secondary)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${ut.progress}%` }} transition={{ duration: 0.8 }}
                        style={{ height: '100%', background: ut.progress >= 100 ? 'var(--success-500)' : 'linear-gradient(90deg,var(--brand-500),var(--brand-400))', borderRadius: '4px' }} />
                    </div>
                    {ut.progress < 100 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center' }}>Update progress:</span>
                        {[25,50,75,100].filter(p => p > ut.progress).map(p => (
                          <button key={p} onClick={() => updateProgress(ut.id, p)} disabled={updatingProgress === ut.id}
                            style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border-brand)', background: 'var(--surface-brand)', color: 'var(--text-brand)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
                            {updatingProgress === ut.id ? '...' : `→ ${p}%`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
