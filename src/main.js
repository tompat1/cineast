import Lenis from 'lenis';
import { initFilmicMotion } from './motion.js';
import { startPreloader } from './preloader.js';
import { initSearch, closeGlobalSearchPanel } from './search.js';
import { setupAccountDrawer, closeAccountDrawer } from './admin-panel.js';
import { setupCustomerDrawer } from './customer-drawer.js';

// Initialize Lenis for smooth scrolling
export const lenis = new Lenis({
  autoRaf: true,
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});

// Stop scrolling initially for preloader
lenis.stop();

// Theme Dropdown (Noir / Blanco / System)
const themeDropdownContainer = document.getElementById('theme-dropdown');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeDropdownItems = document.querySelectorAll('.theme-dropdown-item');
const themeText = document.querySelector('.theme-text');
const rootElement = document.documentElement;
const heroImage = document.querySelector('.hero-image');
const loaderImage = document.querySelector('.loader-bg img');
const brandBgImage = document.querySelector('.brand-bg img');

function getRenderedTheme(mode) {
  return mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noir' : 'blanco')
    : mode;
}

function updateThemeIcons(renderedTheme) {
  const moonIcon = document.querySelector('.theme-icon-moon');
  const sunIcon = document.querySelector('.theme-icon-sun');
  if (!moonIcon || !sunIcon) return;

  if (window.innerWidth <= 1024) {
    moonIcon.style.display = renderedTheme === 'blanco' ? 'block' : 'none';
    sunIcon.style.display = renderedTheme === 'noir' ? 'block' : 'none';
    return;
  }

  sunIcon.style.display = renderedTheme === 'blanco' ? 'block' : 'none';
  moonIcon.style.display = renderedTheme === 'blanco' ? 'none' : 'block';
}

// Dropdown Toggle Logic
if (themeToggleBtn && themeDropdownContainer) {
  themeToggleBtn.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      e.stopPropagation();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'noir';
      const newTheme = currentTheme === 'noir' ? 'blanco' : 'noir';
      applyTheme(newTheme);
      return;
    }
    e.stopPropagation();
    themeDropdownContainer.classList.toggle('open');
  });
  
  document.addEventListener('click', (e) => {
    if (!themeDropdownContainer.contains(e.target)) {
      themeDropdownContainer.classList.remove('open');
    }
  });
}

function applyTheme(mode) {
  localStorage.setItem('theme', mode);
  
  themeDropdownItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-theme-value') === mode) {
      item.classList.add('active');
    }
  });
  
  const renderedTheme = getRenderedTheme(mode);
  
  if (themeText) {
    themeText.textContent = `FILM - ${mode.toUpperCase()}`;
  }
  
  const statusTextEl = document.getElementById('hero-status-text');
  
  updateThemeIcons(renderedTheme);
  
  if (statusTextEl) {
    statusTextEl.textContent = renderedTheme === 'blanco' ? 'SHOT IN DAYLIGHT' : 'SHOT IN LOW LIGHT';
  }
  
  rootElement.setAttribute('data-theme', renderedTheme);
  
  if (heroImage) {
    heroImage.src = renderedTheme === 'blanco' 
      ? '/assets/images/hero_background_blanco.webp' 
      : '/assets/images/hero_background.webp';
  }
  if (loaderImage) {
    loaderImage.src = renderedTheme === 'blanco'
      ? '/assets/images/projector_beam_blanco.webp'
      : '/assets/images/projector_beam.webp';
  }
  if (brandBgImage) {
    brandBgImage.src = renderedTheme === 'blanco'
      ? '/assets/images/brand_statement_bg_blanco.webp'
      : '/assets/images/brand_statement_bg_noir.webp';
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('theme') === 'system') {
    applyTheme('system');
  }
});

themeDropdownItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const mode = item.getAttribute('data-theme-value');
    applyTheme(mode);
    themeDropdownContainer.classList.remove('open');
  });
});

// --- Mock Cart Logic ---
let cart = [];
let cartLink = null;
let cartLabel = null;
let cartDrawer = null;
let cartDrawerCloseBtn = null;
let cartDrawerContent = null;
let cartSubtotalPriceEl = null;
let cartCheckoutBtn = null;
let cartDrawerFooter = null;
let cartToast = null;

function initCart() {
  cartLink = document.querySelector('.cart-link');
  cartLabel = document.querySelector('.cart-label');
  cartDrawer = document.getElementById('cart-drawer');
  cartDrawerCloseBtn = document.getElementById('cart-drawer-close');
  cartDrawerContent = document.getElementById('cart-drawer-content');
  cartSubtotalPriceEl = document.getElementById('cart-subtotal-price');
  cartCheckoutBtn = document.getElementById('cart-checkout-btn');
  cartDrawerFooter = document.getElementById('cart-drawer-footer');
  cartToast = document.getElementById('cart-toast');

  const savedCart = localStorage.getItem('cineast_cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
  
  updateCartUI();

  cartLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openCartDrawer();
  });

  cartDrawerCloseBtn?.addEventListener('click', () => {
    closeCartDrawer();
  });

  cartCheckoutBtn?.addEventListener('click', () => {
    showCartToast('CHECKOUT SUCCESSFUL! THANK YOU.');
    cart = [];
    saveCart();
    updateCartUI();
    setTimeout(() => {
      closeCartDrawer();
    }, 1200);
  });

  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      
      const title = card.querySelector('.product-title')?.textContent.trim() || 'Product';
      const priceText = card.querySelector('.product-price')?.textContent.trim() || '$0.00';
      const price = parseFloat(priceText.replace('$', '')) || 0;
      const imgUrl = card.querySelector('img')?.getAttribute('src') || '';
      
      addToCart({ title, price, imgUrl });
    });
  });
}

function openCartDrawer() {
  closeDrawer();
  closeAccountDrawer();
  
  if (mobileMenu) {
    mobileMenu.classList.remove('active');
  }
  
  if (cartDrawer) {
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
  }
  
  setSharedDrawerOverlay(true);
  document.body.style.overflow = 'hidden';
  lenis.stop();
  renderCart();
}

function closeCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
  }
  
  const journalDrawer = document.getElementById('journal-drawer');
  const accountDrawer = document.getElementById('account-drawer');
  if (!journalDrawer?.classList.contains('open') && !accountDrawer?.classList.contains('open')) {
    setSharedDrawerOverlay(false);
    document.body.style.overflow = '';
    lenis.start();
  }
}

function saveCart() {
  localStorage.setItem('cineast_cart', JSON.stringify(cart));
}

function addToCart(product) {
  const id = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const existingItem = cart.find(item => item.id === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id,
      title: product.title,
      price: product.price,
      imgUrl: product.imgUrl,
      quantity: 1
    });
  }
  
  saveCart();
  updateCartUI();
  showCartToast(`ADDED TO CART: ${product.title}`);
  
  setTimeout(() => {
    openCartDrawer();
  }, 350);
}

function updateCartQuantity(id, delta) {
  const item = cart.find(item => item.id === id);
  if (!item) return;
  
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  
  saveCart();
  updateCartUI();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
  renderCart();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartLabel) {
    cartLabel.textContent = `(${totalCount})`;
  }
}

function initShopLinks() {
  const shopSection = document.getElementById('shop');
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const filterLinks = Array.from(document.querySelectorAll('.filter-link[data-filter]'));
  const shopFilterTriggers = Array.from(document.querySelectorAll('a[data-filter]'));

  if (!shopSection || !productCards.length) return;

  const normalizeFilter = (value) => String(value || 'ALL').trim().toUpperCase();

  const applyShopFilter = (filterValue) => {
    const filter = normalizeFilter(filterValue);

    productCards.forEach((card) => {
      const category = normalizeFilter(card.dataset.shopCategory);
      const status = normalizeFilter(card.dataset.shopStatus);
      const shouldShow = filter === 'ALL'
        || category === filter
        || status === filter;
      card.hidden = !shouldShow;
    });

    filterLinks.forEach((link) => {
      link.classList.toggle('active', normalizeFilter(link.dataset.filter) === filter);
    });
  };

  shopFilterTriggers.forEach((link) => {
    link.addEventListener('click', () => {
      applyShopFilter(link.dataset.filter);
    });
  });

  applyShopFilter('ALL');
}

function renderCart() {
  if (!cartDrawerContent) return;
  
  if (cart.length === 0) {
    cartDrawerContent.innerHTML = '<div class="empty-cart-message">YOUR CART IS EMPTY.</div>';
    if (cartDrawerFooter) cartDrawerFooter.style.display = 'none';
    return;
  }
  
  if (cartDrawerFooter) cartDrawerFooter.style.display = 'flex';
  
  let html = '';
  let subtotal = 0;
  
  cart.forEach((item) => {
    const totalItemPrice = item.price * item.quantity;
    subtotal += totalItemPrice;
    
    html += `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item-img" src="${escapeHtml(item.imgUrl)}" alt="${escapeHtml(item.title)}" />
        <div class="cart-item-info">
          <h4 class="cart-item-title">${escapeHtml(item.title)}</h4>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="cart-item-meta">
            <div class="cart-item-quantity">
              <button class="quantity-btn dec-qty-btn" data-id="${item.id}">-</button>
              <span class="quantity-num">${item.quantity}</span>
              <button class="quantity-btn inc-qty-btn" data-id="${item.id}">+</button>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">REMOVE</button>
          </div>
        </div>
      </div>
    `;
  });
  
  cartDrawerContent.innerHTML = html;
  if (cartSubtotalPriceEl) {
    cartSubtotalPriceEl.textContent = `$${subtotal.toFixed(2)}`;
  }
  
  cartDrawerContent.querySelectorAll('.dec-qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateCartQuantity(id, -1);
    });
  });

  cartDrawerContent.querySelectorAll('.inc-qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateCartQuantity(id, 1);
    });
  });

  cartDrawerContent.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      removeFromCart(id);
    });
  });
}

function showCartToast(text) {
  if (!cartToast) return;
  cartToast.textContent = text;
  cartToast.classList.add('show');
  
  setTimeout(() => {
    cartToast.classList.remove('show');
  }, 2200);
}

// Nav Scroll State
const nav = document.getElementById('main-nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('solid');
  } else {
    nav.classList.remove('solid');
  }
});

// Back to Top Logic
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  lenis.scrollTo(0, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
});

// Mobile Menu Logic
const openMenuBtn = document.getElementById('open-mobile-menu');
const closeMenuBtn = document.getElementById('close-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.close-on-click');

if (openMenuBtn && closeMenuBtn && mobileMenu) {
  openMenuBtn.addEventListener('click', () => {
    closeDrawer();
    closeAccountDrawer();
    mobileMenu.classList.add('active');
    lenis.stop();
  });

  closeMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    lenis.start();
  });

  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      lenis.start();
    });
  });
}

// Lightning Effect Logic
const lightningFrames = document.querySelectorAll('.lightning-frame');
let lightningTimeout;

function triggerLightning() {
  if (document.documentElement.getAttribute('data-theme') === 'blanco') {
    lightningTimeout = setTimeout(triggerLightning, 2000);
    return;
  }

  const sequence = [
    { frame: 1, duration: 60 },
    { frame: 2, duration: 100 },
    { frame: 3, duration: 250 },
    { frame: 2, duration: 80 },
    { frame: 4, duration: 120 }
  ];

  let delay = 0;
  
  sequence.forEach(step => {
    setTimeout(() => {
      lightningFrames.forEach(f => f.style.opacity = '0');
      const frameEl = document.getElementById(`lf-${step.frame}`);
      if (frameEl) frameEl.style.opacity = '1';
    }, delay);
    
    delay += step.duration;
  });

  setTimeout(() => {
    lightningFrames.forEach(f => f.style.opacity = '0');
  }, delay + 50);

  const nextTime = Math.random() * 10000 + 5000;
  lightningTimeout = setTimeout(triggerLightning, nextTime);
}

if (lightningFrames.length > 0) {
  lightningTimeout = setTimeout(triggerLightning, 3000);
}

// Live Clock — Hero Metadata Bar
const heroClockEl = document.getElementById('hero-live-clock');
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function updateHeroClock() {
  if (!heroClockEl) return;
  const now = new Date();
  const day = DAYS[now.getDay()];
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, '0');
  heroClockEl.textContent = `${day} ${hh}:${minutes}:${seconds} ${ampm}`;
}

updateHeroClock();
setInterval(updateHeroClock, 1000);

// Geolocation — Hero Metadata Bar
const heroLocationEl = document.getElementById('hero-location');

async function updateHeroLocation() {
  if (!heroLocationEl) return;
  
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      if (data.city && data.country_code) {
        let locationString = `${data.city.toUpperCase()}, ${data.country_code}`;
        if (data.latitude !== undefined && data.longitude !== undefined) {
          const lat = parseFloat(data.latitude).toFixed(4);
          const lon = parseFloat(data.longitude).toFixed(4);
          const latDir = lat >= 0 ? 'N' : 'S';
          const lonDir = lon >= 0 ? 'E' : 'W';
          locationString += ` / ${Math.abs(lat)}° ${latDir}, ${Math.abs(lon)}° ${lonDir}`;
        }
        heroLocationEl.textContent = locationString;
        return;
      }
    }
  } catch (error) {
    console.warn("IP Geolocation failed, will fallback to browser coords if permitted.", error);
  }
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        heroLocationEl.textContent = `${Math.abs(lat)}° ${latDir}, ${Math.abs(lon)}° ${lonDir}`;
      },
      () => {
        heroLocationEl.textContent = "LOCATION UNKNOWN";
      }
    );
  }
}

updateHeroLocation();

// --- Journal Drawer Logic ---
const drawer = document.getElementById('journal-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const drawerCloseBtn = document.getElementById('drawer-close');
const drawerContent = document.getElementById('drawer-content');
const drawerMeta = document.getElementById('drawer-meta');
const drawerPrevBtn = document.getElementById('drawer-prev');
const drawerNextBtn = document.getElementById('drawer-next');

export let articlesData = null;
export let currentArticleIndex = null;

export async function fetchArticles() {
  if (articlesData) return articlesData;
  try {
    const response = await fetch('/data/articles.json?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to fetch articles');
    articlesData = await response.json();
    articlesData.forEach((item, idx) => {
      item.localIndex = idx;
    });
    return articlesData;
  } catch (error) {
    console.error('Error loading articles:', error);
    return null;
  }
}

export let journalData = null;

export async function fetchJournalEntries() {
  if (journalData) return journalData;
  try {
    const response = await fetch('/data/journal.json?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    journalData = await response.json();
    return journalData;
  } catch (error) {
    console.error('Error loading journal entries:', error);
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setSharedDrawerOverlay(isOpen) {
  if (!drawerOverlay) return;
  drawerOverlay.classList.toggle('open', isOpen);
  drawerOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function extractOriginalLink(text) {
  const match = String(text || '').match(/Original Link:\s*(https?:\/\/[^\s<]+)/i);
  return match ? match[1] : '';
}

function parseMarkdown(text) {
  let html = text;
  html = html.replace(/!\[([^\]]*)\]\((.*?)\)/g, (_, alt, src) => {
    const safeAlt = escapeHtml(alt);
    const safeSrc = escapeHtml(src);
    const caption = safeAlt ? `<figcaption>${safeAlt}</figcaption>` : '';
    return `<figure class="article-image-figure"><img src="${safeSrc}" alt="${safeAlt}" />${caption}</figure>`;
  });
  html = html.replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/gi, '<a href="$1" target="_blank" class="utility-link" style="display:inline-block; margin-top: 20px; font-weight: 500;">VIEW ORIGINAL POST &rarr;</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    const inner = p.replace(/\n/g, '<br>');
    if (inner.trim().startsWith('<figure')) return inner;
    return `<p>${inner}</p>`;
  }).join('');
  
  return html;
}

async function renderDrawerContent(index) {
  const articles = await fetchArticles();
  if (!articles) return;
  
  const article = articles[index];
  if (!article) return;
  
  const rawText = article.raw_text;
  let title = "Archive Photo";
  let bodyText = rawText;
  
  const boldTitleMatch = rawText.match(/^\*\*([^*]+)\*\*/);
  if (boldTitleMatch) {
    title = boldTitleMatch[1];
    bodyText = rawText.replace(/^\*\*([^*]+)\*\*\s*/, '');
  } else {
    const cleanText = rawText.replace(/!\[.*?\]\(.*?\)/g, '').replace(/Original Link:.*/, '').trim();
    const words = cleanText.split(/\s+/);
    if (words.length > 0 && words[0] !== "") {
      title = words.slice(0, 8).join(' ') + (words.length > 8 ? "..." : "");
    }
  }
  
  let originalLink = article.original_link || extractOriginalLink(rawText);
  if (originalLink) {
    bodyText = bodyText.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/i, '');
  }

  let featureImageHtml = '';
  if (article.feature_image) {
    if (!bodyText.includes(article.feature_image)) {
      featureImageHtml = `<img src="${article.feature_image}" alt="Feature Image" style="width: 100%; height: auto; display: block; margin-bottom: 2rem; border-radius: 8px;">`;
    }
  }

  const entryNum = articles.length - index;
  if (drawerMeta) {
    drawerMeta.textContent = `ARCHIVE ENTRY ${String(entryNum).padStart(3, '0')} / ${article.date_display}`;
  }
  
  if (drawerContent) {
    let linkHtml = '';
    if (originalLink) {
      const safeOriginalLink = escapeHtml(originalLink);
      linkHtml = `<a href="${safeOriginalLink}" target="_blank" rel="noopener noreferrer" class="drawer-original-link">VIEW ORIGINAL POST &rarr;</a>`;
    }

    drawerContent.innerHTML = `
      <div class="drawer-article-header">
        <h2 class="drawer-article-title">${title}</h2>
        ${linkHtml}
      </div>
      <div class="drawer-article-body">
        ${featureImageHtml}
        ${parseMarkdown(bodyText)}
      </div>
    `;
  }
  
  if (drawerPrevBtn) drawerPrevBtn.disabled = index === 0;
  if (drawerNextBtn) drawerNextBtn.disabled = index === articles.length - 1;
}

export async function openDrawer(index) {
  currentArticleIndex = index;
  closeAccountDrawer();
  
  if (drawerContent) {
    drawerContent.innerHTML = '<div style="opacity: 0.5; padding-top: 2rem;">Loading...</div>';
  }
  
  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (drawerOverlay) {
    drawerOverlay.classList.add('open');
    drawerOverlay.setAttribute('aria-hidden', 'false');
  }
  
  document.body.style.overflow = 'hidden';
  lenis.stop();
  await renderDrawerContent(index);
}

export function closeDrawer() {
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (drawerOverlay) {
    const accountDrawer = document.getElementById('account-drawer');
    if (!accountDrawer?.classList.contains('open')) {
      drawerOverlay.classList.remove('open');
      drawerOverlay.setAttribute('aria-hidden', 'true');
    }
  }
  const accountDrawer = document.getElementById('account-drawer');
  if (!accountDrawer?.classList.contains('open')) {
    document.body.style.overflow = '';
    lenis.start();
  }
}

// Shorts Carousel Drag to Scroll & Auto-Scroll
const carouselContainer = document.querySelector('.shorts-carousel-container');
let isDown = false;
let startX;
let scrollLeft;
let isDragging = false;
let isHovering = false;
let exactScroll = 0;
let autoScrollRAF;

if (carouselContainer) {
  const scrollSpeed = 0.5;

  function autoScroll() {
    const track = document.getElementById('shorts-track');
    if (track && track.style.display === 'none') {
      autoScrollRAF = requestAnimationFrame(autoScroll);
      return;
    }

    if (!isDown && !isHovering) {
      exactScroll += scrollSpeed;
      carouselContainer.scrollLeft = exactScroll;
    } else {
      exactScroll = carouselContainer.scrollLeft;
    }
    
    const midPoint = (carouselContainer.scrollWidth - 24) / 2;
    
    if (carouselContainer.scrollLeft >= midPoint) {
      exactScroll -= midPoint;
      carouselContainer.scrollLeft = exactScroll;
    } else if (carouselContainer.scrollLeft <= 0 && isDown) {
      exactScroll += midPoint;
      carouselContainer.scrollLeft = exactScroll;
    }
    
    autoScrollRAF = requestAnimationFrame(autoScroll);
  }

  autoScrollRAF = requestAnimationFrame(autoScroll);

  carouselContainer.addEventListener('mouseenter', () => {
    isHovering = true;
  });

  carouselContainer.addEventListener('mouseleave', () => {
    isHovering = false;
    isDown = false;
    carouselContainer.style.cursor = 'grab';
  });

  carouselContainer.addEventListener('mousedown', (e) => {
    isDown = true;
    isDragging = false;
    carouselContainer.style.cursor = 'grabbing';
    startX = e.pageX - carouselContainer.offsetLeft;
    scrollLeft = carouselContainer.scrollLeft;
    exactScroll = scrollLeft;
  });

  carouselContainer.addEventListener('mouseup', () => {
    isDown = false;
    carouselContainer.style.cursor = 'grab';
  });

  carouselContainer.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carouselContainer.offsetLeft;
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 5) {
      isDragging = true;
    }
    
    exactScroll = scrollLeft - walk;
    carouselContainer.scrollLeft = exactScroll;
  });
  
  carouselContainer.addEventListener('touchstart', () => {
    isDragging = false;
    isDown = true;
  }, { passive: true });
  
  carouselContainer.addEventListener('touchmove', () => {
    isDragging = true;
  }, { passive: true });
  
  carouselContainer.addEventListener('touchend', () => {
    isDown = false;
  });
}

// Event Listeners
document.querySelectorAll('.short-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    if (isDragging) {
      setTimeout(() => { isDragging = false; }, 50);
      return; 
    }
    const indexAttr = card.getAttribute('data-index');
    if (indexAttr !== null) {
      openDrawer(parseInt(indexAttr, 10));
    }
  });
});

// Delegate dynamic search result drawer clicks globally
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.search-result-drawer-trigger');
  if (trigger) {
    e.preventDefault();
    const indexAttr = trigger.getAttribute('data-index');
    if (indexAttr !== null && indexAttr !== 'undefined' && indexAttr !== 'null') {
      const index = parseInt(indexAttr, 10);
      if (!isNaN(index) && index >= 0) {
        openDrawer(index);
      }
    }
  }
});

drawerCloseBtn?.addEventListener('click', closeDrawer);
drawerOverlay?.addEventListener('click', () => {
  closeDrawer();
  closeAccountDrawer();
  closeCartDrawer();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (
    drawer?.classList.contains('open') ||
    document.getElementById('account-drawer')?.classList.contains('open') ||
    cartDrawer?.classList.contains('open') ||
    document.getElementById('global-search-panel')?.classList.contains('open')
  )) {
    closeDrawer();
    closeAccountDrawer();
    closeCartDrawer();
    closeGlobalSearchPanel();
  }
});

drawerPrevBtn?.addEventListener('click', () => {
  if (currentArticleIndex > 0) {
    openDrawer(currentArticleIndex - 1);
  }
});

drawerNextBtn?.addEventListener('click', () => {
  if (articlesData && currentArticleIndex < articlesData.length - 1) {
    openDrawer(currentArticleIndex + 1);
  }
});

// Feed Filtering Logic
const filterBtns = document.querySelectorAll('.filter-btn');
const shortCards = document.querySelectorAll('.short-card');
let activeFilter = null;

filterBtns.forEach(btn => {
  if (btn.classList.contains('active')) {
    activeFilter = btn.getAttribute('data-filter');
  }
});

function applyFilter() {
  shortCards.forEach(card => {
    if (activeFilter === null) {
      card.style.display = '';
    } else {
      const platform = card.getAttribute('data-platform');
      if (platform === activeFilter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    }
  });
}

applyFilter();

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');
    if (activeFilter === filter) {
      activeFilter = null;
      btn.classList.remove('active');
    } else {
      activeFilter = filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    applyFilter();
  });
});

// Bootstrap logic
const savedTheme = localStorage.getItem('theme') || 'system';
applyTheme(savedTheme);
window.addEventListener('resize', () => {
  const currentMode = localStorage.getItem('theme') || 'system';
  updateThemeIcons(getRenderedTheme(currentMode));
});
initFilmicMotion(document);
initCart();
initShopLinks();

async function renderSceneStudies() {
  const container = document.getElementById('scene-studies-grid-container');
  if (!container) return;

  const entries = await fetchJournalEntries();
  if (!entries) return;

  const sceneStudies = entries.filter(entry => 
    (entry.tags && entry.tags.some(t => t.toLowerCase() === 'scene study')) || 
    (entry.form === 'scene study')
  );

  if (sceneStudies.length === 0) {
    container.innerHTML = '<p class="scene-featured-copy">No scene studies found.</p>';
    return;
  }

  const featured = sceneStudies[0];
  const sideStudies = sceneStudies.slice(1, 3);

  // Parse custom metadata for featured if needed.
  // We can extract things like "WATCH NEXT:" etc from the markdown.
  const extractMeta = (content, key) => {
    const regex = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*)`);
    const match = content.match(regex);
    return match ? match[1] : '';
  };

  const watchNext = extractMeta(featured.content, 'WATCH NEXT') || 'Not specified';
  const drink = extractMeta(featured.content, 'DRINK') || 'Not specified';
  const keepNear = extractMeta(featured.content, 'KEEP NEAR') || 'Not specified';
  const roomTone = extractMeta(featured.content, 'ROOM TONE') || 'Not specified';
  const bestWatched = extractMeta(featured.content, 'BEST WATCHED') || 'Not specified';

  const cleanLines = featured.content.split('\n').filter(line => !line.trim().startsWith('**'));
  const cleanContent = cleanLines.join('\n');
  const paragraphs = cleanContent.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const copyHtml = paragraphs.slice(0, 4).map(p => `<p class="scene-featured-copy">${p}</p>`).join('');

  const featuredHtml = `
    <a href="/article.html?id=${featured.slug || featured.id}" class="scene-featured" style="text-decoration: none; color: inherit; display: flex;">
      <div class="scene-featured-layout">
        <div class="scene-featured-img-col">
          <img src="${featured.image || ''}" alt="${featured.title}" class="scene-featured-img" />
        </div>
        <div class="scene-featured-text-col">
          <div class="scene-kicker">${featured.meta || 'SCENE STUDY'}</div>
          <h3 class="scene-featured-title">${featured.title}</h3>
          ${copyHtml}
          <div class="scene-read-more" style="margin-top: 20px; display: inline-block;">READ STUDY &rarr;</div>
        </div>
      </div>

      <div class="scene-specs-box">
        <div class="specs-left">
          <div class="specs-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 3h8v5a4 4 0 0 1-8 0V3z"></path><line x1="12" y1="8" x2="12" y2="21"></line><line x1="9" y1="21" x2="15" y2="21"></line></svg>
          </div>
          <div class="specs-label">AFTER<br>THE FILM</div>
          <div class="specs-meta">No. ${featured.id}</div>
          <div class="specs-meta">${featured.date || 'LATEST'}</div>
        </div>
        <div class="specs-list">
          <div class="spec-item">
            <span class="spec-name">WATCH NEXT:</span>
            <span>${watchNext}</span>
          </div>
          <div class="spec-item">
            <span class="spec-name">DRINK:</span>
            <span>${drink}</span>
          </div>
          <div class="spec-item">
            <span class="spec-name">KEEP NEAR:</span>
            <span>${keepNear}</span>
          </div>
          <div class="spec-item">
            <span class="spec-name">ROOM TONE:</span>
            <span>${roomTone}</span>
          </div>
          <div class="spec-item">
            <span class="spec-name">BEST WATCHED:</span>
            <span>${bestWatched}</span>
          </div>
        </div>
      </div>
    </a>
  `;

  let sideHtml = '';
  if (sideStudies.length > 0) {
    sideHtml = `
      <div class="scene-side-studies">
        ${sideStudies.map(study => `
          <a href="/article.html?id=${study.slug || study.id}" class="scene-card" style="text-decoration: none; color: inherit;">
            <img src="${study.image || ''}" alt="${study.title}" class="scene-card-img" />
            <div class="scene-card-content">
              <div class="scene-kicker">${study.meta || 'SCENE STUDY'}</div>
              <h4 class="scene-card-title">${study.title}</h4>
              <p class="scene-card-copy">${study.preamble || ''}</p>
              <div class="scene-read-more">READ STUDY &rarr;</div>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = featuredHtml + sideHtml;
  
  if (typeof initFilmicMotion === 'function') {
    initFilmicMotion(container);
  }
}

renderSceneStudies();

// Setup Sub-Modules
setupAccountDrawer();
setupCustomerDrawer();
initSearch();
startPreloader(lenis);
