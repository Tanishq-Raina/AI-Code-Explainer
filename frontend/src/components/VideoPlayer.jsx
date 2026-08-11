import { useState, useRef, useEffect, useCallback } from "react";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const seekBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const containerRef = useRef(null);
  const hideControlsTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // ─── Video event handlers ────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(video.currentTime);
    };
    const onLoadedMetadata = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("ended", onEnded);
    };
  }, [isSeeking]);

  // ─── Fullscreen change listener ──────────────────────────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // ─── Auto-hide controls ──────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    } else {
      resetHideTimer();
    }
  }, [isPlaying, resetHideTimer]);

  // ─── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-5);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(5);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(-0.1);
          break;
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── Controls ────────────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const changeVolume = (delta) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.min(1, Math.max(0, video.volume + delta));
    video.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(
      duration,
      Math.max(0, video.currentTime + seconds)
    );
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // ─── Seek bar interaction ────────────────────────────────────
  const handleSeekStart = (e) => {
    setIsSeeking(true);
    updateSeekPosition(e);
    window.addEventListener("mousemove", handleSeekMove);
    window.addEventListener("mouseup", handleSeekEnd);
  };

  const handleSeekMove = (e) => {
    updateSeekPosition(e);
  };

  const handleSeekEnd = (e) => {
    updateSeekPosition(e);
    setIsSeeking(false);
    window.removeEventListener("mousemove", handleSeekMove);
    window.removeEventListener("mouseup", handleSeekEnd);
  };

  const updateSeekPosition = (e) => {
    const bar = seekBarRef.current;
    const video = videoRef.current;
    if (!bar || !video) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // ─── Volume bar interaction ──────────────────────────────────
  const handleVolumeChange = (e) => {
    const bar = volumeBarRef.current;
    const video = videoRef.current;
    if (!bar || !video) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.volume = pct;
    setVolume(pct);
    if (pct > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeLevel = isMuted ? 0 : volume;

  return (
    <div
      className={`vp-container ${isFullscreen ? "vp-container--fullscreen" : ""}`}
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="vp-video"
        src={src}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="vp-buffering">
          <div className="vp-buffering-spinner" />
        </div>
      )}

      {/* Play/Pause overlay on click */}
      {!isPlaying && !isBuffering && (
        <button className="vp-play-overlay" onClick={togglePlay} aria-label="Play">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </button>
      )}

      {/* Controls bar */}
      <div className={`vp-controls ${showControls ? "vp-controls--visible" : ""}`}>
        {/* Seek bar */}
        <div
          className="vp-seekbar"
          ref={seekBarRef}
          onMouseDown={handleSeekStart}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div className="vp-seekbar__track">
            <div
              className="vp-seekbar__fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="vp-seekbar__thumb"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom controls row */}
        <div className="vp-controls-row">
          {/* Left: play, skip, volume, time */}
          <div className="vp-controls-left">
            <button
              className="vp-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>

            <button className="vp-btn" onClick={() => skip(-10)} aria-label="Rewind 10s">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6" />
              </svg>
            </button>

            <button className="vp-btn" onClick={() => skip(10)} aria-label="Forward 10s">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5V1l5 5-5 5V7a6 6 0 1 0 6 6" />
              </svg>
            </button>

            {/* Volume */}
            <div
              className="vp-volume-group"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button className="vp-btn" onClick={toggleMute} aria-label="Mute">
                {volumeLevel === 0 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" />
                    <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : volumeLevel < 0.5 ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>

              <div className={`vp-volume-slider-wrap ${showVolumeSlider ? "vp-volume-slider-wrap--visible" : ""}`}>
                <div
                  className="vp-volume-slider"
                  ref={volumeBarRef}
                  onMouseDown={handleVolumeChange}
                  role="slider"
                  aria-label="Volume"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(volumeLevel * 100)}
                >
                  <div className="vp-volume-slider__track">
                    <div
                      className="vp-volume-slider__fill"
                      style={{ width: `${volumeLevel * 100}%` }}
                    />
                    <div
                      className="vp-volume-slider__thumb"
                      style={{ left: `${volumeLevel * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Time display */}
            <span className="vp-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: fullscreen */}
          <div className="vp-controls-right">
            <button
              className="vp-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
