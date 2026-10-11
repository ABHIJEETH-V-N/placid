import React, { useEffect, useMemo, useRef } from 'react';
import { useParallax, type Vec } from './scenes/useParallax';

const DEPTH = [0.4, 0.7, 0.9, 1.2, 1.6];

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const CSS = `
.hero-root { contain: layout paint; background-size: 100% 180%; animation: hero-sky 24s ease-in-out infinite alternate; }
@keyframes hero-sky { from { background-position: 50% 0%; } to { background-position: 50% 100%; } }
.hero-sun {
  position: absolute; left: 50%; bottom: 24%;
  width: min(70vw, 380px); height: min(70vw, 380px); border-radius: 50%;
  background: radial-gradient(circle, rgba(255,240,215,0.95) 0%, rgba(255,214,170,0.5) 20%, rgba(255,180,160,0.18) 45%, rgba(255,160,160,0) 70%);
  transform: translate(-50%, 50%);
  animation: hero-breathe 9s ease-in-out infinite;
}
.hero-core {
  position: absolute; left: 50%; top: 50%; width: 64px; height: 64px;
  margin: -32px 0 0 -32px; border-radius: 50%; background: #fff6e0;
  box-shadow: 0 0 40px 14px rgba(255,236,200,0.7);
}
@keyframes hero-breathe {
  0%, 100% { transform: translate(-50%, 50%) scale(1); opacity: 0.85; }
  50% { transform: translate(-50%, 50%) scale(1.06); opacity: 1; }
}
.hero-ray {
  position: absolute; top: -12%; width: 16vw; height: 124%;
  background: linear-gradient(to bottom, rgba(255,240,215,0.26), rgba(255,240,215,0) 72%);
  filter: blur(8px); transform: rotate(14deg);
  animation: hero-ray 12s ease-in-out infinite;
}
@keyframes hero-ray { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
.hero-cloud {
  position: absolute; height: 54px; border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.5), rgba(255,255,255,0) 70%);
  filter: blur(6px);
  animation: hero-cloud linear infinite;
}
@keyframes hero-cloud { from { transform: translateX(-30%); } to { transform: translateX(130%); } }
.hero-star {
  position: absolute; border-radius: 50%; background: #fff;
  animation: hero-twinkle ease-in-out infinite;
}
@keyframes hero-twinkle { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.7; } }
.hero-bird { position: absolute; animation: hero-glide linear infinite; }
@keyframes hero-glide { from { transform: translateX(-10vw); } to { transform: translateX(110vw); } }
@media (prefers-reduced-motion: reduce) {
  .hero-root, .hero-root * { animation: none !important; }
}
`;

const CLOUDS = [
  { top: '12%', w: 260, dur: 70, delay: -20, op: 0.6 },
  { top: '24%', w: 200, dur: 55, delay: -45, op: 0.45 },
  { top: '34%', w: 320, dur: 90, delay: -5, op: 0.35 },
];

const BIRDS = [
  { top: '16%', dur: 40, delay: -8, scale: 1 },
  { top: '24%', dur: 56, delay: -34, scale: 0.7 },
];

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simple pine silhouette. base is the ground y, h is height, both in viewBox units.
const pine = (x: number, base: number, h: number) => {
  const y = (k: number) => base - h * k;
  return `M${x} ${y(1)} L${x - h * 0.2} ${y(0.62)} L${x - h * 0.11} ${y(0.62)} L${x - h * 0.3} ${y(0.3)} L${x + h * 0.3} ${y(0.3)} L${x + h * 0.11} ${y(0.62)} L${x + h * 0.2} ${y(0.62)} Z`;
};

export const HeroBackdrop: React.FC = () => {
  const targetRef = useRef<Vec>({ x: 0, y: 0 });
  const setLayers = useParallax(targetRef, true, DEPTH);

  const stars = useMemo(() => {
    const r = mulberry32(9);
    return Array.from({ length: 16 }, () => ({
      left: r() * 100,
      top: r() * 38,
      size: 1 + r() * 1.5,
      dur: 3 + r() * 4,
      delay: -(r() * 6),
    }));
  }, []);

  // Pointer and gyroscope both nudge the scene. Each layer moves by its depth.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 24,
        y: (e.clientY / window.innerHeight - 0.5) * 16,
      };
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      const gx = Math.max(-15, Math.min(15, e.gamma));
      const gy = Math.max(-15, Math.min(15, e.beta - 45));
      targetRef.current = { x: gx * 1.2, y: gy * 0.8 };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('deviceorientation', onOrient);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, []);

  const hillsStyle: React.CSSProperties = {
    position: 'absolute',
    left: '-4%',
    bottom: 0,
    width: '108%',
  };

  return (
    <div
      className="hero-root absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        background:
          'linear-gradient(180deg, #4a7ff2 0%, #7b7ed8 30%, #c98ab5 65%, #e8a87c 100%)',
      }}
    >
      <style>{CSS}</style>

      {/* Layer 0: stars and the sun */}
      <div ref={setLayers[0]} className="absolute inset-0">
        {stars.map((s, i) => (
          <div
            key={`hs-${i}`}
            className="hero-star"
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
        <div className="hero-sun">
          <div className="hero-core" />
        </div>
      </div>

      {/* Layer 1: light rays, clouds, birds */}
      <div ref={setLayers[1]} className="absolute inset-0">
        <div className="hero-ray" style={{ left: '22%' }} />
        <div className="hero-ray" style={{ left: '40%', width: '9vw', animationDelay: '-5s' }} />
        {CLOUDS.map((c, i) => (
          <div
            key={`hc-${i}`}
            className="hero-cloud"
            style={{
              top: c.top,
              width: c.w,
              opacity: c.op,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
        {BIRDS.map((b, i) => (
          <div
            key={`hb-${i}`}
            className="hero-bird"
            style={{
              top: b.top,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
              transform: `scale(${b.scale})`,
            }}
          >
            <svg width="16" height="7" viewBox="0 0 16 7">
              <path d="M0 3.5 Q4 0 8 3.5 Q12 0 16 3.5" stroke="#2a1a4a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Layer 2: far hills */}
      <div ref={setLayers[2]} className="absolute inset-0">
        <svg style={{ ...hillsStyle, height: '34%' }} viewBox="0 0 1200 320" preserveAspectRatio="none">
          <path
            d="M0 320 L0 200 C150 150 300 190 460 170 C640 148 780 200 960 165 C1080 142 1140 150 1200 160 L1200 320 Z"
            fill="#9c86cc"
            opacity={0.5}
          />
        </svg>
      </div>

      {/* Layer 3: mid hills and distant pines */}
      <div ref={setLayers[3]} className="absolute inset-0">
        <svg style={{ ...hillsStyle, height: '30%' }} viewBox="0 0 1200 320" preserveAspectRatio="none">
          <path
            d="M0 320 L0 230 C200 190 360 240 540 215 C740 188 900 240 1080 210 L1200 205 L1200 320 Z"
            fill="#5a4a94"
            opacity={0.8}
          />
          <path d={pine(330, 250, 40)} fill="#2c2360" />
          <path d={pine(372, 256, 30)} fill="#2c2360" />
          <path d={pine(780, 240, 46)} fill="#2c2360" />
          <path d={pine(838, 246, 34)} fill="#2c2360" />
        </svg>
      </div>

      {/* Layer 4: front hill and foreground pines */}
      <div ref={setLayers[4]} className="absolute inset-0">
        <svg style={{ ...hillsStyle, height: '26%' }} viewBox="0 0 1200 320" preserveAspectRatio="none">
          <path d="M0 320 L0 260 Q240 215 480 250 Q820 290 1200 225 L1200 320 Z" fill="#1d1836" />
          <path d={pine(96, 300, 92)} fill="#14102a" />
          <path d={pine(140, 304, 66)} fill="#14102a" />
          <path d={pine(1040, 296, 110)} fill="#14102a" />
          <path d={pine(1098, 304, 74)} fill="#14102a" />
        </svg>
      </div>

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: NOISE, opacity: 0.05, mixBlendMode: 'overlay' }}
      />
    </div>
  );
};