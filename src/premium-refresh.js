let premiumObserver;
let premiumFrame = 0;
let filmCounterRaf = 0;

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

  discover.firstChild.textContent = 'Discover all volumes ';

  const quote = document.createElement('a');
  quote.className = 'pill quote-pill';
  quote.href = '#contact';
  quote.setAttribute('aria-label', 'Get a quote from The Clean Lines');
  quote.innerHTML = 'Get a quote <span aria-hidden="true">↗</span>';
  actions.appendChild(quote);
}

function addLuxuryWordmark() {
  document.querySelectorAll('.logo').forEach((logo) => {
    if (logo.querySelector('.logo-luxury-wordmark')) return;
    const img = logo.querySelector('img');
    if (!img) return;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    const wordmark = document.createElement('span');
    wordmark.className = 'logo-luxury-wordmark';
    wordmark.innerHTML = '<strong>THE CLEAN LINES</strong><small>INTERIOR DESIGN</small>';
    logo.appendChild(wordmark);
  });
}

function installFilmCounter() {
  const counter = document.querySelector('.progress-count');
  const canvas = document.querySelector('.walkthrough-canvas');
  if (!counter || !canvas || counter.dataset.frames150 === 'true') return;
  counter.dataset.frames150 = 'true';
  cancelAnimationFrame(filmCounterRaf);

  const tick = () => {
    if (!document.body.contains(counter) || !document.body.contains(canvas)) return;
    // Keep the internal 1000-frame high-resolution sequence for smoothness,
    // but present a calmer 150-step counter to the visitor.
    const internalFrame = Math.max(0, Math.min(999, Number(canvas.dataset.frame || 0)));
    const displayStep = Math.max(1, Math.min(150, Math.round((internalFrame / 999) * 149) + 1));
    counter.textContent = `${String(displayStep).padStart(3,'0')} / 150`;
    filmCounterRaf = requestAnimationFrame(tick);
  };
  filmCounterRaf = requestAnimationFrame(tick);
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

  document.querySelectorAll('.work-stage img, .gallery img, .studio-grid img, .work-bottom img, .lightbox img').forEach((img) => {
    img.decoding = 'async';
    img.draggable = false;
    img.setAttribute('sizes', '(max-width: 700px) 100vw, 90vw');
  });
}

function reorderServices() {
  document.querySelectorAll('.services-list').forEach((list) => {
    const articles = [...list.querySelectorAll('article')];
    if (articles.length !== 3 || list.dataset.premiumOrder === 'true') return;

    const byTitle = new Map(articles.map((article) => [article.querySelector('h2')?.textContent.trim().toLowerCase(), article]));
    const ordered = [
      byTitle.get('turnkey interiors'),
      byTitle.get('design consultation'),
      byTitle.get('3d visualisation'),
    ].filter(Boolean);

    if (ordered.length !== 3) return;
    ordered.forEach((article, index) => {
      const number = article.querySelector(':scope > span');
      if (number) number.textContent = `0${index + 1}`;
      list.appendChild(article);
    });
    list.dataset.premiumOrder = 'true';
  });

  document.querySelectorAll('select[name="service"]').forEach((select) => {
    if (select.dataset.premiumOrder === 'true') return;
    const options = [...select.options];
    const placeholder = options.find((o) => !o.value);
    const other = options.find((o) => /something else/i.test(o.textContent));
    const named = new Map(options.map((o) => [o.textContent.trim().toLowerCase(), o]));
    const ordered = [
      placeholder,
      named.get('turnkey interiors'),
      named.get('design consultation'),
      named.get('3d visualisation'),
      other,
    ].filter(Boolean);
    ordered.forEach((option) => select.appendChild(option));
    select.dataset.premiumOrder = 'true';
  });
}

function tagPages() {
  const studioGrid = document.querySelector('.studio-grid');
  const studioMain = studioGrid?.closest('main.page');
  if (studioMain) studioMain.classList.add('studio-page');

  const servicesPage = document.querySelector('.services-page');
  if (servicesPage) servicesPage.classList.add('premium-services-page');

  const workPage = document.querySelector('.work-page');
  if (workPage) workPage.classList.add('premium-work-page');
}

function applyPremiumRefresh() {
  addQuoteAction();
  addLuxuryWordmark();
  installFilmCounter();
  upgradeFeaturedImages();
  reorderServices();
  tagPages();
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
