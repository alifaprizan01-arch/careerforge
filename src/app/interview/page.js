'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import { useTheme } from '../../lib/themeContext';
import Sidebar from '../components/Sidebar';

const POSITIONS = [
  { id: 'ui_ux', label: 'UI/UX Designer', icon: '🎨' },
  { id: 'frontend', label: 'Frontend Developer', icon: '💻' },
  { id: 'backend', label: 'Backend Developer', icon: '⚙️' },
  { id: 'fullstack', label: 'Fullstack Developer', icon: '🔧' },
  { id: 'product_manager', label: 'Product Manager', icon: '📱' },
  { id: 'data_analyst', label: 'Data Analyst', icon: '📊' },
  { id: 'marketing', label: 'Digital Marketing', icon: '📣' },
  { id: 'hr', label: 'HR Manager', icon: '👥' },
  { id: 'finance', label: 'Finance & Accounting', icon: '💰' },
  { id: 'custom', label: 'Posisi Lainnya', icon: '✏️' },
];

const LEVELS = [
  { id: 'fresh', label: 'Fresh Graduate', desc: 'Baru lulus, 0-1 tahun' },
  { id: 'junior', label: 'Junior', desc: '1-3 tahun pengalaman' },
  { id: 'mid', label: 'Mid-Level', desc: '3-5 tahun pengalaman' },
  { id: 'senior', label: 'Senior', desc: '5+ tahun pengalaman' },
];

export default function InterviewAIPage() {
  const router = useRouter();
  const { user, loaded } = useUser();
  const { isDark } = useTheme();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [phase, setPhase] = useState('setup'); // setup | interview | feedback
  const [selectedPosition, setSelectedPosition] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(7);
  const [feedback, setFeedback] = useState(null);
  const [scores, setScores] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId] = useState(Date.now());

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (user) fetchHistory(); }, [user]);

  const fetchHistory = async () => {
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', user.id).eq('type', 'interview')
      .order('created_at', { ascending: false }).limit(5);
    setHistory(data || []);
  };

  const getPositionLabel = () => {
    if (selectedPosition === 'custom') return customPosition;
    return POSITIONS.find(p => p.id === selectedPosition)?.label || '';
  };

  const callGroq = async (conversationHistory, systemPrompt) => {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key tidak ditemukan. Tambahkan NEXT_PUBLIC_GROQ_API_KEY di .env.local');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory.length > 0
        ? conversationHistory.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
        : [{ role: 'user', content: 'Mulai interview sekarang.' }]
      ),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API error');
    }
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const startInterview = async () => {
    const pos = getPositionLabel();
    const level = LEVELS.find(l => l.id === selectedLevel);
    if (!pos || !selectedLevel) return;

    setPhase('interview');
    setLoading(true);
    setQuestionCount(0);
    setScores([]);

    const systemPrompt = `Kamu adalah interviewer profesional yang berpengalaman dari perusahaan teknologi terkemuka di Indonesia.
Kamu sedang melakukan wawancara kerja untuk posisi ${pos} level ${level.label} (${level.desc}).

ATURAN PENTING:
1. Mulai dengan sapaan hangat dan perkenalan singkat dalam Bahasa Indonesia
2. Ajukan SATU pertanyaan interview pada satu waktu
3. Dengarkan jawaban kandidat, berikan respons singkat, lalu lanjut ke pertanyaan berikutnya
4. Pertanyaan harus relevan dengan posisi ${pos} dan level ${level.label}
5. Campurkan pertanyaan: behavioral (STAR method), technical, dan situational
6. Setelah ${maxQuestions} pertanyaan, ucapkan terima kasih dan tutup interview
7. Gunakan bahasa yang profesional tapi ramah
8. Jangan memberikan jawaban atau petunjuk jawaban

Mulai sekarang dengan sapaan dan pertanyaan pertama.`;

    try {
      const reply = await callGroq([], systemPrompt);
      setMessages([{ role: 'assistant', content: reply, time: new Date() }]);
      setQuestionCount(1);
    } catch (e) {
      setMessages([{ role: 'assistant', content: `❌ Error: ${e.message}. Pastikan NEXT_PUBLIC_GROQ_API_KEY sudah benar di .env.local`, time: new Date() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), time: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const pos = getPositionLabel();
    const level = LEVELS.find(l => l.id === selectedLevel);
    const isLastQuestion = questionCount >= maxQuestions;

    const systemPrompt = `Kamu adalah interviewer profesional untuk posisi ${pos} level ${level.label}.
Ini adalah pertanyaan ke-${questionCount} dari ${maxQuestions} pertanyaan.
${isLastQuestion
  ? `Ini adalah jawaban terakhir. Ucapkan terima kasih yang tulus, berikan kesan singkat positif tentang kandidat, dan tutup sesi interview dengan profesional. JANGAN tanya pertanyaan lagi.`
  : `Respons singkat terhadap jawaban kandidat (1-2 kalimat), lalu langsung ajukan pertanyaan ke-${questionCount + 1}. Pertanyaan harus berbeda topik dari sebelumnya.`
}
Gunakan Bahasa Indonesia yang profesional dan ramah.`;

    try {
      const convHistory = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await callGroq(convHistory, systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date() }]);

      if (!isLastQuestion) {
        setQuestionCount(prev => prev + 1);
      } else {
        // Generate feedback
        setTimeout(() => generateFeedback(newMessages), 1500);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${e.message}`, time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async (allMessages) => {
    setLoading(true);
    const pos = getPositionLabel();
    const level = LEVELS.find(l => l.id === selectedLevel);

    const conversation = allMessages.map(m => `${m.role === 'user' ? 'Kandidat' : 'Interviewer'}: ${m.content}`).join('\n\n');

    const feedbackPrompt = `Kamu adalah evaluator interview HR. Analisis transkrip interview berikut untuk posisi ${pos} level ${level.label}.

TRANSKRIP:
${conversation}

PENTING: Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown, tanpa penjelasan.

Format JSON yang harus dikembalikan:
{"overall_score":85,"grade":"B+","summary":"Kandidat menunjukkan pemahaman yang baik.","strengths":["Komunikasi jelas","Pengalaman relevan","Antusias"],"improvements":["Perlu lebih detail","Kurang contoh konkret","Perlu perkuat teknikal"],"categories":{"komunikasi":80,"pengetahuan_teknis":75,"problem_solving":70,"kepercayaan_diri":85,"relevansi_jawaban":80},"recommendation":"Direkomendasikan","tips":["Pelajari lebih dalam tentang posisi","Siapkan contoh nyata dari pengalaman","Latih jawaban dengan metode STAR"]}`;

    try {
      const reply = await callGroq([{ role: 'user', content: feedbackPrompt }], 'Kamu adalah evaluator interview HR yang memberikan feedback dalam format JSON.');
      // Extract JSON from response
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format JSON tidak valid');
      const parsed = JSON.parse(jsonMatch[0]);
      setFeedback(parsed);

      // Simpan ke notifikasi
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: `Hasil Interview: ${pos} — Skor ${parsed.overall_score}/100`,
        message: `Grade: ${parsed.grade} | ${parsed.summary}`,
        type: 'interview', is_read: false,
      }]);
      await fetchHistory();

      setPhase('feedback');
    } catch (e) {
      console.error('Feedback error:', e);
      setFeedback({ overall_score: 0, grade: '?', summary: 'Gagal generate feedback. Coba lagi.', strengths: [], improvements: [], categories: {}, recommendation: '-', tips: [] });
      setPhase('feedback');
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setPhase('setup');
    setMessages([]);
    setInput('');
    setQuestionCount(0);
    setFeedback(null);
    setScores([]);
  };

  const c = {
    bg: isDark ? '#0F172A' : '#F8FAFC', card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0', text: isDark ? '#F1F5F9' : '#0F172A',
    muted: isDark ? '#94A3B8' : '#64748B', input: isDark ? '#0F172A' : '#F8FAFC',
    inputText: isDark ? '#F1F5F9' : '#0F172A', blue: isDark ? '#3B82F6' : '#2563EB',
    blueLight: isDark ? '#1E3A5F' : '#EFF6FF', green: isDark ? '#4ADE80' : '#16A34A',
    greenLight: isDark ? '#14532D' : '#F0FDF4',
  };

  const gradeColor = (grade) => {
    if (!grade) return c.muted;
    if (grade.startsWith('A')) return c.green;
    if (grade.startsWith('B')) return c.blue;
    if (grade.startsWith('C')) return isDark ? '#FCD34D' : '#D97706';
    return isDark ? '#F87171' : '#DC2626';
  };

  const scoreColor = (score) => {
    if (score >= 80) return c.green;
    if (score >= 60) return c.blue;
    if (score >= 40) return isDark ? '#FCD34D' : '#D97706';
    return isDark ? '#F87171' : '#DC2626';
  };

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: 'var(--sidebar-width, 240px)', flex: 1, padding: '0', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.border}`, background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: '28px' }}>🤖</motion.div>
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>Simulasi Interview AI</h1>
              <p style={{ fontSize: '12px', color: c.muted }}>
                {phase === 'setup' ? 'Pilih posisi dan level untuk memulai' :
                 phase === 'interview' ? `${getPositionLabel()} • Pertanyaan ${Math.min(questionCount, maxQuestions)}/${maxQuestions}` :
                 `Sesi selesai — ${getPositionLabel()}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {phase === 'interview' && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: maxQuestions }).map((_, i) => (
                  <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < questionCount ? c.blue : isDark ? '#334155' : '#E2E8F0' }} />
                ))}
              </div>
            )}
            {phase !== 'setup' && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={resetInterview}
                style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: '12px', cursor: 'pointer' }}>
                🔄 Mulai Ulang
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowHistory(!showHistory)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, background: showHistory ? c.blueLight : 'transparent', color: showHistory ? c.blue : c.muted, fontSize: '12px', cursor: 'pointer' }}>
              📋 Riwayat
            </motion.button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <AnimatePresence mode="wait">
              {/* SETUP PHASE */}
              {phase === 'setup' && (
                <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                  {/* Hero */}
                  <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#2563EB)', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '56px', flexShrink: 0 }}>🤖</motion.div>
                    <div>
                      <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Latih Interview dengan AI</h2>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.6, marginBottom: '14px' }}>
                        AI akan berperan sebagai interviewer profesional dan memberikan feedback lengkap setelah {maxQuestions} pertanyaan.
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {['🎯 Pertanyaan kontekstual', '📊 Evaluasi otomatis', '💡 Tips personal', '🏆 Skor & grade'].map((f, i) => (
                          <span key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Pilih posisi */}
                  <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '22px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '4px' }}>1️⃣ Pilih Posisi</h3>
                    <p style={{ fontSize: '13px', color: c.muted, marginBottom: '16px' }}>Posisi apa yang ingin kamu simulasikan?</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '12px' }}>
                      {POSITIONS.map(pos => (
                        <motion.button key={pos.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedPosition(pos.id)}
                          style={{ padding: '12px 8px', borderRadius: '10px', border: `2px solid ${selectedPosition === pos.id ? c.blue : c.border}`,
                            background: selectedPosition === pos.id ? c.blueLight : 'transparent',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '22px' }}>{pos.icon}</span>
                          <span style={{ fontSize: '11px', fontWeight: selectedPosition === pos.id ? 600 : 400, color: selectedPosition === pos.id ? c.blue : c.text, textAlign: 'center', lineHeight: 1.3 }}>{pos.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    {selectedPosition === 'custom' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <input value={customPosition} onChange={e => setCustomPosition(e.target.value)}
                          placeholder="Tulis nama posisi yang kamu inginkan..."
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', background: c.input, color: c.inputText, boxSizing: 'border-box' }} />
                      </motion.div>
                    )}
                  </div>

                  {/* Step 2: Pilih level */}
                  <div style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '22px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: c.text, marginBottom: '4px' }}>2️⃣ Pilih Level</h3>
                    <p style={{ fontSize: '13px', color: c.muted, marginBottom: '16px' }}>Sesuaikan dengan pengalaman kamu saat ini.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {LEVELS.map(level => (
                        <motion.button key={level.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedLevel(level.id)}
                          style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${selectedLevel === level.id ? c.blue : c.border}`,
                            background: selectedLevel === level.id ? c.blueLight : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: selectedLevel === level.id ? c.blue : c.text, marginBottom: '4px' }}>{level.label}</div>
                          <div style={{ fontSize: '11px', color: c.muted }}>{level.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Start button */}
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={startInterview}
                    disabled={!selectedPosition || !selectedLevel || (selectedPosition === 'custom' && !customPosition.trim())}
                    style={{
                      width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                      background: (!selectedPosition || !selectedLevel || (selectedPosition === 'custom' && !customPosition.trim())) ? isDark ? '#334155' : '#E2E8F0' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                      color: (!selectedPosition || !selectedLevel || (selectedPosition === 'custom' && !customPosition.trim())) ? c.muted : '#fff',
                      fontWeight: 700, fontSize: '16px', cursor: (!selectedPosition || !selectedLevel || (selectedPosition === 'custom' && !customPosition.trim())) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    }}>
                    🚀 Mulai Simulasi Interview
                    {selectedPosition && selectedLevel && <span style={{ fontSize: '13px', opacity: 0.8 }}>— {getPositionLabel()} ({LEVELS.find(l => l.id === selectedLevel)?.label})</span>}
                  </motion.button>
                </motion.div>
              )}

              {/* INTERVIEW PHASE */}
              {phase === 'interview' && (
                <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {messages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                        {/* Avatar */}
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                          background: msg.role === 'user' ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : isDark ? '#334155' : '#F1F5F9' }}>
                          {msg.role === 'user' ? (user.avatar_url ? <img src={user.avatar_url} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} /> : '👤') : '🤖'}
                        </div>
                        {/* Bubble */}
                        <div style={{ maxWidth: '72%' }}>
                          <div style={{ fontSize: '11px', color: c.muted, marginBottom: '4px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                            {msg.role === 'user' ? user.full_name : 'AI Interviewer'} • {msg.time?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{
                            padding: '12px 16px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: msg.role === 'user' ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : c.card,
                            color: msg.role === 'user' ? '#fff' : c.text,
                            border: msg.role === 'user' ? 'none' : `1px solid ${c.border}`,
                            fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isDark ? '#334155' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
                        <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: c.card, border: `1px solid ${c.border}` }}>
                          <motion.div style={{ display: 'flex', gap: '5px' }}>
                            {[0,1,2].map(i => (
                              <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                                style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.blue }} />
                            ))}
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}`, background: c.card, flexShrink: 0 }}>
                    {questionCount > maxQuestions ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: c.blueLight, borderRadius: '10px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '20px' }}>⚙️</motion.div>
                        <span style={{ fontSize: '14px', color: c.blue, fontWeight: 500 }}>Sedang menganalisis performa kamu dan menyiapkan feedback...</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                          placeholder="Tulis jawabanmu di sini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                          rows={3} disabled={loading}
                          style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none', resize: 'none', background: c.input, color: c.inputText, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }} />
                        <motion.button whileTap={{ scale: 0.95 }} onClick={sendMessage} disabled={loading || !input.trim()}
                          style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: loading || !input.trim() ? isDark ? '#334155' : '#E2E8F0' : c.blue, color: loading || !input.trim() ? c.muted : '#fff', fontWeight: 600, fontSize: '13px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
                          Kirim ↑
                        </motion.button>
                      </div>
                    )}
                    <p style={{ fontSize: '11px', color: c.muted, marginTop: '6px' }}>Jawab dengan lengkap dan jelas • Gunakan metode STAR untuk pertanyaan behavioral</p>
                  </div>
                </motion.div>
              )}

              {/* FEEDBACK PHASE */}
              {phase === 'feedback' && feedback && (
                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                  {/* Score header */}
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                    style={{ background: 'linear-gradient(135deg,#1E3A5F,#2563EB)', borderRadius: '16px', padding: '28px 32px', marginBottom: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Skor Keseluruhan</div>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                      style={{ fontSize: '64px', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: '8px' }}>
                      {feedback.overall_score}
                    </motion.div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#60A5FA', marginBottom: '12px' }}>Grade: {feedback.grade}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 16px' }}>{feedback.summary}</div>
                    <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '13px', padding: '6px 16px', borderRadius: '20px', fontWeight: 500 }}>
                      {feedback.recommendation}
                    </span>
                  </motion.div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {/* Strengths */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.green, marginBottom: '14px' }}>✅ Kelebihan Kamu</h3>
                      {feedback.strengths?.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                          style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>✓</div>
                          <span style={{ fontSize: '13px', color: c.text, lineHeight: 1.5 }}>{s}</span>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Improvements */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#FCD34D' : '#D97706', marginBottom: '14px' }}>💡 Area Perbaikan</h3>
                      {feedback.improvements?.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                          style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: isDark ? '#451A03' : '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0, color: isDark ? '#FCD34D' : '#D97706' }}>!</div>
                          <span style={{ fontSize: '13px', color: c.text, lineHeight: 1.5 }}>{s}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Category scores */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ background: c.card, borderRadius: '12px', border: `1px solid ${c.border}`, padding: '20px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.text, marginBottom: '16px' }}>📊 Skor per Kategori</h3>
                    {feedback.categories && Object.entries(feedback.categories).map(([key, val], i) => {
                      const labels = { komunikasi: 'Komunikasi', pengetahuan_teknis: 'Pengetahuan Teknis', problem_solving: 'Problem Solving', kepercayaan_diri: 'Kepercayaan Diri', relevansi_jawaban: 'Relevansi Jawaban' };
                      return (
                        <div key={key} style={{ marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', color: c.text, fontWeight: 500 }}>{labels[key] || key}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(val) }}>{val}/100</span>
                          </div>
                          <div style={{ height: '8px', background: isDark ? '#334155' : '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                              style={{ height: '100%', background: scoreColor(val), borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>

                  {/* Tips */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    style={{ background: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: '12px', border: `1px solid ${c.blue}44`, padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.blue, marginBottom: '14px' }}>🎯 Tips untuk Interview Berikutnya</h3>
                    {feedback.tips?.map((tip, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                        style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '13px', color: c.blue }}>
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span><span>{tip}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={resetInterview}
                      style={{ flex: 1, padding: '13px', borderRadius: '10px', border: `1px solid ${c.border}`, background: 'transparent', color: c.muted, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      🔄 Coba Lagi
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPhase('setup'); setSelectedPosition(''); setSelectedLevel(''); }}
                      style={{ flex: 2, padding: '13px', borderRadius: '10px', border: 'none', background: c.blue, color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      🎯 Coba Posisi Lain
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History sidebar */}
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                style={{ borderLeft: `1px solid ${c.border}`, background: c.card, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ padding: '16px', borderBottom: `1px solid ${c.border}` }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: c.text }}>📋 Riwayat Interview</h3>
                </div>
                <div style={{ overflowY: 'auto', height: 'calc(100% - 53px)' }}>
                  {history.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: c.muted, fontSize: '13px' }}>
                      Belum ada riwayat interview.
                    </div>
                  ) : history.map((h, i) => (
                    <motion.div key={h.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: c.text, marginBottom: '4px' }}>{h.title}</div>
                      <div style={{ fontSize: '11px', color: c.muted, marginBottom: '4px' }}>{h.message?.slice(0,80)}...</div>
                      <div style={{ fontSize: '10px', color: c.muted }}>{new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
