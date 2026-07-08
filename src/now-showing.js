import { getPage, updatePage, createPage, searchTmdb, fetchTmdbImages, searchTvdb, fetchTvdbImages } from './cms-client.js';
import { showToast } from './admin-panel.js';

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
    footer_info: '48 MIN IN'
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
    footer_info: '12 MIN READ'
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
    soundtrack_subtitle: 'Cineast Curated Mix Vol. IV'
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
    footer_info: 'LIMITED RUN'
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
          soundtrack_subtitle: metaJson.soundtrack_subtitle || nowShowingData[i].soundtrack_subtitle
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

    // Update kicker
    const kickerEl = card.querySelector('.now-card-top span:last-child');
    if (kickerEl) kickerEl.textContent = data.kicker;

    // Update Image
    const imgEl = card.querySelector('.now-card-media img');
    if (imgEl) {
      imgEl.src = data.hero_image;
      imgEl.alt = data.title;
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
      linkEl.setAttribute('href', data.link_href);
      // Keep the arrow span if it exists
      const arrowSpan = linkEl.querySelector('span');
      linkEl.innerHTML = '';
      linkEl.appendChild(document.createTextNode(data.link_text + ' '));
      if (arrowSpan) {
        linkEl.appendChild(arrowSpan);
      } else {
        linkEl.insertAdjacentHTML('beforeend', '<span>&rarr;</span>');
      }
    }

    // Update Footer Info
    const infoEl = card.querySelector('.now-card-footer span:not(a span)');
    if (infoEl) infoEl.textContent = data.footer_info;
  });
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

  const modal = document.createElement('div');
  modal.className = 'now-showing-editor-modal';
  modal.id = 'now-showing-editor-modal';
  modal.setAttribute('data-lenis-prevent', 'true');

  const isMix = data.type === 'MIX' || data.slug === 'now-showing-3';

  modal.innerHTML = `
    <div class="ns-modal-overlay"></div>
    <div class="ns-modal-container">
      <div class="ns-modal-header">
        <div>
          <div class="ns-modal-kicker">CMS / EDIT NOW SHOWING CARD</div>
          <h3 class="ns-modal-title">Edit Card #${cardId}</h3>
        </div>
        <button type="button" class="ns-modal-close" id="ns-modal-close-btn">&times;</button>
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

          <div class="ns-form-row">
            <div class="ns-field">
              <label>LINK TEXT</label>
              <input type="text" id="ns-link-text" value="${escapeHtml(data.link_text)}" required />
            </div>
            <div class="ns-field">
              <label>LINK HREF (e.g. #journal, #shop)</label>
              <input type="text" id="ns-link-href" value="${escapeHtml(data.link_href)}" required />
            </div>
          </div>

          <div class="ns-field">
            <label>FOOTER STATE / INFO</label>
            <input type="text" id="ns-footer-info" value="${escapeHtml(data.footer_info)}" required />
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

          <div class="ns-modal-actions">
            <button type="submit" class="ns-btn primary" id="ns-save-btn">SAVE CHANGES</button>
          </div>
        </form>

        <!-- Search Integration Panel -->
        <div class="ns-tmdb-panel">
          <div class="ns-tmdb-header">
            <h4>Search Integration</h4>
            <p>Search movie/TV databases to automatically populate details and pick backdrop stills.</p>
            <div class="ns-search-source-toggle" style="display: flex; gap: 14px; margin: 10px 0 16px;">
              <label style="font-family: var(--font-mono); font-size: 0.65rem; display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--color-silver-reel);">
                <input type="radio" name="ns-search-source" value="tmdb" checked style="width: auto; margin: 0;" /> TMDb (FILMS)
              </label>
              <label style="font-family: var(--font-mono); font-size: 0.65rem; display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--color-silver-reel);">
                <input type="radio" name="ns-search-source" value="tvdb" style="width: auto; margin: 0;" /> TVDB (TV SHOWS)
              </label>
            </div>
          </div>
          <div class="ns-tmdb-search-bar">
            <input type="text" id="ns-tmdb-query" placeholder="Search title (e.g., The Bear, Paris, Texas)..." />
            <button type="button" class="ns-btn" id="ns-tmdb-search-btn">SEARCH</button>
          </div>
          <div class="ns-tmdb-results" id="ns-tmdb-results"></div>
          <div class="ns-tmdb-stills-section" id="ns-tmdb-stills-section" style="display: none;">
            <h5>Select Backdrop Image</h5>
            <div class="ns-tmdb-stills-grid" id="ns-tmdb-stills-grid"></div>
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
        soundtrack_subtitle
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
        soundtrack_subtitle
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

  // TMDb/TVDB search handler
  const tmdbSearchBtn = modal.querySelector('#ns-tmdb-search-btn');
  const tmdbQueryInput = modal.querySelector('#ns-tmdb-query');
  const tmdbResultsContainer = modal.querySelector('#ns-tmdb-results');
  const stillsSection = modal.querySelector('#ns-tmdb-stills-section');
  const stillsGrid = modal.querySelector('#ns-tmdb-stills-grid');

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
      } else {
        const response = await searchTvdb(query);
        results = response?.results || [];
      }

      if (!results.length) {
        tmdbResultsContainer.innerHTML = `<div class="ns-tmdb-empty">No entries found on ${source.toUpperCase()}.</div>`;
        return;
      }

      tmdbResultsContainer.innerHTML = results.map(item => `
        <div class="ns-tmdb-item" data-id="${item.id}" data-poster="${escapeHtml(item.poster_path || '')}">
          ${item.poster_path ? `<img src="${escapeHtml(item.poster_path)}" alt="${escapeHtml(item.title)}" />` : '<div class="ns-tmdb-item-no-poster">NO POSTER</div>'}
          <div class="ns-tmdb-item-info">
            <span class="ns-tmdb-item-title">${escapeHtml(item.title)}</span>
            ${item.year ? `<span class="ns-tmdb-item-year">(${escapeHtml(item.year)})</span>` : ''}
          </div>
        </div>
      `).join('');

      // Add selection listeners
      tmdbResultsContainer.querySelectorAll('.ns-tmdb-item').forEach(item => {
        item.addEventListener('click', async () => {
          tmdbResultsContainer.querySelectorAll('.ns-tmdb-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');

          const itemId = item.getAttribute('data-id');
          const poster = item.getAttribute('data-poster');
          const title = item.querySelector('.ns-tmdb-item-title').textContent;
          const yearText = item.querySelector('.ns-tmdb-item-year')?.textContent || '';
          const year = yearText.replace(/[()]/g, '');

          // Autofill form fields
          modal.querySelector('#ns-title').value = title;
          modal.querySelector('#ns-type').value = source === 'tmdb' ? 'FILM' : 'TV';
          modal.querySelector('#ns-kicker').value = 'NOW WATCHING';
          modal.querySelector('#ns-meta').value = source === 'tmdb' ? `Dir.  &bull; ${year}` : `Series &bull; ${year}`;

          // Load stills
          stillsSection.style.display = 'block';
          stillsGrid.innerHTML = '<div class="ns-tmdb-loading">Loading backdrop stills...</div>';

          try {
            let backdrops = [];
            if (source === 'tmdb') {
              const res = await fetchTmdbImages(itemId);
              backdrops = res?.backdrops || [];
            } else {
              const res = await fetchTvdbImages(itemId);
              backdrops = res?.backdrops || [];
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
