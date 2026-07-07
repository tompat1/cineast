import {
  createPage,
  updatePage,
  getPage,
  searchTmdb,
  fetchTmdbImages,
  syncJournalArticle as buildJournalCmsPayload
} from './cms-client.js';

import {
  currentArticleData,
  currentArticlePage,
  currentArticleUser,
  setCurrentArticleData,
  setCurrentArticlePage,
  escapeHtml,
  renderImdbBadge,
  parseMarkdown,
  renderArticleHero,
  formatJournalEntryLabel,
  syncArticleToCms
} from './article.js';

export let articleEditMode = false;
let articleAutosaveTimer = null;
let articleSaveInFlight = false;
let articleSaveQueued = false;
let articleNewDraftRequiresManualSave = false;

export function setArticleNewDraftRequiresManualSave(val) {
  articleNewDraftRequiresManualSave = val;
}

function normalizeMovieTitle(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/g, '')
    .replace(/\s*\([^)]*\b(?:19|20)\d{2}\b[^)]*\)\s*$/g, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .trim();
}

function buildImdbSearchUrl(query) {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(normalizeMovieTitle(query) || query)}&s=tt&ttype=ft`;
}

function extractMentionedMovieTitles(content) {
  const titles = [];
  const cleanContent = String(content || '').replace(/\n{0,2}!\[[^\]]*]\((.*?)\)\n{0,2}/g, '\n\n');
  const pattern = /(?<!\*)\*([^*\n]{2,100})\*\s*\([^)]*\b(?:19|20)\d{2}\b[^)]*\)/g;
  let match = pattern.exec(cleanContent);

  while (match) {
    const title = normalizeMovieTitle(match[1]);
    if (title && !titles.some((existing) => existing.toLowerCase() === title.toLowerCase())) {
      titles.push(title);
    }
    match = pattern.exec(cleanContent);
  }

  return titles;
}

function setArticleEditStatus(message, tone = 'idle') {
  const status = document.getElementById('article-edit-status');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function ensureArticleContentEditor() {
  const contentEl = document.getElementById('article-content');
  if (!contentEl) return null;

  let shell = document.getElementById('article-edit-shell');
  let editor = document.getElementById('article-content-editor');
  if (!shell) {
    shell = document.createElement('div');
    shell.id = 'article-edit-shell';
    shell.className = 'article-edit-shell';
    shell.hidden = true;
    contentEl.insertAdjacentElement('afterend', shell);
  }

  if (!editor) {
    editor = document.createElement('textarea');
    editor.id = 'article-content-editor';
    editor.className = 'article-content-editor';
    editor.setAttribute('aria-label', 'Article markdown content');
    shell.appendChild(editor);
  } else if (editor.parentElement !== shell) {
    shell.appendChild(editor);
  }

  return editor;
}

function getCurrentEditableContent() {
  return currentArticlePage?.content || currentArticleData?.content || '';
}

function wrapSelection(textarea, before, after) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  const replacement = before + selectedText + after;
  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = start + before.length + selectedText.length;
  textarea.focus();
  textarea.dispatchEvent(new Event('input'));
}

function insertOrReplaceMarkdownImage(textarea, alt, src) {
  if (!textarea || !src) return;

  const safeAlt = String(alt || 'Movie still').replace(/]/g, ')');
  const imageMarkdown = `![${safeAlt}](${src})`;
  const text = textarea.value;
  let start = textarea.selectionStart;
  let end = textarea.selectionEnd;
  const selectedText = text.substring(start, end);

  if (!/!\[[^\]]*]\([^)]*\)/.test(selectedText)) {
    const imagePattern = /!\[[^\]]*]\([^)]*\)/g;
    let match = imagePattern.exec(text);
    while (match) {
      if (start >= match.index && end <= match.index + match[0].length) {
        start = match.index;
        end = match.index + match[0].length;
        break;
      }
      match = imagePattern.exec(text);
    }
  }

  const replacement = start === end ? `\n\n${imageMarkdown}\n\n` : imageMarkdown;
  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.selectionStart = start;
  textarea.selectionEnd = start + replacement.length;
  textarea.focus();
  textarea.dispatchEvent(new Event('input'));
}

function ensureArticleEditToolbox(editor) {
  if (!editor) return null;
  const shell = document.getElementById('article-edit-shell') || editor.parentElement;
  let toolbox = document.getElementById('article-edit-toolbox');
  if (!toolbox) {
    toolbox = document.createElement('div');
    toolbox.id = 'article-edit-toolbox';
    toolbox.className = 'article-edit-toolbox';
    toolbox.innerHTML = `
      <div class="toolbox-row">
        <div class="toolbox-group format-group">
          <button type="button" class="toolbox-btn" id="toolbox-btn-bold" title="Bold">B</button>
          <button type="button" class="toolbox-btn" id="toolbox-btn-italic" style="font-style: italic;" title="Italic">I</button>
          <button type="button" class="toolbox-btn" id="toolbox-btn-underline" style="text-decoration: underline;" title="Underline">U</button>
        </div>
        
        <div class="toolbox-group color-group">
          <span class="toolbox-label">COLORS</span>
          <button type="button" class="color-swatch-btn" data-color="projector-amber" style="background-color: #C58B45;" title="Amber"></button>
          <button type="button" class="color-swatch-btn" data-color="oxblood" style="background-color: #5B1F26;" title="Oxblood"></button>
          <button type="button" class="color-swatch-btn" data-color="muted-olive" style="background-color: #5E6658;" title="Olive"></button>
          <button type="button" class="color-swatch-btn" data-color="cinema-navy" style="background-color: #121A26;" title="Navy"></button>
          <button type="button" class="color-swatch-btn" data-color="screen-cream" style="background-color: #F2EEE8; border: 1px solid rgba(255,255,255,0.15);" title="Cream"></button>
          <button type="button" class="color-swatch-btn" data-color="dust-gray" style="background-color: #8A8781;" title="Gray"></button>
        </div>

        <div class="toolbox-group tmdb-group">
          <button type="button" class="toolbox-btn" id="toolbox-btn-library">IMAGE LIBRARY</button>
        </div>
      </div>

      <div class="toolbox-library-panel" id="toolbox-library-panel" style="display: none;">
        <div class="library-search-row">
          <div class="library-search-field">
            <input type="text" id="library-movie-search" placeholder="Search movies on TMDb..." />
            <button type="button" class="library-search-btn" id="library-movie-search-btn">SEARCH</button>
          </div>
          <button type="button" class="library-reset-btn" id="library-movie-reset-btn">ARTICLE MOVIES</button>
        </div>
        
        <div class="library-movies-list" id="library-movies-list" style="display: none;"></div>
        <div class="library-stills-grid" id="library-stills-grid"></div>
      </div>
    `;
    shell?.insertBefore(toolbox, editor);
    setupToolboxListeners(toolbox, editor);
  }
  return toolbox;
}

function setupToolboxListeners(toolbox, editor) {
  toolbox.querySelector('#toolbox-btn-bold')?.addEventListener('click', () => {
    wrapSelection(editor, '**', '**');
  });

  toolbox.querySelector('#toolbox-btn-italic')?.addEventListener('click', () => {
    wrapSelection(editor, '*', '*');
  });

  toolbox.querySelector('#toolbox-btn-underline')?.addEventListener('click', () => {
    wrapSelection(editor, '<u>', '</u>');
  });

  toolbox.querySelectorAll('.color-swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      wrapSelection(editor, `<span style="color: var(--color-${color})">`, '</span>');
    });
  });

  const libPanel = toolbox.querySelector('#toolbox-library-panel');
  const libBtn = toolbox.querySelector('#toolbox-btn-library');
  libBtn?.addEventListener('click', () => {
    if (libPanel) {
      const isHidden = libPanel.style.display === 'none';
      libPanel.style.display = isHidden ? 'flex' : 'none';
      libBtn.classList.toggle('active', isHidden);
      if (isHidden) {
        loadArticleMovies();
      }
    }
  });

  toolbox.querySelector('#library-movie-search')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLibraryMovies();
    }
  });

  toolbox.querySelector('#library-movie-search-btn')?.addEventListener('click', searchLibraryMovies);

  toolbox.querySelector('#library-movie-reset-btn')?.addEventListener('click', () => {
    const searchInput = toolbox.querySelector('#library-movie-search');
    if (searchInput) searchInput.value = '';
    loadArticleMovies();
  });

  async function searchLibraryMovies() {
    const query = toolbox.querySelector('#library-movie-search')?.value.trim();
    if (!query) return;

    const listEl = toolbox.querySelector('#library-movies-list');
    const gridEl = toolbox.querySelector('#library-stills-grid');
    if (gridEl) gridEl.innerHTML = '<div class="library-info">Searching...</div>';
    if (listEl) {
      listEl.style.display = 'none';
      listEl.innerHTML = '';
    }

    try {
      const response = await searchTmdb(query);
      const movies = response?.results || [];
      if (movies.length === 0) {
        if (gridEl) gridEl.innerHTML = '<div class="library-info">No movies found.</div>';
        return;
      }

      if (listEl) {
        listEl.style.display = 'flex';
        listEl.innerHTML = movies.map(movie => `
          <button type="button" class="library-movie-item" data-id="${movie.id}">
            ${movie.poster_path ? `<img src="${escapeHtml(movie.poster_path)}" alt="${escapeHtml(movie.title)}" />` : ''}
            <div class="library-movie-item-info">
              <span class="movie-title">${escapeHtml(movie.title)}</span>
              ${movie.year ? `<span class="movie-year">(${escapeHtml(movie.year)})</span>` : ''}
            </div>
          </button>
        `).join('');

        listEl.querySelectorAll('.library-movie-item').forEach((item) => {
          item.addEventListener('click', () => {
            const movieId = item.getAttribute('data-id');
            const title = item.querySelector('.movie-title')?.textContent || 'Movie';
            const yearText = item.querySelector('.movie-year')?.textContent || '';
            const queryName = `${title} ${yearText}`;
            loadMovieBackdrops(movieId, queryName);
          });
        });
      }

      if (gridEl) gridEl.innerHTML = '<div class="library-info">Select a movie from the list above to view images.</div>';

    } catch (err) {
      console.error(err);
      if (gridEl) gridEl.innerHTML = '<div class="library-info">Search failed.</div>';
    }
  }

  async function loadArticleMovies() {
    const listEl = toolbox.querySelector('#library-movies-list');
    const gridEl = toolbox.querySelector('#library-stills-grid');
    if (listEl) {
      listEl.style.display = 'none';
      listEl.innerHTML = '';
    }
    if (gridEl) gridEl.innerHTML = '<div class="library-info">Loading images for movies mentioned in this article...</div>';

    const content = editor.value;
    const mentionedMovies = extractMentionedMovieTitles(content);
    if (mentionedMovies.length === 0) {
      if (gridEl) gridEl.innerHTML = '<div class="library-info">No movies mentioned in the text yet. Mention a film like <i>*Paris, Texas* (1984)</i> or search TMDb above.</div>';
      return;
    }

    try {
      if (gridEl) gridEl.innerHTML = '';
      
      for (const movieTitle of mentionedMovies) {
        const header = document.createElement('h5');
        header.className = 'library-section-title';
        header.textContent = movieTitle;
        gridEl.appendChild(header);

        const movieStillsContainer = document.createElement('div');
        movieStillsContainer.className = 'library-stills-subgrid';
        movieStillsContainer.innerHTML = '<span class="library-info-small">Searching TMDb...</span>';
        gridEl.appendChild(movieStillsContainer);

        (async () => {
          try {
            const searchResponse = await searchTmdb(movieTitle);
            const firstMovie = searchResponse?.results?.[0];
            if (!firstMovie) {
              movieStillsContainer.innerHTML = '<span class="library-info-small">Movie not found on TMDb.</span>';
              return;
            }

            const imagesResponse = await fetchTmdbImages(firstMovie.id);
            const backdrops = imagesResponse?.backdrops || [];
            if (backdrops.length === 0) {
              movieStillsContainer.innerHTML = '<span class="library-info-small">No stills found for this movie.</span>';
              return;
            }

            movieStillsContainer.innerHTML = backdrops.map(url => `
              <div class="library-still-item">
                <img src="${escapeHtml(url)}" alt="${escapeHtml(movieTitle)}" />
                <button type="button" class="insert-still-btn">INSERT</button>
              </div>
            `).join('');

            movieStillsContainer.querySelectorAll('.library-still-item').forEach((item) => {
              const imgUrl = item.querySelector('img').getAttribute('src');
              item.querySelector('.insert-still-btn')?.addEventListener('click', () => {
                insertOrReplaceMarkdownImage(editor, movieTitle, imgUrl);
              });
            });

          } catch (err) {
            movieStillsContainer.innerHTML = '<span class="library-info-small">Failed to load images.</span>';
          }
        })();
      }
    } catch (err) {
      console.error(err);
      if (gridEl) gridEl.innerHTML = '<div class="library-info">Failed to load article movies.</div>';
    }
  }

  async function loadMovieBackdrops(movieId, movieName) {
    const gridEl = toolbox.querySelector('#library-stills-grid');
    if (gridEl) gridEl.innerHTML = '<div class="library-info">Loading stills...</div>';

    try {
      const response = await fetchTmdbImages(movieId);
      const backdrops = response?.backdrops || [];
      if (backdrops.length === 0) {
        if (gridEl) gridEl.innerHTML = '<div class="library-info">No stills found for this movie.</div>';
        return;
      }

      if (gridEl) {
        gridEl.innerHTML = `
          <h5 class="library-section-title">${movieName}</h5>
          <div class="library-stills-subgrid">
            ${backdrops.map(url => `
              <div class="library-still-item">
                <img src="${escapeHtml(url)}" alt="${escapeHtml(movieName)}" />
                <button type="button" class="insert-still-btn">INSERT</button>
              </div>
            `).join('')}
          </div>
        `;

        gridEl.querySelectorAll('.library-still-item').forEach((item) => {
          const imgUrl = item.querySelector('img').getAttribute('src');
          item.querySelector('.insert-still-btn')?.addEventListener('click', () => {
            insertOrReplaceMarkdownImage(editor, movieName, imgUrl);
          });
        });
      }
    } catch (err) {
      console.error(err);
      if (gridEl) gridEl.innerHTML = '<div class="library-info">Failed to load images.</div>';
    }
  }
}

export function renderArticleAdminActions(article) {
  const articleContainer = document.querySelector('.article-container');
  if (!articleContainer) return;

  const existingActions = articleContainer.querySelector('.article-admin-actions');
  existingActions?.remove();

  if (!currentArticleUser || currentArticleUser.role !== 'admin' || !article) return;

  const actions = document.createElement('div');
  actions.className = 'article-admin-actions';
  actions.innerHTML = `
    <div class="article-edit-meta">
      <span class="article-edit-kicker">CMS</span>
      <span id="article-edit-status">Ready</span>
    </div>
    <div class="article-edit-controls">
      <button type="button" class="article-admin-btn primary" id="article-edit-toggle">EDIT ARTICLE</button>
      <button type="button" class="article-admin-btn" id="article-edit-save" hidden>SAVE</button>
      <button type="button" class="article-admin-btn" id="article-edit-cancel" hidden>CANCEL</button>
    </div>
  `;

  articleContainer.insertBefore(actions, articleContainer.firstElementChild?.nextElementSibling || articleContainer.firstElementChild);

  actions.querySelector('#article-edit-toggle')?.addEventListener('click', () => setArticleEditMode(true));
  actions.querySelector('#article-edit-save')?.addEventListener('click', () => saveArticleEdits());
  actions.querySelector('#article-edit-cancel')?.addEventListener('click', () => setArticleEditMode(false, { reset: true }));

  setArticleEditStatus(currentArticlePage ? 'CMS version loaded' : 'Static article, ready to save to CMS');
}

function setArticleFieldsEditable(isEditable) {
  const title = document.getElementById('article-title');
  const meta = document.getElementById('article-meta');
  [title, meta].forEach((field) => {
    if (!field) return;
    field.contentEditable = isEditable ? 'true' : 'false';
    field.classList.toggle('is-editable', isEditable);
    field.setAttribute('spellcheck', isEditable ? 'true' : 'false');
  });
}

function scheduleArticleAutosave() {
  if (!articleEditMode) return;
  if (articleNewDraftRequiresManualSave) {
    setArticleEditStatus('New draft, press SAVE to create article', 'dirty');
    return;
  }
  window.clearTimeout(articleAutosaveTimer);
  setArticleEditStatus('Unsaved changes', 'dirty');
  articleAutosaveTimer = window.setTimeout(() => saveArticleEdits({ silent: true }), 1800);
}

function getArticleCmsPayload() {
  const basePayload = buildJournalCmsPayload(currentArticleData || {});
  const title = document.getElementById('article-title')?.textContent.trim() || basePayload.title;
  const meta = document.getElementById('article-meta')?.textContent.trim() || basePayload.meta;
  const editor = document.getElementById('article-content-editor');
  const content = editor ? editor.value.trim() : (currentArticlePage?.content || currentArticleData?.content || '');

  return {
    ...basePayload,
    slug: currentArticlePage?.slug || basePayload.slug,
    title,
    meta,
    entry_number: currentArticlePage?.entry_number || currentArticleData?.entry_number || '',
    hero_image: currentArticlePage?.hero_image || basePayload.hero_image,
    kind: currentArticlePage?.kind || 'journal',
    status: currentArticlePage?.status || 'published',
    content
  };
}

async function saveArticleEdits({ silent = false } = {}) {
  if (!currentArticleUser || currentArticleUser.role !== 'admin') return null;
  if (!currentArticleData) return null;

  if (articleSaveInFlight) {
    articleSaveQueued = true;
    return null;
  }

  articleSaveInFlight = true;
  if (!silent) setArticleEditStatus('Saving...', 'saving');

  try {
    const payload = getArticleCmsPayload();
    const wasNewJournal = new URLSearchParams(window.location.search).get('new') === 'journal';
    const response = currentArticlePage?.id || currentArticlePage?.slug
      ? await updatePage(currentArticlePage.id || currentArticlePage.slug, payload)
      : await syncArticleToCms({ ...currentArticleData, ...payload, image: payload.hero_image });

    const page = response.page || response;
    setCurrentArticlePage(page);
    setCurrentArticleData(mergeArticleWithCmsPage(currentArticleData, page));
    
    articleNewDraftRequiresManualSave = false;
    
    if (page?.slug && wasNewJournal) {
      window.history.replaceState({}, '', `/article.html?id=${encodeURIComponent(page.slug)}`);
      document.getElementById('article-label').textContent = formatJournalEntryLabel(page);
    }
    
    renderArticleHero(currentArticleData);
    
    if (!silent && page?.content) {
      const editor = document.getElementById('article-content-editor');
      const contentEl = document.getElementById('article-content');
      if (editor) editor.value = page.content;
      if (contentEl) contentEl.innerHTML = parseMarkdown(page.content);
    }
    setArticleEditStatus(silent ? 'Autosaved' : 'Saved', 'saved');
    return page;
  } catch (error) {
    console.error('Article save failed:', error);
    setArticleEditStatus(error.message || 'Save failed', 'error');
    return null;
  } finally {
    articleSaveInFlight = false;
    if (articleSaveQueued) {
      articleSaveQueued = false;
      scheduleArticleAutosave();
    }
  }
}

function mergeArticleWithCmsPage(article, page) {
  if (!page) return article;
  return {
    ...article,
    title: page.title || article.title,
    meta: page.meta || article.meta,
    entry_number: page.entry_number || article.entry_number || '',
    preamble: page.summary || article.preamble,
    image: page.hero_image || article.image,
    content: page.content || article.content
  };
}

export function setArticleEditMode(isEditing, { reset = false } = {}) {
  articleEditMode = Boolean(isEditing);
  const contentEl = document.getElementById('article-content');
  const editor = ensureArticleContentEditor();
  const toolbox = ensureArticleEditToolbox(editor);
  const shell = document.getElementById('article-edit-shell');
  const editBtn = document.getElementById('article-edit-toggle');
  const saveBtn = document.getElementById('article-edit-save');
  const cancelBtn = document.getElementById('article-edit-cancel');

  if (reset && currentArticleData) {
    document.getElementById('article-title').textContent = currentArticleData.title;
    document.getElementById('article-meta').textContent = currentArticleData.meta;
    if (contentEl) contentEl.innerHTML = parseMarkdown(currentArticleData.content || '');
  }

  if (editor) {
    editor.value = articleEditMode ? getCurrentEditableContent() : '';
  }
  if (toolbox) {
    toolbox.hidden = !articleEditMode;
    const libPanel = toolbox.querySelector('#toolbox-library-panel');
    const libBtn = toolbox.querySelector('#toolbox-btn-library');
    if (libPanel) libPanel.style.display = 'none';
    if (libBtn) libBtn.classList.remove('active');
  }
  if (shell) {
    shell.hidden = !articleEditMode;
  }
  if (contentEl) {
    contentEl.hidden = articleEditMode;
  }

  setArticleFieldsEditable(articleEditMode);
  if (editBtn) editBtn.hidden = articleEditMode;
  if (saveBtn) saveBtn.hidden = !articleEditMode;
  if (cancelBtn) cancelBtn.hidden = !articleEditMode;

  document.body.classList.toggle('article-editing', articleEditMode);
  setArticleEditStatus(
    articleEditMode
      ? (articleNewDraftRequiresManualSave ? 'New draft, press SAVE to create article' : 'Editing, autosave active')
      : 'Ready',
    articleEditMode ? 'editing' : 'idle'
  );

  if (articleEditMode) {
    editor?.focus();
  } else {
    window.clearTimeout(articleAutosaveTimer);
  }
}

export function setupArticleEditListeners() {
  const editor = ensureArticleContentEditor();
  editor?.addEventListener('input', scheduleArticleAutosave);
  document.getElementById('article-title')?.addEventListener('input', scheduleArticleAutosave);
  document.getElementById('article-meta')?.addEventListener('input', scheduleArticleAutosave);
}
