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
// (Handled by lenis.stop() at the top)

// Simulate loading or actually load images
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
    const res = await fetch('/data/articles.json');
    articlesData = await res.json();
    return articlesData;
  } catch (err) {
    console.error('Failed to load articles:', err);
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
  
  // Create a title from first few words if needed
  let title = "Archive Photo";
  const cleanText = rawText.replace(/!\[.*?\]\(.*?\)/g, '').replace(/Original Link:.*/, '').trim();
  const words = cleanText.split(/\s+/);
  if (words.length > 0 && words[0] !== "") {
    title = words.slice(0, 8).join(' ') + (words.length > 8 ? "..." : "");
  }
  
  // Render
  const entryNum = articles.length - index;
  if (drawerMeta) {
    drawerMeta.textContent = `ARCHIVE ENTRY ${String(entryNum).padStart(3, '0')} / ${article.date_display}`;
  }
  
  if (drawerContent) {
    drawerContent.innerHTML = `
      <div class="drawer-article-header">
        <h2 class="drawer-article-title">${title}</h2>
      </div>
      <div class="drawer-article-body">
        ${parseMarkdown(rawText)}
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

// Feed Filtering Logic
const filterBtns = document.querySelectorAll('.filter-btn');
const shortCards = document.querySelectorAll('.short-card');

// Read initial active filter if any
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

// Apply initial filter state
applyFilter();

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');
    
    // Toggle off if clicking the already active filter
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


