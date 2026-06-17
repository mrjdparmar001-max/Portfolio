import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCompliments, approveCompliment, deleteCompliment } from '../api/api';
import { FiStar, FiCheck, FiTrash2, FiMessageSquare } from 'react-icons/fi';

const styles = {
  container: {
    padding: '0 0 40px',
    maxWidth: 900,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: 'clamp(22px, 5vw, 32px)',
    fontWeight: 800,
    marginBottom: 6,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#a0a0b0',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    background: '#f6c90e20',
    color: '#f6c90e',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 700,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: (approved) => ({
    background: '#1a1a2e',
    border: `1px solid ${approved ? '#43e97b30' : '#f6c90e30'}`,
    borderRadius: 16,
    padding: '20px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    boxSizing: 'border-box',
    width: '100%',
  }),
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    flexShrink: 0,
    background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
  },
  cardBody: {
    flex: 1,
    minWidth: 0, // prevents flex overflow
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  name: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    whiteSpace: 'nowrap',
  },
  statusBadge: (approved) => ({
    background: approved ? '#43e97b20' : '#f6c90e20',
    color: approved ? '#43e97b' : '#f6c90e',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  }),
  stars: {
    display: 'flex',
    gap: 2,
    marginLeft: 'auto',
  },
  message: {
    color: '#a0a0b0',
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: 'break-word',
  },
  date: {
    color: '#555',
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
    alignItems: 'flex-start',
  },
  approveBtn: {
    background: '#43e97b20',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#43e97b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: '#ff658420',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    color: '#ff6584',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    padding: '64px 24px',
    color: '#555',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.4,
    display: 'block',
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.96,
    transition: { duration: 0.22, ease: 'easeInOut' },
  },
};

export default function Compliments() {
  const [compliments, setCompliments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAllCompliments()
      .then((r) => setCompliments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

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

  const pendingCount = compliments.filter((c) => !c.approved).length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <motion.div
        style={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={styles.title}>Compliments</h2>
        <p style={styles.subtitle}>
          {pendingCount > 0 ? (
            <>
              <span style={styles.badge}>{pendingCount}</span>
              pending approval
            </>
          ) : (
            'All caught up!'
          )}
        </p>
      </motion.div>

      {/* Empty state */}
      {!loading && compliments.length === 0 && (
        <motion.div
          style={styles.empty}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <FiMessageSquare style={styles.emptyIcon} />
          <p style={{ color: '#a0a0b0', fontSize: 15 }}>No compliments yet.</p>
        </motion.div>
      )}

      {/* List */}
      <motion.div
        style={styles.list}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {compliments.map((c) => (
            <motion.div
              key={c._id}
              layout
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={styles.card(c.approved)}
            >
              {/* Avatar */}
              <div style={styles.avatar}>
                {c.name[0].toUpperCase()}
              </div>

              {/* Body */}
              <div style={styles.cardBody}>
                <div style={styles.metaRow}>
                  <span style={styles.name}>{c.name}</span>
                  <span style={styles.statusBadge(c.approved)}>
                    {c.approved ? 'APPROVED' : 'PENDING'}
                  </span>
                  <div style={styles.stars}>
                    {[...Array(5)].map((_, j) => (
                      <FiStar
                        key={j}
                        style={{
                          fontSize: 12,
                          color: j < c.rating ? '#f6c90e' : '#2a2a3e',
                          fill: j < c.rating ? '#f6c90e' : 'none',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <p style={styles.message}>"{c.message}"</p>
                <p style={styles.date}>
                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                {!c.approved && (
                  <motion.button
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleApprove(c._id)}
                    style={styles.approveBtn}
                    aria-label={`Approve compliment from ${c.name}`}
                  >
                    <FiCheck /> <span className="btn-label">Approve</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(c._id)}
                  style={styles.deleteBtn}
                  aria-label={`Delete compliment from ${c.name}`}
                >
                  <FiTrash2 />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Responsive overrides via a style tag */}
      <style>{`
        @media (max-width: 600px) {
          .btn-label { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
