'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';
import { useLang } from '../../lib/langContext';
import { useSidebar } from '../../lib/sidebarContext';

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

export default function LowonganPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail' — khusus navigasi di mobile

  // State Data
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set()); // Sinkronisasi dengan tabel applications asli
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const { t } = useLang();
  const { isOpen: sidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState('deskripsi'); // deskripsi | kualifikasi | perusahaan

  // Tema Dinamis Premium
  const theme = {
    purple: '#7C3AED',
    purpleHover: '#6D28D9',
    darkText: isDark ? '#F8FAFC' : '#1C1D1F',
    lightText: isDark ? '#94A3B8' : '#6A6F73',
    border: isDark ? '#334155' : '#D1D7DC',
    bgLight: isDark ? '#1E293B' : '#F7F9FA',
    white: isDark ? '#0F172A' : '#FFFFFF',
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    cardSelected: isDark ? '#2E3A4E' : '#F5F3FF',
    green: '#22C55E',
    greenBg: 'rgba(34, 197, 94, 0.1)',
  };

  useEffect(() => {
    if (loaded && !user) router.push('/auth');
  }, [loaded, user]);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchUserApplications();
    }
  }, [user]);

  // Mengambil daftar lowongan dari tabel 'trayek'
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trayek')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      if (data && data.length > 0) {
        setSelectedJob(data[0]); 
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mengambil daftar berkas lamaran aktif berdasarkan 'trayek_id' asli database Anda
  const fetchUserApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('trayek_id')
        .eq('user_id', user.id);

      if (error) throw error;
      const appliedIds = new Set(data.map(app => app.trayek_id));
      setAppliedJobIds(appliedIds);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  // Format Gaji diselaraskan dengan fungsi pembaca di file detail Anda
  const formatSalary = (min, max) => {
    if (!min && !max) return 'Negotiable';
    const fmt = (n) => n >= 1000000 ? `Rp ${(n/1000000).toFixed(0)} juta` : `Rp ${(n/1000).toFixed(0)} ribu`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}/bulan`;
    if (min) return `${fmt(min)}+/bulan`;
    return `s/d ${fmt(max)}/bulan`;
  };

  // Logika Filter Pencarian Berdasarkan Atribut Database Asli (tujuan, company, asal, jenis)
  const filteredJobs = jobs.filter((job) => {
    const matchSearch = job.tujuan?.toLowerCase().includes(search.toLowerCase()) || 
                        job.company?.toLowerCase().includes(search.toLowerCase()) ||
                        job.asal?.toLowerCase().includes(search.toLowerCase());
    
    const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const matchType = typeFilter === 'Semua' || normalize(job.jenis) === normalize(typeFilter);
    
    return matchSearch && matchType;
  });

  if (!loaded || !user) return null;

  return (
    <div style={{ backgroundColor: theme.white, color: theme.darkText, minHeight: '100vh', transition: 'all 0.2s ease' }}>
      <Sidebar />

      <div style={{ 
        paddingLeft: sidebarOpen ? '240px' : '0px', 
        transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'padding-left'
      }}>
        
        {/* HEADER & FILTER SECTIONS */}
        <header style={{ padding: isMobile ? '16px' : '24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 0, backgroundColor: theme.white, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: isMobile ? '19px' : '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>{t('Lowongan Karier')}</h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 100%', position: 'relative', minWidth: 0 }}>
              <input 
                type="text" 
                placeholder={t('Cari posisi, perusahaan, atau lokasi...')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 40px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.bgLight, color: theme.darkText, outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.lightText }}>🔍</span>
            </div>
            
            <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', width: '100%', paddingBottom: isMobile ? '2px' : 0 }}>
              {['Semua', 'Full Time', 'Remote', 'Setengah Hari', 'Freelance'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  style={{
                    padding: isMobile ? '9px 14px' : '10px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${typeFilter === type ? theme.purple : theme.border}`,
                    backgroundColor: typeFilter === type ? theme.purple : theme.cardBg,
                    color: typeFilter === type ? '#FFF' : theme.darkText,
                    fontWeight: 600,
                    fontSize: isMobile ? '13px' : '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t(type)}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* TWO-COLUMN INTERACTIVE PANEL */}
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? undefined : '420px 1fr', height: isMobile ? 'auto' : 'calc(100vh - 140px)', overflow: isMobile ? 'visible' : 'hidden' }}>
          
          {/* KOLOM KIRI: List Card Lowongan Pekerjaan */}
          {(!isMobile || mobileView === 'list') && (
          <div style={{ borderRight: isMobile ? 'none' : `1px solid ${theme.border}`, overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: theme.white }}>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: '115px', backgroundColor: theme.bgLight, borderRadius: '8px' }} />
              ))
            ) : filteredJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: theme.lightText, fontSize: '14px' }}>{t('Tidak ada lowongan kerja yang tersedia.')}</div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const hasApplied = appliedJobIds.has(job.id);
                return (
                  <motion.div
                    key={job.id}
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setSelectedJob(job); setActiveTab('deskripsi'); if (isMobile) setMobileView('detail'); }}
                    style={{
                      padding: '18px',
                      borderRadius: '10px',
                      border: `1px solid ${isSelected ? theme.purple : theme.border}`,
                      backgroundColor: isSelected ? theme.cardSelected : theme.cardBg,
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(86, 36, 208, 0.08)' : 'none',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: theme.darkText }}>{job.tujuan}</div>
                      
                      <div style={{ width: '32px', height: '32px', backgroundColor: isSelected ? theme.purple : theme.bgLight, color: isSelected ? '#FFF' : theme.purple, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {(job.company || job.tujuan)?.slice(0, 2).toUpperCase() || 'PT'}
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.lightText, marginBottom: '10px' }}>{job.company || t('Perusahaan')}</div>
                    
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: theme.bgLight, borderRadius: '4px', color: theme.darkText, fontWeight: 600 }}>📍 {job.asal || 'Indonesia'}</span>
                      <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: 'rgba(86, 36, 208, 0.08)', borderRadius: '4px', color: theme.purple, fontWeight: 700 }}>{job.jenis || 'Full Time'}</span>
                      
                      {hasApplied && (
                        <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: theme.greenBg, borderRadius: '4px', color: theme.green, fontWeight: 700 }}>✓ {t('Dilamar')}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          )}

          {/* KOLOM KANAN: Detail Tempat Kerja & Deskripsi Panel */}
          {(!isMobile || mobileView === 'detail') && (
          <div style={{ overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '14px' : '32px', backgroundColor: theme.bgLight }}>
            {isMobile && (
              <button onClick={() => setMobileView('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: theme.purple, fontWeight: 700, fontSize: '13px', cursor: 'pointer', padding: '6px 0', marginBottom: '12px', fontFamily: 'inherit' }}>
                ← {t('Kembali ke daftar')}
              </button>
            )}
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  style={{ backgroundColor: theme.white, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: isMobile ? '18px' : '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.015)' }}
                >
                  {/* Top Profile Card Header */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', marginBottom: '20px', gap: isMobile ? '16px' : '20px' }}>
                    <div>
                      <h2 style={{ fontSize: isMobile ? '19px' : '24px', fontWeight: 800, color: theme.darkText, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{selectedJob.tujuan}</h2>
                      <p style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 700, color: theme.purple, margin: '0 0 14px 0' }}>{selectedJob.company || t('Perusahaan')}</p>
                      
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', color: theme.lightText, fontSize: '13px', fontWeight: 500 }}>
                        <span>📍 {selectedJob.asal || 'Indonesia'}</span>
                        <span>•</span>
                        <span>⏱️ {selectedJob.jenis || 'Full Time'}</span>
                        <span>•</span>
                        <span>💰 {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</span>
                      </div>
                    </div>
                    
                    {/* Alih rute interaktif menuju halaman dinamis formal Anda */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/trayek/${selectedJob.id}`)}
                      style={{
                        padding: isMobile ? '13px 20px' : '14px 24px',
                        width: isMobile ? '100%' : 'auto',
                        backgroundColor: appliedJobIds.has(selectedJob.id) ? theme.green : theme.purple,
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 14px rgba(86, 36, 208, 0.25)',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {appliedJobIds.has(selectedJob.id) ? `${t('Lihat Status Berkas')} 📋` : `${t('Lamar / Lengkapi Berkas')} 🚀`}
                    </motion.button>
                  </div>

                  {/* Tab Navigation Menu */}
                  <div className="no-scrollbar" style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, gap: isMobile ? '18px' : '28px', marginBottom: '24px', overflowX: isMobile ? 'auto' : 'visible' }}>
                    {[
                      { id: 'deskripsi', label: 'Tentang Pekerjaan' },
                      { id: 'kualifikasi', label: 'Persyaratan Kualifikasi' },
                      { id: 'dokumen', label: 'Dokumen Wajib' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          padding: '12px 0',
                          background: 'none',
                          border: 'none',
                          borderBottom: `3px solid ${activeTab === tab.id ? theme.purple : 'transparent'}`,
                          color: activeTab === tab.id ? theme.purple : theme.lightText,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: isMobile ? '13px' : '14px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {t(tab.label)}
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents View dengan pre-line spacing */}
                  <div style={{ lineHeight: '1.7', fontSize: '14px', color: theme.darkText, whiteSpace: 'pre-line' }}>
                    {activeTab === 'deskripsi' && (
                      <div>
                        {selectedJob.deskripsi || t('Tidak ada deskripsi pekerjaan tambahan.')}
                      </div>
                    )}
                    {activeTab === 'kualifikasi' && (
                      <div>
                        {selectedJob.requirements ? (
                          selectedJob.requirements.split('\n').map((req, i) => req.trim() && (
                            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.purple, marginTop: '9px', flexShrink: 0 }} />
                              <span>{req}</span>
                            </div>
                          ))
                        ) : (
                          t('Tidak ada persyaratan khusus yang dicantumkan.')
                        )}
                      </div>
                    )}
                    {activeTab === 'dokumen' && (
                      <div>
                        <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>{t('Dokumen yang wajib dilampirkan pada sistem:')}</p>
                        {selectedJob.required_documents && selectedJob.required_documents.length > 0 ? (
                          selectedJob.required_documents.map((doc, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', color: theme.purple, fontWeight: 600 }}>
                              <span>•</span><span>{doc}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: theme.lightText }}>{t('Hanya membutuhkan kelengkapan CV utama standar.')}</div>
                        )}
                      </div>
                    )}
                  </div>

                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', color: theme.lightText, gap: '12px' }}>
                  <span style={{ fontSize: '40px' }}>💼</span>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{t('Silakan klik salah satu lowongan di kolom kiri untuk meninjau kualifikasi lengkap.')}</div>
                </div>
              )}
            </AnimatePresence>
          </div>
          )}

        </div>

      </div>
    </div>
  );
}