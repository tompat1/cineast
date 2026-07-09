import Lenis from 'lenis';
import { initFilmicMotion } from './motion.js';
import { startPreloader } from './preloader.js';
import { initSearch, closeGlobalSearchPanel } from './search.js';
import { setupAccountDrawer, closeAccountDrawer } from './admin-panel.js';
import { setupCustomerDrawer } from './customer-drawer.js';
import { initMagnifier } from './magnifier.js';
import { initShopFilters } from './shop.js';
import { initNowShowing } from './now-showing.js';
import { listPages, syncJournalArticle, getPage, updatePage, createPage } from './cms-client.js';

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

  // Fetch overrides from D1 database
  let dbPages = [];
  try {
    const res = await listPages({ limit: 100 });
    dbPages = res?.pages || [];
  } catch (err) {
    console.warn('Failed to load database overrides for Scene Studies', err);
  }

  // Helper to merge database override with static data
  const mergeStudyWithOverride = (study) => {
    let slug = study.slug;
    if (!slug) {
      try {
        slug = syncJournalArticle(study).slug;
      } catch (e) {
        slug = `journal-ss-${study.id}`;
      }
    }
    const dbPage = dbPages.find(p => p.slug === slug || p.id === study.id);
    if (!dbPage) {
      return {
        ...study,
        image_position: '50% 50%',
        computed_slug: slug
      };
    }

    let imagePosition = '50% 50%';
    let preambleText = study.preamble || study.summary || '';
    if (dbPage.summary) {
      try {
        const parsedSummary = JSON.parse(dbPage.summary);
        if (parsedSummary && typeof parsedSummary === 'object') {
          preambleText = parsedSummary.preamble || dbPage.summary || preambleText;
          imagePosition = parsedSummary.image_position || imagePosition;
        }
      } catch (e) {
        preambleText = dbPage.summary;
      }
    }

    return {
      ...study,
      title: dbPage.title || study.title,
      meta: dbPage.meta || study.meta,
      image: dbPage.hero_image || study.image,
      preamble: preambleText,
      content: dbPage.content || study.content,
      image_position: imagePosition,
      computed_slug: slug
    };
  };

  const featured = mergeStudyWithOverride(sceneStudies[0]);
  const sideStudies = sceneStudies.slice(1, 3).map(mergeStudyWithOverride);

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
    <a href="/article.html?id=${featured.slug || featured.id}" class="scene-featured" data-id="${featured.id}" data-slug="${featured.computed_slug || ''}" style="text-decoration: none; color: inherit; display: flex;">
      <div class="scene-featured-layout">
        <div class="scene-featured-img-col">
          <img src="${featured.image || ''}" alt="${featured.title}" class="scene-featured-img" style="object-position: ${featured.image_position || '50% 50%'};" />
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
          <a href="/article.html?id=${study.slug || study.id}" class="scene-card" data-id="${study.id}" data-slug="${study.computed_slug || ''}" style="text-decoration: none; color: inherit;">
            <img src="${study.image || ''}" alt="${study.title}" class="scene-card-img" style="object-position: ${study.image_position || '50% 50%'};" />
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

  // Ensure admin align buttons are rendered/updated
  updateSceneStudiesAdminUI(sceneStudiesIsAdmin);
}

let sceneStudiesIsAdmin = false;
let activeAlignModal = null;

export function updateSceneStudiesAdminUI(isAdmin) {
  sceneStudiesIsAdmin = isAdmin;
  const container = document.getElementById('scene-studies-grid-container');
  if (!container) return;

  const cards = container.querySelectorAll('.scene-featured, .scene-card');
  cards.forEach((card) => {
    if (isAdmin) {
      card.classList.add('admin-editable');
      let editBtn = card.querySelector('.scene-card-edit-btn');
      if (!editBtn) {
        editBtn = document.createElement('button');
        editBtn.className = 'scene-card-edit-btn';
        editBtn.type = 'button';
        editBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          ALIGN
        `;
        editBtn.style.cssText = `
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(5,5,5,0.85);
          border: 1.5px solid #F2EEE8;
          color: #F2EEE8;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 1px;
          padding: 6px 12px;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        `;
        editBtn.addEventListener('mouseenter', () => {
          editBtn.style.background = '#F2EEE8';
          editBtn.style.color = '#050505';
        });
        editBtn.addEventListener('mouseleave', () => {
          editBtn.style.background = 'rgba(5,5,5,0.85)';
          editBtn.style.color = '#F2EEE8';
        });
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openSceneStudyAligner(card);
        });
        card.style.position = 'relative';
        card.appendChild(editBtn);
      }
    } else {
      card.classList.remove('admin-editable');
      const editBtn = card.querySelector('.scene-card-edit-btn');
      if (editBtn) editBtn.remove();
    }
  });
}

async function openSceneStudyAligner(card) {
  if (activeAlignModal) activeAlignModal.remove();

  const id = card.getAttribute('data-id');
  const slug = card.getAttribute('data-slug');
  const imgUrl = card.querySelector('img').src;

  const entries = await fetchJournalEntries();
  const studyData = entries.find(e => e.id === id || e.slug === slug);
  if (!studyData) return;

  const payloadSlug = slug || syncJournalArticle(studyData).slug;

  let existingPage = null;
  let imagePosition = '50% 50%';
  let preambleText = studyData.preamble || studyData.summary || '';

  try {
    const res = await getPage(payloadSlug);
    existingPage = res.page;
    if (existingPage && existingPage.summary) {
      try {
        const parsedSummary = JSON.parse(existingPage.summary);
        if (parsedSummary && typeof parsedSummary === 'object') {
          preambleText = parsedSummary.preamble || existingPage.summary || preambleText;
          imagePosition = parsedSummary.image_position || imagePosition;
        }
      } catch (e) {
        preambleText = existingPage.summary;
      }
    }
  } catch (err) {
    if (err.status !== 404) {
      console.warn('Failed to load page override from database', err);
    }
  }

  const posParts = imagePosition.split(' ');
  let currentXPercent = parseInt(posParts[0]) || 50;
  let currentYPercent = parseInt(posParts[1] || posParts[0]) || 50;

  const modal = document.createElement('div');
  modal.className = 'now-showing-editor-modal';
  modal.id = 'scene-study-align-modal';
  modal.setAttribute('data-lenis-prevent', 'true');

  modal.innerHTML = `
    <div class="ns-modal-overlay"></div>
    <div class="ns-modal-container" style="max-width: 480px;">
      <div class="ns-modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px;">
        <div>
          <div class="ns-modal-kicker">CMS / ALIGN CARD IMAGE</div>
          <h3 class="ns-modal-title" style="font-size: 1.25rem;">${escapeHtml(studyData.title)}</h3>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <button type="submit" form="ss-align-form" class="ns-btn primary" id="ss-save-btn" style="width: auto; padding: 6px 16px; font-family: var(--font-mono); font-size: 0.65rem; border-radius: 0; line-height: 1.2;">SAVE CHANGES</button>
          <button type="button" class="ns-modal-close" id="ss-modal-close-btn">&times;</button>
        </div>
      </div>
      
      <div class="ns-modal-body" style="grid-template-columns: 1fr; gap: 20px; padding: 24px;">
        <form id="ss-align-form">
          <div class="ns-field" style="margin-bottom: 12px;">
            <label>IMAGE ALIGNMENT (DRAG IMAGE OR USE SLIDERS)</label>
            <div class="ns-image-preview-container" id="ss-preview-container" style="position: relative; width: 100%; height: 220px; overflow: hidden; border: 1px solid rgba(242,238,232,0.16); background: #050505; cursor: move; user-select: none;">
              <img id="ss-preview-img" src="${escapeHtml(imgUrl)}" style="width: 100%; height: 100%; object-fit: cover; object-position: ${currentXPercent}% ${currentYPercent}%; pointer-events: none;" />
              <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(5,5,5,0.72); padding: 4px 8px; font-family: var(--font-mono); font-size: 0.55rem; color: var(--color-silver-reel); pointer-events: none; letter-spacing: 1px;">DRAG IN ANY DIRECTION</div>
            </div>
          </div>
          
          <div class="ns-field" style="margin-bottom: 12px;">
            <label>HORIZONTAL ALIGNMENT (X-AXIS)</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="range" id="ss-x-slider" min="0" max="100" value="${currentXPercent}" style="flex: 1; cursor: ew-resize;" />
              <span id="ss-x-value" style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); min-width: 32px;">${currentXPercent}%</span>
            </div>
          </div>

          <div class="ns-field" style="margin-bottom: 12px;">
            <label>VERTICAL ALIGNMENT (Y-AXIS)</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="range" id="ss-y-slider" min="0" max="100" value="${currentYPercent}" style="flex: 1; cursor: ew-resize;" />
              <span id="ss-y-value" style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); min-width: 32px;">${currentYPercent}%</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  activeAlignModal = modal;
  document.body.style.overflow = 'hidden';

  const closeBtn = modal.querySelector('#ss-modal-close-btn');
  const overlay = modal.querySelector('.ns-modal-overlay');

  function closeModal() {
    modal.remove();
    activeAlignModal = null;
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  const previewContainer = modal.querySelector('#ss-preview-container');
  const previewImg = modal.querySelector('#ss-preview-img');
  const xSlider = modal.querySelector('#ss-x-slider');
  const ySlider = modal.querySelector('#ss-y-slider');
  const xValText = modal.querySelector('#ss-x-value');
  const yValText = modal.querySelector('#ss-y-value');

  function updatePosition(xPercent, yPercent) {
    currentXPercent = Math.max(0, Math.min(100, xPercent));
    currentYPercent = Math.max(0, Math.min(100, yPercent));
    xSlider.value = currentXPercent;
    ySlider.value = currentYPercent;
    xValText.textContent = currentXPercent + '%';
    yValText.textContent = currentYPercent + '%';
    if (previewImg) {
      previewImg.style.objectPosition = `${currentXPercent}% ${currentYPercent}%`;
    }
  }

  xSlider.addEventListener('input', (e) => {
    updatePosition(e.target.value, currentYPercent);
  });

  ySlider.addEventListener('input', (e) => {
    updatePosition(currentXPercent, e.target.value);
  });

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startXPercent = 0;
  let startYPercent = 0;

  previewContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startXPercent = currentXPercent;
    startYPercent = currentYPercent;
    previewContainer.style.cursor = 'move';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const width = previewContainer.offsetWidth || 320;
    const height = previewContainer.offsetHeight || 220;
    const deltaXPercent = Math.round((deltaX / width) * 100);
    const deltaYPercent = Math.round((deltaY / height) * 100);
    updatePosition(startXPercent + deltaXPercent, startYPercent + deltaYPercent);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      previewContainer.style.cursor = 'move';
    }
  });

  const form = modal.querySelector('#ss-align-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = modal.querySelector('#ss-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

    const finalPosition = `${currentXPercent}% ${currentYPercent}%`;
    const summaryPayload = JSON.stringify({
      preamble: preambleText,
      image_position: finalPosition
    });

    try {
      if (existingPage) {
        const payload = {
          title: existingPage.title,
          meta: existingPage.meta,
          content: existingPage.content,
          hero_image: existingPage.hero_image,
          kind: 'journal',
          status: existingPage.status || 'published',
          auto_enrich: false,
          summary: summaryPayload
        };
        await updatePage(payloadSlug, payload);
      } else {
        const payload = {
          id: studyData.id,
          slug: payloadSlug,
          title: studyData.title,
          meta: studyData.meta,
          content: studyData.content,
          hero_image: studyData.image,
          kind: 'journal',
          status: 'published',
          auto_enrich: false,
          summary: summaryPayload
        };
        await createPage(payload);
      }

      import('./admin-panel.js').then((m) => {
        m.showToast('Image alignment saved successfully!', 'success', { title: 'Aligned' });
      });

      await renderSceneStudies();
      closeModal();
    } catch (error) {
      console.error('Failed to save image alignment:', error);
      alert(error.message || 'Failed to save changes.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'SAVE CHANGES';
    }
  });
}

renderSceneStudies();

// Setup Sub-Modules
setupAccountDrawer();
setupCustomerDrawer();
initSearch();
initMagnifier();
initShopFilters();
initNowShowing();
startPreloader(lenis);
