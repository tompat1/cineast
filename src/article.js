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

const imdbFilmData = {
  'the bridges of madison county': { score: '7.6', year: '1995' },
  'paris, texas': { score: '8.1', year: '1984' },
  'jeanne dielman': { score: '7.5', year: '1975' },
  'taxi driver': { score: '8.2', year: '1976' }
};

let currentArticleData = null;
let currentArticlePage = null;
let currentArticleUser = null;
let articleEditMode = false;
let articleAutosaveTimer = null;
let articleSaveInFlight = false;
let articleSaveQueued = false;

function getImdbFilmData(query) {
  return imdbFilmData[String(query || '').toLowerCase().trim()] || null;
}

function buildImdbSearchUrl(query) {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(query)}&s=tt&ttype=ft`;
}

function renderImdbBadge(query) {
  if (!query) return '';
  const film = getImdbFilmData(query);
  const safeQuery = escapeHtml(query);
  const scoreText = film?.score ? ` ${film.score}` : '';
  const yearText = film?.year ? ` ${film.year}` : '';
  return `<a class="imdb-badge" href="${buildImdbSearchUrl(query)}" target="_blank" rel="noopener noreferrer" aria-label="Search IMDb for ${safeQuery}${yearText}">IMDb${scoreText}</a>`;
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
  const content = editor?.value.trim() || currentArticlePage?.content || currentArticleData?.content || '';

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
    const response = currentArticlePage?.id || currentArticlePage?.slug
      ? await updatePage(currentArticlePage.id || currentArticlePage.slug, payload)
      : await syncArticleToCms({ ...currentArticleData, ...payload, image: payload.hero_image });

    currentArticlePage = response.page || response;
    currentArticleData = mergeArticleWithCmsPage(currentArticleData, currentArticlePage);
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
  setArticleEditStatus(articleEditMode ? 'Editing, autosave active' : 'Ready', articleEditMode ? 'editing' : 'idle');

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
      document.getElementById('article-title').textContent = "Article Not Found";
      return;
    }

    currentArticlePage = await fetchArticleCmsOverride(article);
    currentArticleData = mergeArticleWithCmsPage(article, currentArticlePage);
    const renderedArticle = currentArticleData;

    // Update DOM
    document.title = `${renderedArticle.title} — CINEAST Journal`;
    document.getElementById('article-label').textContent = `JOURNAL ENTRY ${article.id}`;
    document.getElementById('article-title').textContent = renderedArticle.title;
    document.getElementById('article-meta').textContent = renderedArticle.meta;
    document.getElementById('article-image').src = renderedArticle.image;
    document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
    ensureArticleContentEditor().value = renderedArticle.content || '';
    setupArticleEditListeners();
    renderArticleAdminActions(renderedArticle);

    const articleHeader = document.getElementById('article-header');
    if (articleHeader) {
      const existingFocus = articleHeader.querySelector('.article-focus-line');
      existingFocus?.remove();

      if (article.movie_query) {
        const focusEl = document.createElement('div');
        focusEl.className = 'article-focus-line';
        focusEl.innerHTML = `
          <span class="article-focus-label">FILM FOCUS</span>
          <span class="article-focus-title">${escapeHtml(article.movie_query)}</span>
          ${renderImdbBadge(article.movie_query)}
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

document.addEventListener('DOMContentLoaded', () => {
  loadArticle();
  initTheme();
  initFilmicMotion(document);
  refreshArticleSession();

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
