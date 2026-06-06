import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getCompliments, sendCompliment } from '../api/api';
import { FiStar } from 'react-icons/fi';

/* ─── Global styles ─────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes floatUp {
    0%   { transform: translateY(0) scale(0);        opacity: 0; }
    10%  { opacity: 0.25; }
    90%  { opacity: 0.08; }
    100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
  }
  @keyframes shimmerSlide {
    0%   { left: -50%; }
    100% { left: 130%;  }
  }
  @keyframes rippleOut {
    to { transform: scale(4); opacity: 0; }
  }
  @keyframes spinIcon {
    to { transform: rotate(360deg); }
  }
  @keyframes starPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.45); }
    70%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
  @keyframes celebrate {
    0%,100% { transform: rotate(0deg) scale(1); }
    25%      { transform: rotate(-12deg) scale(1.15); }
    75%      { transform: rotate(12deg)  scale(1.15); }
  }
  @keyframes cursorBlink {
    0%,100% { opacity: 1; } 50% { opacity: 0; }
  }
  @keyframes gradientShift {
    0%,100% { background-position: 0% 50%;   }
    50%      { background-position: 100% 50%; }
  }

  .tm-particle {
    position: absolute; border-radius: 50%;
    pointer-events: none;
    animation: floatUp linear infinite;
  }
  .tm-card {
    background: var(--tm-card);
    border: 1px solid var(--tm-border);
    border-radius: 20px;
    padding: 28px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    cursor: default;
  }
  .tm-card::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--tm-primary-faint) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
    border-radius: 20px;
  }
  .tm-card:hover::before { opacity: 1; }
  .tm-card:hover {
    border-color: var(--tm-primary-mid);
    box-shadow: 0 20px 60px var(--tm-primary-shadow);
  }
  .tm-shimmer-wrap {
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px; overflow: hidden; border-radius: 20px 20px 0 0;
  }
  .tm-shimmer-bar {
    position: absolute; top: 0; height: 100%; width: 45%;
    animation: shimmerSlide 2.4s ease-in-out infinite;
    background: linear-gradient(90deg, transparent, var(--tm-primary), transparent);
  }
  .tm-quote-mark {
    position: absolute; top: 16px; right: 20px;
    font-size: 80px; line-height: 1;
    color: var(--tm-primary);
    opacity: 0.07;
    font-family: Georgia, serif;
    pointer-events: none;
    user-select: none;
  }
  .tm-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 17px;
    flex-shrink: 0;
    position: relative;
  }
  .tm-avatar::after {
    content: '';
    position: absolute; inset: -2px;
    border-radius: 50%;
    background: var(--tm-gradient);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .tm-card:hover .tm-avatar::after { opacity: 1; }

  .tm-star-btn {
    background: none; border: none; cursor: pointer;
    font-size: 32px; padding: 2px; line-height: 1;
    transition: color 0.2s ease;
    position: relative;
  }
  .tm-star-btn.active { animation: starPop 0.35s ease; }

  .tm-input {
    width: 100%; border-radius: 12px;
    padding: 13px 16px; font-size: 15px;
    outline: none; box-sizing: border-box;
    font-family: inherit; resize: none;
    transition: border-color 0.2s ease, background 0.2s ease;
    background: var(--tm-bg-secondary);
    border: 1px solid var(--tm-border);
    color: var(--tm-text);
  }
  .tm-input-wrap { position: relative; }
  .tm-focus-bar {
    position: absolute; bottom: 1px; left: 0;
    width: 100%; height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, var(--tm-primary), var(--tm-secondary));
    transform: scaleX(0); transform-origin: left; opacity: 0;
    pointer-events: none;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .tm-input-wrap:focus-within .tm-focus-bar {
    transform: scaleX(1); opacity: 1;
  }
  .tm-submit-btn {
    width: 100%; border: none; border-radius: 12px;
    padding: 15px; color: #fff; font-size: 16px; font-weight: 700;
    cursor: pointer; position: relative; overflow: hidden;
    background-size: 200% 200%;
    animation: gradientShift 4s ease infinite;
    transition: transform 0.15s ease, opacity 0.2s;
  }
  .tm-submit-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .tm-submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .tm-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .tm-spin { display: inline-block; animation: spinIcon 0.75s linear infinite; }
  .tm-celebrate { display: inline-block; animation: celebrate 0.6s ease infinite; }
  .tm-cursor {
    display: inline-block; width: 3px; height: 0.82em;
    border-radius: 2px; margin-left: 6px; vertical-align: middle;
    animation: cursorBlink 1s step-end infinite;
  }
`;

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left:     `${(i * 6.4 + 4) % 100}%`,
  size:     `${2 + (i % 4)}px`,
  duration: `${10 + (i % 6) * 2}s`,
  delay:    `${(i * 1.5) % 12}s`,
}));

function injectStyles(id, css) {
  if (document.getElementById(id)) return;
  const s = document.createElement('style');
  s.id = id; s.textContent = css;
  document.head.appendChild(s);
}

/* ─── Tilt card wrapper ─────────────────────────────────────────────────── */
function TiltCard({ children, style }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-6, 6]);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800, ...style }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Single testimonial card ───────────────────────────────────────────── */
function TestimonialCard({ c, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard>
        <div className="tm-card">
          <div className="tm-shimmer-wrap"><div className="tm-shimmer-bar" /></div>
          <div className="tm-quote-mark">"</div>

          {/* Stars */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
            {[...Array(5)].map((_, j) => (
              <motion.span
                key={j}
                initial={{ opacity: 0, scale: 0, rotate: -30 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + j * 0.06 + 0.2, type: 'spring', stiffness: 400, damping: 16 }}
              >
                <FiStar style={{
                  color: j < (c.rating || 5) ? '#f6c90e' : 'var(--tm-border)',
                  fill:  j < (c.rating || 5) ? '#f6c90e' : 'none',
                  fontSize: 16,
                }} />
              </motion.span>
            ))}
          </div>

          <p style={{ color: 'var(--tm-text-muted)', fontSize: 15, lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>
            "{c.message}"
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.div
              className="tm-avatar"
              whileHover={{ scale: 1.12 }}
              style={{ background: 'var(--tm-gradient)' }}
            >
              {c.name[0].toUpperCase()}
            </motion.div>
            <div>
              <div style={{ color: 'var(--tm-text)', fontWeight: 700, fontSize: 15 }}>{c.name}</div>
              <div style={{ color: 'var(--tm-text-muted)', fontSize: 12 }}>Verified Client</div>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

/* ─── Star rating picker ────────────────────────────────────────────────── */
function StarRating({ value, onChange, primary, border }) {
  const [hovered, setHovered] = useState(0);
  const [popped, setPopped]   = useState(0);

  const pick = (n) => {
    onChange(n);
    setPopped(n);
    setTimeout(() => setPopped(0), 350);
  };

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(n => {
        const lit = n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            className={`tm-star-btn${popped >= n ? ' active' : ''}`}
            style={{ color: lit ? '#f6c90e' : border }}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => pick(n)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

/* ─── Confetti burst ────────────────────────────────────────────────────── */
function ConfettiBurst({ primary, secondary, accent }) {
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: [primary, secondary, accent][i % 3],
    x: (Math.random() - 0.5) * 220,
    y: -(60 + Math.random() * 120),
    rotate: Math.random() * 720 - 360,
    size: 6 + Math.random() * 6,
  }));
  return (
    <div style={{ position: 'absolute', top: '30%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      {pieces.map(({ id, color, x, y, rotate, size }) => (
        <motion.div
          key={id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x, y, opacity: 0, rotate, scale: 0.3 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ position: 'absolute', width: size, height: size, borderRadius: 2, background: color }}
        />
      ))}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
const demoCompliments = [
  { _id: '1', name: 'Rahul Sharma', message: 'Jaydip is an exceptional developer! Delivered our project on time with outstanding quality.', rating: 5 },
  { _id: '2', name: 'Priya Patel',  message: 'Amazing work! The UI he designed exceeded all our expectations. Highly recommended!', rating: 5 },
  { _id: '3', name: 'Amit Kumar',   message: 'Professional, skilled, and creative. Our e-commerce platform works flawlessly.', rating: 5 },
];

export default function Testimonials() {
  const { theme } = useTheme();
  const [compliments, setCompliments] = useState(demoCompliments);
  const [form,        setForm]        = useState({ name: '', message: '', rating: 5 });
  const [submitted,   setSubmitted]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [burst,       setBurst]       = useState(false);
  const submitRef = useRef(null);

  /* inject CSS vars + keyframes once */
  useEffect(() => { injectStyles('tm-styles', STYLES); }, []);

  /* sync CSS vars with current theme */
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--tm-bg',             theme.bg);
    r.style.setProperty('--tm-bg-secondary',   theme.bgSecondary);
    r.style.setProperty('--tm-card',           theme.bgCard);
    r.style.setProperty('--tm-primary',        theme.primary);
    r.style.setProperty('--tm-secondary',      theme.secondary);
    r.style.setProperty('--tm-text',           theme.text);
    r.style.setProperty('--tm-text-muted',     theme.textMuted);
    r.style.setProperty('--tm-border',         theme.border);
    r.style.setProperty('--tm-gradient',       theme.gradient);
    r.style.setProperty('--tm-primary-faint',  theme.primary + '14');
    r.style.setProperty('--tm-primary-mid',    theme.primary + '55');
    r.style.setProperty('--tm-primary-shadow', theme.primary + '18');
  }, [theme]);

  useEffect(() => {
    getCompliments()
      .then(res => setCompliments(res.data.length ? res.data : demoCompliments))
      .catch(() => setCompliments(demoCompliments));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    /* ripple */
    const btn = submitRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = btn.offsetWidth;
      const r = document.createElement('span');
      r.style.cssText = `position:absolute;border-radius:50%;width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;background:rgba(255,255,255,0.25);transform:scale(0);pointer-events:none;animation:rippleOut 0.55s linear;`;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 560);
    }
    setLoading(true);
    try {
      await sendCompliment(form);
      setSubmitted(true);
      setBurst(true);
      setTimeout(() => setBurst(false), 1000);
      setForm({ name: '', message: '', rating: 5 });
    } catch {
      alert('Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  /* animation variants */
  const stagger  = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
  const fadeUp   = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <section
      id="testimonials"
      style={{ padding: '90px 5% 80px', background: theme.bgSecondary, position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {PARTICLES.map(({ id, left, size, duration, delay }) => (
          <div key={id} className="tm-particle"
            style={{ bottom: '-8px', left, width: size, height: size, background: theme.primary, animationDuration: duration, animationDelay: delay }}
          />
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <motion.div
          initial="hidden" whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <motion.p variants={fadeUp} style={{ color: theme.primary, fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>
            Kind Words
          </motion.p>
          <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: theme.text, marginBottom: 16 }}>
            What People Say
            <span className="tm-cursor" style={{ background: theme.primary }} />
          </motion.h2>
          <motion.div
            variants={{ hidden: { width: 0 }, show: { width: 60, transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 } } }}
            style={{ height: 4, background: theme.gradient, borderRadius: 2, margin: '0 auto' }}
          />
        </motion.div>

        {/* ── Cards grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginBottom: 80 }}>
          {compliments.map((c, i) => (
            <TestimonialCard key={c._id || i} c={c} i={i} />
          ))}
        </div>

        {/* ── Leave a compliment box ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 24,
            padding: 40,
            maxWidth: 600,
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* shimmer bar */}
          <div className="tm-shimmer-wrap"><div className="tm-shimmer-bar" /></div>

          {/* confetti */}
          <AnimatePresence>{burst && <ConfettiBurst primary={theme.primary} secondary={theme.secondary} accent={theme.accent} />}</AnimatePresence>

          <motion.h3
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ color: theme.text, fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}
          >
            Leave a Compliment 💬
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            style={{ color: theme.textMuted, textAlign: 'center', marginBottom: 32, fontSize: 14 }}
          >
            Your kind words mean the world to me!
          </motion.p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{   scale: 0.7,  opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{ textAlign: 'center', padding: '32px 0' }}
              >
                <motion.div
                  className="tm-celebrate"
                  style={{ fontSize: 64, marginBottom: 16, display: 'inline-block' }}
                >
                  🎉
                </motion.div>
                <motion.h4
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  style={{ color: theme.primary, fontSize: 22, fontWeight: 700, marginBottom: 8 }}
                >
                  Thank you!
                </motion.h4>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                  style={{ color: theme.textMuted, marginBottom: 24 }}
                >
                  Your compliment is pending approval.
                </motion.p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: `0 8px 28px ${theme.primary}40` }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSubmitted(false)}
                  style={{ background: theme.gradient, border: 'none', borderRadius: 50, padding: '11px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}
                >
                  Leave Another ✨
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{   opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div className="tm-input-wrap">
                  <input
                    required
                    className="tm-input"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                  <div className="tm-focus-bar" />
                </div>

                <div className="tm-input-wrap">
                  <textarea
                    required
                    className="tm-input"
                    placeholder="Your message..."
                    rows={4}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                  <div className="tm-focus-bar" />
                </div>

                <div>
                  <label style={{ color: theme.textMuted, fontSize: 14, marginBottom: 10, display: 'block' }}>Rating</label>
                  <StarRating
                    value={form.rating}
                    onChange={n => setForm({ ...form, rating: n })}
                    primary={theme.primary}
                    border={theme.border}
                  />
                </div>

                <button
                  ref={submitRef}
                  type="submit"
                  disabled={loading}
                  className="tm-submit-btn"
                  style={{ background: theme.gradient }}
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span key="ld"
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <span className="tm-spin">✦</span> Submitting...
                      </motion.span>
                    ) : (
                      <motion.span key="idle"
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      >
                        Submit Compliment ✨
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
