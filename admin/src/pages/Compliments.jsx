import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCompliments, approveCompliment, deleteCompliment } from '../api/api';
import { FiStar, FiCheck, FiTrash2, FiMessageSquare } from 'react-icons/fi';

/* ─── Animation variants ─────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 26 } },
  exit:    { opacity: 0, x: -24, scale: 0.96,
    transition: { duration: 0.2, ease: 'easeInOut' } },
};

/* ─── Component ──────────────────────────────────────────────────── */
export default function Compliments() {
  const [compliments, setCompliments] = useState([]);
  const [loading, setLoading]         = useState(true);

  const load = () => {
    setLoading(true);
    getAllCompliments()
      .then((r) => setCompliments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => { await approveCompliment(id); load(); };
  const handleDelete  = async (id) => {
    if (!confirm('Delete this compliment?')) return;
    await deleteCompliment(id); load();
  };

  const pendingCount = compliments.filter((c) => !c.approved).length;

  return (
    <div className="cp-root">

      {/* ── Header ── */}
      <motion.div
        className="cp-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="cp-title">Compliments</h2>
        <p className="cp-subtitle">
          {pendingCount > 0
            ? <><span className="cp-badge-pending">{pendingCount}</span> pending approval</>
            : 'All caught up!'}
        </p>
      </motion.div>

      {/* ── Empty state ── */}
      {!loading && compliments.length === 0 && (
        <motion.div
          className="cp-empty"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <FiMessageSquare className="cp-empty-icon" />
          <p>No compliments yet.</p>
        </motion.div>
      )}

      {/* ── List ── */}
      <motion.div
        className="cp-list"
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
              className={`cp-card ${c.approved ? 'cp-card--approved' : 'cp-card--pending'}`}
            >

              {/* Row 1 — avatar · name · actions */}
              <div className="cp-row1">
                <div className="cp-avatar">
                  {c.name[0].toUpperCase()}
                </div>

                <span className="cp-name">{c.name}</span>

                {/* actions flush-right on mobile, inline on desktop */}
                <div className="cp-actions">
                  {!c.approved && (
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.93 }}
                      className="cp-btn cp-btn--approve"
                      onClick={() => handleApprove(c._id)}
                      aria-label={`Approve ${c.name}`}
                    >
                      <FiCheck />
                      <span className="cp-btn-label">Approve</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    className="cp-btn cp-btn--delete"
                    onClick={() => handleDelete(c._id)}
                    aria-label={`Delete ${c.name}`}
                  >
                    <FiTrash2 />
                  </motion.button>
                </div>
              </div>

              {/* Row 2 — status badge · stars */}
              <div className="cp-row2">
                <span className={`cp-status ${c.approved ? 'cp-status--approved' : 'cp-status--pending'}`}>
                  {c.approved ? 'APPROVED' : 'PENDING'}
                </span>
                <div className="cp-stars">
                  {[...Array(5)].map((_, j) => (
                    <FiStar
                      key={j}
                      className={`cp-star ${j < c.rating ? 'cp-star--filled' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Message */}
              <p className="cp-message">"{c.message}"</p>

              {/* Date */}
              <p className="cp-date">
                {new Date(c.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>

            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Styles ── */}
      <style>{`
        /* Base */
        .cp-root {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 0 48px;
          box-sizing: border-box;
        }

        /* Header */
        .cp-header   { margin-bottom: 28px; }
        .cp-title    { color: #fff; font-size: clamp(20px, 5vw, 30px); font-weight: 800; margin: 0 0 6px; letter-spacing: -0.4px; }
        .cp-subtitle { color: #a0a0b0; font-size: 14px; display: flex; align-items: center; gap: 6px; margin: 0; }
        .cp-badge-pending {
          background: #f6c90e20; color: #f6c90e;
          border-radius: 20px; padding: 2px 10px;
          font-size: 12px; font-weight: 700;
        }

        /* Empty */
        .cp-empty      { text-align: center; padding: 60px 16px; color: #555; }
        .cp-empty-icon { font-size: 44px; opacity: 0.35; display: block; margin: 0 auto 12px; }
        .cp-empty p    { color: #a0a0b0; font-size: 15px; margin: 0; }

        /* List */
        .cp-list { display: flex; flex-direction: column; gap: 10px; }

        /* Card */
        .cp-card {
          background: #1a1a2e;
          border-radius: 16px;
          padding: 16px;
          box-sizing: border-box;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cp-card--approved { border: 1px solid #43e97b30; }
        .cp-card--pending  { border: 1px solid #f6c90e30; }

        /* Row 1: avatar · name · actions */
        .cp-row1 {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          min-width: 0;
        }

        .cp-avatar {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #6c63ff, #ff6584);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 15px;
        }

        .cp-name {
          color: #fff; font-weight: 700; font-size: 15px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          flex: 1; min-width: 0;
        }

        /* Actions — always right-aligned */
        .cp-actions { display: flex; gap: 6px; flex-shrink: 0; margin-left: auto; }

        .cp-btn {
          border: none; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 4px; font-size: 13px; font-weight: 600;
          padding: 7px 10px;
        }
        .cp-btn--approve { background: #43e97b20; color: #43e97b; }
        .cp-btn--delete  { background: #ff658420; color: #ff6584; font-size: 15px; }

        /* Row 2: status · stars */
        .cp-row2 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .cp-status {
          border-radius: 20px; padding: 2px 10px;
          font-size: 11px; font-weight: 700;
        }
        .cp-status--approved { background: #43e97b20; color: #43e97b; }
        .cp-status--pending  { background: #f6c90e20; color: #f6c90e;  }

        .cp-stars  { display: flex; gap: 2px; }
        .cp-star   { font-size: 12px; color: #2a2a3e; fill: none; flex-shrink: 0; }
        .cp-star--filled { color: #f6c90e; fill: #f6c90e; }

        /* Message & date */
        .cp-message { color: #a0a0b0; font-size: 13.5px; line-height: 1.7; margin: 0; word-break: break-word; }
        .cp-date    { color: #555; font-size: 12px; margin: 0; }

        /* ── 375 px and below: hide "Approve" text, icon only ── */
        @media (max-width: 375px) {
          .cp-btn-label { display: none; }
          .cp-btn       { padding: 7px 9px; }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
