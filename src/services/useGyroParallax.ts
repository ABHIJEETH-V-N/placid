import { useEffect, useRef, useState } from 'react';

interface ParallaxOffset {
  x: number;
  y: number;
}

export function useGyroParallax(enabled: boolean = true) {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // References to keep smoothed values
  const targetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Detect iOS permission requirement
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent?.requestPermission === 'function'
    ) {
      setNeedsIOSPermission(true);
    }
  }, []);

  const requestIOSMotion = async (): Promise<boolean> => {
    try {
      const DeviceOrientationEventAny = (window as unknown as {
        DeviceOrientationEvent?: { requestPermission?: () => Promise<'granted' | 'denied'> };
      }).DeviceOrientationEvent;

      if (DeviceOrientationEventAny && typeof DeviceOrientationEventAny.requestPermission === 'function') {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          setNeedsIOSPermission(false);
          return true;
        }
      }
    } catch (err) {
      console.warn('Error requesting iOS motion permission:', err);
    }
    setNeedsIOSPermission(false);
    return false;
  };

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    // Check system prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    let hasReceivedSensor = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return;
      hasReceivedSensor = true;

      // Gamma: left-to-right tilt in degrees [-90, 90]
      // Beta: front-to-back tilt in degrees [-180, 180], typical holding phone is ~45deg
      const rawX = e.gamma || 0;
      const rawY = (e.beta || 45) - 45; // neutral is around 45° holding tilt

      // Clamp to ±15 degrees
      const clampedX = Math.max(-15, Math.min(15, rawX));
      const clampedY = Math.max(-15, Math.min(15, rawY));

      targetRef.current = {
        x: clampedX,
        y: clampedY,
      };
    };

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      // Fallback for desktop mouse move
      if (hasReceivedSensor) return;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const normX = ((e.clientX - centerX) / centerX) * 15;
      const normY = ((e.clientY - centerY) / centerY) * 15;
      targetRef.current = {
        x: Math.max(-15, Math.min(15, normX)),
        y: Math.max(-15, Math.min(15, normY)),
      };
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('pointermove', handlePointerMove);

    // Lerp loop with low-pass filter (factor ~0.08) and subtle slow ambient breathing
    let startTime = performance.now();
    const lerpFactor = 0.08;

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      // Ambient slow drift: subtle 0.8px undulating cycle
      const ambientX = Math.sin(elapsed * 0.5) * 1.2;
      const ambientY = Math.cos(elapsed * 0.4) * 0.8;

      const targetX = targetRef.current.x + ambientX;
      const targetY = targetRef.current.y + ambientY;

      currentRef.current.x += (targetX - currentRef.current.x) * lerpFactor;
      currentRef.current.y += (targetY - currentRef.current.y) * lerpFactor;

      setOffset({
        x: Number(currentRef.current.x.toFixed(2)),
        y: Number(currentRef.current.y.toFixed(2)),
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('pointermove', handlePointerMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, permissionGranted]);

  return {
    offset,
    needsIOSPermission,
    requestIOSMotion,
  };
}
