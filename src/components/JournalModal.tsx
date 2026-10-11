import React, { useState } from 'react';
import { JournalEntry, PhotoAsset, saveEntry, savePhoto } from '../services/storage';

interface JournalModalProps {
  initialSessionId?: string | null;
  existingEntry?: JournalEntry | null;
  onSaved: () => void;
  onClose: () => void;
}

const PROMPT_SUGGESTIONS = [
  'A sound in the distance',
  'The temperature of the breeze',
  'A movement in the branches',
  'The texture of the air',
  'Light shifting on the ground',
  'A bird call nearby',
  'The warmth of the sun',
  'A quiet thought that passed',
];

type MoodOption = 'calm' | 'restless' | 'sleepy' | 'happy' | 'heavy' | '';

export const JournalModal: React.FC<JournalModalProps> = ({
  initialSessionId = null,
  existingEntry = null,
  onSaved,
  onClose,
}) => {
  const [obs1, setObs1] = useState(existingEntry?.observations[0] || '');
  const [obs2, setObs2] = useState(existingEntry?.observations[1] || '');
  const [obs3, setObs3] = useState(existingEntry?.observations[2] || '');
  const [text, setText] = useState(existingEntry?.text || '');
  const [mood, setMood] = useState<MoodOption>(existingEntry?.mood || 'calm');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pick 3 random prompt suggestions for the placeholders
  const [placeholders] = useState(() => {
    const shuffled = [...PROMPT_SUGGESTIONS].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1], shuffled[2]];
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let photoId = existingEntry?.photoId || null;

    if (photoDataUrl) {
      photoId = `photo_${Date.now()}`;
      const newPhoto: PhotoAsset = {
        id: photoId,
        dataUrl: photoDataUrl,
        createdAt: Date.now(),
      };
      await savePhoto(newPhoto);
    }

    const observations = [obs1.trim(), obs2.trim(), obs3.trim()].filter(Boolean);

    const entry: JournalEntry = {
      id: existingEntry ? existingEntry.id : `entry_${Date.now()}`,
      sessionId: existingEntry ? existingEntry.sessionId : initialSessionId,
      createdAt: existingEntry ? existingEntry.createdAt : Date.now(),
      observations,
      mood,
      text: text.trim(),
      photoId,
    };

    await saveEntry(entry);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#f7f7f7] dark:bg-[#1c1c1f] rounded-t-[30px] sm:rounded-[30px] p-6 max-h-[90vh] overflow-y-auto glow-ring border border-neutral-200/80 dark:border-white/10 animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
          <div>
            <h2 className="font-serif-display text-2xl text-black dark:text-white">
              {existingEntry ? 'Edit moment' : 'Keep this moment'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">What did you notice while sitting?</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5 pt-4">
          {/* Up to 3 observations */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Three observations
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs text-neutral-400 font-medium">1</span>
              <input
                type="text"
                value={obs1}
                onChange={(e) => setObs1(e.target.value)}
                placeholder={placeholders[0]}
                className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs text-neutral-400 font-medium">2</span>
              <input
                type="text"
                value={obs2}
                onChange={(e) => setObs2(e.target.value)}
                placeholder={placeholders[1]}
                className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs text-neutral-400 font-medium">3</span>
              <input
                type="text"
                value={obs3}
                onChange={(e) => setObs3(e.target.value)}
                placeholder={placeholders[2]}
                className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30"
              />
            </div>
          </div>

          {/* Additional note / reflection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Notes & thoughts
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Any quiet memory or lingering sense of the place..."
              className="w-full p-3 bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30 resize-none"
            />
          </div>

          {/* Mood Selector (5 simple emoji-free options) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              State of mind
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['calm', 'restless', 'sleepy', 'happy', 'heavy'] as MoodOption[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`py-2 text-xs font-medium rounded-xl border transition cursor-pointer capitalize ${
                    mood === m
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm font-semibold'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Photo Attachment */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Optional photo
            </label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition cursor-pointer">
                <span>{photoDataUrl ? 'Change photo' : 'Attach photo from spot'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoDataUrl && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img src={photoDataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl(null)}
                    className="absolute top-0 right-0 bg-black/60 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-bl"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-[50px] bg-black dark:bg-white text-white dark:text-black font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
