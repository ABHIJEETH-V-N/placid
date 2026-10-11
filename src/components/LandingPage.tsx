import React, { useState } from 'react';
import { usePWAInstall } from '../services/usePWAInstall';
import { MeadowScene } from './scenes/MeadowScene';
import { HeroBackdrop } from './HeroBackdrop';

interface LandingPageProps {
  onOpenApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenApp }) => {
  const { isStandalone, isInstallable, isIOS, installedSuccess, promptInstall } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await promptInstall();
      if (ok) {
        showToast('Placid has been added to your home screen.');
      }
    } else {
      onOpenApp();
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/app');
      setCopiedLink(true);
      showToast('Link copied to clipboard.');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#121214] text-[#1c1c1e] dark:text-[#f2f2f7] antialiased selection:bg-[#007aff]/15 font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c1e] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}

      {/* Floating Nav Capsule */}
      <header className="fixed top-5 left-0 right-0 z-40 px-5 flex justify-center pointer-events-none">
        <nav className="w-full max-w-2xl bg-white/95 dark:bg-[#1c1c1f]/95 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 rounded-[22px] px-4 py-2.5 flex items-center justify-between glow-ring pointer-events-auto shadow-md">
          {/* Brand Icon and Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4a7ff2] via-[#7b7ed8] to-[#9d78cd] flex items-center justify-center p-0.5 shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full bg-white opacity-95" />
            </div>
            <span className="font-semibold text-[18px] tracking-tight text-black dark:text-white">
              Placid
            </span>
          </div>

          {/* Nav links & theme switch */}
          <div className="flex items-center gap-4 sm:gap-6 text-[14px] font-medium text-black dark:text-white">
            <a href="#how-it-works" className="hover:text-[#007aff] transition-colors hidden xs:inline">
              How it works
            </a>
            <a href="#features" className="hover:text-[#007aff] transition-colors hidden sm:inline">
              Features
            </a>
            <a href="#install" className="hover:text-[#007aff] transition-colors">
              Install
            </a>
            <button
              onClick={onOpenApp}
              className="text-[#007aff] hover:underline font-semibold cursor-pointer"
            >
              Open
            </button>

            {/* Quick theme button */}
            <button
              onClick={toggleTheme}
              type="button"
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition cursor-pointer"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" strokeWidth="2" />
                  <path strokeWidth="2" strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section: Full-bleed sunset gradient with living backdrop */}
      <section className="relative min-h-[92vh] sm:min-h-[88vh] flex flex-col justify-between pt-36 pb-0 overflow-hidden">
        <HeroBackdrop />

        {/* Hero headline and primary button */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center mt-8 sm:mt-12 flex-1 flex flex-col items-center justify-center">
          <h1 className="font-serif-display font-normal text-[48px] sm:text-[56px] text-white leading-[1.0] tracking-tight mb-4 drop-shadow-sm">
            Sit still. Notice everything.
          </h1>
          <p className="text-white/90 text-[16px] sm:text-[18px] max-w-md mx-auto mb-10 leading-snug font-normal drop-shadow-sm">
            A calm, minimal mobile companion for setting your phone face down and listening to the world.
          </p>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isStandalone ? (
              <button
                onClick={onOpenApp}
                className="rounded-[50px] bg-white text-black font-semibold text-[16px] px-6 py-[14px] shadow-sm hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
              >
                Open Placid
              </button>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="rounded-[50px] bg-white text-black font-semibold text-[16px] px-6 py-[14px] shadow-sm hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
              >
                Download Placid
              </button>
            ) : isIOS ? (
              <a
                href="#install"
                className="rounded-[50px] bg-white text-black font-semibold text-[16px] px-6 py-[14px] shadow-sm hover:bg-neutral-100 transition active:scale-95 inline-block"
              >
                Add to Home Screen
              </a>
            ) : (
              <button
                onClick={onOpenApp}
                className="rounded-[50px] bg-white text-black font-semibold text-[16px] px-6 py-[14px] shadow-sm hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
              >
                Launch App
              </button>
            )}

            <button
              onClick={onOpenApp}
              className="rounded-[50px] bg-transparent border-[1.5px] border-white text-white font-semibold text-[16px] px-6 py-[12.5px] hover:bg-white/10 transition active:scale-95 cursor-pointer"
            >
              Try in browser
            </button>
          </div>
        </div>
      </section>

      {/* Main Content: centered text column max-width 640px */}
      <main className="max-w-[640px] mx-auto px-6 py-20 flex flex-col gap-24 sm:gap-28">
        {/* Phone Mockup Card Preview */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-white dark:bg-[#1c1c1f] rounded-[32px] p-3 border border-neutral-200/80 dark:border-white/10 glow-ring shadow-xl overflow-hidden">
            {/* Mock phone speaker notch */}
            <div className="w-20 h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 mr-2" />
              <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            {/* Inner Live Screen */}
            <div className="relative h-[520px] rounded-[24px] overflow-hidden bg-[#f7f7f7] dark:bg-[#121214] border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between">
              {/* Scene background layer */}
              <div className="absolute inset-0">
                <MeadowScene offset={{ x: 2, y: -2 }} motionEnabled={true} />
              </div>

              {/* Minimal sitting timer overlay */}
              <div className="relative z-10 pt-10 px-4 text-center">
                <span className="text-xs uppercase tracking-widest text-neutral-800 dark:text-neutral-200 font-semibold bg-white/70 dark:bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
                  Under the oak tree
                </span>
                <div className="my-8 flex justify-center">
                  <div className="relative w-36 h-36 rounded-full border border-neutral-900/15 dark:border-white/20 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-sm shadow-sm animate-breathe">
                    <div className="text-center">
                      <div className="font-serif-display text-3xl font-normal text-neutral-900 dark:text-white">
                        14:20
                      </div>
                      <div className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">breathe in</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock footer pill bar */}
              <div className="relative z-10 p-4">
                <button
                  onClick={onOpenApp}
                  className="w-full py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black text-xs font-semibold tracking-wide hover:bg-black dark:hover:bg-neutral-100 transition cursor-pointer"
                >
                  Tap to sit now
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            Live preview · Designed for solitary outdoor sessions
          </p>
        </div>

        {/* Section 1: How it works */}
        <section id="how-it-works" className="flex flex-col gap-6 scroll-mt-28">
          <h2 className="font-serif-display font-normal text-[36px] text-black dark:text-white leading-[1.0] tracking-tight">
            How it works
          </h2>
          <div className="flex flex-col gap-8 text-[#3e3e3e] dark:text-neutral-300 text-[16px] leading-[1.35] tracking-[-0.32px]">
            <div>
              <span className="block text-black dark:text-white font-semibold text-[17px] mb-1">
                1. Step outside and pick a spot
              </span>
              <p>
                Find a bench, a garden step, or the grass under a tree. Choose your session length, from five quiet minutes to half an hour.
              </p>
            </div>
            <div>
              <span className="block text-black dark:text-white font-semibold text-[17px] mb-1">
                2. Put your phone down
              </span>
              <p>
                Soft singing bowl chimes mark the beginning and quarter marks. An optional whisper of wind or crickets calms the space. The timer keeps accurate time even if the phone goes face-down or locks.
              </p>
            </div>
            <div>
              <span className="block text-black dark:text-white font-semibold text-[17px] mb-1">
                3. Keep what you noticed
              </span>
              <p>
                When the closing chime sounds, jot down three small things: the shift of light, a cold gust, a crow passing overhead. No score, no streaks to maintain—just presence.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features" className="flex flex-col gap-6 scroll-mt-28">
          <h2 className="font-serif-display font-normal text-[36px] text-black dark:text-white leading-[1.0] tracking-tight">
            Features
          </h2>
          <div className="flex flex-col gap-6 text-[#3e3e3e] dark:text-neutral-300 text-[16px] leading-[1.35] tracking-[-0.32px]">
            <p>
              <strong className="text-black dark:text-white font-semibold">Living generative scenes:</strong>{' '}
              Choose between Temple dusk mist, procedurally generated swaying Meadow grass, real-time Local Sky mapped to your local weather, or your own uploaded spot photo.
            </p>
            <p>
              <strong className="text-black dark:text-white font-semibold">Natural gyroscope parallax:</strong>{' '}
              Layers respond smoothly to your phone’s gentle tilt with low-pass filtering, giving depth that feels like looking through an open window.
            </p>
            <p>
              <strong className="text-black dark:text-white font-semibold">Synthesized soundscapes & bell tones:</strong>{' '}
              Singing bowls, temple gongs, wind, rain, stream, and dusk crickets generated directly in code via Web Audio. Zero audio buffering.
            </p>
            <p>
              <strong className="text-black dark:text-white font-semibold">100% private & offline:</strong>{' '}
              Every journal entry, photo, and spot is stored directly in your browser’s IndexedDB. Placid works completely without an internet connection after your first visit.
            </p>
          </div>
        </section>

        {/* Section 3: Install Placid */}
        <section id="install" className="flex flex-col gap-6 scroll-mt-28">
          <h2 className="font-serif-display font-normal text-[36px] text-black dark:text-white leading-[1.0] tracking-tight">
            Install
          </h2>
          <div className="bg-white dark:bg-[#1c1c1f] rounded-[26px] p-6 sm:p-8 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-5">
            {isStandalone || installedSuccess ? (
              <div>
                <span className="text-[#007aff] font-semibold text-sm block mb-1">
                  Installed
                </span>
                <h3 className="font-serif-display text-2xl text-black dark:text-white mb-2">
                  Placid is ready on your home screen.
                </h3>
                <p className="text-[#3e3e3e] dark:text-neutral-300 text-[15px] leading-relaxed mb-6">
                  Launch it from your phone’s home screen to jump straight into your daily sitting ritual without the browser interface.
                </p>
                <button
                  onClick={onOpenApp}
                  className="rounded-[50px] bg-black dark:bg-white text-white dark:text-black font-semibold text-[15px] px-6 py-3 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
                >
                  Open Placid now
                </button>
              </div>
            ) : isInstallable ? (
              <div>
                <h3 className="font-serif-display text-2xl text-black dark:text-white mb-2">
                  Install on your Android or desktop
                </h3>
                <p className="text-[#3e3e3e] dark:text-neutral-300 text-[15px] leading-relaxed mb-6">
                  Tap below to add Placid directly to your device. It installs like a native app, works offline, and opens immediately to the sit timer.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="rounded-[50px] bg-black dark:bg-white text-white dark:text-black font-semibold text-[15px] px-7 py-3.5 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Placid
                </button>
              </div>
            ) : isIOS ? (
              <div>
                <h3 className="font-serif-display text-2xl text-black dark:text-white mb-2">
                  Add to iPhone / iPad Home Screen
                </h3>
                <p className="text-[#3e3e3e] dark:text-neutral-300 text-[15px] leading-relaxed mb-4">
                  Apple Safari lets you install Placid in two quick taps:
                </p>
                <ol className="text-[#3e3e3e] dark:text-neutral-300 text-[15px] leading-relaxed list-decimal pl-5 space-y-2 mb-6">
                  <li>
                    Tap the <strong>Share</strong> button (the square with an arrow pointing up) at the bottom of Safari.
                  </li>
                  <li>
                    Scroll down and select <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong> in the top right. Placid will appear on your home screen.
                  </li>
                </ol>
                <button
                  onClick={onOpenApp}
                  className="rounded-[50px] border-[1.5px] border-black dark:border-white text-black dark:text-white font-semibold text-[15px] px-6 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
                >
                  Or explore in Safari now
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-serif-display text-2xl text-black dark:text-white mb-2">
                  Open on your phone
                </h3>
                <p className="text-[#3e3e3e] dark:text-neutral-300 text-[15px] leading-relaxed mb-4">
                  Placid is designed for sitting outside with your mobile phone. Open this address on Chrome or Safari on your phone to install:
                </p>
                <div className="bg-[#f7f7f7] dark:bg-neutral-800 rounded-xl p-3 text-sm font-mono text-neutral-700 dark:text-neutral-200 flex items-center justify-between break-all mb-5 border border-neutral-200 dark:border-neutral-700">
                  <span>{typeof window !== 'undefined' ? window.location.href : 'https://placid.app'}</span>
                  <button
                    onClick={handleCopyLink}
                    className="ml-3 px-3 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-sans font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition shrink-0 cursor-pointer"
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onOpenApp}
                    className="rounded-[50px] bg-black dark:bg-white text-white dark:text-black font-semibold text-[15px] px-6 py-3 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
                  >
                    Open Placid in browser
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-10 pb-16 border-t border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif-display text-sm text-neutral-800 dark:text-neutral-200">Placid</span>
            <span>·</span>
            <span>Sit still. Notice everything.</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenApp} className="hover:text-neutral-900 dark:hover:text-white transition underline cursor-pointer">
              Launch App
            </button>
            <span>·</span>
            <span>Offline ready</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
