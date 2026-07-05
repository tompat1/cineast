import Lenis from 'lenis';

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
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

// Dropdown Toggle Logic
if (themeToggleBtn && themeDropdownContainer) {
  themeToggleBtn.addEventListener('click', (e) => {
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
  
  // Update Active state in dropdown
  themeDropdownItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-theme-value') === mode) {
      item.classList.add('active');
    }
  });
  
  // Determine actual rendered theme
  let renderedTheme = mode;
  if (mode === 'system') {
    renderedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noir' : 'blanco';
    console.log("System theme detection:", renderedTheme, "matches dark?", window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  
  // Update UI Text
  if (themeText) {
    themeText.textContent = `FILM - ${mode.toUpperCase()}`;
  }
  
  const moonIcon = document.querySelector('.theme-icon-moon');
  const sunIcon = document.querySelector('.theme-icon-sun');
  const statusTextEl = document.getElementById('hero-status-text');
  
  if (moonIcon && sunIcon) {
    // Show sun in Blanco, moon in Noir
    sunIcon.style.display = renderedTheme === 'blanco' ? 'block' : 'none';
    moonIcon.style.display = renderedTheme === 'blanco' ? 'none' : 'block';
  }
  
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
      : '/assets/images/brand_statement_bg.webp';
  }
}

// Listen to OS theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('theme') === 'system') {
    applyTheme('system');
  }
});

// Item Clicks
themeDropdownItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const mode = item.getAttribute('data-theme-value');
    applyTheme(mode);
    themeDropdownContainer.classList.remove('open');
  });
});

// Init
const savedTheme = localStorage.getItem('theme') || 'system';
applyTheme(savedTheme);

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
    mobileMenu.classList.add('active');
    lenis.stop();
  });

  closeMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    lenis.start();
  });

  // Close menu when clicking a link
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      lenis.start();
    });
  });
}


// Preloader logic
const imagesToLoad = [
  '/assets/images/hero_background.webp',
  '/assets/images/hero_background_blanco.webp',
  '/assets/images/hero_background_nero_flash1.webp',
  '/assets/images/hero_background_nero_flash2.webp',
  '/assets/images/hero_background_nero_flash3.webp',
  '/assets/images/hero_background_nero_flash4.webp',
  '/assets/images/projector_beam.webp',
  '/assets/images/projector_beam_blanco.webp',
  '/assets/images/brand_statement_bg.webp',
  '/assets/images/brand_statement_bg_blanco.webp',
  '/assets/images/cineast_bg1.webp',
  '/assets/images/cineast_bg2.webp',
  '/assets/images/journal_feature.webp',
  '/assets/images/journal_film.webp',
  '/assets/images/journal_room.webp',
  '/assets/images/journal_street.webp'
];

let loadedCount = 0;
const totalImages = imagesToLoad.length;
const progressBar = document.getElementById('loader-progress');
const statusText = document.getElementById('loader-status');
const loadingScreen = document.getElementById('loading-screen');

function updateProgress(src) {
  loadedCount++;
  const percentage = (loadedCount / totalImages) * 100;
  progressBar.style.width = `${percentage}%`;
  
  // Extract filename for display
  const filename = src.split('/').pop();
  statusText.textContent = `Loading: ${filename}`;

  if (loadedCount === totalImages) {
    statusText.textContent = 'Ready.';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      // allow scroll after loading
      lenis.start();
    }, 800); // Small delay to let the user see 100%
  }
}

// Lock scroll during loading
// Skip loader ONLY if navigating back from an article page
if (document.referrer && document.referrer.includes('article.html')) {
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  lenis.start();
} else {
  imagesToLoad.forEach(src => {
    const img = new Image();
    img.onload = () => updateProgress(src);
    img.onerror = () => updateProgress(src); // Handle error to prevent freezing
    
    // Add a slight artificial delay to make the loader visible for longer 
    // since local loading is almost instant
    setTimeout(() => {
      img.src = src;
    }, Math.random() * 1500 + 500); 
  });
}

// Lightning Effect Logic
const lightningFrames = document.querySelectorAll('.lightning-frame');
let lightningTimeout;

function triggerLightning() {
  // Only trigger if in noir theme
  if (document.documentElement.getAttribute('data-theme') === 'blanco') {
    // Check again later
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
      // Hide all
      lightningFrames.forEach(f => f.style.opacity = '0');
      // Show current
      const frameEl = document.getElementById(`lf-${step.frame}`);
      if (frameEl) frameEl.style.opacity = '1';
    }, delay);
    
    delay += step.duration;
  });

  // Reset to dark
  setTimeout(() => {
    lightningFrames.forEach(f => f.style.opacity = '0');
  }, delay + 50);

  // Schedule next strike randomly between 5 and 15 seconds
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
  
  // Try fetching location silently via free IP geolocation API first (avoids browser prompt)
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
  
  // Fallback: request browser coordinates if IP check is blocked/fails
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

let articlesData = null;
let currentArticleIndex = null;

async function fetchArticles() {
  if (articlesData) return articlesData;
  try {
    // Add cache buster to ensure the latest JSON is always loaded
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

function parseMarkdown(text) {
  // Simple markdown parser for images, links, and paragraphs
  let html = text;
  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Original Link from Facebook scrape
  html = html.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/gi, '<a href="$1" target="_blank" class="utility-link" style="display:inline-block; margin-top: 20px; font-weight: 500;">VIEW ORIGINAL POST &rarr;</a>');
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Paragraphs (split by double newline)
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    // replace single newlines with <br>
    const inner = p.replace(/\n/g, '<br>');
    // if it's already block level (like img), don't wrap in p
    if (inner.trim().startsWith('<img')) return inner;
    return `<p>${inner}</p>`;
  }).join('');
  
  return html;
}

async function renderDrawerContent(index) {
  const articles = await fetchArticles();
  if (!articles) return;
  
  const article = articles[index];
  if (!article) return;
  
  // Extract title and text
  const rawText = article.raw_text;
  let title = "Archive Photo";
  let bodyText = rawText;
  
  // Try to match a bold title at the start (Letterboxd style)
  const boldTitleMatch = rawText.match(/^\*\*([^*]+)\*\*/);
  if (boldTitleMatch) {
    title = boldTitleMatch[1];
    // Remove the title from the body so it's not duplicated
    bodyText = rawText.replace(/^\*\*([^*]+)\*\*\s*/, '');
  } else {
    // Fallback for old facebook posts without bold titles
    const cleanText = rawText.replace(/!\[.*?\]\(.*?\)/g, '').replace(/Original Link:.*/, '').trim();
    const words = cleanText.split(/\s+/);
    if (words.length > 0 && words[0] !== "") {
      title = words.slice(0, 8).join(' ') + (words.length > 8 ? "..." : "");
    }
  }
  
  // Extract link
  let originalLink = "";
  const linkMatch = bodyText.match(/Original Link:\s*(https?:\/\/[^\s<]+)/i);
  if (linkMatch) {
    originalLink = linkMatch[1];
    bodyText = bodyText.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/i, '');
  }

  // Feature Image
  let featureImageHtml = '';
  if (article.feature_image) {
    // If the image is already in the body text (from markdown parsing), don't duplicate it.
    // We can do a simple check if the bodyText contains this exact URL.
    if (!bodyText.includes(article.feature_image)) {
      featureImageHtml = `<img src="${article.feature_image}" alt="Feature Image" style="width: 100%; height: auto; display: block; margin-bottom: 2rem; border-radius: 8px;">`;
    }
  }

  // Render
  const entryNum = articles.length - index;
  if (drawerMeta) {
    drawerMeta.textContent = `ARCHIVE ENTRY ${String(entryNum).padStart(3, '0')} / ${article.date_display}`;
  }
  
  if (drawerContent) {
    let linkHtml = '';
    if (originalLink) {
      linkHtml = `<a href="${originalLink}" target="_blank" rel="noopener noreferrer" class="drawer-original-link">VIEW ORIGINAL POST &rarr;</a>`;
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
  
  // Update nav buttons
  if (drawerPrevBtn) drawerPrevBtn.disabled = index === 0;
  if (drawerNextBtn) drawerNextBtn.disabled = index === articles.length - 1;
}

async function openDrawer(index) {
  currentArticleIndex = index;
  
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
  if (typeof lenis !== 'undefined') lenis.stop();
  
  await renderDrawerContent(index);
}

function closeDrawer() {
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (drawerOverlay) {
    drawerOverlay.classList.remove('open');
    drawerOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
  if (typeof lenis !== 'undefined') lenis.start();
}

// Shorts Carousel Drag to Scroll & Auto-Scroll
const carouselContainer = document.querySelector('.shorts-carousel-container');
let isDown = false;
let startX;
let scrollLeft;
let isDragging = false; // Flag to prevent click if dragged
let isHovering = false;
let exactScroll = 0;
let autoScrollRAF;

if (carouselContainer) {
  const scrollSpeed = 0.5; // pixels per frame

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
      // Sync exactScroll when user interacts
      exactScroll = carouselContainer.scrollLeft;
    }
    
    // The exact midpoint of the duplicated track
    // Since gap is 24px, the midpoint is (scrollWidth - 24) / 2
    const midPoint = (carouselContainer.scrollWidth - 24) / 2;
    
    // Seamless loop bounds
    if (carouselContainer.scrollLeft >= midPoint) {
      exactScroll -= midPoint;
      carouselContainer.scrollLeft = exactScroll;
    } else if (carouselContainer.scrollLeft <= 0 && isDown) {
      // If user drags backwards past the start
      exactScroll += midPoint;
      carouselContainer.scrollLeft = exactScroll;
    }
    
    autoScrollRAF = requestAnimationFrame(autoScroll);
  }

  // Start auto scroll
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
    const walk = (x - startX) * 2; // Scroll speed multiplier
    
    if (Math.abs(walk) > 5) {
      isDragging = true;
    }
    
    exactScroll = scrollLeft - walk;
    carouselContainer.scrollLeft = exactScroll;
  });
  
  // Touch events for mobile drag detection
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
      // Prevent opening drawer if we were dragging
      setTimeout(() => { isDragging = false; }, 50);
      return; 
    }
    const indexAttr = card.getAttribute('data-index');
    if (indexAttr !== null) {
      openDrawer(parseInt(indexAttr, 10));
    }
  });
});

drawerCloseBtn?.addEventListener('click', closeDrawer);
drawerOverlay?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawer?.classList.contains('open')) {
    closeDrawer();
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

// Feed Filtering Logic (for the carousel when search is inactive)
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

// --- Advanced Search, Tagging & Filtering System ---
let journalData = null;
let allArticles = [];
let activeTag = null;
let activeSearchQuery = '';

// Load both datasets and initialize search
async function initSearch() {
  try {
    // 1. Fetch journal data
    const journalResponse = await fetch('/data/journal.json?t=' + new Date().getTime());
    if (journalResponse.ok) {
      journalData = await journalResponse.json();
      journalData.forEach(item => {
        item.platform = 'journal';
      });
    }

    const articles = await fetchArticles(); // Fetches articles.json
    
    // 2. Combine datasets
    allArticles = [];
    if (journalData) allArticles.push(...journalData);
    if (articles) allArticles.push(...articles);
    
    // 3. Render Tag Cloud
    renderTagCloud();
    
    // 4. Setup listeners
    setupSearchListeners();
    
    // 5. Handle initial URL hash
    handleURLParams();
  } catch (err) {
    console.error("Failed to initialize search:", err);
  }
}

function renderTagCloud() {
  const tagCloudEl = document.getElementById('tag-cloud');
  if (!tagCloudEl) return;
  
  // Extract unique tags, excluding 'facebook' and 'letterboxd' to keep the cloud focused on topics
  const tagsSet = new Set();
  allArticles.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(t => {
        const cleanTag = t.toLowerCase().trim();
        if (cleanTag && cleanTag !== 'facebook' && cleanTag !== 'letterboxd') {
          tagsSet.add(cleanTag);
        }
      });
    }
  });
  
  const sortedTags = Array.from(tagsSet).sort();
  
  tagCloudEl.innerHTML = sortedTags.map(tag => `
    <button class="tag-btn" data-tag="${tag}">${tag}</button>
  `).join('');
}

function setupSearchListeners() {
  const searchInput = document.getElementById('archive-search-input');
  const searchClear = document.getElementById('archive-search-clear');
  const clearFiltersBtn = document.getElementById('clear-all-filters-btn');
  const tagButtons = document.querySelectorAll('.tag-btn');
  const navSearchBtn = document.querySelector('.search-btn');

  // Search input typing
  searchInput?.addEventListener('input', (e) => {
    activeSearchQuery = e.target.value.trim().toLowerCase();
    if (searchClear) {
      searchClear.style.display = activeSearchQuery ? 'block' : 'none';
    }
    applySearchAndFilters();
  });

  // Clear search input
  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeSearchQuery = '';
    if (searchClear) searchClear.style.display = 'none';
    applySearchAndFilters();
  });

  // Tag button clicks
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (activeTag === tag) {
        activeTag = null;
        btn.classList.remove('active');
      } else {
        activeTag = tag;
        tagButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      applySearchAndFilters();
    });
  });

  // Clear all filters link
  clearFiltersBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeSearchQuery = '';
    activeTag = null;
    tagButtons.forEach(b => b.classList.remove('active'));
    if (searchClear) searchClear.style.display = 'none';
    applySearchAndFilters();
  });

  // Nav SEARCH button click scroll-to-search
  navSearchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const exploreSection = document.getElementById('explore');
    if (exploreSection) {
      lenis.start();
      lenis.scrollTo(exploreSection, { offset: -80 });
      searchInput?.focus();
    }
  });
}

function handleURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');
  
  if (tagParam) {
    const cleanTag = tagParam.toLowerCase().trim();
    setTimeout(() => {
      const tagBtn = document.querySelector(`.tag-btn[data-tag="${cleanTag}"]`);
      if (tagBtn) {
        activeTag = cleanTag;
        document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
        tagBtn.classList.add('active');
        applySearchAndFilters();
      }
      
      const exploreSection = document.getElementById('explore');
      if (exploreSection) {
        lenis.start();
        lenis.scrollTo(exploreSection, { offset: -80 });
      }
    }, 500);
  } else if (window.location.hash === '#explore') {
    setTimeout(() => {
      const exploreSection = document.getElementById('explore');
      if (exploreSection) {
        lenis.start();
        lenis.scrollTo(exploreSection, { offset: -80 });
        document.getElementById('archive-search-input')?.focus();
      }
    }, 500);
  }
}

function applySearchAndFilters() {
  const searchResultsContainer = document.getElementById('search-results-container');
  const searchResultsGrid = document.getElementById('search-results-grid');
  const resultsCountEl = document.getElementById('results-count');

  const isFilterActive = activeSearchQuery || activeTag;

  if (!isFilterActive) {
    if (searchResultsContainer) searchResultsContainer.style.display = 'none';
    return;
  }

  // Filter items
  const filtered = allArticles.filter(item => {
    // 1. Tag filter
    if (activeTag) {
      if (!item.tags || !item.tags.includes(activeTag)) {
        return false;
      }
    }
    
    // 2. Text Search Query
    if (activeSearchQuery) {
      const title = (item.title || '').toLowerCase();
      const rawText = (item.raw_text || item.content || '').toLowerCase();
      const tagsStr = (item.tags || []).join(' ').toLowerCase();
      
      const matchesQuery = title.includes(activeSearchQuery) || 
                           rawText.includes(activeSearchQuery) || 
                           tagsStr.includes(activeSearchQuery);
                           
      if (!matchesQuery) return false;
    }
    
    return true;
  });

  // Keep the original Journal and Shorts sections visible; search results are additive.
  if (searchResultsContainer) searchResultsContainer.style.display = 'block';

  // Render cards
  if (searchResultsGrid) {
    if (filtered.length === 0) {
      searchResultsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; opacity: 0.5; font-family: var(--font-mono); font-size: 0.9rem;">
          NO MATCHING SCENES FOUND. TRY DIFFERENT TERMS OR FILTERS.
        </div>
      `;
    } else {
      searchResultsGrid.innerHTML = filtered.map(item => {
        let globalIndex = -1;
        if (item.platform !== 'journal') {
          globalIndex = item.localIndex;
        }
        return createResultCardHtml(item, globalIndex);
      }).join('');
    }
  }

  if (resultsCountEl) {
    resultsCountEl.textContent = `${filtered.length} MATCHING SCENE${filtered.length === 1 ? '' : 'S'} BELOW`;
  }
}

function createResultCardHtml(item, globalIndex) {
  const platform = item.platform || 'facebook';
  const imgUrl = item.feature_image || item.image || '/assets/images/journal_feature.webp';
  const dateStr = item.date_display || item.date || '';
  
  let title = item.title || '';
  let excerpt = item.excerpt || item.preamble || '';
  
  if (!title && item.raw_text) {
    const plainText = clean_text(item.raw_text);
    const words = plainText.split(/\s+/);
    title = words.slice(0, 4).join(' ') + '...';
    excerpt = words.slice(4, 15).join(' ') + '...';
  }
  
  let iconHtml = '';
  if (platform === 'facebook') {
    iconHtml = '<div class="short-platform-icon fb-icon"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>';
  } else if (platform === 'letterboxd') {
    iconHtml = '<div class="short-platform-icon lb-icon"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="5" cy="12" r="3.2"/><circle cx="12" cy="12" r="3.2"/><circle cx="19" cy="12" r="3.2"/></svg></div>';
  } else if (platform === 'journal') {
    iconHtml = '<div class="short-platform-icon journal-icon" style="background:var(--color-projector-amber); color:#fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>';
  }

  const linkAttr = platform === 'journal' 
    ? `href="/article.html?id=${item.id}"` 
    : `href="#" data-index="${globalIndex}" class="search-result-drawer-trigger"`;

  return `
    <a ${linkAttr} style="text-decoration:none; color:inherit; display:block;">
      <article class="short-card" data-platform="${platform}">
        <div class="short-image-wrap">
          ${iconHtml}
          <img src="${imgUrl}" alt="${title}" />
        </div>
        <div class="short-content">
          <div class="short-meta">${dateStr}</div>
          <h4 class="short-title">${title}</h4>
          <p class="short-excerpt">${excerpt}</p>
        </div>
      </article>
    </a>
  `;
}

function clean_text(text) {
  if (!text) return "";
  let cleaned = text.replace(/!\[.*?\]\(.*?\)/g, '');
  cleaned = cleaned.replace(/Original Link:.*/gi, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\\n/g, ' ');
  return cleaned.replace(/\n+/g, ' ').trim();
}

// Delegate dynamic drawer clicks
document.getElementById('search-results-grid')?.addEventListener('click', (e) => {
  const trigger = e.target.closest('.search-result-drawer-trigger');
  if (trigger) {
    e.preventDefault();
    const index = parseInt(trigger.getAttribute('data-index'), 10);
    openDrawer(index);
  }
});

// Run initialization
initSearch();
