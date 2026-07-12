import {
  getPage,
  updatePage,
  createPage,
  searchTmdb,
  fetchTmdbImages,
  searchTvdb,
  fetchTvdbImages,
  searchOpenLibrary,
  fetchOpenLibraryImages,
  lookupMusicLinks
} from './cms-client.js';
import { showToast } from './admin-panel.js';
import { initCardShareButtons } from './share.js';

const STREAMING_PLATFORMS = [
  { id: '', name: 'None' },
  { id: 'netflix', name: 'Netflix', icon: 'simple-icons:netflix', color: '#E50914' },
  { id: 'appletv', name: 'Apple TV', icon: 'simple-icons:appletv', color: 'var(--color-screen-cream)' },
  { id: 'max', name: 'HBO / Max', icon: 'simple-icons:max', color: 'var(--color-screen-cream)' },
  { id: 'prime', name: 'Prime Video', icon: 'simple-icons:primevideo', color: '#00A8E1' },
  { id: 'disney', name: 'Disney+', icon: 'simple-icons:disneyplus', color: 'var(--color-screen-cream)' },
  { id: 'hulu', name: 'Hulu', icon: 'simple-icons:hulu', color: '#1CE783' },
  { id: 'mubi', name: 'MUBI', icon: 'simple-icons:mubi', color: 'var(--color-screen-cream)' },
  { id: 'criterion', name: 'Criterion', icon: 'simple-icons:criterion', color: 'var(--color-screen-cream)' },
  { id: 'sky', name: 'SkyShowtime', icon: 'simple-icons:sky', color: 'var(--color-screen-cream)' },
  { id: 'itunes', name: 'iTunes', icon: 'simple-icons:itunes', color: '#FA57C1' }
];

const NOW_SHOWING_NOTE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music / Soundtrack' },
  { id: 'books', label: 'Books' },
  { id: 'movies', label: 'Movies' },
  { id: 'tv', label: 'TV' },
  { id: 'apparel', label: 'Apparel' }
];

let globalAudio = null;
let activePlayBtn = null;
const MAX_NOW_SHOWING_CARDS = 20;
let isNowShowingAdminMode = false;
let nowShowingNotesFilter = 'all';
let nowShowingNotesDrawerInitialized = false;

function toggleGlobalAudio(url, playBtn) {
  const circle = playBtn.querySelector('.ns-play-circle');
  const card = playBtn.closest('.now-showing-card');
  const wave = card ? card.querySelector('.soundtrack-wave') : null;

  if (globalAudio && globalAudio.src === url) {
    if (globalAudio.paused) {
      globalAudio.play();
      playBtn.classList.add('playing');
      playBtn.style.opacity = '1';
      if (circle) circle.innerHTML = '&#10074;&#10074;'; // Pause icon
      if (wave) wave.classList.add('is-playing');
    } else {
      globalAudio.pause();
      playBtn.classList.remove('playing');
      if (circle) circle.innerHTML = '&#9654;'; // Play icon
      if (wave) wave.classList.remove('is-playing');
    }
  } else {
    // Stop currently playing
    if (globalAudio) {
      globalAudio.pause();
      if (activePlayBtn) {
        activePlayBtn.classList.remove('playing');
        activePlayBtn.style.opacity = '0';
        const activeCircle = activePlayBtn.querySelector('.ns-play-circle');
        if (activeCircle) activeCircle.innerHTML = '&#9654;';
        const activeCard = activePlayBtn.closest('.now-showing-card');
        const activeWave = activeCard ? activeCard.querySelector('.soundtrack-wave') : null;
        if (activeWave) activeWave.classList.remove('is-playing');
      }
    }

    globalAudio = new Audio(url);
    activePlayBtn = playBtn;
    
    globalAudio.play();
    playBtn.classList.add('playing');
    playBtn.style.opacity = '1';
    if (circle) circle.innerHTML = '&#10074;&#10074;';
    if (wave) wave.classList.add('is-playing');

    globalAudio.addEventListener('ended', () => {
      playBtn.classList.remove('playing');
      playBtn.style.opacity = '0';
      if (circle) circle.innerHTML = '&#9654;';
      if (wave) wave.classList.remove('is-playing');
      globalAudio = null;
      activePlayBtn = null;
    });
  }
}

let nowShowingData = [
  // Fallback defaults in case DB doesn't have them yet
  {
    slug: 'now-showing-1',
    title: 'The Long Walk Home',
    meta: 'Dir. J. Mercer &bull; 2026',
    content: 'A quiet character study shot on 16mm. Rain, neon, and the spaces in between.',
    hero_image: '/assets/images/journal_street.webp',
    kicker: 'NOW WATCHING',
    type: 'FILM',
    link_text: 'OPEN NOTE',
    link_href: '#journal',
    footer_info: '48 MIN IN',
    updated_at: '2026-07-05 22:26:00'
  },
  {
    slug: 'now-showing-2',
    title: 'About Night Windows',
    meta: 'Cineast Journal No. 18',
    content: 'An essay on looking in, late cities, and the frames we cannot quite see.',
    hero_image: '/assets/images/journal_film.webp',
    kicker: 'NOW READING',
    type: 'ESSAY',
    link_text: 'VIEW SELECTION',
    link_href: '#journal',
    footer_info: '12 MIN READ',
    updated_at: '2026-07-05 22:26:00'
  },
  {
    slug: 'now-showing-3',
    title: 'After the Credits, Vol. IV',
    meta: 'Cineast Curated Mix',
    content: 'A late night mix for the walk home. Minimal score, library music, and tape warmth.',
    hero_image: '/assets/images/journal_room.webp',
    kicker: 'NOW LISTENING',
    type: 'MIX',
    link_text: 'LISTEN NOW',
    link_href: '#shorts',
    footer_info: '32 MIN',
    soundtrack_title: 'After the Credits',
    soundtrack_subtitle: 'Cineast Curated Mix Vol. IV',
    updated_at: '2026-07-05 22:26:00'
  },
  {
    slug: 'now-showing-4',
    title: 'Archivist Hoodie',
    meta: 'Black &bull; Heavyweight Fleece',
    content: 'A core layer for late nights and early calls. Limited run.',
    hero_image: '/assets/images/shop_hoodie.webp',
    kicker: 'NOW WEARING',
    type: 'APPAREL',
    link_text: 'EXPLORE DROP',
    link_href: '#shop',
    footer_info: 'LIMITED RUN',
    updated_at: '2026-07-05 22:26:00'
  }
];

export async function initNowShowing() {
  await loadNowShowingFromDB();
  renderNowShowingCards();
  setupNowShowingNotesDrawer();
}

async function loadNowShowingFromDB() {
  for (let i = 0; i < MAX_NOW_SHOWING_CARDS; i++) {
    const slug = `now-showing-${i + 1}`;
    try {
      const response = await getPage(slug);
      if (response && response.page) {
        const page = response.page;
        let metaJson = {};
        try {
          if (page.summary) {
            metaJson = JSON.parse(page.summary);
          }
        } catch (e) {
          console.warn('Failed to parse metadata JSON for page', slug, e);
        }

        const itunesUrl = metaJson.itunes_url || await fetchItunesDirectUrl(metaJson.itunes_id);

        nowShowingData[i] = {
          slug: page.slug,
          title: page.title || '',
          meta: page.meta || '',
          content: page.content || '',
          hero_image: page.hero_image || '',
          kicker: metaJson.kicker || nowShowingData[i]?.kicker || '',
          type: metaJson.type || nowShowingData[i]?.type || '',
          link_text: metaJson.link_text || nowShowingData[i]?.link_text || '',
          link_href: metaJson.link_href || nowShowingData[i]?.link_href || '',
          footer_info: metaJson.footer_info || nowShowingData[i]?.footer_info || '',
          soundtrack_title: metaJson.soundtrack_title || nowShowingData[i]?.soundtrack_title || '',
          soundtrack_subtitle: metaJson.soundtrack_subtitle || nowShowingData[i]?.soundtrack_subtitle || '',
          visible: metaJson.visible !== false,
          updated_at: page.updated_at || nowShowingData[i]?.updated_at || '',
          show_link: metaJson.show_link !== false,
          tmdb_id: metaJson.tmdb_id || null,
          tvdb_id: metaJson.tvdb_id || null,
          itunes_id: metaJson.itunes_id || null,
          openlibrary_id: metaJson.openlibrary_id || null,
          image_position: metaJson.image_position || '50%',
          scrapbook: metaJson.scrapbook || null,
          audio_preview_url: metaJson.audio_preview_url || null,
          itunes_url: itunesUrl,
          spotify_url: metaJson.spotify_url || null,
          streaming_platform: metaJson.streaming_platform || null
        };
      } else if (i >= nowShowingData.length) {
        break;
      }
    } catch (err) {
      if (i >= nowShowingData.length) {
        break;
      }
      // 404 or other errors mean we keep using the local hardcoded fallback.
      console.log(`Now showing card ${i + 1} not in DB, using fallback defaults.`);
    }
  }
}

async function fetchItunesDirectUrl(itunesId) {
  if (!itunesId) return null;

  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(itunesId)}`);
    const data = await response.json();
    return data.results?.[0]?.trackViewUrl || data.results?.[0]?.collectionViewUrl || null;
  } catch (err) {
    console.warn('Failed to resolve iTunes direct URL for Now Showing card', itunesId, err);
    return null;
  }
}

function renderNowShowingCards() {
  const grid = document.querySelector('.now-showing-grid');
  if (!grid) return;

  grid.innerHTML = '';

  nowShowingData.forEach((data, index) => {
    if (!data) return;
    const card = createNowShowingCard(data, index);
    grid.appendChild(card);
  });

  if (isNowShowingAdminMode) {
    grid.appendChild(createGhostTile());
  }

  const cards = grid.querySelectorAll('.now-showing-card');
  cards.forEach((card, index) => {
    const data = nowShowingData[index];
    if (!data) return;

    card.classList.toggle('is-hidden', data.visible === false);

    // Update kicker
    const kickerEl = card.querySelector('.now-card-top span:last-child');
    if (kickerEl) kickerEl.textContent = data.kicker;

    // Update Image
    const imgEl = card.querySelector('.now-card-media img');
    if (imgEl) {
      imgEl.src = data.hero_image;
      imgEl.alt = data.title;
      imgEl.style.objectPosition = `50% ${data.image_position || '50%'}`;
    }

    // Update Soundtrack Panel if it exists
    if (isMusicCard(data)) {
      const soundTitle = card.querySelector('.soundtrack-panel strong');
      const soundSub = card.querySelector('.soundtrack-panel small');
      if (soundTitle) soundTitle.textContent = data.soundtrack_title || '';
      if (soundSub) soundSub.textContent = data.soundtrack_subtitle || '';
    }

    // Update Type
    const typeEl = card.querySelector('.now-card-type');
    if (typeEl) typeEl.textContent = data.type;

    // Update Title
    const titleEl = card.querySelector('h3');
    if (titleEl) titleEl.textContent = data.title;

    // Update Meta
    const metaEl = card.querySelector('.now-card-meta');
    if (metaEl) metaEl.innerHTML = data.meta;

    // Update Description
    const descEl = card.querySelector('.now-card-body p:not(.now-card-meta)');
    if (descEl) descEl.textContent = data.content;

    // Update Link
    const linkEl = card.querySelector('.now-card-footer a');
    if (linkEl) {
      if (data.show_link !== false) {
        linkEl.style.display = '';
        linkEl.setAttribute('href', data.link_href || '#');
        // Keep the arrow span if it exists
        const arrowSpan = linkEl.querySelector('span');
        linkEl.innerHTML = '';
        linkEl.appendChild(document.createTextNode((data.link_text || '') + ' '));
        if (arrowSpan) {
          linkEl.appendChild(arrowSpan);
        } else {
          linkEl.insertAdjacentHTML('beforeend', '<span>&rarr;</span>');
        }
      } else {
        linkEl.style.display = 'none';
      }
    }

    // Update Footer Info
    const infoEl = card.querySelector('.now-card-footer span:not(a span)');
    if (infoEl) infoEl.textContent = data.footer_info;

    // Public Card Music Player Integration
    const mediaContainer = card.querySelector('.now-card-media');
    if (mediaContainer) {
      // Render Streaming Badges (Supports multiple side-by-side badges)
      mediaContainer.querySelectorAll('.ns-streaming-badge').forEach(b => b.remove());

      const badgesToRender = [];

      // 1. Configured streaming platform
      if (data.streaming_platform) {
        const platform = STREAMING_PLATFORMS.find(p => p.id === data.streaming_platform);
        if (platform) {
          badgesToRender.push(platform);
        }
      }

      // 2. iTunes badge (always show if card has music preview or iTunes ID)
      const hasMusic = data.audio_preview_url || data.itunes_id;
      if (hasMusic && !badgesToRender.some(b => b.id === 'itunes')) {
        badgesToRender.push({
          id: 'itunes',
          name: 'iTunes',
          icon: 'simple-icons:itunes',
          color: '#FA57C1'
        });
      }

      // Render all badges from right to left
      let rightOffset = 14;
      badgesToRender.forEach((badgeData) => {
        const badge = document.createElement('div');
        badge.className = 'ns-streaming-badge';
        badge.style.right = `${rightOffset}px`;
        badge.innerHTML = `
          <iconify-icon icon="${badgeData.icon}" style="color: ${badgeData.color}; font-size: 13px;"></iconify-icon>
          <span>${badgeData.name.toUpperCase()}</span>
        `;
        mediaContainer.appendChild(badge);
        rightOffset += 88; // Shift left for next badge
      });
      const oldPlayBtn = mediaContainer.querySelector('.ns-public-play-btn');
      if (oldPlayBtn) oldPlayBtn.remove();

      if (data.audio_preview_url) {
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'ns-public-play-btn';
        playBtn.style.cssText = `
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.45);
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 5;
        `;
        
        playBtn.innerHTML = `
          <div class="ns-play-circle" style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 1.5px solid #F2EEE8;
            background: rgba(5, 5, 5, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #F2EEE8;
            font-size: 1rem;
            transition: transform 0.2s;
          ">
            &#9654;
          </div>
          <span class="ns-play-sample-label">SHORT SAMPLE</span>
        `;

        mediaContainer.appendChild(playBtn);

        // Hover events
        mediaContainer.addEventListener('mouseenter', () => {
          playBtn.style.opacity = '1';
        });
        mediaContainer.addEventListener('mouseleave', () => {
          if (!playBtn.classList.contains('playing')) {
            playBtn.style.opacity = '0';
          }
        });

        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          toggleGlobalAudio(data.audio_preview_url, playBtn);
        });
      }
    }
    // Update Share Button Title and initialize share buttons
    const shareBtn = card.querySelector('.card-share-btn');
    if (shareBtn) {
      shareBtn.setAttribute('data-share-title', data.title || 'Cineast Now Showing');
      if (data.image) {
        shareBtn.setAttribute('data-share-image', data.image);
      }
    }
    initCardShareButtons(card);
  });

  const visibleCardsCount = nowShowingData.filter(d => d.visible !== false).length;
  renderNowShowingNotesDrawer();

  // Toggle scrollable state for grid if > 4 cards
  if (grid) {
    const layoutCardsCount = isNowShowingAdminMode ? nowShowingData.length + 1 : visibleCardsCount;
    if (layoutCardsCount > 4) {
      grid.classList.add('scrollable');
    } else {
      grid.classList.remove('scrollable');
    }
  }
  updateLastUpdatedHeader();
  updateNowShowingAdminUI(isNowShowingAdminMode);
}

function setupNowShowingNotesDrawer() {
  if (nowShowingNotesDrawerInitialized) return;

  const drawer = document.getElementById('now-showing-notes-drawer');
  const closeBtn = document.getElementById('now-showing-notes-close');
  const overlay = document.getElementById('drawer-overlay');
  const triggers = document.querySelectorAll('[data-now-showing-notes-open]');

  if (!drawer || !triggers.length) return;

  const openDrawer = (event) => {
    event?.preventDefault();
    closeOtherNowShowingDrawers(drawer);
    renderNowShowingNotesDrawer();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay?.classList.add('open');
    overlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');

    const anotherDrawerOpen = document.querySelector('.journal-drawer.open, .account-drawer.open, .cart-drawer.open, .customer-drawer.open');
    if (!anotherDrawerOpen) {
      overlay?.classList.remove('open');
      overlay?.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  triggers.forEach((trigger) => trigger.addEventListener('click', openDrawer));
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', () => {
    if (drawer.classList.contains('open')) closeDrawer();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  nowShowingNotesDrawerInitialized = true;
}

function closeOtherNowShowingDrawers(currentDrawer) {
  document.querySelectorAll('.journal-drawer.open, .account-drawer.open, .cart-drawer.open, .customer-drawer.open').forEach((drawer) => {
    if (drawer !== currentDrawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
  });

  document.getElementById('global-search-panel')?.classList.remove('open');
  document.getElementById('mobile-menu')?.classList.remove('active');
}

function renderNowShowingNotesDrawer() {
  const content = document.getElementById('now-showing-notes-content');
  if (!content) return;

  const cards = nowShowingData.filter((card) => card && card.visible !== false);
  const filteredCards = nowShowingNotesFilter === 'all'
    ? cards
    : cards.filter((card) => getNowShowingNoteCategory(card) === nowShowingNotesFilter);

  content.innerHTML = `
    <section class="now-notes-drawer-intro">
      <div class="now-notes-kicker">LIVE EDITORIAL INDEX</div>
      <h2 class="now-notes-title">All Snapshots</h2>
      <p class="now-notes-copy">Filter the current Cineast queue by format, from soundtracks and books to movies, TV, and apparel.</p>
    </section>
    <div class="now-notes-filters" role="tablist" aria-label="Filter now showing notes">
      ${NOW_SHOWING_NOTE_FILTERS.map((filter) => {
        const count = filter.id === 'all'
          ? cards.length
          : cards.filter((card) => getNowShowingNoteCategory(card) === filter.id).length;
        return `
          <button
            type="button"
            class="now-notes-filter ${nowShowingNotesFilter === filter.id ? 'active' : ''}"
            data-now-notes-filter="${filter.id}"
            aria-pressed="${nowShowingNotesFilter === filter.id ? 'true' : 'false'}"
          >
            <span>${escapeHtml(filter.label)}</span>
            <strong>${count}</strong>
          </button>
        `;
      }).join('')}
    </div>
    <div class="now-notes-results" aria-live="polite">
      ${filteredCards.length ? filteredCards.map(createNowShowingNoteCardMarkup).join('') : `
        <div class="now-notes-empty">No cards in this filter yet.</div>
      `}
    </div>
  `;

  content.querySelectorAll('[data-now-notes-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      nowShowingNotesFilter = button.dataset.nowNotesFilter || 'all';
      renderNowShowingNotesDrawer();
    });
  });
}

function createNowShowingNoteCardMarkup(data, index) {
  const category = getNowShowingNoteCategory(data);
  const linkHref = data.show_link !== false ? data.link_href || '#' : '#now-showing';
  const linkText = data.show_link !== false ? data.link_text || 'Open note' : 'View card';
  const directLinks = createNowShowingNoteDirectLinksMarkup(data);

  return `
    <article class="now-notes-card" data-note-category="${category}">
      <a class="now-notes-card-media" href="${escapeHtml(linkHref)}">
        <img src="${escapeHtml(data.hero_image || '')}" alt="${escapeHtml(data.title || 'Now Showing card')}" />
      </a>
      <div class="now-notes-card-body">
        <div class="now-notes-card-top">
          <span>${escapeHtml(getNowShowingNoteCategoryLabel(category))}</span>
          <span>${escapeHtml(data.kicker || `NOTE ${String(index + 1).padStart(2, '0')}`)}</span>
        </div>
        <h3>${escapeHtml(data.title || '')}</h3>
        <p class="now-notes-card-meta">${data.meta || ''}</p>
        <p>${escapeHtml(data.content || '')}</p>
        ${directLinks}
        <a class="now-notes-card-link" href="${escapeHtml(linkHref)}">${escapeHtml(linkText)} <span>&rarr;</span></a>
      </div>
    </article>
  `;
}

function createNowShowingNoteDirectLinksMarkup(data) {
  const links = [
    data.spotify_url ? { href: data.spotify_url, icon: 'simple-icons:spotify', label: 'Spotify' } : null,
    data.itunes_url ? { href: data.itunes_url, icon: 'simple-icons:itunes', label: 'Apple Music' } : null
  ].filter(Boolean);

  if (!links.length) return '';

  return `
    <div class="now-notes-direct-links">
      ${links.map((link) => `
        <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">
          <iconify-icon icon="${link.icon}"></iconify-icon>
          <span>${escapeHtml(link.label)}</span>
        </a>
      `).join('')}
    </div>
  `;
}

function getNowShowingNoteCategory(data) {
  const type = String(data?.type || '').trim().toUpperCase();
  const kicker = String(data?.kicker || '').trim().toUpperCase();
  const haystack = `${type} ${kicker} ${data?.meta || ''} ${data?.title || ''}`.toUpperCase();

  if (isMusicCard(data) || /MUSIC|MIX|SOUNDTRACK|SONG|LISTENING|ALBUM|SCORE/.test(haystack)) return 'music';
  if (/BOOK|NOVEL|READING|READ|AUTHOR|MEMOIR|SCRIPT|SCREENPLAY/.test(haystack)) return 'books';
  if (/TV|SERIES|EPISODE|SHOW/.test(haystack)) return 'tv';
  if (/APPAREL|WEARING|HOODIE|SHIRT|TEE|CAP|JACKET|FLEECE/.test(haystack)) return 'apparel';
  if (/FILM|MOVIE|CINEMA|WATCHING|DIRECTOR|DIR\./.test(haystack)) return 'movies';

  return 'movies';
}

function getNowShowingNoteCategoryLabel(category) {
  return NOW_SHOWING_NOTE_FILTERS.find((filter) => filter.id === category)?.label || 'Movies';
}

function createNowShowingCard(data, index) {
  const card = document.createElement('article');
  card.className = 'now-showing-card';
  card.dataset.cardId = String(index + 1);
  card.innerHTML = `
    <div class="now-card-top">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <span>${escapeHtml(data.kicker)}</span>
    </div>
    ${isMusicCard(data) ? `
      <div class="now-listening-image">
        ${createNowShowingMediaMarkup(data)}
        <div class="soundtrack-panel">
          <span>SOUNDTRACK</span>
          <strong>${escapeHtml(data.soundtrack_title || data.title || '')}</strong>
          <small>${escapeHtml(data.soundtrack_subtitle || data.meta || '')}</small>
          <div class="soundtrack-wave"></div>
        </div>
      </div>
    ` : createNowShowingMediaMarkup(data)}
    <div class="now-card-body">
      <div class="now-card-type">${escapeHtml(data.type)}</div>
      <h3>${escapeHtml(data.title)}</h3>
      <p class="now-card-meta">${data.meta || ''}</p>
      <div class="now-card-rule"></div>
      <p>${escapeHtml(data.content)}</p>
    </div>
    ${isMusicCard(data) ? createMusicLinksMarkup(data) : ''}
    <div class="now-card-footer">
      <a href="${escapeHtml(data.link_href || '#')}">${escapeHtml(data.link_text || '')} <span>&rarr;</span></a>
      <span>${escapeHtml(data.footer_info)}</span>
    </div>
  `;
  return card;
}

function isMusicCard(data) {
  const type = String(data?.type || '').trim().toUpperCase();
  return type === 'MIX' ||
    type === 'MUSIC' ||
    type === 'SONG' ||
    Boolean(data?.audio_preview_url || data?.itunes_id || data?.itunes_url || data?.spotify_url || data?.soundtrack_title || data?.soundtrack_subtitle);
}

function createNowShowingMediaMarkup(data) {
  return `
    <div class="now-card-media">
      <img src="${escapeHtml(data.hero_image)}" alt="${escapeHtml(data.title)}" />
      <button class="card-share-btn" type="button" aria-label="Share card" data-share-title="${escapeHtml(data.title || 'Cineast Now Showing')}" data-share-url="/index.html#now-showing">
        <iconify-icon icon="ph:share-network"></iconify-icon>
      </button>
    </div>
  `;
}

function createMusicLinksMarkup(data) {
  const links = [
    data.spotify_url ? {
      href: data.spotify_url,
      icon: 'simple-icons:spotify',
      label: 'Spotify'
    } : null,
    data.itunes_url ? {
      href: data.itunes_url,
      icon: 'simple-icons:itunes',
      label: 'iTunes'
    } : null
  ].filter(Boolean);

  if (!links.length) return '';

  return `
    <div class="soundtrack-links">
      ${links.map(link => `
        <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" aria-label="Open on ${escapeHtml(link.label)}">
          <iconify-icon icon="${link.icon}"></iconify-icon>
          <span>${escapeHtml(link.label)}</span>
        </a>
      `).join('')}
    </div>
  `;
}

function createGhostTile() {
  const ghost = document.createElement('button');
  ghost.type = 'button';
  ghost.className = 'now-showing-card now-showing-ghost-tile';
  ghost.innerHTML = `
    <span class="now-showing-ghost-plus">+</span>
    <span class="now-showing-ghost-label">ADD NEW CARD</span>
    <span class="now-showing-ghost-slot">SLOT ${String(getNextCardId()).padStart(2, '0')}</span>
  `;
  ghost.addEventListener('click', () => {
    openNowShowingEditor(getNextCardId(), ghost, createBlankNowShowingCard(getNextCardId()), { isNew: true });
  });
  return ghost;
}

function getNextCardId() {
  return nowShowingData.length + 1;
}

function createBlankNowShowingCard(cardId) {
  return {
    slug: `now-showing-${cardId}`,
    title: '',
    meta: '',
    content: '',
    hero_image: '',
    kicker: '',
    type: '',
    link_text: '',
    link_href: '',
    footer_info: '',
    soundtrack_title: '',
    soundtrack_subtitle: '',
    visible: true,
    show_link: true,
    tmdb_id: null,
    tvdb_id: null,
    itunes_id: null,
    openlibrary_id: null,
    image_position: '50%',
    scrapbook: null,
    audio_preview_url: null,
    itunes_url: null,
    spotify_url: null,
    streaming_platform: null
  };
}

function formatLastUpdated(dateInput) {
  if (!dateInput) return null;
  let dateStr = dateInput;
  if (typeof dateInput === 'string' && !dateInput.includes('T')) {
    dateStr = dateInput.replace(' ', 'T') + 'Z';
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return {
    date: `${month} ${day}, ${year}`,
    time: `${hours}:${minutes}`
  };
}

function updateLastUpdatedHeader() {
  const dates = nowShowingData
    .map(d => d.updated_at)
    .filter(Boolean)
    .map(str => {
      let dateStr = str;
      if (typeof str === 'string' && !str.includes('T')) {
        dateStr = str.replace(' ', 'T') + 'Z';
      }
      return new Date(dateStr);
    })
    .filter(d => !isNaN(d.getTime()));

  if (!dates.length) return;

  const latestDate = new Date(Math.max(...dates));
  const formatted = formatLastUpdated(latestDate);
  if (!formatted) return;

  const statusEl = document.querySelector('.now-showing-status');
  if (statusEl) {
    const spans = statusEl.querySelectorAll('span');
    if (spans.length >= 4) {
      spans[2].textContent = formatted.date;
      spans[3].textContent = formatted.time;
    }
  }
}

// Enable/Disable Admin Editing Interface on Now Showing section
export function updateNowShowingAdminUI(isAdmin) {
  isNowShowingAdminMode = isAdmin;
  const grid = document.querySelector('.now-showing-grid');
  const hasGhostTile = Boolean(grid?.querySelector('.now-showing-ghost-tile'));
  if (grid && ((isAdmin && !hasGhostTile) || (!isAdmin && hasGhostTile))) {
    renderNowShowingCards();
    return;
  }

  const cards = document.querySelectorAll('.now-showing-card');
  if (!cards.length) return;

  cards.forEach((card, index) => {
    if (card.classList.contains('now-showing-ghost-tile')) return;
    if (isAdmin) {
      card.classList.add('admin-editable');
      // Ensure edit button exists
      let editBtn = card.querySelector('.now-card-edit-btn');
      if (!editBtn) {
        editBtn = document.createElement('button');
        editBtn.className = 'now-card-edit-btn';
        editBtn.type = 'button';
        editBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
          EDIT
        `;
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openNowShowingEditor(index + 1, card);
        });
        card.appendChild(editBtn);
      }
    } else {
      card.classList.remove('admin-editable');
      const editBtn = card.querySelector('.now-card-edit-btn');
      if (editBtn) editBtn.remove();
    }
  });
}

let activeModal = null;

function openNowShowingEditor(cardId, cardElement, overrideData = null, options = {}) {
  if (activeModal) activeModal.remove();

  const data = overrideData || nowShowingData[cardId - 1];
  if (!data) return;
  const isNewCard = options.isNew === true;

  let selectedItemId = data.tmdb_id || data.tvdb_id || data.itunes_id || data.openlibrary_id || null;
  let selectedSource = data.tmdb_id
    ? 'tmdb'
    : (data.tvdb_id ? 'tvdb' : (data.itunes_id ? 'itunes' : (data.openlibrary_id ? 'openlibrary' : null)));
  let selectedAudioPreviewUrl = data.audio_preview_url || null;
  let currentScrapbook = data.scrapbook || null;

  const isMix = data.type === 'MIX' || data.slug === 'now-showing-3';
  const isBook = /BOOK|NOVEL|READ|AUTHOR|MEMOIR|SCRIPT|SCREENPLAY/.test(`${data.type || ''} ${data.kicker || ''}`.toUpperCase());
  const defaultSource = selectedSource || (isMix ? 'itunes' : (isBook ? 'openlibrary' : 'tmdb'));
  let queryPlaceholder = 'Search title (e.g., Paris, Texas, The Long Walk)...';
  if (defaultSource === 'tvdb') {
    queryPlaceholder = 'Search TV series (e.g., The Bear, Succession)...';
  } else if (defaultSource === 'itunes') {
    queryPlaceholder = 'Search music/song (e.g., After the Credits, Mercer)...';
  } else if (defaultSource === 'openlibrary') {
    queryPlaceholder = 'Search book title or author (e.g., Slouching Towards Bethlehem)...';
  }

  const modal = document.createElement('div');
  modal.className = 'now-showing-editor-modal';
  modal.id = 'now-showing-editor-modal';
  modal.setAttribute('data-lenis-prevent', 'true');

  modal.innerHTML = `
    <div class="ns-modal-overlay"></div>
    <div class="ns-modal-container">
      <div class="ns-modal-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div class="ns-modal-kicker">CMS / EDIT NOW SHOWING CARD</div>
          <h3 class="ns-modal-title">Edit Card #${cardId}</h3>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <button type="button" class="ns-btn-refresh" id="ns-refresh-btn">
            <span style="font-size: 0.75rem;">&#x21BB;</span> REFRESH FROM SOURCE
          </button>
          <button type="button" class="ns-btn duplicate" id="ns-duplicate-btn" style="width: auto; padding: 6px 14px; font-family: var(--font-mono); font-size: 0.65rem; border-radius: 0; line-height: 1.2;">DUPLICATE</button>
          <button type="submit" form="ns-edit-form" class="ns-btn primary" id="ns-save-btn" style="width: auto; padding: 6px 16px; font-family: var(--font-mono); font-size: 0.65rem; border-radius: 0; line-height: 1.2;">${isNewCard ? 'CREATE CARD' : 'SAVE CHANGES'}</button>
          <button type="button" class="ns-modal-close" id="ns-modal-close-btn">&times;</button>
        </div>
      </div>
      
      <div class="ns-modal-body">
        <form id="ns-edit-form">
          <div class="ns-form-row">
            <div class="ns-field">
              <label>KICKER / TOP TEXT</label>
              <input type="text" id="ns-kicker" value="${escapeHtml(data.kicker)}" required />
            </div>
            <div class="ns-field">
              <label>SUB-TYPE</label>
              <input type="text" id="ns-type" value="${escapeHtml(data.type)}" placeholder="FILM, ESSAY, MIX, APPAREL..." required />
            </div>
          </div>

          <div class="ns-field">
            <label>STREAMING PLATFORM BADGE</label>
            <select id="ns-streaming-platform">
              ${STREAMING_PLATFORMS.map(p => `<option value="${p.id}" ${data.streaming_platform === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>

          <div class="ns-field">
            <label>TITLE</label>
            <input type="text" id="ns-title" value="${escapeHtml(data.title)}" required />
          </div>

          <div class="ns-field">
            <label>META (e.g. Director &bull; Year / Specifications)</label>
            <input type="text" id="ns-meta" value="${escapeHtml(data.meta)}" required />
          </div>

          <div class="ns-field">
            <label>CONTENT / DESCRIPTION</label>
            <textarea id="ns-content" rows="3" required>${escapeHtml(data.content)}</textarea>
          </div>

          <div class="ns-field">
            <label>IMAGE URL</label>
            <input type="text" id="ns-image-url" value="${escapeHtml(data.hero_image)}" required />
          </div>

          <div class="ns-field">
            <label>IMAGE ALIGNMENT / POSITION (DRAG PREVIEW OR SLIDE)</label>
            <div class="ns-image-preview-container">
              <img id="ns-preview-img" src="${escapeHtml(data.hero_image)}" style="width: 100%; height: 100%; object-fit: cover; object-position: 50% ${data.image_position || '50%'}; pointer-events: none;" />
              <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(5,5,5,0.72); padding: 4px 8px; font-family: var(--font-mono); font-size: 0.55rem; color: #F2EEE8; pointer-events: none; letter-spacing: 1px;">DRAG TO PAN VERTICALLY</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="range" id="ns-image-position-slider" min="0" max="100" value="${parseInt(data.image_position) || 50}" style="flex: 1; cursor: ew-resize;" />
              <span id="ns-position-value" style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); min-width: 32px;">${data.image_position || '50%'}</span>
            </div>
          </div>

          <div class="ns-field" style="flex-direction: row; align-items: center; gap: 10px; margin-bottom: 12px; cursor: pointer;">
            <input type="checkbox" id="ns-show-link" ${data.show_link !== false ? 'checked' : ''} style="width: auto; height: auto; cursor: pointer; margin: 0;" />
            <label for="ns-show-link" style="cursor: pointer; margin: 0; font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); letter-spacing: 1px; text-transform: uppercase;">Show action link</label>
          </div>

          <div class="ns-form-row">
            <div class="ns-field">
              <label>LINK TEXT</label>
              <input type="text" id="ns-link-text" value="${escapeHtml(data.link_text)}" />
            </div>
            <div class="ns-field">
              <label>LINK HREF (e.g. #journal, #shop)</label>
              <input type="text" id="ns-link-href" value="${escapeHtml(data.link_href)}" />
            </div>
          </div>

          <div class="ns-field">
            <label>FOOTER STATE / INFO</label>
            <input type="text" id="ns-footer-info" value="${escapeHtml(data.footer_info)}" required />
          </div>

          <div class="ns-field" style="flex-direction: row; align-items: center; gap: 10px; margin-bottom: 24px; cursor: pointer;">
            <input type="checkbox" id="ns-visible" ${data.visible !== false ? 'checked' : ''} style="width: auto; height: auto; cursor: pointer; margin: 0;" />
            <label for="ns-visible" style="cursor: pointer; margin: 0; font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); letter-spacing: 1px; text-transform: uppercase;">Show card publicly</label>
          </div>

          <div class="ns-form-row ns-soundtrack-fields">
            <div class="ns-field">
              <label>SOUNDTRACK TITLE</label>
              <input type="text" id="ns-sound-title" value="${escapeHtml(data.soundtrack_title || '')}" />
            </div>
            <div class="ns-field">
              <label>SOUNDTRACK SUBTITLE</label>
              <input type="text" id="ns-sound-sub" value="${escapeHtml(data.soundtrack_subtitle || '')}" />
            </div>
          </div>

          <div class="ns-form-row ns-soundtrack-fields">
            <div class="ns-field">
              <label>ITUNES DIRECT LINK</label>
              <input type="url" id="ns-itunes-url" value="${escapeHtml(data.itunes_url || '')}" placeholder="https://music.apple.com/..." />
            </div>
            <div class="ns-field">
              <label>SPOTIFY DIRECT LINK</label>
              <input type="url" id="ns-spotify-url" value="${escapeHtml(data.spotify_url || '')}" placeholder="https://open.spotify.com/..." />
            </div>
          </div>

          <div class="ns-field">
            <button type="button" class="ns-btn" id="ns-lookup-music-links-btn">LOOK UP DIRECT LINKS</button>
          </div>

        </form>

        <div class="ns-modal-sidebar" style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Search Integration Panel -->
          <div class="ns-tmdb-panel">
            <div class="ns-tmdb-header">
              <h4>Search Integration</h4>
              <p>Search movie, TV, book, or music databases to automatically populate details and media.</p>
              <div class="ns-search-source-toggle" style="display: flex; gap: 14px; margin: 10px 0 16px; flex-wrap: wrap;">
                <label class="ns-search-radio-label">
                  <input type="radio" name="ns-search-source" value="tmdb" ${defaultSource === 'tmdb' ? 'checked' : ''} style="width: auto; margin: 0;" /> TMDb (FILMS)
                </label>
                <label class="ns-search-radio-label">
                  <input type="radio" name="ns-search-source" value="tvdb" ${defaultSource === 'tvdb' ? 'checked' : ''} style="width: auto; margin: 0;" /> TVDB (TV SHOWS)
                </label>
                <label class="ns-search-radio-label">
                  <input type="radio" name="ns-search-source" value="openlibrary" ${defaultSource === 'openlibrary' ? 'checked' : ''} style="width: auto; margin: 0;" /> OPEN LIBRARY (BOOKS)
                </label>
                <label class="ns-search-radio-label">
                  <input type="radio" name="ns-search-source" value="itunes" ${defaultSource === 'itunes' ? 'checked' : ''} style="width: auto; margin: 0;" /> ITUNES (MUSIC)
                </label>
              </div>
            </div>
            <div class="ns-tmdb-search-bar">
              <input type="text" id="ns-tmdb-query" placeholder="${queryPlaceholder}" />
              <button type="button" class="ns-btn" id="ns-tmdb-search-btn">SEARCH</button>
            </div>
            <div class="ns-tmdb-results" id="ns-tmdb-results"></div>
            <div class="ns-tmdb-stills-section" id="ns-tmdb-stills-section" style="display: none;">
              <h5>Select Backdrop Image</h5>
              <div class="ns-tmdb-stills-grid" id="ns-tmdb-stills-grid"></div>
            </div>
          </div>

          <!-- Scrapbook Reference Panel -->
          <div class="ns-scrapbook-panel" id="ns-scrapbook-panel" style="border: 1px dashed rgba(242,238,232,0.22); padding: 18px; background: rgba(5,5,5,0.34); display: none;">
            <div style="font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-projector-amber); letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase;">SCRAPBOOK REFERENCE (NOT PUBLISHED)</div>
            <div id="ns-scrapbook-content" style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); line-height: 1.6; display: flex; flex-direction: column; gap: 8px;">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  activeModal = modal;
  document.body.style.overflow = 'hidden';

  // Event handlers
  const closeBtn = modal.querySelector('#ns-modal-close-btn');
  const overlay = modal.querySelector('.ns-modal-overlay');
  
  function closeModal() {
    modal.remove();
    activeModal = null;
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Link toggle logic
  const showLinkCheckbox = modal.querySelector('#ns-show-link');
  const linkTextField = modal.querySelector('#ns-link-text');
  const linkHrefField = modal.querySelector('#ns-link-href');
  
  function updateLinkFieldsState() {
    const enabled = showLinkCheckbox.checked;
    linkTextField.disabled = !enabled;
    linkHrefField.disabled = !enabled;
    linkTextField.required = enabled;
    linkHrefField.required = enabled;
    linkTextField.closest('.ns-field').style.opacity = enabled ? '1' : '0.45';
    linkHrefField.closest('.ns-field').style.opacity = enabled ? '1' : '0.45';
  }
  
  showLinkCheckbox.addEventListener('change', updateLinkFieldsState);
  updateLinkFieldsState();

  const lookupMusicLinksBtn = modal.querySelector('#ns-lookup-music-links-btn');
  lookupMusicLinksBtn.addEventListener('click', async () => {
    const title = modal.querySelector('#ns-title').value.trim();
    const soundtrackTitle = modal.querySelector('#ns-sound-title').value.trim();
    const soundtrackSubtitle = modal.querySelector('#ns-sound-sub').value.trim();
    const meta = modal.querySelector('#ns-meta').value.trim();
    const album = meta.split('&bull;').pop()?.trim() || '';
    const query = [soundtrackTitle || title, soundtrackSubtitle].filter(Boolean).join(' ').trim();
    const itunesId = selectedSource === 'itunes' ? selectedItemId : (data.itunes_id || '');

    if (!query && !itunesId) {
      showToast('Add a music title or choose an iTunes result first.', 'error', { title: 'Lookup needs music' });
      return;
    }

    lookupMusicLinksBtn.disabled = true;
    lookupMusicLinksBtn.textContent = 'LOOKING UP...';

    try {
      const result = await lookupMusicLinks({
        query,
        title: soundtrackTitle || title,
        artist: soundtrackSubtitle,
        album,
        itunesId
      });

      const itunesUrlInput = modal.querySelector('#ns-itunes-url');
      const spotifyUrlInput = modal.querySelector('#ns-spotify-url');

      if (result?.itunes?.url) {
        itunesUrlInput.value = result.itunes.url;
      }
      if (result?.itunes?.id) {
        selectedItemId = result.itunes.id;
        selectedSource = 'itunes';
        updateRefreshButtonState();
      }
      if (result?.spotify?.url) {
        spotifyUrlInput.value = result.spotify.url;
      }

      const spotifyNote = result?.spotify?.url && !result?.spotify?.exact
        ? ' Spotify used a search link; add Spotify API credentials for exact track links.'
        : '';
      showToast(`Music links filled.${spotifyNote}`, 'success', { title: 'Links found' });
    } catch (error) {
      console.error('Failed to look up music links:', error);
      showToast(error.message || 'Failed to look up music links.', 'error', { title: 'Lookup failed' });
    } finally {
      lookupMusicLinksBtn.disabled = false;
      lookupMusicLinksBtn.textContent = 'LOOK UP DIRECT LINKS';
    }
  });

  // Form submit handler
  const form = modal.querySelector('#ns-edit-form');

  function getPayloadFromForm() {
    const kickerVal = modal.querySelector('#ns-kicker').value.trim();
    const typeVal = modal.querySelector('#ns-type').value.trim();
    const titleVal = modal.querySelector('#ns-title').value.trim();
    const metaVal = modal.querySelector('#ns-meta').value.trim();
    const contentVal = modal.querySelector('#ns-content').value.trim();
    const imageUrlVal = modal.querySelector('#ns-image-url').value.trim();
    const linkTextVal = modal.querySelector('#ns-link-text').value.trim();
    const linkHrefVal = modal.querySelector('#ns-link-href').value.trim();
    const footerInfoVal = modal.querySelector('#ns-footer-info').value.trim();
    const visibleVal = modal.querySelector('#ns-visible').checked;
    const showLinkVal = showLinkCheckbox.checked;
    const imagePositionVal = modal.querySelector('#ns-image-position-slider').value + '%';
    const streamingPlatformVal = modal.querySelector('#ns-streaming-platform').value;

    const soundtrack_title = modal.querySelector('#ns-sound-title').value.trim();
    const soundtrack_subtitle = modal.querySelector('#ns-sound-sub').value.trim();
    const itunesUrlVal = modal.querySelector('#ns-itunes-url').value.trim();
    const spotifyUrlVal = modal.querySelector('#ns-spotify-url').value.trim();

    const summary = {
        kicker: kickerVal,
        type: typeVal,
        link_text: linkTextVal,
        link_href: linkHrefVal,
        footer_info: footerInfoVal,
        soundtrack_title,
        soundtrack_subtitle,
        visible: visibleVal,
        show_link: showLinkVal,
        tmdb_id: selectedSource === 'tmdb' ? selectedItemId : null,
        tvdb_id: selectedSource === 'tvdb' ? selectedItemId : null,
        itunes_id: selectedSource === 'itunes' ? selectedItemId : null,
        openlibrary_id: selectedSource === 'openlibrary' ? selectedItemId : null,
        audio_preview_url: selectedAudioPreviewUrl,
        itunes_url: itunesUrlVal,
        spotify_url: spotifyUrlVal,
        image_position: imagePositionVal,
        scrapbook: currentScrapbook,
        streaming_platform: streamingPlatformVal
      };

    return {
      payload: {
        title: titleVal,
        meta: metaVal,
        content: contentVal,
        hero_image: imageUrlVal,
        kind: 'note',
        status: 'published',
        auto_enrich: false,
        summary: JSON.stringify(summary)
      },
      localData: {
        title: titleVal,
        meta: metaVal,
        content: contentVal,
        hero_image: imageUrlVal,
        ...summary
      }
    };
  }

  async function persistCard(targetCardId, payload) {
    try {
      try {
        await updatePage(`now-showing-${targetCardId}`, payload);
      } catch (err) {
        if (err.status === 404) {
          await createPage({
            id: `now-showing-${targetCardId}`,
            slug: `now-showing-${targetCardId}`,
            ...payload
          });
        } else {
          throw err;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = modal.querySelector('#ns-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
    const { payload, localData } = getPayloadFromForm();

    try {
      await persistCard(cardId, payload);
      // Update local storage
      nowShowingData[cardId - 1] = {
        slug: `now-showing-${cardId}`,
        ...localData
      };

      renderNowShowingCards();
      closeModal();
      showToast(isNewCard ? 'Now Showing card created successfully!' : 'Now Showing card updated successfully!', 'success', { title: isNewCard ? 'Card created' : 'Card updated' });
    } catch (error) {
      console.error('Failed to save Now Showing card:', error);
      alert(error.message || 'Failed to save changes.');
      saveBtn.disabled = false;
      saveBtn.textContent = isNewCard ? 'CREATE CARD' : 'SAVE CHANGES';
    }
  });

  const duplicateBtn = modal.querySelector('#ns-duplicate-btn');
  duplicateBtn.addEventListener('click', async () => {
    const targetCardId = getNextCardId();
    duplicateBtn.disabled = true;
    duplicateBtn.textContent = 'DUPLICATING...';
    const { payload, localData } = getPayloadFromForm();

    try {
      await createPage({
        id: `now-showing-${targetCardId}`,
        slug: `now-showing-${targetCardId}`,
        ...payload
      });
      nowShowingData[targetCardId - 1] = {
        slug: `now-showing-${targetCardId}`,
        ...localData
      };
      renderNowShowingCards();
      closeModal();
      showToast(`Duplicated as card #${targetCardId}.`, 'success', { title: 'Card duplicated' });
      openNowShowingEditor(targetCardId, null);
    } catch (error) {
      console.error('Failed to duplicate Now Showing card:', error);
      alert(error.message || 'Failed to duplicate card.');
      duplicateBtn.disabled = false;
      duplicateBtn.textContent = 'DUPLICATE';
    }
  });

  // Live image position preview drag & slider logic
  const previewContainer = modal.querySelector('.ns-image-preview-container');
  const previewImg = modal.querySelector('#ns-preview-img');
  const positionSlider = modal.querySelector('#ns-image-position-slider');
  const positionValText = modal.querySelector('#ns-position-value');
  let currentYPercent = parseInt(data.image_position) || 50;

  function updatePosition(percent) {
    currentYPercent = Math.max(0, Math.min(100, percent));
    positionSlider.value = currentYPercent;
    positionValText.textContent = currentYPercent + '%';
    if (previewImg) {
      previewImg.style.objectPosition = `50% ${currentYPercent}%`;
    }
  }

  positionSlider.addEventListener('input', (e) => {
    updatePosition(e.target.value);
  });

  const imageUrlInput = modal.querySelector('#ns-image-url');
  imageUrlInput.addEventListener('input', (e) => {
    if (previewImg) {
      previewImg.src = e.target.value || '';
    }
  });

  let isDragging = false;
  let startY = 0;
  let startPercent = 0;

  previewContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startPercent = currentYPercent;
    previewContainer.style.cursor = 'ns-resize';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const deltaPercent = Math.round((deltaY / 180) * 100);
    updatePosition(startPercent + deltaPercent);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      previewContainer.style.cursor = 'ns-resize';
    }
  });

  // Scrapbook reference UI
  const scrapbookPanel = modal.querySelector('#ns-scrapbook-panel');
  const scrapbookContent = modal.querySelector('#ns-scrapbook-content');

  function renderScrapbook() {
    if (!scrapbookPanel || !scrapbookContent) return;
    if (!currentScrapbook) {
      scrapbookPanel.style.display = 'none';
      return;
    }

    scrapbookPanel.style.display = 'block';

    if (selectedSource === 'tmdb') {
      scrapbookContent.innerHTML = `
        <div><strong>TAGLINE:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.tagline || 'N/A')}</span></div>
        <div><strong>GENRES:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.genres || 'N/A')}</span></div>
        <div><strong>RUNTIME:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.runtime || 'N/A')}</span></div>
        <div><strong>RATING:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.rating || 'N/A')}</span></div>
        <div><strong>RELEASED:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.release_date || 'N/A')}</span></div>
        <div><strong>TOP CAST:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.cast || 'N/A')}</span></div>
      `;
    } else if (selectedSource === 'openlibrary') {
      scrapbookContent.innerHTML = `
        <div><strong>TITLE:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.title || 'N/A')}</span></div>
        <div><strong>FIRST PUBLISHED:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.firstPublishDate || currentScrapbook.year || 'N/A')}</span></div>
        <div><strong>SUBJECTS:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.subjects || 'N/A')}</span></div>
        <div><strong>OPEN LIBRARY:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.openLibraryUrl || currentScrapbook.workKey || 'N/A')}</span></div>
      `;
    } else {
      scrapbookContent.innerHTML = `
        <div><strong>NETWORK:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.network || 'N/A')}</span></div>
        <div><strong>GENRES:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.genres || 'N/A')}</span></div>
        <div><strong>STATUS:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.status || 'N/A')}</span></div>
        <div><strong>FIRST AIRED:</strong> <span style="color: rgba(242,238,232,0.85);">${escapeHtml(currentScrapbook.year || 'N/A')}</span></div>
        <div><strong>OVERVIEW:</strong> <span style="display: block; margin-top: 4px; line-height: 1.4; color: rgba(242,238,232,0.55);">${escapeHtml(currentScrapbook.overview || 'N/A')}</span></div>
      `;
    }
  }

  renderScrapbook();

  // Refresh from source logic
  const refreshBtn = modal.querySelector('#ns-refresh-btn');
  
  function updateRefreshButtonState() {
    if (!refreshBtn) return;
    const hasSource = Boolean(selectedItemId && selectedSource);
    refreshBtn.disabled = !hasSource;
  }

  updateRefreshButtonState();

  refreshBtn.addEventListener('click', async () => {
    if (!selectedItemId || !selectedSource) return;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span style="font-size: 0.75rem;">&#x21BB;</span> REFRESHING...';
    
    try {
      const yearText = modal.querySelector('#ns-meta').value.match(/\d{4}/);
      const year = yearText ? yearText[0] : '';
      if (selectedSource === 'tmdb') {
        const res = await fetchTmdbImages(selectedItemId);
        if (res) {
          if (res.overview) {
            modal.querySelector('#ns-content').value = res.overview;
          }
          if (res.director) {
            modal.querySelector('#ns-meta').value = `Dir. ${res.director} &bull; ${year}`;
          }
          if (res.scrapbook) {
            currentScrapbook = res.scrapbook;
            renderScrapbook();
          }
          
          // Refresh stills
          stillsSection.style.display = 'block';
          stillsGrid.innerHTML = '';
          const imagePaths = [...(res.backdrops || [])];
          const poster = modal.querySelector('#ns-image-url').value;
          if (poster && !imagePaths.includes(poster)) {
            imagePaths.unshift(poster);
          }
          
          stillsGrid.innerHTML = imagePaths.map(path => `
            <div class="ns-tmdb-still-item" data-url="${escapeHtml(path)}">
              <img src="${escapeHtml(path)}" alt="Backdrop Still" />
            </div>
          `).join('');
          
          stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(still => {
            still.addEventListener('click', () => {
              stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(s => s.classList.remove('selected'));
              still.classList.add('selected');
              modal.querySelector('#ns-image-url').value = still.getAttribute('data-url');
              if (previewImg) previewImg.src = still.getAttribute('data-url');
            });
          });
        }
      } else if (selectedSource === 'tvdb') {
        const res = await fetchTvdbImages(selectedItemId);
        if (res) {
          if (res.scrapbook) {
            currentScrapbook = res.scrapbook;
            renderScrapbook();
          }
          if (res.overview) {
            modal.querySelector('#ns-content').value = res.overview;
          }
          // Refresh stills
          stillsSection.style.display = 'block';
          stillsGrid.innerHTML = '';
          const imagePaths = [...(res.backdrops || [])];
          const poster = modal.querySelector('#ns-image-url').value;
          if (poster && !imagePaths.includes(poster)) {
            imagePaths.unshift(poster);
          }
          
          stillsGrid.innerHTML = imagePaths.map(path => `
            <div class="ns-tmdb-still-item" data-url="${escapeHtml(path)}">
              <img src="${escapeHtml(path)}" alt="Backdrop Still" />
            </div>
          `).join('');
          
          stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(still => {
            still.addEventListener('click', () => {
              stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(s => s.classList.remove('selected'));
              still.classList.add('selected');
              modal.querySelector('#ns-image-url').value = still.getAttribute('data-url');
              if (previewImg) previewImg.src = still.getAttribute('data-url');
            });
          });
        }
      } else if (selectedSource === 'openlibrary') {
        const res = await fetchOpenLibraryImages(selectedItemId);
        if (res) {
          if (res.overview) {
            modal.querySelector('#ns-content').value = res.overview;
          }
          if (res.scrapbook) {
            currentScrapbook = res.scrapbook;
            renderScrapbook();
          }

          stillsSection.style.display = 'block';
          const imagePaths = [...(res.covers || res.backdrops || [])];
          const poster = modal.querySelector('#ns-image-url').value;
          if (poster && !imagePaths.includes(poster)) {
            imagePaths.unshift(poster);
          }

          if (!imagePaths.length) {
            stillsGrid.innerHTML = '<div class="ns-tmdb-empty">No book covers available.</div>';
          } else {
            stillsGrid.innerHTML = imagePaths.map(path => `
              <div class="ns-tmdb-still-item" data-url="${escapeHtml(path)}">
                <img src="${escapeHtml(path)}" alt="Book cover" />
              </div>
            `).join('');

            stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(still => {
              still.addEventListener('click', () => {
                stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(s => s.classList.remove('selected'));
                still.classList.add('selected');
                modal.querySelector('#ns-image-url').value = still.getAttribute('data-url');
                if (previewImg) previewImg.src = still.getAttribute('data-url');
              });
            });
          }
        }
      } else if (selectedSource === 'itunes') {
        const url = `https://itunes.apple.com/lookup?id=${selectedItemId}`;
        const res = await fetch(url);
        const data = await res.json();
        const item = data.results?.[0];
        if (item) {
          const artwork = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          const previewUrl = item.previewUrl;
          selectedAudioPreviewUrl = previewUrl;
          modal.querySelector('#ns-itunes-url').value = item.trackViewUrl || '';
          
          currentScrapbook = {
            artistName: item.artistName,
            trackName: item.trackName,
            collectionName: item.collectionName,
            genre: item.primaryGenreName || 'N/A',
            releaseDate: item.releaseDate ? item.releaseDate.slice(0, 10) : 'N/A',
            trackTime: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}:${String(Math.floor((item.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}` : 'N/A'
          };
          renderScrapbook();

          stillsSection.style.display = 'block';
          stillsGrid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 20px; border: 1px dashed rgba(242,238,232,0.16); background: rgba(5,5,5,0.22); text-align: center;">
              <p style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); margin-bottom: 12px;">MUSIC SAMPLE PREVIEW</p>
              <audio controls src="${escapeHtml(previewUrl)}" style="width: 100%; max-width: 300px; height: 32px; filter: invert(0.9) hue-rotate(180deg);"></audio>
            </div>
          `;
        }
      }
      showToast('Card data refreshed from source!', 'success', { title: 'Data refreshed' });
    } catch (err) {
      console.error('Failed to refresh data:', err);
      showToast('Failed to refresh card data.', 'error', { title: 'Refresh failed' });
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span style="font-size: 0.75rem;">&#x21BB;</span> REFRESH FROM SOURCE';
    }
  });

  // TMDb/TVDB search handler
  const tmdbSearchBtn = modal.querySelector('#ns-tmdb-search-btn');
  const tmdbQueryInput = modal.querySelector('#ns-tmdb-query');
  const tmdbResultsContainer = modal.querySelector('#ns-tmdb-results');
  const stillsSection = modal.querySelector('#ns-tmdb-stills-section');
  const stillsGrid = modal.querySelector('#ns-tmdb-stills-grid');

  modal.querySelectorAll('input[name="ns-search-source"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const source = e.target.value;
      if (source === 'tmdb') {
        tmdbQueryInput.placeholder = 'Search title (e.g., Paris, Texas, The Long Walk)...';
      } else if (source === 'tvdb') {
        tmdbQueryInput.placeholder = 'Search TV series (e.g., The Bear, Succession)...';
      } else if (source === 'openlibrary') {
        tmdbQueryInput.placeholder = 'Search book title or author (e.g., Slouching Towards Bethlehem)...';
      } else if (source === 'itunes') {
        tmdbQueryInput.placeholder = 'Search music/song (e.g., After the Credits, Mercer)...';
      }
    });
  });

  async function performExternalSearch() {
    const query = tmdbQueryInput.value.trim();
    if (!query) return;

    const source = modal.querySelector('input[name="ns-search-source"]:checked').value;

    tmdbSearchBtn.disabled = true;
    tmdbSearchBtn.textContent = 'SEARCHING...';
    tmdbResultsContainer.innerHTML = `<div class="ns-tmdb-loading">Searching ${source.toUpperCase()}...</div>`;
    stillsSection.style.display = 'none';

    try {
      let results = [];
      if (source === 'tmdb') {
        const response = await searchTmdb(query);
        results = response?.results || [];
      } else if (source === 'tvdb') {
        const response = await searchTvdb(query);
        results = response?.results || [];
      } else if (source === 'openlibrary') {
        const response = await searchOpenLibrary(query);
        results = (response?.results || []).map(item => ({
          ...item,
          isOpenLibrary: true
        }));
      } else if (source === 'itunes') {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`;
        const res = await fetch(url);
        const data = await res.json();
        results = (data.results || []).map(item => ({
          id: item.trackId,
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName,
          poster_path: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
          previewUrl: item.previewUrl,
          trackViewUrl: item.trackViewUrl,
          primaryGenreName: item.primaryGenreName,
          releaseDate: item.releaseDate,
          trackTimeMillis: item.trackTimeMillis,
          isItunes: true
        }));
      }

      if (!results.length) {
        tmdbResultsContainer.innerHTML = `<div class="ns-tmdb-empty">No entries found on ${source.toUpperCase()}.</div>`;
        return;
      }

      tmdbResultsContainer.innerHTML = results.map(item => {
        if (item.isItunes) {
          return `
            <div class="ns-tmdb-item ns-itunes-item" data-id="${item.id}" data-preview="${escapeHtml(item.previewUrl || '')}" data-itunes-url="${escapeHtml(item.trackViewUrl || '')}" data-poster="${escapeHtml(item.poster_path || '')}" data-artist="${escapeHtml(item.artist || '')}" data-track="${escapeHtml(item.title || '')}" data-album="${escapeHtml(item.album || '')}" data-genre="${escapeHtml(item.primaryGenreName || '')}" data-released="${escapeHtml(item.releaseDate || '')}" data-duration="${item.trackTimeMillis || 0}">
              ${item.poster_path ? `<img src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" />` : '<div class="ns-tmdb-item-no-poster">NO COVER</div>'}
              <div class="ns-tmdb-item-info">
                <span class="ns-tmdb-item-title">${escapeHtml(item.title)}</span>
                <span class="ns-tmdb-item-year">${escapeHtml(item.artist)}</span>
              </div>
            </div>
          `;
        }
        if (item.isOpenLibrary) {
          return `
            <div class="ns-tmdb-item ns-openlibrary-item" data-id="${escapeHtml(item.id)}" data-poster="${escapeHtml(item.poster_path || '')}" data-overview="${escapeHtml(item.overview || '')}" data-author="${escapeHtml(item.author || '')}" data-year="${escapeHtml(item.year || '')}" data-cover-id="${escapeHtml(item.cover_id || '')}">
              ${item.poster_path ? `<img src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" />` : '<div class="ns-tmdb-item-no-poster">NO COVER</div>'}
              <div class="ns-tmdb-item-info">
                <span class="ns-tmdb-item-title">${escapeHtml(item.title)}</span>
                <span class="ns-tmdb-item-year">${escapeHtml([item.author, item.year].filter(Boolean).join(' • '))}</span>
              </div>
            </div>
          `;
        }
        return `
          <div class="ns-tmdb-item" data-id="${item.id}" data-poster="${escapeHtml(item.poster_path || '')}" data-overview="${escapeHtml(item.overview || '')}">
            ${item.poster_path ? `<img src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" />` : '<div class="ns-tmdb-item-no-poster">NO POSTER</div>'}
            <div class="ns-tmdb-item-info">
              <span class="ns-tmdb-item-title">${escapeHtml(item.title)}</span>
              ${item.year ? `<span class="ns-tmdb-item-year">(${escapeHtml(item.year)})</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Add selection listeners
      tmdbResultsContainer.querySelectorAll('.ns-tmdb-item').forEach(item => {
        item.addEventListener('click', async () => {
          tmdbResultsContainer.querySelectorAll('.ns-tmdb-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');

          const itemId = item.getAttribute('data-id');
          const poster = item.getAttribute('data-poster');

          if (item.classList.contains('ns-itunes-item')) {
            const previewUrl = item.getAttribute('data-preview');
            const itunesUrl = item.getAttribute('data-itunes-url');
            const artist = item.getAttribute('data-artist');
            const track = item.getAttribute('data-track');
            const album = item.getAttribute('data-album');
            const genre = item.getAttribute('data-genre');
            const released = item.getAttribute('data-released');
            const durationMs = parseInt(item.getAttribute('data-duration')) || 0;

            selectedItemId = itemId;
            selectedSource = 'itunes';
            selectedAudioPreviewUrl = previewUrl;
            updateRefreshButtonState();

            // Autofill form fields
            modal.querySelector('#ns-title').value = track;
            modal.querySelector('#ns-type').value = 'MIX';
            modal.querySelector('#ns-kicker').value = 'NOW LISTENING';
            modal.querySelector('#ns-meta').value = `${artist} &bull; ${album}`;
            modal.querySelector('#ns-content').value = `Listening to ${track} by ${artist} from the album ${album}.`;
            modal.querySelector('#ns-image-url').value = poster;
            modal.querySelector('#ns-itunes-url').value = itunesUrl || '';
            if (previewImg) {
              previewImg.src = poster || '';
            }

            modal.querySelector('#ns-sound-title').value = track;
            modal.querySelector('#ns-sound-sub').value = artist;

            currentScrapbook = {
              artistName: artist,
              trackName: track,
              collectionName: album,
              genre: genre || 'N/A',
              releaseDate: released ? released.slice(0, 10) : 'N/A',
              trackTime: durationMs ? `${Math.floor(durationMs / 60000)}:${String(Math.floor((durationMs % 60000) / 1000)).padStart(2, '0')}` : 'N/A'
            };
            renderScrapbook();

            // Render audio sample player inside stills container area
            stillsSection.style.display = 'block';
            stillsGrid.innerHTML = `
              <div style="grid-column: 1/-1; padding: 20px; border: 1px dashed rgba(242,238,232,0.16); background: rgba(5,5,5,0.22); text-align: center;">
                <p style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-silver-reel); margin-bottom: 12px;">MUSIC SAMPLE PREVIEW</p>
                <audio controls src="${escapeHtml(previewUrl)}" style="width: 100%; max-width: 300px; height: 32px; filter: invert(0.9) hue-rotate(180deg);"></audio>
              </div>
            `;
            return;
          }

          if (item.classList.contains('ns-openlibrary-item')) {
            const title = item.querySelector('.ns-tmdb-item-title').textContent;
            const author = item.getAttribute('data-author') || '';
            const year = item.getAttribute('data-year') || '';
            const overview = item.getAttribute('data-overview') || '';

            selectedItemId = itemId;
            selectedSource = 'openlibrary';
            selectedAudioPreviewUrl = null;
            updateRefreshButtonState();

            modal.querySelector('#ns-title').value = title;
            modal.querySelector('#ns-type').value = 'BOOK';
            modal.querySelector('#ns-kicker').value = 'NOW READING';
            modal.querySelector('#ns-meta').value = [author, year].filter(Boolean).join(' &bull; ');
            modal.querySelector('#ns-content').value = overview || `Reading ${title}${author ? ` by ${author}` : ''}.`;
            modal.querySelector('#ns-image-url').value = poster || '';
            if (previewImg) {
              previewImg.src = poster || '';
            }

            currentScrapbook = {
              title,
              year,
              firstPublishDate: year,
              subjects: overview.replace(/^Subjects:\s*/i, '').replace(/\.$/, ''),
              workKey: itemId,
              openLibraryUrl: `https://openlibrary.org${itemId}`
            };
            renderScrapbook();

            stillsSection.style.display = 'block';
            stillsGrid.innerHTML = poster
              ? `
                <div class="ns-tmdb-still-item selected" data-url="${escapeHtml(poster)}">
                  <img src="${escapeHtml(poster)}" alt="Book cover" />
                </div>
              `
              : '<div class="ns-tmdb-empty">No book cover available.</div>';
            return;
          }

          const overview = item.getAttribute('data-overview');
          const title = item.querySelector('.ns-tmdb-item-title').textContent;
          const yearText = item.querySelector('.ns-tmdb-item-year')?.textContent || '';
          const year = yearText.replace(/[()]/g, '');

          selectedItemId = itemId;
          selectedSource = source;
          updateRefreshButtonState();

          // Autofill form fields
          modal.querySelector('#ns-title').value = title;
          modal.querySelector('#ns-type').value = source === 'tmdb' ? 'FILM' : 'TV';
          modal.querySelector('#ns-kicker').value = 'NOW WATCHING';
          modal.querySelector('#ns-meta').value = source === 'tmdb' ? `Dir.  &bull; ${year}` : `Series &bull; ${year}`;
          if (overview) {
            modal.querySelector('#ns-content').value = overview;
          }
          if (previewImg) {
            previewImg.src = poster || '';
          }

          // Load stills
          stillsSection.style.display = 'block';
          stillsGrid.innerHTML = '<div class="ns-tmdb-loading">Loading backdrop stills...</div>';

          try {
            let backdrops = [];
            if (source === 'tmdb') {
              const res = await fetchTmdbImages(itemId);
              backdrops = res?.backdrops || [];
              if (res?.director) {
                modal.querySelector('#ns-meta').value = `Dir. ${res.director} &bull; ${year}`;
              }
              if (res?.overview) {
                modal.querySelector('#ns-content').value = res.overview;
              }
              if (res?.scrapbook) {
                currentScrapbook = res.scrapbook;
                renderScrapbook();
              }
            } else {
              const res = await fetchTvdbImages(itemId);
              backdrops = res?.backdrops || [];
              if (res?.scrapbook) {
                currentScrapbook = res.scrapbook;
                renderScrapbook();
              }
              if (res?.overview) {
                modal.querySelector('#ns-content').value = res.overview;
              }
            }
            
            const imagePaths = [...backdrops];
            if (poster && !imagePaths.includes(poster)) {
              imagePaths.unshift(poster);
            }

            if (!imagePaths.length) {
              stillsGrid.innerHTML = '<div class="ns-tmdb-empty">No backdrop images available.</div>';
              return;
            }

            stillsGrid.innerHTML = imagePaths.map(path => `
              <div class="ns-tmdb-still-item" data-url="${escapeHtml(path)}">
                <img src="${escapeHtml(path)}" alt="Backdrop Still" />
              </div>
            `).join('');

            // Click listener for still selection
            stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(still => {
              still.addEventListener('click', () => {
                stillsGrid.querySelectorAll('.ns-tmdb-still-item').forEach(s => s.classList.remove('selected'));
                still.classList.add('selected');
                modal.querySelector('#ns-image-url').value = still.getAttribute('data-url');
                if (previewImg) previewImg.src = still.getAttribute('data-url');
              });
            });

          } catch (e) {
            console.error('Failed to load stills:', e);
            stillsGrid.innerHTML = '<div class="ns-tmdb-empty">Failed to load stills.</div>';
          }
        });
      });

    } catch (err) {
      console.error('Search failed:', err);
      tmdbResultsContainer.innerHTML = '<div class="ns-tmdb-empty">Search query failed.</div>';
    } finally {
      tmdbSearchBtn.disabled = false;
      tmdbSearchBtn.textContent = 'SEARCH';
    }
  }

  tmdbSearchBtn.addEventListener('click', performExternalSearch);
  tmdbQueryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performExternalSearch();
    }
  });
}



function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
