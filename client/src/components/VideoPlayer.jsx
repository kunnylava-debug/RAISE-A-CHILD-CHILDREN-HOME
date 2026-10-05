import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, ExternalLink 
} from 'lucide-react';

// Extract YouTube video ID from various YouTube URL formats (watch?v=, youtu.be/, embed/, shorts/)
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default function VideoPlayer({ videoUrl, posterUrl, title }) {
  const youtubeId = extractYouTubeId(videoUrl);
  const [ytPlaying, setYtPlaying] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [_isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // YOUTUBE VIDEO EMBED MODE (100% resilient, no 404 / decode errors)
  if (youtubeId) {
    const ytThumbnail = posterUrl || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

    return (
      <div 
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 group"
      >
        {!ytPlaying ? (
          <div 
            onClick={() => setYtPlaying(true)}
            className="relative cursor-pointer aspect-video min-h-[300px] sm:min-h-[460px] bg-slate-900 flex items-center justify-center overflow-hidden"
          >
            <img 
              src={ytThumbnail} 
              alt={title || "Hostel Video"}
              onError={(e) => {
                // Fallback to standard quality YouTube thumbnail if maxres is 404
                e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
              }}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center transition-opacity">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-200 border-4 border-white/80">
                <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-white ml-1.5" />
              </div>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-900/80 text-white text-xs sm:text-sm font-semibold border border-white/20 flex items-center space-x-2">
                <span>Click to Watch: {title || "Hostel Documentary"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full min-h-[300px] sm:min-h-[460px] bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={title || "YouTube video player"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 block"
            />
          </div>
        )}

        {/* Quick Footer for YouTube mode */}
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-semibold text-white truncate max-w-[220px] sm:max-w-md">{title || "Official Documentary"}</span>
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 font-medium transition"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // STANDARD DIRECT MP4 VIDEO PLAYER
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.5;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable full-screen mode:', err.message);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSec) => {
    if (isNaN(timeInSec)) return '00:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 group"
    >
      <video
        ref={videoRef}
        src={videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
        poster={posterUrl || "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80"}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="w-full h-auto max-h-[520px] object-cover cursor-pointer block"
        playsInline
      />

      {/* Big Center Play Overlay (when paused) */}
      {!isPlaying && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-200 border-4 border-white/80">
            <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-white ml-1.5" />
          </div>
          {title && (
            <div className="absolute bottom-6 left-6 right-6 text-white text-center">
              <span className="bg-slate-900/80 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/20">
                Click to Watch: {title}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Control Bar */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 transition-opacity duration-300 ${
        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Progress seek bar */}
        <div className="relative mb-3 flex items-center group/seek">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:h-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-emerald-400 transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-emerald-400 transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            <span className="text-slate-300 text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-emerald-400 transition"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
