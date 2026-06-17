'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function FooterLink({ href, onClick, children }) {
  const [hover, setHover] = useState(false);
  const style = {
    color: hover ? '#FFFFFF' : '#94A3B8',
    fontSize: '13px', textDecoration: 'none', cursor: 'pointer',
    display: 'block', padding: '5px 0', transition: 'color 0.15s', lineHeight: 1.4,
  };
  const handlers = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };
  if (onClick) return <span style={style} onClick={onClick} {...handlers}>{children}</span>;
  return <Link href={href || '#'} style={style} {...handlers}>{children}</Link>;
}

export default function Footer() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('training_categories').select('name').limit(8);
      if (data) setCategories(data.map(c => c.name).filter(Boolean));
    })();
  }, []);

  const headerStyle = { fontSize: '14px', fontWeight: 700, color: '#F8FAFC', marginBottom: '12px' };
  const colStyle = { minWidth: 0 };

  return (
    <footer style={{ background: '#1E293B', color: '#94A3B8', fontFamily: 'var(--font-sans)', marginTop: '40px' }}>

      {/* Mega footer */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px 32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', marginBottom: '28px', letterSpacing: '-0.01em' }}>
          Jelajahi skill dan sertifikasi teratas
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px' }}>

          {/* Kategori Pelatihan (dari database) */}
          <div style={colStyle}>
            <div style={headerStyle}>Kategori Pelatihan</div>
            {categories.length === 0 ? (
              <FooterLink onClick={() => router.push('/pelatihan')}>Lihat semua pelatihan</FooterLink>
            ) : (
              <>
                {categories.map((c) => (
                  <FooterLink key={c} onClick={() => router.push('/pelatihan')}>{c}</FooterLink>
                ))}
                <FooterLink onClick={() => router.push('/pelatihan')}>Lihat semua kategori</FooterLink>
              </>
            )}
          </div>

          {/* Fitur CareerForge */}
          <div style={colStyle}>
            <div style={headerStyle}>Fitur CareerForge</div>
            <FooterLink href="/lowongan">Lowongan Kerja</FooterLink>
            <FooterLink href="/lamaran">Lamaran Saya</FooterLink>
            <FooterLink href="/mentoring">Mentoring</FooterLink>
            <FooterLink href="/interview">Interview AI</FooterLink>
            <FooterLink href="/cv-builder">CV Builder</FooterLink>
            <FooterLink href="/sertifikat">Sertifikat</FooterLink>
          </div>

          {/* Perusahaan */}
          <div style={colStyle}>
            <div style={headerStyle}>Perusahaan</div>
            <FooterLink href="#">Tentang Kami</FooterLink>
            <FooterLink href="#">Karier</FooterLink>
            <FooterLink href="#">Hubungi Kami</FooterLink>
            <FooterLink href="#">Blog</FooterLink>
            <FooterLink href="#">Bantuan & Dukungan</FooterLink>
          </div>

          {/* Legal & Aksesibilitas */}
          <div style={colStyle}>
            <div style={headerStyle}>Legal & Aksesibilitas</div>
            <FooterLink href="#">Kebijakan Privasi</FooterLink>
            <FooterLink href="#">Syarat & Ketentuan</FooterLink>
            <FooterLink href="#">Pernyataan Aksesibilitas</FooterLink>
            <FooterLink href="#">Peta Situs</FooterLink>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0F172A' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>CF</div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>CareerForge</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B' }}>© {new Date().getFullYear()} CareerForge — SDGs 8</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>🌐 Bahasa Indonesia</span>
        </div>
      </div>
    </footer>
  );
}