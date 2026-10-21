import { FramerConfig, GardenCutClipExport } from '../types';

export function createGardenCutExport(
  fileName: string,
  duration: number,
  config: FramerConfig
): GardenCutClipExport {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fileName.replace(/\.[^/.]+$/, '') + ' (9:16 Re-framed)',
    layout: config.layout,
    targetAspectRatio: '9:16',
    resolution: config.exportResolution,
    duration,
    config,
    exportedAt: new Date().toISOString(),
  };
}

export function downloadJsonFile(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
