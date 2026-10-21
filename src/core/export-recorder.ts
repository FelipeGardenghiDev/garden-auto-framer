/**
 * Client-Side MediaRecorder for 9:16 Vertical Video Export.
 * 100% Free & Browser-Native (Zero Cloud / Zero Server).
 */

export interface ExportProgress {
  currentSec: number;
  totalSec: number;
  percentage: number;
  status: 'recording' | 'encoding' | 'completed' | 'error';
}

export async function exportVerticalVideo(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const fps = 30;
      const canvasStream = canvas.captureStream(fps);

      // Extract audio track if video has audio
      try {
        const videoStream = (video as unknown as { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream
          ? (video as unknown as { captureStream: () => MediaStream }).captureStream()
          : (video as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();

        if (videoStream) {
          const audioTracks = videoStream.getAudioTracks();
          if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      } catch (audioErr) {
        console.warn('Audio track capture bypassed or not supported:', audioErr);
      }

      // Check supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = 'video/webm';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 6000000, // 6 Mbps high quality
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: selectedMime });
        if (onProgress) {
          onProgress({
            currentSec: video.duration || 1,
            totalSec: video.duration || 1,
            percentage: 100,
            status: 'completed',
          });
        }
        resolve(finalBlob);
      };

      recorder.onerror = (err) => {
        reject(err);
      };

      // Rewind video and play for recording
      const originalTime = video.currentTime;
      video.currentTime = 0;
      recorder.start(100);

      const handleTimeUpdate = () => {
        const current = video.currentTime;
        const total = video.duration || 1;
        const percentage = Math.min(100, Math.round((current / total) * 100));

        if (onProgress) {
          onProgress({
            currentSec: current,
            totalSec: total,
            percentage,
            status: 'recording',
          });
        }
      };

      const handleEnded = () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleEnded);
        recorder.stop();
        video.currentTime = originalTime;
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleEnded);

      video.play().catch((err) => {
        recorder.stop();
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function downloadExportedVideo(blob: Blob, filename = 'garden_framer_clip.webm') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
