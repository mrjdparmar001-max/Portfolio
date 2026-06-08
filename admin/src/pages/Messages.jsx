import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, markRead, replyMessage, deleteMessage } from '../api/api';
import { FiMail, FiTrash2, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function Messages({ onUpdate }) {
  const [messages, setMessages] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [sending, setSending] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  const load = () =>
    getMessages()
      .then(r => { setMessages(r.data); onUpdate?.(); })
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const handleExpand = async (msg) => {
    if (expanded === msg._id) { setExpanded(null); return; }
    setExpanded(msg._id);
    if (!msg.read) {
      // Optimistically mark as read in UI instantly
      setMessages(prev =>
        prev.map(m => m._id === msg._id ? { ...m, read: true } : m)
      );
      markRead(msg._id).then(() => onUpdate?.()).catch(() => {});
    }
  };

  const handleReply = async (id) => {
    const text = replyText[id]?.trim();
    if (!text) return;

    setSending(id);
    setSuccessId(null);
    setErrorId(null);

    // ── Optimistic update: show reply instantly in UI ──
    const previousMessages = messages;
    setMessages(prev =>
      prev.map(m =>
        m._id === id ? { ...m, adminReply: text, replied: true } : m
      )
    );
    setReplyText(prev => ({ ...prev, [id]: '' }));

    try {
      await replyMessage(id, text);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 3000);
      onUpdate?.(); // just notify parent, no full reload
    } catch (err) {
      // Rollback on failure
      setMessages(previousMessages);
      setReplyText(prev => ({ ...prev, [id]: text }));
      setErrorId(id);
      setTimeout(() => setErrorId(null), 3000);
    } finally {
      setSending(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;

    // Optimistically remove from UI instantly
    setMessages(prev => prev.filter(m => m._id !== id));
    if (expanded === id) setExpanded(null);

    try {
      await deleteMessage(id);
      onUpdate?.();
    } catch (err) {
      // Reload to restore if delete failed
      load();
    }
  };

  return (
    <div>
      <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Messages</h2>
      <p style={{ color: '#a0a0b0', marginBottom: 32 }}>
        {messages.filter(m => !m.read).length} unread messages
      </p>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#a0a0b0', padding: 80 }}>
          <FiMail style={{ fontSize: 48, display: 'block', margin: '0 auto 16px' }} />
          No messages yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background: '#1a1a2e',
                border: `1px solid ${!msg.read ? '#6c63ff40' : '#2a2a3e'}`,
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {/* ── Message Header ── */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                }}
                onClick={() => handleExpand(msg)}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
                }}>
                  {msg.name[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{msg.name}</span>
                    {!msg.read && (
                      <span style={{ background: '#6c63ff', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                        NEW
                      </span>
                    )}
                    {msg.replied && (
                      <span style={{ background: '#43e97b20', color: '#43e97b', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                        REPLIED
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#a0a0b0', fontSize: 13 }}>
                    {msg.email} · {msg.subject || 'No subject'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#a0a0b0', fontSize: 12 }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={e => { e.stopPropagation(); handleDelete(msg._id); }}
                    style={{
                      background: '#ff658420', border: 'none', borderRadius: 8,
                      padding: 8, color: '#ff6584', cursor: 'pointer', fontSize: 16,
                    }}
                  >
                    <FiTrash2 />
                  </motion.button>
                  <span style={{ color: '#a0a0b0', fontSize: 18 }}>
                    {expanded === msg._id ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </div>
              </div>

              {/* ── Expanded Body ── */}
              <AnimatePresence>
                {expanded === msg._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 24px 24px', borderTop: '1px solid #2a2a3e' }}>
                      <p style={{ color: '#ccc', lineHeight: 1.8, padding: '20px 0', fontSize: 15 }}>
                        {msg.message}
                      </p>

                      {msg.adminReply && (
                        <div style={{
                          background: '#6c63ff15', border: '1px solid #6c63ff30',
                          borderRadius: 12, padding: 16, marginBottom: 16,
                        }}>
                          <div style={{ color: '#6c63ff', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                            YOUR REPLY
                          </div>
                          <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7 }}>{msg.adminReply}</p>
                        </div>
                      )}

                      {/* Success Toast */}
                      <AnimatePresence>
                        {successId === msg._id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            style={{
                              background: '#43e97b20', border: '1px solid #43e97b50',
                              borderRadius: 10, padding: '10px 16px', marginBottom: 12,
                              color: '#43e97b', fontSize: 13, fontWeight: 600,
                            }}
                          >
                            ✓ Reply sent! Email delivered to {msg.email}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Error Toast */}
                      <AnimatePresence>
                        {errorId === msg._id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            style={{
                              background: '#ff658420', border: '1px solid #ff658450',
                              borderRadius: 10, padding: '10px 16px', marginBottom: 12,
                              color: '#ff6584', fontSize: 13, fontWeight: 600,
                            }}
                          >
                            ✗ Failed to send. Check EMAIL_USER / EMAIL_PASS in .env
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Reply Input */}
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input
                          placeholder="Type your reply..."
                          value={replyText[msg._id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [msg._id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && !sending && handleReply(msg._id)}
                          style={{
                            flex: 1, background: '#12121a', border: '1px solid #2a2a3e',
                            borderRadius: 10, padding: '12px 14px', color: '#fff',
                            fontSize: 14, outline: 'none', fontFamily: 'inherit',
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: sending === msg._id ? 1 : 1.05 }}
                          whileTap={{ scale: sending === msg._id ? 1 : 0.95 }}
                          onClick={() => handleReply(msg._id)}
                          disabled={sending === msg._id}
                          style={{
                            background: sending === msg._id
                              ? '#333'
                              : 'linear-gradient(135deg, #6c63ff, #ff6584)',
                            border: 'none', borderRadius: 10, padding: '12px 20px',
                            color: '#fff',
                            cursor: sending === msg._id ? 'not-allowed' : 'pointer',
                            fontSize: 18, display: 'flex', alignItems: 'center',
                            transition: 'background 0.2s',
                          }}
                        >
                          {sending === msg._id
                            ? <span style={{ fontSize: 13, fontWeight: 700 }}>Sending...</span>
                            : <FiSend />
                          }
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
