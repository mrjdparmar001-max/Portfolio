import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';
import { FiMenu, FiX } from 'react-icons/fi';

const NAV_LINKS = ['Home', 'About', 'Skills', 'Projects', 'Testimonials', 'Quiz', 'Contact'];

// ── Magnetic cursor dot that follows the hovered nav link ──────────────────
function MagneticDot({ theme }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 28 });
  const springY = useSpring(y, { stiffness: 300, damping: 28 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const buttons = document.querySelectorAll('.nav-link-btn');
    const handlers = [];
    buttons.forEach(btn => {
      const enter = () => {
        const r = btn.getBoundingClientRect();
        x.set(r.left + r.width / 2);
        y.set(r.bottom + 6);
        setVisible(true);
      };
      const leave = () => setVisible(false);
      btn.addEventListener('mouseenter', enter);
      btn.addEventListener('mouseleave', leave);
      handlers.push({ btn, enter, leave });
    });
    return () => handlers.forEach(({ btn, enter, leave }) => {
      btn.removeEventListener('mouseenter', enter);
      btn.removeEventListener('mouseleave', leave);
    });
  }, [x, y]);

  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none',
        zIndex: 9999, x: springX, y: springY,
        translateX: '-50%',
      }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: theme.primary,
        boxShadow: `0 0 12px 3px ${theme.primary}88`,
      }} />
    </motion.div>
  );
}

// ── Animated active section indicator ─────────────────────────────────────
function useActiveSection() {
  const [active, setActive] = useState('home');
  useEffect(() => {
    const ids = NAV_LINKS.map(l => l.toLowerCase());
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return active;
}

export default function Navbar() {
  const { theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection();
  const navRef = useRef(null);

  // Scroll listener — progress bar + blur trigger
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled_ = window.scrollY > 50;
          setScrolled(scrolled_);
          const docH = document.documentElement.scrollHeight - window.innerHeight;
          setScrollProgress(docH > 0 ? window.scrollY / docH : 0);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id.toLowerCase());
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMenuOpen(false);
  }, []);

  const navStyle = useMemo(() => ({
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
    padding: '0 5%', height: 70,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: scrolled ? theme.bgCard + 'f0' : 'transparent',
    backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
    borderBottom: scrolled ? `1px solid ${theme.border}` : 'none',
    transition: 'background 0.4s ease, border-bottom 0.4s ease, backdrop-filter 0.4s ease',
  }), [scrolled, theme.bgCard, theme.border]);

  // Stagger children on mount
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
  };
  const linkVariants = {
    hidden: { opacity: 0, y: -14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  };

  return (
    <>
      {/* ── Scroll progress bar ── */}
      <motion.div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2,
        zIndex: 1000, transformOrigin: '0%',
        background: theme.gradient,
        scaleX: scrollProgress,
      }} />

      <MagneticDot theme={theme} />

      <motion.nav
        ref={navRef}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={navStyle}
      >
        {/* ── Logo ── */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scrollTo('home')}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <motion.span
            style={{
              fontSize: 26, fontWeight: 900,
              background: theme.gradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: -1,
              display: 'block',
            }}
          >
            JD.
          </motion.span>
          {/* glowing underline on logo */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute', bottom: -3, left: 0, right: 0,
              height: 2, background: theme.gradient,
              borderRadius: 2, transformOrigin: 'left',
            }}
          />
        </motion.div>

        {/* ── Desktop nav links ── */}
        <motion.div
          className="desktop-nav"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          {NAV_LINKS.map(link => {
            const isActive = active === link.toLowerCase();
            return (
              <motion.div key={link} variants={linkVariants} style={{ position: 'relative' }}>
                <motion.button
                  className="nav-link-btn"
                  onClick={() => scrollTo(link)}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    background: 'none', border: 'none',
                    color: isActive ? theme.primary : theme.textMuted,
                    cursor: 'pointer', fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                    letterSpacing: 0.4, padding: '8px 12px', borderRadius: 8,
                    position: 'relative', overflow: 'hidden',
                    transition: 'color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = theme.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive ? theme.primary : theme.textMuted; }}
                >
                  {/* Hover pill background */}
                  <motion.span
                    layoutId="nav-hover-bg"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 8,
                      background: theme.primary + '18',
                      zIndex: 0,
                      pointerEvents: 'none',
                      opacity: 0,
                    }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                  />
                  <span style={{ position: 'relative', zIndex: 1 }}>{link}</span>
                </motion.button>

                {/* Active underline dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-dot"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      style={{
                        position: 'absolute', bottom: -2, left: '50%',
                        translateX: '-50%',
                        width: 18, height: 3, borderRadius: 2,
                        background: theme.gradient,
                        boxShadow: `0 0 8px ${theme.primary}99`,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          <motion.div variants={linkVariants}>
            <ThemeSwitcher />
          </motion.div>
        </motion.div>

        {/* ── Mobile controls ── */}
        <div className="mobile-nav" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeSwitcher />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88, rotate: menuOpen ? -90 : 90 }}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: menuOpen ? theme.primary + '22' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${menuOpen ? theme.primary + '55' : theme.border}`,
              borderRadius: 10, width: 42, height: 42,
              color: menuOpen ? theme.primary : theme.text,
              fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {menuOpen ? <FiX /> : <FiMenu />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, top: 70, zIndex: 996,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
              }}
            />

            {/* drawer panel */}
            <motion.div
              initial={{ opacity: 0, y: -16, scaleY: 0.92 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -16, scaleY: 0.92 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed', top: 70, left: '5%', right: '5%', zIndex: 997,
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: 18,
                padding: '10px 0 16px',
                backdropFilter: 'blur(24px)',
                boxShadow: `0 24px 60px rgba(0,0,0,0.35), 0 0 0 1px ${theme.border}`,
                transformOrigin: 'top center',
                overflow: 'hidden',
              }}
            >
              {/* thin gradient top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: theme.gradient,
              }} />

              {NAV_LINKS.map((link, i) => {
                const isActive = active === link.toLowerCase();
                return (
                  <motion.button
                    key={link}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.045, duration: 0.2 }}
                    whileTap={{ scale: 0.97, x: 6 }}
                    onClick={() => scrollTo(link)}
                    style={{
                      width: '100%', background: isActive ? theme.primary + '14' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${theme.primary}` : '3px solid transparent',
                      color: isActive ? theme.primary : theme.text,
                      cursor: 'pointer', fontSize: 15,
                      fontWeight: isActive ? 700 : 500,
                      padding: '13px 22px',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      letterSpacing: 0.3,
                      transition: 'background 0.15s, color 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = theme.primary + '0e'; e.currentTarget.style.color = theme.primary; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.text; } }}
                  >
                    <span>{link}</span>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-active"
                        style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: theme.primary,
                          boxShadow: `0 0 8px ${theme.primary}`,
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Responsive CSS ── */}
      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-nav  { display: none  !important; }

        @media (max-width: 768px) {
          .desktop-nav { display: none  !important; }
          .mobile-nav  { display: flex  !important; }
        }
      `}</style>
    </>
  );
}
