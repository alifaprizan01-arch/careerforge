'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    setCerts(c || []);
    setCompletedTrainings(ut || []);
    setLoading(false);
  };

  const initials = (n) => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) : '?';

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Sertifikat & Pencapaian</h1>
          <p style={{ color: '#64748B', fontSize: '14px' }}>Dokumentasi perjalanan belajar dan pencapaianmu</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Sertifikat', value: certs.length, icon: '🏆', bg: '#FFFBEB', color: '#D97706' },
            { label: 'Pelatihan Selesai', value: completedTrainings.length, icon: '✅', bg: '#F0FDF4', color: '#16A34A' },
            { label: 'Skill Terbukti', value: certs.length + completedTrainings.length, icon: '⭐', bg: '#EFF6FF', color: '#2563EB' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sertifikat dari DB */}
        {certs.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>Sertifikat Resmi</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {certs.map(cert => (
                <div key={cert.id} style={{
                  background: 'linear-gradient(135deg,#1E3A5F,#2563EB)',
                  borderRadius: '16px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏆</div>
                  <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '3px 10px', borderRadius: '20px', marginBottom: '10px' }}>Sertifikat Resmi</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{cert.title || cert.certification_name || 'Sertifikat'}</h3>
                  <p style={{ fontSize: '12px', opacity: 0.75, marginBottom: '12px' }}>{cert.issued_by || 'CareerForge'}</p>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                      {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : 'CareerForge'}
                    </span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
                      {initials(user.full_name)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pelatihan selesai sebagai pencapaian */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            Pelatihan Selesai {completedTrainings.length > 0 && <span style={{ fontSize: '13px', background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, marginLeft: '8px' }}>{completedTrainings.length} selesai</span>}
          </h2>
          {loading ? (
            <p style={{ color: '#94A3B8' }}>Memuat...</p>
          ) : completedTrainings.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>Belum ada pelatihan yang selesai.</p>
              <a href="/pelatihan" style={{ display: 'inline-block', padding: '9px 20px', borderRadius: '8px', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                Mulai Pelatihan
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {completedTrainings.map(ut => (
                <div key={ut.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #BBF7D0', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#16A34A', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderBottomLeftRadius: '8px' }}>SELESAI</div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎓</div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>{ut.trainings?.title || 'Pelatihan'}</h3>
                      <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '20px', fontWeight: 500 }}>
                        {ut.trainings?.training_categories?.name || 'Umum'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0FDF4', paddingTop: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>Diselesaikan</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
                        {ut.completed_at ? new Date(ut.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', padding: '6px 12px', borderRadius: '20px' }}>
                      <span style={{ fontSize: '14px' }}>✅</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>100%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
