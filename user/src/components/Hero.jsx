import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TypeAnimation } from 'react-type-animation';
import { useTheme } from '../context/ThemeContext';
import { FiGithub, FiLinkedin, FiMail, FiDownload, FiTwitter } from 'react-icons/fi';
import { getProfile } from '../api/api';

const BASE = 'http://localhost:5000';

// ─── Floating Particle ───────────────────────────────────────────────────────
function Particle({ theme, index }) {
  const size = 3 + Math.random() * 5;
  const startX = Math.random() * 100;
  const duration = 8 + Math.random() * 12;
  const delay = Math.random() * 6;
  const colors = [theme.primary, theme.secondary, theme.accent];
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: '100vh', x: `${startX}vw` }}
      animate={{
        opacity: [0, 0.8, 0.8, 0],
        y: [null, '-10vh'],
        x: [`${startX}vw`, `${startX + (Math.random() - 0.5) * 20}vw`],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
      style={{
        position: 'absolute', width: size, height: size, borderRadius: '50%',
        background: color, filter: `blur(${size > 6 ? 2 : 0}px)`,
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}

// ─── 3D Holographic Ring ─────────────────────────────────────────────────────
function HoloRing({ theme, size, opacity, delay, rotateDir = 1 }) {
  return (
    <motion.div
      animate={{ rotateZ: [0, 360 * rotateDir] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay }}
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: '50%',
        border: `1px solid ${theme.primary}${Math.round(opacity * 255).toString(16).padStart(2, '00')}`,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── 3D Avatar Viewer ────────────────────────────────────────────────────────
function Avatar3D({ theme, avatar, avatarRef, x, y, rotateX, rotateY }) {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      ref={avatarRef}
      initial={{ opacity: 0, scale: 0.7, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.5, type: 'spring', stiffness: 60 }}
      style={{ position: 'relative', flexShrink: 0, width: 360, height: 460 }}
    >
      <HoloRing theme={theme} size={420} opacity={0.25} delay={0} rotateDir={1} />
      <HoloRing theme={theme} size={380} opacity={0.15} delay={2} rotateDir={-1} />
      <HoloRing theme={theme} size={340} opacity={0.1}  delay={1} rotateDir={1} />

      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ rotateZ: [0, 360 * (i % 2 === 0 ? 1 : -1)] }}
          transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear', delay: i * 1.5 }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 400 - i * 40, height: 400 - i * 40,
            marginTop: -(200 - i * 20), marginLeft: -(200 - i * 20),
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              position: 'absolute', top: 0, left: '50%',
              width: 6 + i * 2, height: 6 + i * 2, borderRadius: '50%',
              background: i === 0 ? theme.primary : i === 1 ? theme.secondary : theme.accent,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 10px 3px ${i === 0 ? theme.primary : i === 1 ? theme.secondary : theme.accent}60`,
            }}
          />
        </motion.div>
      ))}

      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -30,
          background: `radial-gradient(ellipse at 50% 75%, ${theme.primary}50, ${theme.secondary}25, transparent 65%)`,
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none',
        }}
      />

      <motion.div
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        style={{
          position: 'absolute', left: 0, right: 0, height: 80,
          background: `linear-gradient(to bottom, transparent, ${theme.primary}18, ${theme.primary}35, ${theme.primary}18, transparent)`,
          zIndex: 3, pointerEvents: 'none', borderRadius: 16,
        }}
      />

      <motion.div
        style={{
          rotateX, rotateY, transformStyle: 'preserve-3d',
          position: 'relative', zIndex: 2, width: '100%', height: '100%',
        }}
      >
        <motion.div
          animate={{ scaleX: [1, 1.05, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%) translateZ(-20px)',
            width: 200, height: 16,
            background: `radial-gradient(ellipse, ${theme.primary}50, transparent 70%)`,
            filter: 'blur(6px)', pointerEvents: 'none',
          }}
        />

        <AnimatePresence>
          {glitching && (
            <>
              <motion.img
                key="glitch-r"
                src={avatar ? BASE + avatar : 'https://api.dicebear.com/9.x/avataaars/svg?seed=JaydipParmar&backgroundColor=transparent&style=transparent&accessories=prescription02&clothing=blazerAndShirt&eyes=happy&eyebrows=default&facialHair=beardMedium&facialHairColor=2c1b18&hair=short02&hairColor=2c1b18&skinColor=f8d25c'}
                initial={{ opacity: 0.7, x: 6, filter: 'hue-rotate(180deg) saturate(3)' }}
                animate={{ opacity: [0.7, 0], x: [6, -6] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'contain', objectPosition: 'bottom center',
                  mixBlendMode: 'screen', zIndex: 4, pointerEvents: 'none',
                }}
              />
              <motion.img
                key="glitch-b"
                src={avatar ? BASE + avatar : 'https://api.dicebear.com/9.x/avataaars/svg?seed=JaydipParmar&backgroundColor=transparent&style=transparent&accessories=prescription02&clothing=blazerAndShirt&eyes=happy&eyebrows=default&facialHair=beardMedium&facialHairColor=2c1b18&hair=short02&hairColor=2c1b18&skinColor=f8d25c'}
                initial={{ opacity: 0.5, x: -4, filter: 'hue-rotate(0deg) saturate(3)' }}
                animate={{ opacity: [0.5, 0], x: [-4, 4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'contain', objectPosition: 'bottom center',
                  mixBlendMode: 'screen', zIndex: 4, pointerEvents: 'none',
                }}
              />
            </>
          )}
        </AnimatePresence>

        <motion.img
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          src={avatar ? BASE + avatar : 'https://api.dicebear.com/9.x/avataaars/svg?seed=JaydipParmar&backgroundColor=transparent&style=transparent&accessories=prescription02&clothing=blazerAndShirt&eyes=happy&eyebrows=default&facialHair=beardMedium&facialHairColor=2c1b18&hair=short02&hairColor=2c1b18&skinColor=f8d25c'}
          alt="Jaydip Parmar"
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain', objectPosition: 'bottom center',
            display: 'block', background: 'none',
            filter: `drop-shadow(0 20px 60px ${theme.primary}50) drop-shadow(0 0 30px ${theme.secondary}30)`,
            transform: 'translateZ(30px)', position: 'relative', zIndex: 2,
          }}
        />
      </motion.div>

      {[
        { label: 'React',   icon: '⚛️', x: -70,                   y: '20%', delay: 1.2 },
        { label: 'Node.js', icon: '🟢', x: 'calc(100% + 10px)',   y: '25%', delay: 1.5 },
        { label: 'MERN',    icon: '🛢️', x: -55,                   y: '65%', delay: 1.8 },
        { label: 'UI/UX',   icon: '🎨', x: 'calc(100% + 15px)',   y: '60%', delay: 2.1 },
      ].map(({ label, icon, x: bx, y: by, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0, x: typeof bx === 'number' ? bx + (bx < 0 ? -20 : 20) : bx }}
          animate={{ opacity: 1, scale: 1, x: bx }}
          transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.12, zIndex: 10 }}
          style={{
            position: 'absolute',
            top: by, left: typeof bx === 'string' ? bx : undefined,
            background: `linear-gradient(135deg, ${theme.cardBg || theme.bg}ee, ${theme.cardBg || theme.bg}cc)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.primary}40`, borderRadius: 50,
            padding: '6px 14px', fontSize: 12, fontWeight: 700,
            color: theme.primary, display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: `0 4px 24px ${theme.primary}20`,
            whiteSpace: 'nowrap', zIndex: 5, cursor: 'default', userSelect: 'none',
          }}
        >
          <motion.span
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          >
            {icon}
          </motion.span>
          {label}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 2.5, type: 'spring', stiffness: 200 }}
        style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${theme.cardBg || theme.bg}ee, ${theme.cardBg || theme.bg}dd)`,
          backdropFilter: 'blur(12px)', border: `1px solid #22c55e50`, borderRadius: 50,
          padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#22c55e',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 24px #22c55e25', whiteSpace: 'nowrap', zIndex: 5,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}
        />
        Available for work
      </motion.div>
    </motion.div>
  );
}

// ─── Orbit dot (from Footer logic) ───────────────────────────────────────────
function OrbitDot({ color, radius = 18, duration = 1.4 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', inset: -radius, pointerEvents: 'none' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        width: 4, height: 4, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px 2px ${color}80`,
        transform: 'translateX(-50%)',
      }} />
    </motion.div>
  );
}

// ─── Social icon with brand color + orbit on hover ────────────────────────────
function SocialIconHero({ icon, href, theme, color, delay }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 14 }}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.a
        href={href}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.2, y: -5 }}
        whileTap={{ scale: 0.9 }}
        style={{
          color: hovered ? color : theme.textMuted,
          fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 42, height: 42,
          padding: 0, borderRadius: 10,
          border: `1px solid ${hovered ? color + '60' : theme.primary + '20'}`,
          background: hovered ? `${color}15` : `${theme.primary}08`,
          boxShadow: hovered ? `0 0 20px ${color}40, 0 0 40px ${color}20` : 'none',
          transition: 'all 0.22s ease',
          position: 'relative', zIndex: 1,
        }}
      >
        {icon}
      </motion.a>
      <AnimatePresence>
        {hovered && <OrbitDot color={color} radius={18} duration={1.2} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Hero ───────────────────────────────────────────────────────────────
export default function Hero() {
  const { theme } = useTheme();
  const [resumeUrl, setResumeUrl] = useState('');
  const [avatar, setAvatar] = useState('');
  const [socials, setSocials] = useState({ github: '', linkedin: '', twitter: '', email: '' });
  const avatarRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-80, 80], [20, -20]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-80, 80], [-20, 20]), { stiffness: 180, damping: 18 });

  const handleMouseMove = useCallback((e) => {
    const rect = avatarRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  useEffect(() => {
    getProfile().then(r => {
      setResumeUrl(r.data.resume || '');
      setAvatar(r.data.avatar || '');
      setSocials({
        github:   r.data.github   || '',
        linkedin: r.data.linkedin || '',
        twitter:  r.data.twitter  || '',
        email:    r.data.email    || '',
      });
    }).catch(() => {});
  }, []);

  // Brand colors matching Footer logic
  const socialList = [
    { icon: <FiGithub />,   href: socials.github,            show: !!socials.github,   color: '#e2e8f0' },
    { icon: <FiLinkedin />, href: socials.linkedin,          show: !!socials.linkedin, color: '#0a66c2' },
    { icon: <FiTwitter />,  href: socials.twitter,           show: !!socials.twitter,  color: '#1d9bf0' },
    { icon: <FiMail />,     href: `mailto:${socials.email}`, show: !!socials.email,    color: '#ef4444' },
  ].filter(s => s.show);

  return (
    <section
      id="home"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '80px 5% 0', position: 'relative', overflow: 'hidden',
        background: theme.bg,
      }}
    >
      {/* Animated particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(18)].map((_, i) => <Particle key={i} theme={theme} index={i} />)}
      </div>

      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[
          { w: 600, h: 600, top: '-15%', left: '55%', color: theme.primary + '12', duration: 18 },
          { w: 500, h: 500, top: '35%',  left: '-8%', color: theme.secondary + '0e', duration: 22 },
          { w: 450, h: 450, top: '55%',  left: '65%', color: theme.accent + '0a',    duration: 25 },
        ].map((b, i) => (
          <motion.div
            key={i}
            animate={{ x: [0, 80, -40, 0], y: [0, -60, 50, 0], scale: [1, 1.15, 0.92, 1] }}
            transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(90px)',
              width: b.w, height: b.h, background: b.color,
              top: b.top, left: b.left,
            }}
          />
        ))}
      </div>

      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(${theme.primary}06 1px, transparent 1px), linear-gradient(90deg, ${theme.primary}06 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Main content */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 60, width: '100%',
        maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap', position: 'relative', zIndex: 1,
      }}>

        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          style={{ flex: 1, minWidth: 300 }}
        >
          {/* Greeting pill */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}10)`,
              border: `1px solid ${theme.primary}30`, borderRadius: 50,
              padding: '6px 18px', marginBottom: 20,
            }}
          >
            <motion.span
              animate={{ rotate: [0, 20, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              style={{ fontSize: 18 }}
            >
              👋
            </motion.span>
            <span style={{ color: theme.primary, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              Hello, I'm
            </span>
          </motion.div>

          {/* Animated name */}
          <h1 style={{
            fontSize: 'clamp(28px, 7vw, 76px)', fontWeight: 900, lineHeight: 1.05,
            marginBottom: 18, fontFamily: "'Poppins', sans-serif",
            display: 'flex', flexWrap: 'nowrap', gap: '0 2px', whiteSpace: 'nowrap',
          }}>
            {'Jaydip Parmar'.split('').map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 70, rotateX: -90, scale: 0.4 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05, type: 'spring', stiffness: 200, damping: 16 }}
                whileHover={{ scale: 1.4, y: -10, transition: { type: 'spring', stiffness: 500, damping: 8 } }}
                style={{
                  display: 'inline-block',
                  background: theme.gradient,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  cursor: 'default', transformOrigin: 'bottom center',
                  whiteSpace: char === ' ' ? 'pre' : 'normal',
                  minWidth: char === ' ' ? '0.4em' : undefined,
                  filter: `drop-shadow(0 0 20px ${theme.primary}40)`,
                }}
              >
                {char === ' ' ? '\u00a0' : char}
              </motion.span>
            ))}
          </h1>

          {/* Role typewriter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: 'clamp(18px, 2.5vw, 28px)', marginBottom: 24, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 3, height: '1.2em', background: theme.primary, borderRadius: 2 }}
            />
            <TypeAnimation
              sequence={['Full Stack Developer', 2000, 'MERN Stack Expert', 2000, 'UI/UX Enthusiast', 2000, 'Problem Solver', 2000]}
              repeat={Infinity}
              style={{ color: theme.secondary }}
            />
          </motion.div>

          {/* Bio */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ color: theme.textMuted, fontSize: 16, lineHeight: 1.9, maxWidth: 500, marginBottom: 36 }}
          >
            Passionate developer crafting beautiful, performant web experiences.
            I turn ideas into reality with clean code and creative design.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}
          >
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: `0 0 40px ${theme.primary}55` }}
              whileTap={{ scale: 0.94 }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: theme.gradient, border: 'none', borderRadius: 50,
                padding: '14px 34px', color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.5, position: 'relative', overflow: 'hidden',
              }}
            >
              <motion.span
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  pointerEvents: 'none',
                }}
              />
              Hire Me 🚀
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              href={resumeUrl ? BASE + resumeUrl : '#'}
              download={!!resumeUrl}
              onClick={e => { if (!resumeUrl) e.preventDefault(); }}
              style={{
                background: 'transparent',
                border: `2px solid ${resumeUrl ? theme.primary : theme.border}`,
                borderRadius: 50, padding: '14px 34px',
                color: resumeUrl ? theme.primary : theme.textMuted,
                fontSize: 15, fontWeight: 700,
                cursor: resumeUrl ? 'pointer' : 'not-allowed',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
                opacity: resumeUrl ? 1 : 0.45,
              }}
            >
              <FiDownload /> {resumeUrl ? 'Resume' : 'Resume (soon)'}
            </motion.a>
          </motion.div>

          {/* ── Social icons (Footer-style: brand color glow + orbit dot) ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ display: 'flex', gap: 14, alignItems: 'center' }}
          >
            <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>Follow</span>
            <div style={{ width: 30, height: 1, background: theme.primary + '40' }} />
            {socialList.map(({ icon, href, color }, i) => (
              <SocialIconHero
                key={i}
                icon={icon}
                href={href}
                theme={theme}
                color={color}
                delay={0.95 + i * 0.08}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Right: 3D Avatar */}
        <Avatar3D
          theme={theme} avatar={avatar} avatarRef={avatarRef}
          x={x} y={y} rotateX={rotateX} rotateY={rotateY}
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>Scroll</span>
        <motion.div
          style={{
            width: 24, height: 36, border: `2px solid ${theme.primary}50`,
            borderRadius: 50, display: 'flex', justifyContent: 'center', paddingTop: 6,
          }}
        >
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: 4, height: 8, borderRadius: 50, background: theme.primary }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
