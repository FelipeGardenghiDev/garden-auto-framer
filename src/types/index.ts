export type LayoutMode = 'split-streamer' | 'blur-fill' | 'auto-pan' | 'centered-card';

export interface NormalizedRect {
  x: number;      // 0 to 1
  y: number;      // 0 to 1
  width: number;  // 0 to 1
  height: number; // 0 to 1
}

export interface FramerConfig {
  layout: LayoutMode;
  facecamHeightRatio: number; // e.g. 0.35 (35% top facecam)
  facecamRoi: NormalizedRect;
  gameplayRoi: NormalizedRect;
  blurIntensity: number;       // px
  panOffset: number;          // -1 to 1 horizontal pan
  smoothTrackingLerp?: number; // 0.05 to 0.3 for dynamic lerping
  splitDividerColor?: string; // e.g. '#10b981'
  splitDividerWidth?: number; // e.g. 4
  cardTitle: string;
  cardSubtitle: string;
  exportResolution: {
    width: number;  // 1080
    height: number; // 1920
  };
  fps: number;
}

export interface GardenCutClipExport {
  id: string;
  name: string;
  layout: LayoutMode;
  targetAspectRatio: '9:16';
  resolution: { width: number; height: number };
  duration: number;
  config: FramerConfig;
  exportedAt: string;
}
