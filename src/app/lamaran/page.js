'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function LamaranPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchApplications(); }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, trayek(tujuan, asal, jenis, company, salary_min, salary_max)')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  };

  const statusConfig = {
    'Menunggu': { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', icon: '⏳', desc: 'Sedang ditinjau' },
    'Diproses': { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: '⚙️', desc: 'Dalam seleksi' },
    'Diterima': { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', icon: '🎉', desc: 'Selamat!' },
    'Ditolak':  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', icon: '😔', desc: 'Tidak dilanjutkan' },
  };

  const filtered = filter === 'semua' ? applications : applications.filter(a => a.status === filter);

  const stats = {
    total: applications.length,
    menunggu: applications.filter(a => a.status === 'Menunggu').length,
    diproses: applications.filter(a => a.status === 'Diproses').length,
    diterima: applications.filter(a => a.status === 'Diterima').length,
    ditolak: applications.filter(a => a.status === 'Ditolak').length,
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (n) => n >= 1000000 ? `${(n/1000000).toFixed(0)}jt` : `${(n/1000).toFixed(0)}rb`;
    if (min && max) return `Rp ${fmt(min)}-${fmt(max)}`;
    if (min) return `Rp ${fmt(min)}+`;
    return `s/d Rp ${fmt(max)}`;
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Riwayat Lamaran</h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Pantau status semua lamaranmu</p>
          </div>
          <Link href="/trayek" style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#2563EB', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            + Cari Lowongan
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total', value: stats.total, color: '#0F172A', bg: '#F8FAFC', border: '#E2E8F0' },
            { label: 'Menunggu', value: stats.menunggu, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Diproses', value: stats.diproses, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
            { label: 'Diterima', value: stats.diterima, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'Ditolak', value: stats.ditolak, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
          ].map((s, i) => (
            <div key={i} onClick={() => setFilter(i === 0 ? 'semua' : s.label)} style={{
              background: s.bg, borderRadius: '10px', border: `1px solid ${s.border}`,
              padding: '14px', textAlign: 'center', cursor: 'pointer',
              boxShadow: filter === (i === 0 ? 'semua' : s.label) ? `0 0 0 2px ${s.color}` : 'none',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: s.color, opacity: 0.8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Applications list */}
        {loading ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>Memuat riwayat lamaran...</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
              {filter === 'semua' ? 'Belum ada lamaran. Mulai lamar sekarang!' : `Tidak ada lamaran dengan status "${filter}".`}
            </p>
            <Link href="/trayek" style={{ display: 'inline-block', padding: '9px 20px', borderRadius: '8px', background: '#2563EB', color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
              Cari Lowongan
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(app => {
              const sc = statusConfig[app.status] || statusConfig['Menunggu'];
              const salary = formatSalary(app.trayek?.salary_min, app.trayek?.salary_max);
              return (
                <div key={app.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>

                    {/* Company logo */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#2563EB', flexShrink: 0 }}>
                      {(app.trayek?.company || app.trayek?.tujuan)?.slice(0,2).toUpperCase() || 'CF'}
                    </div>

                    {/* Job info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{app.trayek?.tujuan || 'Posisi'}</h3>
                          <p style={{ fontSize: '13px', color: '#64748B' }}>{app.trayek?.company || 'Perusahaan'} • {app.trayek?.asal}</p>
                        </div>
                        {/* Status badge */}
                        <div style={{ padding: '6px 12px', borderRadius: '20px', background: sc.bg, border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '14px' }}>{sc.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: sc.color }}>{app.status}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '20px' }}>{app.trayek?.jenis || 'Full Time'}</span>
                        {salary && <span style={{ fontSize: '12px', color: '#64748B' }}>💰 {salary}</span>}
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>📅 {new Date(app.applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>

                      {/* Cover letter preview */}
                      {app.cover_letter && (
                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px 12px', border: '1px solid #F1F5F9' }}>
                          <p style={{ fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                            {app.cover_letter.slice(0, 120)}{app.cover_letter.length > 120 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <Link href={`/trayek/${app.trayek_id}`} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}>
                      Detail →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
