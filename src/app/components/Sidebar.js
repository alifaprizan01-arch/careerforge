'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';

const navItems = [
  { href: '/', icon: '▦', label: 'Beranda', exact: true },
  { href: '/trayek', icon: '💼', label: 'Lowongan' },
  { href: '/lamaran', icon: '📋', label: 'Lamaran' },
  { href: '/chat', icon: '💬', label: 'Pesan' },
  { href: '/pelatihan', icon: '🎓', label: 'Pelatihan' },
  { href: '/mentoring', icon: '🎤', label: 'Mentoring' },
  { href: '/interview', icon: '🤖', label: 'Interview AI' },
  { href: '/sertifikat', icon: '🏆', label: 'Sertifikat' },
  { href: '/notifikasi', icon: '🔔', label: 'Notifikasi' },
];

const mobileNav = [
  { href: '/', icon: '▦', label: 'Home', exact: true },
  { href: '/trayek', icon: '💼', label: 'Kerja' },
  { href: '/chat', icon: '💬', label: 'Pesan' },
  { href: '/interview', icon: '🤖', label: 'AI' },
  { href: '/notifikasi', icon: '🔔', label: 'Notif' },
  { href: '/profil', icon: '👤', label: 'Profil' },
];

const portalLinks = {
  admin: { href: '/admin', icon: '🛡️', label: 'Dashboard Admin', colorVar: 'var(--brand-600)' },
  company: { href: '/company', icon: '🏢', label: 'Portal Perusahaan', colorVar: '#7C3AED' },
  mentor: { href: '/mentor', icon: '🎤', label: 'Portal Mentor', colorVar: 'var(--success-600)' },
};

const roleLabels = {
  admin: { text: 'Superadmin', bg: 'var(--brand-600)', color: '#fff' },
  company: { text: 'Perusahaan', bg: '#7C3AED', color: '#fff' },
  mentor: { text: 'Mentor', bg: 'var(--success-600)', color: '#fff' },
  user: { text: 'Member', bg: 'var(--surface-tertiary)', color: 'var(--text-secondary)' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const channel = supabase.channel('notif-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchUnread)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchUnread = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const handleLogout = () => { logout(); router.push('/auth'); };
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const portal = user?.role && portalLinks[user.role] ? portalLinks[user.role] : null;
  const roleLabel = user?.role ? roleLabels[user.role] : roleLabels.user;

  const isActive = (href, exact) => exact ? pathname === href : pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '240px', height: '100vh', position: 'fixed', left: 0, top: 0,
          background: 'var(--surface-primary)', borderRight: '1px solid var(--border-default)',
          display: 'flex', flexDirection: 'column', zIndex: 100,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, var(--brand-600), var(--brand-800))', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', letterSpacing: '-0.5px', flexShrink: 0, boxShadow: 'var(--shadow-brand)' }}>CF</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>CareerForge</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>SDGs 8</div>
          </div>
          <button onClick={toggleTheme} style={{ width: '28px', height: '28px', borderRadius: '7px', border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--text-secondary)' }}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Portal link */}
        {portal && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-secondary)' }}>
            <Link href={portal.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', textDecoration: 'none', background: 'var(--surface-brand)', border: '1px solid var(--border-brand)' }}>
              <span style={{ fontSize: '14px' }}>{portal.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: portal.colorVar, flex: 1 }}>{portal.label}</span>
              <span style={{ fontSize: '11px', color: portal.colorVar, opacity: 0.7 }}>→</span>
            </Link>
          </div>
        )}

        {/* User */}
        <Link href="/profil" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', textDecoration: 'none', display: 'block', transition: 'background var(--transition-fast)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-brand)' }} />
              ) : (
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-600), var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>{initials}</div>
              )}
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', border: '1.5px solid var(--surface-primary)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'User'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: roleLabel.bg, color: roleLabel.color, fontWeight: 600, letterSpacing: '0.02em' }}>{roleLabel.text}</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>✏</span>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 8px', marginTop: '2px' }}>Menu Utama</div>
          {navItems.map((item, i) => {
            const active = isActive(item.href, item.exact);
            return (
              <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '8px 10px', borderRadius: '8px', marginBottom: '1px',
                  textDecoration: 'none', position: 'relative',
                  background: active ? 'var(--surface-brand)' : 'transparent',
                  color: active ? 'var(--text-brand)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400, fontSize: '14px',
                  borderLeft: `2px solid ${active ? 'var(--brand-600)' : 'transparent'}`,
                  transition: 'all var(--transition-base)',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
                  <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.href === '/notifikasi' && unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ background: '#EF4444', color: '#fff', borderRadius: '10px', fontSize: '10px', fontWeight: 700, padding: '1px 6px', minWidth: '18px', textAlign: 'center' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 10px 14px', borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="/profil" style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, transition: 'all var(--transition-base)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <span style={{ fontSize: '16px' }}>👤</span> Edit Profil
          </Link>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', transition: 'all var(--transition-base)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-50)'; e.currentTarget.style.color = 'var(--error-600)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            <span style={{ fontSize: '16px' }}>🚪</span> Keluar
          </button>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        {mobileNav.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 10px', textDecoration: 'none', flex: 1, color: active ? 'var(--text-brand)' : 'var(--text-tertiary)', position: 'relative' }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{item.label}</span>
              {item.href === '/notifikasi' && unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '14px', width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }} />
              )}
              {active && <motion.div layoutId="mobileIndicator" style={{ position: 'absolute', bottom: 0, width: '24px', height: '2px', borderRadius: '1px', background: 'var(--brand-600)' }} />}
            </Link>
          );
        })}
        {portal && (
          <Link href={portal.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 10px', textDecoration: 'none', flex: 1, color: portal.colorVar }}>
            <span style={{ fontSize: '20px' }}>{portal.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>Portal</span>
          </Link>
        )}
        <button onClick={toggleTheme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 10px', border: 'none', background: 'transparent', cursor: 'pointer', flex: 1, color: 'var(--text-tertiary)' }}>
          <span style={{ fontSize: '20px' }}>{isDark ? '☀️' : '🌙'}</span>
          <span style={{ fontSize: '10px' }}>Tema</span>
        </button>
      </div>
    </>
  );
}
