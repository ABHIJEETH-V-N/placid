import React, { useState } from 'react';
import { AppSettings, deletePhoto, PhotoAsset, savePhoto, saveSettings } from '../../services/storage';
import { SCENES, SceneMeta } from '../scenes/SceneRenderer';
import { MeadowScene } from '../scenes/MeadowScene';
import { TempleScene } from '../scenes/TempleScene';
import { LocalSkyScene } from '../scenes/LocalSkyScene';
import { MyPlaceScene } from '../scenes/MyPlaceScene';

interface ScenesTabProps {
  settings: AppSettings;
  photos: PhotoAsset[];
  onSettingsUpdated: (settings: AppSettings) => void;
  onPhotosUpdated: () => void;
}

export const ScenesTab: React.FC<ScenesTabProps> = ({
  settings,
  photos,
  onSettingsUpdated,
  onPhotosUpdated,
}) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    photos[0]?.id || null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activePhoto = photos.find((p) => p.id === selectedPhotoId) || photos[0] || null;

  const handleSelectScene = async (sceneId: string) => {
    const updated = { ...settings, defaultSceneId: sceneId };
    await saveSettings(updated);
    onSettingsUpdated(updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 5) {
      setUploadError('You can store up to 5 favorite spot photos. Delete one to upload another.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const newPhoto: PhotoAsset = {
          id: `photo_${Date.now()}`,
          dataUrl: reader.result,
          createdAt: Date.now(),
        };
        await savePhoto(newPhoto);
        setSelectedPhotoId(newPhoto.id);
        onPhotosUpdated();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePhoto(id);
    if (selectedPhotoId === id) {
      const remaining = photos.filter((p) => p.id !== id);
      setSelectedPhotoId(remaining[0]?.id || null);
    }
    onPhotosUpdated();
  };

  return (
    <div className="flex flex-col gap-8 pb-12 pt-2 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-normal text-neutral-900 dark:text-white tracking-tight leading-tight">
          Visual Scenes
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mt-1.5 font-normal">
          The living world behind your sitting timer. Tap a scene to make it your default.
        </p>
      </div>

      {/* Horizontal Carousel of Scenes */}
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SCENES.map((scene: SceneMeta) => {
            const isSelected = settings.defaultSceneId === scene.id;

            return (
              <div
                key={scene.id}
                onClick={() => handleSelectScene(scene.id)}
                className={`group relative rounded-[28px] overflow-hidden border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#007aff] ring-2 ring-[#007aff]/30 shadow-md bg-white dark:bg-[#1c1c1f]'
                    : 'border-neutral-200/80 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 bg-white dark:bg-[#1c1c1f] shadow-xs'
                }`}
              >
                {/* Scene Preview Window */}
                <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
                  {scene.id === 'meadow' && (
                    <MeadowScene offset={{ x: 0, y: 0 }} motionEnabled={false} />
                  )}
                  {scene.id === 'temple' && (
                    <TempleScene offset={{ x: 0, y: 0 }} motionEnabled={false} />
                  )}
                  {scene.id === 'localsky' && (
                    <LocalSkyScene offset={{ x: 0, y: 0 }} motionEnabled={false} />
                  )}
                  {scene.id === 'myplace' && (
                    <MyPlaceScene
                      offset={{ x: 0, y: 0 }}
                      motionEnabled={false}
                      photoUrl={activePhoto?.dataUrl || null}
                    />
                  )}

                  {/* Selected Tag */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-20 bg-[#007aff] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      Active
                    </div>
                  )}
                </div>

                {/* Scene Details */}
                <div className="p-5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif-display text-2xl text-neutral-900 dark:text-white">
                      {scene.name}
                    </h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                      {scene.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {scene.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "My Place" Photo Management Section */}
      <div className="bg-white dark:bg-[#1c1c1f] rounded-[28px] p-6 border border-neutral-200/80 dark:border-white/10 glow-ring flex flex-col gap-5">
        <div>
          <h3 className="font-serif-display text-2xl text-neutral-900 dark:text-white mb-1">
            My Place Photos
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Upload up to 5 photos from your real sitting spots. They stay saved locally on this phone.
          </p>
        </div>

        {uploadError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900/50">
            {uploadError}
          </div>
        )}

        {/* Saved photos gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoId(photo.id)}
              className={`relative h-28 rounded-2xl overflow-hidden border cursor-pointer group ${
                selectedPhotoId === photo.id
                  ? 'border-[#007aff] ring-2 ring-[#007aff]/30'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <img
                src={photo.dataUrl}
                alt="Saved spot"
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo.id);
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Upload card if fewer than 5 */}
          {photos.length < 5 && (
            <label className="h-28 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Upload photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {photos.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-2">
            No custom spot photos saved yet. Take a picture next time you sit outside.
          </p>
        )}
      </div>
    </div>
  );
};
