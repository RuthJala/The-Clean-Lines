import {useEffect, useRef} from 'react';

// Complete 33.1-second walkthrough sampled at 20fps, eight frames per WebP sheet.
const LAST = 661, PER = 8, SHEETS = 83;

export default function ScrollFilm({progress, enabled, onStatus}) {
  const canvas = useRef(null), state = useRef({progress, enabled});
  state.current = {progress, enabled};

  useEffect(() => {
    const el = canvas.current;
    const ctx = el.getContext('2d', {alpha:false, desynchronized:true});
    const mobile = matchMedia('(max-width:700px)').matches;

    // Use the same higher-resolution sequence on desktop and mobile. Mobile should crop,
    // not receive a visibly softer source.
    const variant = 'desktop';
    const sourceWidth = 1280, sourceHeight = 720;
    const cache = new Map(), pending = new Map(), failed = new Map();
    const MAX_CACHE = mobile ? 12 : 16;
    const MAX_PENDING = mobile ? 4 : 6;
    let stopped = false, position = 0, drawn = -1, raf, lastTime = 0, status = '';

    const report = value => {
      if (value !== status) {
        status = value;
        onStatus(value);
      }
    };

    const desired = () => state.current.enabled ? state.current.progress * LAST : position;
    const sheetOf = frame => Math.max(0, Math.min(SHEETS - 1, Math.floor(Math.round(frame) / PER)));

    const prioritySheets = () => {
      const current = sheetOf(position);
      const target = sheetOf(desired());
      const dir = target >= current ? 1 : -1;
      const ordered = [
        target,
        current,
        target + dir,
        target + dir * 2,
        current + dir,
        target - dir,
        current - dir,
        target + dir * 3,
        current + dir * 2,
      ];
      return [...new Set(ordered)].filter(i => i >= 0 && i < SHEETS);
    };

    const keepSheets = () => {
      const current = sheetOf(position);
      const target = sheetOf(desired());
      const keep = new Set(prioritySheets());
      for (let d = -3; d <= 3; d++) {
        if (current + d >= 0 && current + d < SHEETS) keep.add(current + d);
        if (target + d >= 0 && target + d < SHEETS) keep.add(target + d);
      }
      return keep;
    };

    const prune = () => {
      if (cache.size <= MAX_CACHE) return;
      const keep = keepSheets();
      for (const [i, bitmap] of cache) {
        if (cache.size <= MAX_CACHE) break;
        if (!keep.has(i)) {
          bitmap.close?.();
          cache.delete(i);
        }
      }
    };

    const load = async i => {
      if (i < 0 || i >= SHEETS || cache.has(i) || pending.has(i) || (failed.get(i) || 0) > Date.now()) return;
      const controller = new AbortController();
      pending.set(i, controller);
      try {
        const response = await fetch(`assets/walkthrough/${variant}/sheet-${String(i).padStart(3,'0')}.webp`, {
          signal:controller.signal,
          cache:'force-cache',
        });
        if (!response.ok) throw new Error('Frame download failed');
        const blob = await response.blob();
        let bitmap;
        if (typeof createImageBitmap === 'function') {
          bitmap = await createImageBitmap(blob);
        } else {
          const url = URL.createObjectURL(blob);
          try {
            bitmap = new Image();
            bitmap.decoding = 'async';
            bitmap.src = url;
            await bitmap.decode();
          } finally {
            URL.revokeObjectURL(url);
          }
        }
        if (stopped) bitmap.close?.();
        else {
          cache.set(i, bitmap);
          failed.delete(i);
          prune();
        }
      } catch (error) {
        if (!stopped && error.name !== 'AbortError') failed.set(i, Date.now() + 2800);
      } finally {
        pending.delete(i);
      }
    };

    const draw = frame => {
      const bitmap = cache.get(sheetOf(frame));
      if (!bitmap) return false;
      const cell = frame % PER;
      const scale = Math.max(el.width / sourceWidth, el.height / sourceHeight);
      const outW = sourceWidth * scale, outH = sourceHeight * scale;
      ctx.drawImage(
        bitmap,
        (cell % 2) * sourceWidth,
        Math.floor(cell / 2) * sourceHeight,
        sourceWidth,
        sourceHeight,
        (el.width - outW) / 2,
        (el.height - outH) / 2,
        outW,
        outH,
      );
      drawn = frame;
      el.dataset.frame = String(frame);
      el.style.opacity = '1';
      return true;
    };

    const resize = () => {
      const r = el.getBoundingClientRect();
      // Keep enough pixel density for retina mobile without exploding canvas memory.
      const ratio = Math.min(devicePixelRatio || 1, mobile ? 2 : 1.75);
      el.width = Math.max(1, Math.round(r.width * ratio));
      el.height = Math.max(1, Math.round(r.height * ratio));
      drawn = -1;
    };

    const tick = time => {
      if (stopped) return;
      const dt = Math.min(42, time - (lastTime || time));
      lastTime = time;
      const target = desired();

      // Quick enough to feel attached to the wheel/finger, soft enough to remove judder.
      const smoothingMs = mobile ? 58 : 64;
      let next = position + (target - position) * (1 - Math.exp(-dt / smoothingMs));
      if (Math.abs(next - target) < .08) next = target;

      const nextSheet = sheetOf(next);
      const targetSheet = sheetOf(target);
      if (cache.has(nextSheet)) {
        position = next;
      } else if (cache.has(targetSheet) && Math.abs(target - position) > PER * 1.5) {
        position = target;
      }

      const frame = Math.max(0, Math.min(LAST, Math.round(position)));
      if (drawn !== frame) draw(frame);

      report(failed.has(targetSheet) ? 'retrying' : drawn < 0 || !cache.has(targetSheet) ? 'loading' : 'ready');

      for (const i of prioritySheets()) {
        if (pending.size >= MAX_PENDING) break;
        void load(i);
      }
      prune();
      raf = requestAnimationFrame(tick);
    };

    el.dataset.sequence = variant;
    resize();
    addEventListener('resize', resize, {passive:true});

    // Prime the first frames immediately so the transition from poster is quick.
    void load(0);
    void load(1);
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      for (const controller of pending.values()) controller.abort();
      for (const bitmap of cache.values()) bitmap.close?.();
    };
  }, [onStatus]);

  return <canvas ref={canvas} className="walkthrough-canvas" role="img" aria-label="The Clean Lines villa interior walkthrough, controlled by scrolling"/>;
}
