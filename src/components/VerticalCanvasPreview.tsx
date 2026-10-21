import React, { useEffect } from 'react';
import { FramerConfig } from '../types';
import { renderFrame } from '../core/framer-engine';

interface VerticalCanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  config: FramerConfig;
  isPlaying: boolean;
}

export const VerticalCanvasPreview: React.FC<VerticalCanvasPreviewProps> = ({
  canvasRef,
  videoRef,
  config,
  isPlaying,
}) => {
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderFrame(ctx, video, config, canvas.width, canvas.height);
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(loop);
      }
    };

    // Draw once immediately
    loop();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [canvasRef, videoRef, config, isPlaying]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full max-w-[280px] text-xs font-mono text-zinc-400">
        <span className="text-cyan-400 font-semibold">9:16 VERTICAL OUTPUT</span>
        <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px]">Shorts/Reels</span>
      </div>

      <div className="relative w-full max-w-[280px] aspect-[9/16] bg-zinc-950 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl shadow-emerald-950/20">
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          className="w-full h-full object-contain block bg-zinc-950"
        />
      </div>
    </div>
  );
};
