const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

let activeCleanup = null;
let initFrame = 0;

function startScrollScrub() {
  const journey = document.querySelector('.journey');
  const video = journey?.querySelector('video');
  if (!journey || !video) return false;

  if (activeCleanup) activeCleanup();

  // Stop the older React scrubber so only this queue controls video.currentTime.
  const legacyMotionButton = document.querySelector('.film-controls button');
  if (legacyMotionButton && /pause/i.test(legacyMotionButton.textContent || '')) {
    legacyMotionButton.click();
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let desiredProgress = 0;
  let desiredTime = 0;
  let seekScheduled = false;
  let seekInFlight = false;
  let destroyed = false;
  let frameId = 0;

  const computeProgress = () => {
    const rect = journey.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    desiredProgress = clamp(-rect.top / scrollable);

    if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
      desiredTime = desiredProgress * Math.max(0.001, video.duration - 1 / 30);
      scheduleSeek();
    }
  };

  const performSeek = () => {
    seekScheduled = false;
    if (destroyed || reducedMotion || video.readyState < 1 || !Number.isFinite(video.duration)) return;

    // Serialise seeks. If scrolling continues while one seek is decoding, seeked will
    // immediately jump to the newest desiredTime instead of starving the video renderer.
    if (seekInFlight || video.seeking) {
      seekScheduled = true;
      return;
    }

    const delta = desiredTime - video.currentTime;
    if (Math.abs(delta) < 0.012) return;

    try {
      seekInFlight = true;
      video.currentTime = desiredTime;
    } catch {
      seekInFlight = false;
    }
  };

  function scheduleSeek() {
    if (seekScheduled || destroyed) return;
    seekScheduled = true;
    frameId = requestAnimationFrame(performSeek);
  }

  const onSeeked = () => {
    seekInFlight = false;
    if (Math.abs(desiredTime - video.currentTime) > 0.012) scheduleSeek();
  };

  const onMetadata = async () => {
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    // Briefly warm the decoder. Muted inline playback is allowed on modern desktop/mobile.
    if (!reducedMotion) {
      try {
        await video.play();
        video.pause();
      } catch {
        video.pause();
      }
    }

    computeProgress();
  };

  video.pause();
  window.addEventListener('scroll', computeProgress, { passive: true });
  window.addEventListener('resize', computeProgress, { passive: true });
  video.addEventListener('seeked', onSeeked);
  video.addEventListener('loadedmetadata', onMetadata);

  if (video.readyState >= 1) onMetadata();
  else video.load();

  computeProgress();

  activeCleanup = () => {
    destroyed = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener('scroll', computeProgress);
    window.removeEventListener('resize', computeProgress);
    video.removeEventListener('seeked', onSeeked);
    video.removeEventListener('loadedmetadata', onMetadata);
    activeCleanup = null;
  };

  return true;
}

function scheduleInit() {
  cancelAnimationFrame(initFrame);
  initFrame = requestAnimationFrame(() => {
    const hasFilm = Boolean(document.querySelector('.journey video'));
    if (!hasFilm) {
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
