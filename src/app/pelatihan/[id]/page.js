'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import { useUser } from '../../../lib/userContext';
import { useTheme } from '../../../lib/themeContext';

function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < bp);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return m;
}

export default function PelatihanDetailPage({ params }) {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const { id } = use(params);
  const trainingId = parseInt(id);
  const [showModuleList, setShowModuleList] = useState(false);

  const [training, setTraining] = useState(null);
  const [modules, setModules] = useState([]);
  const [userTraining, setUserTraining] = useState(null);
  const [moduleProgress, setModuleProgress] = useState({});
  const [activeModule, setActiveModule] = useState(null);
  const [activeTab, setActiveTab] = useState('video');
  const [quizzes, setQuizzes] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [quizTimeLeft, setQuizTimeLeft] = useState(null);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => {
    if (!user) return;
    if (trainingId) fetchAll();
    else setLoading(false);
  }, [user, trainingId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ data: tr }, { data: mods }, { data: ut }, { data: mp }] = await Promise.all([
        supabase.from('trainings').select('*, training_categories(name)').eq('id', trainingId).single(),
        supabase.from('training_modules').select('*').eq('training_id', trainingId).order('order_index'),
        supabase.from('user_trainings').select('*').eq('user_id', user.id).eq('training_id', trainingId).single(),
        supabase.from('user_module_progress').select('*').eq('user_id', user.id).eq('training_id', trainingId),
      ]);
      setTraining(tr);
      setModules(mods || []);
      setUserTraining(ut);
      const progressMap = {};
      (mp || []).forEach(p => { progressMap[p.module_id] = p; });
      setModuleProgress(progressMap);
      if (mods?.length > 0) {
        const firstIncomplete = mods.find(m => !progressMap[m.id]?.is_completed) || mods[0];
        setActiveModule(firstIncomplete);
        fetchModuleQuizzes(firstIncomplete.id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchModuleQuizzes = async (moduleId) => {
    const [{ data: q }, { data: attempts }] = await Promise.all([
      supabase.from('training_quizzes').select('*').eq('module_id', moduleId).order('order_index'),
      supabase.from('user_quiz_attempts').select('*').eq('user_id', user.id).eq('module_id', moduleId).order('completed_at', { ascending: false }),
    ]);
    setQuizzes(q || []);
    setQuizAttempts(attempts || []);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    if (attempts?.length > 0 && attempts[0].passed) {
      setQuizSubmitted(true);
      setQuizResult(attempts[0]);
    }
  };

  const selectModule = (mod) => {
    setActiveModule(mod);
    fetchModuleQuizzes(mod.id);
  };

  const classifyUrl = (url = '') => {
    const u = (url || '').toLowerCase();
    const isVideo = /youtube\.com|youtu\.be|vimeo\.com|\.mp4(\?|$)/.test(u);
    const isPdf = /\.pdf(\?|$)/.test(u);
    const isPpt = /\.pptx?(\?|$)/.test(u);
    return { isVideo, isPdf, isPpt, hasMaterial: !!url && !isVideo };
  };

  useEffect(() => {
    if (!activeModule) return;
    const { isVideo } = classifyUrl(activeModule.content_url);
    setActiveTab(isVideo ? 'video' : (activeModule.content_url ? 'materi' : 'kuis'));
  }, [activeModule?.id]);

  const markModuleComplete = async (moduleId) => {
    try {
      const { data } = await supabase.from('user_module_progress').upsert({
        user_id: user.id, module_id: moduleId, training_id: trainingId,
        is_completed: true, completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,module_id' }).select().single();
      setModuleProgress(prev => ({ ...prev, [moduleId]: data }));
      // Update overall progress
      const completedCount = Object.values({ ...moduleProgress, [moduleId]: { is_completed: true } }).filter(p => p.is_completed).length;
      const totalModules = modules.length;
      const progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
      await supabase.from('user_trainings').update({ progress, ...(progress >= 100 ? { completed_at: new Date().toISOString() } : {}) }).eq('user_id', user.id).eq('training_id', trainingId);
      setUserTraining(prev => ({ ...prev, progress }));
      setMsg('✓ Modul selesai!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { console.error(e); }
  };

  const submitQuiz = async (force = false) => {
    const _max = activeModule?.quiz_max_attempts || 0;
    if (_max > 0 && quizAttempts.length >= _max && !quizAttempts.some(a => a.passed)) {
      setMsg('Kesempatan mengerjakan kuis sudah habis.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    if (!force && Object.keys(quizAnswers).length < quizzes.length) {
      setMsg('Jawab semua soal terlebih dahulu.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setSubmittingQuiz(true);
    try {
      let correct = 0;
      quizzes.forEach(q => {
        if (quizAnswers[q.id]?.toLowerCase() === q.correct_answer.toLowerCase()) correct++;
      });
      const score = Math.round((correct / quizzes.length) * 100);
      const passed = score >= 70;
      const attemptNumber = (quizAttempts.length || 0) + 1;
      const { data: attempt } = await supabase.from('user_quiz_attempts').insert([{
        user_id: user.id, module_id: activeModule.id, training_id: trainingId,
        answers: quizAnswers, score, passed, attempt_number: attemptNumber,
      }]).select().single();
      setQuizResult(attempt);
      setQuizSubmitted(true);
      setQuizAttempts(prev => [attempt, ...prev]);
      if (passed) {
        await markModuleComplete(activeModule.id);
        setMsg(`🎉 Lulus! Skor: ${score}/100`);
      } else {
        setMsg(`Skor: ${score}/100. Minimal 70 untuk lulus. Coba lagi!`);
      }
      setTimeout(() => setMsg(''), 5000);
    } catch (e) { console.error(e); }
    finally { setSubmittingQuiz(false); }
  };

  const retryQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  // ===== Timer kuis =====
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Mulai / reset timer saat masuk tab kuis
  useEffect(() => {
    const limitMin = activeModule?.quiz_time_limit || 0;
    if (activeTab === 'kuis' && !quizSubmitted && quizzes.length > 0 && limitMin > 0) {
      setQuizTimeLeft(limitMin * 60);
    } else {
      setQuizTimeLeft(null);
    }
  }, [activeTab, activeModule?.id, quizSubmitted, quizzes.length]);

  // Hitung mundur tiap detik; auto-submit saat habis
  useEffect(() => {
    if (quizTimeLeft === null) return;
    if (quizTimeLeft <= 0) { submitQuiz(true); setQuizTimeLeft(null); return; }
    const t = setTimeout(() => setQuizTimeLeft(s => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [quizTimeLeft]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const completedModules = Object.values(moduleProgress).filter(p => p.is_completed).length;
  const overallProgress = modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;
  const maxAttempts = activeModule?.quiz_max_attempts || 0; // 0 = tak terbatas
  const attemptsUsed = quizAttempts.length;
  const hasPassedQuiz = quizAttempts.some(a => a.passed);
  const attemptsLeft = maxAttempts > 0 ? Math.max(0, maxAttempts - attemptsUsed) : Infinity;
  const attemptsExhausted = maxAttempts > 0 && attemptsUsed >= maxAttempts && !hasPassedQuiz;

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', subtle: isDark ? '#334155' : '#F1F5F9',
    brand: isDark ? '#3B82F6' : '#2563EB', brandBg: isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
    green: isDark ? '#4ADE80' : '#16A34A', greenBg: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4',
  };

  if (!loaded || !user) return null;

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${c.border}`, borderTopColor: c.brand, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: c.muted, fontSize: '14px' }}>Memuat pelatihan...</p>
      </div>
    </div>
  );

  if (!training) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: c.muted }}>Pelatihan tidak ditemukan.</p>
        <Link href="/pelatihan" style={{ color: c.brand, textDecoration: 'none', fontWeight: 600 }}>← Kembali</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: isMobile ? '0 12px' : '0 24px', height: '56px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/pelatihan" style={{ color: c.muted, textDecoration: 'none', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>←</Link>
        <span style={{ color: c.border, flexShrink: 0 }}>|</span>
        <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 700, color: c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{training.title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.subtle, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${c.border}` }}>
              <div style={{ width: '80px', height: '6px', background: c.border, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${overallProgress}%`, height: '100%', background: overallProgress >= 100 ? c.green : c.brand, borderRadius: '3px', transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: overallProgress >= 100 ? c.green : c.brand }}>{overallProgress}%</span>
            </div>
          )}
          {!isMobile && <span style={{ fontSize: '12px', color: c.muted }}>{completedModules}/{modules.length} modul</span>}
          {isMobile && (
            <button onClick={() => setShowModuleList(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${c.border}`, background: c.subtle, color: c.text, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              📋 {completedModules}/{modules.length}
            </button>
          )}
        </div>
      </div>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '10px 24px', background: msg.includes('Lulus') || msg.includes('selesai') ? c.greenBg : msg.includes('Minimal') || msg.includes('Jawab') ? 'var(--warning-50)' : c.greenBg, borderBottom: `1px solid ${c.border}`, color: msg.includes('Minimal') || msg.includes('Jawab') ? 'var(--warning-600)' : c.green, fontSize: '13px', fontWeight: 600 }}>
          {msg}
        </motion.div>
      )}

      {/* Mobile: overlay daftar modul */}
      {isMobile && showModuleList && (
        <div onClick={() => setShowModuleList(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
      )}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: c.card, borderTop: `1px solid ${c.border}`,
          borderRadius: '20px 20px 0 0',
          transform: showModuleList ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.text, margin: 0 }}>Daftar Modul</h3>
              <p style={{ fontSize: '11px', color: c.muted, margin: 0 }}>{completedModules} dari {modules.length} selesai</p>
            </div>
            <button onClick={() => setShowModuleList(false)}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${c.border}`, background: c.subtle, cursor: 'pointer', color: c.muted, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {modules.map((mod, i) => {
              const isActive = activeModule?.id === mod.id;
              const isCompleted = moduleProgress[mod.id]?.is_completed;
              return (
                <div key={mod.id} onClick={() => { selectModule(mod); setShowModuleList(false); }}
                  style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: `1px solid ${c.border}`, background: isActive ? c.brandBg : 'transparent', borderLeft: `3px solid ${isActive ? c.brand : 'transparent'}` }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0,
                      background: isCompleted ? c.green : isActive ? c.brand : c.subtle,
                      color: isCompleted || isActive ? '#fff' : c.muted,
                    }}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: isActive ? 700 : 500, color: isActive ? c.brand : c.text, margin: '0 0 3px', lineHeight: 1.3 }}>{mod.title}</p>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: c.muted }}>
                        {classifyUrl(mod.content_url).isVideo && <span>🎬</span>}
                        {classifyUrl(mod.content_url).hasMaterial && <span>📄</span>}
                        {mod.duration_mins ? <span>⏱️ {mod.duration_mins}m</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

        {/* Left sidebar - module list (desktop only) */}
        <div style={{ width: '280px', background: c.card, borderRight: `1px solid ${c.border}`, display: isMobile ? 'none' : 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, background: c.subtle }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>Daftar Modul</h3>
            <p style={{ fontSize: '11px', color: c.muted }}>{completedModules} dari {modules.length} selesai</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {modules.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.3 }}>📭</div>
                <p style={{ fontSize: '13px', color: c.muted }}>Belum ada modul</p>
              </div>
            ) : modules.map((mod, i) => {
              const isActive = activeModule?.id === mod.id;
              const isCompleted = moduleProgress[mod.id]?.is_completed;
              return (
                <motion.div key={mod.id} onClick={() => selectModule(mod)}
                  style={{ padding: '13px 16px', cursor: 'pointer', borderBottom: `1px solid ${c.border}`, background: isActive ? c.brandBg : 'transparent', borderLeft: `3px solid ${isActive ? c.brand : 'transparent'}`, transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c.subtle; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0,
                      background: isCompleted ? c.green : isActive ? c.brand : c.subtle,
                      color: isCompleted || isActive ? '#fff' : c.muted,
                      border: `2px solid ${isCompleted ? c.green : isActive ? c.brand : c.border}`,
                    }}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? c.brand : c.text, margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{mod.title}</p>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: c.muted }}>
                        {classifyUrl(mod.content_url).isVideo && <span>🎬 Video</span>}
                        {classifyUrl(mod.content_url).hasMaterial && <span>📄 Materi</span>}
                        {mod.duration_mins ? <span>⏱️ {mod.duration_mins}m</span> : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeModule ? (
            <>
              {/* Module header */}
              <div style={{ padding: isMobile ? '12px 14px' : '16px 24px', borderBottom: `1px solid ${c.border}`, background: c.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 800, color: c.text, marginBottom: '2px', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{activeModule.title}</h2>
                  {activeModule.description && <p style={{ fontSize: '12px', color: c.muted }}>{activeModule.description}</p>}
                </div>
                {moduleProgress[activeModule.id]?.is_completed ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '20px', background: c.greenBg, color: c.green, fontSize: '12px', fontWeight: 700, border: `1px solid ${c.green}44`, flexShrink: 0 }}>✓ Selesai</span>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => markModuleComplete(activeModule.id)}
                    style={{ padding: isMobile ? '7px 12px' : '8px 18px', borderRadius: '8px', border: 'none', background: c.brand, color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    ✓ Selesai
                  </motion.button>
                )}
              </div>

              {/* Content tabs */}
              <div style={{ borderBottom: `1px solid ${c.border}`, background: c.card, padding: isMobile ? '0 8px' : '0 24px', display: 'flex', gap: '0', flexShrink: 0 }}>
                {[
                  { id: 'video', label: isMobile ? '🎬' : '🎬 Video', show: classifyUrl(activeModule.content_url).isVideo },
                  { id: 'materi', label: isMobile ? '📄 Materi' : '📄 Materi', show: classifyUrl(activeModule.content_url).hasMaterial },
                  { id: 'kuis', label: `❓ Kuis (${quizzes.length})`, show: quizzes.length > 0 },
                ].filter(t => t.show).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: isMobile ? '10px 14px' : '12px 18px', border: 'none', background: 'transparent', fontSize: isMobile ? '13px' : '13px', fontWeight: activeTab === tab.id ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit',
                    color: activeTab === tab.id ? c.brand : c.muted,
                    borderBottom: `2px solid ${activeTab === tab.id ? c.brand : 'transparent'}`,
                    marginBottom: '-1px', transition: 'all 0.15s', flex: isMobile ? 1 : 'initial', textAlign: 'center',
                  }}>{tab.label}</button>
                ))}
              </div>

              {/* Content area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px' : '24px' }}>
                <AnimatePresence mode="wait">

                  {/* Video tab */}
                  {activeTab === 'video' && classifyUrl(activeModule.content_url).isVideo && (
                    <motion.div key="video" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', marginBottom: '20px', background: '#000', position: 'relative', paddingTop: '56.25%' }}>
                        <iframe src={getYouTubeEmbedUrl(activeModule.content_url)} title={activeModule.title}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      </div>
                      {activeModule.duration_mins > 0 && (
                        <p style={{ fontSize: '13px', color: c.muted }}>⏱️ Durasi: {activeModule.duration_mins} menit</p>
                      )}
                      {quizzes.length > 0 && !moduleProgress[activeModule.id]?.is_completed && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                          style={{ marginTop: '20px', padding: '16px 20px', background: c.brandBg, borderRadius: '12px', border: `1px solid ${c.brand}44`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: c.brand, marginBottom: '2px' }}>Kerjakan kuis untuk menyelesaikan modul ini</p>
                            <p style={{ fontSize: '12px', color: c.muted }}>{quizzes.length} soal • Minimal skor 70 untuk lulus</p>
                          </div>
                          <button onClick={() => setActiveTab('kuis')} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                            Kerjakan Kuis →
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Materi tab */}
                  {activeTab === 'materi' && classifyUrl(activeModule.content_url).hasMaterial && (() => {
                    const m = classifyUrl(activeModule.content_url);
                    const src = activeModule.content_url;
                    return (
                    <motion.div key="materi" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>{m.isPdf ? '📄 Materi PDF' : m.isPpt ? '📊 Materi Presentasi' : '📎 Materi'}</p>
                        <a href={src} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', borderRadius: '8px', background: c.brand, color: '#fff', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>⬇️ Buka / Unduh</a>
                      </div>
                      {m.isPdf ? (
                        <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${c.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', background: '#fff' }}>
                          <iframe src={src} title={activeModule.title} style={{ width: '100%', height: '72vh', border: 'none' }} />
                        </div>
                      ) : m.isPpt ? (
                        <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${c.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', background: '#fff' }}>
                          <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`} title={activeModule.title} style={{ width: '100%', height: '72vh', border: 'none' }} />
                        </div>
                      ) : (
                        <div style={{ background: c.card, borderRadius: '14px', border: `1px solid ${c.border}`, padding: '48px', textAlign: 'center' }}>
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📎</div>
                          <p style={{ color: c.muted, fontSize: '14px' }}>Klik "Buka / Unduh" di atas untuk melihat materi.</p>
                        </div>
                      )}
                    </motion.div>
                    );
                  })()}

                  {/* Fallback: no material & no quiz */}
                  {!classifyUrl(activeModule.content_url).isVideo && !classifyUrl(activeModule.content_url).hasMaterial && quizzes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: c.muted, fontSize: '14px' }}>📭 Belum ada materi untuk modul ini.</div>
                  )}

                  {/* Kuis tab */}
                  {activeTab === 'kuis' && (
                    <motion.div key="kuis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {quizzes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                          <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.3 }}>❓</div>
                          <p style={{ color: c.muted }}>Belum ada soal kuis untuk modul ini</p>
                        </div>
                      ) : quizSubmitted && quizResult ? (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          style={{ maxWidth: '580px', margin: '0 auto' }}>
                          {/* Result card */}
                          <div style={{ background: quizResult.passed ? c.greenBg : 'var(--warning-50)', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '24px', border: `1px solid ${quizResult.passed ? c.green : 'var(--warning-600)'}44` }}>
                            <div style={{ fontSize: '56px', marginBottom: '12px' }}>{quizResult.passed ? '🎉' : '📚'}</div>
                            <div style={{ fontSize: '48px', fontWeight: 800, color: quizResult.passed ? c.green : 'var(--warning-600)', marginBottom: '8px', letterSpacing: '-0.03em' }}>{quizResult.score}</div>
                            <div style={{ fontSize: '16px', color: c.text, fontWeight: 700, marginBottom: '4px' }}>{quizResult.passed ? 'Selamat! Kamu Lulus! 🎊' : 'Belum Lulus'}</div>
                            <p style={{ fontSize: '13px', color: c.muted }}>{quizResult.passed ? 'Modul ini telah ditandai selesai' : 'Skor minimal 70. Pelajari materi kembali dan coba lagi.'}</p>
                          </div>

                          {/* Answer review */}
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '16px' }}>Review Jawaban</h3>
                          {quizzes.map((q, i) => {
                            const userAns = quizResult.answers?.[q.id];
                            const isCorrect = userAns?.toLowerCase() === q.correct_answer.toLowerCase();
                            return (
                              <div key={q.id} style={{ background: c.card, borderRadius: '12px', border: `1px solid ${isCorrect ? c.green : 'var(--error-600)'}44`, padding: '16px', marginBottom: '10px' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: c.text, marginBottom: '10px' }}>{i+1}. {q.question}</p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                  {['a','b','c','d'].map(opt => {
                                    const optText = q[`option_${opt}`];
                                    if (!optText) return null;
                                    const isUserAns = userAns?.toLowerCase() === opt;
                                    const isCorrectAns = q.correct_answer.toLowerCase() === opt;
                                    return (
                                      <div key={opt} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: isUserAns || isCorrectAns ? 600 : 400,
                                        background: isCorrectAns ? c.greenBg : isUserAns && !isCorrect ? 'var(--error-50)' : c.subtle,
                                        color: isCorrectAns ? c.green : isUserAns && !isCorrect ? 'var(--error-600)' : c.muted,
                                        border: `1px solid ${isCorrectAns ? c.green : isUserAns && !isCorrect ? 'var(--error-600)' : c.border}44`,
                                      }}>
                                        {opt.toUpperCase()}. {optText} {isCorrectAns ? '✓' : isUserAns && !isCorrect ? '✗' : ''}
                                      </div>
                                    );
                                  })}
                                </div>
                                {q.explanation && <p style={{ fontSize: '12px', color: c.muted, padding: '8px 12px', background: c.subtle, borderRadius: '8px', margin: 0 }}>💡 {q.explanation}</p>}
                              </div>
                            );
                          })}

                          {!quizResult.passed && attemptsLeft > 0 && (
                            <button onClick={retryQuiz} style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '10px', border: 'none', background: c.brand, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
                              🔄 Coba Lagi{maxAttempts > 0 ? ` (sisa ${attemptsLeft})` : ''}
                            </button>
                          )}
                          {!quizResult.passed && attemptsLeft <= 0 && (
                            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: 'var(--error-50)', border: '1px solid var(--error-600)44', color: 'var(--error-600)', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>
                              🔒 Kesempatan habis. Kamu sudah mencoba {attemptsUsed} kali dan belum mencapai skor minimal.
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                              <h2 style={{ fontSize: '18px', fontWeight: 800, color: c.text, marginBottom: '3px' }}>Kuis Modul</h2>
                              <p style={{ fontSize: '13px', color: c.muted }}>{quizzes.length} soal • Minimal 70 untuk lulus{maxAttempts > 0 ? ` • Percobaan ${attemptsUsed}/${maxAttempts}` : ''}</p>
                            </div>
                            {quizAttempts.length > 0 && (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', color: c.muted }}>Percobaan sebelumnya</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: c.text }}>Tertinggi: {Math.max(...quizAttempts.map(a => a.score))}</div>
                              </div>
                            )}
                          </div>

                          {attemptsExhausted ? (
                            <div style={{ background: c.card, borderRadius: '14px', border: '1px solid var(--error-600)44', padding: '40px', textAlign: 'center' }}>
                              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
                              <h3 style={{ fontSize: '17px', fontWeight: 800, color: c.text, marginBottom: '6px' }}>Kesempatan Habis</h3>
                              <p style={{ fontSize: '13px', color: c.muted }}>Kamu sudah mengerjakan kuis ini {attemptsUsed} kali dan belum mencapai skor minimal 70. Pelajari kembali materinya, ya.</p>
                              {quizAttempts.length > 0 && <p style={{ fontSize: '13px', fontWeight: 700, color: c.text, marginTop: '10px' }}>Skor tertinggimu: {Math.max(...quizAttempts.map(a => a.score))}/100</p>}
                            </div>
                          ) : (
                          <>
                          {quizTimeLeft !== null && (
                            <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontWeight: 800, fontSize: '18px', fontVariantNumeric: 'tabular-nums',
                              background: quizTimeLeft <= 30 ? 'var(--error-50)' : c.brandBg,
                              color: quizTimeLeft <= 30 ? 'var(--error-600)' : c.brand,
                              border: `1px solid ${quizTimeLeft <= 30 ? 'var(--error-600)' : c.brand}44` }}>
                              ⏱️ Sisa waktu: {formatTime(quizTimeLeft)}
                            </div>
                          )}
                          {quizzes.map((q, i) => (
                            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                              style={{ background: c.card, borderRadius: '12px', border: `1px solid ${quizAnswers[q.id] ? c.brand : c.border}`, padding: '20px', marginBottom: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'border-color 0.15s' }}>
                              <p style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '14px', lineHeight: 1.4 }}>
                                <span style={{ color: c.brand, marginRight: '8px' }}>{i+1}.</span>{q.question}
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {['a','b','c','d'].map(opt => {
                                  const optText = q[`option_${opt}`];
                                  if (!optText) return null;
                                  const isSelected = quizAnswers[q.id] === opt;
                                  return (
                                    <motion.div key={opt} whileTap={{ scale: 0.98 }} onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${isSelected ? c.brand : c.border}`, background: isSelected ? c.brandBg : 'transparent', transition: 'all 0.15s' }}>
                                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2px solid ${isSelected ? c.brand : c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, background: isSelected ? c.brand : 'transparent', color: isSelected ? '#fff' : c.muted }}>
                                        {opt.toUpperCase()}
                                      </div>
                                      <span style={{ fontSize: '14px', color: isSelected ? c.brand : c.text, fontWeight: isSelected ? 600 : 400 }}>{optText}</span>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          ))}

                          <div style={{ padding: '16px', background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: c.muted }}>
                              {Object.keys(quizAnswers).length} dari {quizzes.length} soal dijawab
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {quizzes.map(q => (
                                <div key={q.id} style={{ width: '10px', height: '10px', borderRadius: '50%', background: quizAnswers[q.id] ? c.brand : c.border }} />
                              ))}
                            </div>
                          </div>

                          <motion.button whileTap={{ scale: 0.97 }} onClick={submitQuiz} disabled={submittingQuiz || Object.keys(quizAnswers).length < quizzes.length}
                            style={{ width: '100%', padding: '14px', borderRadius: '11px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: Object.keys(quizAnswers).length < quizzes.length ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                              background: Object.keys(quizAnswers).length < quizzes.length ? c.subtle : c.brand,
                              color: Object.keys(quizAnswers).length < quizzes.length ? c.muted : '#fff',
                              boxShadow: Object.keys(quizAnswers).length >= quizzes.length ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                            }}>
                            {submittingQuiz ? '⏳ Menilai...' : `Kumpulkan Jawaban (${Object.keys(quizAnswers).length}/${quizzes.length})`}
                          </motion.button>
                          </>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.3 }}>📖</div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: c.text, marginBottom: '6px' }}>Pilih modul untuk mulai belajar</p>
                <p style={{ fontSize: '13px' }}>Atau admin perlu menambahkan modul ke pelatihan ini</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}