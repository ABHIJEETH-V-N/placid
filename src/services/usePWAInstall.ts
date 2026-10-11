import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Detect standalone mode
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const iOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const standalone = standaloneMedia || iOSStandalone;
    setIsStandalone(standalone);

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isWebKit = /webkit/.test(ua);
    setIsIOS(isIOSDevice && isWebKit);

    // 3. Detect mobile device
    const isMobileDevice = /android|iphone|ipad|ipod|mobile/.test(ua) || window.innerWidth <= 768;
    setIsMobile(isMobileDevice);

    // 4. Handle beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('Install prompt failed:', err);
    }
    return false;
  };

  return {
    isStandalone,
    isInstallable: !!deferredPrompt,
    isIOS,
    isMobile,
    installedSuccess,
    promptInstall,
  };
}
