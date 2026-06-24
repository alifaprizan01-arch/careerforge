'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';
import { useSidebar } from '../../lib/sidebarContext';
import { useLang } from '../../lib/langContext';

// 1. MENU DIURUTKAN DARI A - Z (Beranda tetap di atas sebagai standar UX)
const navItems = [
  { href: '/', icon: '▦', label: 'Beranda', exact: true },
  { href: '/cv-builder', icon: '✨', label: 'CV Builder' },
  { href: '/dokumen', icon: '📁', label: 'Dokumen' },
  { href: '/lamaran', icon: '📋', label: 'Lamaran' },
  { href: '/trayek', icon: '💼', label: 'Lowongan' },
  { href: '/mentoring', icon: '🎤', label: 'Mentoring' },
  { href: '/pelatihan', icon: '🎓', label: 'Pelatihan' },
  { href: '/chat', icon: '💬', label: 'Pesan' },
  { href: '/sertifikat', icon: '🏆', label: 'Sertifikat' },
];

const portalLinks = {
  admin: { href: '/admin', icon: '🛡️', label: 'Dashboard Admin', colorVar: '#5624D0' },
  company: { href: '/company', icon: '🏢', label: 'Portal Perusahaan', colorVar: '#7C3AED' },
  mentor: { href: '/mentor', icon: '🎤', label: 'Portal Mentor', colorVar: '#10B981' },
};

const roleLabels = {
  admin: { text: 'Superadmin', bg: '#5624D0', color: '#fff' },
  company: { text: 'Perusahaan', bg: '#7C3AED', color: '#fff' },
  mentor: { text: 'Mentor', bg: '#10B981', color: '#fff' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const sidebarCtx = useSidebar();
  const { t } = useLang();
  const isOpen = sidebarCtx ? sidebarCtx.isOpen : true;
  const toggleSidebar = sidebarCtx ? sidebarCtx.toggle : () => {};
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const didAutoClose = useRef(false);

  const theme = {
    purple: '#5624D0',
    darkText: isDark ? '#F8FAFC' : '#1C1D1F',
    lightText: isDark ? '#94A3B8' : '#6A6F73',
    border: isDark ? '#334155' : '#D1D7DC',
    bgLight: isDark ? '#1E293B' : '#F7F9FA',
    white: isDark ? '#0F172A' : '#FFFFFF',
    hoverBg: isDark ? '#1E293B' : '#F3F4F6'
  };

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const channel = supabase.channel('notif-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchUnread)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  // Deteksi layar HP
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Di HP: sidebar default tertutup — jalankan sekali saat isMobile pertama true
  useEffect(() => {
    if (isMobile && isOpen && !didAutoClose.current) {
      didAutoClose.current = true;
      // Gunakan setTimeout agar tidak trigger dalam siklus render yang sama
      setTimeout(() => toggleSidebar(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Di HP: tutup sidebar saat pindah halaman — hanya kalau memang sedang terbuka
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    if (isMobile && isOpen) {
      setTimeout(() => toggleSidebar(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const fetchUnread = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const handleLogout = () => { logout(); router.push('/auth'); };
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const portal = user?.role && portalLinks[user.role] ? portalLinks[user.role] : null;
  const roleLabel = (user?.role && roleLabels[user.role]) ? roleLabels[user.role] : { text: user?.role || 'Member', bg: theme.bgLight, color: theme.lightText };

  const isActive = (href, exact) => exact ? pathname === href : pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      {/* Latar gelap saat sidebar terbuka di HP (klik untuk menutup) */}
      {isMobile && isOpen && (
        <div onClick={toggleSidebar} aria-hidden
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90, backdropFilter: 'none' }} />
      )}

      {/* Tombol buka (handle) — tampil saat sidebar tertutup di SEMUA halaman; di tepi kiri-tengah agar tidak menutupi logo/judul */}
      {!isOpen && (
        isMobile ? (
          /* Topbar pengganti sidebar di HP */
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
            height: '52px', background: theme.white,
            borderBottom: `1px solid ${theme.border}`,
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px',
          }}>
            <button onClick={toggleSidebar} aria-label="Buka menu"
              style={{ width: '40px', height: '40px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bgLight, color: theme.darkText, cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ☰
            </button>
            <div style={{ width: '28px', height: '28px', background: theme.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '11px', borderRadius: '6px', flexShrink: 0 }}>CF</div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: theme.darkText, letterSpacing: '-0.01em', flex: 1 }}>SiapKerja.id</span>
          </div>
        ) : (
          <button onClick={toggleSidebar} aria-label="Buka menu"
            style={{ position: 'fixed', top: '50%', left: 0, transform: 'translateY(-50%)', zIndex: 200, width: '30px', height: '64px', borderRadius: '0 12px 12px 0', borderTop: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, background: theme.white, color: theme.darkText, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 12px rgba(0,0,0,0.12)', transition: 'width 0.15s, background-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = theme.bgLight; e.currentTarget.style.width = '38px'; }}
            onMouseLeave={e => { e.currentTarget.style.background = theme.white; e.currentTarget.style.width = '30px'; }}>
            ☰
          </button>
        )
      )}

      <aside
        style={{
          width: isMobile ? '100%' : '240px',
          height: '100vh', position: 'fixed', left: 0, top: 0,
          background: theme.white, borderRight: `1px solid ${theme.border}`,
          display: 'flex', flexDirection: 'column', zIndex: 100,
          fontFamily: 'var(--font-sans, Arial, sans-serif)',
          transform: isOpen ? 'translateX(0)' : isMobile ? 'translateX(-100%)' : 'translateX(-240px)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease',
          willChange: 'transform'
        }}
      >
        {/* Header Logo */}
        <div style={{ padding: '16px 16px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Tombol tutup sidebar */}
          <button onClick={toggleSidebar} aria-label="Tutup menu"
            style={{ width: '30px', height: '30px', border: `1px solid ${theme.border}`, background: theme.bgLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.darkText, borderRadius: '6px', fontSize: '15px', flexShrink: 0 }}>
            ☰
          </button>
          <div style={{ width: '32px', height: '32px', background: theme.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', borderRadius: '4px', flexShrink: 0 }}>
            CF
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: theme.darkText, letterSpacing: '-0.02em' }}>SiapKerja.id</div>
            <div style={{ fontSize: '10px', color: theme.lightText, fontWeight: 700, letterSpacing: '0.04em' }}>SDGs 8</div>
          </div>
        </div>

        {/* Portal Akses Cepat */}
        {portal && (
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
            <Link href={portal.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: `1px solid ${theme.purple}`, textDecoration: 'none', borderRadius: '6px' }}>
              <span style={{ fontSize: '14px' }}>{portal.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: portal.colorVar, flex: 1 }}>{t(portal.label)}</span>
              <span style={{ color: theme.lightText }}>→</span>
            </Link>
          </div>
        )}

        {/* Profil Pengguna */}
        <Link href="/profil" style={{ padding: isMobile ? '16px' : '14px 16px', borderBottom: `1px solid ${theme.border}`, textDecoration: 'none', display: 'block', backgroundColor: theme.bgLight }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} style={{ width: isMobile ? '44px' : '36px', height: isMobile ? '44px' : '36px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${theme.border}` }} alt="Avatar" />
              ) : (
                <div style={{ width: isMobile ? '44px' : '36px', height: isMobile ? '44px' : '36px', borderRadius: '50%', background: theme.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: isMobile ? '16px' : '14px' }}>{initials}</div>
              )}
              <div style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', border: `2px solid ${theme.bgLight}` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '9px', color: theme.lightText, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>{t('Profil')}</div>
              <div style={{ fontWeight: 700, fontSize: isMobile ? '15px' : '13px', color: theme.darkText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'User'}</div>
              <span style={{ fontSize: '9px', padding: '2px 6px', background: roleLabel.bg, color: roleLabel.color, fontWeight: 700, borderRadius: '4px' }}>{t(roleLabel.text)}</span>
            </div>
          </div>
        </Link>

        {/* 2. MENU NAVIGASI DENGAN EFEK HOVER MODERN */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: theme.lightText, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>{t('Navigasi Utama')}</div>

          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ backgroundColor: active ? 'rgba(0,0,0,0)' : theme.hoverBg, x: active ? 0 : 4 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: isMobile ? '14px 16px' : '10px 14px',
                    background: active ? 'rgba(86, 36, 208, 0.08)' : 'rgba(0,0,0,0)',
                    color: active ? theme.purple : theme.darkText,
                    fontWeight: active ? 700 : 500,
                    fontSize: isMobile ? '15px' : '13px',
                    borderRadius: '8px',
                    position: 'relative',
                    transition: 'color 0.2s ease, background-color 0.2s ease'
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      style={{ position: 'absolute', left: 0, top: '10%', bottom: '10%', width: '4px', backgroundColor: theme.purple, borderRadius: '0 4px 4px 0' }}
                    />
                  )}

                  <span style={{ fontSize: isMobile ? '22px' : '18px', width: '28px', textAlign: 'center', opacity: active ? 1 : 0.6, transition: 'opacity 0.2s ease' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{t(item.label)}</span>

                  {item.href === '/notifikasi' && unreadCount > 0 && (
                    <span style={{ background: '#EF4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '12px' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bagian Bawah / Footer */}
        <div style={{ padding: isMobile ? '12px 16px 28px' : '16px', borderTop: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: theme.bgLight }}>
          <Link href="/pengaturan" style={{ textDecoration: 'none' }}>
            <motion.div whileHover={{ backgroundColor: theme.border }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: isMobile ? '14px 16px' : '10px 14px', color: theme.darkText, fontSize: isMobile ? '15px' : '13px', fontWeight: 600, borderRadius: '8px', transition: 'background-color 0.2s ease' }}>
              <span style={{ fontSize: isMobile ? '20px' : '16px' }}>⚙️</span> Pengaturan
            </motion.div>
          </Link>
          <motion.button
            whileHover={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
            onClick={handleLogout}
            style={{ width: '100%', padding: isMobile ? '14px 16px' : '10px 14px', border: 'none', background: 'transparent', color: '#DC2626', fontSize: isMobile ? '15px' : '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'background-color 0.2s ease' }}
          >
            <span style={{ fontSize: isMobile ? '20px' : '16px' }}>🚪</span> Keluar
          </motion.button>
        </div>
      </aside>
    </>
  );
}