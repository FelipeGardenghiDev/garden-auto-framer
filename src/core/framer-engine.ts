import { FramerConfig } from '../types';

export const DEFAULT_FRAMER_CONFIG: FramerConfig = {
  layout: 'split-streamer',
  facecamHeightRatio: 0.38,
  facecamRoi: { x: 0.02, y: 0.05, width: 0.32, height: 0.42 }, // common top-left webcam spot
  gameplayRoi: { x: 0.15, y: 0.1, width: 0.7, height: 0.8 },
  blurIntensity: 18,
  panOffset: 0,
  cardTitle: '🔥 EPIC STREAM MOMENT',
  cardSubtitle: 'Follow for daily live clips ➔ @felipegardenghi',
  exportResolution: { width: 1080, height: 1920 },
  fps: 30,
};

/**
 * Renders a single frame of the 16:9 source video into 9:16 vertical canvas.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  config: FramerConfig,
  targetWidth: number,
  targetHeight: number
): void {
  if (video.readyState < 2) return; // HAVE_CURRENT_DATA

  const vWidth = video.videoWidth || 1920;
  const vHeight = video.videoHeight || 1080;

  ctx.save();
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  switch (config.layout) {
    case 'split-streamer':
      renderSplitStreamer(ctx, video, config, vWidth, vHeight, targetWidth, targetHeight);
      break;

    case 'blur-fill':
      renderBlurFill(ctx, video, config, vWidth, vHeight, targetWidth, targetHeight);
      break;

    case 'centered-card':
      renderCenteredCard(ctx, video, config, vWidth, vHeight, targetWidth, targetHeight);
      break;

    case 'auto-pan':
      renderAutoPan(ctx, video, config, vWidth, vHeight, targetWidth, targetHeight);
      break;
  }

  ctx.restore();
}

/**
 * Split Screen: Facecam Top (e.g. 38%) + Gameplay Bottom (62%)
 */
function renderSplitStreamer(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  config: FramerConfig,
  vWidth: number,
  vHeight: number,
  tWidth: number,
  tHeight: number
) {
  const topH = Math.round(tHeight * config.facecamHeightRatio);
  const bottomH = tHeight - topH;

  // 1. Draw Top Facecam Crop
  const fcRoi = config.facecamRoi;
  const sx = Math.max(0, Math.min(vWidth, fcRoi.x * vWidth));
  const sy = Math.max(0, Math.min(vHeight, fcRoi.y * vHeight));
  const sWidth = Math.max(10, Math.min(vWidth - sx, fcRoi.width * vWidth));
  const sHeight = Math.max(10, Math.min(vHeight - sy, fcRoi.height * vHeight));

  // Cover destination top
  drawImageCover(ctx, video, sx, sy, sWidth, sHeight, 0, 0, tWidth, topH);

  // 2. Divider Line with Neon Glow
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, topH - 3, tWidth, 6);
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 10;
  ctx.fillRect(0, topH - 1, tWidth, 2);
  ctx.shadowBlur = 0;

  // 3. Draw Bottom Gameplay Crop
  const gpRoi = config.gameplayRoi;
  const gsx = Math.max(0, Math.min(vWidth, gpRoi.x * vWidth));
  const gsy = Math.max(0, Math.min(vHeight, gpRoi.y * vHeight));
  const gsWidth = Math.max(10, Math.min(vWidth - gsx, gpRoi.width * vWidth));
  const gsHeight = Math.max(10, Math.min(vHeight - gsy, gpRoi.height * vHeight));

  drawImageCover(ctx, video, gsx, gsy, gsWidth, gsHeight, 0, topH, tWidth, bottomH);
}

/**
 * Blur Fill: Blurred scaled video background + crisp 16:9 centered in 9:16
 */
function renderBlurFill(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  config: FramerConfig,
  vWidth: number,
  vHeight: number,
  tWidth: number,
  tHeight: number
) {
  // 1. Blurred background
  ctx.save();
  ctx.filter = `blur(${config.blurIntensity}px) brightness(0.65)`;
  // Scale video to cover full 9:16 frame
  drawImageCover(ctx, video, 0, 0, vWidth, vHeight, -20, -20, tWidth + 40, tHeight + 40);
  ctx.restore();

  // 2. Crisp foreground 16:9 video centered vertically
  const fgWidth = tWidth;
  const fgHeight = Math.round(tWidth * (vHeight / vWidth));
  const fgY = Math.round((tHeight - fgHeight) / 2);

  // Outer shadow for cinematic pop
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(video, 0, 0, vWidth, vHeight, 0, fgY, fgWidth, fgHeight);
  ctx.restore();
}

/**
 * Centered Card with Top Header Title and Bottom CTA Subtitle
 */
function renderCenteredCard(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  config: FramerConfig,
  vWidth: number,
  vHeight: number,
  tWidth: number,
  tHeight: number
) {
  // Dark luxury gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, tHeight);
  bgGrad.addColorStop(0, '#09090b');
  bgGrad.addColorStop(0.5, '#18181b');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, tWidth, tHeight);

  // Video in the middle
  const fgWidth = tWidth;
  const fgHeight = Math.round(tWidth * (vHeight / vWidth));
  const fgY = Math.round((tHeight - fgHeight) / 2);

  ctx.drawImage(video, 0, 0, vWidth, vHeight, 0, fgY, fgWidth, fgHeight);

  // Top Card / Title
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(tWidth * 0.045)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(config.cardTitle, tWidth / 2, fgY - 60);

  // Subtitle / CTA
  ctx.fillStyle = '#10b981';
  ctx.font = `600 ${Math.round(tWidth * 0.032)}px sans-serif`;
  ctx.fillText(config.cardSubtitle, tWidth / 2, fgY + fgHeight + 70);
}

/**
 * Auto-Pan: 9:16 window sliding across 16:9
 */
function renderAutoPan(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  config: FramerConfig,
  vWidth: number,
  vHeight: number,
  tWidth: number,
  tHeight: number
) {
  const targetAspect = 9 / 16;
  const cropWidth = vHeight * targetAspect;
  const maxOffset = (vWidth - cropWidth) / 2;
  const panPx = config.panOffset * maxOffset;
  const sx = (vWidth - cropWidth) / 2 + panPx;

  ctx.drawImage(
    video,
    Math.max(0, Math.min(vWidth - cropWidth, sx)),
    0,
    cropWidth,
    vHeight,
    0,
    0,
    tWidth,
    tHeight
  );
}

/**
 * Helper: Draws image cover-fit inside destination rectangle
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLVideoElement,
  sx: number,
  sy: number,
  sWidth: number,
  sHeight: number,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) {
  const sAspect = sWidth / sHeight;
  const dAspect = dWidth / dHeight;

  let renderSx = sx;
  let renderSy = sy;
  let renderSw = sWidth;
  let renderSh = sHeight;

  if (sAspect > dAspect) {
    // Source is wider than dest
    renderSw = sHeight * dAspect;
    renderSx = sx + (sWidth - renderSw) / 2;
  } else {
    // Source is taller than dest
    renderSh = sWidth / dAspect;
    renderSy = sy + (sHeight - renderSh) / 2;
  }

  ctx.drawImage(image, renderSx, renderSy, renderSw, renderSh, dx, dy, dWidth, dHeight);
}
