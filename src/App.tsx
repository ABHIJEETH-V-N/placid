import { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppShell } from './components/AppShell';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const iOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return standaloneMedia || iOSStandalone;
  });

  useEffect(() => {
    // Check standalone mode
    const checkStandalone = () => {
      const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const iOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standaloneMedia || iOSStandalone);
    };

    checkStandalone();

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Standalone rule: Never render landing page if installed standalone
  if (isStandalone) {
    return <AppShell />;
  }

  // Browser navigation: '/app' shows the app, '/' shows landing page
  if (currentPath.startsWith('/app')) {
    return <AppShell />;
  }

  // Default browser tab root
  return <LandingPage onOpenApp={() => navigateTo('/app')} />;
}
