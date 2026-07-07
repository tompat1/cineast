import {
  createPage,
  getCurrentUser,
  getPage,
  updatePage
} from './cms-client.js';

export let currentArticleData = null;
export let currentArticlePage = null;
export let currentArticleUser = null;

export function setCurrentArticleData(val) { currentArticleData = val; }
export function setCurrentArticlePage(val) { currentArticlePage = val; }

let imdbFilmData = {
  'the bridges of madison county': { score: '7.6', year: '1995' },
  'paris, texas': { score: '8.1', year: '1984' },
  'jeanne dielman': { score: '7.5', year: '1975' },
  'taxi driver': { score: '8.2', year: '1976' }
};

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function getImdbFilmData(query) {
  return imdbFilmData[normalizeMovieTitle(query).toLowerCase()] || null;
}

function buildImdbSearchUrl(query) {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(normalizeMovieTitle(query) || query)}&s=tt&ttype=ft`;
}

export function renderImdbBadge(query) {
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

export function renderArticleHero(article) {
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

export function formatJournalEntryLabel(article, fallback = 'CMS JOURNAL ENTRY') {
  const entryNumber = article?.entry_number || (/^\d+$/.test(String(article?.id || '')) ? article.id : '');
  if (!entryNumber) return fallback;
  return `JOURNAL ENTRY ${String(entryNumber).padStart(3, '0')}`;
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

export async function syncArticleToCms(article) {
  const { syncJournalArticle: buildJournalCmsPayload } = await import('./cms-client.js');
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

function cmsPageToArticle(page) {
  return {
    id: page?.slug || page?.id || 'cms',
    slug: page?.slug || '',
    title: page?.title || 'Untitled Journal Article',
    meta: page?.meta || 'JOURNAL / VISUAL ESSAY',
    entry_number: page?.entry_number || '',
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
    slug: `draft-${timestamp}`,
    title: 'Untitled Journal Article',
    meta: '5 MIN READ / JOURNAL / VISUAL ESSAY',
    preamble: '',
    image: '/assets/images/journal_feature.webp',
    content: 'Start writing your journal article here.\n\nMention films like *Paris, Texas* (Wim Wenders, 1984) and the CMS will add movie stills when the article is saved, as long as no images are already present.',
    tags: ['journal']
  };
}

async function fetchArticleCmsOverride(article) {
  const { syncJournalArticle: buildJournalCmsPayload } = await import('./cms-client.js');
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
    entry_number: page.entry_number || article.entry_number || '',
    preamble: page.summary || article.preamble,
    image: page.hero_image || article.image,
    content: page.content || article.content
  };
}

export function parseMarkdown(text) {
  let html = text;
  html = html.replace(/!\[([^\]]*)\]\((.*?)\)/g, (_, alt, src) => {
    const safeAlt = escapeHtml(alt);
    const safeSrc = escapeHtml(src);
    const caption = safeAlt ? `<figcaption><span class="figure-caption-text">${safeAlt}</span>${renderImdbBadge(alt)}</figcaption>` : '';
    return `<figure class="article-image-figure"><img src="${safeSrc}" alt="${safeAlt}" />${caption}</figure>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
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
    const renderedArticle = currentArticleData;

    document.title = 'New Journal Article — CINEAST Journal';
    document.getElementById('article-label').textContent = 'NEW JOURNAL ENTRY';
    document.getElementById('article-title').textContent = renderedArticle.title;
    document.getElementById('article-meta').textContent = renderedArticle.meta;
    renderArticleHero(renderedArticle);
    document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
    
    const { setupArticleEditListeners, renderArticleAdminActions, setArticleEditMode, setArticleNewDraftRequiresManualSave } = await import('./article-editor.js');
    setArticleNewDraftRequiresManualSave(true);
    setupArticleEditListeners();
    renderArticleAdminActions(renderedArticle);

    if (currentArticleUser?.role === 'admin') {
      setArticleEditMode(true);
    } else {
      const status = document.getElementById('article-edit-status');
      if (status) {
        status.textContent = 'Sign in as admin to create journal articles';
        status.dataset.tone = 'error';
      }
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
        document.getElementById('article-label').textContent = formatJournalEntryLabel(renderedArticle);
        document.getElementById('article-title').textContent = renderedArticle.title;
        document.getElementById('article-meta').textContent = renderedArticle.meta;
        renderArticleHero(renderedArticle);
        document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
        
        if (currentArticleUser?.role === 'admin') {
          const { setupArticleEditListeners, renderArticleAdminActions } = await import('./article-editor.js');
          setupArticleEditListeners();
          renderArticleAdminActions(renderedArticle);
        }

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
    document.getElementById('article-label').textContent = formatJournalEntryLabel(renderedArticle, `JOURNAL ENTRY ${article.id}`);
    document.getElementById('article-title').textContent = renderedArticle.title;
    document.getElementById('article-meta').textContent = renderedArticle.meta;
    renderArticleHero(renderedArticle);
    document.getElementById('article-content').innerHTML = parseMarkdown(renderedArticle.content);
    
    if (currentArticleUser?.role === 'admin') {
      const { setupArticleEditListeners, renderArticleAdminActions } = await import('./article-editor.js');
      setupArticleEditListeners();
      renderArticleAdminActions(renderedArticle);
    }

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
          return `<a class="tag-btn ${activeClass}" data-tag="${tag}" href="/index.html?tag=${encodeURIComponent(tag)}#search">${tag}</a>`;
        }).join('');
        
        sidebarTagCloud.querySelectorAll('.tag-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            window.location.href = `/index.html?tag=${encodeURIComponent(tag)}#search`;
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

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  applyTheme(savedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  const themeMenu = document.getElementById('theme-menu');

  if (themeToggle && themeMenu) {
    themeToggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        e.stopPropagation();
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'noir';
        const newTheme = currentTheme === 'noir' ? 'blanco' : 'noir';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
        return;
      }
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
        localStorage.setItem('theme', value);
        applyTheme(value);
      });
    });
  }
}

function applyTheme(mode) {
  const html = document.documentElement;
  let renderedTheme = mode;
  if (mode === 'system') {
    renderedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noir' : 'blanco';
  }
  html.setAttribute('data-theme', renderedTheme);
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const textSpan = themeToggle.querySelector('.theme-text');
    if (textSpan) {
      textSpan.textContent = `FILM - ${mode.toUpperCase()}`;
    }
  }

  const moonIcon = document.querySelector('.theme-icon-moon');
  const sunIcon = document.querySelector('.theme-icon-sun');
  if (moonIcon && sunIcon) {
    sunIcon.style.display = renderedTheme === 'blanco' ? 'block' : 'none';
    moonIcon.style.display = renderedTheme === 'blanco' ? 'none' : 'block';
  }
}

function showToast(message, tone = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`;
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-badge">${tone.toUpperCase()}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()">×</button>
    </div>
    <div class="toast-message">${escapeHtml(message)}</div>
  `;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.add('closing');
    setTimeout(() => toast.remove(), 180);
  }, 4200);
}

async function initReactions(slug) {
  const reactLikeBtn = document.getElementById('react-like');
  const reactHeartBtn = document.getElementById('react-heart');
  const likeCountEl = document.getElementById('like-count');
  const heartCountEl = document.getElementById('heart-count');
  const authMsgEl = document.getElementById('reactions-auth-message');

  if (!reactLikeBtn || !reactHeartBtn) return;

  const isLoggedIn = Boolean(currentArticleUser);

  if (!isLoggedIn) {
    if (authMsgEl) {
      authMsgEl.textContent = 'Pretty pls log in or register to get the whole cinematic xperience';
    }

    const showAuthHint = (e) => {
      e.preventDefault();
      showToast('Pretty pls log in or register to get the whole cinematic xperience', 'info');
    };

    reactLikeBtn.addEventListener('click', showAuthHint);
    reactHeartBtn.addEventListener('click', showAuthHint);
  }

  try {
    const { getReactions } = await import('./cms-client.js');
    const stats = await getReactions(slug);
    
    if (likeCountEl) likeCountEl.textContent = stats.likes || 0;
    if (heartCountEl) heartCountEl.textContent = stats.hearts || 0;

    if (isLoggedIn) {
      if (authMsgEl) authMsgEl.textContent = '';

      reactLikeBtn.classList.toggle('active', Boolean(stats.user_has_liked));
      reactHeartBtn.classList.toggle('active', Boolean(stats.user_has_hearted));

      const handleReactionClick = async (type, btn) => {
        try {
          const { toggleReaction } = await import('./cms-client.js');
          const response = await toggleReaction(slug, type);
          
          btn.classList.toggle('active', type === 'like' ? response.user_has_liked : response.user_has_hearted);
          if (likeCountEl) likeCountEl.textContent = response.likes || 0;
          if (heartCountEl) heartCountEl.textContent = response.hearts || 0;
          
          showToast(response.toggled === 'added' ? `Added ${type}!` : `Removed ${type}.`, 'success');
        } catch (err) {
          console.error(`Failed to toggle ${type}`, err);
          showToast(err.message || 'Failed to toggle reaction', 'error');
        }
      };

      reactLikeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleReactionClick('like', reactLikeBtn);
      });

      reactHeartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleReactionClick('heart', reactHeartBtn);
      });
    }
  } catch (err) {
    console.warn('Reactions service unavailable.', err);
  }
}

async function refreshArticleSession() {
  try {
    const response = await getCurrentUser();
    currentArticleUser = response.user || null;
  } catch (error) {
    currentArticleUser = null;
  }

  if (currentArticleUser?.role === 'admin' && currentArticleData) {
    const { renderArticleAdminActions } = await import('./article-editor.js');
    renderArticleAdminActions(currentArticleData);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadImdbScores();
  await refreshArticleSession();
  await loadArticle();

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (id) {
    const slug = currentArticleData?.slug || id;
    initReactions(slug);
  }

  const navSearchBtn = document.querySelector('.search-btn');
  navSearchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/index.html#search';
  });

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
