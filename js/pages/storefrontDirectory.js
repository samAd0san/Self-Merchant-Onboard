// ==========================================================================
// Page: Live Ordering - shop directory (prototype, standalone)
// Not wired into onboarding or the merchant dashboard, mock data only.
// ==========================================================================

import { initPageTransitions } from '../utils/pageTransition.js';

const MOCK_SHOPS = [
  {
    id: 'bageloloogy',
    name: 'bageloloogy',
    image: null,
    open: false,
    url: '#',
    cuisine: 'Bakery',
    distanceMiles: 0.8,
    etaMinutes: [10, 15],
    popularityRank: 2,
  },
  {
    id: 'poblanos-piri-piri',
    name: 'Poblanos Piri Piri',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80',
    open: true,
    url: 'storefront-menu.html',
    cuisine: 'Fried Chicken',
    distanceMiles: 1.2,
    etaMinutes: [15, 20],
    popularityRank: 1,
  },
];

const ARROW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

const SORT_OPTIONS = [
  { key: 'popular', label: 'Popular' },
  { key: 'fastest', label: 'Fastest' },
  { key: 'distance', label: 'Distance' },
];

let activeCuisine = 'All';
let activeSort = 'popular';

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function renderShopCard(shop) {
  const media = shop.image
    ? `<div class="shop-card__media" style="background-image:url('${shop.image}')"><span class="shop-card__name-overlay">${shop.name}</span></div>`
    : `<div class="shop-card__media shop-card__media--fallback"><span class="shop-card__initials">${initials(shop.name)}</span></div>`;

  const etaLabel = `${shop.etaMinutes[0]}-${shop.etaMinutes[1]} min`;
  const metaBadge = `<span class="shop-card__meta-badge">${shop.distanceMiles} mi &middot; ${etaLabel}</span>`;

  const inner = `
    ${media}
    <div class="shop-card__body">
      ${shop.image ? '' : `<h3 class="shop-card__title">${shop.name}</h3>`}
      <div class="shop-card__meta-row">
        <span class="shop-card__cuisine">${shop.cuisine}</span>
        ${metaBadge}
      </div>
      <div class="shop-card__footer">
        <span class="shop-card__status">
          <span class="shop-card__status-dot"></span>
          ${shop.open ? 'Open for orders' : 'Currently closed'}
        </span>
        <span class="shop-card__link">
          Order now ${ARROW_ICON}
        </span>
      </div>
    </div>
  `;

  const tag = shop.open ? 'a' : 'div';
  const hrefAttr = shop.open ? `href="${shop.url}"` : '';
  const classes = `shop-card${shop.open ? '' : ' shop-card--closed'}`;

  return `<${tag} class="${classes}" ${hrefAttr} data-shop="${shop.id}">${inner}</${tag}>`;
}

function renderShops(shops) {
  const grid = document.getElementById('shop-grid');
  if (!shops.length) {
    grid.innerHTML = '<p class="directory-empty">No shops match your search.</p>';
    return;
  }
  grid.innerHTML = shops.map(renderShopCard).join('');
}

function updateCountPill(count) {
  const pill = document.getElementById('shop-count-pill');
  pill.textContent = `${count} shop${count === 1 ? '' : 's'}`;
}

function sortShops(shops) {
  const sorted = [...shops];
  if (activeSort === 'popular') sorted.sort((a, b) => a.popularityRank - b.popularityRank);
  if (activeSort === 'fastest') sorted.sort((a, b) => a.etaMinutes[0] - b.etaMinutes[0]);
  if (activeSort === 'distance') sorted.sort((a, b) => a.distanceMiles - b.distanceMiles);
  return sorted;
}

function applyFilters() {
  const query = (document.getElementById('shop-search').value || '').trim().toLowerCase();
  let filtered = MOCK_SHOPS.filter((shop) => shop.name.toLowerCase().includes(query));
  if (activeCuisine !== 'All') {
    filtered = filtered.filter((shop) => shop.cuisine === activeCuisine);
  }
  renderShops(sortShops(filtered));
  updateCountPill(filtered.length);
}

function renderFilterChips() {
  const cuisines = ['All', ...new Set(MOCK_SHOPS.map((shop) => shop.cuisine))];
  const container = document.getElementById('directory-filters');
  container.innerHTML = cuisines
    .map(
      (cuisine) =>
        `<button type="button" class="directory-filter-chip${cuisine === activeCuisine ? ' is-active' : ''}" data-cuisine="${cuisine}">${cuisine}</button>`
    )
    .join('');

  container.addEventListener('click', (event) => {
    const chip = event.target.closest('.directory-filter-chip');
    if (!chip) return;
    activeCuisine = chip.dataset.cuisine;
    [...container.querySelectorAll('.directory-filter-chip')].forEach((el) =>
      el.classList.toggle('is-active', el === chip)
    );
    applyFilters();
  });
}

function renderSortOptions() {
  const container = document.getElementById('directory-sort');
  container.innerHTML = SORT_OPTIONS.map(
    (opt) => `<button type="button" class="directory-sort__opt${opt.key === activeSort ? ' is-active' : ''}" data-sort="${opt.key}">${opt.label}</button>`
  ).join('');

  container.addEventListener('click', (event) => {
    const btn = event.target.closest('.directory-sort__opt');
    if (!btn) return;
    activeSort = btn.dataset.sort;
    [...container.querySelectorAll('.directory-sort__opt')].forEach((el) =>
      el.classList.toggle('is-active', el === btn)
    );
    applyFilters();
  });
}

function initSearch() {
  const input = document.getElementById('shop-search');
  const miniInput = document.getElementById('shop-search-mini');

  input.addEventListener('input', () => {
    miniInput.value = input.value;
    applyFilters();
  });

  miniInput.addEventListener('input', () => {
    input.value = miniInput.value;
    applyFilters();
  });
}

function initMiniHeader() {
  const hero = document.getElementById('directory-hero');
  const miniHeader = document.getElementById('directory-mini-header');
  const observer = new IntersectionObserver(
    ([entry]) => {
      miniHeader.classList.toggle('is-visible', !entry.isIntersecting);
    },
    { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
  );
  observer.observe(hero);
}

function init() {
  initPageTransitions();
  renderFilterChips();
  renderSortOptions();
  applyFilters();
  initSearch();
  initMiniHeader();
}

document.addEventListener('DOMContentLoaded', init);
