'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function TrayekPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [trayek, setTrayek] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState([]);
  const [selected, setSelected] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filters, setFilters] = useState({ search: '', jenis: [], experience_level: [], salary_min: '', salary_max: '', location: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: t }, { data: a }, { data: ss }] = await Promise.all([
      supabase.from('trayek').select('*').order('id', { ascending: false }),
      supabase.from('applications').select('trayek_id').eq('user_id', user.id),
      supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setTrayek(t || []);
    setApplied((a || []).map(x => x.trayek_id));
    setSavedSearches(ss || []);
    if (t?.length > 0) setSelected(t[0]);
    setLoading(false);
  };

  const filtered = trayek.filter(d => {
    if (filters.search && !d.tujuan?.toLowerCase().includes(filters.search.toLowerCase()) && !d.asal?.toLowerCase().includes(filters.search.toLowerCase()) && !d.company?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.jenis.length && !filters.jenis.includes(d.jenis)) return false;
    if (filters.experience_level.length && d.experience_level && !filters.experience_level.includes(d.experience_level)) return false;
    if (filters.salary_min && d.salary_max && d.salary_max < parseInt(filters.salary_min)) return false;
    if (filters.salary_max && d.salary_min && d.salary_min > parseInt(filters.salary_max)) return false;
    if (filters.location && !d.asal?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });

  const toggleFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value] }));
  const resetFilters = () => setFilters({ search: '', jenis: [], experience_level: [], salary_min: '', salary_max: '', location: '' });
  const activeCount = [filters.search, filters.jenis.length, filters.experience_level.length, filters.salary_min, filters.salary_max, filters.location].filter(Boolean).length;

  const saveSearch = async () => {
    if (!searchName.trim()) return;
    const { data } = await supabase.from('saved_searches').insert([{ user_id: user.id, name: searchName, filters }]).select().single();
    setSavedSearches(prev => [data, ...prev]);
    setShowSaveModal(false); setSearchName('');
  };

  const deleteSavedSearch = async id => {
    await supabase.from('saved_searches').delete().eq('id', id);
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = n => `${(n/1000000).toFixed(0)}jt`;
    if (min && max) return `Rp ${fmt(min)}–${fmt(max)}`;
    if (min) return `Rp ${fmt(min)}+`;
    return `s/d Rp ${fmt(max)}`;
  };

  const jenisBadge = j => {
    if (j === 'Remote') return 'badge-blue';
    if (j === 'Full Time') return 'badge-green';
    return 'badge-yellow';
  };

  const expBadge = e => {
    if (e === 'Senior') return 'badge-red';
    if (e === 'Mid') return 'badge-purple';
    return 'badge-gray';
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 240px)' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Lowongan Karier</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{filtered.length} dari {trayek.length} lowongan tersedia</p>
          </div>
          <Link href="/lamaran" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
            📋 Lamaranku ({applied.length})
          </Link>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '14px 16px', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', border: '1.5px solid var(--border-default)', borderRadius: '9px', padding: '10px 14px', transition: 'border-color 0.15s' }}
              onFocus={() => {}} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-brand)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '16px' }}>🔍</span>
              <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
                placeholder="Cari posisi, perusahaan, atau lokasi..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
              {filters.search && <button onClick={() => setFilters({ ...filters, search: '' })} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{
              padding: '10px 16px', borderRadius: '9px', border: `1.5px solid ${activeCount > 0 ? 'var(--border-brand)' : 'var(--border-default)'}`,
              background: activeCount > 0 ? 'var(--surface-brand)' : 'var(--surface-secondary)', color: activeCount > 0 ? 'var(--text-brand)' : 'var(--text-secondary)',
              fontSize: '13px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              ⚙️ Filter {activeCount > 0 && <span style={{ background: 'var(--brand-600)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{activeCount}</span>}
            </button>
            {activeCount > 0 && <button onClick={resetFilters} style={{ padding: '10px 14px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Reset</button>}
            <button onClick={() => setShowSaveModal(true)} title="Simpan pencarian" style={{ padding: '10px 14px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>🔖</button>
          </div>

          {/* Quick filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Tipe:</span>
            {['Full Time', 'Remote', 'Setengah Hari', 'Freelance'].map(f => (
              <button key={f} onClick={() => toggleFilter('jenis', f)} style={{
                padding: '4px 12px', borderRadius: '20px', border: `1px solid ${filters.jenis.includes(f) ? 'var(--border-brand)' : 'var(--border-default)'}`,
                background: filters.jenis.includes(f) ? 'var(--surface-brand)' : 'transparent', color: filters.jenis.includes(f) ? 'var(--text-brand)' : 'var(--text-secondary)',
                fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)',
              }}>{f}</button>
            ))}
            <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 4px' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Level:</span>
            {['Junior', 'Mid', 'Senior'].map(e => (
              <button key={e} onClick={() => toggleFilter('experience_level', e)} style={{
                padding: '4px 12px', borderRadius: '20px', border: `1px solid ${filters.experience_level.includes(e) ? 'var(--border-brand)' : 'var(--border-default)'}`,
                background: filters.experience_level.includes(e) ? 'var(--surface-brand)' : 'transparent', color: filters.experience_level.includes(e) ? 'var(--text-brand)' : 'var(--text-secondary)',
                fontSize: '12px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-sans)',
              }}>{e}</button>
            ))}
          </div>
        </motion.div>

        {/* Advanced filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '16px', marginBottom: '14px', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { label: '📍 Lokasi', key: 'location', placeholder: 'Jakarta, Remote...' },
                  { label: '💰 Gaji Min (Rp)', key: 'salary_min', placeholder: '5000000', type: 'number' },
                  { label: '💰 Gaji Max (Rp)', key: 'salary_max', placeholder: '15000000', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                    <input type={f.type || 'text'} value={filters[f.key]} onChange={e => setFilters({ ...filters, [f.key]: e.target.value })} placeholder={f.placeholder}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '13px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved searches */}
        {savedSearches.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>🔖 Tersimpan:</span>
            {savedSearches.map(ss => (
              <div key={ss.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: 'var(--surface-primary)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)' }}>
                <button onClick={() => setFilters(ss.filters)} style={{ background: 'none', border: 'none', color: 'var(--text-brand)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: 0, fontFamily: 'var(--font-sans)' }}>{ss.name}</button>
                <button onClick={() => deleteSavedSearch(ss.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '14px', cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Save modal */}
        <AnimatePresence>
          {showSaveModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} style={{ background: 'var(--surface-primary)', borderRadius: '14px', padding: '24px', maxWidth: '380px', width: '100%', margin: '20px', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '-0.01em' }}>🔖 Simpan Pencarian</h3>
                <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="Nama pencarian..." autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveSearch()}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-default)', fontSize: '14px', outline: 'none', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box', marginBottom: '14px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowSaveModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Batal</button>
                  <button onClick={saveSearch} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>💾 Simpan</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split view */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />) :
            filtered.length === 0 ? (
              <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>🔍</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>Tidak ada hasil</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>Coba ubah filter pencarian</p>
                <button onClick={resetFilters} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Reset Filter</button>
              </div>
            ) : filtered.map((item, i) => {
              const isSelected = selected?.id === item.id;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(item)}
                  style={{ background: 'var(--surface-primary)', borderRadius: '11px', padding: '14px 16px', cursor: 'pointer',
                    border: `${isSelected ? '2' : '1'}px solid ${isSelected ? 'var(--border-brand)' : 'var(--border-default)'}`,
                    boxShadow: isSelected ? 'var(--shadow-brand)' : 'var(--shadow-xs)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: 'var(--text-brand)', flexShrink: 0, border: '1px solid var(--border-brand)' }}>
                      {(item.company || item.tujuan)?.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tujuan}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '7px' }}>{item.company || 'Perusahaan'} {item.asal && `• 📍 ${item.asal}`}</div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`badge ${jenisBadge(item.jenis)}`}>{item.jenis || 'Full Time'}</span>
                        {item.experience_level && <span className={`badge ${expBadge(item.experience_level)}`}>{item.experience_level}</span>}
                        {formatSalary(item.salary_min, item.salary_max) && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>💰 {formatSalary(item.salary_min, item.salary_max)}</span>}
                        {applied.includes(item.id) && <span className="badge badge-green">✓ Dilamar</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', overflow: 'hidden', position: 'sticky', top: '32px', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
              {/* Detail header */}
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-secondary)' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: 'var(--text-brand)', flexShrink: 0, border: '1px solid var(--border-brand)' }}>
                    {(selected.company || selected.tujuan)?.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px', letterSpacing: '-0.01em' }}>{selected.tujuan}</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{selected.company || 'Perusahaan'} {selected.asal && `• 📍 ${selected.asal}`}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`badge ${jenisBadge(selected.jenis)}`}>{selected.jenis || 'Full Time'}</span>
                      {selected.experience_level && <span className={`badge ${expBadge(selected.experience_level)}`}>{selected.experience_level}</span>}
                      {formatSalary(selected.salary_min, selected.salary_max) && <span className="badge badge-gray">💰 {formatSalary(selected.salary_min, selected.salary_max)}</span>}
                      {selected.deadline && <span className="badge badge-yellow">⏰ {new Date(selected.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  </div>
                </div>
                {selected.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {selected.tags.map((tag, i) => (
                      <button key={i} onClick={() => setFilters(f => ({ ...f, search: tag }))}
                        style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '20px', background: 'var(--surface-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
                <Link href={`/trayek/${selected.id}`} style={{
                  display: 'block', padding: '11px', borderRadius: '9px', background: applied.includes(selected.id) ? 'var(--success-600)' : 'var(--brand-600)',
                  color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', textAlign: 'center', boxShadow: applied.includes(selected.id) ? 'none' : 'var(--shadow-brand)',
                }}>{applied.includes(selected.id) ? '✓ Sudah Dilamar — Lihat Detail' : '🚀 Lamar Sekarang'}</Link>
              </div>

              {/* Detail body */}
              <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
                {selected.deskripsi && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.01em' }}>Tentang Pekerjaan</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{selected.deskripsi.slice(0,400)}{selected.deskripsi.length > 400 ? '...' : ''}</p>
                  </div>
                )}
                {selected.requirements && (
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Persyaratan</h3>
                    {selected.requirements.split('\n').slice(0,6).map((req, i) => req.trim() && (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--brand-600)', marginTop: '7px', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{req}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!selected.deskripsi && !selected.requirements && (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Klik "Lamar Sekarang" untuk detail lengkap</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>💼</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Pilih lowongan untuk melihat detail</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
