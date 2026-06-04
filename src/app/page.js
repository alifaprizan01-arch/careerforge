'use client';

import React from 'react';

export default function DashboardHome() {
  // Fungsi dummy untuk menangani klik tombol (sesuai onclick di HTML aslimu)
  const sendPrompt = (message) => {
    console.log("Sending prompt:", message);
    alert(`Prompt terkirim: "${message}"`);
  };

  return (
    <>
      {/* Integrasi CSS internal bawaan dari template asli */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght=400;500;600&family=Sora:wght=500;600&display=swap');
        
        /* CSS Variables cadangan jika global theme belum terpasang */
        :root {
          --color-background-tertiary: #f8f9fa;
          --color-background-primary: #ffffff;
          --color-background-secondary: #f1f3f5;
          --color-border-tertiary: #e9ecef;
          --color-border-secondary: #dee2e6;
          --color-text-primary: #212529;
          --color-text-secondary: #6c757d;
        }

        .cf-wrap { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--color-background-tertiary); min-height: 100vh; padding: 0; }
        .cf-sidebar { position: fixed; left: 0; top: 0; height: 100%; width: 64px; background: #1A3A2F; display: flex; flex-direction: column; align-items: center; padding: 20px 0; gap: 8px; z-index: 10; }
        .cf-logo { width: 36px; height: 36px; background: #2ECC8F; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-weight: 600; color: #fff; font-size: 14px; margin-bottom: 16px; }
        .cf-nav-item { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.4); transition: all 0.15s; }
        .cf-nav-item:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); }
        .cf-nav-item.active { background: #2ECC8F; color: #fff; }
        .cf-nav-item i { font-size: 20px; }
        .cf-main { margin-left: 64px; padding: 24px 28px; }
        .cf-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .cf-greeting { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 600; color: var(--color-text-primary); }
        .cf-greeting span { color: #0F6E56; }
        .cf-topbar-right { display: flex; align-items: center; gap: 12px; }
        .cf-notif { width: 36px; height: 36px; border-radius: 8px; border: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); position: relative; }
        .cf-notif-dot { position: absolute; top: 7px; right: 8px; width: 7px; height: 7px; background: #D85A30; border-radius: 50%; }
        .cf-avatar { width: 36px; height: 36px; border-radius: 50%; background: #1D9E75; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; color: #fff; cursor: pointer; }
        .cf-hero-card { background: linear-gradient(120deg, #0F4A35 0%, #1D9E75 100%); border-radius: 16px; padding: 24px 28px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
        .cf-hero-card::before { content: ''; position: absolute; right: -30px; top: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .cf-hero-card::after { content: ''; position: absolute; right: 60px; bottom: -50px; width: 120px; height: 120px; background: rgba(255,255,255,0.04); border-radius: 50%; }
        .cf-hero-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; display: inline-block; margin-bottom: 10px; }
        .cf-hero-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 600; color: #fff; margin: 0 0 6px; }
        .cf-hero-sub { font-size: 13px; color: rgba(255,255,255,0.7); margin: 0 0 16px; }
        .cf-hero-btn { background: #fff; color: #0F6E56; font-size: 13px; font-weight: 600; padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: 'Plus Jakarta Sans', sans-serif; }
        .cf-hero-progress { text-align: right; z-index: 1; }
        .cf-progress-ring { width: 80px; height: 80px; }
        .cf-progress-label { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 6px; }
        .cf-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .cf-stat-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: 12px; padding: 16px; }
        .cf-stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        .cf-stat-icon.green { background: #E1F5EE; color: #0F6E56; }
        .cf-stat-icon.amber { background: #FAEEDA; color: #854F0B; }
        .cf-stat-icon.blue { background: #E6F1FB; color: #185FA5; }
        .cf-stat-icon i { font-size: 18px; }
        .cf-stat-val { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 600; color: var(--color-text-primary); }
        .cf-stat-lbl { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
        .cf-section-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 12px; display: flex; align-items: center; justify-content: space-between; }
        .cf-section-link { font-size: 12px; font-weight: 500; color: #1D9E75; cursor: pointer; display: flex; align-items: center; gap: 4px; }
        .cf-jobs-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .cf-job-card { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color 0.15s; }
        .cf-job-card:hover { border-color: var(--color-border-secondary); }
        .cf-company-logo { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
        .cf-logo-a { background: #E1F5EE; color: #0F6E56; }
        .cf-logo-b { background: #E6F1FB; color: #185FA5; }
        .cf-logo-c { background: #FAEEDA; color: #854F0B; }
        .cf-job-info { flex: 1; }
        .cf-job-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 2px; }
        .cf-job-company { font-size: 12px; color: var(--color-text-secondary); margin: 0; }
        .cf-job-meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .cf-tag { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
        .cf-tag-green { background: #E1F5EE; color: #085041; }
        .cf-tag-blue { background: #E6F1FB; color: #0C447C; }
        .cf-tag-gray { background: var(--color-background-secondary); color: var(--color-text-secondary); }
        .cf-job-match { font-size: 11px; font-weight: 600; color: #1D9E75; background: #E1F5EE; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
        .cf-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cf-section-box { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: 12px; padding: 16px; }
        .cf-train-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 0.5px solid var(--color-border-tertiary); cursor: pointer; }
        .cf-train-item:last-child { border-bottom: none; }
        .cf-train-icon { width: 32px; height: 32px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .cf-train-name { font-size: 12px; font-weight: 500; color: var(--color-text-primary); flex: 1; }
        .cf-train-prog { font-size: 11px; color: var(--color-text-secondary); }
        .cf-prog-bar { height: 3px; background: var(--color-background-secondary); border-radius: 2px; margin-top: 4px; overflow: hidden; }
        .cf-prog-fill { height: 100%; background: #1D9E75; border-radius: 2px; }
        .cf-mentor-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 0.5px solid var(--color-border-tertiary); cursor: pointer; }
        .cf-mentor-item:last-child { border-bottom: none; }
        .cf-mentor-av { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; flex-shrink: 0; }
        .cf-mentor-name { font-size: 12px; font-weight: 500; color: var(--color-text-primary); }
        .cf-mentor-role { font-size: 11px; color: var(--color-text-secondary); }
        .cf-mentor-rate { font-size: 11px; font-weight: 600; color: var(--color-text-primary); margin-left: auto; }
        .cf-stars { color: #EF9F27; font-size: 11px; }
      `}</style>

      <div className="cf-wrap">
        <nav className="cf-sidebar" aria-label="Navigasi utama">
          <div className="cf-logo">CF</div>
          <div className="cf-nav-item active" title="Dashboard"><i className="ti ti-layout-dashboard" aria-hidden="true"></i></div>
          <div className="cf-nav-item" title="Cari Kerja"><i className="ti ti-briefcase" aria-hidden="true"></i></div>
          <div className="cf-nav-item" title="Pelatihan"><i className="ti ti-school" aria-hidden="true"></i></div>
          <div className="cf-nav-item" title="Sertifikasi"><i className="ti ti-certificate" aria-hidden="true"></i></div>
          <div className="cf-nav-item" title="Simulasi Interview"><i className="ti ti-microphone" aria-hidden="true"></i></div>
          <div className="cf-nav-item" title="Mentoring"><i className="ti ti-users" aria-hidden="true"></i></div>
          <div style={{ marginTop: 'auto' }}></div>
          <div className="cf-nav-item" title="Profil"><i className="ti ti-user-circle" aria-hidden="true"></i></div>
        </nav>

        <main className="cf-main">
          <div className="cf-topbar">
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Selamat datang kembali,</div>
              <div className="cf-greeting">Hai, <span>Andi Pratama!</span> <span role="img" aria-label="waving-hand">👋</span></div>
            </div>
            <div className="cf-topbar-right">
              <div className="cf-notif" aria-label="Notifikasi">
                <i className="ti ti-bell" style={{ fontSize: '18px' }} aria-hidden="true"></i>
                <span className="cf-notif-dot"></span>
              </div>
              <div className="cf-avatar" aria-label="Profil pengguna">AP</div>
            </div>
          </div>

          <div className="cf-hero-card">
            <div>
              <div className="cf-hero-tag">SDGs 8 — Pekerjaan Layak</div>
              <p className="cf-hero-title">Tingkatkan kariermu hari ini</p>
              <p class="cf-hero-sub">5 lowongan baru sesuai profilmu tersedia</p>
              <button className="cf-hero-btn" onClick={() => sendPrompt('Tampilkan lowongan pekerjaan yang sesuai dengan profil saya di CareerForge')}>
                <i className="ti ti-search" aria-hidden="true"></i> Cari Lowongan
              </button>
            </div>
            <div className="cf-hero-progress">
              <svg className="cf-progress-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#2ECC8F" stroke-width="6"
                  strokeDasharray="201" strokeDashoffset="44"
                  strokeLinecap="round" transform="rotate(-90 40 40)" />
                <text x="40" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="600" fontFamily="Sora, sans-serif">78%</text>
                <text x="40" y="50" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="Plus Jakarta Sans, sans-serif">Profil lengkap</text>
              </svg>
              <div className="cf-progress-label">Lengkapi profil</div>
            </div>
          </div>

          <div className="cf-stats-grid">
            <div className="cf-stat-card">
              <div className="cf-stat-icon green"><i className="ti ti-briefcase" aria-hidden="true"></i></div>
              <div className="cf-stat-val">4/6</div>
              <div className="cf-stat-lbl">Program Aktif</div>
            </div>
            <div className="cf-stat-card">
              <div className="cf-stat-icon amber"><i className="ti ti-certificate" aria-hidden="true"></i></div>
              <div className="cf-stat-val">2</div>
              <div className="cf-stat-lbl">Sertifikat Diperoleh</div>
            </div>
            <div className="cf-stat-card">
              <div className="cf-stat-icon blue"><i className="ti ti-history" aria-hidden="true"></i></div>
              <div className="cf-stat-val">1 Thn</div>
              <div className="cf-stat-lbl">Pengalaman Kerja</div>
            </div>
          </div>

          <div className="cf-section-title">
            Rekomendasi Lowongan
            <span className="cf-section-link">Lihat semua <i className="ti ti-arrow-right" aria-hidden="true"></i></span>
          </div>
          <div className="cf-jobs-list">
            <div className="cf-job-card">
              <div className="cf-company-logo cf-logo-a">PT</div>
              <div className="cf-job-info">
                <p className="cf-job-title">Junior Data Analyst</p>
                <p className="cf-job-company">PT Anasif Digital · Yogyakarta</p>
                <div className="cf-job-meta">
                  <span className="cf-tag cf-tag-green">Full Time</span>
                  <span className="cf-tag cf-tag-blue">Entry Level</span>
                  <span className="cf-tag cf-tag-gray">Rp 4–6 jt</span>
                </div>
              </div>
              <span className="cf-job-match">92% cocok</span>
            </div>
            <div className="cf-job-card">
              <div className="cf-company-logo cf-logo-b">DM</div>
              <div className="cf-job-info">
                <p className="cf-job-title">Digital Marketing Staff</p>
                <p className="cf-job-company">PT Inasif Papyrus · Bandung</p>
                <div className="cf-job-meta">
                  <span className="cf-tag cf-tag-green">Full Time</span>
                  <span className="cf-tag cf-tag-gray">Rp 3–5 jt</span>
                </div>
              </div>
              <span className="cf-job-match">85% cocok</span>
            </div>
            <div className="cf-job-card">
              <div className="cf-company-logo cf-logo-c">UI</div>
              <div className="cf-job-info">
                <p className="cf-job-title">UI/UX Designer</p>
                <p className="cf-job-company">PT Data Solusi · Jakarta</p>
                <div className="cf-job-meta">
                  <span className="cf-tag cf-tag-green">Remote</span>
                  <span className="cf-tag cf-tag-blue">Mid Level</span>
                </div>
              </div>
              <span className="cf-job-match">78% cocok</span>
            </div>
          </div>

          <div className="cf-two-col">
            <div>
              <div className="cf-section-title">
                Pelatihan Aktif
                <span className="cf-section-link">Semua <i className="ti ti-arrow-right" aria-hidden="true"></i></span>
              </div>
              <div className="cf-section-box">
                <div className="cf-train-item">
                  <div className="cf-train-icon" style={{ background: '#E6F1FB' }}><i className="ti ti-chart-bar" style={{ color: '#185FA5', fontSize: '15px' }} aria-hidden="true"></i></div>
                  <div style={{ flex: 1 }}>
                    <div className="cf-train-name">Google Data Analytics</div>
                    <div className="cf-prog-bar"><div className="cf-prog-fill" style={{ width: '70%' }}></div></div>
                    <div className="cf-train-prog">3 hari tersisa</div>
                  </div>
                </div>
                <div className="cf-train-item">
                  <div className="cf-train-icon" style={{ background: '#FAEEDA' }}><i className="ti ti-megaphone" style={{ color: '#854F0B', fontSize: '15px' }} aria-hidden="true"></i></div>
                  <div style={{ flex: 1 }}>
                    <div className="cf-train-name">Belajar Dasar Digital Marketing</div>
                    <div className="cf-prog-bar"><div className="cf-prog-fill" style={{ width: '40%' }}></div></div>
                    <div className="cf-train-prog">Lanjutan modul 3</div>
                  </div>
                </div>
                <div className="cf-train-item">
                  <div className="cf-train-icon" style={{ background: '#E1F5EE' }}><i className="ti ti-code" style={{ color: '#0F6E56', fontSize: '15px' }} aria-hidden="true"></i></div>
                  <div style={{ flex: 1 }}>
                    <div className="cf-train-name">Web Development Basics</div>
                    <div className="cf-prog-bar"><div className="cf-prog-fill" style={{ width: '20%' }}></div></div>
                    <div className="cf-train-prog">Baru dimulai</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="cf-section-title">
                Mentor Tersedia
                <span className="cf-section-link">Semua <i className="ti ti-arrow-right" aria-hidden="true"></i></span>
              </div>
              <div className="cf-section-box">
                <div className="cf-mentor-item">
                  <div className="cf-mentor-av" style={{ background: '#E1F5EE', color: '#085041' }}>BS</div>
                  <div>
                    <div className="cf-mentor-name">Budi Santoso</div>
                    <div className="cf-mentor-role">Data Analyst · <span className="cf-stars">★</span> 4.9</div>
                  </div>
                  <div className="cf-mentor-rate">Book</div>
                </div>
                <div className="cf-mentor-item">
                  <div className="cf-mentor-av" style={{ background: '#E6F1FB', color: '#0C447C' }}>DL</div>
                  <div>
                    <div className="cf-mentor-name">Dewi Lestari</div>
                    <div className="cf-mentor-role">Career Coach · <span className="cf-stars">★</span> 4.8</div>
                  </div>
                  <div className="cf-mentor-rate">Book</div>
                </div>
                <div className="cf-mentor-item">
                  <div className="cf-mentor-av" style={{ background: '#FAEEDA', color: '#633806' }}>AR</div>
                  <div>
                    <div className="cf-mentor-name">Andi Rahmadi</div>
                    <div className="cf-mentor-role">Independent · <span className="cf-stars">★</span> 4.7</div>
                  </div>
                  <div className="cf-mentor-rate">Book</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => sendPrompt('Saya ingin mencoba simulasi interview di CareerForge')}>
            <div style={{ width: '40px', height: '40px', background: '#E1F5EE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
              <i className="ti ti-microphone" style={{ fontSize: '20px', color: '#0F6E56' }} aria-hidden="true"></i>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>Simulasi Interview Tersedia</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Latih kemampuan wawancara dengan AI, dapat penilaian otomatis</div>
            </div>
            <i className="ti ti-arrow-right" style={{ color: 'var(--color-text-secondary)', fontSize: '18px' }} aria-hidden="true"></i>
          </div>

          <div style={{ marginTop: '24px', paddingBottom: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)' }}>CareerForge · Kelompok 5C · SDGs 8 — Pekerjaan Layak & Pertumbuhan Ekonomi</div>
        </main>
      </div>
    </>
  );
}