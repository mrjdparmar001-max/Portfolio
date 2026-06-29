import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getProjects } from '../api/api';
import { FiGithub, FiExternalLink, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

function imgUrl(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('data:') || s.startsWith('blob:')) return s;
  return `${BASE}/${s.replace(/^\/+/, '')}`;
}

const categories = ['All', 'Web', 'Mobile', 'Backend', 'UI/UX'];

// ─── Spotlight cursor glow ───────────────────────────────────────────────────
function SpotlightCursor({ theme }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { damping: 25, stiffness: 200 });
  const sy = useSpring(y, { damping: 25, stiffness: 200 });

  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none',
        zIndex: 0, width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primary}12 0%, transparent 70%)`,
        x: useTransform(sx, v => v - 300),
        y: useTransform(sy, v => v - 300),
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
        <motion.div key={i}
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: orb.dur, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: orb.x, top: orb.y, width: orb.size, height: orb.size, borderRadius: '50%', background: `radial-gradient(circle, ${theme.primary}18, transparent 70%)`, transform: 'translate(-50%,-50%)' }}
        />
      ))}
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, theme, index, onHoverChange }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

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
    rotX.set((cy / rect.height - 0.5) * -16);
    rotY.set((cx / rect.width - 0.5) * 16);
    glowX.set((cx / rect.width) * 100);
    glowY.set((cy / rect.height) * 100);
  }, [rotX, rotY, glowX, glowY]);

  const onMouseEnter = useCallback(() => {
    setHovered(true);
    onHoverChange?.(true);
  }, [onHoverChange]);

  const onMouseLeave = useCallback(() => {
    rotX.set(0); rotY.set(0);
    glowX.set(50); glowY.set(50);
    setHovered(false);
    onHoverChange?.(false);
  }, [rotX, rotY, glowX, glowY, onHoverChange]);

  const glowBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, ${theme.primary}22 0%, transparent 65%)`
  );

  const src = imgUrl(project.image);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX: springRotX, rotateY: springRotY,
        transformStyle: 'preserve-3d', perspective: 800,
        position: 'relative',
        flexShrink: 0,
        width: 'clamp(280px, 32vw, 360px)',
        background: theme.bgCard,
        border: `1px solid ${hovered ? theme.primary + '55' : theme.border}`,
        borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
        zIndex: hovered ? 10 : 1,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        boxShadow: hovered
          ? `0 30px 80px ${theme.primary}20, 0 0 0 1px ${theme.primary}30`
          : `0 4px 20px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Cursor glow */}
      <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 24, zIndex: 1, background: glowBg, opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }} />

      {/* Shimmer sweep */}
      <motion.div
        animate={hovered ? { x: ['-100%', '200%'] } : { x: '-100%' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ position: 'absolute', top: 0, left: 0, width: '60%', height: '100%', background: `linear-gradient(90deg, transparent, ${theme.primary}18, transparent)`, zIndex: 2, pointerEvents: 'none' }}
      />

      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: theme.bgSecondary }}>
        {src && !imgBroken ? (
          <motion.img
            src={src}
            alt={project.title}
            onError={() => setImgBroken(true)}
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <motion.div
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${theme.primary}25, ${theme.secondary}25)`, fontSize: 48, gap: 8 }}
          >
            💻
          </motion.div>
        )}

        <motion.div
          animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${theme.bgCard}cc, transparent 60%)` }}
        />

        {project.featured && (
          <div style={{ position: 'absolute', top: 14, right: 14, background: theme.gradient, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(8px)', boxShadow: `0 4px 12px ${theme.primary}40` }}>
            ⭐ Featured
          </div>
        )}

        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 12 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 8, zIndex: 3 }}
        >
          {project.githubUrl && (
            <motion.a href={project.githubUrl} target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17 }}
            ><FiGithub /></motion.a>
          )}
          {project.liveUrl && (
            <motion.a href={project.liveUrl} target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 36, height: 36, borderRadius: '50%', background: theme.primary, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, boxShadow: `0 4px 14px ${theme.primary}55` }}
            ><FiExternalLink /></motion.a>
          )}
        </motion.div>
      </div>

      {/* Card body */}
      <div style={{ padding: '20px 22px 22px', position: 'relative', zIndex: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <motion.h3 animate={{ x: hovered ? 3 : 0 }} transition={{ duration: 0.2 }}
            style={{ color: theme.text, fontSize: 17, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            {project.title}
          </motion.h3>
          <motion.span whileHover={{ scale: 1.05 }}
            style={{ background: theme.primary + '22', color: theme.primary, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8, border: `1px solid ${theme.primary}30`, flexShrink: 0 }}>
            {project.category}
          </motion.span>
        </div>

        <p style={{ color: theme.textMuted, fontSize: 13.5, lineHeight: 1.7, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {project.techStack?.slice(0, 4).map((tech) => (
            <motion.span key={tech}
              whileHover={{ scale: 1.1, background: theme.primary + '22', color: theme.primary }}
              transition={{ type: 'spring', stiffness: 400 }}
              style={{ background: theme.bgSecondary, color: theme.textMuted, borderRadius: 8, padding: '3px 9px', fontSize: 11.5, border: `1px solid ${theme.border}`, cursor: 'default', transition: 'background 0.2s, color 0.2s' }}
            >{tech}</motion.span>
          ))}
          {(project.techStack?.length ?? 0) > 4 && (
            <span style={{ background: theme.bgSecondary, color: theme.textMuted, borderRadius: 8, padding: '3px 9px', fontSize: 11.5, border: `1px solid ${theme.border}` }}>
              +{project.techStack.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Bottom progress line */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: theme.gradient, transformOrigin: 'left' }}
      />
    </motion.div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
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

// ─── Horizontal auto-scroll carousel ─────────────────────────────────────────
function ProjectCarousel({ projects, theme }) {
  const trackRef = useRef(null);
  const isPaused = useRef(false);
  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const animFrame = useRef(null);
  const speed = 0.6; // px per frame — gentle drift

  // Duplicate array for seamless loop
  const doubled = [...projects, ...projects];

  const tick = useCallback(() => {
    if (!trackRef.current || isPaused.current) {
      animFrame.current = requestAnimationFrame(tick);
      return;
    }
    const el = trackRef.current;
    el.scrollLeft += speed;

    // Seamless reset: when we've scrolled past the first copy, jump back
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) {
      el.scrollLeft -= half;
    }
    animFrame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    animFrame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame.current);
  }, [tick]);

  // Drag-to-scroll
  const onPointerDown = (e) => {
    isMouseDown.current = true;
    isPaused.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeft.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
  };
  const onPointerUp = () => {
    isMouseDown.current = false;
    trackRef.current.style.cursor = 'grab';
    // Resume auto-scroll after a short delay
    setTimeout(() => { isPaused.current = false; }, 600);
  };
  const onPointerMove = (e) => {
    if (!isMouseDown.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.4;
    trackRef.current.scrollLeft = scrollLeft.current - walk;

    // Keep seamless on drag too
    const half = trackRef.current.scrollWidth / 2;
    if (trackRef.current.scrollLeft >= half) trackRef.current.scrollLeft -= half;
    if (trackRef.current.scrollLeft < 0) trackRef.current.scrollLeft += half;
  };

  // Arrow buttons
  const scrollBy = (dir) => {
    isPaused.current = true;
    const el = trackRef.current;
    const cardW = el.querySelector('[data-card]')?.offsetWidth ?? 370;
    el.scrollBy({ left: dir * (cardW + 28), behavior: 'smooth' });
    setTimeout(() => { isPaused.current = false; }, 900);
  };

  const arrowStyle = (side) => ({
    position: 'absolute',
    top: '50%',
    [side]: -20,
    transform: 'translateY(-50%)',
    zIndex: 20,
    width: 44, height: 44,
    borderRadius: '50%',
    border: `1.5px solid ${theme.border}`,
    background: theme.bgCard,
    color: theme.text,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, cursor: 'pointer',
    boxShadow: `0 4px 20px rgba(0,0,0,0.12)`,
    transition: 'all 0.2s',
  });

  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      {/* Left fade */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to right, ${theme.bg}, transparent)`, zIndex: 10, pointerEvents: 'none' }} />
      {/* Right fade */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(to left, ${theme.bg}, transparent)`, zIndex: 10, pointerEvents: 'none' }} />

      {/* Arrow left */}
      <motion.button
        whileHover={{ scale: 1.1, background: theme.primary, color: '#fff', borderColor: 'transparent' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => scrollBy(-1)}
        style={arrowStyle('left')}
      >
        <FiChevronLeft />
      </motion.button>

      {/* Arrow right */}
      <motion.button
        whileHover={{ scale: 1.1, background: theme.primary, color: '#fff', borderColor: 'transparent' }}
        whileTap={{ scale: 0.92 }}
        onClick={() => scrollBy(1)}
        style={arrowStyle('right')}
      >
        <FiChevronRight />
      </motion.button>

      {/* Track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerMove={onPointerMove}
        style={{
          display: 'flex',
          gap: 28,
          overflowX: 'scroll',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '20px 60px 30px',
          cursor: 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`.carousel-track::-webkit-scrollbar { display: none; }`}</style>
        {doubled.map((project, i) => (
          <div key={`${project._id ?? i}-${i}`} data-card="1"
            onMouseEnter={() => { isPaused.current = true; }}
            onMouseLeave={() => { isPaused.current = false; }}
          >
            <ProjectCard
              project={project}
              theme={theme}
              index={i % projects.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
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

  // Use carousel when there are more than 3 projects, otherwise grid
  const useCarousel = filtered.length > 3;

  return (
    <section id="projects" style={{ position: 'relative', padding: '100px 0 90px', background: theme.bg, overflow: 'hidden' }}>
      <SpotlightCursor theme={theme} />
      <AmbientOrbs theme={theme} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 5%' }}>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 56 }}>

          <motion.p initial={{ opacity: 0, letterSpacing: '0.2em' }} whileInView={{ opacity: 1, letterSpacing: '0.25em' }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            style={{ color: theme.primary, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14 }}>
            My Work
          </motion.p>

          <h2 style={{ fontSize: 'clamp(30px,4vw,52px)', fontWeight: 800, color: theme.text, marginBottom: 6 }}>
            Featured{' '}
            <motion.span
              initial={{ backgroundSize: '0% 4px' }} whileInView={{ backgroundSize: '100% 4px' }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }}
              style={{ backgroundImage: theme.gradient, backgroundRepeat: 'no-repeat', backgroundPosition: 'left bottom 2px', paddingBottom: 4 }}>
              Projects
            </motion.span>
          </h2>

          {!loading && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ color: theme.textMuted, fontSize: 15, marginBottom: 36 }}>
              <AnimatedCount value={projects.length} theme={theme} /> projects shipped
            </motion.p>
          )}

          {/* Filter pills */}
          <motion.div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            {categories.map((cat, ci) => {
              const active = filter === cat;
              return (
                <motion.button key={cat} onClick={() => setFilter(cat)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.06 }}
                  whileHover={{ scale: 1.07, y: -2 }} whileTap={{ scale: 0.94 }}
                  style={{ position: 'relative', overflow: 'hidden', background: active ? theme.gradient : 'transparent', border: `2px solid ${active ? 'transparent' : theme.border}`, borderRadius: 50, padding: '9px 22px', color: active ? '#fff' : theme.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: active ? `0 8px 24px ${theme.primary}35` : 'none', transition: 'all 0.25s' }}>
                  {active && (
                    <motion.span animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                      style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)', pointerEvents: 'none' }} />
                  )}
                  {cat}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Carousel or Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: theme.textMuted, padding: 80 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 32, height: 32, border: `3px solid ${theme.border}`, borderTopColor: theme.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          Loading projects…
        </div>
      ) : useCarousel ? (
        /* Full-bleed carousel */
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProjectCarousel projects={filtered} theme={theme} />
        </motion.div>
      ) : (
        /* Grid for ≤ 3 projects */
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          <motion.div
            key={filter}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(320px,100%),1fr))', gap: 28 }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <ProjectCard key={project._id || i} project={project} theme={theme} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Empty state */}
      <AnimatePresence>
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ textAlign: 'center', color: theme.textMuted, padding: 80, fontSize: 15 }}>
            No projects in this category yet.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll hint dots */}
      {!loading && useCarousel && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, paddingBottom: 8 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: theme.primary }}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}

// ─── Demo fallback ────────────────────────────────────────────────────────────
const demoProjects = [
  { _id: '1', title: 'E-Commerce Platform',  description: 'Full-stack e-commerce with React, Node.js, MongoDB. Features cart, payments, admin panel.', techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'], category: 'Web',     featured: true,  githubUrl: '#', liveUrl: '#' },
  { _id: '2', title: 'Task Management App',  description: 'Real-time collaborative task manager with drag-and-drop, teams, and notifications.',         techStack: ['React', 'Socket.io', 'Express'],       category: 'Web',     featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '3', title: 'Portfolio CMS',        description: 'Custom CMS for managing portfolio content with rich text editor and media uploads.',          techStack: ['Next.js', 'MongoDB', 'AWS S3'],        category: 'Backend', featured: true,  githubUrl: '#', liveUrl: '#' },
  { _id: '4', title: 'Chat Application',     description: 'Real-time chat app with rooms, file sharing, and end-to-end encryption.',                    techStack: ['React', 'Socket.io', 'Node.js'],       category: 'Web',     featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '5', title: 'Weather Dashboard',    description: 'Beautiful weather app with forecasts, maps, and location-based alerts.',                     techStack: ['React', 'OpenWeather API'],            category: 'Web',     featured: false, githubUrl: '#', liveUrl: '#' },
  { _id: '6', title: 'REST API Service',     description: 'Scalable REST API with authentication, rate limiting, and comprehensive documentation.',     techStack: ['Node.js', 'Express', 'MongoDB', 'JWT'], category: 'Backend', featured: false, githubUrl: '#', liveUrl: '#' },
];
