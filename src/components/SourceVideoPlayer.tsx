import React, { useRef } from 'react';
import { NormalizedRect } from '../types';

interface SourceVideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc: string | null;
  facecamRoi: NormalizedRect;
  onUpdateFacecamRoi: (roi: NormalizedRect) => void;
  showOverlay: boolean;
}

export const SourceVideoPlayer: React.FC<SourceVideoPlayerProps> = ({
  videoRef,
  videoSrc,
  facecamRoi,
  onUpdateFacecamRoi,
  showOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Allow clicking on 16:9 video preview to reposition facecam ROI center
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showOverlay || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    // Center ROI around click
    const halfW = facecamRoi.width / 2;
    const halfH = facecamRoi.height / 2;
    const newX = Math.max(0, Math.min(1 - facecamRoi.width, clickX - halfW));
    const newY = Math.max(0, Math.min(1 - facecamRoi.height, clickY - halfH));

    onUpdateFacecamRoi({
      ...facecamRoi,
      x: Number(newX.toFixed(3)),
      y: Number(newY.toFixed(3)),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
        <span>ORIGINAL SOURCE (16:9)</span>
        {showOverlay && <span className="text-emerald-400">Click video to position Facecam box</span>}
      </div>

      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-inner cursor-crosshair group"
      >
        <video
          ref={videoRef}
          src={videoSrc || undefined}
          playsInline
          muted
          loop
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Facecam ROI Overlay */}
        {showOverlay && videoSrc && (
          <div
            style={{
              left: `${facecamRoi.x * 100}%`,
              top: `${facecamRoi.y * 100}%`,
              width: `${facecamRoi.width * 100}%`,
              height: `${facecamRoi.height * 100}%`,
            }}
            className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded shadow-lg pointer-events-none transition-all duration-75 flex flex-col justify-between p-1"
          >
            <span className="text-[10px] font-mono font-bold bg-emerald-600 text-zinc-950 px-1 rounded w-fit">
              FACECAM ROI
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
