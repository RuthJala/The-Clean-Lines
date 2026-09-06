const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

let activeCleanup = null;
let initFrame = 0;

function startScrollScrub() {
  const journey = document.querySelector('.journey');
  const video = journey?.querySelector('video');
  if (!journey || !video) return false;

  if (activeCleanup) activeCleanup();

  // Disable the older React seek loop so only one scrubber controls currentTime.
  const legacyMotionButton = document.querySelector('.film-controls button');
  if (legacyMotionButton && /pause/i.test(legacyMotionButton.textContent || '')) {
    legacyMotionButton.click();
  }

  let desiredProgress = 0;
  let easedProgress = 0;
  let rafId = 0;
  let lastSeekAt = 0;
  let destroyed = false;

  const isMobile = matchMedia('(max-width: 700px)').matches;
  const seekInterval = isMobile ? 42 : 28;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateProgress = () => {
    const rect = journey.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    desiredProgress = clamp(-rect.top / scrollable);
  };

  const warmDecoder = async () => {
    if (reducedMotion || destroyed || video.readyState < 1) return;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    try {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') await playPromise;
      video.pause();
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(0.04, video.duration / 1000);
      }
    } catch {
      try {
        video.pause();
        video.currentTime = 0.001;
      } catch {
        // Some browsers only allow the first seek after metadata is fully available.
      }
    }
  };

  const tick = (now) => {
    if (destroyed) return;

    // A soft follow gives the Kage-like smooth scrub without making the timeline lag.
    easedProgress += (desiredProgress - easedProgress) * (isMobile ? 0.2 : 0.16);
    if (Math.abs(desiredProgress - easedProgress) < 0.00035) {
      easedProgress = desiredProgress;
    }

    if (!reducedMotion && video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
      const usableDuration = Math.max(0.001, video.duration - 1 / 30);
      const wantedTime = clamp(easedProgress) * usableDuration;
      const delta = wantedTime - video.currentTime;

      // Crucially, do not block while video.seeking. Newer seek requests are coalesced by
      // the browser, preventing the old "stuck on one frame" behaviour during scrolling.
      if (Math.abs(delta) > 0.012 && (now - lastSeekAt >= seekInterval || Math.abs(delta) > 0.7)) {
        try {
          video.currentTime = wantedTime;
          lastSeekAt = now;
        } catch {
          // Keep the animation loop alive; the next frame retries after media is ready.
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  const onLoadedMetadata = () => {
    updateProgress();
    easedProgress = desiredProgress;
    warmDecoder();
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  video.addEventListener('loadedmetadata', onLoadedMetadata);

  if (video.readyState >= 1) onLoadedMetadata();
  rafId = requestAnimationFrame(tick);

  activeCleanup = () => {
    destroyed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', updateProgress);
    window.removeEventListener('resize', updateProgress);
    video.removeEventListener('loadedmetadata', onLoadedMetadata);
    activeCleanup = null;
  };

  return true;
}

function scheduleInit() {
  cancelAnimationFrame(initFrame);
  initFrame = requestAnimationFrame(() => {
    if (!document.querySelector('.journey video')) {
      if (activeCleanup) activeCleanup();
      return;
    }
    if (!activeCleanup) startScrollScrub();
  });
}

const root = document.getElementById('root');
if (root) {
  const observer = new MutationObserver(scheduleInit);
  observer.observe(root, { childList: true, subtree: true });
}

window.addEventListener('hashchange', scheduleInit);
window.addEventListener('pageshow', scheduleInit);
scheduleInit();
