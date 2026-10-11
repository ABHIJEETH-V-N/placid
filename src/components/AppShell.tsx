import React, { useEffect, useState } from 'react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  getEntries,
  getPhotos,
  getSessions,
  getSettings,
  getSpots,
  JournalEntry,
  PhotoAsset,
  saveSettings,
  Session,
  Spot,
} from '../services/storage';
import { TodayTab } from './tabs/TodayTab';
import { ScenesTab } from './tabs/ScenesTab';
import { JournalTab } from './tabs/JournalTab';
import { SettingsTab } from './tabs/SettingsTab';
import { SitSessionModal } from './SitSessionModal';
import { JournalModal } from './JournalModal';
import { SpotManageModal } from './SpotManageModal';

type TabType = 'today' | 'scenes' | 'journal' | 'settings';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // Modals
  const [activeSessionConfig, setActiveSessionConfig] = useState<{
    minutes: number;
    spot: Spot | null;
  } | null>(null);

  const [journalModalData, setJournalModalData] = useState<{
    initialSessionId?: string | null;
    existingEntry?: JournalEntry | null;
  } | null>(null);

  const [isSpotManagerOpen, setIsSpotManagerOpen] = useState(false);

  // Refresh all local data
  const loadData = async () => {
    const [sp, se, en, ph, st] = await Promise.all([
      getSpots(),
      getSessions(),
      getEntries(),
      getPhotos(),
      getSettings(),
    ]);
    setSpots(sp);
    setSessions(se);
    setEntries(en);
    setPhotos(ph);
    setSettings(st);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Theme application
  const isDarkMode =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleQuickTheme = async () => {
    const nextTheme: 'light' | 'dark' = isDarkMode ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    await saveSettings(updated);
  };

  // Scheduled reminder checker while open
  useEffect(() => {
    if (!settings.reminderEnabled) return;

    let lastFiredDay = -1;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      if (
        currentTimeStr === settings.reminderTime &&
        lastFiredDay !== now.getDate() &&
        Notification?.permission === 'granted'
      ) {
        lastFiredDay = now.getDate();
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: 'Placid',
            body: 'A few quiet minutes outside?',
          });
        } else {
          new Notification('Placid', {
            body: 'A few quiet minutes outside?',
            icon: '/icon-192.png',
          });
        }
      }
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [settings.reminderEnabled, settings.reminderTime]);

  const handleStartSession = (minutes: number, spot: Spot | null) => {
    setActiveSessionConfig({ minutes, spot });
  };

  const handleSessionFinished = (session: Session) => {
    setActiveSessionConfig(null);
    loadData();
    setJournalModalData({ initialSessionId: session.id });
  };

  const activePhotoUrl = photos[0]?.dataUrl || null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] dark:bg-[#121214] text-[#1c1c1e] dark:text-[#f2f2f7] flex justify-center selection:bg-[#007aff]/20 font-sans transition-colors duration-200">
      {/* Mobile container centered max-width 430px */}
      <div className="w-full max-w-[430px] min-h-screen flex flex-col justify-between relative shadow-xs bg-[#f7f7f7] dark:bg-[#121214]">
        {/* Top Minimal Utility Header with Theme Toggle */}
        <header className="px-5 pt-safe pt-3 pb-1 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#4a7ff2] to-[#9d78cd] flex items-center justify-center p-0.5 shadow-xs">
              <div className="w-2 h-2 rounded-full bg-white opacity-95" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
              Placid
            </span>
          </div>

          {/* Quick Light/Dark toggle button */}
          <button
            onClick={toggleQuickTheme}
            type="button"
            className="w-8 h-8 rounded-full bg-white dark:bg-[#1c1c1f] border border-neutral-200/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition shadow-xs cursor-pointer"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              /* Sun Icon */
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              /* Moon Icon */
              <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-5 pb-24 overflow-x-hidden">
          {activeTab === 'today' && (
            <TodayTab
              spots={spots}
              sessions={sessions}
              settings={settings}
              selectedSpot={selectedSpot}
              onSelectSpot={setSelectedSpot}
              onOpenSpotManager={() => setIsSpotManagerOpen(true)}
              onStartSession={handleStartSession}
            />
          )}

          {activeTab === 'scenes' && (
            <ScenesTab
              settings={settings}
              photos={photos}
              onSettingsUpdated={(st) => setSettings(st)}
              onPhotosUpdated={loadData}
            />
          )}

          {activeTab === 'journal' && (
            <JournalTab
              entries={entries}
              sessions={sessions}
              spots={spots}
              photos={photos}
              onOpenNewEntry={() => setJournalModalData({})}
              onEditEntry={(entry) => setJournalModalData({ existingEntry: entry })}
              onRefreshData={loadData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSettingsUpdated={(st) => setSettings(st)}
              onResetData={loadData}
              onRefreshData={loadData}
            />
          )}
        </main>

        {/* Bottom Tab Bar (4 tabs, icon + label, active tab in #007aff, 44px min touch target) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none pb-safe">
          <div className="w-full max-w-[430px] px-3 pb-2 pt-1 pointer-events-auto">
            <div className="bg-white/95 dark:bg-[#1c1c1f]/95 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 rounded-[32px] px-2 py-1.5 flex items-center justify-around shadow-lg glow-ring">
              {/* Today Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'today'
                    ? 'text-[#007aff]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5" strokeWidth="1.8" />
                  <line x1="12" y1="1" x2="12" y2="3" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="23" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="3" y2="12" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="23" y2="12" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] font-semibold tracking-tight">Today</span>
              </button>

              {/* Scenes Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('scenes')}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'scenes'
                    ? 'text-[#007aff]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 18l5.5-7.5L13 16l4-5.5L21 18H3z" />
                </svg>
                <span className="text-[11px] font-semibold tracking-tight">Scenes</span>
              </button>

              {/* Journal Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'journal'
                    ? 'text-[#007aff]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-[11px] font-semibold tracking-tight">Journal</span>
              </button>

              {/* Settings Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'text-[#007aff]'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                </svg>
                <span className="text-[11px] font-semibold tracking-tight">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Sit Session Modal (Full-screen) */}
        {activeSessionConfig && (
          <SitSessionModal
            plannedMinutes={activeSessionConfig.minutes}
            spot={activeSessionConfig.spot}
            sceneId={settings.defaultSceneId || 'meadow'}
            photoUrl={activePhotoUrl}
            settings={settings}
            onFinish={handleSessionFinished}
            onClose={() => setActiveSessionConfig(null)}
          />
        )}

        {/* Keep this moment / Journal Modal */}
        {journalModalData && (
          <JournalModal
            initialSessionId={journalModalData.initialSessionId}
            existingEntry={journalModalData.existingEntry}
            onSaved={() => {
              setJournalModalData(null);
              loadData();
            }}
            onClose={() => setJournalModalData(null)}
          />
        )}

        {/* Spot Management Modal */}
        {isSpotManagerOpen && (
          <SpotManageModal
            spots={spots}
            sessions={sessions}
            onUpdated={loadData}
            onClose={() => setIsSpotManagerOpen(false)}
            onSelectSpot={(sp) => {
              setSelectedSpot(sp);
              setIsSpotManagerOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
