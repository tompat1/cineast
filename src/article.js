import { initFilmicMotion } from './motion.js';
import {
  createPage,
  getCurrentUser,
  getPage,
  syncJournalArticle as buildJournalCmsPayload,
  updatePage
} from './cms-client.js';

// article.js

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let imdbFilmData = {
  'the bridges of madison county': { score: '7.6', year: '1995' },
  'paris, texas': { score: '8.1', year: '1984' },
  'jeanne dielman': { score: '7.5', year: '1975' },
  'taxi driver': { score: '8.2', year: '1976' }
};
let articleNewDraftRequiresManualSave = false;

let currentArticleData = null;
let currentArticlePage = null;
let currentArticleUser = null;
let articleEditMode = false;
let articleAutosaveTimer = null;
let articleSaveInFlight = false;
let articleSaveQueued = false;

function normalizeMovieTitle(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/g, '')
    .replace(/\s*\([^)]*\b(?:19|20)\d{2}\b[^)]*\)\s*$/g, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .trim();
}

function getImdbFilmData(query) {
  return imdbFilmData[normalizeMovieTitle(query).toLowerCase()] || null;
}

function buildImdbSearchUrl(query) {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(normalizeMovieTitle(query) || query)}&s=tt&ttype=ft`;
}

function renderImdbBadge(query) {
  if (!query) return '';
  const film = getImdbFilmData(query);
  const title = normalizeMovieTitle(query) || query;
  const safeQuery = escapeHtml(title);
  const scoreText = film?.score ? ` ${film.score}` : '';
  const yearText = film?.year ? ` ${film.year}` : '';
  return `<a class="imdb-badge" href="${buildImdbSearchUrl(title)}" target="_blank" rel="noopener noreferrer" aria-label="Search IMDb for ${safeQuery}${yearText}">IMDb${scoreText}</a>`;
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

function getFirstImageCaption(content) {
  const match = String(content || '').match(/!\[([^\]]*)]\((.*?)\)/);
  return normalizeMovieTitle(match?.[1] || '');
}

function extractMarkdownImages(content) {
  const images = [];
  const pattern = /!\[([^\]]*)]\((.*?)\)/g;
  let match = pattern.exec(String(content || ''));

  while (match) {
    if (match[2]) {
      images.push({
        alt: match[1] || '',
        src: match[2]
      });
    }
    match = pattern.exec(String(content || ''));
  }

  return images;
}

function getArticleFocusTitle(article) {
  return normalizeMovieTitle(article?.movie_query) ||
    extractMentionedMovieTitles(article?.content)[0] ||
    getFirstImageCaption(article?.content) ||
    '';
}

function renderArticleHero(article) {
  const hero = document.getElementById('article-hero');
  if (!hero) return;

  const markdownImages = extractMarkdownImages(article?.content || '').slice(0, 3);
  const fallbackImage = article?.image || article?.hero_image || '/assets/images/journal_feature.webp';
  const images = markdownImages.length >= 3
    ? markdownImages
    : [{ src: fallbackImage, alt: article?.title || 'Journal image' }];

  hero.classList.toggle('has-collage', images.length >= 3);
  hero.innerHTML = images.length >= 3
    ? `
      <div class="article-hero-collage" aria-label="${escapeHtml(article?.title || 'Article image collage')}">
        ${images.map((image) => `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || article?.title || 'Article still')}" />`).join('')}
      </div>
    `
    : `<img src="${escapeHtml(images[0].src)}" alt="${escapeHtml(images[0].alt || article?.title || 'Article image')}" id="article-image" />`;
}

async function loadImdbScores() {
  try {
    const response = await fetch('/data/imdb_scores.json?t=' + new Date().getTime());
    if (!response.ok) return;
    const data = await response.json();
    if (data?.films && typeof data.films === 'object') {
      imdbFilmData = { ...imdbFilmData, ...data.films };
    }
  } catch (error) {
    console.warn('Unable to load IMDb score data.', error);
  }
}

async function syncArticleToCms(article) {
  const payload = buildJournalCmsPayload(article);

  try {
    const existing = await getPage(payload.slug);
    const page = existing?.page || null;
    const response = await updatePage(page?.id || payload.slug, payload);
    return response.page;
  } catch (error) {
    if (error.status === 404) {
      const response = await createPage(payload);
      return response.page;
    }
    throw error;
  }
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
    hero_image: currentArticlePage?.hero_image || basePayload.hero_image,
    kind: currentArticlePage?.kind || 'journal',
    status: currentArticlePage?.status || 'published',
    content
  };
}

function cmsPageToArticle(page) {
  return {
    id: page?.slug || page?.id || 'cms',
    slug: page?.slug || '',
    title: page?.title || 'Untitled Journal Article',
    meta: page?.meta || 'JOURNAL / VISUAL ESSAY',
    preamble: page?.summary || page?.excerpt || '',
    image: page?.hero_image || '/assets/images/journal_feature.webp',
    content: page?.content || '',
    tags: ['journal'],
    date: page?.published_at || page?.created_at || '',
    movie_query: getArticleFocusTitle(page)
  };
}

function createBlankJournalArticle() {
  const timestamp = Date.now().toString(36);
  return {
    id: `draft-${timestamp}`,
    slug: `journal-draft-${timestamp}`,
    title: 'Untitled Journal Article',
    meta: '5 MIN READ / JOURNAL / VISUAL ESSAY',
    preamble: '',
    image: '/assets/images/journal_feature.webp',
    content: 'Start writing your journal article here.\n\nMention films like *Paris, Texas* (Wim Wenders, 1984) and the CMS will add movie stills when the article is saved, as long as no images are already present.',
    tags: ['journal']
  };
}

async function fetchArticleCmsOverride(article) {
  const payload = buildJournalCmsPayload(article);
  if (!payload.slug) return null;

  try {
    const response = await getPage(payload.slug);
    return response.page || null;
  } catch (error) {
    if (error.status === 404 || error.status === 401) return null;
    console.warn('Unable to load CMS article override.', error);
    return null;
  }
}

function mergeArticleWithCmsPage(article, page) {
  if (!page) return article;
  return {
    ...article,
    title: page.title || article.title,
    meta: page.meta || article.meta,
    preamble: page.summary || article.preamble,
    image: page.hero_image || article.image,
    content: page.content || article.content
  };
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

  let editor = document.getElementById('article-content-editor');
  if (!editor) {
    editor = document.createElement('textarea');
    editor.id = 'article-content-editor';
    editor.className = 'article-content-editor';
    editor.setAttribute('aria-label', 'Article markdown content');
    editor.hidden = true;
    contentEl.insertAdjacentElement('afterend', editor);
  }

  return editor;
}

function renderArticleAdminActions(article) {
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

    currentArticlePage = response.page || response;
    currentArticleData = mergeArticleWithCmsPage(currentArticleData, currentArticlePage);
    articleNewDraftRequiresManualSave = false;
    if (currentArticlePage?.slug && wasNewJournal) {
      window.history.replaceState({}, '', `/article.html?id=${encodeURIComponent(currentArticlePage.slug)}`);
      document.getElementById('article-label').textContent = 'CMS JOURNAL ENTRY';
    }
    renderArticleHero(currentArticleData);
    if (!silent && currentArticlePage?.content) {
      const editor = document.getElementById('article-content-editor');
      const contentEl = document.getElementById('article-content');
      if (editor) editor.value = currentArticlePage.content;
      if (contentEl) contentEl.innerHTML = parseMarkdown(currentArticlePage.content);
    }
    setArticleEditStatus(silent ? 'Autosaved' : 'Saved', 'saved');
    return currentArticlePage;
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

function setArticleEditMode(isEditing, { reset = false } = {}) {
  articleEditMode = Boolean(isEditing);
  const contentEl = document.getElementById('article-content');
  const editor = ensureArticleContentEditor();
  const editBtn = document.getElementById('article-edit-toggle');
  const saveBtn = document.getElementById('article-edit-save');
  const cancelBtn = document.getElementById('article-edit-cancel');

  if (reset && currentArticleData) {
    document.getElementById('article-title').textContent = currentArticleData.title;
    document.getElementById('article-meta').textContent = currentArticleData.meta;
    if (contentEl) contentEl.innerHTML = parseMarkdown(currentArticleData.content || '');
  }

  if (editor) {
    editor.value = getArticleCmsPayload().content;
    editor.hidden = !articleEditMode;
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

function setupArticleEditListeners() {
  const editor = ensureArticleContentEditor();
  editor?.addEventListener('input', scheduleArticleAutosave);
  document.getElementById('article-title')?.addEventListener('input', scheduleArticleAutosave);
  document.getElementById('article-meta')?.addEventListener('input', scheduleArticleAutosave);
}

async function refreshArticleSession() {
  try {
    const response = await getCurrentUser();
    currentArticleUser = response.user || null;
  } catch (error) {
    currentArticleUser = null;
  }

  if (currentArticleData) {
    renderArticleAdminActions(currentArticleData);
  }
}

function parseMarkdown(text) {
  let html = text;
  // Images: ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\((.*?)\)/g, (_, alt, src) => {
    const safeAlt = escapeHtml(alt);
    const safeSrc = escapeHtml(src);
    const caption = safeAlt ? `<figcaption><span class="figure-caption-text">${safeAlt}</span>${renderImdbBadge(alt)}</figcaption>` : '';
    return `<figure class="article-image-figure"><img src="${safeSrc}" alt="${safeAlt}" />${caption}</figure>`;
  });
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italics
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    const inner = p.replace(/\n/g, '<br>');
    if (inner.trim().startsWith('<figure')) return inner;
    return `<p>${inner}</p>`;
  }).join('');
  
  return html;
}

async function loadArticle() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const isNewJournal = urlParams.get('new') === 'journal';

  if (isNewJournal) {
    currentArticlePage = null;
    currentArticleData = createBlankJournalArticle();
    articleNewDraftRequiresManualSave = true;
    const renderedArticle = currentArticleData;

    document.title = 'New Journal Article — CINEAST Journal';
    document.getElementById('article-label').textContent = 'NEW JOURNAL ENTRY';
    document.getElementById('article-title').textContent = renderedArticle.title;
    document.getElementById('article-meta').textContent = renderedArticle.meta;
    renderArticleHero(renderedArticle);
    document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
    ensureArticleContentEditor().value = renderedArticle.content || '';
    setupArticleEditListeners();
    renderArticleAdminActions(renderedArticle);

    if (currentArticleUser?.role === 'admin') {
      setArticleEditMode(true);
    } else {
      setArticleEditStatus('Sign in as admin to create journal articles', 'error');
    }
    return;
  }

  if (!id) {
    document.getElementById('article-title').textContent = "Article Not Found";
    return;
  }

  try {
    const response = await fetch('/data/journal.json?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    const entries = await response.json();
    
    const article = entries.find(e => e.id === id);
    if (!article) {
      try {
        const response = await getPage(id);
        currentArticlePage = response.page || null;
        if (!currentArticlePage || currentArticlePage.kind !== 'journal') {
          document.getElementById('article-title').textContent = "Article Not Found";
          return;
        }

        currentArticleData = cmsPageToArticle(currentArticlePage);
        const renderedArticle = currentArticleData;

        document.title = `${renderedArticle.title} — CINEAST Journal`;
        document.getElementById('article-label').textContent = 'CMS JOURNAL ENTRY';
        document.getElementById('article-title').textContent = renderedArticle.title;
        document.getElementById('article-meta').textContent = renderedArticle.meta;
        renderArticleHero(renderedArticle);
        document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
        ensureArticleContentEditor().value = renderedArticle.content || '';
        setupArticleEditListeners();
        renderArticleAdminActions(renderedArticle);

        const articleHeader = document.getElementById('article-header');
        if (articleHeader) {
          const existingFocus = articleHeader.querySelector('.article-focus-line');
          existingFocus?.remove();
          const focusTitle = getArticleFocusTitle(renderedArticle);
          if (focusTitle) {
            const focusEl = document.createElement('div');
            focusEl.className = 'article-focus-line';
            focusEl.innerHTML = `
              <span class="article-focus-label">FILM FOCUS</span>
              <span class="article-focus-title">${escapeHtml(focusTitle)}</span>
              ${renderImdbBadge(focusTitle)}
            `;
            articleHeader.appendChild(focusEl);
          }
        }
        return;
      } catch (cmsError) {
        if (cmsError.status !== 404) console.warn('Unable to load CMS article.', cmsError);
        document.getElementById('article-title').textContent = "Article Not Found";
        return;
      }
    }

    currentArticlePage = await fetchArticleCmsOverride(article);
    currentArticleData = mergeArticleWithCmsPage(article, currentArticlePage);
    const renderedArticle = currentArticleData;

    // Update DOM
    document.title = `${renderedArticle.title} — CINEAST Journal`;
    document.getElementById('article-label').textContent = `JOURNAL ENTRY ${article.id}`;
    document.getElementById('article-title').textContent = renderedArticle.title;
    document.getElementById('article-meta').textContent = renderedArticle.meta;
    renderArticleHero(renderedArticle);
    document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
    ensureArticleContentEditor().value = renderedArticle.content || '';
    setupArticleEditListeners();
    renderArticleAdminActions(renderedArticle);

    const articleHeader = document.getElementById('article-header');
    if (articleHeader) {
      const existingFocus = articleHeader.querySelector('.article-focus-line');
      existingFocus?.remove();

      const focusTitle = getArticleFocusTitle(renderedArticle);
      if (focusTitle) {
        const focusEl = document.createElement('div');
        focusEl.className = 'article-focus-line';
        focusEl.innerHTML = `
          <span class="article-focus-label">FILM FOCUS</span>
          <span class="article-focus-title">${escapeHtml(focusTitle)}</span>
          ${renderImdbBadge(focusTitle)}
        `;
        articleHeader.appendChild(focusEl);
      }
    }

    // Dynamic Related Articles
    const relatedList = document.getElementById('related-articles-list');
    if (relatedList) {
      const related = entries.filter(e => e.id !== id);
      relatedList.innerHTML = related.map(rel => `
        <a href="/article.html?id=${rel.id}" class="related-article-card">
          <div class="related-article-thumb">
            <img src="${rel.image}" alt="${rel.title}">
          </div>
          <div class="related-article-info">
            <div class="related-article-date">${rel.date || 'MAY 28, 2024'}</div>
            <h4 class="related-article-title">${rel.title}</h4>
            <p class="related-article-preamble">${rel.preamble || ''}</p>
          </div>
        </a>
      `).join('');
    }

    // Dynamic Tag Cloud rendering
    const sidebarTagCloud = document.getElementById('sidebar-tag-cloud');
    if (sidebarTagCloud) {
      try {
        const articlesResponse = await fetch('/data/articles.json?t=' + new Date().getTime());
        let allArticles = [];
        if (articlesResponse.ok) {
          const feedArticles = await articlesResponse.json();
          allArticles.push(...feedArticles);
        }
        allArticles.push(...entries);
        
        // Extract unique tags, excluding facebook/letterboxd
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
        const currentArticleTags = (article.tags || []).map(t => t.toLowerCase().trim());
        
        sidebarTagCloud.innerHTML = sortedTags.map(tag => {
          const isActive = currentArticleTags.includes(tag);
          const activeClass = isActive ? 'active' : '';
          return `<button class="tag-btn ${activeClass}" data-tag="${tag}">${tag}</button>`;
        }).join('');
        
        // Add click events to redirect back to homepage with tag filter
        sidebarTagCloud.querySelectorAll('.tag-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            window.location.href = `/index.html?tag=${encodeURIComponent(tag)}#explore`;
          });
        });
      } catch (err) {
        console.error("Failed to load sidebar tag cloud:", err);
      }
    }

  } catch (error) {
    console.error('Error loading article:', error);
    document.getElementById('article-title').textContent = "Error Loading Article";
  }
}

// Theme handling (copied from main.js)
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeMenu = document.getElementById('theme-menu');
  const html = document.documentElement;

  if (themeToggle && themeMenu) {
    themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      themeMenu.classList.remove('active');
    });

    const themeButtons = themeMenu.querySelectorAll('.theme-dropdown-item');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.themeValue;
        
        // Update DOM
        if (value === 'system') {
          html.removeAttribute('data-theme');
        } else {
          html.setAttribute('data-theme', value);
        }
        
        // Update toggle text
        const textSpan = themeToggle.querySelector('.theme-text');
        if (textSpan) {
          textSpan.textContent = `FILM - ${value.toUpperCase()}`;
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initFilmicMotion(document);
  await loadImdbScores();
  await refreshArticleSession();
  await loadArticle();

  // Nav search click behavior
  const navSearchBtn = document.querySelector('.search-btn');
  navSearchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/index.html#explore';
  });

  // Nav scroll behavior
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('solid');
      } else {
        nav.classList.remove('solid');
      }
    });
  }
});
