import React, { useEffect, useRef } from 'react';
import { PieceType, Color } from '../lib/chess';
import { sounds } from '../lib/sounds';

interface AbilityEffectProps {
  attackerType: PieceType;
  attackerColor: Color;
  capturedType: PieceType;
  capturedColor: Color;
  onDone: () => void;
}

const DURATION: Record<PieceType, number> = {
  queen:  1300,
  knight: 900,
  bishop: 1100,
  rook:   1100,
  king:   1050,
  pawn:   950,
};

const PIECE_GLOW: Record<PieceType, string> = {
  pawn:   '#22c55e',
  knight: '#eab308',
  bishop: '#8b5cf6',
  rook:   '#3b82f6',
  queen:  '#a855f7',
  king:   '#ef4444',
};


const ABILITY_LABEL: Record<PieceType, string> = {
  queen:  'HOLLOW PURPLE',
  knight: 'FLYING THUNDER GOD',
  bishop: 'KYOKA SUIGETSU',
  rook:   'DETROIT SMASH',
  king:   'GEASS COMMAND',
  pawn:   'SPORE RELEASE',
};

/* ── White-piece filter used for attacker ghost ── */
const WHITE_IMG = 'saturate(1.5) brightness(1.1) contrast(1.1)';
const BLACK_IMG  = 'brightness(0.85) saturate(1.3) hue-rotate(200deg) contrast(1.1)';

function pieceFilter(color: Color) {
  return color === 'white' ? WHITE_IMG : BLACK_IMG;
}

const PIECE_SIZE_ADJUST: Record<PieceType, number> = {
  pawn: 0.85,
  knight: 0.95,
  bishop: 0.95,
  rook: 0.92,
  queen: 0.92,
  king: 0.95,
};




/* ──────────────────────────────────────────────
   GOJO — HOLLOW PURPLE
   Blue orb from left + Red orb from right → collide → Purple obliteration
────────────────────────────────────────────── */
function GojoEffect({ dur }: { dur: number }) {
  return (
    <>
      {/* Board flash */}
      <div style={{ position:'absolute', inset:0, animation:`gojoBoardFlash ${dur}ms ease-out forwards`, zIndex:1 }} />

      {/* BLUE orb (Infinity / Blue technique) */}
      <div style={{
        position:'absolute', top:'25%', left:'5%',
        width:'40%', height:'40%',
        borderRadius:'50%',
        background:'radial-gradient(circle, #93c5fd 0%, #3b82f6 50%, #1d4ed880 100%)',
        boxShadow:'0 0 30px #3b82f6, 0 0 60px #60a5fa80',
        animation:`gojoBlueOrb ${dur * 0.7}ms cubic-bezier(.2,.8,.6,1) forwards`,
        zIndex:4,
      }} />

      {/* RED orb (Reversed Red) */}
      <div style={{
        position:'absolute', top:'25%', right:'5%',
        width:'40%', height:'40%',
        borderRadius:'50%',
        background:'radial-gradient(circle, #fca5a5 0%, #ef4444 50%, #b91c1c80 100%)',
        boxShadow:'0 0 30px #ef4444, 0 0 60px #f8717180',
        animation:`gojoRedOrb ${dur * 0.7}ms cubic-bezier(.2,.8,.6,1) forwards`,
        zIndex:4,
      }} />

      {/* HOLLOW PURPLE: explosion orb at center */}
      <div style={{
        position:'absolute', top:'15%', left:'15%',
        width:'70%', height:'70%',
        borderRadius:'50%',
        background:'radial-gradient(circle, #fff 0%, #e879f9 20%, #a855f7 55%, #7c3aed00 100%)',
        boxShadow:'0 0 60px #a855f7, 0 0 120px #7c3aed',
        animation:`hollowPurpleBlast ${dur * 0.85}ms ease-out ${dur * 0.28}ms forwards`,
        opacity:0,
        zIndex:5,
      }} />

      {/* Outer ring */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:'absolute', inset:`${12 + i*5}%`,
          border:`${3-i}px solid #a855f7`,
          borderRadius:'50%',
          animation:`hollowPurpleBlast ${dur * 0.6}ms ease-out ${dur * 0.42 + i*80}ms forwards`,
          opacity:0,
          boxShadow:`0 0 20px #a855f760`,
          zIndex:6,
        }} />
      ))}

      <KillLabel label={ABILITY_LABEL.queen} color="#a855f7" dur={dur} />
    </>
  );
}

/* ──────────────────────────────────────────────
   MINATO — FLYING THUNDER GOD
   Yellow flash teleportation + speed streaks + kunai seal spins
────────────────────────────────────────────── */
function MinatoEffect({ dur }: { dur: number }) {
  const streaks = [
    { top:'20%', left:0, right:0, rot:'0deg',   delay:0    },
    { top:'45%', left:0, right:0, rot:'-8deg',  delay:60   },
    { top:'70%', left:0, right:0, rot:'5deg',   delay:120  },
    { top:'30%', left:0, right:0, rot:'35deg',  delay:30   },
    { top:'60%', left:0, right:0, rot:'-30deg', delay:90   },
  ];
  return (
    <>
      {/* Board flash (rapid blinks) */}
      <div style={{ position:'absolute', inset:0, background:'rgba(255,255,180,0.7)', animation:`minatoFlash ${dur}ms steps(1) forwards`, zIndex:1 }} />

      {/* Speed streaks */}
      {streaks.map((s, i) => (
        <div key={i} style={{
          position:'absolute',
          top: s.top, left:0, right:0,
          height:'3px',
          background:`linear-gradient(90deg, transparent, #eab308, #fef08a, transparent)`,
          transformOrigin:'left center',
          transform:`rotate(${s.rot})`,
          animation:`minatoStreak ${dur*0.55}ms ease-out ${s.delay}ms forwards`,
          boxShadow:`0 0 10px #eab308, 0 0 20px #fbbf2470`,
          zIndex:3,
          '--dir':'scaleX(1)',
        } as React.CSSProperties} />
      ))}

      {/* Reverse streaks */}
      {streaks.slice(0,3).map((s, i) => (
        <div key={`r${i}`} style={{
          position:'absolute',
          top: s.top, left:0, right:0,
          height:'2px',
          background:`linear-gradient(270deg, transparent, #eab30880, transparent)`,
          transformOrigin:'right center',
          animation:`minatoStreak ${dur*0.4}ms ease-out ${dur*0.35 + i*40}ms forwards`,
          zIndex:3,
          '--dir':'scaleX(1)',
        } as React.CSSProperties} />
      ))}

      {/* Kunai / seal mark spinning at center */}
      <div style={{
        position:'absolute', top:'20%', left:'20%',
        width:'60%', height:'60%',
        animation:`kunaiSpin ${dur*0.9}ms ease-out forwards`,
        zIndex:5,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {/* Kunai shape: diamond + line */}
        <svg width="100%" height="100%" viewBox="0 0 80 80">
          <polygon points="40,5 48,38 40,46 32,38" fill="#fbbf24" opacity="0.9"/>
          <line x1="40" y1="46" x2="40" y2="76" stroke="#eab308" strokeWidth="4" strokeLinecap="round"/>
          <polygon points="38,68 42,68 40,76" fill="#eab308"/>
          {/* FTG seals */}
          <text x="40" y="62" textAnchor="middle" fontSize="8" fill="#fbbf2480" fontFamily="monospace">忍</text>
        </svg>
      </div>

      <KillLabel label={ABILITY_LABEL.knight} color="#eab308" dur={dur} />
    </>
  );
}

/* ──────────────────────────────────────────────
   AIZEN — KYOKA SUIGETSU
   Mirror ripple (reality warping) → Zanpakuto sword slashes → mirror shatters
────────────────────────────────────────────── */
function AizenEffect({ dur }: { dur: number }) {
  const shards = [
    { tx:'translate(-90px,-60px)',  ty:'',               r:'−140deg' },
    { tx:'translate(85px,-70px)',   ty:'',               r:'120deg'  },
    { tx:'translate(-60px,80px)',   ty:'',               r:'200deg'  },
    { tx:'translate(80px,65px)',    ty:'',               r:'-160deg' },
    { tx:'translate(-100px,0px)',   ty:'',               r:'90deg'   },
    { tx:'translate(100px,5px)',    ty:'',               r:'-90deg'  },
    { tx:'translate(0,-100px)',     ty:'',               r:'50deg'   },
    { tx:'translate(5px,100px)',    ty:'',               r:'-50deg'  },
  ];
  return (
    <>
      {/* Board flash silver/purple */}
      <div style={{ position:'absolute', inset:0, animation:`aizenBoardFlash ${dur}ms ease-out forwards`, zIndex:1 }} />

      {/* Ripple rings (reality warping illusion) */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:'absolute', inset:`${20+i*5}%`,
          border:'2px solid rgba(196,181,253,0.7)',
          borderRadius:'50%',
          animation:`aizenRipple ${dur*0.55}ms ease-out ${i*90}ms forwards`,
          zIndex:3,
        }} />
      ))}

      {/* First sword slash: diagonal top-left to bottom-right */}
      <div style={{
        position:'absolute',
        top:'50%', left:'-5%',
        width:'110%', height:'5px',
        background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), rgba(196,181,253,1), transparent)',
        boxShadow:'0 0 20px #c4b5fd, 0 0 40px #8b5cf680',
        animation:`aizenSlash ${dur*0.45}ms ease-out ${dur*0.18}ms forwards`,
        zIndex:5, opacity:0,
      }} />

      {/* Second slash: opposite diagonal */}
      <div style={{
        position:'absolute',
        top:'20%', left:'-5%',
        width:'110%', height:'4px',
        background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), rgba(196,181,253,0.9), transparent)',
        boxShadow:'0 0 15px #c4b5fd',
        animation:`aizenSlash2 ${dur*0.45}ms ease-out ${dur*0.35}ms forwards`,
        zIndex:5, opacity:0,
      }} />

      {/* Mirror shatter fragments */}
      {shards.map((s, i) => (
        <div key={i} style={{
          position:'absolute',
          top:`${25 + (i%3)*18}%`, left:`${25 + Math.floor(i/3)*15}%`,
          width:'14%', height:'14%',
          background:`linear-gradient(${i*45}deg, rgba(196,181,253,0.7), rgba(255,255,255,0.5), transparent)`,
          border:'1px solid rgba(196,181,253,0.5)',
          clipPath:'polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%)',
          animation:`aizenShard ${dur*0.5}ms ease-out ${dur*0.45 + i*30}ms forwards`,
          '--shard-tx': s.tx,
          '--shard-ty': s.ty,
          '--shard-r': s.r,
          zIndex:6,
        } as React.CSSProperties} />
      ))}

      <KillLabel label={ABILITY_LABEL.bishop} color="#8b5cf6" dur={dur} />
    </>
  );
}

/* ──────────────────────────────────────────────
   ALL MIGHT — DETROIT SMASH
   Giant fist crashes from top → shockwaves → DETROIT SMASH! text
────────────────────────────────────────────── */
function AllMightEffect({ dur }: { dur: number }) {
  return (
    <>
      {/* Board flash gold/blue */}
      <div style={{ position:'absolute', inset:0, animation:`allMightBoardFlash ${dur}ms ease-out forwards`, zIndex:1 }} />

      {/* Giant fist crashing from top */}
      <div style={{
        position:'absolute', top:'-5%', left:'15%',
        width:'70%', height:'55%',
        zIndex:5,
        animation:`fistCrash ${dur*0.65}ms cubic-bezier(.3,1.8,.6,1) forwards`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 110">
          {/* Fist shape */}
          <rect x="15" y="25" width="70" height="60" rx="12" fill="#fbbf24" />
          <rect x="10" y="45" width="15" height="40" rx="8" fill="#f59e0b" />
          <rect x="75" y="45" width="15" height="40" rx="8" fill="#f59e0b" />
          <rect x="25" y="10" width="18" height="30" rx="6" fill="#fbbf24" />
          <rect x="43" y="5" width="18" height="32" rx="6" fill="#f59e0b" />
          <rect x="61" y="10" width="18" height="28" rx="6" fill="#fbbf24" />
          {/* Knuckle highlight */}
          <ellipse cx="34" cy="22" rx="6" ry="3" fill="#fde68a70" />
          <ellipse cx="52" cy="17" rx="6" ry="3" fill="#fde68a70" />
          <ellipse cx="70" cy="21" rx="6" ry="3" fill="#fde68a70" />
          {/* Speed lines above fist */}
          <line x1="25" y1="0" x2="22" y2="15" stroke="#fbbf24" strokeWidth="3" opacity="0.7"/>
          <line x1="50" y1="0" x2="50" y2="12" stroke="#fbbf24" strokeWidth="4" opacity="0.8"/>
          <line x1="75" y1="0" x2="78" y2="14" stroke="#fbbf24" strokeWidth="3" opacity="0.7"/>
        </svg>
      </div>

      {/* Impact flash at point of contact */}
      <div style={{
        position:'absolute', bottom:'30%', left:'10%',
        width:'80%', height:'4px',
        background:'linear-gradient(90deg, transparent, #fbbf24, #fff, #fbbf24, transparent)',
        boxShadow:'0 0 30px #fbbf24, 0 0 60px #f59e0b',
        animation:`smashImpact ${dur*0.35}ms ease-out ${dur*0.45}ms forwards`,
        opacity:0, zIndex:4,
      }} />

      {/* Shockwave rings from impact point */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:'absolute', inset:`${40-i*5}%`,
          border:`${3-i}px solid ${i===0?'#fbbf24':'#3b82f6'}`,
          borderRadius:'50%',
          boxShadow:`0 0 15px ${i===0?'#fbbf24':'#3b82f6'}`,
          animation:`smashShockwave ${dur*0.55}ms cubic-bezier(0,.7,.5,1) ${dur*0.42 + i*100}ms forwards`,
          '--sw': `${3 + i}`,
          opacity:0, zIndex:3,
        } as React.CSSProperties} />
      ))}

      {/* DETROIT SMASH! text */}
      <div style={{
        position:'absolute', bottom:'2%', left:'-15%', right:'-15%',
        textAlign:'center',
        fontSize:'clamp(8px, 2.5vw, 13px)',
        fontWeight:900,
        letterSpacing:'0.05em',
        color:'#fbbf24',
        textShadow:'0 0 20px #f59e0b, 0 0 40px #fbbf2480, 2px 2px 0 #1e3a8a',
        animation:`smashText ${dur*0.55}ms ease-out ${dur*0.3}ms forwards`,
        opacity:0, zIndex:7,
        textTransform:'uppercase',
        fontFamily:'Impact, Arial Black, sans-serif',
      }}>
        DETROIT SMASH!
      </div>

      <KillLabel label={ABILITY_LABEL.rook} color="#3b82f6" dur={dur} />
    </>
  );
}

/* ──────────────────────────────────────────────
   LELOUCH — GEASS COMMAND
   Geass eye opens → spiral runes → OBEY command text → red tide
────────────────────────────────────────────── */
function LelouchEffect({ dur }: { dur: number }) {
  const runeAngles = [0, 60, 120, 180, 240, 300];
  return (
    <>
      {/* Board red tide */}
      <div style={{ position:'absolute', inset:0, animation:`geassRedTide ${dur}ms ease-out forwards`, zIndex:1 }} />

      {/* Geass mark eye at center */}
      <div style={{
        position:'absolute', top:'15%', left:'15%',
        width:'70%', height:'70%',
        animation:`geassEyeReveal ${dur*0.8}ms ease-out forwards`,
        opacity:0, zIndex:5,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {/* Outer ring */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.9"/>
          {/* Eye outer shape */}
          <ellipse cx="50" cy="50" rx="35" ry="20" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5"/>
          {/* Iris */}
          <circle cx="50" cy="50" r="12" fill="#ef4444" opacity="0.95"/>
          {/* Pupil */}
          <circle cx="50" cy="50" r="5" fill="#1a0000"/>
          {/* Geass wing-lines emanating */}
          <path d="M50,30 C30,20 10,30 5,50" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.7"/>
          <path d="M50,30 C70,20 90,30 95,50" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.7"/>
          <path d="M50,70 C30,80 10,70 5,50" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.7"/>
          <path d="M50,70 C70,80 90,70 95,50" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.7"/>
          {/* Inner star pattern */}
          <circle cx="50" cy="50" r="20" fill="none" stroke="#ef444460" strokeWidth="1" strokeDasharray="3 3"/>
        </svg>
      </div>

      {/* Rune arms rotating outward */}
      {runeAngles.map((angle) => (
        <div key={angle} style={{
          position:'absolute',
          top:'50%', left:'50%',
          width:'45%', height:'2px',
          background:`linear-gradient(90deg, #ef4444, #ef444440, transparent)`,
          transformOrigin:'0 50%',
          boxShadow:'0 0 8px #ef4444',
          animation:`geassRuneArm ${dur*0.85}ms ease-out ${angle*0.8}ms forwards`,
          '--arm-angle': `${angle}deg`,
          opacity:0, zIndex:4,
        } as React.CSSProperties} />
      ))}

      {/* OBEY command text */}
      <div style={{
        position:'absolute', bottom:'5%', left:'-10%', right:'-10%',
        textAlign:'center',
        fontSize:'clamp(9px, 2.8vw, 14px)',
        fontWeight:900,
        color:'#fca5a5',
        textShadow:'0 0 20px #ef4444, 0 0 40px #dc262680',
        animation:`geassCommand ${dur*0.55}ms ease-out ${dur*0.3}ms forwards`,
        opacity:0, zIndex:7,
        letterSpacing:'0.15em',
        fontFamily:'Impact, Arial Black, sans-serif',
        textTransform:'uppercase',
      }}>
        ABSOLUTE OBEY
      </div>

      <KillLabel label={ABILITY_LABEL.king} color="#ef4444" dur={dur} />
    </>
  );
}

/* ──────────────────────────────────────────────
   ZETSU — SPORE ABSORPTION
   Ground cracks → dark tendrils rise → victim absorbed into earth
────────────────────────────────────────────── */
function ZetsuEffect({ dur }: { dur: number }) {
  const tendrils = [
    { left:'15%', rot:'-15deg', delay:0    },
    { left:'28%', rot: '5deg',  delay:50   },
    { left:'42%', rot:'-3deg',  delay:20   },
    { left:'55%', rot: '8deg',  delay:70   },
    { left:'68%', rot:'-10deg', delay:30   },
    { left:'80%', rot: '15deg', delay:90   },
  ];
  const spores = [
    { top:'30%', left:'20%', tx:'translate(-40px,-80px)' },
    { top:'25%', left:'60%', tx:'translate(30px,-70px)'  },
    { top:'50%', left:'10%', tx:'translate(-50px,-40px)' },
    { top:'45%', left:'75%', tx:'translate(45px,-55px)'  },
    { top:'60%', left:'35%', tx:'translate(-20px,-90px)' },
    { top:'55%', left:'55%', tx:'translate(35px,-75px)'  },
  ];
  return (
    <>
      {/* Board flash green */}
      <div style={{ position:'absolute', inset:0, animation:`groundAbsorb ${dur}ms ease-out forwards`, zIndex:1 }} />

      {/* Ground crack lines (spreading from bottom) */}
      {[10, 30, 50, 65, 80].map((left, i) => (
        <div key={i} style={{
          position:'absolute',
          bottom:0, left:`${left}%`,
          width:'3px',
          height:`${25 + (i%3)*15}%`,
          background:`linear-gradient(to top, #15803d, #22c55e80, transparent)`,
          transformOrigin:'bottom center',
          animation:`crackSpread ${dur*0.45}ms ease-out ${i*40}ms forwards`,
          boxShadow:'0 0 6px #15803d',
          zIndex:3, opacity:0,
        }} />
      ))}

      {/* Dark tendrils rising from ground */}
      {tendrils.map((t, i) => (
        <div key={i} style={{
          position:'absolute',
          bottom:0, left:t.left,
          width:'6%',
          height:`${50 + (i%3)*20}%`,
          background:`linear-gradient(to top, #052e16, #15803d, #22c55e)`,
          borderRadius:'3px 3px 0 0',
          transformOrigin:'bottom center',
          transform:`rotate(${t.rot})`,
          animation:`tendrilRise ${dur*0.65}ms ease-out ${t.delay}ms forwards`,
          '--t-rot': t.rot,
          boxShadow:'0 0 12px #15803d90',
          zIndex:4, opacity:0,
        } as React.CSSProperties} />
      ))}

      {/* Spore particles floating up */}
      {spores.map((s, i) => (
        <div key={i} style={{
          position:'absolute',
          top:s.top, left:s.left,
          width:'8%', height:'8%',
          borderRadius:'50%',
          background:'radial-gradient(circle, #bbf7d0, #22c55e)',
          boxShadow:'0 0 10px #22c55e',
          animation:`sporeFloat ${dur*0.7}ms ease-out ${i*60}ms forwards`,
          '--sp-tx': s.tx,
          zIndex:5,
        } as React.CSSProperties} />
      ))}

      <KillLabel label={ABILITY_LABEL.pawn} color="#22c55e" dur={dur} />
    </>
  );
}

/* ── Ability name label ── */
function KillLabel({ label, color, dur }: { label: string; color: string; dur: number }) {
  return (
    <div style={{
      position:'absolute',
      bottom:'-30px', left:'-20%', right:'-20%',
      textAlign:'center',
      fontSize:'9px',
      fontWeight:800,
      letterSpacing:'0.12em',
      color,
      textShadow:`0 0 12px ${color}, 0 0 24px ${color}80`,
      textTransform:'uppercase',
      pointerEvents:'none',
      zIndex:20,
      fontFamily:'Impact, Arial Black, sans-serif',
      animation:`geassCommand ${dur*0.7}ms ease-out 200ms forwards`,
      opacity:0,
    }}>
      {label}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT — cinematic kill scene
═══════════════════════════════════════════════════════ */

/* Per-attacker cinematic background gradient */
const STAGE_BG: Record<PieceType, string> = {
  queen:  'radial-gradient(ellipse at center, #3b0764 0%, #1a0533 40%, #0a0015 100%)',
  knight: 'radial-gradient(ellipse at center, #1c1a00 0%, #2d2600 40%, #0a0800 100%)',
  bishop: 'radial-gradient(ellipse at center, #1e0040 0%, #2d1264 40%, #0a0020 100%)',
  rook:   'radial-gradient(ellipse at center, #001a3d 0%, #002952 40%, #000c1a 100%)',
  king:   'radial-gradient(ellipse at center, #3d0000 0%, #1a0000 40%, #0a0000 100%)',
  pawn:   'radial-gradient(ellipse at center, #002200 0%, #003300 40%, #000a00 100%)',
};

export default function AbilityEffect({
  attackerType,
  attackerColor,
  capturedType,
  capturedColor,
  onDone,
}: AbilityEffectProps) {
  const dur = DURATION[attackerType];

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    sounds.playSpecial();
    const impact = setTimeout(() => sounds.playImpact(), dur * 0.45);
    const t = setTimeout(() => onDoneRef.current(), dur + 200);
    return () => {
      clearTimeout(impact);
      clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — dur is fixed per attackerType

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: STAGE_BG[attackerType],
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'hidden',
    }}>

      {/* ── VS STAGE: two large pieces facing off ── */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '70vh',
        maxWidth: '900px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 5%',
      }}>

        {/* Background glow / board flash layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          {attackerType === 'queen' && (
            <div style={{ position:'absolute', inset:0, animation:`gojoBoardFlash ${dur}ms ease-out forwards` }} />
          )}
          {attackerType === 'knight' && (
            <div style={{ position:'absolute', inset:0, background:'rgba(255,255,180,0.25)', animation:`minatoFlash ${dur}ms steps(1) forwards` }} />
          )}
          {attackerType === 'bishop' && (
            <div style={{ position:'absolute', inset:0, animation:`aizenBoardFlash ${dur}ms ease-out forwards` }} />
          )}
          {attackerType === 'rook' && (
            <div style={{ position:'absolute', inset:0, animation:`allMightBoardFlash ${dur}ms ease-out forwards` }} />
          )}
          {attackerType === 'king' && (
            <div style={{ position:'absolute', inset:0, animation:`geassRedTide ${dur}ms ease-out forwards` }} />
          )}
          {attackerType === 'pawn' && (
            <div style={{ position:'absolute', inset:0, animation:`groundAbsorb ${dur}ms ease-out forwards` }} />
          )}
        </div>

        {/* ── ATTACKER (Left) — large, flies in ── */}
        <div style={{
          width: '38%',
          height: '90%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `attackerFlyIn ${dur * 0.8}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
          zIndex: 10,
          filter: `drop-shadow(0 0 40px ${PIECE_GLOW[attackerType]}) drop-shadow(0 0 80px ${PIECE_GLOW[attackerType]}88)`,
        }}>
          <img
            src={`/pieces/${attackerColor}_${attackerType}.png`}
            alt="attacker"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: attackerColor === 'white'
                ? 'saturate(1.3) brightness(1.1) contrast(1.05)'
                : `brightness(0.9) saturate(1.4) contrast(1.1)`,
            }}
          />
        </div>

        {/* ── VS text in the middle ── */}
        <div style={{
          zIndex: 20,
          color: 'white',
          fontSize: 'clamp(28px, 5vw, 56px)',
          fontWeight: 900,
          fontFamily: 'Impact, sans-serif',
          letterSpacing: '0.05em',
          textShadow: `0 0 20px ${PIECE_GLOW[attackerType]}, 0 0 40px ${PIECE_GLOW[attackerType]}`,
          flexShrink: 0,
          animation: 'geassCommand 0.4s ease-out 0.1s forwards',
          opacity: 0,
        }}>VS</div>

        {/* ── VICTIM (Right) — large, staggers ── */}
        <div style={{
          width: '38%',
          height: '90%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: `victimStagger ${dur}ms ease-in-out forwards`,
          zIndex: 5,
          filter: `drop-shadow(0 0 20px rgba(255,50,50,0.6)) drop-shadow(0 0 40px rgba(255,0,0,0.3))`,
        }}>
          <img
            src={`/pieces/${capturedColor}_${capturedType}.png`}
            alt="captured"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: capturedColor === 'white'
                ? 'saturate(1.0) brightness(1.0) grayscale(0.3)'
                : 'brightness(0.9) saturate(1.2) grayscale(0.3)',
            }}
          />
        </div>

        {/* ── Foreground ability effects ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
          {attackerType === 'queen'  && <GojoEffect    dur={dur} />}
          {attackerType === 'knight' && <MinatoEffect  dur={dur} />}
          {attackerType === 'bishop' && <AizenEffect   dur={dur} />}
          {attackerType === 'rook'   && <AllMightEffect dur={dur} />}
          {attackerType === 'king'   && <LelouchEffect  dur={dur} />}
          {attackerType === 'pawn'   && <ZetsuEffect    dur={dur} />}
        </div>
      </div>

      {/* ── Ability name banner ── */}
      <div style={{
        position: 'absolute',
        bottom: '12%',
        width: '100%',
        textAlign: 'center',
        zIndex: 30,
      }}>
        <div style={{
          display: 'inline-block',
          background: `linear-gradient(90deg, transparent, ${PIECE_GLOW[attackerType]}dd, transparent)`,
          padding: '10px 80px',
          transform: 'skewX(-12deg)',
          animation: 'geassCommand 0.5s ease-out 0.3s forwards',
          opacity: 0,
        }}>
          <span style={{
            display: 'block',
            transform: 'skewX(12deg)',
            color: 'white',
            fontSize: 'clamp(18px, 3.5vw, 32px)',
            fontWeight: 900,
            letterSpacing: '0.25em',
            textShadow: `0 0 30px ${PIECE_GLOW[attackerType]}, 0 0 10px rgba(0,0,0,0.8)`,
            textTransform: 'uppercase',
            fontFamily: 'Impact, sans-serif',
          }}>
            {ABILITY_LABEL[attackerType]}
          </span>
        </div>
      </div>
    </div>
  );
}