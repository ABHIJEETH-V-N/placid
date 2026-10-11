import React, { useEffect, useMemo, useRef } from 'react';

interface SceneProps {
  offset: { x: number; y: number };
  motionEnabled?: boolean;
}

interface Blade {
  d: string;
  color: string;
  dur: number;
  delay: number;
}

interface Palette {
  sky: [string, string, string];
  sun: string;
  far: string;
  mid: string;
  blades: [string, string];
  near: [string, string];
  night: boolean;
}

// Scoped keyframes and classes, so the scene needs no Tailwind config changes.
const CSS = `
.meadow-root { contain: layout paint; }
.meadow-layer { position: absolute; inset: 0; will-change: transform; }
.meadow-svg { position: absolute; left: 0; bottom: 0; width: 100%; }
.meadow-blade {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation-name: meadow-sway;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
.meadow-cloud {
  position: absolute;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%);
  animation: meadow-cloud linear infinite;
}
.meadow-mote {
  position: absolute;
  border-radius: 50%;
  background: #fffbe8;
  box-shadow: 0 0 6px 1px rgba(255,250,220,0.6);
  animation: meadow-mote linear infinite;
}
@keyframes meadow-sway {
  0%, 100% { transform: skewX(-4deg); }
  50%      { transform: skewX(5deg); }
}
@keyframes meadow-cloud {
  from { transform: translateX(-40%); }
  to   { transform: translateX(140%); }
}
@keyframes meadow-mote {
  0%   { transform: translate3d(0, 0, 0); opacity: 0; }
  15%  { opacity: 0.9; }
  60%  { opacity: 0.5; }
  100% { transform: translate3d(70px, -160px, 0); opacity: 0; }
}
@keyframes meadow-breathe {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.05); }
}
@keyframes meadow-ray {
  0%, 100% { opacity: 0.18; }
  50%      { opacity: 0.42; }
}
@keyframes meadow-sheen {
  from { transform: translateX(-60%); }
  to   { transform: translateX(260%); }
}
@keyframes meadow-twinkle {
  0%, 100% { opacity: 0.2; }
  50%      { opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  .meadow-root * { animation: none !important; }
}
`;

// Small seeded RNG so every render produces the same meadow.
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildBlades(
  r: () => number,
  count: number,
  baseY: number,
  minH: number,
  maxH: number,
  wMin: number,
  wMax: number,
  colors: string[],
  dur: number,
): Blade[] {
  return Array.from({ length: count }, (_, i) => {
    const x = ((i + r()) / count) * 1000;
    const h = minH + r() * (maxH - minH);
    const w = wMin + r() * (wMax - wMin);
    const bend = (r() * 2 - 1) * h * 0.22;
    const hw = w / 2;
    const midY = baseY - h * 0.55;
    const tipX = x + bend;
    const tipY = baseY - h;
    // Tapered blade: wide at the base, pointed at the tip.
    const d =
      `M${(x - hw).toFixed(1)} ${baseY} ` +
      `Q${(x + bend * 0.15 - hw * 0.2).toFixed(1)} ${midY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} ` +
      `Q${(x + bend * 0.15 + hw * 0.2).toFixed(1)} ${midY.toFixed(1)} ${(x + hw).toFixed(1)} ${baseY} Z`;
    // Negative delay that grows with x makes a gust travel across the field.
    const delay = -((x / 1000) * dur * 0.6) - r() * 0.5;
    return { d, color: colors[Math.floor(r() * colors.length)], dur, delay };
  });
}

function getPalette(hour: number): Palette {
  if (hour >= 5 && hour < 8) {
    return {
      sky: ['#8fa9d8', '#e9c3c0', '#f7dcc0'],
      sun: '#fff0d6',
      far: '#a9c3b0',
      mid: '#6f9a78',
      blades: ['#5f8f67', '#4f7f5a'],
      near: ['#2f5a3a', '#26492f'],
      night: false,
    };
  }
  if (hour >= 8 && hour < 17) {
    return {
      sky: ['#7db5e8', '#bad7e9', '#d6e5d0'],
      sun: '#fffcf0',
      far: '#9cc2a2',
      mid: '#5f9268',
      blades: ['#4f8058', '#5b8f60'],
      near: ['#2e5a36', '#274c2f'],
      night: false,
    };
  }
  if (hour >= 17 && hour < 20) {
    return {
      sky: ['#5f74bd', '#d59ab0', '#f2bf93'],
      sun: '#ffd6a0',
      far: '#8c9fa0',
      mid: '#56705a',
      blades: ['#4a6b4e', '#557a58'],
      near: ['#24402b', '#1f3a27'],
      night: false,
    };
  }
  return {
    sky: ['#1c2a52', '#34467a', '#56648c'],
    sun: '#f1eedb',
    far: '#4b5f73',
    mid: '#2f4a45',
    blades: ['#2b4540', '#34524c'],
    near: ['#152a22', '#11231c'],
    night: true,
  };
}

// Depth multipliers: sky, far hills, mid hills, motes, foreground.
const DEPTH = [0.2, 0.4, 0.9, 0.7, 1.5];

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const MeadowScene: React.FC<SceneProps> = ({ offset, motionEnabled = true }) => {
  const targetRef = useRef(offset);
  const motionRef = useRef(motionEnabled);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  const palette = useMemo(() => getPalette(new Date().getHours()), []);

  // Everything random is generated once, with a fixed seed.
  const scene = useMemo(() => {
    const r = mulberry32(2024);

    const farBlades = buildBlades(
      r, 80, 300, 40, 95, 3, 6,
      [palette.far], 7,
    );
    const midBlades = buildBlades(
      r, 100, 320, 90, 170, 4, 8,
      palette.blades, 5.5,
    );
    const nearBlades = buildBlades(
      r, 46, 400, 180, 320, 8, 16,
      palette.near, 4,
    );

    const flowers = Array.from({ length: 12 }, (_, i) => {
      const x = ((i + r()) / 12) * 1000;
      const h = 45 + r() * 40;
      const bend = (r() * 2 - 1) * 14;
      const colors = ['#fff6d8', '#f5d36b', '#e8b4d8', '#ffffff'];
      return {
        stem: `M${x.toFixed(1)} 320 Q${(x + bend * 0.4).toFixed(1)} ${(320 - h * 0.6).toFixed(1)} ${(x + bend).toFixed(1)} ${(320 - h).toFixed(1)}`,
        cx: x + bend,
        cy: 320 - h,
        color: colors[i % colors.length],
        delay: -((x / 1000) * 5.5 * 0.6),
      };
    });

    const clouds = Array.from({ length: 4 }, (_, i) => ({
      top: 8 + i * 9 + r() * 4,
      width: 180 + r() * 160,
      height: 40 + r() * 24,
      dur: 70 + r() * 50,
      delay: -(r() * 90),
      opacity: 0.35 + r() * 0.3,
    }));

    const motes = Array.from({ length: 18 }, () => {
      const dur = 10 + r() * 8;
      return {
        left: r() * 100,
        top: 30 + r() * 50,
        size: 2 + r() * 2.5,
        dur,
        delay: -(r() * dur),
      };
    });

    const stars = palette.night
      ? Array.from({ length: 22 }, () => ({
          left: r() * 100,
          top: r() * 45,
          size: 1 + r() * 1.5,
          dur: 3 + r() * 4,
          delay: -(r() * 6),
        }))
      : [];

    return { farBlades, midBlades, nearBlades, flowers, clouds, motes, stars };
  }, [palette]);

  // Sync props into refs without re-rendering.
  useEffect(() => {
    targetRef.current = offset;
    motionRef.current = motionEnabled;
  }, [offset.x, offset.y, motionEnabled]);

  // Smooth parallax via rAF lerp, written straight to the DOM.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = { x: 0, y: 0 };
    let raf = 0;

    const tick = () => {
      const t = motionRef.current && !reduce ? targetRef.current : { x: 0, y: 0 };
      cur = {
        x: cur.x + (t.x - cur.x) * 0.08,
        y: cur.y + (t.y - cur.y) * 0.08,
      };
      for (let i = 0; i < DEPTH.length; i++) {
        const el = layerRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${(cur.x * DEPTH[i]).toFixed(2)}px, ${(cur.y * DEPTH[i]).toFixed(2)}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setRef = (i: number) => (el: HTMLDivElement | null) => {
    layerRefs.current[i] = el;
  };

  const { sky, sun, far, mid, night } = palette;

  return (
    <div
      className="meadow-root absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{
        background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 55%, ${sky[2]} 100%)`,
      }}
    >
      <style>{CSS}</style>

      {/* Layer 0: sky, sun or moon, clouds, light rays */}
      <div ref={setRef(0)} className="meadow-layer">
        {night ? (
          <>
            {scene.stars.map((s, i) => (
              <div
                key={`star-${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  animation: `meadow-twinkle ${s.dur}s ease-in-out infinite`,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
            <div
              className="absolute rounded-full"
              style={{
                top: '14%',
                left: '70%',
                width: 56,
                height: 56,
                background: `radial-gradient(circle at 35% 35%, #ffffff, ${sun} 60%, ${sun}00 72%)`,
                boxShadow: `0 0 60px 18px ${sun}40`,
                animation: 'meadow-breathe 9s ease-in-out infinite',
              }}
            />
          </>
        ) : (
          <div
            className="absolute rounded-full"
            style={{
              top: '14%',
              left: '22%',
              width: 120,
              height: 120,
              background: `radial-gradient(circle, ${sun} 0%, ${sun} 28%, ${sun}55 48%, ${sun}00 70%)`,
              animation: 'meadow-breathe 9s ease-in-out infinite',
            }}
          />
        )}

        {scene.clouds.map((c, i) => (
          <div
            key={`cloud-${i}`}
            className="meadow-cloud"
            style={{
              top: `${c.top}%`,
              width: c.width,
              height: c.height,
              opacity: c.opacity,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}

        {!night && (
          <>
            <div
              className="absolute"
              style={{
                top: '-10%',
                left: '18%',
                width: 140,
                height: '120%',
                background: 'linear-gradient(to bottom, rgba(255,246,220,0.45), rgba(255,246,220,0) 70%)',
                transform: 'rotate(18deg)',
                filter: 'blur(6px)',
                animation: 'meadow-ray 9s ease-in-out infinite',
              }}
            />
            <div
              className="absolute"
              style={{
                top: '-10%',
                left: '34%',
                width: 70,
                height: '120%',
                background: 'linear-gradient(to bottom, rgba(255,246,220,0.3), rgba(255,246,220,0) 65%)',
                transform: 'rotate(18deg)',
                filter: 'blur(4px)',
                animation: 'meadow-ray 11s ease-in-out infinite',
                animationDelay: '-4s',
              }}
            />
          </>
        )}
      </div>

      {/* Layer 1: far hills and grass, with atmospheric haze */}
      <div ref={setRef(1)} className="meadow-layer">
        <svg className="meadow-svg" style={{ height: '34%' }} viewBox="0 0 1000 300" preserveAspectRatio="none">
          <path
            d="M0 300 L0 165 C140 120 290 180 470 140 C650 100 820 160 1000 118 L1000 300 Z"
            fill={far}
            opacity={0.7}
          />
          {scene.farBlades.map((b, i) => (
            <path
              key={`f-${i}`}
              d={b.d}
              fill={b.color}
              opacity={0.75}
              className="meadow-blade"
              style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
            />
          ))}
        </svg>
      </div>

      {/* Layer 2: mid hills, grass, and wildflowers */}
      <div ref={setRef(2)} className="meadow-layer">
        <svg className="meadow-svg" style={{ height: '30%' }} viewBox="0 0 1000 320" preserveAspectRatio="none">
          <path
            d="M0 320 L0 185 C200 140 360 205 560 168 C760 132 880 182 1000 162 L1000 320 Z"
            fill={mid}
            opacity={0.9}
          />
          {scene.midBlades.map((b, i) => (
            <path
              key={`m-${i}`}
              d={b.d}
              fill={b.color}
              className="meadow-blade"
              style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
            />
          ))}
          {scene.flowers.map((f, i) => (
            <g
              key={`fl-${i}`}
              className="meadow-blade"
              style={{ animationDuration: '5.5s', animationDelay: `${f.delay}s` }}
            >
              <path d={f.stem} stroke={mid} strokeWidth={1.6} fill="none" />
              <circle cx={f.cx} cy={f.cy} r={3.6} fill={f.color} opacity={0.9} />
            </g>
          ))}
        </svg>
      </div>

      {/* Layer 3: drifting pollen or seeds */}
      <div ref={setRef(3)} className="meadow-layer">
        {scene.motes.map((m, i) => (
          <div
            key={`mote-${i}`}
            className="meadow-mote"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Layer 4: foreground grass */}
      <div ref={setRef(4)} className="meadow-layer">
        <svg className="meadow-svg" style={{ height: '44%' }} viewBox="0 0 1000 400" preserveAspectRatio="none">
          {scene.nearBlades.map((b, i) => (
            <path
              key={`n-${i}`}
              d={b.d}
              fill={b.color}
              className="meadow-blade"
              style={{ animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
            />
          ))}
        </svg>
        <div
          className="absolute bottom-0 w-full h-20"
          style={{
            background: `linear-gradient(to top, ${palette.near[1]}, ${palette.near[1]}00)`,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Wind sheen that travels across the field */}
      <div
        className="absolute left-0 w-[45%] pointer-events-none"
        style={{
          top: '52%',
          height: '28%',
          background: `linear-gradient(90deg, rgba(255,250,225,0) 0%, rgba(255,250,225,${night ? 0.05 : 0.2}) 50%, rgba(255,250,225,0) 100%)`,
          animation: 'meadow-sheen 13s ease-in-out infinite',
          filter: 'blur(10px)',
        }}
      />

      {/* Warm light wash and subtle grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: night
            ? 'linear-gradient(to top, rgba(10,20,30,0.35), transparent 60%)'
            : 'linear-gradient(to top right, transparent, rgba(255,236,190,0.12), rgba(255,220,160,0.18))',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: NOISE, opacity: 0.05, mixBlendMode: 'overlay' }}
      />
    </div>
  );
};