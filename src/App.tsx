import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  Download,
  Sliders,
  Scissors,
  Video,
  Layers
} from 'lucide-react';
import { FramerConfig, LayoutMode, NormalizedRect } from './types';
import { DEFAULT_FRAMER_CONFIG } from './core/framer-engine';
import { exportVerticalVideo, downloadExportedVideo, ExportProgress } from './core/export-recorder';
import { createGardenCutExport, downloadJsonFile } from './core/gardencut-export';
import { SourceVideoPlayer } from './components/SourceVideoPlayer';
import { VerticalCanvasPreview } from './components/VerticalCanvasPreview';
import { LayoutSelector } from './components/LayoutSelector';

export const App: React.FC = () => {
  const [config, setConfig] = useState<FramerConfig>(DEFAULT_FRAMER_CONFIG);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('stream_recording.mp4');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate synthetic demo video pattern if no user file is selected
  useEffect(() => {
    if (!videoSrc) {
      const demoCanvas = document.createElement('canvas');
      demoCanvas.width = 640;
      demoCanvas.height = 360;
      const dCtx = demoCanvas.getContext('2d');
      if (!dCtx) return;

      let frame = 0;
      const stream = demoCanvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoSrc(url);
      };

      mediaRecorder.start();

      const drawLoop = setInterval(() => {
        frame++;
        // Background gameplay simulation
        dCtx.fillStyle = '#0f172a';
        dCtx.fillRect(0, 0, 640, 360);

        // Moving gameplay ball
        const x = (frame * 4) % 640;
        const y = 180 + Math.sin(frame * 0.1) * 80;
        dCtx.fillStyle = '#06b6d4';
        dCtx.beginPath();
        dCtx.arc(x, y, 24, 0, Math.PI * 2);
        dCtx.fill();

        // Simulated streamer webcam box in top-left
        dCtx.fillStyle = '#1e1b4b';
        dCtx.fillRect(20, 20, 180, 130);
        dCtx.strokeStyle = '#a855f7';
        dCtx.lineWidth = 3;
        dCtx.strokeRect(20, 20, 180, 130);

        dCtx.fillStyle = '#f43f5e';
        dCtx.beginPath();
        dCtx.arc(110, 75, 30, 0, Math.PI * 2);
        dCtx.fill();

        dCtx.fillStyle = '#ffffff';
        dCtx.font = 'bold 12px sans-serif';
        dCtx.fillText('STREAMER CAM', 55, 125);
        dCtx.fillText('GAMEPLAY FEED', 340, 50);

        if (frame >= 90) {
          clearInterval(drawLoop);
          mediaRecorder.stop();
        }
      }, 33);
    }
  }, [videoSrc]);

  // Video time synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 10);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoFileName(file.name);
      setIsPlaying(false);
    }
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    try {
      setIsExporting(true);
      const blob = await exportVerticalVideo(canvas, video, (progress) => {
        setExportProgress(progress);
      });
      downloadExportedVideo(blob, `${videoFileName.replace(/\.[^/.]+$/, '')}_9x16.webm`);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(null);
      }, 1500);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const handleExportGardenCut = () => {
    const exportData = createGardenCutExport(videoFileName, duration, config);
    downloadJsonFile(exportData, `${videoFileName.replace(/\.[^/.]+$/, '')}_gardencut.json`);
  };

  const updateConfig = <K extends keyof FramerConfig>(key: K, value: FramerConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateFacecamRoi = (roi: NormalizedRect) => {
    setConfig((prev) => ({ ...prev, facecamRoi: roi }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-950/40">
            🎬
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Garden Auto-Framer
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                16:9 ➔ 9:16
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Smart Vertical Re-Framer for Shorts, Reels & TikTok (Free & Client-Side)
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Upload 16:9 Video
          </button>

          <button
            onClick={handleExportGardenCut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-xs bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 transition"
            title="Export project configuration for GardenCut timeline"
          >
            <Scissors className="w-4 h-4" />
            GardenCut
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export 9:16 Video'}
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Player, Controls, Layout Settings */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Layout Mode Selector */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
            <h2 className="text-xs font-mono uppercase text-zinc-400 font-semibold tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              1. Select Vertical Framing Layout
            </h2>
            <LayoutSelector
              currentLayout={config.layout}
              onSelect={(layout: LayoutMode) => updateConfig('layout', layout)}
            />
          </div>

          {/* Source 16:9 Video Player */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md flex flex-col gap-3">
            <SourceVideoPlayer
              videoRef={videoRef}
              videoSrc={videoSrc}
              facecamRoi={config.facecamRoi}
              onUpdateFacecamRoi={updateFacecamRoi}
              showOverlay={config.layout === 'split-streamer'}
            />

            {/* Playback Controls & Timeline Scrub */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shrink-0 shadow-md"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 10}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>{duration.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Layout Controls */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md flex flex-col gap-4">
            <h2 className="text-xs font-mono uppercase text-zinc-400 font-semibold tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              2. Layout Customization Parameters
            </h2>

            {config.layout === 'split-streamer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Facecam Height Split</span>
                    <span className="font-mono text-emerald-400">{Math.round(config.facecamHeightRatio * 100)}% Top</span>
                  </div>
                  <input
                    type="range"
                    min={0.25}
                    max={0.55}
                    step={0.01}
                    value={config.facecamHeightRatio}
                    onChange={(e) => updateConfig('facecamHeightRatio', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg accent-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-400">Controls the proportion of the vertical frame dedicated to facecam</span>
                </div>

                <div className="flex flex-col justify-center gap-2 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                  <span className="text-xs font-medium text-zinc-300">Facecam Region (ROI)</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateFacecamRoi({ x: 0.02, y: 0.05, width: 0.32, height: 0.42 })}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs text-zinc-200 transition"
                    >
                      Top-Left
                    </button>
                    <button
                      onClick={() => updateFacecamRoi({ x: 0.66, y: 0.05, width: 0.32, height: 0.42 })}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs text-zinc-200 transition"
                    >
                      Top-Right
                    </button>
                    <button
                      onClick={() => updateFacecamRoi({ x: 0.34, y: 0.05, width: 0.32, height: 0.42 })}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs text-zinc-200 transition"
                    >
                      Center
                    </button>
                  </div>
                </div>
              </div>
            )}

            {config.layout === 'blur-fill' && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                <div className="flex justify-between text-xs font-medium">
                  <span>Background Blur Radius</span>
                  <span className="font-mono text-cyan-400">{config.blurIntensity}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={2}
                  value={config.blurIntensity}
                  onChange={(e) => updateConfig('blurIntensity', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg accent-cyan-500"
                />
              </div>
            )}

            {config.layout === 'centered-card' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-300 font-medium">Header Hook Text</label>
                  <input
                    type="text"
                    value={config.cardTitle}
                    onChange={(e) => updateConfig('cardTitle', e.target.value)}
                    className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-300 font-medium">Subtitle / Call-To-Action</label>
                  <input
                    type="text"
                    value={config.cardSubtitle}
                    onChange={(e) => updateConfig('cardSubtitle', e.target.value)}
                    className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {config.layout === 'auto-pan' && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                <div className="flex justify-between text-xs font-medium">
                  <span>Horizontal Pan Window Offset</span>
                  <span className="font-mono text-amber-400">{config.panOffset.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={-1.0}
                  max={1.0}
                  step={0.05}
                  value={config.panOffset}
                  onChange={(e) => updateConfig('panOffset', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg accent-amber-500"
                />
              </div>
            )}

          </div>

        </div>

        {/* Right Column: 9:16 Canvas Preview & Ecosystem Integration */}
        <div className="lg:col-span-4 flex flex-col items-center gap-6">
          
          <VerticalCanvasPreview
            canvasRef={canvasRef}
            videoRef={videoRef}
            config={config}
            isPlaying={isPlaying}
          />

          {/* Export Progress Modal Overlay or Card */}
          {isExporting && exportProgress && (
            <div className="w-full p-4 rounded-2xl bg-zinc-900 border border-emerald-500/50 shadow-xl">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span className="text-emerald-400 font-semibold">EXPORTING 9:16 VIDEO</span>
                <span>{exportProgress.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  style={{ width: `${exportProgress.percentage}%` }}
                  className="h-full bg-emerald-500 transition-all duration-150"
                />
              </div>
              <div className="text-[11px] text-zinc-400 font-mono text-right">
                {exportProgress.currentSec.toFixed(1)}s / {exportProgress.totalSec.toFixed(1)}s
              </div>
            </div>
          )}

          {/* GC Studio Ecosystem Card */}
          <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 text-xs">
            <h3 className="font-semibold text-zinc-200 flex items-center gap-1.5 mb-2">
              <Video className="w-4 h-4 text-cyan-400" />
              GC Studio Synergy
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              Export high-bitrate vertical video directly for TikTok/Shorts or generate timeline clip descriptor for:
            </p>
            <ul className="mt-2 space-y-1 text-zinc-300 font-mono text-[11px]">
              <li>• <span className="text-emerald-400">GardenCut</span>: multi-track video timeline</li>
              <li>• <span className="text-cyan-400">Garden Subtitle</span>: kinetic animated subtitles</li>
            </ul>
          </div>

        </div>

      </main>
    </div>
  );
};

export default App;
