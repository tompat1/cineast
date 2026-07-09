import { getPage, updatePage, createPage, searchTmdb, fetchTmdbImages, searchTvdb, fetchTvdbImages } from './cms-client.js';
import { showToast } from './admin-panel.js';

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
  { id: 'sky', name: 'SkyShowtime', icon: 'simple-icons:sky', color: 'var(--color-screen-cream)' }
];

let globalAudio = null;
let activePlayBtn = null;

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
}

async function loadNowShowingFromDB() {
  for (let i = 0; i < 4; i++) {
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

        nowShowingData[i] = {
          slug: page.slug,
          title: page.title || '',
          meta: page.meta || '',
          content: page.content || '',
          hero_image: page.hero_image || '',
          kicker: metaJson.kicker || nowShowingData[i].kicker,
          type: metaJson.type || nowShowingData[i].type,
          link_text: metaJson.link_text || nowShowingData[i].link_text,
          link_href: metaJson.link_href || nowShowingData[i].link_href,
          footer_info: metaJson.footer_info || nowShowingData[i].footer_info,
          soundtrack_title: metaJson.soundtrack_title || nowShowingData[i].soundtrack_title,
          soundtrack_subtitle: metaJson.soundtrack_subtitle || nowShowingData[i].soundtrack_subtitle,
          visible: metaJson.visible !== false,
          updated_at: page.updated_at || nowShowingData[i].updated_at,
          show_link: metaJson.show_link !== false,
          tmdb_id: metaJson.tmdb_id || null,
          tvdb_id: metaJson.tvdb_id || null,
          itunes_id: metaJson.itunes_id || null,
          image_position: metaJson.image_position || '50%',
          scrapbook: metaJson.scrapbook || null,
          audio_preview_url: metaJson.audio_preview_url || null,
          streaming_platform: metaJson.streaming_platform || null
        };
      }
    } catch (err) {
      // 404 or other errors mean we keep using the local hardcoded fallback
      console.log(`Now showing card ${i + 1} not in DB, using fallback defaults.`);
    }
  }
}

function renderNowShowingCards() {
  const cards = document.querySelectorAll('.now-showing-card');
  if (!cards.length) return;

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

    // Update Soundtrack Panel if it exists (Card 3)
    if (data.type === 'MIX') {
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
      // Render Streaming Badge
      const oldBadge = mediaContainer.querySelector('.ns-streaming-badge');
      if (oldBadge) oldBadge.remove();

      if (data.streaming_platform) {
        const platform = STREAMING_PLATFORMS.find(p => p.id === data.streaming_platform);
        if (platform) {
          const badge = document.createElement('div');
          badge.className = 'ns-streaming-badge';
          badge.innerHTML = `
            <iconify-icon icon="${platform.icon}" style="color: ${platform.color}; font-size: 13px;"></iconify-icon>
            <span>${platform.name.toUpperCase()}</span>
          `;
          mediaContainer.appendChild(badge);
        }
      }
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
          align-items: center;
          justify-content: center;
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
  });

  // Toggle VIEW ALL NOTES disabled state if less than 4 cards are publicly shown
  const viewAllNotesBtn = document.querySelector('.now-showing-bottom a[href="#journal"]');
  if (viewAllNotesBtn) {
    const visibleCardsCount = nowShowingData.filter(d => d.visible !== false).length;
    viewAllNotesBtn.classList.toggle('disabled', visibleCardsCount < 4);
  }

  updateLastUpdatedHeader();
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
  const cards = document.querySelectorAll('.now-showing-card');
  if (!cards.length) return;

  cards.forEach((card, index) => {
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

function openNowShowingEditor(cardId, cardElement) {
  if (activeModal) activeModal.remove();

  const data = nowShowingData[cardId - 1];
  if (!data) return;

  let selectedItemId = data.tmdb_id || data.tvdb_id || data.itunes_id || null;
  let selectedSource = data.tmdb_id ? 'tmdb' : (data.tvdb_id ? 'tvdb' : (data.itunes_id ? 'itunes' : null));
  let selectedAudioPreviewUrl = data.audio_preview_url || null;
  let currentScrapbook = data.scrapbook || null;

  const isMix = data.type === 'MIX' || data.slug === 'now-showing-3';
  const defaultSource = selectedSource || (isMix ? 'itunes' : 'tmdb');
  let queryPlaceholder = 'Search title (e.g., Paris, Texas, The Long Walk)...';
  if (defaultSource === 'tvdb') {
    queryPlaceholder = 'Search TV series (e.g., The Bear, Succession)...';
  } else if (defaultSource === 'itunes') {
    queryPlaceholder = 'Search music/song (e.g., After the Credits, Mercer)...';
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
          <button type="submit" form="ns-edit-form" class="ns-btn primary" id="ns-save-btn" style="width: auto; padding: 6px 16px; font-family: var(--font-mono); font-size: 0.65rem; border-radius: 0; line-height: 1.2;">SAVE CHANGES</button>
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

          ${isMix ? `
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
          ` : ''}

        </form>

        <div class="ns-modal-sidebar" style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Search Integration Panel -->
          <div class="ns-tmdb-panel">
            <div class="ns-tmdb-header">
              <h4>Search Integration</h4>
              <p>Search movie, TV, or music databases to automatically populate details and media.</p>
              <div class="ns-search-source-toggle" style="display: flex; gap: 14px; margin: 10px 0 16px; flex-wrap: wrap;">
                <label class="ns-search-radio-label">
                  <input type="radio" name="ns-search-source" value="tmdb" ${defaultSource === 'tmdb' ? 'checked' : ''} style="width: auto; margin: 0;" /> TMDb (FILMS)
                </label>
                <label class="ns-search-radio-label">
                  <input type="radio" name="ns-search-source" value="tvdb" ${defaultSource === 'tvdb' ? 'checked' : ''} style="width: auto; margin: 0;" /> TVDB (TV SHOWS)
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
            <div style="font-family: var(--font-mono); font-size: 0.6rem; color: #C58B45; letter-spacing: 2px; margin-bottom: 12px; text-transform: uppercase;">SCRAPBOOK REFERENCE (NOT PUBLISHED)</div>
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

  // Form submit handler
  const form = modal.querySelector('#ns-edit-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = modal.querySelector('#ns-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

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

    let soundtrack_title, soundtrack_subtitle;
    if (isMix) {
      soundtrack_title = modal.querySelector('#ns-sound-title').value.trim();
      soundtrack_subtitle = modal.querySelector('#ns-sound-sub').value.trim();
    }

    const payload = {
      title: titleVal,
      meta: metaVal,
      content: contentVal,
      hero_image: imageUrlVal,
      kind: 'note',
      status: 'published',
      auto_enrich: false,
      summary: JSON.stringify({
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
        audio_preview_url: selectedAudioPreviewUrl,
        image_position: imagePositionVal,
        scrapbook: currentScrapbook,
        streaming_platform: streamingPlatformVal
      })
    };

    try {
      try {
        await updatePage(`now-showing-${cardId}`, payload);
      } catch (err) {
        if (err.status === 404) {
          await createPage({
            id: `now-showing-${cardId}`,
            slug: `now-showing-${cardId}`,
            ...payload
          });
        } else {
          throw err;
        }
      }

      // Update local storage
      nowShowingData[cardId - 1] = {
        slug: `now-showing-${cardId}`,
        title: titleVal,
        meta: metaVal,
        content: contentVal,
        hero_image: imageUrlVal,
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
        audio_preview_url: selectedAudioPreviewUrl,
        image_position: imagePositionVal,
        scrapbook: currentScrapbook,
        streaming_platform: streamingPlatformVal
      };

      renderNowShowingCards();
      closeModal();
      showToast('Now Showing card updated successfully!', 'success', { title: 'Card updated' });
    } catch (error) {
      console.error('Failed to save Now Showing card:', error);
      alert(error.message || 'Failed to save changes.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'SAVE CHANGES';
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
      } else if (selectedSource === 'itunes') {
        const url = `https://itunes.apple.com/lookup?id=${selectedItemId}`;
        const res = await fetch(url);
        const data = await res.json();
        const item = data.results?.[0];
        if (item) {
          const artwork = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          const previewUrl = item.previewUrl;
          selectedAudioPreviewUrl = previewUrl;
          
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
            <div class="ns-tmdb-item ns-itunes-item" data-id="${item.id}" data-preview="${escapeHtml(item.previewUrl || '')}" data-poster="${escapeHtml(item.poster_path || '')}" data-artist="${escapeHtml(item.artist || '')}" data-track="${escapeHtml(item.title || '')}" data-album="${escapeHtml(item.album || '')}" data-genre="${escapeHtml(item.primaryGenreName || '')}" data-released="${escapeHtml(item.releaseDate || '')}" data-duration="${item.trackTimeMillis || 0}">
              ${item.poster_path ? `<img src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" />` : '<div class="ns-tmdb-item-no-poster">NO COVER</div>'}
              <div class="ns-tmdb-item-info">
                <span class="ns-tmdb-item-title">${escapeHtml(item.title)}</span>
                <span class="ns-tmdb-item-year">${escapeHtml(item.artist)}</span>
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
            if (previewImg) {
              previewImg.src = poster || '';
            }

            if (isMix) {
              modal.querySelector('#ns-sound-title').value = track;
              modal.querySelector('#ns-sound-sub').value = artist;
            }

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
