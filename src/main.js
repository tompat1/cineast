import Lenis from 'lenis';
import { initFilmicMotion } from './motion.js';
import {
  createPage,
  createUser,
  getAuthSettings,
  deletePage,
  getCurrentUser,
  getPage,
  listUsers,
  listPages,
  login,
  logout,
  updateAuthSettings,
  register,
  searchPages,
  updatePage
} from './cms-client.js';

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
      ? '/assets/images/brand_statement_bg.webp'
      : '/assets/images/brand_statement_bg_blanco.webp';
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
initFilmicMotion(document);

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Account Drawer Logic ---
const accountOpenBtn = document.getElementById('open-account-drawer');
const accountOpenMobileBtn = document.getElementById('open-account-mobile');
const accountDrawer = document.getElementById('account-drawer');
const accountDrawerCloseBtn = document.getElementById('account-drawer-close');
const accountAuthPanel = document.getElementById('account-auth-panel');
const accountSessionStateEl = document.getElementById('account-session-state');
const accountSessionNoteEl = document.getElementById('account-session-note');
const accountSessionHintEl = document.getElementById('account-session-hint');
const accountUserNameEl = document.getElementById('account-user-name');
const accountUserRoleEl = document.getElementById('account-user-role');
const accountLogoutBtn = document.getElementById('account-logout-btn');
const accountScrollLoginBtn = document.getElementById('account-scroll-login');
const accountScrollRegisterBtn = document.getElementById('account-scroll-register');
const accountLoginForm = document.getElementById('account-login-form');
const accountRegisterForm = document.getElementById('account-register-form');
const accountAuthTabs = document.querySelectorAll('.auth-tab');
const cmsAdminPanel = document.getElementById('cms-admin-panel');
const invitePolicyStateEl = document.getElementById('invite-policy-state');
const invitePolicyNoteEl = document.getElementById('invite-policy-note');
const invitePolicyToggleBtn = document.getElementById('invite-policy-toggle');
const accountCreateUserForm = document.getElementById('account-create-user-form');
const adminUserResults = document.getElementById('admin-user-results');
const cmsPageSearchInput = document.getElementById('cms-page-search-input');
const cmsPageSearchBtn = document.getElementById('cms-page-search-btn');
const cmsPageRefreshBtn = document.getElementById('cms-page-refresh-btn');
const cmsPageNewBtn = document.getElementById('cms-page-new-btn');
const cmsPageResults = document.getElementById('cms-page-results');
const cmsPageEditorForm = document.getElementById('cms-page-editor-form');
const cmsEditorStatus = document.getElementById('cms-editor-status');
const cmsEditorHint = document.getElementById('cms-editor-hint');
const cmsPageIdInput = document.getElementById('cms-page-id');
const cmsPageSlugInput = document.getElementById('cms-page-slug');
const cmsPageTitleInput = document.getElementById('cms-page-title');
const cmsPageMetaInput = document.getElementById('cms-page-meta');
const cmsPageSummaryInput = document.getElementById('cms-page-summary');
const cmsPageHeroInput = document.getElementById('cms-page-hero');
const cmsPageKindInput = document.getElementById('cms-page-kind');
const cmsPageStatusInput = document.getElementById('cms-page-status');
const cmsPageContentInput = document.getElementById('cms-page-content');
const cmsPageResetBtn = document.getElementById('cms-page-reset-btn');
const cmsPageDeleteBtn = document.getElementById('cms-page-delete-btn');
const cmsPageSaveBtn = document.getElementById('cms-page-save-btn');
const cmsEditorEmptyState = 'No page selected yet.';

let currentAccountUser = null;
let currentCmsPage = null;
let currentCmsPages = [];
let currentAuthTab = 'login';
let cmsPageSearchTerm = '';
let inviteOnlyMode = false;
let adminUsers = [];

function setSharedDrawerOverlay(isOpen) {
  if (!drawerOverlay) return;
  drawerOverlay.classList.toggle('open', isOpen);
  drawerOverlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function setAccountMessage(message) {
  if (accountSessionNoteEl) {
    accountSessionNoteEl.textContent = message;
  }
}

function renderInvitePolicyState(isInviteOnly) {
  inviteOnlyMode = Boolean(isInviteOnly);

  if (invitePolicyStateEl) {
    invitePolicyStateEl.textContent = inviteOnlyMode ? 'INVITE ONLY' : 'OPEN REGISTRATION';
  }

  if (invitePolicyNoteEl) {
    invitePolicyNoteEl.textContent = inviteOnlyMode
      ? 'Registration is closed. Admins create member accounts from this panel.'
      : 'Keep registration open for self-service signups, or switch to invite-only and create members manually from this panel.';
  }

  if (invitePolicyToggleBtn) {
    invitePolicyToggleBtn.textContent = inviteOnlyMode ? 'ALLOW OPEN REGISTRATION' : 'TOGGLE INVITE ONLY';
  }

  const registerTab = document.querySelector('.auth-tab[data-auth-tab="register"]');
  if (registerTab) {
    registerTab.hidden = inviteOnlyMode;
  }

  if (accountRegisterForm) {
    accountRegisterForm.hidden = inviteOnlyMode;
  }

  if (accountScrollRegisterBtn) {
    accountScrollRegisterBtn.hidden = inviteOnlyMode || Boolean(currentAccountUser);
  }

  if (inviteOnlyMode && currentAuthTab === 'register') {
    setActiveAuthTab('login');
  }
}

function setActiveAuthTab(tab) {
  currentAuthTab = tab === 'register' && !inviteOnlyMode ? 'register' : 'login';
  accountAuthTabs.forEach((button) => {
    const isRegisterButton = button.dataset.authTab === 'register';
    const isActive = button.dataset.authTab === currentAuthTab;
    button.classList.toggle('active', isActive);
    if (isRegisterButton) {
      button.hidden = inviteOnlyMode;
    }
  });
  if (accountLoginForm) {
    accountLoginForm.classList.toggle('active', currentAuthTab === 'login');
  }
  if (accountRegisterForm) {
    accountRegisterForm.classList.toggle('active', currentAuthTab === 'register' && !inviteOnlyMode);
  }
}

function renderAccountState(user) {
  currentAccountUser = user || null;
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === 'admin';

  if (accountSessionStateEl) {
    accountSessionStateEl.textContent = isLoggedIn ? 'ACTIVE SESSION' : 'SIGNED OUT';
    accountSessionStateEl.classList.toggle('is-active', isLoggedIn);
    accountSessionStateEl.classList.toggle('is-signed-out', !isLoggedIn);
    accountSessionStateEl.setAttribute('aria-label', isLoggedIn ? 'Current session active' : 'No active session');
  }
  if (accountUserNameEl) {
    accountUserNameEl.textContent = user?.username || 'Guest';
  }
  if (accountUserRoleEl) {
    accountUserRoleEl.textContent = user?.role || 'member';
    accountUserRoleEl.classList.toggle('admin', isAdmin);
  }
  if (accountLogoutBtn) {
    accountLogoutBtn.hidden = !isLoggedIn;
    accountLogoutBtn.textContent = isLoggedIn ? 'LOG OUT' : 'LOG OUT';
  }
  if (accountScrollLoginBtn) {
    accountScrollLoginBtn.hidden = isLoggedIn;
  }
  if (accountScrollRegisterBtn) {
    accountScrollRegisterBtn.hidden = isLoggedIn || inviteOnlyMode;
  }
  if (accountAuthPanel) {
    accountAuthPanel.hidden = isLoggedIn;
  }
  if (cmsAdminPanel) {
    cmsAdminPanel.hidden = !isAdmin;
  }

  if (isLoggedIn) {
    if (accountSessionHintEl) {
      accountSessionHintEl.textContent = isAdmin
        ? 'Admin sessions can search, create, and edit pages. Log out to end this browser session.'
        : 'Member sessions can read published pages. Log out to end this browser session.';
    }
    setAccountMessage(isAdmin
      ? 'Admin access is active. Search, create, and edit pages from the CMS panel below.'
      : 'Member access is active. Published pages are readable; CMS editing stays locked.');
  } else {
    if (accountSessionHintEl) {
      accountSessionHintEl.textContent = 'No active session yet.';
    }
    setAccountMessage(inviteOnlyMode
      ? 'Registration is invite-only. Ask an admin for an account.'
      : 'Sign in or create a member account to read published pages and access the CMS tools.');
  }
}

function getCmsEditorPayload() {
  return {
    slug: cmsPageSlugInput?.value.trim() || '',
    title: cmsPageTitleInput?.value.trim() || '',
    meta: cmsPageMetaInput?.value.trim() || '',
    summary: cmsPageSummaryInput?.value.trim() || '',
    hero_image: cmsPageHeroInput?.value.trim() || '',
    kind: cmsPageKindInput?.value || 'page',
    status: cmsPageStatusInput?.value || 'draft',
    content: cmsPageContentInput?.value.trim() || ''
  };
}

function setCmsEditorMessage(message) {
  if (cmsEditorStatus) {
    cmsEditorStatus.textContent = message;
  }
}

function setCmsEditorHint(message) {
  if (cmsEditorHint) {
    cmsEditorHint.textContent = message;
  }
}

function clearCmsEditor() {
  currentCmsPage = null;
  if (cmsPageIdInput) cmsPageIdInput.value = '';
  if (cmsPageSlugInput) cmsPageSlugInput.value = '';
  if (cmsPageTitleInput) cmsPageTitleInput.value = '';
  if (cmsPageMetaInput) cmsPageMetaInput.value = '';
  if (cmsPageSummaryInput) cmsPageSummaryInput.value = '';
  if (cmsPageHeroInput) cmsPageHeroInput.value = '';
  if (cmsPageKindInput) cmsPageKindInput.value = 'page';
  if (cmsPageStatusInput) cmsPageStatusInput.value = 'draft';
  if (cmsPageContentInput) cmsPageContentInput.value = '';
  setCmsEditorMessage(cmsEditorEmptyState);
  setCmsEditorHint('Pick a page from search results or create a fresh one.');
  if (cmsPageSaveBtn) cmsPageSaveBtn.textContent = 'SAVE PAGE';
  if (cmsPageDeleteBtn) cmsPageDeleteBtn.disabled = true;
}

function populateCmsEditor(page) {
  currentCmsPage = page || null;
  if (!page) {
    clearCmsEditor();
    return;
  }

  if (cmsPageIdInput) cmsPageIdInput.value = page.id || '';
  if (cmsPageSlugInput) cmsPageSlugInput.value = page.slug || '';
  if (cmsPageTitleInput) cmsPageTitleInput.value = page.title || '';
  if (cmsPageMetaInput) cmsPageMetaInput.value = page.meta || '';
  if (cmsPageSummaryInput) cmsPageSummaryInput.value = page.summary || '';
  if (cmsPageHeroInput) cmsPageHeroInput.value = page.hero_image || '';
  if (cmsPageKindInput) cmsPageKindInput.value = page.kind || 'page';
  if (cmsPageStatusInput) cmsPageStatusInput.value = page.status || 'draft';
  if (cmsPageContentInput) cmsPageContentInput.value = page.content || '';
  setCmsEditorMessage(`${page.kind || 'page'} / ${page.status || 'draft'} / ${page.slug || page.id}`);
  setCmsEditorHint(`Updated ${page.updated_at || page.created_at || 'recently'}.`);
  if (cmsPageSaveBtn) cmsPageSaveBtn.textContent = page.id ? 'UPDATE PAGE' : 'SAVE PAGE';
  if (cmsPageDeleteBtn) cmsPageDeleteBtn.disabled = false;
}

function renderCmsPageResults(pages) {
  currentCmsPages = pages || [];
  if (!cmsPageResults) return;

  if (!currentCmsPages.length) {
    cmsPageResults.innerHTML = '<div class="cms-search-empty">No matching pages found.</div>';
    return;
  }

  cmsPageResults.innerHTML = currentCmsPages.map((page) => {
    const isActive = currentCmsPage && (currentCmsPage.id === page.id || currentCmsPage.slug === page.slug);
    return `
      <button type="button" class="cms-search-result ${isActive ? 'active' : ''}" data-page-key="${escapeHtml(page.id || page.slug)}">
        <span class="cms-search-result-title">${escapeHtml(page.title || 'Untitled page')}</span>
        <span class="cms-search-result-meta">${escapeHtml(page.kind || 'page')} / ${escapeHtml(page.status || 'draft')} / ${escapeHtml(page.slug || page.id || '')}</span>
      </button>
    `;
  }).join('');
}

function renderAdminUsers(users) {
  adminUsers = users || [];
  if (!adminUserResults) return;

  if (!adminUsers.length) {
    adminUserResults.innerHTML = '<div class="cms-search-empty">No users found.</div>';
    return;
  }

  adminUserResults.innerHTML = adminUsers.map((user) => `
    <div class="cms-search-result" style="cursor: default;">
      <span class="cms-search-result-title">${escapeHtml(user.username || 'Unnamed user')}</span>
      <span class="cms-search-result-meta">${escapeHtml(user.role || 'member')} / ${escapeHtml(user.created_at || '')}</span>
    </div>
  `).join('');
}

async function loadAdminUsers() {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  try {
    const response = await listUsers();
    renderAdminUsers(response.users || []);
  } catch (error) {
    console.error('Failed to load users', error);
    if (adminUserResults) {
      adminUserResults.innerHTML = `<div class="cms-search-empty">${escapeHtml(error.message || 'Unable to load users.')}</div>`;
    }
  }
}

async function loadCmsPages(query = cmsPageSearchTerm) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;

  cmsPageSearchTerm = query;

  try {
    const response = query
      ? await searchPages(query, { includeDrafts: true, limit: 12 })
      : await listPages({ includeDrafts: true, limit: 12 });

    const pages = response.pages || response.results || [];
    renderCmsPageResults(pages);
    setCmsEditorHint(query ? `Search results for "${query}".` : 'Recent pages loaded.');
  } catch (error) {
    console.error('Failed to load CMS pages', error);
    if (cmsPageResults) {
      cmsPageResults.innerHTML = `<div class="cms-search-empty">${escapeHtml(error.message || 'Unable to load pages.')}</div>`;
    }
  }
}

async function refreshAccountSession() {
  try {
    const response = await getCurrentUser();
    renderAccountState(response.user);
    if (response.user?.role === 'admin') {
      await loadCmsPages(cmsPageSearchTerm);
      await loadAdminUsers();
      if (!currentCmsPage) {
        clearCmsEditor();
      }
    }
    return response.user || null;
  } catch (error) {
    renderAccountState(null);
    if (cmsPageResults) cmsPageResults.innerHTML = '';
    clearCmsEditor();
    return null;
  }
}

async function refreshAuthSettings() {
  try {
    const settings = await getAuthSettings();
    renderInvitePolicyState(settings.invite_only);
    renderAccountState(currentAccountUser);
  } catch (error) {
    console.warn('Failed to load auth settings, defaulting to open registration.', error);
    renderInvitePolicyState(false);
  }
}

function openAccountDrawer() {
  closeDrawer();
  if (mobileMenu) {
    mobileMenu.classList.remove('active');
  }
  if (accountDrawer) {
    accountDrawer.classList.add('open');
    accountDrawer.setAttribute('aria-hidden', 'false');
  }
  setSharedDrawerOverlay(true);
  document.body.style.overflow = 'hidden';
  if (typeof lenis !== 'undefined') lenis.stop();
  refreshAuthSettings();
  refreshAccountSession();
}

function closeAccountDrawer() {
  if (accountDrawer) {
    accountDrawer.classList.remove('open');
    accountDrawer.setAttribute('aria-hidden', 'true');
  }
  if (!drawer?.classList.contains('open')) {
    setSharedDrawerOverlay(false);
    document.body.style.overflow = '';
    if (typeof lenis !== 'undefined') lenis.start();
  }
}

async function handleAccountLoginSubmit(event) {
  event.preventDefault();
  if (!accountLoginForm) return;

  const formData = new FormData(accountLoginForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    const response = await login(username, password);
    renderAccountState(response.user);
    setActiveAuthTab('login');
    accountLoginForm.reset();
    await loadCmsPages();
    if (response.user?.role === 'admin') {
      clearCmsEditor();
    }
    setAccountMessage(`Welcome back, ${response.user?.username || username}.`);
  } catch (error) {
    setAccountMessage(error.message || 'Login failed.');
  }
}

async function handleAccountRegisterSubmit(event) {
  event.preventDefault();
  if (!accountRegisterForm) return;

  const formData = new FormData(accountRegisterForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    const response = await register(username, password);
    renderAccountState(response.user);
    setActiveAuthTab('login');
    accountRegisterForm.reset();
    await loadCmsPages();
    setAccountMessage(`Account created for ${response.user?.username || username}.`);
  } catch (error) {
    setAccountMessage(error.message || 'Registration failed.');
  }
}

async function handleAccountLogout() {
  try {
    await logout();
  } catch (error) {
    console.warn('Logout request failed, clearing local state anyway.', error);
  } finally {
    renderAccountState(null);
    clearCmsEditor();
    if (cmsPageResults) cmsPageResults.innerHTML = '';
    closeAccountDrawer();
  }
}

async function handleInvitePolicyToggle() {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  try {
    const response = await updateAuthSettings({ invite_only: !inviteOnlyMode });
    renderInvitePolicyState(response.invite_only);
    setAccountMessage(response.invite_only
      ? 'Registration is now invite-only.'
      : 'Open registration is now enabled.');
  } catch (error) {
    setAccountMessage(error.message || 'Unable to update access policy.');
  }
}

async function handleAdminCreateUser(event) {
  event.preventDefault();
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  if (!accountCreateUserForm) return;

  const formData = new FormData(accountCreateUserForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  const role = String(formData.get('role') || 'member').trim();

  try {
    await createUser({ username, password, role });
    accountCreateUserForm.reset();
    await loadAdminUsers();
    setAccountMessage(`User "${username}" created.`);
  } catch (error) {
    setAccountMessage(error.message || 'Unable to create user.');
  }
}

async function handleCmsPageSearch(query) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  await loadCmsPages(query);
}

async function handleCmsPageSelection(pageKey) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  try {
    const response = await getPage(pageKey);
    populateCmsEditor(response.page);
    setCmsEditorHint(`Loaded ${response.page.title || response.page.slug || pageKey}.`);
  } catch (error) {
    setCmsEditorHint(error.message || 'Unable to load page.');
  }
}

async function handleCmsPageSave(event) {
  event.preventDefault();
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;

  const payload = getCmsEditorPayload();
  if (!payload.title || !payload.content) {
    setCmsEditorHint('Title and content are required.');
    return;
  }

  try {
    const targetKey = currentCmsPage?.id || currentCmsPage?.slug;
    const response = targetKey
      ? await updatePage(targetKey, payload)
      : await createPage(payload);

    const page = response.page;
    populateCmsEditor(page);
    await loadCmsPages(cmsPageSearchTerm);
    setCmsEditorHint(`Saved ${page.title || page.slug || 'page'}.`);
  } catch (error) {
    setCmsEditorHint(error.message || 'Unable to save page.');
  }
}

async function handleCmsPageDelete() {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  if (!currentCmsPage?.id && !currentCmsPage?.slug) {
    setCmsEditorHint('Select a page before deleting.');
    return;
  }

  const confirmed = window.confirm(`Delete "${currentCmsPage.title || currentCmsPage.slug}"?`);
  if (!confirmed) return;

  try {
    await deletePage(currentCmsPage.id || currentCmsPage.slug);
    clearCmsEditor();
    await loadCmsPages(cmsPageSearchTerm);
    setCmsEditorHint('Page deleted.');
  } catch (error) {
    setCmsEditorHint(error.message || 'Unable to delete page.');
  }
}

function setupAccountDrawer() {
  accountOpenBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openAccountDrawer();
  });

  accountOpenMobileBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openAccountDrawer();
  });

  accountDrawerCloseBtn?.addEventListener('click', closeAccountDrawer);

  accountAuthTabs.forEach((button) => {
    button.addEventListener('click', () => setActiveAuthTab(button.dataset.authTab));
  });

  accountScrollLoginBtn?.addEventListener('click', () => setActiveAuthTab('login'));
  accountScrollRegisterBtn?.addEventListener('click', () => setActiveAuthTab('register'));
  accountLoginForm?.addEventListener('submit', handleAccountLoginSubmit);
  accountRegisterForm?.addEventListener('submit', handleAccountRegisterSubmit);
  accountLogoutBtn?.addEventListener('click', handleAccountLogout);
  invitePolicyToggleBtn?.addEventListener('click', handleInvitePolicyToggle);
  accountCreateUserForm?.addEventListener('submit', handleAdminCreateUser);

  cmsPageSearchBtn?.addEventListener('click', () => {
    const query = String(cmsPageSearchInput?.value || '').trim();
    handleCmsPageSearch(query);
  });

  cmsPageRefreshBtn?.addEventListener('click', () => {
    const query = String(cmsPageSearchInput?.value || '').trim();
    handleCmsPageSearch(query);
  });

  cmsPageNewBtn?.addEventListener('click', () => {
    clearCmsEditor();
    setCmsEditorHint('New draft ready.');
  });

  cmsPageResults?.addEventListener('click', (event) => {
    const button = event.target.closest('.cms-search-result');
    if (!button) return;
    const pageKey = button.getAttribute('data-page-key');
    if (pageKey) {
      handleCmsPageSelection(pageKey);
    }
  });

  cmsPageEditorForm?.addEventListener('submit', handleCmsPageSave);
  cmsPageResetBtn?.addEventListener('click', () => {
    if (currentCmsPage) {
      populateCmsEditor(currentCmsPage);
    } else {
      clearCmsEditor();
    }
  });
  cmsPageDeleteBtn?.addEventListener('click', handleCmsPageDelete);

  setActiveAuthTab(currentAuthTab);
  renderInvitePolicyState(false);
  renderAccountState(null);
  clearCmsEditor();
  refreshAuthSettings();
}

setupAccountDrawer();

function extractOriginalLink(text) {
  const match = String(text || '').match(/Original Link:\s*(https?:\/\/[^\s<]+)/i);
  return match ? match[1] : '';
}

function parseMarkdown(text) {
  // Simple markdown parser for images, links, and paragraphs
  let html = text;
  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\((.*?)\)/g, (_, alt, src) => {
    const safeAlt = escapeHtml(alt);
    const safeSrc = escapeHtml(src);
    const caption = safeAlt ? `<figcaption>${safeAlt}</figcaption>` : '';
    return `<figure class="article-image-figure"><img src="${safeSrc}" alt="${safeAlt}" />${caption}</figure>`;
  });
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
    // if it's already block level (like a figure), don't wrap in p
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
  let originalLink = article.original_link || extractOriginalLink(rawText);
  if (originalLink) {
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
  
  // Update nav buttons
  if (drawerPrevBtn) drawerPrevBtn.disabled = index === 0;
  if (drawerNextBtn) drawerNextBtn.disabled = index === articles.length - 1;
}

async function openDrawer(index) {
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
  if (typeof lenis !== 'undefined') lenis.stop();
  
  await renderDrawerContent(index);
}

function closeDrawer() {
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (drawerOverlay) {
    if (!accountDrawer?.classList.contains('open')) {
      drawerOverlay.classList.remove('open');
      drawerOverlay.setAttribute('aria-hidden', 'true');
    }
  }
  if (!accountDrawer?.classList.contains('open')) {
    document.body.style.overflow = '';
    if (typeof lenis !== 'undefined') lenis.start();
  }
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
drawerOverlay?.addEventListener('click', () => {
  closeDrawer();
  closeAccountDrawer();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (drawer?.classList.contains('open') || accountDrawer?.classList.contains('open'))) {
    closeDrawer();
    closeAccountDrawer();
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
let activeFacetFilters = {
  mood: new Set(),
  form: new Set(),
  era: new Set(),
  rating: new Set()
};

const archiveFacetConfig = {
  mood: [
    { value: 'noir', label: 'Noir' },
    { value: 'melancholy', label: 'Melancholy' },
    { value: 'road movie', label: 'Road Movie' },
    { value: 'summer heat', label: 'Summer Heat' },
    { value: 'midnight', label: 'Midnight' },
    { value: 'slow cinema', label: 'Slow Cinema' },
    { value: 'brutal', label: 'Brutal' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'rainy city', label: 'Rainy City' }
  ],
  form: [
    { value: 'feature', label: 'Feature' },
    { value: 'short note', label: 'Short Note' },
    { value: 'still', label: 'Still' },
    { value: 'quote', label: 'Quote' },
    { value: 'journal', label: 'Journal' },
    { value: 'review', label: 'Review' },
    { value: 'scene study', label: 'Scene Study' }
  ],
  era: [
    { value: '70s', label: '70s' },
    { value: '80s', label: '80s' },
    { value: '90s', label: '90s' },
    { value: '2000s', label: '2000s' },
    { value: 'new cinema', label: 'New Cinema' }
  ],
  rating: [
    { value: 'masterpiece', label: 'Masterpiece' },
    { value: 'worth watching', label: 'Worth Watching' },
    { value: 'flawed beauty', label: 'Flawed Beauty' },
    { value: 'guilty pleasure', label: 'Guilty Pleasure' },
    { value: 'never again', label: 'Never Again' }
  ]
};

const imdbFilmData = {
  'the bridges of madison county': { score: '7.6', year: '1995' },
  'paris, texas': { score: '8.1', year: '1984' },
  'jeanne dielman': { score: '7.5', year: '1975' },
  'taxi driver': { score: '8.2', year: '1976' }
};

function getImdbFilmData(query) {
  return imdbFilmData[String(query || '').toLowerCase().trim()] || null;
}

function normalizeArchiveText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function getArchiveSearchText(item) {
  return normalizeArchiveText([
    item.title,
    item.meta,
    item.preamble,
    item.excerpt,
    item.content,
    item.raw_text,
    item.date_display,
    item.date,
    item.movie_query,
    item.original_link,
    ...(Array.isArray(item.tags) ? item.tags : [])
  ].filter(Boolean).join(' '));
}

function extractArchiveYear(item) {
  const text = [
    item.title,
    item.meta,
    item.preamble,
    item.excerpt,
    item.content,
    item.raw_text,
    item.movie_query,
    item.date_display,
    item.date
  ].filter(Boolean).join(' ');

  const matches = text.match(/\b(19|20)\d{2}\b/g);
  if (matches && matches.length > 0) {
    return parseInt(matches[0], 10);
  }

  const dateSource = item.date_sort || item.date_original || item.date;
  if (dateSource) {
    const parsed = new Date(dateSource);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
  }

  return null;
}

function extractArchiveRating(item) {
  const text = [
    item.title,
    item.meta,
    item.raw_text
  ].filter(Boolean).join(' ');

  const starMatch = text.match(/★+/g);
  if (starMatch) {
    const stars = starMatch.join('').length;
    const half = /½/.test(text) ? 0.5 : 0;
    const rating = stars + half;

    if (rating >= 4.5) return 'masterpiece';
    if (rating >= 3.5) return 'worth watching';
    if (rating >= 2.5) return 'flawed beauty';
    if (rating >= 1.5) return 'guilty pleasure';
    return 'never again';
  }

  const normalized = normalizeArchiveText(text);
  if (!normalized) return null;

  const ratingRules = [
    { value: 'never again', patterns: ['never again', 'avoid', 'awful', 'terrible', 'worst'] },
    { value: 'guilty pleasure', patterns: ['guilty pleasure', 'trash', 'so bad', 'camp', 'messy fun'] },
    { value: 'flawed beauty', patterns: ['flawed', 'messy', 'imperfect', 'rough but', 'beautifully broken'] },
    { value: 'masterpiece', patterns: ['masterpiece', 'masterful', 'perfect', 'all-time', 'brilliant', 'phenomenal', 'fullträff'] },
    { value: 'worth watching', patterns: ['must see', 'worth watching', 'great', 'good', 'love', 'recommend', 'gripping', 'excellent'] }
  ];

  for (const rule of ratingRules) {
    if (rule.patterns.some(pattern => normalized.includes(pattern))) {
      return rule.value;
    }
  }

  return null;
}

function inferArchiveFacets(item) {
  if (item.__archiveFacets) return item.__archiveFacets;

  const text = getArchiveSearchText(item);
  const tags = (Array.isArray(item.tags) ? item.tags : []).map(tag => normalizeArchiveText(tag));
  const forms = new Set();
  const moods = new Set();

  const hasAny = (patterns) => patterns.some(pattern => text.includes(pattern) || tags.some(tag => tag.includes(pattern)));

  // Mood
  if (hasAny(['noir', 'urban noir', 'shadow', 'neon', 'fog', 'midnight', 'night', 'dark streets', 'hardboiled'])) moods.add('noir');
  if (hasAny(['melancholy', 'melancholic', 'lonely', 'wistful', 'loss', 'grief', 'ache', 'tender sadness'])) moods.add('melancholy');
  if (hasAny(['road', 'drive', 'driving', 'journey', 'highway', 'travel', 'odyssey', 'trip'])) moods.add('road movie');
  if (hasAny(['summer', 'heat', 'sun', 'sweat', 'humid', 'hot days', 'summer light'])) moods.add('summer heat');
  if (hasAny(['midnight', 'late night', 'after dark', 'nocturne', 'night', '2am', '3am'])) moods.add('midnight');
  if (hasAny(['slow cinema', 'slow', 'stillness', 'patience', 'duration', 'linger', 'long take', 'quiet rhythm'])) moods.add('slow cinema');
  if (hasAny(['brutal', 'violence', 'violent', 'bloody', 'harsh', 'grim', 'rough', 'hard-edged'])) moods.add('brutal');
  if (hasAny(['romantic', 'romance', 'love', 'longing', 'tender', 'intimate', 'desire'])) moods.add('romantic');
  if (hasAny(['rainy city', 'rain', 'rainy', 'drizzle', 'wet street', 'wet streets', 'streetlights', 'city in rain'])) moods.add('rainy city');

  // Form
  if (item.platform === 'journal' || hasAny(['visual essay', 'journal', 'essay', 'notes'])) forms.add('journal');
  if (item.platform === 'letterboxd' || hasAny(['letterboxd', 'review', 'watched', 're-watched', 'rewatch'])) forms.add('review');
  if (hasAny(['scene study', 'scene', 'frame', 'shot', 'composition', 'camera', 'lighting', 'sequence', 'mise-en-scene'])) forms.add('scene study');

  const bodyText = normalizeArchiveText(item.content || item.raw_text || item.excerpt || item.preamble || '');
  const textLength = bodyText.length;
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
  const imageCount = (String(item.raw_text || '').match(/!\[[^\]]*\]\((.*?)\)/g) || []).length;
  const hasQuoteMarkers = /^["“].+["”]$/.test(bodyText) || /^['’].+['’]$/.test(bodyText) || /["“][^"”]{20,}["”]/.test(bodyText);
  const shortNoteSignals = item.platform === 'facebook' || wordCount < 90;

  if (hasQuoteMarkers) forms.add('quote');
  if (item.platform === 'journal' || wordCount > 140 || textLength > 900) forms.add('feature');
  if (shortNoteSignals && wordCount < 120) forms.add('short note');
  if (imageCount > 0 && wordCount < 35) forms.add('still');
  if (!forms.size) forms.add('short note');

  const year = extractArchiveYear(item);
  let era = null;
  if (year !== null) {
    if (year >= 1970 && year <= 1979) era = '70s';
    else if (year >= 1980 && year <= 1989) era = '80s';
    else if (year >= 1990 && year <= 1999) era = '90s';
    else if (year >= 2000 && year <= 2009) era = '2000s';
    else if (year >= 2010) era = 'new cinema';
  }

  const rating = extractArchiveRating(item);

  const facets = {
    mood: Array.from(moods),
    form: Array.from(forms),
    era: era ? [era] : [],
    rating: rating ? [rating] : [],
    year,
    ratingLabel: rating
  };

  item.__archiveFacets = facets;
  return facets;
}

function renderArchiveFilters() {
  const panel = document.getElementById('archive-filter-panel');
  if (!panel) return;

  panel.innerHTML = Object.entries(archiveFacetConfig).map(([groupKey, groupItems]) => `
    <div class="archive-filter-group" data-facet-group="${groupKey}">
      <div class="archive-filter-group-label">By ${groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}</div>
      <div class="archive-filter-chips">
        ${groupItems.map(item => `
          <button
            type="button"
            class="archive-filter-chip"
            data-facet-group="${groupKey}"
            data-facet-value="${item.value}"
          >${item.label}</button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function updateArchiveFilterChipStates() {
  document.querySelectorAll('.archive-filter-chip').forEach(btn => {
    const group = btn.getAttribute('data-facet-group');
    const value = btn.getAttribute('data-facet-value');
    const set = activeFacetFilters[group];
    btn.classList.toggle('active', !!set && set.has(value));
  });
}

function clearArchiveFacetFilters() {
  Object.values(activeFacetFilters).forEach(set => set.clear());
  updateArchiveFilterChipStates();
}

function hasActiveArchiveFacetFilters() {
  return Object.values(activeFacetFilters).some(set => set.size > 0);
}

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
    renderArchiveFilters();
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
  const archiveFilterPanel = document.getElementById('archive-filter-panel');
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

  archiveFilterPanel?.addEventListener('click', (e) => {
    const chip = e.target.closest('.archive-filter-chip');
    if (!chip) return;

    const group = chip.getAttribute('data-facet-group');
    const value = chip.getAttribute('data-facet-value');
    const groupSet = activeFacetFilters[group];

    if (!groupSet) return;

    if (group === 'mood' || group === 'form') {
      if (groupSet.has(value)) {
        groupSet.delete(value);
      } else {
        groupSet.add(value);
      }
    } else {
      groupSet.clear();
      groupSet.add(value);
    }

    updateArchiveFilterChipStates();
    applySearchAndFilters();
  });

  // Clear all filters link
  clearFiltersBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeSearchQuery = '';
    activeTag = null;
    clearArchiveFacetFilters();
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

  const isFilterActive = activeSearchQuery || activeTag || hasActiveArchiveFacetFilters();

  if (!isFilterActive) {
    if (searchResultsContainer) searchResultsContainer.style.display = 'none';
    return;
  }

  // Filter items
  const filtered = allArticles.filter(item => {
    const inferredFacets = inferArchiveFacets(item);
    const searchableText = getArchiveSearchText(item);

    // 1. Tag filter
    if (activeTag) {
      if (!item.tags || !item.tags.includes(activeTag)) {
        return false;
      }
    }

    // 2. Facet filters
    if (activeFacetFilters.mood.size > 0) {
      const moods = inferredFacets.mood || [];
      if (!moods.some(value => activeFacetFilters.mood.has(value))) return false;
    }

    if (activeFacetFilters.form.size > 0) {
      const forms = inferredFacets.form || [];
      if (!forms.some(value => activeFacetFilters.form.has(value))) return false;
    }

    if (activeFacetFilters.era.size > 0) {
      const eras = inferredFacets.era || [];
      if (!eras.some(value => activeFacetFilters.era.has(value))) return false;
    }

    if (activeFacetFilters.rating.size > 0) {
      const ratings = inferredFacets.rating || [];
      if (!ratings.some(value => activeFacetFilters.rating.has(value))) return false;
    }
    
    // 2. Text Search Query
    if (activeSearchQuery) {
      const matchesQuery = searchableText.includes(activeSearchQuery);
                           
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

  const movieQuery = platform === 'journal' ? item.movie_query : '';
  const movieRefHtml = movieQuery ? `
    ${(() => {
      const film = getImdbFilmData(movieQuery);
      const scoreText = film?.score ? ` ${film.score}` : '';
      const yearText = film?.year ? ` ${film.year}` : '';
      return `
    <div class="search-result-movie-ref">
      <span class="search-result-movie-label">FILM FOCUS</span>
      <span class="search-result-movie-title">${escapeHtml(movieQuery)}</span>
      <a class="search-result-imdb-badge" href="https://www.imdb.com/find/?q=${encodeURIComponent(movieQuery)}&s=tt&ttype=ft" target="_blank" rel="noopener noreferrer" aria-label="Search IMDb for ${escapeHtml(movieQuery)}${yearText}">IMDb${scoreText}</a>
    </div>
  `;
    })()}
  ` : '';

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
          ${movieRefHtml}
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
