/* ─────────────────────────────────────────
   SoleElite — script.js
   Canvas Scroll Animation + Cart + Filters
───────────────────────────────────────── */

'use strict';

// ══════════════════════════════════════════════
// 1. CANVAS HERO SCROLL ANIMATION
// ══════════════════════════════════════════════

const TOTAL_FRAMES = 205;
const FRAME_PATH = (n) =>
  `public/imagesfps/ezgif-frame-${String(n).padStart(3, '0')}.png`;

const canvas        = document.getElementById('hero-canvas');
const ctx           = canvas.getContext('2d');
const heroSection   = document.getElementById('hero');
const progressBar   = document.getElementById('hero-progress-bar');
const scrollHint    = document.getElementById('scroll-hint');
const phase1        = document.getElementById('phase-1');
const phase2        = document.getElementById('phase-2');
const phase3        = document.getElementById('phase-3');

// Frame image cache
const frames = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let currentFrameIndex = 0;

// Resize canvas to match display size
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  // Redraw current frame immediately after resize
  drawFrame(currentFrameIndex);
}

// Draw a specific frame index (0-based)
function drawFrame(index) {
  const img = frames[index];
  if (!img || !img.complete) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth  || img.width;
  const ih = img.naturalHeight || img.height;

  // Cover-fill: maintain aspect ratio, crop to fill
  const scale = Math.max(cw / iw, ch / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;
  const dx = (cw - drawW) / 2;
  const dy = (ch - drawH) / 2;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

// Preload all frames — first batch (1-30) eagerly for instant display,
// rest load in background
function preloadFrames() {
  // Draw frame 1 immediately (eager)
  const firstImg = new Image();
  firstImg.src = FRAME_PATH(1);
  firstImg.onload = () => {
    frames[0] = firstImg;
    loadedCount++;
    resizeCanvas();
    drawFrame(0);
  };

  // Load the rest
  for (let i = 2; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = FRAME_PATH(i);
    img.onload = () => {
      frames[i - 1] = img;
      loadedCount++;
    };
  }
}

// Scroll → frame
function onScroll() {
  const sectionTop    = heroSection.offsetTop;
  const sectionHeight = heroSection.offsetHeight;
  const viewH         = window.innerHeight;
  const scrollY       = window.scrollY;

  // progress 0→1 over the scroll range
  const scrollable = sectionHeight - viewH;
  const raw = (scrollY - sectionTop) / scrollable;
  const progress = Math.max(0, Math.min(1, raw));

  // Frame index (0-based)
  const frameIndex = Math.min(
    Math.floor(progress * TOTAL_FRAMES),
    TOTAL_FRAMES - 1
  );

  if (frameIndex !== currentFrameIndex) {
    currentFrameIndex = frameIndex;
    drawFrame(frameIndex);
  }

  // Progress bar
  progressBar.style.width = `${progress * 100}%`;

  // Scroll hint — hide after 5% scroll
  scrollHint.style.opacity = progress < 0.05 ? '1' : '0';

  // ── Text phase transitions ──
  // Phase 1: 0% → 28%
  // Phase 2: 28% → 65%
  // Phase 3: 65% → 100%
  const PHASE_1_END   = 0.28;
  const PHASE_2_START = 0.28;
  const PHASE_2_END   = 0.65;
  const PHASE_3_START = 0.65;

  // Phase 1
  phase1.classList.toggle('phase-active', progress < PHASE_1_END);

  // Phase 2
  phase2.classList.toggle(
    'phase-active',
    progress >= PHASE_2_START && progress < PHASE_2_END
  );

  // Phase 3
  phase3.classList.toggle('phase-active', progress >= PHASE_3_START);
}

// Init canvas animation
preloadFrames();
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('scroll', onScroll, { passive: true });

// Activate phase 1 immediately on load
phase1.classList.add('phase-active');

// ══════════════════════════════════════════════
// 2. HEADER SCROLL EFFECT
// ══════════════════════════════════════════════
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ══════════════════════════════════════════════
// 3. HAMBURGER / MOBILE NAV
// ══════════════════════════════════════════════
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileNav.classList.toggle('open');
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
  });
});

// ══════════════════════════════════════════════
// 4. NAV ACTIVE LINK (IntersectionObserver)
// ══════════════════════════════════════════════
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.35 });

sections.forEach(s => sectionObs.observe(s));

// ══════════════════════════════════════════════
// 5. PRODUCT FILTER
// ══════════════════════════════════════════════
const filterBtns   = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    productCards.forEach(card => {
      const categories = card.dataset.category || '';
      const show = filter === 'all' || categories.includes(filter);
      card.classList.toggle('hidden', !show);
    });
  });
});

// ══════════════════════════════════════════════
// 6. CART
// ══════════════════════════════════════════════
const state = { cart: [], cartOpen: false };

const cartBtn     = document.getElementById('cart-btn');
const cartCount   = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartClose   = document.getElementById('cart-close');
const cartItemsEl = document.getElementById('cart-items');
const cartEmpty   = document.getElementById('cart-empty');
const cartFooter  = document.getElementById('cart-footer');
const cartTotal   = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const toast       = document.getElementById('toast');

function openCart() {
  state.cartOpen = true;
  cartSidebar.classList.add('open');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  state.cartOpen = false;
  cartSidebar.classList.remove('open');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', () => state.cartOpen ? closeCart() : openCart());
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.cartOpen) closeCart(); });

function updateCartBadge() {
  const total = state.cart.reduce((acc, i) => acc + i.qty, 0);
  cartCount.textContent = total;
  cartCount.classList.toggle('visible', total > 0);
}

function renderCart() {
  updateCartBadge();
  const empty = state.cart.length === 0;
  cartEmpty.style.display = empty ? 'flex' : 'none';
  cartFooter.style.display = empty ? 'none' : 'block';

  cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

  state.cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div style="flex:1">
        <div class="cart-item-name">${item.name}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span class="qty-count">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
          <span class="cart-item-price">£${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">✕</button>
    `;
    cartItemsEl.appendChild(div);
  });

  const total = state.cart.reduce((acc, i) => acc + i.price * i.qty, 0);
  cartTotal.textContent = `£${total.toFixed(2)}`;
}

function addToCart(id, name, price) {
  const existing = state.cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id, name, price: parseFloat(price), qty: 1 });
  renderCart();
  showToast('✓ Added to cart!');
}

cartItemsEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-action], .cart-item-remove');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains('cart-item-remove')) {
    state.cart = state.cart.filter(i => i.id !== id);
  } else {
    const item = state.cart.find(i => i.id === id);
    if (item) {
      if (btn.dataset.action === 'inc') item.qty++;
      if (btn.dataset.action === 'dec') {
        item.qty--;
        if (item.qty <= 0) state.cart = state.cart.filter(i => i.id !== id);
      }
    }
  }
  renderCart();
});

document.querySelectorAll('.btn-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const { id, name, price } = btn.dataset;
    addToCart(id, name, price);
    btn.classList.add('adding');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Added!';
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('adding'); }, 1200);
  });
});

document.querySelectorAll('.overlay-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    addToCart(btn.dataset.id, btn.dataset.name, btn.dataset.price);
    btn.textContent = '✓ Added!';
    setTimeout(() => { btn.textContent = 'Quick Add'; }, 1200);
  });
});

checkoutBtn.addEventListener('click', () => {
  showToast('🚀 Redirecting to checkout...');
  setTimeout(closeCart, 900);
});

// ══════════════════════════════════════════════
// 7. TOAST
// ══════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ══════════════════════════════════════════════
// 8. SCROLL ANIMATIONS (non-hero sections)
// ══════════════════════════════════════════════
const observeEls = document.querySelectorAll(
  '.product-card, .section-header, .promo-inner, .about-text, .about-visual, .pillar, .footer-inner > *'
);

observeEls.forEach((el, i) => {
  el.classList.add('observe');
  if (i % 4 === 1) el.classList.add('delay-1');
  if (i % 4 === 2) el.classList.add('delay-2');
  if (i % 4 === 3) el.classList.add('delay-3');
});

const scrollObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      scrollObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

observeEls.forEach(el => scrollObserver.observe(el));

// ── INIT
renderCart();
console.info('%cSoleElite 👟', 'color: #d4af37; font-size: 22px; font-weight: 900;');
