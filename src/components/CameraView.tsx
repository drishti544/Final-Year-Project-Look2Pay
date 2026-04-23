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
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm text-white p-8 text-center z-50">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Camera className="w-8 h-8" />
          </div>
          
          <h4 className="text-lg font-bold mb-3 uppercase tracking-tight">Camera Access Required</h4>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-[280px]">
            To enable biometric payments, please click the <strong>camera icon</strong> in your browser address bar and select <strong>"Allow"</strong>.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-[240px]">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Check browser site settings
            </p>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current && onVideoLoad?.(videoRef.current)}
            className="absolute inset-0 w-full h-full object-cover object-center scale-x-[-1]"
          />
          <div className="absolute inset-0 ring-1 ring-white/10" />
          {overlay}
        </>
      )}
    </div>
  );
}
