import React, { useState } from 'react';
import {
  AmbientSound,
  AppSettings,
  BellTone,
  exportAllData,
  importAllData,
  resetAllData,
  saveSettings,
} from '../../services/storage';
import { SCENES } from '../scenes/SceneRenderer';
import { usePWAInstall } from '../../services/usePWAInstall';
import { playBellChime } from '../../services/audio';

interface SettingsTabProps {
  settings: AppSettings;
  onSettingsUpdated: (settings: AppSettings) => void;
  onResetData: () => void;
  onRefreshData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSettingsUpdated,
  onResetData,
  onRefreshData,
}) => {
  const { isStandalone, isInstallable, promptInstall } = usePWAInstall();
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    await saveSettings(updated);
    onSettingsUpdated(updated);
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled && typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm !== 'granted') {
        alert('Notifications were blocked in your browser settings.');
        return;
      }
    }
    updateSetting('reminderEnabled', enabled);
  };

  const handleTestReminder = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      Notification?.requestPermission().then((perm) => {
        setNotificationStatus(perm);
        if (perm === 'granted') sendNotification();
        else alert('Notification permission is required to send reminders.');
      });
      return;
    }
    sendNotification();
  };

  const sendNotification = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Placid',
        body: 'A few quiet minutes outside?',
      });
    } else if (typeof Notification !== 'undefined') {
      new Notification('Placid', {
        body: 'A few quiet minutes outside?',
        icon: '/icon-192.png',
      });
    }
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleExport = async () => {
    const jsonStr = await exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placid-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const ok = await importAllData(reader.result);
        if (ok) {
          alert('Data restored successfully.');
          onRefreshData();
        } else {
          alert('Could not restore file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    await resetAllData();
    setConfirmResetOpen(false);
    onResetData();
  };

  const soundscapes: { id: AmbientSound; name: string }[] = [
    { id: 'silence', name: 'Silence' },
    { id: 'wind', name: 'Soft Wind' },
    { id: 'rain', name: 'Forest Rain' },
    { id: 'crickets', name: 'Night Crickets' },
    { id: 'stream', name: 'Flowing Stream' },
  ];

  const bellTones: { id: BellTone; name: string }[] = [
    { id: 'singing-bowl', name: 'Singing Bowl' },
    { id: 'temple-bell', name: 'Kyoto Bell' },
    { id: 'wood-clapper', name: 'Wood Clapper' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12 pt-2 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-normal text-neutral-900 dark:text-white tracking-tight leading-tight">
          Settings
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mt-1.5 font-normal">
          Preferences for stillness, sensations, and reminders.
        </p>
      </div>

      {/* Group: Experience */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-5">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Experience
        </h3>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Appearance</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Light, night dark, or match device</div>
          </div>
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateSetting('theme', t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition cursor-pointer ${
                  settings.theme === t
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Breathing Guide */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Breathing guide</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Gentle expanding circle with breath pacing</div>
          </div>
          <button
            type="button"
            onClick={() => updateSetting('breathing', !settings.breathing)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
              settings.breathing ? 'bg-[#007aff]' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.breathing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Sense Guide / Noticing Anchor */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Senses anchor</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Quiet rotating noticing prompts during sits</div>
          </div>
          <button
            type="button"
            onClick={() => updateSetting('senseGuide', !(settings.senseGuide ?? true))}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
              (settings.senseGuide ?? true) ? 'bg-[#007aff]' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                (settings.senseGuide ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Motion / Parallax */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Motion effects</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Gyroscope tilt parallax in scenes</div>
          </div>
          <button
            type="button"
            onClick={() => updateSetting('motion', !settings.motion)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
              settings.motion ? 'bg-[#007aff]' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.motion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Bell Chime Tone Selection */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Chime sound</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Synthesized acoustic meditation tone</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={settings.bellTone || 'singing-bowl'}
              onChange={(e) => {
                const val = e.target.value as BellTone;
                updateSetting('bellTone', val);
                playBellChime(val);
              }}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              {bellTones.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Ambient Nature Soundscape */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Ambient soundscape</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Continuous background audio</div>
          </div>
          <select
            value={settings.ambient}
            onChange={(e) => updateSetting('ambient', e.target.value as AmbientSound)}
            className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700"
          >
            {soundscapes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

        {/* Default scene */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Default scene</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Initial scene shown on sit screen</div>
          </div>
          <select
            value={settings.defaultSceneId}
            onChange={(e) => updateSetting('defaultSceneId', e.target.value)}
            className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-700"
          >
            {SCENES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Group: Reminders */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-5">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Reminders
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Daily reminder</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Gentle notification to step outside</div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleReminder(!settings.reminderEnabled)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
              settings.reminderEnabled ? 'bg-[#007aff]' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.reminderEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.reminderEnabled && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Reminder time</span>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => updateSetting('reminderTime', e.target.value)}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-mono border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-[240px] leading-relaxed">
            Reminders work while Placid is open or recently used. Continuous background timers on locked devices without an active tab require push servers.
          </p>
          <button
            onClick={handleTestReminder}
            className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 shrink-0 cursor-pointer"
          >
            {testNotificationSent ? 'Sent' : 'Test reminder'}
          </button>
        </div>
      </div>

      {/* Group: Backup & Privacy */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-4">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Data & Storage
        </h3>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Your spots, sits, and photos never leave this device. Export a copy to keep your data safe across devices.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            Export all data
          </button>
          <label className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition text-center cursor-pointer">
            <span>Restore data</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
          >
            Reset all data
          </button>
        </div>
      </div>

      {/* Group: About & Install */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4a7ff2] to-[#9d78cd] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              P
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">Placid v1.1.0</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Works offline
              </div>
            </div>
          </div>

          {!isStandalone && isInstallable && (
            <button
              onClick={promptInstall}
              className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition cursor-pointer"
            >
              Install App
            </button>
          )}
        </div>
      </div>

      {/* Double Confirm Reset Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 text-black dark:text-white glow-ring animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-white/10">
            <h3 className="font-serif-display text-2xl text-rose-600 dark:text-rose-400 mb-2">
              Reset everything?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
              This will permanently delete all your spots, sitting sessions, photos, and journal entries. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition cursor-pointer"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
