let premiumObserver;
let premiumFrame = 0;

function addQuoteAction() {
  const section = document.querySelector('.after-film');
  if (!section || section.querySelector('.quote-pill')) return;
  const discover = section.querySelector('a.pill');
  if (!discover) return;

  let actions = section.querySelector('.after-film-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'after-film-actions';
    discover.before(actions);
    actions.appendChild(discover);
  }

  const quote = document.createElement('a');
  quote.className = 'pill quote-pill';
  quote.href = '#contact';
  quote.setAttribute('aria-label', 'Get a quote from The Clean Lines');
  quote.innerHTML = 'Get a quote <span aria-hidden="true">↗</span>';
  actions.appendChild(quote);
}

function upgradeFeaturedImages() {
  const studioImage = document.querySelector('.studio-grid > img');
  if (studioImage && studioImage.dataset.premiumImage !== 'true') {
    studioImage.dataset.premiumImage = 'true';
    studioImage.src = 'assets/projects/vol-2-05.webp';
    studioImage.alt = 'Contemporary villa interior by The Clean Lines';
    studioImage.loading = 'eager';
    studioImage.fetchPriority = 'high';
  }

  document.querySelectorAll('.work-bottom img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.includes('-sm.webp')) img.src = src.replace('-sm.webp', '.webp');
  });

  document.querySelectorAll('.work-stage img, .gallery img, .studio-grid img, .work-bottom img').forEach((img) => {
    img.decoding = 'async';
  });
}

function tagStudioPage() {
  const grid = document.querySelector('.studio-grid');
  const main = grid?.closest('main.page');
  if (main) main.classList.add('studio-page');
}

function applyPremiumRefresh() {
  addQuoteAction();
  upgradeFeaturedImages();
  tagStudioPage();
}

function schedulePremiumRefresh() {
  cancelAnimationFrame(premiumFrame);
  premiumFrame = requestAnimationFrame(applyPremiumRefresh);
}

const root = document.getElementById('root');
if (root) {
  premiumObserver = new MutationObserver(schedulePremiumRefresh);
  premiumObserver.observe(root, {childList: true, subtree: true});
}

window.addEventListener('hashchange', schedulePremiumRefresh);
window.addEventListener('pageshow', schedulePremiumRefresh);
schedulePremiumRefresh();
