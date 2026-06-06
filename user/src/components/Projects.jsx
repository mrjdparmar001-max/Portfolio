import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getProjects } from '../api/api';
import { FiGithub, FiExternalLink } from 'react-icons/fi';

const BASE = 'http://localhost:5000';
const categories = ['All', 'Web', 'Mobile', 'Backend', 'UI/UX'];

// ─── Spotlight cursor glow ───────────────────────────────────────────────────
function SpotlightCursor({ theme }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const springConfig = { damping: 25, stiffness: 200 };
  const sx = useSpring(x, springConfig);
  const sy = useSpring(y, springConfig);

  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none',
        zIndex: 0, width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primary}12 0%, transparent 70%)`,
        x: useTransform(sx, v => v - 300),
        y: useTransform(sy, v => v - 300),
        transform: 'translate(0,0)',
      }}
    />
  );
}

// ─── Floating ambient orbs ───────────────────────────────────────────────────
function AmbientOrbs({ theme }) {
  const orbs = [
    { size: 300, x: '10%', y: '20%', delay: 0, dur: 8 },
    { size: 200, x: '75%', y: '60%', delay: 2, dur: 10 },
    { size: 150, x: '50%', y: '80%', delay: 4, dur: 7 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: orb.dur, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: orb.x, top: orb.y,
            width: orb.size, height: orb.size, borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.primary}18, transparent 70%)`,
            transform: 'translate(-50%,-50%)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Magnetic tilt card ──────────────────────────────────────────────────────
function ProjectCard({ project, theme, index }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springRotX = useSpring(rotX, { damping: 20, stiffness: 200 });
  const springRotY = useSpring(rotY, { damping: 20, stiffness: 200 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);

  const onMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const rx = (cy / rect.height - 0.5) * -16;
    const ry = (cx / rect.width - 0.5) * 16;
    rotX.set(rx);
    rotY.set(ry);
    glowX.set((cx / rect.width) * 100);
    glowY.set((cy / rect.height) * 100);
  }, []);

  const onMouseLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
    glowX.set(50);
    glowY.set(50);
    setHovered(false);
  }, []);

  const glowBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, ${theme.primary}22 0%, transparent 65%)`
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.92, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.88, filter: 'blur(6px)' }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX: springRotX,
        rotateY: springRotY,
        transformStyle: 'preserve-3d',
        perspective: 800,
        position: 'relative',
        background: theme.bgCard,
        border: `1px solid ${hovered ? theme.primary + '55' : theme.border}`,
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: hovered ? 10 : 1,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        boxShadow: hovered
          ? `0 30px 80px ${theme.primary}20, 0 0 0 1px ${theme.primary}30`
          : `0 4px 20px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Inner glow that follows cursor */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          borderRadius: 24, zIndex: 1, background: glowBg,
          opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
        }}
      />

      {/* Shimmer border sweep on hover */}
      <motion.div
        animate={hovered ? { x: ['−100%', '200%'] } : { x: '-100%' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          position: 'absolute', top: 0, left: 0, width: '60%', height: '100%',
          background: `linear-gradient(90deg, transparent, ${theme.primary}18, transparent)`,
          zIndex: 2, pointerEvents: 'none',
        }}
      />

      {/* Image section */}
      <div style={{
        position: 'relative', height: 210, overflow: 'hidden',
        background: theme.bgSecondary,
      }}>
        {project.image ? (
          <motion.img
            src={project.image.startsWith('http') ? project.image : BASE + project.image}
            alt={project.title}
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <motion.div
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%', height: '100%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.primary}25, ${theme.secondary}25)`,
              fontSize: 52,
            }}
          >
            💻
          </motion.div>
        )}

        {/* Overlay gradient on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to top, ${theme.bgCard}cc, transparent 60%)`,
          }}
        />

        {project.featured && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07 + 0.3 }}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: theme.gradient, borderRadius: 20,
              padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#fff',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 4px 12px ${theme.primary}40`,
            }}
          >
            ⭐ Featured
          </motion.div>
        )}

        {/* Link buttons that slide up on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 12 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute', bottom: 14, right: 14,
            display: 'flex', gap: 8, zIndex: 3,
          }}
        >
          {project.githubUrl && (
            <motion.a
              href={project.githubUrl} target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 17,
              }}
            >
              <FiGithub />
            </motion.a>
          )}
          {project.liveUrl && (
            <motion.a
              href={project.liveUrl} target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: theme.primary, backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 17,
                boxShadow: `0 4px 14px ${theme.primary}55`,
              }}
            >
              <FiExternalLink />
            </motion.a>
          )}
        </motion.div>
      </div>

      {/* Card body */}
      <div style={{ padding: '22px 24px 24px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <motion.h3
            animate={{ x: hovered ? 3 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: theme.text, fontSize: 18, fontWeight: 700, margin: 0 }}
          >
            {project.title}
          </motion.h3>
          <motion.span
            whileHover={{ scale: 1.05 }}
            style={{
              background: theme.primary + '22', color: theme.primary,
              borderRadius: 20, padding: '3px 12px', fontSize: 11,
              fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8,
              border: `1px solid ${theme.primary}30`,
            }}
          >
            {project.category}
          </motion.span>
        </div>

        <p style={{ color: theme.textMuted, fontSize: 14, lineHeight: 1.75, marginBottom: 18 }}>
          {project.description}
        </p>

        <motion.div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04, delayChildren: index * 0.07 + 0.2 } }
          }}
        >
          {project.techStack?.map((tech, ti) => (
            <motion.span
              key={tech}
              variants={{
                hidden: { opacity: 0, scale: 0.7 },
                visible: { opacity: 1, scale: 1 },
              }}
              whileHover={{ scale: 1.1, background: theme.primary + '22', color: theme.primary }}
              transition={{ type: 'spring', stiffness: 400 }}
              style={{
                background: theme.bgSecondary, color: theme.textMuted,
                borderRadius: 8, padding: '3px 10px', fontSize: 12,
                border: `1px solid ${theme.border}`,
                cursor: 'default', transition: 'background 0.2s, color 0.2s',
              }}
            >
              {tech}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Bottom progress line on hover */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: theme.gradient, transformOrigin: 'left',
        }}
      />
    </motion.div>
  );
}

// ─── Animated counter for section heading ────────────────────────────────────
function AnimatedCount({ value, theme }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 24);
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setCount(start);
      if (start >= value) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ color: theme.primary }}>{count}</span>;
}

// ─── Main section ────────────────────────────────────────────────────────────
export default function Projects() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data))
      .catch(() => setProjects(demoProjects))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <section
      id="projects"
      style={{ position: 'relative', padding: '100px 5% 90px', background: theme.bg, overflow: 'hidden' }}
    >
      <SpotlightCursor theme={theme} />
      <AmbientOrbs theme={theme} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.2em' }}
            whileInView={{ opacity: 1, letterSpacing: '0.25em' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ color: theme.primary, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}
          >
            My Work
          </motion.p>

          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: theme.text, marginBottom: 6 }}>
            Featured{' '}
            <motion.span
              initial={{ backgroundSize: '0% 4px' }}
              whileInView={{ backgroundSize: '100% 4px' }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              style={{
                backgroundImage: theme.gradient,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left bottom 2px',
                paddingBottom: 4,
              }}
            >
              Projects
            </motion.span>
          </h2>

          {!loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: theme.textMuted, fontSize: 15, marginBottom: 36 }}
            >
              <AnimatedCount value={projects.length} theme={theme} /> projects shipped
            </motion.p>
          )}

          {/* Category filter pills */}
          <motion.div
            style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {categories.map((cat, ci) => {
              const active = filter === cat;
              return (
                <motion.button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.06 }}
                  whileHover={{ scale: 1.07, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    background: active ? theme.gradient : 'transparent',
                    border: `2px solid ${active ? 'transparent' : theme.border}`,
                    borderRadius: 50, padding: '9px 22px',
                    color: active ? '#fff' : theme.textMuted,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    boxShadow: active ? `0 8px 24px ${theme.primary}35` : 'none',
                    transition: 'all 0.25s',
                  }}
                >
                  {/* Shimmer sweep on active */}
                  {active && (
                    <motion.span
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {cat}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', color: theme.textMuted, padding: 80 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 32, height: 32, border: `3px solid ${theme.border}`,
                borderTopColor: theme.primary, borderRadius: '50%',
                margin: '0 auto 16px',
              }}
            />
            Loading projects…
          </motion.div>
        ) : (
          <motion.div
            layout
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
              gap: 28,
            }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <ProjectCard key={project._id || i} project={project} theme={theme} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty state */}
        <AnimatePresence>
          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ textAlign: 'center', color: theme.textMuted, padding: 80, fontSize: 15 }}
            >
              No projects in this category yet.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

const demoProjects = [
  { _id: '1', title: 'E-Commerce Platform', description: 'Full-stack e-commerce with React, Node.js, MongoDB. Features cart, payments, admin panel.', techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'], category: 'Web', featured: true, githubUrl: '#', liveUrl: '#' },
  { _id: '2', title: 'Task Management App', description: 'Real-time collaborative task manager with drag-and-drop, teams, and notifications.', techStack: ['React', 'Socket.io', 'Express', 'MongoDB'], category: 'Web', featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '3', title: 'Portfolio CMS', description: 'Custom CMS for managing portfolio content with rich text editor and media uploads.', techStack: ['Next.js', 'MongoDB', 'AWS S3'], category: 'Backend', featured: true, githubUrl: '#', liveUrl: '#' },
  { _id: '4', title: 'Chat Application', description: 'Real-time chat app with rooms, file sharing, and end-to-end encryption.', techStack: ['React', 'Socket.io', 'Node.js'], category: 'Web', featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '5', title: 'Weather Dashboard', description: 'Beautiful weather app with forecasts, maps, and location-based alerts.', techStack: ['React', 'OpenWeather API', 'Chart.js'], category: 'Web', featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '6', title: 'REST API Service', description: 'Scalable REST API with authentication, rate limiting, and comprehensive documentation.', techStack: ['Node.js', 'Express', 'MongoDB', 'JWT'], category: 'Backend', featured: false, githubUrl: '#', liveUrl: '#' },
];
