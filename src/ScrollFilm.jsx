import {useEffect, useRef} from 'react';

// All 33.1 seconds, sampled at 20 fps. Eight frames per WebP sheet.
const LAST = 661, PER = 8, SHEETS = 83;
export default function ScrollFilm({progress, enabled, onStatus}) {
  const canvas = useRef(null), state = useRef({progress, enabled});
  state.current = {progress, enabled};
  useEffect(() => {
    const el = canvas.current, ctx = el.getContext('2d', {alpha: false});
    const mobile = matchMedia('(max-width:700px)').matches;
    const variant = mobile ? 'mobile' : 'desktop';
    const width = mobile ? 768 : 1280, height = mobile ? 432 : 720;
    const cache = new Map(), pending = new Map(), failed = new Map();
    let stopped = false, position = 0, drawn = -1, raf, lastTime = 0, status = '';
    const report = value => { if (value !== status) { status = value; onStatus(value); } };
    const desired = () => state.current.enabled ? state.current.progress * LAST : position;
    const wanted = () => {
      const current = Math.floor(Math.round(position) / PER);
      const target = Math.floor(Math.round(desired()) / PER);
      const dir = target >= current ? 1 : -1;
      return [...new Set([target, current, current + dir, target + dir, current - dir])].filter(i => i >= 0 && i < SHEETS);
    };
    const prune = () => {
      const keep = wanted();
      for (const [i, bitmap] of cache) if (!keep.includes(i)) { bitmap.close?.(); cache.delete(i); }
    };
    const load = async i => {
      if (cache.has(i) || pending.has(i) || (failed.get(i) || 0) > Date.now()) return;
      const controller = new AbortController(); pending.set(i, controller);
      try {
        const response = await fetch(`assets/walkthrough/${variant}/sheet-${String(i).padStart(3,'0')}.webp`, {signal:controller.signal});
        if (!response.ok) throw new Error('Frame download failed');
        const blob = await response.blob();
        let bitmap;
        if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(blob);
        else {
          const url = URL.createObjectURL(blob);
          try { bitmap = new Image(); bitmap.src = url; await bitmap.decode(); }
          finally { URL.revokeObjectURL(url); }
        }
        if (stopped) bitmap.close?.();
        else { cache.set(i, bitmap); failed.delete(i); prune(); }
      } catch (error) {
        if (!stopped && error.name !== 'AbortError') failed.set(i, Date.now() + 5000);
      } finally { pending.delete(i); }
    };
    const draw = frame => {
      const bitmap = cache.get(Math.floor(frame / PER));
      if (!bitmap) return false;
      const cell = frame % PER, scale = Math.max(el.width / width, el.height / height);
      ctx.drawImage(bitmap, (cell % 2) * width, Math.floor(cell / 2) * height, width, height,
        (el.width - width * scale) / 2, (el.height - height * scale) / 2, width * scale, height * scale);
      drawn = frame; el.dataset.frame = String(frame); el.style.opacity = '1';
      return true;
    };
    const resize = () => {
      const r = el.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 1.5);
      el.width = Math.round(r.width * ratio); el.height = Math.round(r.height * ratio); drawn = -1;
    };
    const tick = time => {
      if (stopped) return;
      const dt = Math.min(50, time - (lastTime || time)); lastTime = time;
      const target = desired();
      let next = position + (target - position) * (1 - Math.exp(-dt / 85));
      if (Math.abs(next - target) < .1) next = target;
      if (cache.has(Math.floor(Math.round(next) / PER))) position = next;
      else if (Math.abs(target - position) > PER && cache.has(Math.floor(Math.round(target) / PER))) position = target;
      const frame = Math.round(position);
      if (drawn !== frame) draw(frame);
      const targetSheet = Math.floor(Math.round(target) / PER);
      report(failed.has(targetSheet) ? 'retrying' : drawn < 0 || !cache.has(targetSheet) ? 'loading' : 'ready');
      for (const i of wanted()) { if (pending.size >= 3) break; void load(i); }
      prune(); raf = requestAnimationFrame(tick);
    };
    el.dataset.sequence = variant; resize(); addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); removeEventListener('resize', resize); for (const c of pending.values()) c.abort(); for (const b of cache.values()) b.close?.(); };
  }, [onStatus]);
  return <canvas ref={canvas} className="walkthrough-canvas" role="img" aria-label="The Clean Lines villa interior walkthrough, controlled by scrolling"/>;
}
