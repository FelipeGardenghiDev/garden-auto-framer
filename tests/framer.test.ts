import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FRAMER_CONFIG,
  lerpNumber,
  lerpRect,
  calculateSplitDimensions
} from '../src/core/framer-engine';
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

  it('interpolates numbers and ROIs with smooth tracking lerp', () => {
    expect(lerpNumber(0, 100, 0.5)).toBe(50);
    expect(lerpNumber(10, 20, 0)).toBe(10);
    expect(lerpNumber(10, 20, 1)).toBe(20);

    const r1 = { x: 0, y: 0, width: 0.5, height: 0.5 };
    const r2 = { x: 0.2, y: 0.4, width: 0.3, height: 0.3 };
    const mid = lerpRect(r1, r2, 0.5);

    expect(mid.x).toBeCloseTo(0.1);
    expect(mid.y).toBeCloseTo(0.2);
    expect(mid.width).toBeCloseTo(0.4);
    expect(mid.height).toBeCloseTo(0.4);
  });

  it('calculates safe split dimensions for streamer layout', () => {
    const res = calculateSplitDimensions(1080, 1920, 0.38);
    expect(res.topHeight).toBe(Math.round(1920 * 0.38));
    expect(res.bottomHeight).toBe(1920 - res.topHeight);
    expect(res.dividerY).toBe(res.topHeight);

    // Clamps extreme ratios
    const clampedLow = calculateSplitDimensions(1080, 1920, 0.05);
    expect(clampedLow.topHeight).toBe(Math.round(1920 * 0.15));

    const clampedHigh = calculateSplitDimensions(1080, 1920, 0.95);
    expect(clampedHigh.topHeight).toBe(Math.round(1920 * 0.85));
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
