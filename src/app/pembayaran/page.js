'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function RiwayatPembayaranPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user, loaded } = useUser();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) fetchPayments(); }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data: pays, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Ambil detail item terkait secara terpisah, karena item_type/item_id
      // bersifat polimorfik (tidak bisa di-join langsung lewat foreign key tunggal).
      const trainingIds = pays.filter(p => p.item_type === 'training').map(p => p.item_id);
      const mentoringIds = pays.filter(p => p.item_type === 'mentoring').map(p => p.item_id);

      const [{ data: trainings }, { data: bookings }] = await Promise.all([
        trainingIds.length
          ? supabase.from('trainings').select('id, title, thumbnail_url').in('id', trainingIds)
          : Promise.resolve({ data: [] }),
        mentoringIds.length
          ? supabase.from('mentor_bookings').select('id, topic, booking_date, mentors(full_name)').in('id', mentoringIds)
          : Promise.resolve({ data: [] }),
      ]);

      const trainingMap = Object.fromEntries((trainings || []).map(t => [t.id, t]));
      const bookingMap = Object.fromEntries((bookings || []).map(b => [b.id, b]));

      const enriched = pays.map(p => {
        if (p.item_type === 'training') {
          const t = trainingMap[p.item_id];
          return { ...p, title: t?.title || 'Pelatihan', subtitle: 'Pelatihan', icon: '📘', thumbnail: t?.thumbnail_url };
        }
        const b = bookingMap[p.item_id];
        return { ...p, title: b ? `Mentoring — ${b.mentors?.full_name || 'Mentor'}` : 'Sesi Mentoring', subtitle: b?.topic || 'Mentoring', icon: '🧑‍🏫' };
      });

      setPayments(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (n) => 'Rp ' + (Number(n || 0)).toLocaleString('id-ID');
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusBadge = (s) => {
    const map = { success: 'badge-green', pending: 'badge-yellow', failed: 'badge-red' };
    return map[s] || 'badge-gray';
  };
  const statusLabel = (s) => {
    const map = { success: 'Berhasil', pending: 'Menunggu', failed: 'Gagal' };
    return map[s] || s;
  };

  const totalSpent = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width, 240px)', flex: 1, padding: isMobile ? '60px 12px 80px' : '32px', minWidth: 0 }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '14px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Riwayat Pembayaran</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Semua transaksi pelatihan & mentoring kamu</p>
          </div>
          <div style={{ background: 'var(--surface-primary)', borderRadius: '10px', border: '1px solid var(--border-default)', padding: '12px 18px', textAlign: 'right', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Pengeluaran</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-brand)' }}>{formatRupiah(totalSpent)}</div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px' }} />)}
          </div>
        ) : payments.length === 0 ? (
          <div style={{ background: 'var(--surface-primary)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: isMobile ? '40px 20px' : '70px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '14px', opacity: 0.4 }}>🧾</div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Belum ada riwayat pembayaran</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Transaksi pelatihan & mentoring berbayar akan muncul di sini.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {payments.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'var(--surface-primary)', borderRadius: '12px', border: '1px solid var(--border-default)', padding: isMobile ? '14px' : '16px 20px', boxShadow: 'var(--shadow-xs)', display: 'flex', alignItems: 'center', gap: '14px' }}>

                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
                  {p.thumbnail ? <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{formatDate(p.created_at)}</p>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{formatRupiah(p.amount)}</div>
                  <span className={`badge ${statusBadge(p.status)}`} style={{ marginTop: '4px', display: 'inline-block' }}>{statusLabel(p.status)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
