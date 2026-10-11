import React, { useEffect, useRef, useState } from 'react';
import { AmbientSound, AppSettings, saveSession, Session, Spot } from '../services/storage';
import { playBellChime, startSoundscape, stopSoundscape } from '../services/audio';
import { SceneRenderer } from './scenes/SceneRenderer';
import { useGyroParallax } from '../services/useGyroParallax';

interface SitSessionModalProps {
  plannedMinutes: number;
  spot: Spot | null;
  sceneId: string;
  photoUrl: string | null;
  settings: AppSettings;
  onFinish: (session: Session) => void;
  onClose: () => void;
}

const SENSE_ANCHORS = [
  'Notice the farthest sound reaching your ears.',
  'Feel the temperature of the air on your skin.',
  'Notice the weight of your hands resting still.',
  'Sense the quiet space between each breath.',
  'Notice light and shadow shifting softly.',
  'Listen for a bird or rustle in the distance.',
  'Notice any scent lingering on the breeze.',
  'Relax your shoulders and let the world be.',
];

export const SitSessionModal: React.FC<SitSessionModalProps> = ({
  plannedMinutes,
  spot,
  sceneId,
  photoUrl,
  settings,
  onFinish,
  onClose,
}) => {
  const targetTotalSeconds = plannedMinutes * 60;

  // Timestamps for background tab resilience
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showEndEarlyConfirm, setShowEndEarlyConfirm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(true);

  // Dynamic ambient sound selection in session
  const [currentAmbient, setCurrentAmbient] = useState<AmbientSound>(settings.ambient);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // Sense Anchor / Noticing Guide
  const [senseIndex, setSenseIndex] = useState(0);

  // Parallax hook
  const { offset, needsIOSPermission, requestIOSMotion } = useGyroParallax(settings.motion);

  // Chime intervals tracked: 0%, 25%, 50%, 75%, 100%
  const chimesPlayedRef = useRef<{ [key: number]: boolean }>({
    0: false,
    25: false,
    50: false,
    75: false,
    100: false,
  });

  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  // Initialize Audio & WakeLock
  useEffect(() => {
    // Play starting chime with selected tone
    if (!chimesPlayedRef.current[0]) {
      playBellChime(settings.bellTone || 'singing-bowl');
      chimesPlayedRef.current[0] = true;
    }

    // Start ambient soundscape if configured
    if (currentAmbient !== 'silence') {
      startSoundscape(currentAmbient);
    }

    // Request screen wake lock
    if ('wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          wakeLockSentinelRef.current = sentinel;
        })
        .catch(() => {
          setWakeLockSupported(false);
        });
    } else {
      setWakeLockSupported(false);
    }

    return () => {
      stopSoundscape();
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
    };
  }, []);

  // Update soundscape when ambient type changes
  useEffect(() => {
    if (!isPaused) {
      startSoundscape(currentAmbient);
    }
  }, [currentAmbient, isPaused]);

  // Sense anchor gentle auto-rotation every 75s
  useEffect(() => {
    if (settings.senseGuide === false) return;
    const interval = setInterval(() => {
      setSenseIndex((prev) => (prev + 1) % SENSE_ANCHORS.length);
    }, 75000);
    return () => clearInterval(interval);
  }, [settings.senseGuide]);

  // Accurate timestamp timer loop
  useEffect(() => {
    if (isPaused || isCompleted) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentElapsed = Math.floor(
        (now - startTimeRef.current - totalPausedDurationRef.current) / 1000
      );

      const boundedElapsed = Math.max(0, Math.min(targetTotalSeconds, currentElapsed));
      setElapsedSeconds(boundedElapsed);

      // Check interval chimes
      const pct = (boundedElapsed / targetTotalSeconds) * 100;
      if (pct >= 25 && !chimesPlayedRef.current[25]) {
        playBellChime(settings.bellTone || 'singing-bowl');
        chimesPlayedRef.current[25] = true;
      }
      if (pct >= 50 && !chimesPlayedRef.current[50]) {
        playBellChime(settings.bellTone || 'singing-bowl');
        chimesPlayedRef.current[50] = true;
      }
      if (pct >= 75 && !chimesPlayedRef.current[75]) {
        playBellChime(settings.bellTone || 'singing-bowl');
        chimesPlayedRef.current[75] = true;
      }

      // Check completion
      if (boundedElapsed >= targetTotalSeconds) {
        if (!chimesPlayedRef.current[100]) {
          playBellChime(settings.bellTone || 'singing-bowl');
          chimesPlayedRef.current[100] = true;
        }
        setIsCompleted(true);
        stopSoundscape();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, isCompleted, targetTotalSeconds, settings.bellTone]);

  // Handle Pause / Resume
  const togglePause = () => {
    if (isPaused) {
      // Resume
      const pauseDuration = Date.now() - pausedTimeRef.current;
      totalPausedDurationRef.current += pauseDuration;
      setIsPaused(false);
      setShowControls(false);
      setShowSoundPicker(false);
      if (currentAmbient !== 'silence') startSoundscape(currentAmbient);
    } else {
      // Pause
      pausedTimeRef.current = Date.now();
      setIsPaused(true);
      setShowControls(true);
      stopSoundscape();
    }
  };

  const handleEndEarly = async () => {
    stopSoundscape();
    const sessionRecord: Session = {
      id: `sess_${Date.now()}`,
      spotId: spot ? spot.id : null,
      sceneId,
      startedAt: startTimeRef.current,
      plannedMinutes,
      actualSeconds: elapsedSeconds,
      completed: false,
      endedEarly: true,
    };
    await saveSession(sessionRecord);
    onFinish(sessionRecord);
  };

  const handleCompletedDone = async () => {
    stopSoundscape();
    const sessionRecord: Session = {
      id: `sess_${Date.now()}`,
      spotId: spot ? spot.id : null,
      sceneId,
      startedAt: startTimeRef.current,
      plannedMinutes,
      actualSeconds: targetTotalSeconds,
      completed: true,
      endedEarly: false,
    };
    await saveSession(sessionRecord);
    onFinish(sessionRecord);
  };

  const remainingSeconds = Math.max(0, targetTotalSeconds - elapsedSeconds);
  const displayMin = Math.floor(remainingSeconds / 60);
  const displaySec = remainingSeconds % 60;
  const progressRatio = targetTotalSeconds > 0 ? elapsedSeconds / targetTotalSeconds : 0;

  // SVG ring stroke calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const ambientOptions: { id: AmbientSound; label: string }[] = [
    { id: 'silence', label: 'Silence' },
    { id: 'wind', label: 'Wind' },
    { id: 'rain', label: 'Rain' },
    { id: 'crickets', label: 'Crickets' },
    { id: 'stream', label: 'Stream' },
  ];

  return (
    <div
      onClick={() => {
        if (!isCompleted && !showEndEarlyConfirm) {
          setShowControls((prev) => !prev);
          setShowSoundPicker(false);
        }
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black flex flex-col justify-between select-none cursor-pointer"
    >
      {/* Background Living Scene */}
      <div className="absolute inset-0">
        <SceneRenderer
          sceneId={sceneId}
          offset={offset}
          motionEnabled={settings.motion}
          photoUrl={photoUrl}
        />
      </div>

      {/* iOS Motion Permission Button if needed */}
      {needsIOSPermission && (
        <div className="absolute top-12 left-0 right-0 z-40 flex justify-center px-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestIOSMotion();
            }}
            className="px-4 py-2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md rounded-full text-xs font-semibold text-neutral-800 dark:text-neutral-100 shadow-md"
          >
            Enable motion tilt
          </button>
        </div>
      )}

      {/* Completion Screen */}
      {isCompleted ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-30 flex-1 flex flex-col items-center justify-center p-6 text-center text-white bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif-display text-4xl mb-2">Stillness complete</h2>
          <p className="text-white/80 text-base max-w-xs mb-8">
            You sat for {plannedMinutes} quiet {plannedMinutes === 1 ? 'minute' : 'minutes'}{' '}
            {spot ? `at ${spot.name}` : ''}.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleCompletedDone}
              className="w-full py-4 rounded-[50px] bg-white text-black font-semibold text-base shadow-lg hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
            >
              Keep this moment
            </button>
            <button
              onClick={() => onClose()}
              className="w-full py-3.5 rounded-[50px] bg-transparent border border-white/40 text-white font-medium text-sm hover:bg-white/10 transition active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Bar Info */}
          <div className="relative z-20 pt-safe px-6 flex justify-between items-center text-white/90 drop-shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-wide">
                {spot ? spot.name : 'Sitting outside'}
              </span>
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/70 capitalize">
                {currentAmbient !== 'silence' ? currentAmbient : 'quiet'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {!wakeLockSupported && (
                <span className="text-[11px] text-white/60">Screen may sleep</span>
              )}
              {/* Quick ambient sound toggle button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSoundPicker(!showSoundPicker);
                }}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
                title="Change soundscape"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Soundscape Dropdown / Modal */}
          {showSoundPicker && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-20 right-6 z-40 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex flex-col gap-1 min-w-[140px] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white/50 uppercase">
                Soundscape
              </div>
              {ambientOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setCurrentAmbient(opt.id);
                    setShowSoundPicker(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium text-left transition flex items-center justify-between ${
                    currentAmbient === opt.id
                      ? 'bg-white text-black font-semibold'
                      : 'text-white/80 hover:bg-white/15'
                  }`}
                >
                  <span>{opt.label}</span>
                  {currentAmbient === opt.id && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* Center Timer & Breathing Guide */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
            {/* Minimal Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Optional Breathing Guide Sphere behind ring */}
              {settings.breathing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-32 h-32 rounded-full bg-white/15 backdrop-blur-xs animate-breathe" />
                </div>
              )}

              {/* Progress SVG Ring */}
              <svg className="w-full h-full -rotate-90 transform">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-linear"
                />
              </svg>

              {/* Time display in center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-md">
                <div className="font-serif-display text-4xl font-normal tracking-tight">
                  {displayMin}:{displaySec < 10 ? `0${displaySec}` : displaySec}
                </div>
                {settings.breathing && (
                  <div className="text-[12px] text-white/80 font-normal mt-0.5 animate-pulse">
                    {displaySec % 12 < 6 ? 'breathe in' : 'breathe out'}
                  </div>
                )}
              </div>
            </div>

            {/* Sense Anchor / Noticing Guide (tap to cycle) */}
            {settings.senseGuide !== false && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSenseIndex((prev) => (prev + 1) % SENSE_ANCHORS.length);
                }}
                className="mt-7 px-5 py-2 rounded-full bg-black/25 backdrop-blur-md border border-white/10 text-white/80 text-xs font-normal tracking-wide max-w-xs text-center hover:bg-black/40 transition active:scale-95 cursor-pointer"
                title="Tap for another noticing prompt"
              >
                {SENSE_ANCHORS[senseIndex]}
              </div>
            )}

            {/* Tap hint when no controls visible */}
            {!showControls && (
              <p className="mt-6 text-[11px] text-white/45 tracking-wider">
                Tap anywhere to pause
              </p>
            )}
          </div>

          {/* Bottom Tap Controls: Pause / End Session */}
          {showControls && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-30 pb-safe px-6 pb-6 flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <button
                onClick={togglePause}
                className="px-6 py-3 rounded-full bg-white/95 text-black text-sm font-semibold shadow-lg hover:bg-white active:scale-95 transition cursor-pointer"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => setShowEndEarlyConfirm(true)}
                className="px-6 py-3 rounded-full bg-black/60 border border-white/30 text-white text-sm font-medium backdrop-blur-md hover:bg-black/80 active:scale-95 transition cursor-pointer"
              >
                End session
              </button>
            </div>
          )}

          {/* Confirm End Early Dialog */}
          {showEndEarlyConfirm && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 text-black dark:text-white glow-ring animate-in zoom-in-95 duration-200 border border-black/5 dark:border-white/10">
                <h3 className="font-serif-display text-2xl mb-2 text-neutral-900 dark:text-neutral-100">
                  End session early?
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
                  Your sit of {Math.floor(elapsedSeconds / 60)} minutes will still be saved to your journal.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEndEarlyConfirm(false)}
                    className="flex-1 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                  >
                    Keep sitting
                  </button>
                  <button
                    onClick={handleEndEarly}
                    className="flex-1 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer"
                  >
                    Yes, end
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
