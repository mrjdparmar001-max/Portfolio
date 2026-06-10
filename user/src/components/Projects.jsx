import { useEffect, useRef, useState } from "react";

const O = {
  j: "#7c3aed", jd: "#5b21b6", sh: "#f472b6",
  p: "#1e1b4b", pd: "#312e81", sw: "#f8fafc", sa: "#7c3aed",
};
const SKIN = "#f5c18e";
const HAIR = "#180909";

const PHONEMES = [0.9,0.3,0.8,0.15,0.95,0.4,0.7,0.2,0.85,0.5,0.6,0.1,0.9,0.35,0.75,0.25];

const PHRASES = [
  "No projects here yet!",
  "Try a different category.",
  "Nothing to show right now.",
  "Come back soon! 👀",
  "This section is empty!",
];

// ── arm: pivots from shoulder, ang in degrees ─────────────────────────────────
function drawArm(ctx, sx, sy, ang) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate((ang * Math.PI) / 180);
  // upper arm
  ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(-6, 0, 12, 20, 4); ctx.fill();
  // elbow
  ctx.fillStyle = O.j;  ctx.beginPath(); ctx.arc(0, 19, 5.5, 0, Math.PI * 2); ctx.fill();
  // forearm
  ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(-5, 17, 10, 20, 3); ctx.fill();
  // cuff
  ctx.fillStyle = O.j;  ctx.beginPath(); ctx.roundRect(-5, 34, 10, 5, [0,0,2,2]); ctx.fill();
  // hand
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, 43, 6.5, 0, Math.PI * 2); ctx.fill();
  // thumb
  ctx.fillStyle = "#e9ac74"; ctx.beginPath(); ctx.ellipse(-5, 41, 3, 4, 0.4, 0, Math.PI * 2); ctx.fill();
  // knuckles
  ctx.strokeStyle = "rgba(0,0,0,0.13)"; ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * 2, 39); ctx.lineTo(i * 2, 43); ctx.stroke();
  }
  ctx.restore();
}

function drawLeg(ctx, tx, baseY, flip) {
  ctx.save();
  ctx.translate(tx, baseY);
  ctx.fillStyle = O.p;  ctx.beginPath(); ctx.roundRect(-7,0,14,18,2); ctx.fill();
  ctx.fillStyle = O.pd; ctx.beginPath(); ctx.roundRect(-7,16,14,14,[0,0,2,2]); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.beginPath(); ctx.roundRect(flip?-7:0,0,5,30,1); ctx.fill();
  ctx.fillStyle = O.sw;
  if(flip){ ctx.beginPath(); ctx.roundRect(-9,26,21,9,[2,7,3,2]); ctx.fill(); }
  else    { ctx.beginPath(); ctx.roundRect(-9,26,21,9,[7,2,2,3]); ctx.fill(); }
  ctx.fillStyle = O.sa;
  if(flip){ ctx.beginPath(); ctx.roundRect(-9,31,21,5,[0,0,3,2]); ctx.fill(); }
  else    { ctx.beginPath(); ctx.roundRect(-9,31,21,5,[0,0,2,3]); ctx.fill(); }
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath(); ctx.roundRect(-5,28,9,3,1); ctx.fill();
  ctx.restore();
}

/**
 * shrug  0..1  — 0 = arms down idle, 1 = full shrug (arms out + up)
 * mouth  0..1  — lip-sync open amount
 */
function drawCharacter(ctx, frame, blinking, mouth, shrug) {
  ctx.clearRect(0, 0, 180, 230);
  ctx.save();

  const t   = frame * 0.055;
  const bob = Math.sin(t) * 2.5;

  const CW = 36, BX = 72, BY = 58 + bob;
  const HX = 71, HY = 18 + bob;

  // ── Shrug arm angles ──────────────────────────────────────────────────────
  // Idle:  left arm slightly back (~8°), right mirrored (-8°)
  // Shrug: left arm raises outward to ~-110° (up+out), right to ~110°
  const idleL  =  8  + Math.sin(t * 0.7) * 6;
  const idleR  = -8  - Math.sin(t * 0.7) * 6;
  const shrugL = -115;   // left arm up-and-out
  const shrugR =  115;   // right arm up-and-out (mirrored)

  const la = idleL  + (shrugL - idleL)  * shrug;
  const ra = idleR  + (shrugR - idleR)  * shrug;

  // Draw arms BEHIND body
  drawArm(ctx, BX - 3,      BY + 5, la);
  drawArm(ctx, BX + CW + 3, BY + 5, ra);

  // Legs — static stand
  drawLeg(ctx, BX + 9,      BY + 30, true);
  drawLeg(ctx, BX + CW - 9, BY + 30, false);

  // Body
  ctx.fillStyle = O.j;  ctx.beginPath(); ctx.roundRect(BX,BY,CW,32,[8,8,4,4]); ctx.fill();
  ctx.fillStyle = O.sh; ctx.beginPath(); ctx.roundRect(BX+CW/2-5,BY,10,32,[0,0,3,3]); ctx.fill();
  ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(BX+CW/2-1.5,BY,3,32,0); ctx.fill();
  ctx.fillStyle = O.jd; ctx.beginPath(); ctx.roundRect(BX,BY+28,CW,4,[0,0,3,3]); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.font = "bold 7px monospace"; ctx.textBaseline = "top";
  ctx.fillText("</>", BX+2, BY+7);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.roundRect(BX,BY,6,10,[8,0,0,0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(BX+CW-6,BY,6,10,[0,8,0,0]); ctx.fill();

  // Neck
  ctx.fillStyle = "#e9ac74";
  ctx.beginPath(); ctx.roundRect(BX+CW/2-4, 52+bob, 8, 7, 2); ctx.fill();

  // ── Head ─────────────────────────────────────────────────────────────────
  const HW = 36, HH = 38;
  ctx.save();
  ctx.translate(HX + HW/2, HY + HH/2);

  // Shoulder shrug raises shoulders — tilt head slightly when shrugging
  const tiltIdle  = Math.sin(t * 0.9) * 2.2;
  const tiltShrug = Math.sin(t * 1.5) * 5;   // more expressive wobble
  ctx.rotate(((tiltIdle + (tiltShrug - tiltIdle) * shrug) * Math.PI) / 180);

  // Face
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.roundRect(-HW/2,-HH/2,HW,HH,[12,12,11,11]); ctx.fill();

  // Ears
  ctx.fillStyle = "#e9ac74";
  ctx.beginPath(); ctx.ellipse(-HW/2-1,2,4,5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( HW/2+1,2,4,5,0,0,Math.PI*2); ctx.fill();

  // Hair
  ctx.fillStyle = HAIR;
  ctx.beginPath(); ctx.roundRect(-HW/2,-HH/2-5,HW,18,[12,12,0,0]); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-HW/2-2,-HH/2,5,14,[2,0,3,4]); ctx.fill();
  ctx.beginPath(); ctx.roundRect( HW/2-3,-HH/2+2,4,11,[0,2,3,2]); ctx.fill();
  ctx.beginPath(); ctx.arc(2,-HH/2+5,4,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#0a0404"; ctx.lineWidth=0.8; ctx.lineCap="round";
  for(let i=0;i<4;i++){
    ctx.beginPath(); ctx.moveTo(-10+i*5,-HH/2+2); ctx.lineTo(-8+i*5,-HH/2+9); ctx.stroke();
  }

  // Eyebrows
  // When shrugging: brows arch up (raised + inner corners raised = confused/helpless)
  const browBaseY   = -5;
  const browTalkY   = browBaseY - mouth * 3;
  const browShrugYL = browTalkY - shrug * 5;     // left brow high
  const browShrugYR = browTalkY - shrug * 3;     // right brow slightly less

  ctx.fillStyle = HAIR;
  // Left brow — tilts inward on shrug (helpless look)
  ctx.save();
  ctx.translate(-10, browShrugYL);
  ctx.rotate(shrug * 0.25); // slight inward tilt
  ctx.beginPath(); ctx.roundRect(0,0,8,3,[1,2,2,1]); ctx.fill();
  ctx.restore();

  // Right brow
  ctx.save();
  ctx.translate(3, browShrugYR);
  ctx.rotate(-shrug * 0.25);
  ctx.beginPath(); ctx.roundRect(0,0,8,3,[2,1,1,2]); ctx.fill();
  ctx.restore();

  // Eyes
  const eyH = blinking ? 1 : 7;
  [[-11,-1],[4,-1]].forEach(([ex,ey])=>{
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.roundRect(ex,ey,8,eyH,3); ctx.fill();
    if(!blinking){
      ctx.fillStyle="#1a0808"; ctx.beginPath(); ctx.arc(ex+4,ey+3.5,2.8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.arc(ex+5.5,ey+2,1.1,0,Math.PI*2); ctx.fill();
    }
  });

  // Mouth
  ctx.strokeStyle="#1a0808"; ctx.lineWidth=1.8; ctx.lineCap="round";
  if(mouth > 0.05){
    const openH = mouth * 7;
    ctx.fillStyle="#1a0808";
    ctx.beginPath(); ctx.ellipse(-1,9+mouth*3,5+mouth*2,openH+1,0,0,Math.PI*2); ctx.fill();
    if(mouth > 0.3){
      ctx.fillStyle="#fff";
      ctx.beginPath(); ctx.roundRect(-4,9-openH*0.15,8,openH*0.45,1); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(-1,9,4+mouth*2,0.05*Math.PI,0.95*Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(-1,9+mouth*6,4+mouth*2,1.05*Math.PI,1.95*Math.PI); ctx.stroke();
  } else {
    // Shrug → slight "meh" flat mouth; idle → small smile
    const smileAmt = 1 - shrug;
    ctx.beginPath();
    ctx.arc(-1, 9, 4, 0.1*Math.PI*smileAmt + 0.35*Math.PI*(1-smileAmt),
                     (1 - 0.1*smileAmt)*Math.PI - 0.35*Math.PI*(1-smileAmt));
    ctx.stroke();
  }

  ctx.restore(); // head
  ctx.restore(); // global
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EmptyState({ category = "this category" }) {
  const canvasRef = useRef(null);
  const S = useRef({
    frame:0, blink:0, blinking:false, mouth:0, shrug:0,
    talking:false, pausing:false,
    phraseIdx:0, charIdx:0,
    typeTimer:0, pauseTimer:0,
    phonemeIdx:0, phonemeTimer:0, phonemeDur:5,
  });

  const [text,       setText]       = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(()=>{
    const cv = canvasRef.current;
    if(!cv) return;
    const ctx = cv.getContext("2d");
    const s   = S.current;
    let raf;

    const kick = setTimeout(()=>{
      s.talking=true; s.pausing=false;
      s.charIdx=0; s.typeTimer=14;
      s.phonemeIdx=0; s.phonemeTimer=0;
      setText(""); setShowCursor(false);
    }, 700);

    function loop(){
      s.frame++;

      // Blink
      s.blink++;
      if(s.blink>110) s.blinking=true;
      if(s.blink>122){ s.blinking=false; s.blink=0; }

      // ── Talking / pause FSM ──────────────────────────────────────────────
      if(s.pausing){
        s.mouth += (0 - s.mouth) * 0.15;
        s.pauseTimer--;
        if(s.pauseTimer<=0){
          s.phraseIdx  = (s.phraseIdx+1) % PHRASES.length;
          s.charIdx    = 0;
          s.talking    = true; s.pausing=false;
          s.typeTimer  = 14;
          s.phonemeIdx = 0; s.phonemeTimer=0;
          setText(""); setShowCursor(false);
        }
      } else if(s.talking){
        s.phonemeTimer++;
        if(s.phonemeTimer>=s.phonemeDur){
          s.phonemeTimer=0;
          s.phonemeDur=4+Math.floor(Math.random()*6);
          s.phonemeIdx=(s.phonemeIdx+1)%PHONEMES.length;
        }
        s.mouth += (PHONEMES[s.phonemeIdx] - s.mouth) * 0.28;

        s.typeTimer--;
        if(s.typeTimer<=0){
          const phrase=PHRASES[s.phraseIdx];
          if(s.charIdx<phrase.length){
            s.charIdx++;
            setText(phrase.slice(0,s.charIdx));
            const ch=phrase[s.charIdx-1];
            s.typeTimer=" !?.,".includes(ch)?55:15+Math.random()*12;
          } else {
            s.talking=false; s.pausing=true;
            s.pauseTimer=160; s.mouth=0;
            setShowCursor(true);
          }
        }
      } else {
        s.mouth += (0 - s.mouth) * 0.15;
      }

      // ── Shrug animation ──────────────────────────────────────────────────
      // Shrug in during first phrase, hold, lower between phrases
      const targetShrug = s.talking || (s.pausing && s.pauseTimer > 60) ? 1 : 0;
      s.shrug += (targetShrug - s.shrug) * 0.06;

      drawCharacter(ctx, s.frame, s.blinking, s.mouth, s.shrug);
      raf = requestAnimationFrame(loop);
    }

    loop();
    return ()=>{ cancelAnimationFrame(raf); clearTimeout(kick); };
  },[]);

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"60px 20px 80px", textAlign:"center",
      userSelect:"none",
    }}>
      <style>{`
        @keyframes blink-cur { 50%{opacity:0;} }
        @keyframes bubble-pop { from{opacity:0;transform:translateX(-50%) scale(0.8);} to{opacity:1;transform:translateX(-50%) scale(1);} }
      `}</style>

      <div style={{ position:"relative", width:180, height:230, marginBottom:20 }}>

        {/* Speech bubble */}
        <div style={{
          position:"absolute", top:-72, left:"50%",
          transform:"translateX(-50%)",
          background:"rgba(255,255,255,0.07)",
          border:"1px solid rgba(255,255,255,0.18)",
          backdropFilter:"blur(10px)",
          borderRadius:14, padding:"10px 18px",
          fontSize:13, fontWeight:500, color:"#e2e8f0",
          whiteSpace:"nowrap", minWidth:220, minHeight:40,
          display:"flex", alignItems:"center",
          animation:"bubble-pop 0.35s ease",
          boxShadow:"0 4px 24px rgba(0,0,0,0.3)",
        }}>
          <span style={{flex:1}}>{text}</span>
          {showCursor && (
            <span style={{
              display:"inline-block", width:2, height:13,
              background:"#a78bfa", verticalAlign:"middle",
              marginLeft:2, borderRadius:1,
              animation:"blink-cur 0.55s step-end infinite",
            }}/>
          )}
          {/* Tail */}
          <span style={{
            position:"absolute", bottom:-9, left:"50%",
            transform:"translateX(-50%)",
            borderLeft:"6px solid transparent",
            borderRight:"6px solid transparent",
            borderTop:"9px solid rgba(255,255,255,0.18)",
          }}/>
        </div>

        <canvas ref={canvasRef} width={180} height={230}/>
      </div>

      <h3 style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:8, marginTop:4 }}>
        No projects in <span style={{color:"#a78bfa"}}>{category}</span>
      </h3>
      <p style={{ color:"#6b7280", fontSize:14, lineHeight:1.75, maxWidth:300 }}>
        Nothing here yet — try browsing another category
        <br/>or check back soon.
      </p>
    </div>
  );
}
