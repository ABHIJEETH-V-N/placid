import React, { useMemo, useState } from 'react';
import {
  deleteEntry,
  exportAllData,
  importAllData,
  JournalEntry,
  PhotoAsset,
  Session,
  Spot,
} from '../../services/storage';

interface JournalTabProps {
  entries: JournalEntry[];
  sessions: Session[];
  spots: Spot[];
  photos: PhotoAsset[];
  onOpenNewEntry: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onRefreshData: () => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  entries,
  sessions,
  spots,
  photos,
  onOpenNewEntry,
  onEditEntry,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);

  // Map spots and sessions for easy lookup
  const spotsMap = useMemo(() => {
    const map = new Map<string, Spot>();
    spots.forEach((s) => map.set(s.id, s));
    return map;
  }, [spots]);

  const sessionsMap = useMemo(() => {
    const map = new Map<string, Session>();
    sessions.forEach((s) => map.set(s.id, s));
    return map;
  }, [sessions]);

  const photosMap = useMemo(() => {
    const map = new Map<string, PhotoAsset>();
    photos.forEach((p) => map.set(p.id, p));
    return map;
  }, [photos]);

  // Filter entries by query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();

    return entries.filter((e) => {
      const matchText = e.text.toLowerCase().includes(q);
      const matchObs = e.observations.some((obs) => obs.toLowerCase().includes(q));
      const matchMood = e.mood.toLowerCase().includes(q);

      // Check session spot name
      let matchSpot = false;
      if (e.sessionId) {
        const sess = sessionsMap.get(e.sessionId);
        if (sess && sess.spotId) {
          const spot = spotsMap.get(sess.spotId);
          if (spot && spot.name.toLowerCase().includes(q)) matchSpot = true;
        }
      }

      return matchText || matchObs || matchMood || matchSpot;
    });
  }, [entries, searchQuery, sessionsMap, spotsMap]);

  // Group entries by Date string
  const groupedEntries = useMemo(() => {
    const groups: { [dateStr: string]: JournalEntry[] } = {};

    filteredEntries.forEach((entry) => {
      const d = new Date(entry.createdAt);
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      let header = d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (isToday) header = 'Today';
      else if (isYesterday) header = 'Yesterday';

      if (!groups[header]) groups[header] = [];
      groups[header].push(entry);
    });

    return Object.entries(groups);
  }, [filteredEntries]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this journal entry?')) {
      await deleteEntry(id);
      onRefreshData();
    }
  };

  const handleExport = async () => {
    const jsonStr = await exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placid-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const ok = await importAllData(reader.result);
        setImporting(false);
        if (ok) {
          alert('Data restored successfully.');
          onRefreshData();
        } else {
          alert('Failed to restore data. Please verify the JSON file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-8 pb-12 pt-2 animate-in fade-in duration-300">
      {/* Header and "+" action */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-normal text-neutral-900 dark:text-white tracking-tight leading-tight">
            Noticings
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mt-1.5 font-normal">
            Small records of the world while sitting still.
          </p>
        </div>
        <button
          onClick={onOpenNewEntry}
          type="button"
          className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black text-2xl flex items-center justify-center hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-95 shadow-sm cursor-pointer shrink-0"
          title="Write new noticing"
        >
          +
        </button>
      </div>

      {/* Search Bar & Export/Import Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search noticings or spots..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1c1c1f] border border-neutral-200 dark:border-white/10 rounded-2xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30"
          />
          <svg
            className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white dark:bg-[#1c1c1f] border border-neutral-200 dark:border-white/10 rounded-2xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            Export JSON
          </button>
          <label className="px-4 py-2 bg-white dark:bg-[#1c1c1f] border border-neutral-200 dark:border-white/10 rounded-2xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer">
            <span>{importing ? 'Importing...' : 'Import JSON'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Entries List grouped by date */}
      {groupedEntries.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-10 border border-neutral-200/80 dark:border-white/10 glow-ring text-center my-4">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs mx-auto">
            {searchQuery
              ? 'No moments match your search.'
              : 'No entries yet. Sit outside for a few minutes to notice the world.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupedEntries.map(([dateHeader, group]) => (
            <div key={dateHeader} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1">
                {dateHeader}
              </h3>

              <div className="flex flex-col gap-3">
                {group.map((entry) => {
                  const sess = entry.sessionId ? sessionsMap.get(entry.sessionId) : null;
                  const spot = sess && sess.spotId ? spotsMap.get(sess.spotId) : null;
                  const photo = entry.photoId ? photosMap.get(entry.photoId) : null;
                  const durationMin = sess
                    ? Math.max(1, Math.round(sess.actualSeconds / 60))
                    : null;

                  return (
                    <div
                      key={entry.id}
                      className="bg-white dark:bg-[#1c1c1f] rounded-[26px] p-5 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-3.5 shadow-xs"
                    >
                      {/* Entry Header: Spot, Duration, Scene, Mood */}
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {spot ? spot.name : 'Unknown spot'}
                          </span>
                          {durationMin && (
                            <>
                              <span>·</span>
                              <span>{durationMin}m sit</span>
                            </>
                          )}
                          {sess && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{sess.sceneId}</span>
                            </>
                          )}
                          {entry.mood && (
                            <>
                              <span>·</span>
                              <span className="capitalize text-neutral-700 dark:text-neutral-300 font-medium">
                                {entry.mood}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Edit & Delete actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-neutral-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Observations: 3 items */}
                      {entry.observations.length > 0 && (
                        <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-neutral-200 dark:border-neutral-700">
                          {entry.observations.map((obs, idx) => (
                            <p key={idx} className="text-[15px] text-neutral-800 dark:text-neutral-200 leading-snug">
                              {obs}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* General Text / Notes */}
                      {entry.text && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                          "{entry.text}"
                        </p>
                      )}

                      {/* Attached Photo */}
                      {photo && (
                        <div className="relative h-44 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 mt-1">
                          <img
                            src={photo.dataUrl}
                            alt="Noticing moment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
