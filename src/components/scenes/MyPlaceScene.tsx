import React from 'react';

interface SceneProps {
  offset: { x: number; y: number };
  motionEnabled?: boolean;
  photoUrl?: string | null;
  onUploadClick?: () => void;
}

export const MyPlaceScene: React.FC<SceneProps> = ({
  offset,
  motionEnabled = true,
  photoUrl,
  onUploadClick,
}) => {
  const m = motionEnabled ? 1 : 0;
  const farX = offset.x * 0.4 * m;
  const farY = offset.y * 0.4 * m;

  if (!photoUrl) {
    return (
      <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white/70">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-medium mb-1">Your spot in nature</h3>
        <p className="text-white/60 text-sm max-w-xs mb-5">
          Upload a photo of your favorite bench, tree, or view to sit with it anywhere.
        </p>
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            type="button"
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-100 transition active:scale-95 pointer-events-auto"
          >
            Add a photo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden select-none bg-neutral-900">
      {/* Photo layer with parallax and scale padding to prevent white borders on tilt */}
      <div
        className="absolute -inset-8 transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `translate3d(${farX}px, ${farY}px, 0)` }}
      >
        <img
          src={photoUrl}
          alt="My place"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Gentle dark gradient overlay for optimal text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/60 pointer-events-none" />
    </div>
  );
};
