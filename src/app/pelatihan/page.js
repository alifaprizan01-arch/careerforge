'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    setTrainings(tr || []);
    setUserTrainings(ut || []);
    setCategories(cat || []);
    setLoading(false);
  };

  const handleDaftar = async (training) => {
    if (userTrainings.find(u => u.training_id === training.id)) return;
    setEnrolling(training.id);
    try {
      const { data } = await supabase.from('user_trainings')
        .insert([{ user_id: user.id, training_id: training.id, progress: 0 }])
        .select('*, trainings(title, description)').single();
      setUserTrainings(prev => [...prev, data]);
      setMsg(`Berhasil mendaftar: ${training.title}`);
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

  const getEnrolled = (id) => userTrainings.find(u => u.training_id === id);

  const filtered = trainings.filter(t => {
    const c = catFilter === 'semua' || t.training_categories?.name === catFilter;
    const s = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return c && s;
  });

  const myTrainings = userTrainings;
  const completedCount = userTrainings.filter(u => u.progress >= 100).length;

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Pelatihan</h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Tingkatkan skill dengan program pelatihan terkurasi</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Terdaftar', value: myTrainings.length, color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Selesai', value: completedCount, color: '#16A34A', bg: '#F0FDF4' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: '10px', padding: '12px 20px', textAlign: 'center', border: `1px solid ${s.color}20` }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', color: '#16A34A', marginBottom: '20px', fontSize: '13px' }}>
            ✓ {msg}
          </div>
        )}

        {/* Main tabs */}
        <div style={{ display: 'flex', gap: '0', background: '#fff', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '20px', padding: '4px' }}>
          {[{ id: 'semua', label: 'Semua Pelatihan' }, { id: 'saya', label: `Pelatihan Saya (${myTrainings.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '9px', borderRadius: '8px', border: 'none', fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer',
              background: activeTab === tab.id ? '#2563EB' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748B',
              transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Tab: Semua Pelatihan */}
        {activeTab === 'semua' && (
          <>
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '9px 14px' }}>
                  <span style={{ color: '#94A3B8' }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pelatihan..."
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: '#0F172A' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setCatFilter('semua')} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', background: catFilter === 'semua' ? '#2563EB' : '#fff', color: catFilter === 'semua' ? '#fff' : '#64748B', borderColor: catFilter === 'semua' ? '#2563EB' : '#E2E8F0' }}>Semua</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setCatFilter(c.name)} style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', background: catFilter === c.name ? '#2563EB' : '#fff', color: catFilter === c.name ? '#fff' : '#64748B', borderColor: catFilter === c.name ? '#2563EB' : '#E2E8F0' }}>{c.name}</button>
                ))}
              </div>
            </div>

            {loading ? <p style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>Memuat...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filtered.map(t => {
                  const enrolled = getEnrolled(t.id);
                  return (
                    <div key={t.id} style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${enrolled ? '#BFDBFE' : '#E2E8F0'}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📚</div>
                        {enrolled && (
                          <span style={{ background: enrolled.progress >= 100 ? '#F0FDF4' : '#EFF6FF', color: enrolled.progress >= 100 ? '#16A34A' : '#2563EB', fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: 500 }}>
                            {enrolled.progress >= 100 ? '✓ Selesai' : `${enrolled.progress}%`}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{t.title}</h3>
                        <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '20px', fontWeight: 500 }}>{t.training_categories?.name || 'Umum'}</span>
                      </div>
                      {t.description && <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>{t.description.slice(0, 90)}...</p>}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {t.duration && <span style={{ fontSize: '12px', color: '#94A3B8' }}>⏱ {t.duration}</span>}
                        {t.level && <span style={{ fontSize: '12px', color: '#94A3B8' }}>📊 {t.level}</span>}
                      </div>
                      {enrolled && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Progress</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB' }}>{enrolled.progress}%</span>
                          </div>
                          <div style={{ height: '5px', background: '#EFF6FF', borderRadius: '3px' }}>
                            <div style={{ width: `${enrolled.progress}%`, height: '100%', background: enrolled.progress >= 100 ? '#16A34A' : '#2563EB', borderRadius: '3px', transition: 'width 0.3s' }} />
                          </div>
                        </div>
                      )}
                      <button onClick={() => handleDaftar(t)} disabled={!!enrolled || enrolling === t.id} style={{
                        padding: '9px', borderRadius: '8px', border: enrolled ? '1px solid #BFDBFE' : 'none',
                        background: enrolled ? '#EFF6FF' : enrolling === t.id ? '#93C5FD' : '#2563EB',
                        color: enrolled ? '#2563EB' : '#fff', fontWeight: 600, fontSize: '13px',
                        cursor: enrolled ? 'default' : 'pointer',
                      }}>{enrolling === t.id ? 'Mendaftar...' : enrolled ? 'Sudah Terdaftar' : 'Daftar Sekarang'}</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab: Pelatihan Saya */}
        {activeTab === 'saya' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myTrainings.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '60px', textAlign: 'center' }}>
                <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>Belum ada pelatihan aktif.</p>
                <button onClick={() => setActiveTab('semua')} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Jelajahi Pelatihan
                </button>
              </div>
            ) : myTrainings.map(ut => (
              <div key={ut.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: ut.progress >= 100 ? '#F0FDF4' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {ut.progress >= 100 ? '🏆' : '📚'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{ut.trainings?.title || 'Pelatihan'}</h3>
                        {ut.completed_at && <span style={{ fontSize: '11px', background: '#F0FDF4', color: '#16A34A', padding: '3px 8px', borderRadius: '20px', fontWeight: 500 }}>✓ Selesai {new Date(ut.completed_at).toLocaleDateString('id-ID')}</span>}
                      </div>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: ut.progress >= 100 ? '#16A34A' : '#2563EB' }}>{ut.progress}%</span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', marginBottom: '12px' }}>
                      <div style={{ width: `${ut.progress}%`, height: '100%', background: ut.progress >= 100 ? '#16A34A' : '#2563EB', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>

                    {/* Progress controls */}
                    {ut.progress < 100 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[25, 50, 75, 100].map(p => (
                          p > ut.progress && (
                            <button key={p} onClick={() => updateProgress(ut.id, p)}
                              disabled={updatingProgress === ut.id}
                              style={{
                                padding: '6px 14px', borderRadius: '6px', border: '1px solid #BFDBFE',
                                background: '#EFF6FF', color: '#2563EB', fontWeight: 500, fontSize: '12px',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}>
                              {updatingProgress === ut.id ? '...' : `Update ke ${p}%`}
                            </button>
                          )
                        ))}
                        <input type="number" min="0" max="100" placeholder="Custom %" defaultValue={ut.progress}
                          onKeyDown={e => { if (e.key === 'Enter') updateProgress(ut.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0))); }}
                          style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12px', outline: 'none', color: '#0F172A' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
