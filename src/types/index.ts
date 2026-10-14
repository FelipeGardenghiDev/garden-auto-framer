export type LayoutMode = 'split-streamer' | 'blur-fill' | 'auto-pan' | 'centered-card';

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface FramerConfig {
  layout: LayoutMode;
  facecamHeightRatio: number; // Ex: 0.35 para 35% do topo
  blurIntensity: number;       // Ex: 20px
  silenceThresholdDb: number; // Ex: -35 dB
  minSilenceDurationSec: number;
  exportResolution: {
    width: number; // 1080
    height: number; // 1920
  };
}
