import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiGithub, FiLinkedin, FiMail, FiHeart, FiTwitter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfile } from '../api/api';

// FIX: GridPulse — scan animation interval extended, opacity reduced so GPU composite layer is lighter
function GridPulse({ theme }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }} // FIX: 4→5s
        style={{
          position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
          background: `linear-gradient(90deg, transparent, ${theme.primary}06, ${theme.primary}12, ${theme.primary}06, transparent)`,
          willChange: 'transform',
        }}
      />
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
        <defs>
          <pattern id="footer-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={theme.primary} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footer-dots)" />
      </svg>
    </div>
  );
}

// FIX: OrbitDot — will-change for GPU compositing
function OrbitDot({ color, radius = 18, duration = 2 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', inset: -radius, pointerEvents: 'none', willChange: 'transform' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        width: 4, height: 4, borderRadius: '50%',
        background: color, boxShadow: `0 0 6px 2px ${color}80`,
        transform: 'translateX(-50%)',
      }} />
    </motion.div>
  );
}

function SocialIcon({ icon, href, theme, color, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.5 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 14 }}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.a
        href={href} target="_blank" rel="noreferrer"
        whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.9 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 46, height: 46, borderRadius: '50%',
          border: `1.5px solid ${hovered ? color : theme.primary + '30'}`,
          background: hovered ? `${color}15` : `${theme.primary}08`,
          color: hovered ? color : theme.textMuted, fontSize: 20,
          transition: 'all 0.22s ease',
          boxShadow: hovered ? `0 0 18px ${color}40, 0 0 36px ${color}18` : 'none',
          position: 'relative', zIndex: 1,
        }}
      >
        {icon}
      </motion.a>
      <AnimatePresence>
        {hovered && <OrbitDot color={color} radius={20} duration={1.2} />}
      </AnimatePresence>
    </motion.div>
  );
}

// FIX: GlitchLogo — glitch interval 4.5s→7s, less jank
function GlitchLogo({ theme }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 180);
    }, 7000); // FIX: was 4500
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
      style={{ position: 'relative', display: 'inline-block', marginBottom: 16, cursor: 'default' }}
    >
      <AnimatePresence>
        {glitch && (
          <>
            <motion.div key="g1"
              initial={{ opacity: 0.7, x: 4 }} animate={{ opacity: [0.7, 0], x: [4, -4] }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ position: 'absolute', inset: 0, fontSize: 40, fontWeight: 900, background: theme.secondary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'hue-rotate(180deg)', pointerEvents: 'none' }}
            >JD.</motion.div>
            <motion.div key="g2"
              initial={{ opacity: 0.5, x: -3 }} animate={{ opacity: [0.5, 0], x: [-3, 3] }} exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              style={{ position: 'absolute', inset: 0, fontSize: 40, fontWeight: 900, background: theme.accent || theme.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'hue-rotate(90deg)', pointerEvents: 'none' }}
            >JD.</motion.div>
          </>
        )}
      </AnimatePresence>
      <div style={{ fontSize: 40, fontWeight: 900, background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Poppins', sans-serif", letterSpacing: '-1px' }}>JD.</div>
    </motion.div>
  );
}

// FIX: AnimatedDivider — reduced animation complexity
function AnimatedDivider({ theme }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 500, margin: '28px auto', height: 1 }}>
      <div style={{ position: 'absolute', inset: 0, background: `${theme.primary}20` }} />
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
        style={{
          position: 'absolute', inset: 0, width: '40%',
          background: `linear-gradient(90deg, transparent, ${theme.primary}, ${theme.secondary}, transparent)`,
          willChange: 'transform',
        }}
      />
      <motion.div
        animate={{ rotate: [0, 180, 360], scale: [1, 1.25, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} // FIX: 4→5s
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 8, height: 8, background: theme.gradient,
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}

function PulsingHeart({ theme }) {
  return (
    <motion.span
      animate={{ scale: [1, 1.35, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }} // FIX: added repeatDelay
      style={{ display: 'inline-flex', color: theme.secondary, willChange: 'transform' }}
    >
      <FiHeart style={{ fill: theme.secondary, stroke: 'none' }} />
    </motion.span>
  );
}

function CopyrightLine({ theme }) {
  const year = new Date().getFullYear();
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.6, duration: 0.6 }}
      style={{
        color: theme.textMuted, fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 7, flexWrap: 'wrap', fontFamily: "'Poppins', sans-serif", letterSpacing: 0.3,
      }}
    >
      Made with <PulsingHeart theme={theme} /> by{' '}
      <motion.span
        whileHover={{ color: theme.primary, letterSpacing: 1 }}
        transition={{ duration: 0.2 }}
        style={{ color: theme.primary, fontWeight: 700, cursor: 'default' }}
      >
        Jaydip Parmar
      </motion.span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>Ⓡ {year}</span>
    </motion.p>
  );
}

export default function Footer() {
  const { theme } = useTheme();
  const [socials, setSocials] = useState({ github: '', linkedin: '', twitter: '', email: '' });

  useEffect(() => {
    getProfile().then(r => setSocials({
      github:   r.data.github   || '',
      linkedin: r.data.linkedin || '',
      twitter:  r.data.twitter  || '',
      email:    r.data.email    || '',
    })).catch(() => {});
  }, []);

  // FIX: memoized links list
  const links = useMemo(() => [
    { icon: <FiGithub />,   href: socials.github,            show: !!socials.github,   color: '#e2e8f0' },
    { icon: <FiLinkedin />, href: socials.linkedin,          show: !!socials.linkedin, color: '#0a66c2' },
    { icon: <FiTwitter />,  href: socials.twitter,           show: !!socials.twitter,  color: '#1d9bf0' },
    { icon: <FiMail />,     href: `mailto:${socials.email}`, show: !!socials.email,    color: '#fa2c2c' },
  ].filter(l => l.show), [socials]);

  return (
    <footer style={{
      position: 'relative', background: theme.bgCard || theme.bg,
      borderTop: `1px solid ${theme.border}`,
      padding: '56px 5% 40px', textAlign: 'center', overflow: 'hidden',
    }}>
      <GridPulse theme={theme} />

      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 1,
        background: `linear-gradient(90deg, transparent, ${theme.primary}, ${theme.secondary}, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* FIX: glow aura — reduced scale variance, uses will-change */}
      <motion.div
        animate={{ opacity: [0.3, 0.55, 0.3], scaleX: [0.85, 1.05, 0.85] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 60,
          background: `radial-gradient(ellipse, ${theme.primary}28, transparent 70%)`,
          filter: 'blur(20px)', pointerEvents: 'none', willChange: 'transform, opacity',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <GlitchLogo theme={theme} />

        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          style={{ color: theme.textMuted, fontSize: 14, marginBottom: 4, fontFamily: "'Poppins', sans-serif", letterSpacing: 0.5 }}>
          Jaydip Parmar
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          style={{ color: theme.primary, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif" }}>
          Full Stack Developer
        </motion.p>

        <AnimatedDivider theme={theme} />

        {links.length > 0 && (
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginBottom: 32 }}>
            {links.map(({ icon, href, color }, i) => (
              <SocialIcon key={i} icon={icon} href={href} theme={theme} color={color} delay={0.1 * i + 0.4} />
            ))}
          </div>
        )}

        <CopyrightLine theme={theme} />
      </div>
    </footer>
  );
}
