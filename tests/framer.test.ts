import { describe, it, expect } from 'vitest';
import { DEFAULT_FRAMER_CONFIG } from '../src/core/framer-engine';
import { createGardenCutExport } from '../src/core/gardencut-export';

describe('Garden Auto-Framer - Core Engine & Config', () => {
  it('default configuration has valid 9:16 vertical resolution', () => {
    expect(DEFAULT_FRAMER_CONFIG.exportResolution.width).toBe(1080);
    expect(DEFAULT_FRAMER_CONFIG.exportResolution.height).toBe(1920);
    expect(DEFAULT_FRAMER_CONFIG.exportResolution.width / DEFAULT_FRAMER_CONFIG.exportResolution.height).toBeCloseTo(9 / 16, 2);
  });

  it('facecam and gameplay ROIs are properly normalized between 0 and 1', () => {
    const { facecamRoi, gameplayRoi } = DEFAULT_FRAMER_CONFIG;
    
    expect(facecamRoi.x).toBeGreaterThanOrEqual(0);
    expect(facecamRoi.x + facecamRoi.width).toBeLessThanOrEqual(1);
    expect(facecamRoi.y).toBeGreaterThanOrEqual(0);
    expect(facecamRoi.y + facecamRoi.height).toBeLessThanOrEqual(1);

    expect(gameplayRoi.x).toBeGreaterThanOrEqual(0);
    expect(gameplayRoi.x + gameplayRoi.width).toBeLessThanOrEqual(1);
    expect(gameplayRoi.y).toBeGreaterThanOrEqual(0);
    expect(gameplayRoi.y + gameplayRoi.height).toBeLessThanOrEqual(1);
  });

  it('facecamHeightRatio is in a healthy streamer ratio range', () => {
    expect(DEFAULT_FRAMER_CONFIG.facecamHeightRatio).toBeGreaterThanOrEqual(0.25);
    expect(DEFAULT_FRAMER_CONFIG.facecamHeightRatio).toBeLessThanOrEqual(0.55);
  });
});

describe('Garden Auto-Framer - GardenCut Synergy Export', () => {
  it('generates valid clip descriptor for GardenCut timeline', () => {
    const exportData = createGardenCutExport('highlight_match.mp4', 45.5, DEFAULT_FRAMER_CONFIG);

    expect(exportData.id).toContain('clip_');
    expect(exportData.targetAspectRatio).toBe('9:16');
    expect(exportData.duration).toBe(45.5);
    expect(exportData.name).toContain('highlight_match');
    expect(exportData.config.layout).toBe('split-streamer');
    expect(exportData.exportedAt).toBeDefined();
  });
});
