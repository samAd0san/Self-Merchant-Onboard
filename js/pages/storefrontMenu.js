// ==========================================================================
// Page: Storefront Menu / Order (prototype, standalone)
// Scraped reference menu (poblanospiripirimenu.com), mock cart logic only.
// Not wired into onboarding or the merchant dashboard.
// ==========================================================================

import { initPageTransitions } from '../utils/pageTransition.js';
import { initCustomSelects, refreshCustomSelects } from '../components/customSelect.js';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&q=80';

const MENU = [
  {
    id: 'grilled-meats',
    label: 'Grilled Meats',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    note: 'Marinated and flame-grilled with your choice of flavoring. *Preparation time: 45 min.',
    items: [
      { name: 'Chicken Wings', desc: 'Our extremely popular sizzling chicken wings.', price: 8.49 },
      { name: 'Chicken Strips', desc: 'Tender breast strips in your choice of flavoring.', price: 9.49 },
      { name: 'Chicken', desc: 'Generous portions of our delicious tender cooked chicken.', price: 5.99 },
      { name: 'Butterfly Chicken', desc: 'Butterfly-cut chicken breast grilled to perfection.', price: 7.99 },
      { name: 'Lamb Chops', desc: 'Succulent lamb chops in your choice of flavoring.', price: 22.99 },
    ],
  },
  {
    id: 'wraps-pitas',
    label: 'Wraps & Pitas',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
    items: [
      { name: 'Chicken', desc: 'Flame-grilled chicken wrap.', price: 6.49 },
      { name: 'Beef', desc: 'Grilled cuts of beef.', price: 7.49 },
      { name: 'Prawn', desc: 'King prawn wrap.', price: 6.99 },
      { name: 'Paneer', desc: 'Grilled paneer wrap.', price: 5.49 },
    ],
  },
  {
    id: 'burgers',
    label: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    items: [
      { name: 'The Big Boss', desc: 'Beef patty with pickles, leaves, tomato, onions, mayo, ketchup.', price: 9.99 },
      { name: 'The Rio Grande', desc: 'Beef with jalapenos, tomato, onion.', price: 9.99 },
      { name: 'The Rancher', desc: 'Beef with pickles, BBQ sauce.', price: 9.99 },
      { name: 'Chicken', desc: 'Breast fillet burger.', price: 7.99 },
      { name: 'Butterfly Chicken', desc: 'Breast fillet burger.', price: 10.49 },
    ],
  },
  {
    id: 'platters',
    label: 'Platters',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80',
    items: [
      { name: 'Wings Platter', desc: '16 wings, 2 sides.', price: 26.99 },
      { name: 'Strips Platter', desc: '12 strips, 2 sides.', price: 22.99 },
      { name: 'Single Platter', desc: 'Whole chicken, 2 sides.', price: 26.99 },
      { name: 'Mixed Platter', desc: 'Whole chicken, 4 wings, 4 strips, 2 sides.', price: 38.99 },
      { name: 'Mega Platter', desc: '2 whole chickens, 8 wings, 8 strips, 4 sides.', price: 76.99 },
    ],
  },
  {
    id: 'special-deals',
    label: 'Special Deals',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
    items: [
      { name: 'Deal 1', desc: 'Half chicken, side, drink.', price: 13.49 },
      { name: 'Deal 2', desc: 'Butterfly chicken burger, fries, drink.', price: 10.49 },
      { name: 'Deal 3', desc: '6 strips or wings, fries, drink.', price: 12.49 },
      { name: 'Deal 4', desc: 'Beef burger, fries, drink.', price: 8.49 },
      { name: 'Deal 5', desc: 'Chicken burger, fries, drink.', price: 8.49 },
      { name: 'Deal 6', desc: 'Chicken wrap, fries, drink.', price: 9.99 },
      { name: 'Deal 7', desc: '6 leg quarters, rice.', price: 45.99 },
      { name: 'Deal 8', desc: 'Full chargha, fries, salad.', price: 21.99 },
      { name: 'Deal 9', desc: '6 fried tenders, fries, drink.', price: 16.99 },
    ],
  },
  {
    id: 'appetizers',
    label: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
    items: [
      { name: 'Chicken Wings', desc: 'Choice of flavoring.', price: 6.99 },
      { name: 'Chicken Strips', desc: 'Choice of flavoring.', price: 7.99 },
      { name: 'Sirloin Beef Strips', desc: 'Choice of flavoring.', price: 7.49 },
      { name: 'Prawns', desc: 'King prawn.', price: 6.99 },
      { name: 'Humus & Pita', desc: 'Served with pita pieces.', price: 2.49 },
      { name: 'Samosa', desc: 'Pastry with spiced potato filling.', price: 1.50 },
    ],
  },
  {
    id: 'pk-in-appetizers',
    label: 'Pakistani & Indian Appetizers',
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80',
    items: [
      { name: 'Chicken 65', desc: 'Boneless cubes with spices.', price: 10.99 },
      { name: 'Chili Chicken', desc: '', price: 10.99 },
      { name: 'Seekh Kabab Skewer', desc: '', price: 5.49 },
      { name: 'Chicken Malai Kabab Skewer', desc: 'Marinated with cashews.', price: 9.99 },
      { name: 'Haryali Chicken Skewer', desc: 'Mint, cilantro marination.', price: 9.99 },
      { name: 'Chicken Mix Platter', desc: 'Multiple skewers, leg quarter, rice, fries, drinks.', price: 34.99 },
      { name: 'Mutton Haleem', desc: 'Slow cooked goat meat mashed with wheat.', price: 16.99 },
    ],
  },
  {
    id: 'naan-breads',
    label: 'Naan & Breads',
    image: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=400&q=80',
    items: [
      { name: 'Plain Naan', desc: '', price: 1.99 },
      { name: 'Butter Naan', desc: '', price: 2.49 },
      { name: 'Garlic Naan', desc: '', price: 2.99 },
      { name: 'Rumali Roti', desc: '', price: 2.99 },
    ],
  },
  {
    id: 'salads',
    label: 'Salads',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
    items: [
      { name: 'Chicken Salad', desc: 'Four tender strips.', price: 8.99 },
      { name: 'Beef Strip Salad', desc: 'Four tender strips.', price: 8.99 },
      { name: 'Prawn Salad', desc: 'King prawns.', price: 8.99 },
    ],
  },
  {
    id: 'regular-sides',
    label: 'Regular Sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    items: [
      { name: 'Fries', desc: '', price: 1.99 },
      { name: 'Wedges', desc: '', price: 1.99 },
      { name: 'Rice', desc: '', price: 1.99 },
    ],
  },
  {
    id: 'premium-sides',
    label: 'Premium Sides',
    image: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=400&q=80',
    items: [
      { name: 'Mixed Side Salad', desc: '', price: 2.99 },
      { name: 'Coleslaw', desc: '', price: 2.99 },
      { name: 'Sweet Potato Fries', desc: '', price: 2.99 },
      { name: 'Corn on the Cob', desc: '', price: 2.99 },
    ],
  },
  {
    id: 'extras',
    label: 'Extras',
    image: 'https://images.unsplash.com/photo-1615937691194-97dbd3f3dc29?w=400&q=80',
    items: [
      { name: 'Piri Mayonnaise Dip', desc: '', price: 0.50 },
      { name: 'Garlic Mayonnaise Dip', desc: '', price: 0.50 },
      { name: 'Extra Sauce', desc: '', price: 2.00 },
    ],
  },
  {
    id: 'kabob-rolls-rice',
    label: 'Kabob Rolls & Rice',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80',
    items: [
      { name: 'Chicken Malai Kabob Roll', desc: '', price: 8.99 },
      { name: 'Haryali Chicken Kabab Roll', desc: '', price: 8.99 },
      { name: 'Chicken Seekh Kabab Roll', desc: '', price: 8.99 },
      { name: 'Chicken Malai Kabab & Rice', desc: '', price: 10.99 },
      { name: 'Haryali Chicken Kabab & Rice', desc: '', price: 10.99 },
      { name: 'Chicken Seekh Kabab & Rice', desc: '', price: 10.99 },
    ],
  },
  {
    id: 'biryanis',
    label: 'Signature Biryanis',
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80',
    items: [
      { name: 'Hyderabadi Mutton Dum Biryani', desc: 'With raita and mirchi ka salan.', price: 16.99 },
      { name: 'Pakistani Chicken Biryani', desc: '', price: 8.99 },
      { name: 'Chicken Pulav', desc: '', price: 8.99 },
      { name: 'Goat Pulav', desc: '', price: 15.99 },
    ],
  },
  {
    id: 'curries',
    label: 'Gravy & Curries',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&q=80',
    items: [
      { name: 'Butter Chicken', desc: 'Special marinated slow cooked tandoori chicken cubes.', price: 10.99 },
      { name: 'Butter Paneer', desc: 'Same preparation, paneer.', price: 10.99 },
      { name: 'Chicken Angaara', desc: 'Smoky curry.', price: 11.99 },
      { name: 'Goat Karahi', desc: '', price: 15.99 },
      { name: 'Beef Nihari', desc: '', price: 10.99 },
    ],
  },
  {
    id: 'kids-menu',
    label: "Kids' Menu",
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
    items: [
      { name: 'Mini Gourmet Burger', desc: 'Beef burger.', price: 7.99 },
      { name: 'Chicken Wrap', desc: 'Two strips.', price: 5.99 },
      { name: '3 Chicken Strips', desc: 'Choice of flavoring.', price: 6.99 },
      { name: 'Chicken Nuggets', desc: 'With fries.', price: 6.49 },
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80',
    items: [
      { name: 'Kheer', desc: '', price: 3.99 },
      { name: 'Gulab Jaman', desc: '', price: 3.99 },
      { name: 'Gajar ka Halwa', desc: '', price: 4.99 },
      { name: 'Dry Fruit Delight', desc: 'Custard with dry fruits.', price: 4.99 },
      { name: 'Apricot Delight', desc: 'Khubani ka Meetha.', price: 6.99 },
      { name: 'Shahi Tukda', desc: 'Double ka meetha.', price: 6.99 },
      { name: 'Lauki ka Halwa', desc: '', price: 4.99 },
    ],
  },
  {
    id: 'beverages',
    label: 'Beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
    items: [
      { name: 'Orange Juice', desc: 'Freshly-squeezed to order.', price: 4.99 },
      { name: 'Bottled Water', desc: '', price: 0.99 },
      { name: 'Soft Drinks', desc: 'Free refills.', price: 1.99 },
      { name: 'Soda Can', desc: '', price: 1.49 },
      { name: 'Mango Lassi', desc: '', price: 1.49 },
      { name: 'Tea', desc: '', price: 1.49 },
    ],
  },
];

const FLAVOR_OPTIONS = ['Original', 'Lemon & Herb', 'Mild', 'Medium', 'Hot', 'BBQ'];
const SERVE_SIZE_OPTIONS = [
  { label: 'Plate', delta: 0 },
  { label: 'Bowl', delta: 2.0 },
];
const PORTION_SIZE_OPTIONS = [
  { label: 'Regular', delta: 0 },
  { label: 'Large', delta: 1.5 },
];
const DRINK_SIZE_OPTIONS = [
  { label: 'Small', delta: 0 },
  { label: 'Medium', delta: 0.75 },
  { label: 'Large', delta: 1.5 },
];

// Category-level customization profile. A prototype-scale judgment call:
// options are assigned per category rather than hand-curated per each of the
// ~100 scraped items, since the source menu doesn't specify these per item.
const CUSTOMIZATION_RULES = {
  'grilled-meats': { flavors: FLAVOR_OPTIONS },
  'wraps-pitas': { flavors: FLAVOR_OPTIONS, removableGeneric: ['Lettuce', 'Tomato', 'Onion', 'Sauce'] },
  burgers: { removableFromDesc: true },
  platters: { flavors: FLAVOR_OPTIONS },
  'special-deals': { flavors: FLAVOR_OPTIONS },
  appetizers: { flavors: FLAVOR_OPTIONS },
  biryanis: { sizes: SERVE_SIZE_OPTIONS, sizeLabel: 'Serve as' },
  curries: { sizes: SERVE_SIZE_OPTIONS, sizeLabel: 'Serve as' },
  'regular-sides': { sizes: PORTION_SIZE_OPTIONS },
  'premium-sides': { sizes: PORTION_SIZE_OPTIONS },
  beverages: { sizes: DRINK_SIZE_OPTIONS },
};

function extractRemovableIngredients(desc) {
  if (!desc) return [];
  const match = desc.match(/with (.+?)\.?$/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((part) => part.replace(/^and\s+/i, '').trim())
    .filter(Boolean);
}

function getCustomization(categoryId, item) {
  const rules = CUSTOMIZATION_RULES[categoryId] || {};
  return {
    flavors: rules.flavors || null,
    sizes: rules.sizes || null,
    sizeLabel: rules.sizeLabel || 'Size',
    removable: rules.removableFromDesc ? extractRemovableIngredients(item.desc) : rules.removableGeneric || [],
  };
}

const cart = new Map(); // key: composite of item + selected options -> { name, price, qty, meta }

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function renderHero() {
  const hero = document.getElementById('menu-hero');
  hero.style.backgroundImage = `url('${HERO_IMAGE}')`;
}

function renderRail() {
  const rail = document.getElementById('menu-rail');
  rail.innerHTML = MENU.map(
    (cat) => `<button class="menu-rail__item" data-target="${cat.id}">${cat.label}</button>`
  ).join('');
}

function renderContent() {
  const content = document.getElementById('menu-content');
  content.innerHTML = MENU.map(
    (cat) => `
      <section class="menu-section" id="${cat.id}">
        <h2 class="menu-section__title">${cat.label.toUpperCase()}</h2>
        ${cat.note ? `<p class="menu-section__note">${cat.note}</p>` : ''}
        <div class="menu-section__grid">
          ${cat.items
            .map(
              (item) => `
                <article class="menu-item" data-category="${cat.id}" data-item="${item.name}">
                  ${cat.image ? `<div class="menu-item__photo" style="background-image:url('${cat.image}')"></div>` : ''}
                  <div class="menu-item__body">
                    <h3 class="menu-item__name">${item.name}</h3>
                    ${item.desc ? `<p class="menu-item__desc">${item.desc}</p>` : ''}
                  </div>
                  <div class="menu-item__footer">
                    <span class="menu-item__price">${formatPrice(item.price)}</span>
                    <button class="menu-item__add" type="button" data-category="${cat.id}" data-item="${item.name}" data-price="${item.price}">Add</button>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `
  ).join('');
}

function initRailNav() {
  const rail = document.getElementById('menu-rail');
  const buttons = [...rail.querySelectorAll('.menu-rail__item')];

  rail.addEventListener('click', (event) => {
    const btn = event.target.closest('.menu-rail__item');
    if (!btn) return;
    const target = document.getElementById(btn.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const activeCategoryLabel = document.getElementById('menu-active-category');
  const sections = [...document.querySelectorAll('.menu-section')];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        buttons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.target === entry.target.id));
        const activeBtn = rail.querySelector('.menu-rail__item.is-active');
        if (activeBtn) {
          activeBtn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          activeCategoryLabel.textContent = activeBtn.textContent;
        }
      });
    },
    { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
  );
  sections.forEach((section) => observer.observe(section));
}

function buildCartKey(categoryId, itemName, sizeLabel, flavor, removed, notes) {
  return [categoryId, itemName, sizeLabel || '', flavor || '', [...removed].sort().join(','), notes || '']
    .join('||');
}

function renderCart() {
  const emptyEl = document.getElementById('cart-empty');
  const listEl = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');
  const subtotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('cart-checkout');

  if (cart.size === 0) {
    emptyEl.classList.remove('is-hidden');
    listEl.classList.remove('is-visible');
    listEl.innerHTML = '';
    footerEl.classList.remove('is-visible');
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Checkout';
    updateHeaderCartBadge(0);
    return;
  }

  emptyEl.classList.add('is-hidden');
  listEl.classList.add('is-visible');
  footerEl.classList.add('is-visible');
  checkoutBtn.disabled = false;

  let subtotal = 0;
  let totalQty = 0;
  listEl.innerHTML = [...cart.entries()]
    .map(([key, entry]) => {
      subtotal += entry.price * entry.qty;
      totalQty += entry.qty;
      return `
        <li class="cart-item" data-key="${key}">
          <div class="cart-item__info">
            <span class="cart-item__name">${entry.name}</span>
            ${entry.meta ? `<span class="cart-item__meta">${entry.meta}</span>` : ''}
            <span class="cart-item__price">${formatPrice(entry.price * entry.qty)}</span>
          </div>
          <div class="cart-item__qty">
            <button class="cart-item__step" data-action="dec" data-key="${key}" type="button" aria-label="Decrease quantity">-</button>
            <span class="cart-item__qty-value">${entry.qty}</span>
            <button class="cart-item__step" data-action="inc" data-key="${key}" type="button" aria-label="Increase quantity">+</button>
          </div>
        </li>
      `;
    })
    .join('');

  subtotalEl.textContent = formatPrice(subtotal);
  updateHeaderCartBadge(totalQty);
  renderCheckoutSummary();
}

function updateHeaderCartBadge(totalQty) {
  const badge = document.getElementById('header-cart-count');
  badge.textContent = totalQty;
  badge.classList.toggle('is-hidden', totalQty === 0);
}

function openMobileCart() {
  document.querySelector('.menu-cart').classList.add('is-open');
  document.getElementById('mobile-cart-overlay').classList.add('is-visible');
}

function closeMobileCart() {
  document.querySelector('.menu-cart').classList.remove('is-open');
  document.getElementById('mobile-cart-overlay').classList.remove('is-visible');
}

function initMobileCart() {
  document.getElementById('header-cart-button').addEventListener('click', openMobileCart);
  document.getElementById('mobile-cart-overlay').addEventListener('click', closeMobileCart);
}

function addToCart({ key, name, price, qty, meta, categoryId }) {
  const existing = cart.get(key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.set(key, { name, price, qty, meta, categoryId });
  }
  renderCart();
}

function changeQty(key, delta) {
  const entry = cart.get(key);
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) {
    cart.delete(key);
  }
  renderCart();
}

function flashAdded(btn) {
  if (btn.dataset.flashing) return;
  btn.dataset.flashing = 'true';
  const original = btn.textContent;
  btn.textContent = 'Added';
  btn.classList.add('is-added');
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('is-added');
    delete btn.dataset.flashing;
  }, 900);
}

// ---- Item customization modal ----
const modalState = {
  categoryId: null,
  category: null,
  item: null,
  config: null,
  selectedFlavor: null,
  selectedSize: null,
  removedIngredients: new Set(),
  qty: 1,
};

function findMenuItem(categoryId, itemName) {
  const category = MENU.find((cat) => cat.id === categoryId);
  const item = category?.items.find((i) => i.name === itemName);
  return { category, item };
}

function modalUnitPrice() {
  const sizeDelta = modalState.selectedSize ? modalState.selectedSize.delta : 0;
  return modalState.item.price + sizeDelta;
}

function renderModalPills(containerId, options, selected, onPick) {
  const container = document.getElementById(containerId);
  container.innerHTML = options
    .map((opt) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      const isSelected = selected === opt || (selected && selected.label === label);
      const priceTag = typeof opt === 'object' && opt.delta ? ` (+${formatPrice(opt.delta)})` : '';
      return `<button type="button" class="item-modal__pill${isSelected ? ' is-selected' : ''}" data-label="${label}">${label}${priceTag}</button>`;
    })
    .join('');
  container.onclick = (event) => {
    const btn = event.target.closest('.item-modal__pill');
    if (!btn) return;
    const picked = options.find((opt) => (typeof opt === 'string' ? opt : opt.label) === btn.dataset.label);
    onPick(picked);
    renderModal();
  };
}

function renderModal() {
  const { category, item, config } = modalState;

  document.getElementById('item-modal-title').textContent = item.name;
  document.getElementById('item-modal-desc').textContent = item.desc || '';
  const photo = document.getElementById('item-modal-photo');
  if (category.image) {
    photo.style.backgroundImage = `url('${category.image}')`;
    photo.classList.remove('is-hidden');
  } else {
    photo.classList.add('is-hidden');
  }

  const sizeSection = document.getElementById('item-modal-size-section');
  if (config.sizes) {
    sizeSection.classList.remove('is-hidden');
    document.getElementById('item-modal-size-label').textContent = config.sizeLabel;
    if (!modalState.selectedSize) modalState.selectedSize = config.sizes[0];
    renderModalPills('item-modal-size-options', config.sizes, modalState.selectedSize, (picked) => {
      modalState.selectedSize = picked;
    });
  } else {
    sizeSection.classList.add('is-hidden');
  }

  const flavorSection = document.getElementById('item-modal-flavor-section');
  if (config.flavors) {
    flavorSection.classList.remove('is-hidden');
    renderModalPills('item-modal-flavor-options', config.flavors, modalState.selectedFlavor, (picked) => {
      modalState.selectedFlavor = picked;
    });
  } else {
    flavorSection.classList.add('is-hidden');
  }

  const removeSection = document.getElementById('item-modal-remove-section');
  if (config.removable.length) {
    removeSection.classList.remove('is-hidden');
    const container = document.getElementById('item-modal-remove-options');
    container.innerHTML = config.removable
      .map((ingredient) => {
        const isRemoved = modalState.removedIngredients.has(ingredient);
        return `
          <button type="button" class="item-modal__check${isRemoved ? ' is-removed' : ''}" data-ingredient="${ingredient}" aria-pressed="${!isRemoved}">${ingredient}</button>
        `;
      })
      .join('');
    container.onclick = (event) => {
      const btn = event.target.closest('.item-modal__check');
      if (!btn) return;
      const ingredient = btn.dataset.ingredient;
      if (modalState.removedIngredients.has(ingredient)) modalState.removedIngredients.delete(ingredient);
      else modalState.removedIngredients.add(ingredient);
      renderModal();
    };
  } else {
    removeSection.classList.add('is-hidden');
  }

  document.getElementById('item-modal-qty-value').textContent = modalState.qty;
  document.getElementById('item-modal-add').textContent = 'Add to Cart';
}

function openItemModal(categoryId, itemName) {
  const { category, item } = findMenuItem(categoryId, itemName);
  if (!category || !item) return;

  modalState.categoryId = categoryId;
  modalState.category = category;
  modalState.item = item;
  modalState.config = getCustomization(categoryId, item);
  modalState.selectedFlavor = modalState.config.flavors ? modalState.config.flavors[0] : null;
  modalState.selectedSize = null;
  modalState.removedIngredients = new Set();
  modalState.qty = 1;
  document.getElementById('item-modal-notes').value = '';

  renderModal();
  document.getElementById('item-modal-overlay').classList.add('is-visible');
  document.getElementById('item-modal-close').focus();
}

function closeItemModal() {
  document.getElementById('item-modal-overlay').classList.remove('is-visible');
}

function buildCartMeta() {
  const parts = [];
  if (modalState.selectedSize) parts.push(modalState.selectedSize.label);
  if (modalState.selectedFlavor) parts.push(modalState.selectedFlavor);
  if (modalState.removedIngredients.size) {
    parts.push(`No ${[...modalState.removedIngredients].join(', ')}`);
  }
  const notes = document.getElementById('item-modal-notes').value.trim();
  if (notes) parts.push(`Note: ${notes}`);
  return parts.join(' · ');
}

function trapModalFocus(event) {
  const overlay = document.getElementById('item-modal-overlay');
  if (!overlay.classList.contains('is-visible')) return;

  if (event.key === 'Escape') {
    closeItemModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusables = [
    ...overlay.querySelectorAll('button, input, textarea, [href], [tabindex]:not([tabindex="-1"])'),
  ].filter((el) => !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initItemModal() {
  document.getElementById('item-modal-close').addEventListener('click', closeItemModal);
  document.getElementById('item-modal-overlay').addEventListener('click', (event) => {
    if (event.target.id === 'item-modal-overlay') closeItemModal();
  });
  document.addEventListener('keydown', trapModalFocus);
  document.getElementById('item-modal-qty-dec').addEventListener('click', () => {
    modalState.qty = Math.max(1, modalState.qty - 1);
    renderModal();
  });
  document.getElementById('item-modal-qty-inc').addEventListener('click', () => {
    modalState.qty += 1;
    renderModal();
  });
  document.getElementById('item-modal-add').addEventListener('click', () => {
    const notes = document.getElementById('item-modal-notes').value.trim();
    const key = buildCartKey(
      modalState.categoryId,
      modalState.item.name,
      modalState.selectedSize ? modalState.selectedSize.label : '',
      modalState.selectedFlavor || '',
      modalState.removedIngredients,
      notes
    );
    addToCart({
      key,
      name: modalState.item.name,
      price: modalUnitPrice(),
      qty: modalState.qty,
      meta: buildCartMeta(),
      categoryId: modalState.categoryId,
    });
    const originButton = document.querySelector(
      `.menu-item__add[data-category="${modalState.categoryId}"][data-item="${modalState.item.name}"]`
    );
    if (originButton) flashAdded(originButton);
    closeItemModal();
  });
}

function initCartInteractions() {
  document.getElementById('menu-content').addEventListener('click', (event) => {
    const card = event.target.closest('.menu-item');
    if (!card) return;
    openItemModal(card.dataset.category, card.dataset.item);
  });

  document.getElementById('cart-items').addEventListener('click', (event) => {
    const btn = event.target.closest('.cart-item__step');
    if (!btn) return;
    changeQty(btn.dataset.key, btn.dataset.action === 'inc' ? 1 : -1);
  });

  document.getElementById('cart-checkout').addEventListener('click', openCheckoutModal);
}

// ---- Checkout modal ----
const SERVICE_FEE = 1.99;
const TAX_RATE = 0.096;
const DISCOUNT_RATE = 0.05;

const checkoutState = {
  paymentMethod: 'card',
  promoApplied: false,
  tipMode: '0',
  tipCustom: 0,
};

function cartSubtotal() {
  let subtotal = 0;
  cart.forEach((entry) => {
    subtotal += entry.price * entry.qty;
  });
  return subtotal;
}

function computeCheckoutTotals() {
  const subtotal = cartSubtotal();
  const discount = checkoutState.promoApplied ? subtotal * DISCOUNT_RATE : 0;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * TAX_RATE;
  let tip = 0;
  if (checkoutState.tipMode === 'other') {
    tip = checkoutState.tipCustom || 0;
  } else {
    tip = subtotal * Number(checkoutState.tipMode);
  }
  const total = taxableAmount + tax + SERVICE_FEE + tip;
  return { subtotal, discount, tax, tip, total };
}

function renderCheckoutItems() {
  const list = document.getElementById('checkout-items');
  list.innerHTML = [...cart.entries()]
    .map(
      ([key, entry]) => `
        <li class="checkout-item" data-key="${key}">
          <span class="checkout-item__qty">${entry.qty}x</span>
          <div class="checkout-item__info">
            <span class="checkout-item__name">${entry.name}</span>
            ${entry.meta ? `<span class="checkout-item__meta">${entry.meta}</span>` : ''}
          </div>
          <span class="checkout-item__price">${formatPrice(entry.price * entry.qty)}</span>
          <div class="checkout-item__actions">
            <button type="button" data-action="edit" data-key="${key}">Edit</button>
            <button type="button" data-action="remove" data-key="${key}">Remove</button>
          </div>
        </li>
      `
    )
    .join('');
}

function renderCheckoutSummary() {
  const { subtotal, discount, tax, total } = computeCheckoutTotals();
  document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkout-tax').textContent = formatPrice(tax);
  document.getElementById('checkout-service-fee').textContent = formatPrice(SERVICE_FEE);
  document.getElementById('checkout-discount-row').classList.toggle('is-hidden', !checkoutState.promoApplied);
  document.getElementById('checkout-discount').textContent = `-${formatPrice(discount)}`;
  document.getElementById('checkout-total').textContent = formatPrice(total);
  document.getElementById('cart-checkout').textContent = 'Checkout';
}

function renderCheckoutModal() {
  renderCheckoutItems();
  renderCheckoutSummary();
  updateAllTimingUI();
}

function openCheckoutModal() {
  if (cart.size === 0) return;
  renderCheckoutModal();
  document.getElementById('checkout-success').classList.add('is-hidden');
  document.getElementById('checkout-modal-overlay').classList.add('is-visible');
  document.getElementById('checkout-modal-close').focus();
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal-overlay').classList.remove('is-visible');
}

function toggleInlineEdit(rowEditId) {
  const el = document.getElementById(rowEditId);
  el.classList.toggle('is-hidden');
}

function trapCheckoutFocus(event) {
  const overlay = document.getElementById('checkout-modal-overlay');
  if (!overlay.classList.contains('is-visible')) return;

  if (event.key === 'Escape') {
    closeCheckoutModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusables = [
    ...overlay.querySelectorAll('button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])'),
  ].filter((el) => !el.disabled && el.offsetParent !== null);
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initCheckoutModal() {
  document.getElementById('checkout-modal-close').addEventListener('click', closeCheckoutModal);
  document.getElementById('checkout-modal-overlay').addEventListener('click', (event) => {
    if (event.target.id === 'checkout-modal-overlay') closeCheckoutModal();
  });
  document.addEventListener('keydown', trapCheckoutFocus);

  document.getElementById('checkout-edit-timing').addEventListener('click', () => toggleInlineEdit('checkout-timing-edit'));
  document.getElementById('checkout-edit-instructions').addEventListener('click', () => toggleInlineEdit('checkout-instructions-edit'));

  document.getElementById('checkout-instructions-input').addEventListener('input', (event) => {
    const value = event.target.value.trim();
    document.getElementById('checkout-instructions-preview').textContent = value || '+ Pickup instructions';
  });

  const cardRadio = document.getElementById('checkout-payment-card');
  const paypalRadio = document.getElementById('checkout-payment-paypal');
  const cardFields = document.getElementById('checkout-card-fields');
  cardRadio.addEventListener('change', () => {
    checkoutState.paymentMethod = 'card';
    cardFields.classList.remove('is-hidden');
  });
  paypalRadio.addEventListener('change', () => {
    checkoutState.paymentMethod = 'paypal';
    cardFields.classList.add('is-hidden');
  });

  document.getElementById('checkout-promo-toggle').addEventListener('click', () => {
    document.getElementById('checkout-promo-field').classList.toggle('is-hidden');
  });
  document.getElementById('checkout-promo-apply').addEventListener('click', () => {
    const code = document.getElementById('checkout-promo-input').value.trim();
    checkoutState.promoApplied = code.length > 0;
    renderCheckoutSummary();
  });

  const tipOpts = document.getElementById('checkout-tip-opts');
  const tipCustomInput = document.getElementById('checkout-tip-custom');
  tipOpts.addEventListener('click', (event) => {
    const btn = event.target.closest('.checkout-tip__opt');
    if (!btn) return;
    [...tipOpts.querySelectorAll('.checkout-tip__opt')].forEach((el) => el.classList.toggle('is-active', el === btn));
    checkoutState.tipMode = btn.dataset.tip;
    tipCustomInput.classList.toggle('is-hidden', btn.dataset.tip !== 'other');
    if (btn.dataset.tip === 'other') tipCustomInput.focus();
    renderCheckoutSummary();
  });
  tipCustomInput.addEventListener('input', () => {
    checkoutState.tipCustom = Number(tipCustomInput.value) || 0;
    renderCheckoutSummary();
  });

  document.getElementById('checkout-items').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const key = btn.dataset.key;
    const entry = cart.get(key);
    if (btn.dataset.action === 'remove') {
      cart.delete(key);
      renderCart();
      renderCheckoutModal();
      if (cart.size === 0) closeCheckoutModal();
    } else if (btn.dataset.action === 'edit' && entry) {
      closeCheckoutModal();
      openItemModal(entry.categoryId, entry.name);
    }
  });

  document.getElementById('checkout-place-order').addEventListener('click', () => {
    document.querySelector('.checkout-modal__body').classList.add('is-hidden');
    document.querySelector('.checkout-modal__footer').classList.add('is-hidden');
    document.getElementById('checkout-success').classList.remove('is-hidden');
  });

  document.getElementById('checkout-success-done').addEventListener('click', () => {
    cart.clear();
    renderCart();
    document.querySelector('.checkout-modal__body').classList.remove('is-hidden');
    document.querySelector('.checkout-modal__footer').classList.remove('is-hidden');
    closeCheckoutModal();
  });
}

function initSearch() {
  const input = document.getElementById('menu-search-input');
  const noResults = document.getElementById('menu-no-results');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    let anyVisible = false;

    document.querySelectorAll('.menu-section').forEach((section) => {
      let sectionHasMatch = false;
      section.querySelectorAll('.menu-item').forEach((item) => {
        const name = item.dataset.item.toLowerCase();
        const matches = !query || name.includes(query);
        item.classList.toggle('is-hidden', !matches);
        if (matches) sectionHasMatch = true;
      });
      section.classList.toggle('is-hidden', !sectionHasMatch);
      if (sectionHasMatch) anyVisible = true;
    });

    noResults.classList.toggle('is-hidden', anyVisible);
  });
}

const SHOP_ADDRESS = '3636 N Belt Line Rd, Irving, TX 75062';

// ---- Pickup timing (ASAP / Schedule for later) ----
// Delivery is out of scope for this prototype (shown as "Unavailable" per the
// reference design) - pickup is the only fulfillment method.
const pickupTiming = { mode: 'asap', date: null, time: null };

function buildScheduleOptions() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const dates = [];
  for (let i = 0; i < 4; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const label = i === 0 ? `Today, ${monthNames[d.getMonth()]} ${d.getDate()}` : `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    dates.push({ label, value: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` });
  }
  const times = [
    '12:30 PM CDT', '1:00 PM CDT', '1:30 PM CDT', '2:00 PM CDT',
    '2:30 PM CDT', '3:00 PM CDT', '3:30 PM CDT', '4:00 PM CDT',
  ];
  return { dates, times };
}

const SCHEDULE_OPTIONS = buildScheduleOptions();

function populateSelect(select, options, isDate) {
  select.innerHTML = options
    .map((opt) => (isDate ? `<option value="${opt.value}">${opt.label}</option>` : `<option value="${opt}">${opt}</option>`))
    .join('');
}

function pickupSummaryLabel() {
  if (pickupTiming.mode === 'asap') return 'ASAP (15 - 30 min)';
  const dateLabel = SCHEDULE_OPTIONS.dates.find((d) => d.value === pickupTiming.date)?.label || SCHEDULE_OPTIONS.dates[0].label;
  return `${dateLabel} at ${pickupTiming.time || SCHEDULE_OPTIONS.times[0]}`;
}

function syncTimingUI(prefix) {
  const asapBtn = document.getElementById(`${prefix}-asap`);
  const scheduleBtn = document.getElementById(`${prefix}-schedule`);
  const fields = document.getElementById(`${prefix === 'timing' ? 'cart-timing-fields' : 'checkout-timing-fields'}`);
  asapBtn.classList.toggle('is-active', pickupTiming.mode === 'asap');
  scheduleBtn.classList.toggle('is-active', pickupTiming.mode === 'schedule');
  fields.classList.toggle('is-hidden', pickupTiming.mode !== 'schedule');

  const dateSelect = document.getElementById(`${prefix}-date`);
  const timeSelect = document.getElementById(`${prefix}-time`);
  if (pickupTiming.date) dateSelect.value = pickupTiming.date;
  if (pickupTiming.time) timeSelect.value = pickupTiming.time;
}

function updateAllTimingUI() {
  syncTimingUI('timing');
  syncTimingUI('checkout-timing');
  refreshCustomSelects();
  const summary = document.getElementById('checkout-summary-timing');
  if (summary) summary.textContent = `Pick Up · ${pickupSummaryLabel()}`;
}

function setPickupMode(mode) {
  pickupTiming.mode = mode;
  updateAllTimingUI();
}

function initTimingControls(prefix) {
  const asapBtn = document.getElementById(`${prefix}-asap`);
  const scheduleBtn = document.getElementById(`${prefix}-schedule`);
  const dateSelect = document.getElementById(`${prefix}-date`);
  const timeSelect = document.getElementById(`${prefix}-time`);

  populateSelect(dateSelect, SCHEDULE_OPTIONS.dates, true);
  populateSelect(timeSelect, SCHEDULE_OPTIONS.times, false);
  pickupTiming.date = pickupTiming.date || dateSelect.value;
  pickupTiming.time = pickupTiming.time || timeSelect.value;

  asapBtn.addEventListener('click', () => setPickupMode('asap'));
  scheduleBtn.addEventListener('click', () => setPickupMode('schedule'));
  dateSelect.addEventListener('change', () => {
    pickupTiming.date = dateSelect.value;
    updateAllTimingUI();
  });
  timeSelect.addEventListener('change', () => {
    pickupTiming.time = timeSelect.value;
    updateAllTimingUI();
  });
}

function initFulfillmentToggle() {
  initTimingControls('timing');
  initTimingControls('checkout-timing');
  initCustomSelects();
  updateAllTimingUI();
}

function init() {
  initPageTransitions();
  renderHero();
  renderRail();
  renderContent();
  initRailNav();
  initCartInteractions();
  initMobileCart();
  initItemModal();
  initFulfillmentToggle();
  initSearch();
  initCheckoutModal();
  renderCart();

  const firstLabel = document.querySelector('.menu-rail__item');
  if (firstLabel) document.getElementById('menu-active-category').textContent = firstLabel.textContent;
}

document.addEventListener('DOMContentLoaded', init);
