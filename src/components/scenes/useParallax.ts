import { useEffect, useMemo, useRef } from 'react';

export type Vec = { x: number; y: number };

/**
 * Smooths a target offset with a rAF lerp and writes transforms straight to the DOM.
 * Returns one stable ref callback per layer. Attach them with ref={setters[i]}.
 * Adds a gentle idle drift so scenes feel alive even when the phone is still.
 */
export function useParallax(
  targetRef: React.MutableRefObject<Vec>,
  enabled: boolean,
  depths: number[],
  ambient = true,
) {
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const setters = useMemo(
    () =>
      depths.map((_, i) => (el: HTMLDivElement | null) => {
        layers.current[i] = el;
      }),
    // depths is a module-level constant in every consumer, so this runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cur = { x: 0, y: 0 };
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const on = enabledRef.current && !reduce;
      const t = targetRef.current;
      cur.x += ((on ? t.x : 0) - cur.x) * 0.08;
      cur.y += ((on ? t.y : 0) - cur.y) * 0.08;

      const s = (now - start) / 1000;
      const ax = on && ambient ? Math.sin(s * 0.25) * 3 : 0;
      const ay = on && ambient ? Math.cos(s * 0.19) * 2 : 0;

      for (let i = 0; i < depths.length; i++) {
        const el = layers.current[i];
        if (!el) continue;
        const k = depths[i];
        el.style.transform = `translate3d(${((cur.x + ax) * k).toFixed(2)}px, ${((cur.y + ay) * k).toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [depths, ambient, targetRef]);

  return setters;
}