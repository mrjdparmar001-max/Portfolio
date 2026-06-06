import { useState, useEffect, useRef, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const ALL_Q = [
  { id: 1, t: "mcq", c: "JavaScript", q: "Which method removes the last element from an array?", o: ["shift()", "pop()", "splice()", "slice()"], a: 1 },
  { id: 2, t: "mcq", c: "React", q: "Which hook runs side effects in React?", o: ["useState", "useRef", "useEffect", "useMemo"], a: 2 },
  { id: 3, t: "mcq", c: "CSS", q: "Which CSS property controls element stacking order?", o: ["position", "z-index", "display", "overflow"], a: 1 },
  { id: 4, t: "mcq", c: "JavaScript", q: 'What does "===" check in JavaScript?', o: ["Value only", "Type only", "Value and type", "Reference"], a: 2 },
  { id: 5, t: "mcq", c: "Node.js", q: "Which module creates an HTTP server in Node.js?", o: ["fs", "path", "http", "net"], a: 2 },
  { id: 6, t: "mcq", c: "MongoDB", q: "Which MongoDB method finds a single document?", o: ["find()", "findOne()", "get()", "fetch()"], a: 1 },
  { id: 7, t: "mcq", c: "React", q: "Correct way to update state in React?", o: ["state=newValue", "this.state=newValue", "setState(newValue)", "useState(newValue)"], a: 2 },
  { id: 8, t: "mcq", c: "CSS", q: 'Which "display" value makes a flex container?', o: ["block", "inline", "flex", "grid"], a: 2 },
  { id: 9, t: "truefalse", c: "JavaScript", q: "JavaScript is a compiled language.", a: false },
  { id: 10, t: "truefalse", c: "React", q: "React re-renders on every state change.", a: true },
  { id: 11, t: "truefalse", c: "CSS", q: "CSS Grid and Flexbox cannot be used together.", a: false },
  { id: 12, t: "truefalse", c: "Node.js", q: "Node.js runs JavaScript on the server side.", a: true },
  { id: 13, t: "fill", c: "JavaScript", q: "Complete: const square = x => x ___ x;", a: "*", h: "arithmetic operator" },
  { id: 14, t: "fill", c: "React", q: "Hook to store mutable values without re-render: use___", a: "Ref", h: "access DOM elements" },
  { id: 15, t: "fill", c: "CSS", q: "To center flex items use: align-items: ____;", a: "center", h: "middle alignment" },
  { id: 16, t: "fill", c: "Node.js", q: "Import a module in Node.js: const x = ___('mod');", a: "require", h: "CommonJS import" },
  { id: 17, t: "mcq", c: "🧩 Puzzle", q: "What does this output?\nconsole.log(typeof null)", o: ['"null"', '"undefined"', '"object"', '"string"'], a: 2 },
  { id: 18, t: "mcq", c: "🧩 Puzzle", q: "Output?\nconsole.log(0.1 + 0.2 === 0.3)", o: ["true", "false", "undefined", "NaN"], a: 1 },
  { id: 19, t: "mcq", c: "🧩 Puzzle", q: "What does this return?\n[1,2,3].map(x => x * 2)", o: ["[1,2,3]", "[2,4,6]", "[3,6,9]", "undefined"], a: 1 },
  { id: 20, t: "mcq", c: "🧩 Puzzle", q: "What is logged?\nconst a=[1,2];const b=a;b.push(3);\nconsole.log(a.length)", o: ["2", "3", "1", "Error"], a: 1 },
];

const MODES = [
  { id: "easy",   label: "Easy",      emoji: "🌱", time: 30, color: "#43e97b", desc: "30s per question" },
  { id: "medium", label: "Medium",    emoji: "⚡", time: 20, color: "#a78bfa", desc: "20s per question" },
  { id: "hard",   label: "Hard",      emoji: "🔥", time: 12, color: "#f97316", desc: "12s per question" },
  { id: "vhard",  label: "Very Hard", emoji: "💀", time: 7,  color: "#ff4040", desc: "7s per question"  },
];

const CAT_CLR = { JavaScript: "#f7df1e", React: "#61dafb", CSS: "#60a5fa", "Node.js": "#68a063", MongoDB: "#4db33d", "🧩 Puzzle": "#f472b6" };

const OUTFITS = [
  { name: "Dev Purple",  j: "#7c3aed", jd: "#5b21b6", sh: "#f472b6", p: "#1e1b4b", pd: "#312e81", sw: "#f8fafc", sa: "#7c3aed" },
  { name: "Hacker Green",j: "#065f46", jd: "#064e3b", sh: "#6ee7b7", p: "#111827", pd: "#0f172a", sw: "#1f2937", sa: "#10b981" },
  { name: "Retro Amber", j: "#b45309", jd: "#92400e", sh: "#fde68a", p: "#78350f", pd: "#451a03", sw: "#f59e0b", sa: "#b45309" },
  { name: "Cyber Blue",  j: "#0e7490", jd: "#0c4a6e", sh: "#67e8f9", p: "#0f172a", pd: "#020617", sw: "#e0f2fe", sa: "#0ea5e9" },
  { name: "Pinky",       j: "#be185d", jd: "#9d174d", sh: "#fbcfe8", p: "#500724", pd: "#4a044e", sw: "#fce7f3", sa: "#ec4899" },
];

const TOTAL = 10;
const OUTFIT_INTERVAL = 3600;

// ─── Security helpers ────────────────────────────────────────────────────────

const _salt = Math.random().toString(36).slice(2);
const _enc = (v) => btoa(_salt + JSON.stringify(v) + _salt);
const _dec = (s) => { try { const r = atob(s); return JSON.parse(r.slice(_salt.length, r.length - _salt.length)); } catch { return null; } };

function secureShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Audio Engine (Web Audio API) ────────────────────────────────────────────

function createAudioEngine() {
  let ctx = null;
  let bgGain = null;
  let bgNodes = [];
  let bgPlaying = false;
  let muted = false;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      bgGain = ctx.createGain();
      bgGain.gain.value = 0.18;
      bgGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Synthesise a simple looping background track using oscillators + LFO
  function startBg(happy = true) {
    if (bgPlaying) return;
    bgPlaying = true;
    const c = getCtx();
    bgNodes.forEach(n => { try { n.stop(); } catch {} });
    bgNodes = [];

    // Base notes for a cheerful loop
    const notes = happy
      ? [261.63, 329.63, 392.00, 523.25, 392.00, 329.63] // C E G C G E
      : [220.00, 261.63, 220.00, 196.00, 174.61, 196.00]; // sad descending

    const tempo = happy ? 0.38 : 0.55; // seconds per note
    let t = c.currentTime + 0.05;

    function scheduleLoop() {
      notes.forEach((freq, i) => {
        // melody
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = happy ? "triangle" : "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, t + i * tempo);
        g.gain.linearRampToValueAtTime(0.35, t + i * tempo + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * tempo + tempo * 0.85);
        osc.connect(g); g.connect(bgGain);
        osc.start(t + i * tempo);
        osc.stop(t + i * tempo + tempo);
        bgNodes.push(osc);

        // bass (one octave down)
        if (i % 2 === 0) {
          const bass = c.createOscillator();
          const bg2 = c.createGain();
          bass.type = "sine";
          bass.frequency.value = freq / 2;
          bg2.gain.setValueAtTime(0, t + i * tempo);
          bg2.gain.linearRampToValueAtTime(0.18, t + i * tempo + 0.06);
          bg2.gain.exponentialRampToValueAtTime(0.001, t + i * tempo + tempo * 0.9);
          bass.connect(bg2); bg2.connect(bgGain);
          bass.start(t + i * tempo);
          bass.stop(t + i * tempo + tempo);
          bgNodes.push(bass);
        }
      });

      const loopDuration = notes.length * tempo;
      t += loopDuration;
      // schedule next loop before this one ends
      bgLoopTimer = setTimeout(scheduleLoop, (loopDuration - 0.3) * 1000);
    }

    scheduleLoop();
  }

  let bgLoopTimer = null;

  function stopBg() {
    bgPlaying = false;
    clearTimeout(bgLoopTimer);
    bgNodes.forEach(n => { try { n.stop(); } catch {} });
    bgNodes = [];
  }

  // One-shot sound effects
  function playCorrect() {
    if (muted) return;
    const c = getCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.26);
    });
  }

  function playWrong() {
    if (muted) return;
    const c = getCtx();
    [220, 196].forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.23);
    });
  }

  function playTick() {
    if (muted) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    g.gain.setValueAtTime(0.18, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(c.currentTime + 0.09);
  }

  function playUrgentTick() {
    if (muted) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "square";
    osc.frequency.value = 1100;
    g.gain.setValueAtTime(0.22, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(c.currentTime + 0.08);
  }

  function playWin() {
    if (muted) return;
    const c = getCtx();
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    fanfare.forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.31);
    });
  }

  function playLose() {
    if (muted) return;
    const c = getCtx();
    const sad = [392, 349.23, 329.63, 261.63];
    sad.forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = c.currentTime + i * 0.2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.4, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.46);
    });
  }

  function setMuted(val) {
    muted = val;
    if (bgGain) bgGain.gain.value = val ? 0 : 0.18;
  }

  function isMuted() { return muted; }

  return { startBg, stopBg, playCorrect, playWrong, playTick, playUrgentTick, playWin, playLose, setMuted, isMuted };
}

// Singleton audio engine
let _audioEngine = null;
function getAudio() {
  if (!_audioEngine) _audioEngine = createAudioEngine();
  return _audioEngine;
}

// ─── Canvas Character drawing ─────────────────────────────────────────────────

function drawCharacter(ctx, emotion, frame, blinking, dir, jumpY, dancePhase, outfit) {
  ctx.clearRect(0, 0, 110, 180);
  const O = outfit;
  const SKIN = "#f5c18e", HAIR = "#180909";
  ctx.save();
  if (dir === -1) { ctx.translate(110, 0); ctx.scale(-1, 1); }
  const t = frame * 0.14;
  const bob = emotion === "idle" ? Math.sin(t) * 2.5 : 0;
  const base = 10 + bob - jumpY;
  const ls = emotion === "idle" ? Math.sin(t) * 22 : emotion === "dancing" ? Math.sin(dancePhase * 0.22) * 30 : 0;
  const la = emotion === "idle" ? Math.sin(t) * 26 : emotion === "correct" ? -160 : emotion === "dancing" ? -70 + Math.sin(dancePhase * 0.2) * 40 : 8;
  const ra = emotion === "idle" ? -Math.sin(t) * 26 : emotion === "correct" ? 160 : emotion === "dancing" ? 70 - Math.sin(dancePhase * 0.2) * 40 : -8;
  const ht = (emotion === "wrong" || emotion === "sad") ? 7 : emotion === "idle" ? Math.sin(t * 0.4) * 1.5 : 0;
  const CW = 36, BX = 37, BY = base + 50, HX = 36, HY = base + 10;

  function drawArm(sx, sy, ang) {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang * Math.PI / 180);
    ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(-6, 0, 12, 20, 4); ctx.fill();
    ctx.fillStyle = O.j;  ctx.beginPath(); ctx.arc(0, 19, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(-5, 17, 10, 20, 3); ctx.fill();
    ctx.fillStyle = O.j;  ctx.beginPath(); ctx.roundRect(-5, 34, 10, 5, [0, 0, 2, 2]); ctx.fill();
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, 43, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e9ac74"; ctx.beginPath(); ctx.ellipse(-5, 41, 3, 4, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.13)"; ctx.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2, 39); ctx.lineTo(i * 2, 43); ctx.stroke(); }
    ctx.restore();
  }
  drawArm(BX - 3, BY + 5, la);
  drawArm(BX + CW + 3, BY + 5, ra);

  function drawLeg(tx, ang, flip) {
    ctx.save(); ctx.translate(tx, BY + 30); ctx.rotate(ang * Math.PI / 180);
    ctx.fillStyle = O.p;  ctx.beginPath(); ctx.roundRect(-7, 0, 14, 18, 2); ctx.fill();
    ctx.fillStyle = O.pd; ctx.beginPath(); ctx.roundRect(-7, 16, 14, 14, [0, 0, 2, 2]); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.beginPath(); ctx.roundRect(flip ? -7 : 0, 0, 5, 30, 1); ctx.fill();
    ctx.fillStyle = O.sw;
    if (flip) { ctx.beginPath(); ctx.roundRect(-9, 26, 21, 9, [2, 7, 3, 2]); ctx.fill(); }
    else       { ctx.beginPath(); ctx.roundRect(-9, 26, 21, 9, [7, 2, 2, 3]); ctx.fill(); }
    ctx.fillStyle = O.sa;
    if (flip) { ctx.beginPath(); ctx.roundRect(-9, 31, 21, 5, [0, 0, 3, 2]); ctx.fill(); }
    else       { ctx.beginPath(); ctx.roundRect(-9, 31, 21, 5, [0, 0, 2, 3]); ctx.fill(); }
    ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.beginPath(); ctx.roundRect(-5, 28, 9, 3, 1); ctx.fill();
    ctx.restore();
  }
  drawLeg(BX + 9,      ls, true);
  drawLeg(BX + CW - 9, -ls, false);

  ctx.fillStyle = O.j;  ctx.beginPath(); ctx.roundRect(BX, BY, CW, 32, [8, 8, 4, 4]); ctx.fill();
  ctx.fillStyle = O.sh; ctx.beginPath(); ctx.roundRect(BX + CW / 2 - 5, BY, 10, 32, [0, 0, 3, 3]); ctx.fill();
  ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(BX + CW / 2 - 1.5, BY, 3, 32, 0); ctx.fill();
  ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(BX, BY + 28, CW, 4, [0, 0, 3, 3]); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = "bold 7px monospace"; ctx.textBaseline = "top"; ctx.fillText("</>", BX + 2, BY + 7);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.roundRect(BX, BY, 6, 10, [8, 0, 0, 0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(BX + CW - 6, BY, 6, 10, [0, 8, 0, 0]); ctx.fill();
  ctx.fillStyle = "#e9ac74"; ctx.beginPath(); ctx.roundRect(BX + CW / 2 - 4, base + 48, 8, 7, 2); ctx.fill();

  const HW = 36, HH = 38;
  ctx.save(); ctx.translate(HX + HW / 2, HY + HH / 2); ctx.rotate(ht * Math.PI / 180);
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.roundRect(-HW / 2, -HH / 2, HW, HH, [12, 12, 11, 11]); ctx.fill();
  ctx.fillStyle = "#e9ac74";
  ctx.beginPath(); ctx.ellipse(-HW / 2 - 1, 2, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(HW / 2 + 1, 2, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.roundRect(-HW / 2, -HH / 2 - 5, HW, 18, [12, 12, 0, 0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-HW / 2 - 2, -HH / 2, 5, 14, [2, 0, 3, 4]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(HW / 2 - 3, -HH / 2 + 2, 4, 11, [0, 2, 3, 2]); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -HH / 2 + 5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#0a0404"; ctx.lineWidth = 0.8; ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-10 + i * 5, -HH / 2 + 2); ctx.lineTo(-8 + i * 5, -HH / 2 + 9); ctx.stroke(); }
  const bly = (emotion === "sad" || emotion === "wrong") ? 3 : 0;
  ctx.fillStyle = HAIR;
  ctx.save(); ctx.translate(-10, -5 + bly); ctx.rotate((emotion === "sad" || emotion === "wrong") ? 0.28 : (emotion === "correct" || emotion === "dancing") ? -0.22 : 0); ctx.beginPath(); ctx.roundRect(0, 0, 8, 3, [1, 2, 2, 1]); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(3, -5 + bly); ctx.rotate((emotion === "sad" || emotion === "wrong") ? -0.28 : (emotion === "correct" || emotion === "dancing") ? 0.22 : 0); ctx.beginPath(); ctx.roundRect(0, 0, 8, 3, [2, 1, 1, 2]); ctx.fill(); ctx.restore();
  const eyH = blinking ? 1 : 7;
  [[-11, -1], [4, -1]].forEach(([ex, ey]) => {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(ex, ey, 8, eyH, 3); ctx.fill();
    if (!blinking) {
      const px = (emotion === "correct" || emotion === "dancing") ? 1 : (emotion === "wrong" || emotion === "sad") ? -1 : 0;
      const py = (emotion === "correct" || emotion === "dancing") ? -1 : emotion === "sad" ? 2 : 0;
      ctx.fillStyle = "#1a0808"; ctx.beginPath(); ctx.arc(ex + 4 + px, ey + 3.5 + py, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.arc(ex + 5.5 + px, ey + 2 + py, 1.1, 0, Math.PI * 2); ctx.fill();
      if (emotion === "correct" || emotion === "dancing") { ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(ex + 4, ey + 3.5, 5, 0, Math.PI * 2); ctx.stroke(); }
    }
  });
  ctx.strokeStyle = "#1a0808"; ctx.lineWidth = 1.8; ctx.lineCap = "round";
  if (emotion === "correct" || emotion === "dancing") {
    ctx.beginPath(); ctx.arc(-1, 9, 6, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke();
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.ellipse(-1, 13, 4, 2.5, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = "#fff"; [-4, -1, 2].forEach(x => { ctx.beginPath(); ctx.arc(x, 10, 1.7, 0, Math.PI * 2); ctx.fill(); });
  } else if (emotion === "sad") {
    ctx.beginPath(); ctx.arc(-1, 13, 5, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
    ctx.fillStyle = "rgba(147,197,253,0.6)";
    ctx.beginPath(); ctx.ellipse(-11, 4, 2, 4, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, 4, 2, 4, -0.15, 0, Math.PI * 2); ctx.fill();
  } else if (emotion === "wrong") {
    ctx.beginPath(); ctx.arc(-1, 13, 5, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(-1, 9, 4, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
  }
  if (emotion === "correct") {
    ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#4ade80"; ctx.fillText("✓", 15, -HH / 2 - 3);
    const cc = ["#fbbf24", "#f472b6", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, r = 24; ctx.fillStyle = cc[i]; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r - 4, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (emotion === "wrong")   { ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#f87171"; ctx.fillText("✗", 15, -HH / 2 - 3); }
  if (emotion === "skipped") { ctx.font = "13px sans-serif"; ctx.fillStyle = "#fbbf24"; ctx.fillText("?", 15, -HH / 2 - 3); }
  if (emotion === "dancing") { ctx.font = "14px sans-serif"; ctx.fillText(["⭐", "✨"][Math.floor(frame / 10) % 2], 16, -HH / 2 - 3); }
  ctx.restore(); ctx.restore();
}

// ─── Character Canvas Component ───────────────────────────────────────────────

function CharacterCanvas({ phase, answered, emotion, sectionRef }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    cx: 120, cy: 120, vx: 0.7, vy: 0.55, dir: 1,
    frame: 0, blink: 0, blinking: false, emTimer: 0,
    jumpY: 0, shakeX: 0, dancePhase: 0,
    outfitIdx: 0, outfitTimer: 0,
    // freeze position for result screen
    frozenX: null, frozenY: null,
  });
  const emotionRef  = useRef(emotion);
  const phaseRef    = useRef(phase);
  const answeredRef = useRef(answered);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const toastTimerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => { emotionRef.current  = emotion;  }, [emotion]);
  useEffect(() => { phaseRef.current    = phase;    }, [phase]);
  useEffect(() => { answeredRef.current = answered; }, [answered]);

  const showToast = useCallback((msg) => {
    setToast({ msg, visible: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }, []);

  useEffect(() => {
    const cv  = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const s   = stateRef.current;

    function getSB() {
      const el = sectionRef?.current;
      if (!el) return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    function getCB() {
      const el = document.getElementById("qcard");
      if (!el) return null;
      const sr = getSB(), cr = el.getBoundingClientRect();
      return { x: cr.left - sr.x, y: cr.top - sr.y, w: cr.width, h: cr.height };
    }
    function steer() {
      const cb = getCB(); if (!cb) return;
      const PAD = 70, mcx = cb.x + cb.w / 2, mcy = cb.y + cb.h / 2;
      const hw = cb.w / 2 + PAD, hh = cb.h / 2 + PAD;
      const dx = s.cx - mcx, dy = s.cy - mcy;
      if (Math.abs(dx) < hw && Math.abs(dy) < hh) {
        if (Math.abs(dx) / hw < Math.abs(dy) / hh) s.vy += (dy > 0 ? 1 : -1) * 0.10;
        else s.vx += (dx > 0 ? 1 : -1) * 0.10;
      }
    }
    function walkStep() {
      const sb = getSB();
      const W = sb.w || window.innerWidth, H = sb.h || window.innerHeight, P = 28;
      steer();
      s.cx += s.vx; s.cy += s.vy;
      if (s.cx < P)     { s.cx = P;     s.vx =  Math.abs(s.vx) + 0.05; }
      if (s.cx > W - P) { s.cx = W - P; s.vx = -(Math.abs(s.vx) + 0.05); }
      if (s.cy < P)     { s.cy = P;     s.vy =  Math.abs(s.vy) + 0.05; }
      if (s.cy > H - P) { s.cy = H - P; s.vy = -(Math.abs(s.vy) + 0.05); }
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > 1.0) { s.vx = s.vx / sp * 1.0; s.vy = s.vy / sp * 1.0; }
      if (sp < 0.5) { s.vx = s.vx / sp * 0.5; s.vy = s.vy / sp * 0.5; }
      if (Math.random() < 0.004) { s.vx += (Math.random() - 0.5) * 0.25; s.vy += (Math.random() - 0.5) * 0.25; }
      if (s.vx >  0.08) s.dir =  1;
      if (s.vx < -0.08) s.dir = -1;
    }

    function loop() {
      const currentPhase = phaseRef.current;
      const e = emotionRef.current;

      // ── RESULT: character is frozen in place ──────────────────────────────
      if (currentPhase === "result") {
        // Save freeze position once
        if (s.frozenX === null) { s.frozenX = s.cx; s.frozenY = s.cy; }
        s.cx = s.frozenX; s.cy = s.frozenY;
        s.frame++;
        s.blink++;
        if (s.blink > 110) { s.blinking = true; if (s.blink > 122) { s.blinking = false; s.blink = 0; } }
        s.emTimer++;
        // Still animate the emotion pose (dancing/sad) but no movement
        if (e === "dancing") { s.dancePhase++; s.jumpY = Math.abs(Math.sin(s.emTimer * 0.22)) * 18; }
        else { s.jumpY = 0; s.shakeX = 0; }
        const sb = getSB();
        cv.style.left = (sb.x + s.cx - 55) + "px";
        cv.style.top  = (sb.y + s.cy - 90) + "px";
        drawCharacter(ctx, e, s.frame, s.blinking, s.dir, s.jumpY, s.dancePhase, OUTFITS[s.outfitIdx]);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Reset freeze when leaving result
      s.frozenX = null; s.frozenY = null;

      s.frame++;
      s.blink++;
      if (s.blink > 110) { s.blinking = true; if (s.blink > 122) { s.blinking = false; s.blink = 0; } }
      s.emTimer++;

      if (e === "correct")  s.jumpY  = Math.max(0, Math.sin(s.emTimer * 0.2) * 36);
      else if (e === "wrong")   s.shakeX = Math.sin(s.emTimer * 0.65) * 7 * Math.max(0, 1 - s.emTimer / 55);
      else if (e === "dancing") { s.dancePhase++; s.jumpY = Math.abs(Math.sin(s.emTimer * 0.22)) * 18; }
      else { s.jumpY = 0; s.shakeX = 0; }

      s.outfitTimer++;
      if (s.outfitTimer >= OUTFIT_INTERVAL) {
        s.outfitTimer = 0;
        s.outfitIdx   = (s.outfitIdx + 1) % OUTFITS.length;
        showToast("👕 Outfit changed: " + OUTFITS[s.outfitIdx].name);
      }

      const shouldWalk = currentPhase !== "playing" || !answeredRef.current;
      if (shouldWalk) walkStep();

      const sb = getSB();
      cv.style.left = (sb.x + s.cx - 55) + "px";
      cv.style.top  = (sb.y + s.cy - 90) + "px";
      drawCharacter(ctx, e, s.frame, s.blinking, s.dir, s.jumpY, s.dancePhase, OUTFITS[s.outfitIdx]);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sectionRef, showToast]);

  return (
    <>
      <canvas ref={canvasRef} width={110} height={180}
        style={{ position: "fixed", pointerEvents: "none", zIndex: 9999 }} />
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.15)",
        backdropFilter: "blur(8px)", padding: "8px 18px", borderRadius: 30,
        fontSize: 12, color: "#d4d4e8", zIndex: 10000,
        transition: "opacity .5s", pointerEvents: "none", whiteSpace: "nowrap",
        opacity: toast.visible ? 1 : 0,
      }}>{toast.msg}</div>
    </>
  );
}

// ─── Mute button ─────────────────────────────────────────────────────────────

function MuteButton({ muted, onToggle }) {
  return (
    <button onClick={onToggle} title={muted ? "Unmute" : "Mute"} style={{
      position: "fixed", top: 12, left: 12, zIndex: 10000,
      background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.15)",
      borderRadius: "50%", width: 38, height: 38, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, color: muted ? "#6b7280" : "#a78bfa",
      transition: "color .2s, border-color .2s",
    }}>{muted ? "🔇" : "🔊"}</button>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const Orbs = () => (
  <>
    <div style={{ position: "absolute", width: 500, height: 500, top: "-15%", left: "55%", background: "rgba(139,92,246,0.07)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />
    <div style={{ position: "absolute", width: 400, height: 400, top: "55%",  left: "-8%", background: "rgba(236,72,153,0.05)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />
  </>
);

const screen   = { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" };
const card     = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px" };
const statCard = { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: "20px 24px", minWidth: 100, textAlign: "center", flex: 1, maxWidth: 180 };

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onGoMode }) {
  const items = [["📝", "10", "Questions"], ["🎮", "4", "Difficulties"], ["🔥", "+15", "Streak bonus"], ["👕", "Auto", "Outfit swaps"]];
  return (
    <section id="qs" style={screen}>
      <Orbs />
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", marginBottom: 10 }}>Challenge Yourself</p>
        <h1 style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 12, background: "linear-gradient(135deg,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Dev Quiz</h1>
        <div style={{ width: 56, height: 4, background: "linear-gradient(135deg,#8b5cf6,#ec4899)", borderRadius: 2, margin: "0 auto 18px" }} />
        <p style={{ color: "#9ca3af", fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
          Test your knowledge across core software domains.<br />
          <strong style={{ color: "#e2e8f0" }}>10 questions · 4 difficulty modes · streak bonuses!</strong>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
          {items.map(([icon, val, label]) => (
            <div key={label} style={statCard}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#e2e8f0" }}>{val}</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        <button onClick={onGoMode} style={{ cursor: "pointer", border: "none", fontFamily: "inherit", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", color: "#fff", borderRadius: 50, padding: "16px 48px", fontSize: 17, fontWeight: 800 }}>
          Choose Difficulty 🎮
        </button>
      </div>
    </section>
  );
}

// ─── Mode Screen ──────────────────────────────────────────────────────────────

function ModeScreen({ selectedMode, onSelectMode, onBack, onStart }) {
  return (
    <section id="qs" style={screen}>
      <Orbs />
      <div style={{ maxWidth: 540, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "clamp(22px,4vw,38px)", fontWeight: 900, marginBottom: 6 }}>Pick Your Mode</h2>
        <p style={{ color: "#6b7280", marginBottom: 32 }}>Harder modes = faster timer + bigger challenge</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 500, margin: "0 auto 32px" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => onSelectMode(m.id)} style={{
              background:  selectedMode === m.id ? `${m.color}20` : "rgba(255,255,255,.04)",
              border:      `2px solid ${selectedMode === m.id ? m.color : "rgba(255,255,255,.1)"}`,
              boxShadow:   selectedMode === m.id ? `0 0 24px ${m.color}28` : "none",
              borderRadius: 16, padding: "18px 14px", color: "#fffffe",
              cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, textAlign: "center",
            }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{m.emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{m.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onBack} style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", fontFamily: "inherit", background: "rgba(255,255,255,0.07)", borderRadius: 50, padding: "13px 28px", color: "#fffffe", fontSize: 14, fontWeight: 600 }}>← Back</button>
          <button onClick={onStart} style={{ cursor: "pointer", border: "none", fontFamily: "inherit", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", color: "#fff", borderRadius: 50, padding: "13px 40px", fontSize: 16, fontWeight: 800 }}>Start Quiz 🚀</button>
        </div>
      </div>
    </section>
  );
}

// ─── Playing Screen ───────────────────────────────────────────────────────────

function PlayingScreen({ qs, cur, answered, sel, fill, onFillChange, score, streak, mode, timeLeft, results, onMCQ, onTF, onFill, getCorrectAnswer }) {
  const q = qs[cur];
  if (!q) return null;
  const M       = MODES.find(x => x.id === mode) || MODES[1];
  const catClr  = CAT_CLR[q.c] || "#a78bfa";
  const timerClr = timeLeft <= 5 ? "#ff4040" : M.color;
  const pct     = timeLeft / M.time;
  const circ    = 2 * Math.PI * 24;

  return (
    <section id="qs" style={{ ...screen, padding: "20px 14px" }}>
      <Orbs />
      <div style={{ maxWidth: 620, width: "100%", position: "relative", zIndex: 1 }}>
        {/* Top meta */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Timer ring */}
            <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
              <svg width="60" height="60" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="5" />
                <circle cx="30" cy="30" r="24" fill="none" stroke={timerClr} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                  style={{ transition: "stroke-dashoffset .3s linear, stroke .3s" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: timerClr, lineHeight: 1 }}>{timeLeft}</span>
                <span style={{ fontSize: 9, color: timerClr, lineHeight: 1.2 }}>sec</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Q {cur + 1} / {TOTAL}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Score: <strong style={{ color: M.color }}>{score}</strong></span>
                {streak >= 3 && <span style={{ background: "rgba(249,115,22,.18)", color: "#fb923c", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⚡ {streak}×</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${catClr}1a`, color: catClr, border: `1px solid ${catClr}40` }}>{q.c}</span>
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${M.color}1a`, color: M.color }}>{M.emoji} {M.label}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,.08)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#8b5cf6,#ec4899)", borderRadius: 10, width: `${((cur + 1) / TOTAL) * 100}%`, transition: "width .5s ease" }} />
        </div>

        {/* Question card */}
        <div id="qcard" style={card}>
          <h3 style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 700, lineHeight: 1.55, marginBottom: 24, whiteSpace: "pre-line", color: "#f1f5f9" }}>{q.q}</h3>

          {q.t === "mcq" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.o.map((opt, i) => {
                const correct = answered && i === getCorrectAnswer(cur);
                const wrong   = answered && sel === i && !correct;
                return (
                  <button key={i} disabled={answered} onClick={() => onMCQ(i)} style={{
                    width: "100%", background: correct ? "rgba(67,233,123,.14)" : wrong ? "rgba(255,101,132,.14)" : "rgba(255,255,255,0.04)",
                    border: `2px solid ${correct ? "#43e97b" : wrong ? "#ff6584" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 14, padding: "14px 16px", color: correct ? "#43e97b" : wrong ? "#ff6584" : "#fffffe",
                    cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit",
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: correct ? "#43e97b" : wrong ? "#ff6584" : "rgba(255,255,255,.09)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, color: (correct || wrong) ? "#fff" : undefined }}>
                      {correct ? "✓" : wrong ? "✗" : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.t === "truefalse" && (
            <div style={{ display: "flex", gap: 12 }}>
              {[true, false].map(v => {
                const correct = answered && v === getCorrectAnswer(cur);
                const wrong   = answered && sel === v && !correct;
                return (
                  <button key={String(v)} disabled={answered} onClick={() => onTF(v)} style={{
                    flex: 1, padding: 18, borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
                    background: correct ? "rgba(67,233,123,.14)" : wrong ? "rgba(255,101,132,.14)" : "rgba(255,255,255,.04)",
                    border: `2px solid ${correct ? "#43e97b" : wrong ? "#ff6584" : "rgba(255,255,255,.1)"}`,
                    color: correct ? "#43e97b" : wrong ? "#ff6584" : "#fffffe", fontFamily: "inherit",
                  }}>{v ? "True" : "False"}</button>
                );
              })}
            </div>
          )}

          {q.t === "fill" && (() => {
            const lastR = results[results.length - 1];
            return (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text" disabled={answered} value={fill}
                    onChange={e => onFillChange(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") onFill(); }}
                    placeholder={`Your answer… hint: ${q.h}`}
                    style={{ flex: 1, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,.06)", border: "2px solid rgba(255,255,255,.1)", color: "#fffffe", fontSize: 14, fontFamily: "inherit", outline: "none", height: 50 }}
                  />
                  {!answered && (
                    <button onClick={onFill} style={{ background: "linear-gradient(135deg,#8b5cf6,#ec4899)", color: "#fff", border: "none", borderRadius: 14, padding: "0 22px", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit", height: 50 }}>Submit</button>
                  )}
                </div>
                {answered && lastR && (
                  <div style={{ marginTop: 10, padding: "11px 14px", borderRadius: 12, fontSize: 13, background: lastR.ok ? "rgba(67,233,123,.1)" : "rgba(255,101,132,.1)", border: `1px solid ${lastR.ok ? "#43e97b" : "#ff6584"}`, color: lastR.ok ? "#43e97b" : "#ff6584" }}>
                    {lastR.ok ? "✓ Correct!" : <>✗ Correct answer: <strong>{q.a}</strong></>}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </section>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ results, score, mode, onChangeMode, onPlayAgain }) {
  const ok  = results.filter(r => r.ok).length;
  const pct = Math.round((score / (TOTAL * 10)) * 100);
  const M   = MODES.find(x => x.id === mode) || MODES[1];
  return (
    <section id="qs" style={{ ...screen, padding: "24px 14px 60px" }}>
      <Orbs />
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "clamp(24px,4vw,46px)", fontWeight: 900, marginBottom: 8 }}>{pct >= 50 ? "Nailed it! 🎉" : "Game Over 😢"}</h2>
        <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 28 }}>
          <span style={{ background: `${M.color}1a`, color: M.color, padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{M.emoji} {M.label}</span>
          &nbsp;·&nbsp;{ok}/{TOTAL} correct&nbsp;·&nbsp;<strong style={{ color: "#a78bfa" }}>{score} pts</strong>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {[["Correct", ok, "#43e97b"], ["Score", score, "#a78bfa"], ["Accuracy", pct + "%", M.color]].map(([l, v, c]) => (
            <div key={l} style={statCard}><div style={{ fontSize: 24, fontWeight: 900, color: c }}>{v}</div><div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{l}</div></div>
          ))}
        </div>
        <div style={{ marginBottom: 28, maxHeight: 280, overflowY: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,.08)" }}>
          {results.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: r.ok ? "rgba(67,233,123,.06)" : "rgba(255,101,132,.06)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{r.ok ? "✅" : "❌"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.4 }}>{r.q.q.replace(/\n.*/,"").slice(0, 70)}{r.q.q.length > 70 ? "…" : ""}</div>
                {!r.ok && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Answer: <span style={{ color: "#43e97b" }}>{String(r.q.a)}</span></div>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.ok ? "#43e97b" : "#6b7280", flexShrink: 0 }}>{r.ok ? "+10" : "0"}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onChangeMode} style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", fontFamily: "inherit", background: "rgba(255,255,255,0.07)", borderRadius: 50, padding: "13px 28px", color: "#fffffe", fontSize: 14, fontWeight: 600 }}>Change Mode</button>
          <button onClick={onPlayAgain} style={{ cursor: "pointer", border: "none", fontFamily: "inherit", background: "linear-gradient(135deg,#8b5cf6,#ec4899)", color: "#fff", borderRadius: 50, padding: "14px 40px", fontSize: 16, fontWeight: 800 }}>Play Again 🔄</button>
        </div>
      </div>
    </section>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function DevQuiz() {
  const [phase,    setPhase]    = useState("intro");
  const [mode,     setMode]     = useState("medium");
  const [qs,       setQs]       = useState([]);
  const [cur,      setCur]      = useState(0);
  const [sel,      setSel]      = useState(null);
  const [fill,     setFill]     = useState("");
  const [answered, setAnswered] = useState(false);
  const [score,    setScore]    = useState(0);
  const [results,  setResults]  = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [streak,   setStreak]   = useState(0);
  const [emotion,  setEmotion]  = useState("idle");
  const [muted,    setMuted]    = useState(false);
  const sectionRef = useRef(null);

  const answerCacheRef = useRef({});
  const committedRef   = useRef(false);
  const lastCommitRef  = useRef(0);
  const timerRef       = useRef(null);
  const prevTimeRef    = useRef(null);

  // ── Audio ────────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    getAudio().setMuted(next);
  };

  // Start / stop background music based on phase
  useEffect(() => {
    const audio = getAudio();
    if (phase === "playing") {
      audio.startBg(true);
    } else if (phase === "result") {
      audio.stopBg();
    } else {
      audio.stopBg();
    }
  }, [phase]);

  // Play tick sounds when timer changes during playing
  useEffect(() => {
    if (phase !== "playing" || answered) return;
    if (prevTimeRef.current === null) { prevTimeRef.current = timeLeft; return; }
    if (timeLeft <= 5 && timeLeft > 0) getAudio().playUrgentTick();
    else if (timeLeft > 0)             getAudio().playTick();
    prevTimeRef.current = timeLeft;
  }, [timeLeft, phase, answered]);

  // ── Answer cache ─────────────────────────────────────────────────────────
  const cacheAnswers = (questions) => {
    const cache = {};
    questions.forEach((q, i) => { cache[i] = _enc(q.a); });
    answerCacheRef.current = cache;
  };
  const getCA = useCallback((idx) => _dec(answerCacheRef.current[idx]), []);

  const canCommit = () => {
    const n = Date.now();
    if (n - lastCommitRef.current < 300) return false;
    lastCommitRef.current = n;
    return true;
  };

  const checkAns = useCallback((q, idx, userSel) => {
    const correct = getCA(idx);
    if (correct === null) return false;
    if (q.t === "mcq")      return userSel === correct;
    if (q.t === "truefalse") return userSel === correct;
    if (q.t === "fill")     return typeof userSel === "string" && userSel.trim().toLowerCase() === String(correct).toLowerCase();
    return false;
  }, [getCA]);

  const startTimer = useCallback((currentMode, currentQs, currentCur) => {
    clearInterval(timerRef.current);
    prevTimeRef.current = null;
    const M = MODES.find(x => x.id === currentMode) || MODES[1];
    let tl = M.time;
    setTimeLeft(tl);
    timerRef.current = setInterval(() => {
      tl--;
      setTimeLeft(tl);
      if (tl <= 0) {
        clearInterval(timerRef.current);
        commitRef.current(null, true, currentMode, currentQs, currentCur);
      }
    }, 1000);
  }, []);

  const commitRef = useRef(null);
  commitRef.current = (userAnswer, timedOut = false, commitMode, commitQs, commitCur) => {
    if (committedRef.current) return;
    committedRef.current = true;
    clearInterval(timerRef.current);

    const curQs  = commitQs  || qs;
    const curIdx = commitCur !== undefined ? commitCur : cur;
    const curMode = commitMode || mode;
    const q      = curQs[curIdx];
    const blank  = userAnswer === null || userAnswer === undefined || (typeof userAnswer === "string" && userAnswer.trim() === "");
    const ok     = !timedOut && !blank && checkAns(q, curIdx, userAnswer);

    // Play sound effect
    const audio = getAudio();
    if (ok)                      audio.playCorrect();
    else if (!blank && !timedOut) audio.playWrong();

    setAnswered(true);
    setSel(userAnswer);
    setStreak(prev => {
      const newStreak = ok ? prev + 1 : 0;
      setScore(s => s + (ok ? (newStreak >= 3 ? 15 : 10) : 0));
      return newStreak;
    });
    setEmotion(timedOut || blank ? "skipped" : ok ? "correct" : "wrong");
    setResults(prev => [...prev, { q, userAnswer, ok, timedOut: timedOut || blank }]);

    setTimeout(() => {
      const next = curIdx + 1;
      if (next >= TOTAL) {
        // Play win / lose fanfare
        const finalOk = ok; // captured in this closure
        setScore(s => {
          const finalScore = s;
          setTimeout(() => {
            if (finalScore / (TOTAL * 10) >= 0.5) audio.playWin();
            else                                    audio.playLose();
          }, 100);
          return s;
        });
        setPhase("result");
        setEmotion(score + (ok ? 10 : 0) >= TOTAL * 10 * 0.5 ? "dancing" : "sad");
      } else {
        setCur(next);
        setSel(null);
        setFill("");
        setAnswered(false);
        committedRef.current = false;
        setEmotion("idle");
        startTimer(curMode, curQs, next);
      }
    }, timedOut || blank ? 900 : 1400);
  };

  const startQuiz = useCallback((selectedMode) => {
    const shuffled = secureShuffle(ALL_Q).slice(0, TOTAL);
    cacheAnswers(shuffled);
    committedRef.current = false;
    const m = selectedMode || mode;
    const M = MODES.find(x => x.id === m) || MODES[1];
    setQs(shuffled);
    setCur(0);
    setSel(null);
    setFill("");
    setAnswered(false);
    setScore(0);
    setResults([]);
    setStreak(0);
    setEmotion("idle");
    setTimeLeft(M.time);
    setPhase("playing");
    setTimeout(() => startTimer(m, shuffled, 0), 50);
  }, [mode, startTimer]);

  const handleMCQ  = (i) => { if (!answered && canCommit()) commitRef.current(i); };
  const handleTF   = (v) => { if (!answered && canCommit()) commitRef.current(v); };
  const handleFill = ()  => { if (!answered && fill.trim() && canCommit()) commitRef.current(fill); };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", background: "#0a0918", color: "#fffffe", minHeight: "100vh" }} ref={sectionRef}>
      {/* Fixed HUD */}
      <div style={{ position: "fixed", top: 12, right: 12, background: "rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,.1)", padding: "5px 10px", borderRadius: 20, fontSize: 10, color: "#6b7280", zIndex: 10000, pointerEvents: "none" }}>🔒 Quiz secured</div>
      <MuteButton muted={muted} onToggle={toggleMute} />

      <CharacterCanvas phase={phase} answered={answered} emotion={emotion} sectionRef={sectionRef} />

      {phase === "intro" && <IntroScreen onGoMode={() => setPhase("mode")} />}
      {phase === "mode"  && (
        <ModeScreen selectedMode={mode} onSelectMode={setMode} onBack={() => setPhase("intro")} onStart={() => startQuiz(mode)} />
      )}
      {phase === "playing" && (
        <PlayingScreen
          qs={qs} cur={cur} answered={answered} sel={sel} fill={fill}
          onFillChange={setFill} score={score} streak={streak} mode={mode}
          timeLeft={timeLeft} results={results}
          onMCQ={handleMCQ} onTF={handleTF} onFill={handleFill}
          getCorrectAnswer={getCA}
        />
      )}
      {phase === "result" && (
        <ResultScreen
          results={results} score={score} mode={mode}
          onChangeMode={() => setPhase("mode")}
          onPlayAgain={() => startQuiz(mode)}
        />
      )}
    </div>
  );
}
