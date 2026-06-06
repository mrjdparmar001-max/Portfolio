import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';
import { FiMenu, FiX } from 'react-icons/fi';

const navLinks = ['Home', 'About', 'Skills', 'Projects', 'Testimonials', 'Quiz', 'Contact'];

export default function Navbar() {
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase());
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          padding: '0 5%',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? theme.bgCard + 'ee' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${theme.border}` : 'none',
          transition: 'all 0.3s ease',
        }}
      >
      <motion.div
        whileHover={{ scale: 1.05 }}
        style={{
          fontSize: 22,
          fontWeight: 800,
          background: theme.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          cursor: 'pointer',
          fontFamily: "'Poppins', sans-serif",
        }}
        onClick={() => scrollTo('home')}
      >
        JD.
      </motion.div>

      <div className="desktop-nav" style={{ gap: 32, alignItems: 'center' }}>
        {navLinks.map(link => (
          <motion.button
            key={link}
            whileHover={{ y: -2 }}
            onClick={() => scrollTo(link)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 0.5,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = theme.primary}
            onMouseLeave={e => e.target.style.color = theme.textMuted}
          >
            {link}
          </motion.button>
        ))}
        <ThemeSwitcher />
      </div>

      <div className="mobile-nav" style={{ gap: 12, alignItems: 'center' }}>
        <ThemeSwitcher />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', color: theme.text, fontSize: 24, cursor: 'pointer' }}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </motion.button>
      </div>

      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 70,
              left: 0,
              right: 0,
              zIndex: 998,
              background: theme.bgCard,
              borderBottom: `1px solid ${theme.border}`,
              padding: '8px 5% 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              backdropFilter: 'blur(20px)',
            }}
          >
            {navLinks.map(link => (
              <motion.button
                key={link}
                whileHover={{ x: 8 }}
                onClick={() => scrollTo(link)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `1px solid ${theme.border}`,
                  color: theme.text,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                  padding: '14px 0',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {link}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
