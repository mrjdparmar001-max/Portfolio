import { motion } from 'framer-motion';
import { FiGrid, FiFolder, FiMail, FiStar, FiLogOut, FiUser, FiCode } from 'react-icons/fi';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiGrid /> },
  { id: 'projects', label: 'Projects', icon: <FiFolder /> },
  { id: 'messages', label: 'Messages', icon: <FiMail /> },
  { id: 'compliments', label: 'Compliments', icon: <FiStar /> },
  { id: 'skills', label: 'Tech Stack', icon: <FiCode /> },
  { id: 'profile', label: 'Profile', icon: <FiUser /> },
];

export default function Sidebar({ active, setActive, onLogout, counts }) {
  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      style={{
        width: 240,
        minHeight: '100vh',
        background: '#12121a',
        borderRight: '1px solid #2a2a3e',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #2a2a3e' }}>
        <div style={{
          fontSize: 24, fontWeight: 900,
          background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          JD Admin
        </div>
        <div style={{ color: '#a0a0b0', fontSize: 12, marginTop: 4 }}>Portfolio Manager</div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {navItems.map(({ id, label, icon }) => (
          <motion.button
            key={id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActive(id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: active === id ? 'linear-gradient(135deg, #6c63ff20, #ff658420)' : 'transparent',
              color: active === id ? '#6c63ff' : '#a0a0b0',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: active === id ? 700 : 500,
              marginBottom: 4,
              textAlign: 'left',
              borderLeft: active === id ? '3px solid #6c63ff' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            {label}
            {counts?.[id] > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#ff6584',
                color: '#fff',
                borderRadius: 20,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {counts[id]}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid #2a2a3e' }}>
        <motion.button
          whileHover={{ x: 4 }}
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            background: 'transparent',
            color: '#ff6584',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <FiLogOut /> Logout
        </motion.button>
      </div>
    </motion.aside>
  );
}
