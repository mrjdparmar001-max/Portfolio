import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllCompliments, approveCompliment, deleteCompliment } from '../api/api';
import { FiStar, FiCheck, FiTrash2 } from 'react-icons/fi';

export default function Compliments() {
  const [compliments, setCompliments] = useState([]);

  const load = () => getAllCompliments().then(r => setCompliments(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    await approveCompliment(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this compliment?')) return;
    await deleteCompliment(id);
    load();
  };

  return (
    <div>
      <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Compliments</h2>
      <p style={{ color: '#a0a0b0', marginBottom: 32 }}>
        {compliments.filter(c => !c.approved).length} pending approval
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {compliments.map((c, i) => (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: '#1a1a2e',
              border: `1px solid ${c.approved ? '#43e97b30' : '#f6c90e30'}`,
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16,
            }}>
              {c.name[0].toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>{c.name}</span>
                <span style={{
                  background: c.approved ? '#43e97b20' : '#f6c90e20',
                  color: c.approved ? '#43e97b' : '#f6c90e',
                  borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                }}>
                  {c.approved ? 'APPROVED' : 'PENDING'}
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, j) => (
                    <FiStar key={j} style={{ fontSize: 12, color: j < c.rating ? '#f6c90e' : '#2a2a3e', fill: j < c.rating ? '#f6c90e' : 'none' }} />
                  ))}
                </div>
              </div>
              <p style={{ color: '#a0a0b0', fontSize: 14, lineHeight: 1.7 }}>"{c.message}"</p>
              <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>{new Date(c.createdAt).toLocaleDateString()}</p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {!c.approved && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleApprove(c._id)}
                  style={{ background: '#43e97b20', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#43e97b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
                >
                  <FiCheck /> Approve
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => handleDelete(c._id)}
                style={{ background: '#ff658420', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#ff6584', cursor: 'pointer', fontSize: 16 }}
              >
                <FiTrash2 />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
