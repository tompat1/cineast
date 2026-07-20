import { fetchSearchWarmup } from './cms-client.js';

// Preloader assets
const imagesToLoad = [
  '/assets/images/hero_background.webp',
  '/assets/images/hero_background_blanco.webp',
  '/assets/images/hero_background_nero_flash1.webp',
  '/assets/images/hero_background_nero_flash2.webp',
  '/assets/images/hero_background_nero_flash3.webp',
  '/assets/images/hero_background_nero_flash4.webp',
  '/assets/images/projector_beam.webp',
  '/assets/images/projector_beam_blanco.webp',
  '/assets/images/brand_statement_bg_blanco.webp',
  '/assets/images/brand_statement_bg_noir.webp',
  '/assets/images/cineast_bg1.webp',
  '/assets/images/cineast_bg2.webp',
  '/assets/images/journal_feature.webp',
  '/assets/images/journal_film.webp',
  '/assets/images/journal_room.webp',
  '/assets/images/journal_street.webp',
  '/assets/images/archive_search_bg.webp',
  '/assets/images/shop_hero_noir1flash.webp',
  '/assets/images/shop_hero_noir2flash.webp',
  '/assets/images/shop_hero_noir3flash.webp',
  '/assets/images/shop_hero_noir4flash.webp',
  '/assets/images/shop_hero_noir5flash.webp'
];

// Preload caches
export let preloadedJournalData = null;
export let preloadedArticlesData = null;
export let preloadedWarmupData = null;

const progressBar = document.getElementById('loader-progress');
const statusText = document.getElementById('loader-status');
const loadingScreen = document.getElementById('loading-screen');

// Total tasks = images + 3 data fetches
const DATA_TASKS = 3;
let loadedCount = 0;
const totalTasks = imagesToLoad.length + DATA_TASKS;

function updateProgress(label, lenis) {
  loadedCount++;
  const percentage = Math.min((loadedCount / totalTasks) * 100, 100);
  if (progressBar) progressBar.style.width = `${percentage}%`;
  if (statusText) statusText.textContent = label || 'Loading...';

  if (loadedCount >= totalTasks) {
    if (statusText) statusText.textContent = 'Ready.';
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add('hidden');
      if (lenis) lenis.start();
    }, 600);
  }
}

export function startPreloader(lenis) {
  // Skip loader if navigating back from an article page
  if (document.referrer && document.referrer.includes('article.html')) {
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (lenis) lenis.start();
  } else {
    // --- Image preloading ---
    imagesToLoad.forEach(src => {
      const img = new Image();
      const finish = () => updateProgress(`Loading: ${src.split('/').pop()}`, lenis);
      img.onload = finish;
      img.onerror = finish;
      setTimeout(() => { img.src = src; }, Math.random() * 1200 + 300);
    });

    // --- Data preloading (parallel, non-blocking) ---

    // 1. journal.json
    (async () => {
      try {
        if (statusText) statusText.textContent = 'Indexing journal...';
        const res = await fetch('/data/journal.json?t=' + Date.now());
        if (res.ok) preloadedJournalData = await res.json();
      } catch (_) {
        // non-fatal
      }
      updateProgress('Journal indexed.', lenis);
    })();

    // 2. articles.json
    (async () => {
      try {
        if (statusText) statusText.textContent = 'Indexing articles...';
        const res = await fetch('/data/articles.json?t=' + Date.now());
        if (res.ok) preloadedArticlesData = await res.json();
      } catch (_) {
        // non-fatal
      }
      updateProgress('Articles indexed.', lenis);
    })();

    // 3. CMS search warmup (DB pages)
    (async () => {
      try {
        if (statusText) statusText.textContent = 'Syncing archive...';
        const data = await fetchSearchWarmup();
        if (data && Array.isArray(data.pages)) preloadedWarmupData = data;
      } catch (_) {
        // non-fatal — DB may be unavailable in local dev
      }
      updateProgress('Archive synced.', lenis);
    })();
  }
}
