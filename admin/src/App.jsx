import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Compliments from './pages/Compliments';
import Profile from './pages/Profile';
import Skills from './pages/Skills';
import { getProjects, getMessages, getAllCompliments } from './api/api';

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('admin-token'));
  const [active, setActive] = useState('dashboard');
  const [stats, setStats] = useState({ projects: 0, messages: 0, unread: 0, compliments: 0 });

  const loadStats = async () => {
    try {
      const [p, m, c] = await Promise.all([getProjects(), getMessages(), getAllCompliments()]);
      setStats({
        projects: p.data.length,
        messages: m.data.length,
        unread: m.data.filter(x => !x.read).length,
        compliments: c.data.filter(x => !x.approved).length,
      });
    } catch {}
  };

  useEffect(() => { if (authed) loadStats(); }, [authed]);

  const logout = () => { localStorage.removeItem('admin-token'); setAuthed(false); };

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const pages = { dashboard: <Dashboard stats={stats} />, projects: <Projects />, messages: <Messages onUpdate={loadStats} />, compliments: <Compliments />, skills: <Skills />, profile: <Profile /> };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        active={active}
        setActive={setActive}
        onLogout={logout}
        counts={{ messages: stats.unread, compliments: stats.compliments }}
      />
      <main style={{ marginLeft: 240, flex: 1, padding: 40, minHeight: '100vh' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {pages[active]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
