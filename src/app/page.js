'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan KEY dari env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Hanya membuat client jika URL dan KEY sudah terbaca dengan benar
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function formatRp(n) { return 'Rp' + n.toLocaleString('id-ID'); }

export default function Home() {
  const [filter, setFilter] = useState('semua');
  const [asal, setAsal] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const sendPrompt = (msg) => {
    console.log("Prompt sent:", msg);
    alert("Mengirim permintaan: " + msg);
  };

  useEffect(() => {
    async function fetchTrayek() {
      // Validasi: Jika supabase masih null, hentikan proses agar tidak memicu error (.from)
      if (!supabase) {
        console.error("Supabase gagal diinisialisasi. Periksa file .env.local Anda.");
        setLoading(false);
        return;
      }

      try {
        const { data: trayek, error } = await supabase.from('trayek').select('*');
        if (error) throw error;
        setData(trayek || []);
      } catch (err) {
        console.error("Gagal mengambil data dari Supabase:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTrayek();
  }, []);

  const filtered = data.filter(d => {
    const cocokFilter = filter === 'semua' || d.jenis === filter;
    const cocokAsal = !asal || d.asal?.toLowerCase().includes(asal.toLowerCase());
    const cocokTujuan = !tujuan || d.tujuan?.toLowerCase().includes(tujuan.toLowerCase());
    return cocokFilter && cocokAsal && cocokTujuan;
  });

  function swap() { setAsal(tujuan); setTujuan(asal); }

  return (
    <div className="cf-wrap" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar - Tampilan Baru Lebih Modern */}
      <nav className="cf-sidebar" style={{ width: '80px', flexShrink: 0, background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '16px' }}>
        <div className="cf-logo" style={{ width: '45px', height: '45px', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontWeight: '800', fontSize: '18px', marginBottom: '12px' }}>CF</div>
        <div className="cf-nav-item active" style={{ color: '#10B981' }} title="Dashboard"><i className="ti ti-layout-dashboard" style={{ fontSize: '24px' }}></i></div>
        <div className="cf-nav-item" style={{ color: '#64748B' }} title="Cari Kerja"><i className="ti ti-briefcase" style={{ fontSize: '24px' }}></i></div>
        <div className="cf-nav-item" style={{ color: '#64748B' }} title="Pelatihan"><i className="ti ti-school" style={{ fontSize: '24px' }}></i></div>
        <div className="cf-nav-item" style={{ color: '#64748B' }} title="Simulasi Interview"><i className="ti ti-microphone" style={{ fontSize: '24px' }}></i></div>
        <div style={{ marginTop: 'auto' }}></div>
        <div className="cf-nav-item" style={{ color: '#64748B' }} title="Profil"><i className="ti ti-user-circle" style={{ fontSize: '24px' }}></i></div>
      </nav>

      <main className="cf-main" style={{ flex: 1, minWidth: 0, padding: '32px', overflowY: 'auto' }}>
        {/* Topbar */}
        <div className="cf-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '4px' }}>Selamat datang kembali,</div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', fontFamily: "'Sora', sans-serif" }}>Hai, Andi Pratama! 👋</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '44px', height: '44px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
              <i className="ti ti-bell" style={{ fontSize: '20px' }}></i>
              <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
            </div>
            <div style={{ width: '44px', height: '44px', background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#1E293B', border: '1px solid #E2E8F0' }}>AP</div>
          </div>
        </div>

        {/* Search Bar - Lebih Luas */}
        <div className="cf-search-bar" style={{ display: 'flex', gap: '12px', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
            <i className="ti ti-map-pin" style={{ color: '#94A3B8' }}></i>
            <input type="text" placeholder="Lokasi asal (contoh: Jakarta)" value={asal} onChange={(e) => setAsal(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '14px' }} />
          </div>
          <button onClick={swap} style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', width: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-arrows-exchange" style={{ fontSize: '20px' }}></i></button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '10px 16px', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
            <i className="ti ti-briefcase" style={{ color: '#94A3B8' }}></i>
            <input type="text" placeholder="Pekerjaan tujuan (contoh: UI/UX)" value={tujuan} onChange={(e) => setTujuan(e.target.value)} style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Kolom Kiri: Hero & Lowongan */}
          <section>
            <div style={{ background: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)', borderRadius: '24px', padding: '32px', color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', marginBottom: '16px' }}>SDGs 8 — Pekerjaan Layak</div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontFamily: "'Sora', sans-serif" }}>Tingkatkan kariermu hari ini</h2>
                <p style={{ margin: '0 0 24px 0', opacity: 0.9, fontSize: '15px' }}>Dapatkan rekomendasi pekerjaan berbasis AI yang sesuai profilmu.</p>
                <button onClick={() => sendPrompt('Cari lowongan')} style={{ background: 'white', color: '#065F46', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Mulai Cari Lowongan</button>
              </div>
              <i className="ti ti-rocket" style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '160px', opacity: 0.1 }}></i>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: '700', fontSize: '18px' }}>Rekomendasi Lowongan</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['semua', 'Full Time', 'Remote'].map((t) => (
                  <button key={t} onClick={() => setFilter(t)} style={{ padding: '6px 16px', borderRadius: '100px', border: 'none', background: filter === t ? '#10B981' : '#E2E8F0', color: filter === t ? 'white' : '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Memuat data dari Supabase...</div>
              ) : filtered.length > 0 ? (
                filtered.map((job) => (
                  <div key={job.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #F1F5F9', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}>
                    <div style={{ width: '56px', height: '56px', background: '#F8FAFC', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#475569', border: '1px solid #E2E8F0' }}>{job.asal?.substring(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '700' }}>{job.tujuan}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>{job.asal} • <span style={{ color: '#10B981', fontWeight: '600' }}>{job.jenis}</span></p>
                    </div>
                    <button style={{ background: '#ECFDF5', color: '#059669', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>Lamar</button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                  <i className="ti ti-search" style={{ fontSize: '48px', color: '#CBD5E1', marginBottom: '16px', display: 'block' }}></i>
                  <p style={{ color: '#64748B', margin: 0 }}>Tidak ada lowongan yang sesuai kriteria.</p>
                </div>
              )}
            </div>
          </section>

          {/* Kolom Kanan: Statistik & Info Lainnya */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Aktivitas Karier</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ color: '#10B981', fontSize: '20px', fontWeight: '700' }}>4/6</div>
                  <div style={{ fontSize: '11px', color: '#059669' }}>Program Aktif</div>
                </div>
                <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                  <div style={{ color: '#F59E0B', fontSize: '20px', fontWeight: '700' }}>12</div>
                  <div style={{ fontSize: '11px', color: '#B45309' }}>Sertifikat</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Pelatihan Sedang Jalan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-brand-google"></i></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Google Data Analytics</div>
                    <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '70%', height: '100%', background: '#4F46E5' }}></div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', background: '#ECFDF5', color: '#10B981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-code"></i></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Frontend Web Dev</div>
                    <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '40%', height: '100%', background: '#10B981' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulasi Interview AI */}
            <div 
              onClick={() => sendPrompt('Simulasi Interview AI')}
              style={{ background: '#1E293B', padding: '24px', borderRadius: '24px', color: 'white', cursor: 'pointer', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            >
              <div style={{ width: '52px', height: '52px', background: '#10B981', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <i className="ti ti-cpu" style={{ fontSize: '24px' }}></i>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700' }}>Simulasi Interview AI</h4>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Latih kemampuan wawancara Anda dan dapatkan feedback instan.</p>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', padding: '24px 0', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>CareerForge • Kelompok 5C • SDGs 8 — Pekerjaan Layak & Pertumbuhan Ekonomi</p>
        </div>
      </main>
    </div>
  );
}