import React, { useMemo, useState } from 'react';
import { AppSettings, Session, Spot } from '../../services/storage';

interface TodayTabProps {
  spots: Spot[];
  sessions: Session[];
  settings: AppSettings;
  selectedSpot: Spot | null;
  onSelectSpot: (spot: Spot | null) => void;
  onOpenSpotManager: () => void;
  onStartSession: (minutes: number, spot: Spot | null) => void;
}

const DAILY_REFLECTIONS = [
  'The morning air is still waiting for you.',
  'Leaves gather gently at your feet.',
  'Look up at the tallest branch you can see.',
  'Listen to the farthest sound you can hear.',
  'Notice the light filtering through the clouds.',
  'A cool breeze softens the afternoon.',
  'A quiet stone does not hurry.',
];

export const TodayTab: React.FC<TodayTabProps> = ({
  spots,
  sessions,
  settings,
  selectedSpot,
  onSelectSpot,
  onOpenSpotManager,
  onStartSession,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(settings.defaultMinutes || 10);
  const [isCustomSlider, setIsCustomSlider] = useState(false);

  // Daily reflection text based on day of year
  const dailyText = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return DAILY_REFLECTIONS[dayOfYear % DAILY_REFLECTIONS.length];
  }, []);

  // Outdoor Light Phase & Golden Hour insight
  const lightPhase = useMemo(() => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const timeVal = hour + minute / 60;

    if (timeVal >= 5.5 && timeVal < 7.0) {
      return {
        title: 'Dawn twilight',
        desc: 'Crisp morning air and gentle first rays.',
        dot: 'bg-amber-300',
      };
    } else if (timeVal >= 7.0 && timeVal < 11.5) {
      return {
        title: 'Morning sun',
        desc: 'Clear ambient birdsong and fresh stillness.',
        dot: 'bg-amber-400',
      };
    } else if (timeVal >= 11.5 && timeVal < 16.5) {
      return {
        title: 'Midday stillness',
        desc: 'Warm sunlight and slow drifting shadows.',
        dot: 'bg-yellow-400',
      };
    } else if (timeVal >= 16.5 && timeVal < 19.0) {
      return {
        title: 'Golden hour',
        desc: 'Soft golden light and tranquil evening breeze.',
        dot: 'bg-orange-400',
      };
    } else if (timeVal >= 19.0 && timeVal < 20.5) {
      return {
        title: 'Dusk horizon',
        desc: 'Deep purple shadows as the birds settle.',
        dot: 'bg-indigo-400',
      };
    } else {
      return {
        title: 'Starlight night',
        desc: 'Cool nocturnal quiet and resting earth.',
        dot: 'bg-blue-300',
      };
    }
  }, []);

  // Preset minute buttons
  const presets = [5, 10, 15, 20, 30];

  // Calculate Streak (consecutive days with at least one sit >= 5 min / 300 sec)
  const streak = useMemo(() => {
    const qualifyingSessions = sessions.filter((s) => s.actualSeconds >= 300);
    if (qualifyingSessions.length === 0) return 0;

    const satDates = new Set<string>();
    qualifyingSessions.forEach((s) => {
      const d = new Date(s.startedAt);
      satDates.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

    if (!satDates.has(todayStr) && !satDates.has(yestStr)) {
      return 0;
    }

    let count = 0;
    let checkDate = new Date(satDates.has(todayStr) ? today : yesterday);

    while (true) {
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
      if (satDates.has(dateKey)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [sessions]);

  // Calculate Weekly Chart (last 7 days)
  const weeklyData = useMemo(() => {
    const days: { label: string; dateStr: string; minutes: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = dayNames[d.getDay()];
      const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

      const daySeconds = sessions
        .filter((s) => {
          const sd = new Date(s.startedAt);
          return `${sd.getFullYear()}-${sd.getMonth() + 1}-${sd.getDate()}` === dateKey;
        })
        .reduce((acc, curr) => acc + curr.actualSeconds, 0);

      days.push({
        label,
        dateStr: dateKey,
        minutes: Math.round(daySeconds / 60),
      });
    }

    const maxMinutes = Math.max(30, ...days.map((d) => d.minutes));
    return { days, maxMinutes };
  }, [sessions]);

  return (
    <div className="flex flex-col gap-6 pb-12 pt-2 animate-in fade-in duration-300">
      {/* Header section */}
      <div>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-normal text-neutral-900 dark:text-white tracking-tight leading-tight">
          Sit for a while
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mt-1.5 font-normal">
          {dailyText}
        </p>
      </div>

      {/* Outdoor Light Phase Pill */}
      <div className="bg-white/80 dark:bg-[#1c1c1f]/80 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-neutral-200/80 dark:border-white/10 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${lightPhase.dot} animate-pulse`} />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {lightPhase.title}
          </span>
          <span className="text-xs text-neutral-400 hidden sm:inline">·</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
            {lightPhase.desc}
          </span>
        </div>
        <span className="text-[11px] text-neutral-400 font-medium">Outdoor light</span>
      </div>

      {/* Main Sitting Card */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-6">
        {/* Spot Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
            <span>Sitting spot</span>
            <button
              onClick={onOpenSpotManager}
              className="text-[#007aff] hover:underline normal-case font-medium cursor-pointer"
            >
              Manage spots
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => onSelectSpot(null)}
              className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition cursor-pointer ${
                selectedSpot === null
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xs font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Anywhere outside
            </button>
            {spots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => onSelectSpot(spot)}
                className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition cursor-pointer ${
                  selectedSpot?.id === spot.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xs font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {spot.name}
              </button>
            ))}
          </div>
        </div>

        {/* Duration picker: segmented control + custom slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Duration
            </span>
            <span className="font-serif-display text-lg text-neutral-900 dark:text-white">
              {selectedMinutes} {selectedMinutes === 1 ? 'minute' : 'minutes'}
            </span>
          </div>

          {/* Segmented Control */}
          <div className="grid grid-cols-5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl gap-1">
            {presets.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => {
                  setSelectedMinutes(min);
                  setIsCustomSlider(false);
                }}
                className={`py-2 text-xs font-medium rounded-xl transition cursor-pointer ${
                  selectedMinutes === min && !isCustomSlider
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>

          {/* Custom Slider Toggle & Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              <button
                type="button"
                onClick={() => setIsCustomSlider(!isCustomSlider)}
                className="text-[#007aff] hover:underline cursor-pointer"
              >
                {isCustomSlider ? 'Use presets' : 'Custom duration (1–60m)'}
              </button>
            </div>
            {isCustomSlider && (
              <div className="pt-1 px-1">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={selectedMinutes}
                  onChange={(e) => setSelectedMinutes(Number(e.target.value))}
                  className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-neutral-400 font-mono mt-1">
                  <span>1m</span>
                  <span>15m</span>
                  <span>30m</span>
                  <span>45m</span>
                  <span>60m</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Begin Session Button */}
        <button
          onClick={() => onStartSession(selectedMinutes, selectedSpot)}
          type="button"
          className="w-full py-4 rounded-[50px] bg-black dark:bg-white text-white dark:text-black font-semibold text-base hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-98 shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Begin</span>
          <span className="opacity-60 font-normal text-sm">
            · {selectedMinutes}m
          </span>
        </button>
      </div>

      {/* Streak & Weekly Practice Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Streak card */}
        <div className="bg-white dark:bg-[#1c1c1f] rounded-[26px] p-5 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col justify-between">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Practice streak
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif-display text-4xl text-neutral-900 dark:text-white font-normal">
                {streak}
              </span>
              <span className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                {streak === 1 ? 'day in a row' : 'days in a row'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 leading-relaxed">
              Gentle reset: missing a day does not punish. Sit when you are ready.
            </p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white dark:bg-[#1c1c1f] rounded-[26px] p-5 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Last 7 days
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {weeklyData.days.reduce((acc, d) => acc + d.minutes, 0)}m total
            </span>
          </div>

          {/* CSS Pure Bar Chart */}
          <div className="h-24 flex items-end justify-between gap-1.5 pt-2">
            {weeklyData.days.map((day, idx) => {
              const heightPct = Math.max(8, (day.minutes / weeklyData.maxMinutes) * 100);
              const isToday = idx === 6;

              return (
                <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[20px] rounded-t-md transition-all duration-300 ${
                        day.minutes > 0
                          ? isToday
                            ? 'bg-[#007aff]'
                            : 'bg-neutral-800 dark:bg-neutral-300'
                          : 'bg-neutral-200 dark:bg-neutral-800'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isToday
                        ? 'text-[#007aff] font-semibold'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
