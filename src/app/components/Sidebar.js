'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';

const navItems = [
  { href: '/', icon: '⊞', label: 'Beranda' },
  { href: '/trayek', icon: '💼', label: 'Lowongan' },
  { href: '/lamaran', icon: '📋', label: 'Lamaran' },
  { href: '/pelatihan', icon: '🎓', label: 'Pelatihan' },
  { href: '/mentoring', icon: '🎤', label: 'Mentoring' },
  { href: '/sertifikat', icon: '🏆', label: 'Sertifikat' },
  { href: '/notifikasi', icon: '🔔', label: 'Notifikasi' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    // Real-time subscription untuk notifikasi baru
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchUnread(); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const handleLogout = () => { logout(); router.push('/auth'); };
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <aside style={{ width: '220px', minHeight: '100vh', background: '#fff', borderRight: '1px solid #E2E8F0', position: 'fixed', left: 0, top: 0, display: 'flex', flexDirection: 'column', zIndex: 100 }}>

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: '#2563EB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>CF</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>CareerForge</div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>SDGs 8</div>
        </div>
      </div>

      {/* User */}
      <Link href="/profil" style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', textDecoration: 'none', display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #BFDBFE', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'User'}</div>
            <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>✏️</span>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href === '/trayek' && pathname.startsWith('/trayek'));
          const isNotif = item.href === '/notifikasi';
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
              textDecoration: 'none', transition: 'all 0.15s',
              background: active ? '#EFF6FF' : 'transparent',
              color: active ? '#2563EB' : '#334155',
              fontWeight: active ? 600 : 400, fontSize: '14px',
              borderLeft: active ? '3px solid #2563EB' : '3px solid transparent',
            }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isNotif && unreadCount > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', borderRadius: '20px', fontSize: '10px', fontWeight: 700, padding: '2px 6px', minWidth: '18px', textAlign: 'center' }}>{unreadCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Link href="/profil" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', background: pathname === '/profil' ? '#EFF6FF' : '#F8FAFC', color: pathname === '/profil' ? '#2563EB' : '#475569', fontSize: '13px', fontWeight: 500, border: '1px solid #E2E8F0' }}>
          <span>👤</span> Edit Profil
        </Link>
        <button onClick={handleLogout} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span>🚪</span> Keluar
        </button>
      </div>
    </aside>
  );
}
