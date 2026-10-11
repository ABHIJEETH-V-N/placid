import React, { useEffect, useId, useMemo, useRef } from 'react';
import { useParallax, type Vec } from './useParallax';

interface SceneProps {
  offset: Vec;
  motionEnabled?: boolean;
}

const DEPTH = [0.2, 0.45, 0.9, 1.3, 1.8];

const CSS = `
.temple-root { contain: layout paint; }
.temple-layer { position: absolute; inset: 0; will-change: transform; }
.temple-mist {
  position: absolute; left: -20%; width: 140%; border-radius: 999px;
  filter: blur(14px);
  animation: temple-mist ease-in-out infinite alternate;
}
@keyframes temple-mist { from { transform: translateX(-8%); } to { transform: translateX(8%); } }
.temple-lantern { animation: temple-flicker 3.2s ease-in-out infinite; }
@keyframes temple-flicker {
  0%, 100% { opacity: 0.85; } 20% { opacity: 1; } 45% { opacity: 0.72; } 70% { opacity: 0.95; }
}
.temple-breathe { animation: temple-breathe 10s ease-in-out infinite; }
@keyframes temple-breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.05); opacity: 1; }
}
.temple-star {
  position: absolute; border-radius: 50%; background: #fff;
  animation: temple-twinkle ease-in-out infinite;
}
@keyframes temple-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.95; } }
.temple-smoke {
  position: absolute; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,230,190,0.35), rgba(255,230,190,0) 70%);
  filter: blur(3px);
  animation: temple-rise linear infinite;
}
@keyframes temple-rise {
  0%   { transform: translate3d(0, 0, 0) scale(0.6); opacity: 0; }
  15%  { opacity: 0.8; }
  100% { transform: translate3d(var(--drift), -240px, 0) scale(2.4); opacity: 0; }
}
.temple-bird { position: absolute; animation: temple-glide linear infinite; }
@keyframes temple-glide {
  from { transform: translate3d(-12vw, 0, 0); }
  to   { transform: translate3d(112vw, -12px, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .temple-root * { animation: none !important; }
}
`;

interface Palette {
  sky: [string, string, string];
  celestial: 'sun' | 'moon';
  celestialColor: string;
  far: string;
  mid: string;
  temple: string;
  templeDark: string;
  ground: string;
  lantern: string;
  mist: string;
  bird: string;
  stars: boolean;
}

function getPalette(hour: number): Palette {
  if (hour >= 5 && hour < 8) {
    return {
      sky: ['#4a5f9e', '#c98aa0', '#f2c79a'], celestial: 'sun', celestialColor: '#ffe6c4',
      far: '#c9a6bb', mid: '#94779c', temple: '#352a4c', templeDark: '#2a2140', ground: '#2a2140',
      lantern: '#ffc978', mist: 'rgba(255,236,220,0.5)', bird: '#3b2f52', stars: false,
    };
  }
  if (hour >= 8 && hour < 17) {
    return {
      sky: ['#608bd8', '#9cb8e8', '#dce4f7'], celestial: 'sun', celestialColor: '#fffbef',
      far: '#9db6d9', mid: '#6f8cbb', temple: '#2a3550', templeDark: '#1f2940', ground: '#1d2740',
      lantern: '#ffd56b', mist: 'rgba(255,255,255,0.45)', bird: '#2a3550', stars: false,
    };
  }
  if (hour >= 17 && hour < 20) {
    return {
      sky: ['#3d4a7c', '#765e8a', '#d89b80'], celestial: 'sun', celestialColor: '#ffc89a',
      far: '#7a5a8a', mid: '#4f3c6a', temple: '#241c36', templeDark: '#1a1428', ground: '#171226',
      lantern: '#ffb85c', mist: 'rgba(255,200,170,0.35)', bird: '#241c36', stars: false,
    };
  }
  return {
    sky: ['#0b1120', '#171d36', '#2a2c4e'], celestial: 'moon', celestialColor: '#f1f0e0',
    far: '#1f2b4a', mid: '#141d36', temple: '#0b1122', templeDark: '#070b16', ground: '#070b16',
    lantern: '#ffcf7a', mist: 'rgba(150,170,215,0.22)', bird: '#070b16', stars: true,
  };
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildFx(night: boolean) {
  const r = mulberry32(77);
  return {
    stars: night
      ? Array.from({ length: 40 }, () => ({
          left: r() * 100,
          top: r() * 50,
          size: 1 + r() * 1.6,
          dur: 3 + r() * 4,
          delay: -(r() * 6),
        }))
      : [],
    smoke: Array.from({ length: 8 }, () => ({
      left: 46 + r() * 8,
      size: 16 + r() * 14,
      dur: 9 + r() * 6,
      delay: -(r() * 12),
      drift: (r() * 2 - 1) * 30,
    })),
    birds: night
      ? []
      : [
          { top: 18, dur: 48, delay: -6, scale: 1 },
          { top: 27, dur: 62, delay: -30, scale: 0.7 },
        ],
  };
}

export const TempleScene: React.FC<SceneProps> = ({ offset, motionEnabled = true }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c = useMemo(() => getPalette(new Date().getHours()), []);
  const fx = useMemo(() => buildFx(c.stars), [c.stars]);

  const targetRef = useRef<Vec>(offset);
  useEffect(() => {
    targetRef.current = offset;
  }, [offset.x, offset.y]);

  const setLayers = useParallax(targetRef, motionEnabled, DEPTH);

  const mistGrad = `radial-gradient(ellipse at center, ${c.mist}, rgba(0,0,0,0) 70%)`;

  return (
    <div
      className="temple-root absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{
        background: `linear-gradient(180deg, ${c.sky[0]} 0%, ${c.sky[1]} 55%, ${c.sky[2]} 100%)`,
      }}
    >
      <style>{CSS}</style>

      {/* Layer 0: stars, sun or moon, birds */}
      <div ref={setLayers[0]} className="temple-layer">
        {fx.stars.map((s, i) => (
          <div
            key={`s-${i}`}
            className="temple-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {c.celestial === 'sun' ? (
          <div
            className="absolute rounded-full temple-breathe"
            style={{
              top: '12%',
              left: '20%',
              width: 110,
              height: 110,
              background: `radial-gradient(circle, ${c.celestialColor} 0%, ${c.celestialColor} 22%, ${c.celestialColor}55 45%, ${c.celestialColor}00 70%)`,
            }}
          />
        ) : (
          <div
            className="absolute rounded-full temple-breathe"
            style={{
              top: '14%',
              right: '20%',
              width: 46,
              height: 46,
              background: c.celestialColor,
              boxShadow: `0 0 50px 16px ${c.celestialColor}55`,
            }}
          />
        )}

        {fx.birds.map((b, i) => (
          <div
            key={`b-${i}`}
            className="temple-bird"
            style={{
              top: `${b.top}%`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
              transform: `scale(${b.scale})`,
            }}
          >
            <svg width="18" height="8" viewBox="0 0 18 8">
              <path d="M0 4 Q4 0 9 4 Q14 0 18 4" stroke={c.bird} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Layer 1: far mountains */}
      <div ref={setLayers[1]} className="temple-layer">
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '52%' }}
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
        >
          <path
            d="M0 400 L0 262 C90 214 170 212 240 238 C320 180 380 176 440 214 C520 170 600 168 660 206 C740 176 820 186 880 220 C930 200 970 196 1000 210 L1000 400 Z"
            fill={c.far}
            opacity={0.85}
          />
        </svg>
      </div>

      {/* Layer 2: mid ridge with drifting mist */}
      <div ref={setLayers[2]} className="temple-layer">
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '60%' }}
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
        >
          <path
            d="M0 500 L0 340 C160 300 260 318 380 300 C500 282 600 330 720 306 C830 284 920 300 1000 286 L1000 500 Z"
            fill={c.mid}
            opacity={0.9}
          />
        </svg>
        <div className="temple-mist" style={{ bottom: '30%', height: 110, background: mistGrad, animationDuration: '56s' }} />
        <div
          className="temple-mist"
          style={{ bottom: '44%', height: 80, background: mistGrad, animationDuration: '42s', animationDelay: '-10s' }}
        />
      </div>

      {/* Layer 3: the temple */}
      <div ref={setLayers[3]} className="temple-layer">
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '9%',
            width: 'min(86vw, 440px)',
            transform: 'translateX(-50%)',
          }}
        >
          <svg viewBox="0 0 600 480" style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
            <defs>
              <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={c.lantern} stopOpacity={0.85} />
                <stop offset="55%" stopColor={c.lantern} stopOpacity={0.25} />
                <stop offset="100%" stopColor={c.lantern} stopOpacity={0} />
              </radialGradient>
            </defs>

            {/* Platform steps */}
            <path d="M70 480 L530 480 L508 452 L92 452 Z" fill={c.temple} />
            <path d="M104 452 L496 452 L474 424 L126 424 Z" fill={c.temple} />

            {/* Spire with tiers and finial */}
            <rect x="296" y="150" width="8" height="66" fill={c.temple} />
            <ellipse cx="300" cy="172" rx="16" ry="4" fill={c.temple} />
            <ellipse cx="300" cy="188" rx="11" ry="3" fill={c.temple} />
            <path d="M300 118 L306 134 L300 150 L294 134 Z" fill={c.temple} />
            <circle cx="300" cy="118" r="3" fill={c.lantern} />

            {/* Upper tier walls and roof */}
            <rect x="232" y="236" width="136" height="48" fill={c.temple} />
            <rect x="236" y="236" width="12" height="48" fill={c.templeDark} />
            <rect x="352" y="236" width="12" height="48" fill={c.templeDark} />
            <path d="M196 236 Q300 186 404 236 L382 246 Q300 214 218 246 Z" fill={c.temple} />
            <path d="M196 236 L174 222 L206 230 Z" fill={c.temple} />
            <path d="M404 236 L426 222 L394 230 Z" fill={c.temple} />

            {/* Lower roof, with upturned eaves */}
            <path d="M108 306 Q300 252 492 306 L468 318 Q300 296 132 318 Z" fill={c.temple} />
            <path d="M108 306 L86 292 L120 300 Z" fill={c.temple} />
            <path d="M492 306 L514 292 L480 300 Z" fill={c.temple} />

            {/* Lower walls, pillars and door */}
            <rect x="142" y="316" width="316" height="8" fill={c.templeDark} />
            <rect x="150" y="324" width="300" height="100" fill={c.temple} />
            {[160, 232, 368, 440].map((x) => (
              <rect key={x} x={x} y="324" width="14" height="100" fill={c.templeDark} />
            ))}
            <rect x="282" y="346" width="36" height="78" fill={c.templeDark} />

            {/* Hanging lantern: glow first, then the lantern on top */}
            <line x1="300" y1="306" x2="300" y2="322" stroke={c.templeDark} strokeWidth="2" />
            <circle cx="300" cy="338" r="60" fill={`url(#glow-${uid})`} className="temple-lantern" />
            <rect x="288" y="322" width="24" height="30" rx="7" fill={c.lantern} />
            <rect x="284" y="318" width="32" height="6" rx="2" fill={c.templeDark} />

            {/* Pine branches framing the temple */}
            <path d="M22 430 Q60 396 96 404 Q112 380 92 364 Q52 388 22 430 Z" fill={c.templeDark} opacity={0.9} />
            <path d="M578 430 Q540 396 504 404 Q488 380 508 364 Q548 388 578 430 Z" fill={c.templeDark} opacity={0.9} />
          </svg>
        </div>
      </div>

      {/* Layer 4: foreground ground, incense smoke, low mist */}
      <div ref={setLayers[4]} className="temple-layer">
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '26%',
            background: `linear-gradient(to top, ${c.ground}, ${c.ground}cc 40%, ${c.ground}00)`,
          }}
        />
        <div className="temple-mist" style={{ bottom: '12%', height: 70, background: mistGrad, animationDuration: '38s' }} />
        {fx.smoke.map((s, i) => (
          <div
            key={`sm-${i}`}
            className="temple-smoke"
            style={
              {
                left: `${s.left}%`,
                bottom: '15%',
                width: s.size,
                height: s.size,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
                '--drift': `${s.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Vignette and grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0) 40%, rgba(0,0,0,0.45))' }}
      />
    </div>
  );
};