import { useEffect, useRef, useCallback } from 'react';

/**
 * DiamondCursor — Enhanced Edition
 *
 * Features:
 * - Rainbow hue cycling trail
 * - Constellation dashed lines between trail points
 * - Sparkle star glints along the trail
 * - Ambient spark particles drifting off the tip
 * - Multi-ring burst explosion on click (3 rings + shockwave)
 * - Physics sparks on click (diamonds + dots with gravity)
 * - Pulsing aura rings around the cursor
 * - Breathing scale + wobble on main diamond
 */
export default function DiamondCursor() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    mx: -999, my: -999,
    trail: [],
    bursts: [],
    sparks: [],
    frame: 0,
    hue: 270,
    rafId: null,
    pending: false,
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  const hsl = (h, s = 85, l = 65) => `hsl(${h},${s}%,${l}%)`;

  const SPARK_COLORS = [
    '#fff', '#c4b5fd', '#93c5fd', '#f9a8d4',
    '#6ee7b7', '#fcd34d', '#fb923c',
  ];

  const TRAIL_MAX = 36;

  // ── draw primitives ───────────────────────────────────────────────────────

  const drawDiamond = useCallback((ctx, x, y, sz, col, al, rot = 0, glowScale = 3.5) => {
    if (sz < 0.3 || al < 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = al;

    // outer glow
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * glowScale);
    g.addColorStop(0, col + '44');
    g.addColorStop(0.5, col + '15');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, sz * glowScale, 0, Math.PI * 2);
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.moveTo(0, -sz);
    ctx.lineTo(sz * 0.65, 0);
    ctx.lineTo(0, sz);
    ctx.lineTo(-sz * 0.65, 0);
    ctx.closePath();

    const g2 = ctx.createRadialGradient(0, -sz * 0.3, 0, 0, 0, sz * 1.2);
    g2.addColorStop(0, '#ffffff');
    g2.addColorStop(0.2, col);
    g2.addColorStop(1, col + 'aa');
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // facet highlights
    ctx.beginPath();
    ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.65, 0); ctx.lineTo(0, -sz * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -sz); ctx.lineTo(-sz * 0.65, 0); ctx.lineTo(0, -sz * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    ctx.restore();
  }, []);

  const drawSparkle = useCallback((ctx, x, y, sz, al, col) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = al;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * sz * 0.25, Math.sin(a) * sz * 0.25);
      ctx.lineTo(Math.cos(a) * sz, Math.sin(a) * sz);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const drawAura = useCallback((ctx, x, y, hue, frame) => {
    for (let r = 0; r < 3; r++) {
      const ph = frame * 0.045 + r * 1.2;
      const rad = 24 + r * 12 + Math.sin(ph) * 6;
      const al = (0.13 - r * 0.04) * (0.5 + Math.sin(ph * 1.4) * 0.5);
      ctx.save();
      ctx.globalAlpha = al;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, hsl(hue + r * 25));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const drawConstellation = useCallback((ctx, trail, hue) => {
    const n = Math.min(trail.length, TRAIL_MAX);
    ctx.save();
    for (let i = 0; i < n - 1; i++) {
      const a = trail[i], b = trail[i + 1];
      if (Math.hypot(a.x - b.x, a.y - b.y) > 100) continue;
      const p = 1 - i / n;
      ctx.globalAlpha = p * 0.22;
      ctx.strokeStyle = hsl((hue - i * 4 + 360) % 360);
      ctx.lineWidth = 0.7;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }, []);

  const drawBurst = useCallback((ctx, b) => {
    const layers = [
      { s: 1,    a: 1,    dh: 0  },
      { s: 0.65, a: 0.75, dh: 35 },
      { s: 0.38, a: 0.5,  dh: 70 },
    ];
    layers.forEach(l => {
      const r = b.r * l.s;
      const cnt = 12;
      for (let j = 0; j < cnt; j++) {
        const ang = (j / cnt) * Math.PI * 2 + b.r * 0.025;
        drawDiamond(
          ctx,
          b.x + Math.cos(ang) * r,
          b.y + Math.sin(ang) * r,
          5.5 * Math.max(0, 1 - b.r / 100),
          hsl((b.hue + l.dh) % 360),
          b.al * l.a * 0.9,
          ang + b.r * 0.06,
          1.6
        );
      }
      ctx.save();
      ctx.strokeStyle = hsl((b.hue + l.dh) % 360);
      ctx.globalAlpha = b.al * l.a * 0.38;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    // shockwave
    ctx.save();
    ctx.strokeStyle = hsl(b.hue, 60, 90);
    ctx.globalAlpha = b.al * 0.2;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [drawDiamond]);

  // ── spawn helpers ─────────────────────────────────────────────────────────

  const spawnSparks = useCallback((x, y, n) => {
    const s = stateRef.current;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 5 + 1.5;
      s.sparks.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 1,
        decay: Math.random() * 0.04 + 0.022,
        sz: Math.random() * 4.5 + 1.5,
        col: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
        dia: Math.random() < 0.45,
        rot: Math.random() * Math.PI,
        rv: (Math.random() - 0.5) * 0.3,
      });
    }
  }, []);

  // ── main effect ───────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onMove = e => {
      if (!s.pending) {
        s.pending = true;
        requestAnimationFrame(() => {
          s.mx = e.clientX;
          s.my = e.clientY;
          s.trail.unshift({ x: e.clientX, y: e.clientY });
          if (s.trail.length > TRAIL_MAX) s.trail.pop();
          s.pending = false;
        });
      }
    };

    const onClick = e => {
      s.bursts.push({ x: e.clientX, y: e.clientY, r: 0, al: 1, hue: s.hue });
      spawnSparks(e.clientX, e.clientY, 26);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('click', onClick);
    document.documentElement.style.cursor = 'none';

    const animate = () => {
      s.rafId = requestAnimationFrame(animate);
      s.frame++;
      s.hue = (s.hue + 0.55) % 360;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // constellation
      drawConstellation(ctx, s.trail, s.hue);

      // trail
      const n = Math.min(s.trail.length, TRAIL_MAX);
      for (let i = n - 1; i >= 0; i--) {
        const t = s.trail[i];
        const p = 1 - i / TRAIL_MAX;
        const th = (s.hue - i * 5 + 360) % 360;
        const sz = 14 * 0.3 * p;
        drawDiamond(ctx, t.x, t.y, sz, hsl(th), p * 0.65, (i * 0.24) % (Math.PI * 2));
        if (i % 3 === 0 && p > 0.25) {
          drawSparkle(ctx, t.x, t.y, sz * 2.8, p * 0.45, hsl(th, 70, 85));
        }
      }

      // spark particles
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.09;
        sp.life -= sp.decay;
        sp.rot += sp.rv;
        if (sp.life <= 0) { s.sparks.splice(i, 1); continue; }
        if (sp.dia) {
          drawDiamond(ctx, sp.x, sp.y, sp.sz, sp.col, sp.life * 0.9, sp.rot, 1.6);
        } else {
          ctx.save();
          ctx.translate(sp.x, sp.y);
          ctx.globalAlpha = sp.life * 0.9;
          ctx.fillStyle = sp.col;
          ctx.beginPath();
          ctx.arc(0, 0, sp.sz * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // bursts
      for (let i = s.bursts.length - 1; i >= 0; i--) {
        drawBurst(ctx, s.bursts[i]);
        s.bursts[i].r += 3.8;
        s.bursts[i].al -= 0.033;
        if (s.bursts[i].al <= 0) s.bursts.splice(i, 1);
      }

      // aura
      drawAura(ctx, s.mx, s.my, s.hue, s.frame);

      // main cursor
      const wb = Math.sin(s.frame * 0.065) * 2.4;
      const spin = Math.sin(s.frame * 0.032) * 0.38;
      const scale = 1 + Math.sin(s.frame * 0.048) * 0.09;
      drawDiamond(ctx, s.mx, s.my + wb, 16 * scale, hsl(s.hue), 1, spin, 4);

      // inner cross
      ctx.save();
      ctx.translate(s.mx, s.my + wb);
      ctx.rotate(spin);
      ctx.globalAlpha = 0.88;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, -16 * scale); ctx.lineTo(10 * scale, 0);
      ctx.moveTo(0, -16 * scale); ctx.lineTo(-10 * scale, 0);
      ctx.stroke();
      ctx.restore();

      // ambient trail sparks
      if (s.frame % 7 === 0 && s.trail.length > 1 && Math.random() < 0.45) {
        const t = s.trail[0];
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 18 + 4;
        s.sparks.push({
          x: t.x + Math.cos(a) * d,
          y: t.y + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6 - 0.4,
          life: 0.85,
          decay: 0.038,
          sz: Math.random() * 2.8 + 1,
          col: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
          dia: Math.random() < 0.55,
          rot: Math.random() * Math.PI,
          rv: (Math.random() - 0.5) * 0.28,
        });
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(s.rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
      document.documentElement.style.cursor = '';
    };
  }, [drawDiamond, drawSparkle, drawAura, drawConstellation, drawBurst, spawnSparks]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 999999,
      }}
    />
  );
}
