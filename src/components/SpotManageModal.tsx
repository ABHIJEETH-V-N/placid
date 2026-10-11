import React, { useState } from 'react';
import { deleteSpot, saveSpot, Session, Spot } from '../services/storage';

interface SpotManageModalProps {
  spots: Spot[];
  sessions: Session[];
  onUpdated: () => void;
  onClose: () => void;
  onSelectSpot?: (spot: Spot) => void;
}

export const SpotManageModal: React.FC<SpotManageModalProps> = ({
  spots,
  sessions,
  onUpdated,
  onClose,
  onSelectSpot,
}) => {
  const [newSpotName, setNewSpotName] = useState('');
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim()) return;

    const newSpot: Spot = {
      id: `spot_${Date.now()}`,
      name: newSpotName.trim(),
      createdAt: Date.now(),
    };

    await saveSpot(newSpot);
    setNewSpotName('');
    onUpdated();
  };

  const handleStartRename = (s: Spot) => {
    setEditingSpotId(s.id);
    setEditName(s.name);
  };

  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) return;
    const current = spots.find((s) => s.id === id);
    if (current) {
      await saveSpot({ ...current, name: editName.trim() });
      setEditingSpotId(null);
      onUpdated();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete spot "${name}"? Past sit sessions will be kept as "unknown spot".`)) {
      await deleteSpot(id);
      onUpdated();
    }
  };

  const getSpotStats = (spotId: string) => {
    const spotSessions = sessions.filter((s) => s.spotId === spotId);
    const count = spotSessions.length;
    const lastSession = spotSessions[0];
    const lastDate = lastSession
      ? new Date(lastSession.startedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })
      : null;
    return { count, lastDate };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#f7f7f7] dark:bg-[#1c1c1f] rounded-t-[30px] sm:rounded-[30px] p-6 max-h-[85vh] overflow-y-auto glow-ring border border-neutral-200/80 dark:border-white/10 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
          <div>
            <h2 className="font-serif-display text-2xl text-black dark:text-white">Your sitting spots</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Quiet places outside you return to</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Add New Spot */}
        <form onSubmit={handleCreate} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newSpotName}
            onChange={(e) => setNewSpotName(e.target.value)}
            placeholder="the bench by the gate..."
            className="flex-1 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-95 cursor-pointer shrink-0"
          >
            Add spot
          </button>
        </form>

        {/* Spots list */}
        <div className="mt-5 flex flex-col gap-2.5">
          {spots.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 py-6 text-center">
              No saved spots yet. Add one above.
            </p>
          ) : (
            spots.map((spot) => {
              const { count, lastDate } = getSpotStats(spot.id);
              const isEditing = editingSpotId === spot.id;

              return (
                <div
                  key={spot.id}
                  className="bg-white dark:bg-neutral-800/80 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3 shadow-xs"
                >
                  {isEditing ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(spot.id)}
                        className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSpotId(null)}
                        className="px-2 py-1 text-xs text-neutral-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => onSelectSpot && onSelectSpot(spot)}
                        className={`flex-1 ${onSelectSpot ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{spot.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          <span>{count} {count === 1 ? 'sit' : 'sits'}</span>
                          {lastDate && (
                            <>
                              <span>·</span>
                              <span>Last on {lastDate}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartRename(spot)}
                          className="text-xs text-neutral-500 hover:text-black dark:hover:text-white px-2 py-1 cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDelete(spot.id, spot.name)}
                          className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
