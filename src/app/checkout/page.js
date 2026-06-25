'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < bp);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, [bp]);
  return m;
}

function CheckoutContent() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loaded } = useUser();

  const type = searchParams.get('type'); // 'training' | 'mentoring'
  const refId = searchParams.get('refId'); // training.id ATAU mentor_bookings.id

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user && type && refId) fetchItem(); }, [user, type, refId]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      if (type === 'training') {
        const { data, error } = await supabase.from('trainings').select('*').eq('id', refId).single();
        if (error) throw error;
        setItem({
          title: data.title,
          subtitle: data.instructor ? `Instruktur: ${data.instructor}` : 'Pelatihan',
          amount: Number(data.price || 0),
          thumbnail: data.thumbnail_url,
        });
      } else if (type === 'mentoring') {
        const { data, error } = await supabase
          .from('mentor_bookings')
          .select('*, mentors(full_name, avatar_url)')
          .eq('id', refId)
          .single();
        if (error) throw error;
        setItem({
          title: `Sesi Mentoring — ${data.mentors?.full_name || 'Mentor'}`,
          subtitle: `${data.topic} • ${new Date(data.booking_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${data.booking_time}`,
          amount: Number(data.total_price || 0),
          thumbnail: data.mentors?.avatar_url,
        });
      } else {
        setError('Item pembayaran tidak valid.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat detail item. Pastikan link checkout valid.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (n) => 'Rp ' + (Number(n || 0)).toLocaleString('id-ID');

  const handleBayar = async () => {
    setPaying(true);
    setError('');
    try {
      // 1. Insert record payment — simulasi langsung berstatus "success"
      const { data: payment, error: payError } = await supabase
        .from('payments')
        .insert([{
          user_id: user.id,
          item_type: type,
          item_id: Number(refId),
          amount: item.amount,
          status: 'success',
          payment_method: 'simulasi',
          paid_at: new Date().toISOString(),
        }])
        .select('*')
        .single();
      if (payError) throw payError;

      // 2. Efek samping sesuai tipe item
      if (type === 'training') {
        const { error: enrollError } = await supabase
          .from('user_trainings')
          .insert([{ user_id: user.id, training_id: Number(refId), progress: 0 }]);
        if (enrollError) throw enrollError;
      }
      // Untuk mentoring: booking sudah dibuat sebelumnya dengan status "Menunggu"
      // dan TIDAK diubah otomatis — mentor tetap perlu konfirmasi manual.

      setDone(true);
    } catch (err) {
      console.error(err);
      setError('Pembayaran gagal diproses. Coba lagi.');
    } finally {
      setPaying(false);
    }
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, padding: isMobile ? '60px 12px 80px' : '32px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>

        <div style={{ width: '100%', maxWidth: '480px' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Checkout</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Simulasi pembayaran — belum terhubung payment gateway sungguhan</p>
          </motion.div>

          {loading ? (
            <div className="skeleton" style={{ height: '260px', borderRadius: '14px' }} />
          ) : error && !item ? (
            <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</p>
            </div>
          ) : done ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '40px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>✅</div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Pembayaran Berhasil!</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                {type === 'training'
                  ? 'Kamu sudah terdaftar di pelatihan ini. Selamat belajar!'
                  : 'Booking sesi mentoring berhasil dibuat. Mentor akan segera mengonfirmasi jadwalmu.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={() => router.push('/pembayaran')}
                  style={{ padding: '10px 18px', borderRadius: '9px', border: '1px solid var(--border-default)', background: 'var(--surface-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  Lihat Riwayat
                </button>
                <button onClick={() => router.push(type === 'training' ? '/pelatihan' : '/mentoring')}
                  style={{ padding: '10px 18px', borderRadius: '9px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  {type === 'training' ? 'Mulai Belajar' : 'Kembali ke Mentoring'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, overflow: 'hidden' }}>
                    {item.thumbnail ? <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (type === 'training' ? '📘' : '🧑‍🏫')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{item.subtitle}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Subtotal</span>
                  <span>{formatRupiah(item.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <span>Biaya admin</span>
                  <span>Rp 0</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-brand)' }}>{formatRupiah(item.amount)}</span>
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '12.5px', marginBottom: '14px' }}>{error}</div>
                )}

                <div style={{ padding: '10px 12px', background: 'var(--surface-secondary)', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  ℹ️ Ini adalah simulasi pembayaran untuk keperluan demo. Tidak ada transaksi uang sungguhan yang terjadi.
                </div>

                <button onClick={handleBayar} disabled={paying}
                  style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: paying ? '#93C5FD' : 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: paying ? 'wait' : 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  {paying ? 'Memproses...' : `Bayar Sekarang — ${formatRupiah(item.amount)}`}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

// useSearchParams() wajib dibungkus <Suspense> di Next.js App Router,
// kalau tidak build di Vercel akan gagal (error yang sama seperti yang
// pernah terjadi sebelumnya di project ini).
export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
