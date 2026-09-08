const SWIPE_MIN = 46;
const SWIPE_RATIO = 1.2;
let gesture = null;
let blockWorkClickUntil = 0;

function pointFromTouchList(list) {
  const t = list && list[0];
  return t ? {x:t.clientX, y:t.clientY} : null;
}

function isHorizontalSwipe(dx, dy) {
  return Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO;
}

function changeWorkVolume(direction) {
  const buttons = [...document.querySelectorAll('.work-page .project-index button')];
  if (!buttons.length) return;
  let index = buttons.findIndex((b) => b.classList.contains('selected'));
  if (index < 0) index = 0;
  const next = (index + direction + buttons.length) % buttons.length;
  const stage = document.querySelector('.work-stage figure');
  if (stage) {
    stage.classList.remove('swipe-prev', 'swipe-next');
    void stage.offsetWidth;
    stage.classList.add(direction > 0 ? 'swipe-next' : 'swipe-prev');
    setTimeout(() => stage.classList.remove('swipe-prev', 'swipe-next'), 360);
  }
  buttons[next]?.click();
}

function changeLightboxImage(direction) {
  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;
  const buttons = [...lightbox.querySelectorAll('button')];
  const target = buttons.find((b) => direction > 0 ? /next/i.test(b.textContent || '') : /previous/i.test(b.textContent || ''));
  target?.click();
}

function startGesture(type, target, point) {
  if (!point) return;
  gesture = {type, target, x:point.x, y:point.y};
  target?.classList.add('is-swiping');
}

function endGesture(point) {
  if (!gesture || !point) {
    gesture = null;
    return;
  }
  const {type, target, x, y} = gesture;
  const dx = point.x - x;
  const dy = point.y - y;
  target?.classList.remove('is-swiping');
  gesture = null;

  if (!isHorizontalSwipe(dx, dy)) return;
  const direction = dx < 0 ? 1 : -1;

  if (type === 'work') {
    blockWorkClickUntil = Date.now() + 550;
    changeWorkVolume(direction);
  } else if (type === 'lightbox') {
    changeLightboxImage(direction);
  }
}

document.addEventListener('touchstart', (event) => {
  if (event.touches.length !== 1) return;
  const point = pointFromTouchList(event.touches);
  const lightbox = event.target.closest('.lightbox');
  if (lightbox) {
    startGesture('lightbox', lightbox, point);
    return;
  }
  const workLink = event.target.closest('.work-stage figure > a');
  if (workLink) startGesture('work', workLink, point);
}, {passive:true});

document.addEventListener('touchend', (event) => {
  const point = pointFromTouchList(event.changedTouches);
  endGesture(point);
}, {passive:true});

document.addEventListener('touchcancel', () => {
  gesture?.target?.classList.remove('is-swiping');
  gesture = null;
}, {passive:true});

// Prevent the project link from opening immediately after a horizontal swipe.
document.addEventListener('click', (event) => {
  if (Date.now() >= blockWorkClickUntil) return;
  const link = event.target.closest('.work-stage figure > a');
  if (!link) return;
  event.preventDefault();
  event.stopPropagation();
}, true);

// Mouse/trackpad users still get drag navigation without affecting normal clicks.
let pointerGesture = null;
document.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || event.button !== 0) return;
  const lightbox = event.target.closest('.lightbox');
  const workLink = event.target.closest('.work-stage figure > a');
  const target = lightbox || workLink;
  if (!target) return;
  pointerGesture = {
    type:lightbox ? 'lightbox' : 'work',
    target,
    x:event.clientX,
    y:event.clientY,
  };
}, true);

document.addEventListener('pointerup', (event) => {
  if (!pointerGesture || event.pointerType === 'touch') return;
  const dx = event.clientX - pointerGesture.x;
  const dy = event.clientY - pointerGesture.y;
  const type = pointerGesture.type;
  pointerGesture = null;
  if (!isHorizontalSwipe(dx, dy)) return;
  if (type === 'work') {
    blockWorkClickUntil = Date.now() + 350;
    changeWorkVolume(dx < 0 ? 1 : -1);
  } else {
    changeLightboxImage(dx < 0 ? 1 : -1);
  }
}, true);

// Keep image gestures predictable across browsers.
const interactionObserver = new MutationObserver(() => {
  document.querySelectorAll('.work-stage img, .gallery img, .lightbox img').forEach((img) => {
    img.draggable = false;
  });
});
const root = document.getElementById('root');
if (root) interactionObserver.observe(root, {childList:true, subtree:true});
