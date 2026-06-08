'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useUser } from '../../lib/userContext';
import Sidebar from '../components/Sidebar';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loaded } = useUser();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => { if (loaded && !user) router.push('/auth'); }, [loaded, user]);
  useEffect(() => { if (user) { fetchConversations(); fetchAllUsers(); } }, [user]);

  // Auto-open conversation from URL param
  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && user) openOrCreateConversation(parseInt(userId));
  }, [searchParams, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`chat-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        const newMsg = payload.new;
        // Update messages if viewing this conversation
        if (selectedConv && newMsg.conversation_id === selectedConv.id) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, sender: newMsg.sender_id === user.id ? user : selectedConv.other_user }];
          });
          // Mark as read
          if (newMsg.sender_id !== user.id) markMessagesRead(newMsg.conversation_id);
        }
        // Update conversation list
        fetchConversations();
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedConv]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data: convs } = await supabase.from('conversations')
        .select('*, user1:users!conversations_user1_id_fkey(id, full_name, avatar_url, role, company_name), user2:users!conversations_user2_id_fkey(id, full_name, avatar_url, role, company_name)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      const processed = (convs || []).map(c => ({
        ...c,
        other_user: c.user1_id === user.id ? c.user2 : c.user1,
      }));

      // Count unread messages per conversation
      const counts = {};
      await Promise.all(processed.map(async c => {
        const { count } = await supabase.from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);
        counts[c.id] = count || 0;
      }));

      setConversations(processed);
      setUnreadCounts(counts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('users').select('id, full_name, avatar_url, role, company_name, job_title').neq('id', user.id).order('full_name');
    setAllUsers(data || []);
  };

  const fetchMessages = async (convId) => {
    setLoadingMessages(true);
    const { data } = await supabase.from('messages')
      .select('*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMessages(false);
    markMessagesRead(convId);
  };

  const markMessagesRead = async (convId) => {
    await supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', convId).neq('sender_id', user.id);
    setUnreadCounts(prev => ({ ...prev, [convId]: 0 }));
  };

  const openOrCreateConversation = async (otherUserId) => {
    // Check if conversation exists
    const { data: existing } = await supabase.from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .single();

    if (existing) {
      const { data: otherUser } = await supabase.from('users').select('id, full_name, avatar_url, role, company_name, job_title').eq('id', otherUserId).single();
      const conv = { ...existing, other_user: otherUser };
      setSelectedConv(conv);
      fetchMessages(existing.id);
    } else {
      // Create new conversation
      const { data: newConv } = await supabase.from('conversations')
        .insert([{ user1_id: user.id, user2_id: otherUserId }])
        .select().single();
      const { data: otherUser } = await supabase.from('users').select('id, full_name, avatar_url, role, company_name, job_title').eq('id', otherUserId).single();
      const conv = { ...newConv, other_user: otherUser };
      setSelectedConv(conv);
      setConversations(prev => [conv, ...prev]);
      setMessages([]);
    }
    setShowNewChat(false);
    setSearchUser('');
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConv || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`, conversation_id: selectedConv.id,
      sender_id: user.id, content, is_read: false,
      created_at: new Date().toISOString(),
      sender: user, temp: true,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const { data: newMsg } = await supabase.from('messages')
        .insert([{ conversation_id: selectedConv.id, sender_id: user.id, content }])
        .select('*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url)')
        .single();

      // Replace temp message
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? newMsg : m));

      // Update conversation last message
      await supabase.from('conversations').update({
        last_message: content, last_message_at: new Date().toISOString(),
      }).eq('id', selectedConv.id);

      fetchConversations();
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setInput(content);
    } finally { setSending(false); }
  };

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const getRoleLabel = (role) => {
    const map = { admin: '🛡️ Admin', company: '🏢 Perusahaan', mentor: '🎤 Mentor', user: '👤 User' };
    return map[role] || '👤 User';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff/60000)} mnt`;
    if (diff < 86400000) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('id-ID', { weekday: 'short' });
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const initials = n => n?.split(' ').map(x => x[0]).join('').toUpperCase().slice(0,2) || '?';
  const filteredUsers = allUsers.filter(u => !searchUser || u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) || u.company_name?.toLowerCase().includes(searchUser.toLowerCase()));
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!loaded || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Pesan</h1>
            {totalUnread > 0 && (
              <span style={{ background: 'var(--brand-600)', color: '#fff', borderRadius: '20px', fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>{totalUnread}</span>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowNewChat(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
            ✏️ Pesan Baru
          </motion.button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Conversation list */}
          <div style={{ width: '300px', borderRight: '1px solid var(--border-default)', background: 'var(--surface-primary)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            {/* Search */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', borderRadius: '8px', padding: '8px 12px', border: '1px solid var(--border-default)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>🔍</span>
                <input placeholder="Cari percakapan..."
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '64px' }} />)}
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Belum ada percakapan</p>
                  <button onClick={() => setShowNewChat(true)} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Mulai Chat</button>
                </div>
              ) : conversations.map((conv, i) => {
                const isSelected = selectedConv?.id === conv.id;
                const unread = unreadCounts[conv.id] || 0;
                return (
                  <motion.div key={conv.id} onClick={() => selectConversation(conv)}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', background: isSelected ? 'var(--surface-brand)' : 'transparent', transition: 'background 0.15s', borderLeft: `3px solid ${isSelected ? 'var(--brand-600)' : 'transparent'}` }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {conv.other_user?.avatar_url ? (
                        <img src={conv.other_user.avatar_url} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-default)' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                          {initials(conv.other_user?.full_name)}
                        </div>
                      )}
                      {unread > 0 && (
                        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', border: '2px solid var(--surface-primary)' }}>{unread > 9 ? '9+' : unread}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: unread > 0 ? 700 : 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{conv.other_user?.full_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0, marginLeft: '6px' }}>{formatTime(conv.last_message_at)}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: unread > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: unread > 0 ? 600 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_message || 'Mulai percakapan'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-primary)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, boxShadow: 'var(--shadow-xs)' }}>
                  {selectedConv.other_user?.avatar_url ? (
                    <img src={selectedConv.other_user.avatar_url} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                      {initials(selectedConv.other_user?.full_name)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{selectedConv.other_user?.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {getRoleLabel(selectedConv.other_user?.role)}
                      {selectedConv.other_user?.company_name && ` • ${selectedConv.other_user.company_name}`}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loadingMessages ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                      <div style={{ width: '24px', height: '24px', border: '3px solid var(--border-default)', borderTopColor: 'var(--brand-600)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.3 }}>💬</div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>Mulai percakapan</h3>
                      <p style={{ fontSize: '13px' }}>Kirim pesan pertamamu ke {selectedConv.other_user?.full_name}</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => {
                        const isMe = msg.sender_id === user.id;
                        const showAvatar = !isMe && (i === 0 || messages[i-1]?.sender_id !== msg.sender_id);
                        const showTime = i === messages.length - 1 || messages[i+1]?.sender_id !== msg.sender_id || (new Date(messages[i+1]?.created_at) - new Date(msg.created_at)) > 300000;

                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                            {/* Avatar */}
                            {!isMe && (
                              <div style={{ width: '28px', height: '28px', flexShrink: 0, marginBottom: showTime ? '0' : '0' }}>
                                {showAvatar ? (
                                  selectedConv.other_user?.avatar_url ? (
                                    <img src={selectedConv.other_user.avatar_url} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '10px' }}>
                                      {initials(selectedConv.other_user?.full_name)}
                                    </div>
                                  )
                                ) : null}
                              </div>
                            )}

                            {/* Bubble */}
                            <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '3px' }}>
                              <div style={{
                                padding: '10px 14px',
                                borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                background: isMe ? 'linear-gradient(135deg,var(--brand-600),var(--brand-700))' : 'var(--surface-primary)',
                                color: isMe ? '#fff' : 'var(--text-primary)',
                                border: isMe ? 'none' : '1px solid var(--border-default)',
                                fontSize: '14px', lineHeight: 1.6,
                                boxShadow: isMe ? 'var(--shadow-brand)' : 'var(--shadow-xs)',
                                opacity: msg.temp ? 0.7 : 1,
                              }}>{msg.content}</div>
                              {showTime && (
                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  {isMe && <span style={{ fontSize: '11px' }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-default)', background: 'var(--surface-primary)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, background: 'var(--surface-secondary)', borderRadius: '12px', border: '1.5px solid var(--border-default)', padding: '10px 14px', transition: 'border-color 0.15s' }}>
                      <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Tulis pesan... (Enter untuk kirim)"
                        rows={1} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', resize: 'none', lineHeight: 1.5, maxHeight: '100px', overflow: 'auto' }}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }} />
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={sendMessage} disabled={!input.trim() || sending}
                      style={{ width: '42px', height: '42px', borderRadius: '12px', border: 'none', background: !input.trim() ? 'var(--surface-tertiary)' : 'var(--brand-600)', color: !input.trim() ? 'var(--text-tertiary)' : '#fff', cursor: !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, boxShadow: input.trim() ? 'var(--shadow-brand)' : 'none', transition: 'all 0.15s' }}>
                      {sending ? '⏳' : '↑'}
                    </motion.button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>Shift+Enter untuk baris baru</p>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px' }}>
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                  style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }}>💬</motion.div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Pilih percakapan</h2>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>Atau mulai chat baru dengan user lain</p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowNewChat(true)}
                  style={{ padding: '10px 22px', borderRadius: '9px', border: 'none', background: 'var(--brand-600)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-brand)' }}>
                  ✏️ Mulai Chat Baru
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        <AnimatePresence>
          {showNewChat && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                style={{ background: 'var(--surface-primary)', borderRadius: '16px', width: '100%', maxWidth: '440px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border-default)' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>✉️ Pesan Baru</h3>
                  <button onClick={() => setShowNewChat(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '20px', cursor: 'pointer', padding: '2px' }}>×</button>
                </div>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-secondary)', borderRadius: '9px', padding: '9px 12px', border: '1.5px solid var(--border-default)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>🔍</span>
                    <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Cari nama user..." autoFocus
                      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }} />
                  </div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>Tidak ada user ditemukan</div>
                  ) : filteredUsers.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => openOrCreateConversation(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand-600),var(--brand-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                          {initials(u.full_name)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{u.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {getRoleLabel(u.role)}{u.company_name ? ` • ${u.company_name}` : u.job_title ? ` • ${u.job_title}` : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>→</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
