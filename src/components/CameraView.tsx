import { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface CameraViewProps {
  onVideoLoad?: (video: HTMLVideoElement) => void;
  className?: string;
  overlay?: React.ReactNode;
}

export default function CameraView({ onVideoLoad, className = '', overlay }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions.');
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-neutral-900 aspect-video ${className}`}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
          <Camera className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current && onVideoLoad?.(videoRef.current)}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute inset-0 ring-1 ring-white/10" />
          {overlay}
        </>
      )}
    </div>
  );
}
