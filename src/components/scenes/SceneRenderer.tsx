import React from 'react';
import { TempleScene } from './TempleScene';
import { MeadowScene } from './MeadowScene';
import { LocalSkyScene } from './LocalSkyScene';
import { MyPlaceScene } from './MyPlaceScene';

export interface SceneMeta {
  id: string;
  name: string;
  description: string;
  tagline: string;
}

export const SCENES: SceneMeta[] = [
  {
    id: 'meadow',
    name: 'Meadow',
    description: 'A quiet field of grass swaying gently in the breeze under warm afternoon light.',
    tagline: 'Swaying blades and open sun',
  },
  {
    id: 'temple',
    name: 'Temple',
    description: 'A stone sanctuary at dusk with lantern glow and drifting mountain mist.',
    tagline: 'Lantern glow and stone mist',
  },
  {
    id: 'localsky',
    name: 'Local Sky',
    description: 'Real-time weather, cloud cover, and celestial light at your exact coordinates.',
    tagline: 'The real sky above you right now',
  },
  {
    id: 'myplace',
    name: 'My Place',
    description: 'Your favorite outdoor spot captured in a personal photo with soft depth.',
    tagline: 'Your personal corner of the world',
  },
];

interface SceneRendererProps {
  sceneId: string;
  offset: { x: number; y: number };
  motionEnabled?: boolean;
  photoUrl?: string | null;
  onUploadClick?: () => void;
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({
  sceneId,
  offset,
  motionEnabled = true,
  photoUrl,
  onUploadClick,
}) => {
  switch (sceneId) {
    case 'temple':
      return <TempleScene offset={offset} motionEnabled={motionEnabled} />;
    case 'localsky':
      return <LocalSkyScene offset={offset} motionEnabled={motionEnabled} />;
    case 'myplace':
      return (
        <MyPlaceScene
          offset={offset}
          motionEnabled={motionEnabled}
          photoUrl={photoUrl}
          onUploadClick={onUploadClick}
        />
      );
    case 'meadow':
    default:
      return <MeadowScene offset={offset} motionEnabled={motionEnabled} />;
  }
};
