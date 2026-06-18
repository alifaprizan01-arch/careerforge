'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function SertifikatPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [certs, setCerts] = useState([]);
  const [completedTrainings, setCompletedTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: c }, { data: ut }] = await Promise.all([
      supabase.from('user_certifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_trainings').select('*, trainings(title, training_categories(name))').eq('user_id', user.id).gte('progress', 100),
    ]);
    setCerts(c || []); setCompletedTrainings(ut || []);
    setLoading(false);
  };

  const initials = n => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) || '?';

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '32px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Sertifikat & Pencapaian</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Dokumentasi perjalanan belajar dan pencapaianmu</p>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Total Sertifikat', value: certs.length, icon: '🏆', color: 'var(--warning-600)', bg: 'var(--warning-50)' },
            { label: 'Pelatihan Selesai', value: completedTrainings.length, icon: '✅', color: 'var(--text-success)', bg: 'var(--success-50)' },
            { label: 'Skill Terbukti', value: certs.length + completedTrainings.length, icon: '⭐', color: 'var(--text-brand)', bg: 'var(--surface-brand)' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{loading ? '—' : s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 500 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certificates */}
        {certs.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.01em' }}>Sertifikat Resmi</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {certs.map((cert, i) => (
                <motion.div key={cert.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
                  style={{ background: 'linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 100%)', borderRadius: '16px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden', cursor: 'default', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: '-20px', left: '40px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '32px', marginBottom: '14px' }}>🏆</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', lineHeight: 1.3 }}>{cert.title || cert.certification_name || 'Sertifikat'}</h3>
                    <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '16px' }}>{cert.issued_by || 'CareerForge'}</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', opacity: 0.65, fontWeight: 500 }}>{cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : 'CareerForge'}</span>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                        {initials(user.full_name)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed trainings */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Pelatihan Selesai</h2>
            {completedTrainings.length > 0 && <span className="badge badge-green">{completedTrainings.length} selesai</span>}
          </div>
          {loading ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}</div> :
          completedTrainings.length === 0 ? (
            <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.4 }}>🎓</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada pelatihan selesai</h3>
              <Link href="/pelatihan" style={{ display: 'inline-flex', marginTop: '12px', padding: '9px 20px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>Mulai Pelatihan</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {completedTrainings.map((ut, i) => (
                <motion.div key={ut.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -3, boxShadow: 'var(--shadow-md)' }}
                  style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid #BBF7D0', padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--success-600)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderBottomLeftRadius: '8px', letterSpacing: '0.04em' }}>SELESAI</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--success-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🎓</div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px', lineHeight: 1.3 }}>{ut.trainings?.title || 'Pelatihan'}</h3>
                      <span className="badge badge-blue">{ut.trainings?.training_categories?.name || 'Umum'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #BBF7D0', paddingTop: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Diselesaikan</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{ut.completed_at ? new Date(ut.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--success-50)', padding: '6px 12px', borderRadius: '20px', border: '1px solid #BBF7D0' }}>
                      <span style={{ fontSize: '13px' }}>✅</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-success)' }}>100%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
