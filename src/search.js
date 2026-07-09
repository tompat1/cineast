import { searchArchive, listPages, getPage, syncJournalArticle, getTagOverrides, updateTagOverrides } from './cms-client.js';
import { preloadedJournalData, preloadedArticlesData, preloadedWarmupData } from './preloader.js';
import { lenis, openDrawer, closeDrawer, setSharedDrawerOverlay, fetchArticles } from './main.js';
import { closeAccountDrawer, currentAccountUser, showToast } from './admin-panel.js';

// --- Advanced Search, Tagging & Filtering System State ---
export let journalData = null;
export let allArticles = [];
export let activeTags = new Set();
export let activeSearchQuery = '';
export let globalSearchOpen = false;

let databaseSearchTimer = null;
let databaseSearchRequestId = 0;

export const activeFacetFilters = {
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
    { value: 'journal', label: 'Journal' },
    { value: 'review', label: 'Review' },
    { value: 'scene study', label: 'Scene Study' }
  ],
  era: [
    { value: 'old movies', label: 'Old Movies' },
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

let imdbFilmData = {
  'the bridges of madison county': { score: '7.6', year: '1995' },
  'paris, texas': { score: '8.1', year: '1984' },
  'jeanne dielman': { score: '7.5', year: '1975' },
  'taxi driver': { score: '8.2', year: '1976' }
};

let activeTagListCategory = 'all';
let tagEditMode = false;

const tagListCategories = [
  { value: 'all', label: 'All' },
  { value: 'directors', label: 'Directors' },
  { value: 'actors', label: 'Actors' },
  { value: 'movies', label: 'Movies' },
  { value: 'genres', label: 'Genres' }
];

const editableTagCategories = tagListCategories.map((category) => category.value).concat('tags');
const tagOverrideStorageKey = 'cineast_search_tag_overrides';

function normalizeTagOverrideList(value) {
  if (!Array.isArray(value)) return [];
  return canonicalizeArchiveTags(value).filter((tag) => tag.length <= 80);
}

function normalizeTagOverridePayload(value) {
  const source = value && typeof value === 'object' ? value : {};
  const hidden = source.hidden && typeof source.hidden === 'object' ? source.hidden : {};
  const added = source.added && typeof source.added === 'object' ? source.added : {};

  return {
    hidden: Object.fromEntries(editableTagCategories.map((category) => [category, normalizeTagOverrideList(hidden[category])])),
    added: Object.fromEntries(editableTagCategories.map((category) => [category, normalizeTagOverrideList(added[category])])),
    updated_at: source.updated_at || null
  };
}

let tagOverrides = normalizeTagOverridePayload(null);

function isSearchTagAdmin() {
  return currentAccountUser?.role === 'admin';
}

function readLocalTagOverrides() {
  try {
    const raw = window.localStorage.getItem(tagOverrideStorageKey);
    return raw ? normalizeTagOverridePayload(JSON.parse(raw)) : normalizeTagOverridePayload(null);
  } catch {
    return normalizeTagOverridePayload(null);
  }
}

function writeLocalTagOverrides(overrides) {
  try {
    window.localStorage.setItem(tagOverrideStorageKey, JSON.stringify(overrides));
  } catch {
    // Storage is best-effort in private/restricted browser modes.
  }
}

async function loadSearchTagOverrides() {
  try {
    const response = await getTagOverrides();
    tagOverrides = normalizeTagOverridePayload(response?.overrides);
    writeLocalTagOverrides(tagOverrides);
  } catch (error) {
    console.warn('Search tag overrides unavailable; using local fallback.', error);
    tagOverrides = readLocalTagOverrides();
  }
}

async function saveSearchTagOverrides() {
  tagOverrides = normalizeTagOverridePayload({
    ...tagOverrides,
    updated_at: new Date().toISOString()
  });
  writeLocalTagOverrides(tagOverrides);

  if (!isSearchTagAdmin()) {
    renderTagCloud();
    return;
  }

  try {
    const response = await updateTagOverrides(tagOverrides);
    tagOverrides = normalizeTagOverridePayload(response?.overrides || tagOverrides);
    writeLocalTagOverrides(tagOverrides);
    showToast('Search tags updated.', 'success', { title: 'Tags saved' });
  } catch (error) {
    showToast(error.message || 'Unable to save tag edits.', 'error', { title: 'Tag save failed' });
  } finally {
    renderTagCloud();
    updateTagButtonStates();
    applySearchAndFilters();
  }
}

function normalizeMovieTitle(value) {
  return String(value || '')
    .replace(/\s*\((?:19|20)\d{2}\)\s*$/g, '')
    .replace(/\s*\([^)]*\b(?:19|20)\d{2}\b[^)]*\)\s*$/g, '')
    .trim();
}

export function getImdbFilmData(query) {
  return imdbFilmData[normalizeMovieTitle(query).toLowerCase()] || null;
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

function normalizeCmsJournalPage(page) {
  const images = extractMarkdownImages(page.content || '');
  const firstImage = page.hero_image || images[0]?.src || '/assets/images/journal_feature.webp';
  
  const slugId = (page.slug || page.id || '').toLowerCase();
  const titleUpper = (page.title || '').toUpperCase();
  const metaUpper = (page.meta || '').toUpperCase();
  const formLower = (page.form || '').toLowerCase();
  const tagsList = page.tags || [];
  
  const isSceneStudy = slugId.startsWith('ss-') || 
                       titleUpper.includes('SCENE STUDY') || 
                       metaUpper.includes('SCENE STUDY') ||
                       formLower === 'scene study' ||
                       tagsList.includes('scene study');
                       
  const platform = isSceneStudy ? 'scene study' : 'journal';

  return {
    id: page.slug || page.id,
    slug: page.slug || page.id,
    title: page.title || 'Untitled Journal Article',
    meta: page.meta || '',
    entry_number: page.entry_number || '',
    preamble: page.summary || page.excerpt || '',
    excerpt: page.summary || page.excerpt || '',
    image: firstImage,
    feature_image: firstImage,
    content: page.content || '',
    date: page.published_at || page.created_at || '',
    date_display: page.published_at || page.created_at || '',
    movie_query: images[0]?.alt?.replace(/\s*\((?:19|20)\d{2}\)\s*$/, '') || '',
    tags: [platform, 'cms'],
    platform: platform,
    source: 'cms',
    image_items: images
  };
}

function normalizeDatabaseSearchResult(result) {
  const platform = result.platform || 'cms';
  return {
    id: result.slug || result.id,
    slug: result.slug || result.id,
    title: result.title || 'Untitled',
    meta: result.meta || '',
    preamble: result.excerpt || '',
    excerpt: result.excerpt || '',
    image: result.image || '/assets/images/journal_feature.webp',
    feature_image: result.image || '/assets/images/journal_feature.webp',
    url: result.url || '',
    content: result.content || result.excerpt || '',
    date: result.updated_at || '',
    date_display: result.updated_at || '',
    tags: ['cms', result.kind || 'page', platform].filter(Boolean),
    platform: platform,
    source: 'cms',
    movie_query: '',
    entry_number: result.entry_number || ''
  };
}

function mergeDatabaseSearchResults(results = []) {
  let didAdd = false;
  
  const getNormalizedKey = (item) => {
    let key = String(item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
    if (key.startsWith('journal-')) {
      key = key.substring('journal-'.length);
    }
    return key;
  };

  const existingKeys = new Set(allArticles.map((item) => getNormalizedKey(item)));
  const existingTitles = new Set(allArticles.map((item) => String(item.title || '').trim().toLowerCase()).filter(Boolean));
  const existingExcerpts = new Set(allArticles.map((item) => String(item.excerpt || item.preamble || '').trim().toLowerCase()).filter(Boolean));

  results.forEach((result) => {
    const item = enrichArchiveItemTags(normalizeDatabaseSearchResult(result));
    
    const key = getNormalizedKey(item);
    if (key && existingKeys.has(key)) return;
    
    const title = String(item.title || '').trim().toLowerCase();
    if (title && title !== 'untitled' && existingTitles.has(title)) return;
    
    const excerpt = String(item.excerpt || item.preamble || '').trim().toLowerCase();
    if (excerpt && existingExcerpts.has(excerpt)) return;
    
    allArticles.push(item);
    existingKeys.add(key);
    if (title && title !== 'untitled') existingTitles.add(title);
    if (excerpt) existingExcerpts.add(excerpt);
    didAdd = true;
  });

  return didAdd;
}

async function refreshDatabaseSearchResults(query) {
  if (!query || query.length < 2) return;
  const requestId = databaseSearchRequestId + 1;
  databaseSearchRequestId = requestId;

  try {
    const response = await searchArchive(query, { limit: 12 });
    if (requestId !== databaseSearchRequestId || activeSearchQuery !== query) return;
    if (mergeDatabaseSearchResults(response.results || [])) {
      renderTagCloud();
      updateTagButtonStates();
      applySearchAndFilters();
    }
  } catch (error) {
    console.warn('Database search unavailable.', error);
  }
}

async function loadCmsJournalPages() {
  try {
    const response = await listPages({ includeDrafts: false, limit: 100, status: 'published' });
    return (response.pages || [])
      .filter((page) => page.kind === 'journal')
      .map(normalizeCmsJournalPage);
  } catch (error) {
    console.warn('CMS journal pages unavailable.', error);
    return [];
  }
}

async function loadStaticJournalOverrides() {
  if (!journalData?.length) return [];

  try {
    const listRes = await listPages({ limit: 100 });
    const existingPages = listRes?.pages || [];
    const existingSlugs = new Set(existingPages.map(p => p.slug));

    const overrideResults = await Promise.all(
      journalData.map(async (article) => {
        const payload = syncJournalArticle(article);
        if (!payload.slug || !existingSlugs.has(payload.slug)) return null;

        try {
          const response = await getPage(payload.slug);
          return response?.page
            ? normalizeCmsJournalPage({ ...response.page, entry_number: response.page.entry_number || article.id })
            : null;
        } catch (error) {
          console.warn(`CMS journal override load failed for ${payload.slug}.`, error);
          return null;
        }
      })
    );

    return overrideResults.filter(Boolean);
  } catch (err) {
    console.warn('Failed to list CMS pages for static overrides:', err);
    return [];
  }
}

function getJournalEntryNumber(page) {
  const explicit = String(page?.entry_number || '').match(/\d{1,6}/)?.[0];
  if (explicit) return explicit.padStart(3, '0');

  const slugMatch = String(page?.slug || page?.id || '').match(/\bjournal-(\d{1,6})\b/i);
  return slugMatch ? slugMatch[1].padStart(3, '0') : '';
}

function renderJournalCardImage(page, fallbackAlt = '') {
  const images = page.image_items?.length ? page.image_items.slice(0, 3) : [{ src: page.image, alt: page.title || fallbackAlt }];
  if (images.length > 1) {
    return `<div class="cms-card-collage">${images.map((image) => `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || page.title || fallbackAlt)}" />`).join('')}</div>`;
  }

  return `<img src="${escapeHtml(images[0]?.src || page.image)}" alt="${escapeHtml(images[0]?.alt || page.title || fallbackAlt)}" />`;
}

function applyCmsJournalCardOverrides(pages) {
  pages.forEach((page) => {
    const entryNumber = getJournalEntryNumber(page);
    if (!entryNumber) return;

    const card = document.querySelector(`.journal-card[href="/article.html?id=${entryNumber}"]`);
    if (!card) return;

    const titleEl = card.querySelector('.entry-title');
    const metaEl = card.querySelector('.entry-meta');
    if (titleEl) titleEl.textContent = page.title;
    if (metaEl) metaEl.textContent = page.meta || 'JOURNAL / VISUAL ESSAY';

    const excerptEl = card.querySelector('.entry-excerpt');
    if (excerptEl) {
      excerptEl.textContent = page.excerpt || page.preamble || '';
    }

    const imageSlot = card.matches('.featured')
      ? card.querySelector('.card-bg')
      : card.querySelector('.card-image-wrap');
    if (imageSlot) {
      const overlay = imageSlot.querySelector('.card-overlay');
      imageSlot.innerHTML = renderJournalCardImage(page, page.title);
      if (overlay) imageSlot.appendChild(overlay);
    }
  });
}

function renderCmsJournalCard(page, index) {
  const entryNumber = page.entry_number || String(index + 1).padStart(3, '0');
  const imageHtml = renderJournalCardImage(page, page.title);

  return `
    <a href="/article.html?id=${encodeURIComponent(page.slug || page.id)}" class="journal-card secondary cms-journal-card" style="text-decoration: none; color: inherit; display: block;">
      <div class="card-image-wrap">
        ${imageHtml}
      </div>
      <div class="card-content">
        <div class="entry-label">JOURNAL ENTRY ${escapeHtml(String(entryNumber).padStart(3, '0'))}</div>
        <h4 class="entry-title">${escapeHtml(page.title)}</h4>
        <div class="entry-meta">${escapeHtml(page.meta || 'JOURNAL / VISUAL ESSAY')}</div>
        <p class="entry-excerpt">${escapeHtml(page.excerpt || page.preamble || '')}</p>
        <span class="btn-text">&rarr;</span>
      </div>
    </a>
  `;
}

function renderCmsJournalCards(pages) {
  const secondaryGrid = document.querySelector('.journal .secondary-grid');
  if (!secondaryGrid) return;

  const staticIds = new Set((journalData || []).map((item) => String(item.id || '').padStart(3, '0').toLowerCase()));
  
  // Filter out static IDs, and only include actual journal entries (exclude scene studies)
  const extraPages = pages.filter((page) => {
    if (page.platform !== 'journal') return false;
    
    const entryNum = getJournalEntryNumber(page).toLowerCase();
    const pageId = String(page.slug || page.id || '').toLowerCase();
    
    if (staticIds.has(entryNum) || staticIds.has(pageId)) return false;
    
    return true;
  });
  if (!extraPages.length) return;

  secondaryGrid.querySelectorAll('.cms-journal-card').forEach((card) => card.remove());
  secondaryGrid.insertAdjacentHTML('afterbegin', extraPages.map(renderCmsJournalCard).join(''));
}

function normalizeArchiveText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const hiddenArchiveTags = new Set(['facebook', 'letterboxd', 'still', 'quote']);

const genreTagKeywords = [
  'action',
  'adventure',
  'animation',
  'comedy',
  'crime',
  'documentary',
  'drama',
  'fantasy',
  'horror',
  'musical',
  'mystery',
  'noir',
  'romance',
  'sci-fi',
  'science fiction',
  'thriller',
  'western',
  'road movie',
  'slow cinema',
  'urban noir',
  'visual essay',
  'photo essay'
];

const archiveNameStopWords = new Set([
  'Original Link',
  'Special Edition',
  'Theater',
  'Cinema',
  'Film',
  'Movie',
  'Movies',
  'Story',
  'Director',
  'Directed',
  'Written',
  'Watched',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]);

function cleanArchiveTag(value) {
  return String(value || '')
    .replace(/[*_`~#]/g, '')
    .replace(/[()[\]{}"“”]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:;,.&/-]+|[\s:;,.&/-]+$/g, '')
    .trim();
}

function getArchiveTagKey(value) {
  return cleanArchiveTag(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—−]/g, '-')
    .replace(/&/g, ' and ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(?:a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeArchiveTags(values) {
  const canonical = new Map();

  Array.from(values || []).forEach((value) => {
    const clean = cleanArchiveTag(value).toLowerCase();
    const key = getArchiveTagKey(clean);
    if (!key || hiddenArchiveTags.has(clean)) return;
    if (!canonical.has(key)) {
      canonical.set(key, clean);
    }
  });

  return Array.from(canonical.values()).sort();
}

function getHiddenTagKeys(category) {
  const values = [
    ...(tagOverrides.hidden.all || []),
    ...(tagOverrides.hidden[category] || [])
  ];
  return new Set(values.map(getArchiveTagKey).filter(Boolean));
}

function isTagHiddenInCategory(tag, category) {
  return getHiddenTagKeys(category).has(getArchiveTagKey(tag));
}

function addVisibleTagToGroup(tagGroups, category, tag) {
  const cleanTag = String(tag || '').toLowerCase().trim();
  if (!cleanTag || hiddenArchiveTags.has(cleanTag)) return;
  if (isTagHiddenInCategory(cleanTag, category)) return;
  tagGroups[category]?.add(cleanTag);
  tagGroups.all.add(cleanTag);
}

function addArchiveTag(tags, value) {
  const clean = cleanArchiveTag(value);
  const lower = clean.toLowerCase();
  if (!lower || hiddenArchiveTags.has(lower)) return;
  if (lower.length < 2 || lower.length > 60) return;
  if (/^https?:\/\//i.test(clean)) return;
  if (/^\d+$/.test(clean)) return;
  tags.add(lower);
}

function addArchiveTagList(tags, value) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => addArchiveTagList(tags, item));
    return;
  }

  String(value)
    .split(/[,;/|]+|\s+&\s+|\s+and\s+/i)
    .map(cleanArchiveTag)
    .filter(Boolean)
    .forEach((item) => addArchiveTag(tags, item));
}

function addArchiveGroupTag(groups, group, value) {
  addArchiveTag(groups[group], value);
}

function addArchiveGroupTagList(groups, group, value) {
  addArchiveTagList(groups[group], value);
}

function titleFromLetterboxdText(text) {
  const match = String(text || '').match(/^\s*\*\*([^*\n]+?),\s*((?:19|20)\d{2})\s*[-–—]/);
  return match ? match[1] : '';
}

function titleFromLetterboxdUrl(value) {
  const match = String(value || '').match(/\/film\/([^/?#]+)/i);
  if (!match) return '';
  return match[1]
    .replace(/-\d{4}$/g, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractCapitalizedNames(value) {
  const text = String(value || '');
  const names = [];
  const pattern = /\b(?:[A-ZÅÄÖÉÈÁÀÍÓÚÜÑ][\p{L}.’'-]*)(?:\s+(?:[A-ZÅÄÖÉÈÁÀÍÓÚÜÑ][\p{L}.’'-]*|[A-Z]\.)){1,4}\b/gu;
  let match = pattern.exec(text);

  while (match) {
    const name = cleanArchiveTag(match[0].replace(/[’']s$/i, ''));
    if (name && !archiveNameStopWords.has(name) && !/\b(?:Original Link|Letterboxd)\b/i.test(name)) {
      names.push(name);
    }
    match = pattern.exec(text);
  }

  return names;
}

function extractCreditNames(text, rolePattern) {
  const names = [];
  const pattern = new RegExp(`${rolePattern}\\s+([^.!?\\n]{2,180})`, 'giu');
  let match = pattern.exec(text);

  while (match) {
    const segment = match[1].split(/\b(?:but|with|and yes|by the time|original link)\b/i)[0];
    names.push(...extractCapitalizedNames(segment));
    match = pattern.exec(text);
  }

  return names;
}

function addMovieAndDirectorMentions(groups, text) {
  const mentionPattern = /(?:\*{1,2})?([A-ZÅÄÖÉÈÁÀÍÓÚÜÑ][^*\n()]{1,90}?)(?:\*{1,2})?\s*\(([^)]*?)(?:,\s*)?((?:19|20)\d{2})\)/gu;
  let match = mentionPattern.exec(text);

  while (match) {
    addArchiveGroupTag(groups, 'movies', match[1]);
    const credit = cleanArchiveTag(match[2]);
    if (credit && !/^(?:19|20)\d{2}$/.test(credit)) {
      addArchiveGroupTagList(groups, 'directors', credit);
    }
    match = mentionPattern.exec(text);
  }
}

function buildArchiveTagGroups(item) {
  const groups = {
    tags: new Set(),
    directors: new Set(),
    actors: new Set(),
    movies: new Set(),
    genres: new Set()
  };

  addArchiveGroupTagList(groups, 'tags', item.tags);
  addArchiveGroupTag(groups, 'movies', item.movie_query);
  addArchiveGroupTag(groups, 'directors', item.director);
  addArchiveGroupTagList(groups, 'directors', item.directors);
  addArchiveGroupTag(groups, 'actors', item.actor);
  addArchiveGroupTagList(groups, 'actors', item.actors);
  addArchiveGroupTagList(groups, 'actors', item.cast);
  addArchiveGroupTagList(groups, 'genres', item.genre);
  addArchiveGroupTagList(groups, 'genres', item.genres);

  const text = [
    item.title,
    item.meta,
    item.preamble,
    item.excerpt,
    item.content,
    item.raw_text
  ].filter(Boolean).join('\n');

  addArchiveGroupTag(groups, 'movies', titleFromLetterboxdText(item.raw_text));
  addArchiveGroupTag(groups, 'movies', titleFromLetterboxdUrl(item.original_link));

  extractMarkdownImages(text).forEach((image) => {
    addArchiveGroupTag(groups, 'movies', normalizeMovieTitle(image.alt));
  });

  addMovieAndDirectorMentions(groups, text);

  extractCreditNames(text, '(?:directed by|director|from director|written by|writer|screenplay by)').forEach((name) => addArchiveGroupTag(groups, 'directors', name));
  extractCreditNames(text, '(?:starring|cast with|ensemble of|performance by|performances by|played by|actor|actress)').forEach((name) => addArchiveGroupTag(groups, 'actors', name));

  genreTagKeywords.forEach((genre) => {
    const normalizedGenre = normalizeArchiveText(genre);
    if (normalizeArchiveText(text).includes(normalizedGenre)) {
      addArchiveGroupTag(groups, 'genres', genre);
    }
  });

  return Object.fromEntries(
    Object.entries(groups).map(([key, value]) => [key, canonicalizeArchiveTags(value)])
  );
}

function enrichArchiveItemTags(item) {
  const tagGroups = buildArchiveTagGroups(item);
  const tags = new Set();
  Object.values(tagGroups).forEach((group) => group.forEach((tag) => tags.add(tag)));

  return {
    ...item,
    tags: canonicalizeArchiveTags(tags),
    __archiveTagGroups: tagGroups
  };
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
  if (item.form === 'scene study' || tags.some(t => t.toLowerCase() === 'scene study')) forms.add('scene study');

  const bodyText = normalizeArchiveText(item.content || item.raw_text || item.excerpt || item.preamble || '');
  const textLength = bodyText.length;
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
  const shortNoteSignals = item.platform === 'facebook' || wordCount < 90;

  if (item.platform === 'journal' || wordCount > 140 || textLength > 900) forms.add('feature');
  if (shortNoteSignals && wordCount < 120) forms.add('short note');
  if (!forms.size) forms.add('short note');

  const year = extractArchiveYear(item);
  let era = null;
  if (year !== null) {
    if (year < 1970) era = 'old movies';
    else if (year >= 1970 && year <= 1979) era = '70s';
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
  const panels = document.querySelectorAll('.archive-filter-panel');
  if (!panels.length) return;

  const html = Object.entries(archiveFacetConfig).map(([groupKey, groupItems]) => `
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

  panels.forEach((panel) => {
    panel.innerHTML = html;
  });
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
  return activeTags.size > 0 || Object.values(activeFacetFilters).some(set => set.size > 0);
}

function deduplicateArticles(list) {
  const seenKeys = new Set();
  const seenTitles = new Set();
  const seenExcerpts = new Set();
  const result = [];

  list.forEach((item) => {
    let key = String(item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
    if (key.startsWith('journal-')) {
      key = key.substring('journal-'.length);
    }
    
    const title = String(item.title || '').trim().toLowerCase();
    const excerpt = String(item.excerpt || item.preamble || '').trim().toLowerCase();

    if (key && seenKeys.has(key)) return;
    if (title && title !== 'untitled') {
      const strippedTitle = title.split('—')[0].split('-')[0].trim();
      if (seenTitles.has(strippedTitle)) return;
    }
    if (excerpt && seenExcerpts.has(excerpt)) return;

    if (key) seenKeys.add(key);
    if (title && title !== 'untitled') {
      const strippedTitle = title.split('—')[0].split('-')[0].trim();
      seenTitles.add(strippedTitle);
    }
    if (excerpt) seenExcerpts.add(excerpt);

    result.push(item);
  });

  return result;
}

// Load both datasets and initialize search
export async function initSearch() {
  try {
    await loadImdbScores();
    await loadSearchTagOverrides();

    // 1. Journal data — use preloaded cache if available, else fetch
    if (preloadedJournalData) {
      journalData = preloadedJournalData;
    } else {
      const journalResponse = await fetch('/data/journal.json?t=' + Date.now());
      if (journalResponse.ok) journalData = await journalResponse.json();
    }

    // 2. CMS journal pages from DB
    const staticJournalOverrides = await loadStaticJournalOverrides();
    applyCmsJournalCardOverrides(staticJournalOverrides);

    const cmsJournalPages = await loadCmsJournalPages();
    renderCmsJournalCards(cmsJournalPages);

    // 3. Articles — use preloaded cache if available
    let articles = null;
    if (preloadedArticlesData) {
      preloadedArticlesData.forEach((item, idx) => { item.localIndex = idx; });
      articles = preloadedArticlesData;
    } else {
      articles = await fetchArticles();
    }

    // 4. Combine and deduplicate all datasets
    const rawCombined = [];
    if (journalData) {
      rawCombined.push(...journalData.map(item => ({ ...item, platform: 'journal' })));
    }
    if (cmsJournalPages) rawCombined.push(...cmsJournalPages);
    if (articles) rawCombined.push(...articles);

    // 5. Merge CMS DB pages from warmup (gives instant autocomplete for DB content)
    if (preloadedWarmupData?.pages?.length) {
      const warmupNormalized = preloadedWarmupData.pages.map(p => ({
        id: p.slug,
        slug: p.slug,
        title: p.title || 'Untitled',
        meta: p.meta || '',
        preamble: p.excerpt || '',
        excerpt: p.excerpt || '',
        image: p.image || '/assets/images/journal_feature.webp',
        feature_image: p.image || '/assets/images/journal_feature.webp',
        content: p.excerpt || '',
        date: p.published_at || '',
        date_display: p.published_at || '',
        tags: ['cms', p.kind || 'page'].filter(Boolean),
        platform: p.kind === 'journal' ? 'journal' : 'cms',
        source: 'cms',
        movie_query: '',
        entry_number: '',
        url: p.kind === 'journal' ? `/article.html?id=${encodeURIComponent(p.slug)}` : `/${p.slug}`
      }));
      rawCombined.push(...warmupNormalized);
    }

    allArticles = deduplicateArticles(rawCombined.map(enrichArchiveItemTags));

    // 6. Render Tag Cloud
    renderArchiveFilters();
    renderTagCloud();

    // 7. Setup listeners
    setupSearchListeners();

    // 8. Handle initial URL hash
    handleURLParams();
  } catch (err) {
    console.error('Failed to initialize search:', err);
  }
}

function renderTagCloud() {
  const tagCloudEls = document.querySelectorAll('.tag-cloud');
  if (!tagCloudEls.length) return;
  if (!isSearchTagAdmin()) tagEditMode = false;

  const tagGroups = {
    all: new Set(),
    directors: new Set(),
    actors: new Set(),
    movies: new Set(),
    genres: new Set()
  };

  allArticles.forEach(item => {
    const groups = item.__archiveTagGroups || {};
    tagListCategories
      .filter((category) => category.value !== 'all')
      .forEach((category) => {
        (groups[category.value] || []).forEach((tag) => {
          addVisibleTagToGroup(tagGroups, category.value, tag);
        });
      });

    (groups.tags || item.tags || []).forEach((tag) => {
      const cleanTag = String(tag || '').toLowerCase().trim();
      if (!cleanTag || hiddenArchiveTags.has(cleanTag) || isTagHiddenInCategory(cleanTag, 'all')) return;
      tagGroups.all.add(cleanTag);
    });
  });

  tagListCategories
    .filter((category) => category.value !== 'all')
    .forEach((category) => {
      (tagOverrides.added[category.value] || []).forEach((tag) => addVisibleTagToGroup(tagGroups, category.value, tag));
    });

  (tagOverrides.added.all || []).forEach((tag) => {
    const cleanTag = String(tag || '').toLowerCase().trim();
    if (!cleanTag || hiddenArchiveTags.has(cleanTag) || isTagHiddenInCategory(cleanTag, 'all')) return;
    tagGroups.all.add(cleanTag);
  });

  const activeGroup = tagGroups[activeTagListCategory] ? activeTagListCategory : 'all';
  const sortedTags = canonicalizeArchiveTags(tagGroups[activeGroup]);
  const isAdminEditing = isSearchTagAdmin() && tagEditMode;
  const tabsHtml = tagListCategories.map((category) => {
    const count = canonicalizeArchiveTags(tagGroups[category.value]).length;
    return `
      <button class="tag-list-filter ${category.value === activeGroup ? 'active' : ''}" type="button" data-tag-list="${escapeHtml(category.value)}">
        ${escapeHtml(category.label)} <span>${count}</span>
      </button>
    `;
  }).join('');

  const tagsHtml = sortedTags.length ? sortedTags.map(tag => (
    isAdminEditing
      ? `<span class="tag-btn tag-edit-chip" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
          <button class="tag-remove-btn" type="button" data-tag="${escapeHtml(tag)}" data-tag-group="${escapeHtml(activeGroup)}" aria-label="Remove ${escapeHtml(tag)}">×</button>
        </span>`
      : `<button class="tag-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
  )).join('') : '<div class="tag-cloud-empty">No tags in this group yet.</div>';

  const adminCategoryOptions = tagListCategories
    .filter((category) => category.value !== 'all')
    .map((category) => `<option value="${escapeHtml(category.value)}" ${category.value === activeGroup ? 'selected' : ''}>${escapeHtml(category.label)}</option>`)
    .join('');

  const adminHtml = isSearchTagAdmin() ? `
    <div class="tag-admin-tools ${tagEditMode ? 'editing' : ''}">
      <button class="tag-edit-toggle" type="button">${tagEditMode ? 'DONE EDITING' : 'EDIT TAGS'}</button>
      ${tagEditMode ? `
        <form class="tag-add-form">
          <select class="tag-add-category" aria-label="Tag category">
            ${adminCategoryOptions}
          </select>
          <input class="tag-add-input" type="text" placeholder="ADD TAG..." />
          <button class="tag-add-btn" type="submit">ADD</button>
        </form>
      ` : ''}
    </div>
  ` : '';

  const html = `
    ${adminHtml}
    <div class="tag-list-filters">${tabsHtml}</div>
    <div class="tag-list-results">${tagsHtml}</div>
  `;

  tagCloudEls.forEach((tagCloudEl) => {
    tagCloudEl.innerHTML = html;
  });
}

function syncSearchInputs() {
  document.querySelectorAll('[data-search-input]').forEach((input) => {
    if (input.value !== activeSearchQuery) input.value = activeSearchQuery;
  });

  document.querySelectorAll('.search-clear-btn').forEach((button) => {
    button.style.display = activeSearchQuery ? 'block' : 'none';
  });
}

export function updateTagButtonStates() {
  document.querySelectorAll('.tag-btn').forEach((button) => {
    const tag = button.getAttribute('data-tag');
    button.classList.toggle('active', activeTags.has(tag));
  });
}

export function setSearchQuery(value) {
  activeSearchQuery = String(value || '').toLowerCase();
  syncSearchInputs();
  applySearchAndFilters();

  window.clearTimeout(databaseSearchTimer);
  const trimmed = activeSearchQuery.trim();
  if (trimmed.length >= 2) {
    databaseSearchTimer = window.setTimeout(() => refreshDatabaseSearchResults(trimmed), 220);
  }
}

function setActiveArchiveTag(tag) {
  if (!tag) return;
  if (activeTags.has(tag)) {
    activeTags.delete(tag);
  } else {
    activeTags.add(tag);
  }
  updateTagButtonStates();
  applySearchAndFilters();
}

export function openGlobalSearchPanel({ focus = true } = {}) {
  const panel = document.getElementById('global-search-panel');
  if (!panel) return;
  globalSearchOpen = true;
  renderTagCloud();
  updateTagButtonStates();
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();
  applySearchAndFilters();

  if (focus) {
    window.setTimeout(() => document.getElementById('global-search-input')?.focus(), 60);
  }
}

export function closeGlobalSearchPanel() {
  const panel = document.getElementById('global-search-panel');
  if (!panel) return;
  globalSearchOpen = false;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  
  const accountDrawer = document.getElementById('account-drawer');
  const journalDrawer = document.getElementById('journal-drawer');
  const mobileMenu = document.getElementById('mobile-menu');
  const drawerOpen = journalDrawer?.classList.contains('open') || accountDrawer?.classList.contains('open') || mobileMenu?.classList.contains('active');
  if (!drawerOpen) {
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
}

function setupSearchListeners() {
  const searchInputs = document.querySelectorAll('[data-search-input]');
  const searchClearButtons = document.querySelectorAll('.search-clear-btn');
  const clearFiltersBtns = document.querySelectorAll('.clear-filters-link');
  const archiveFilterPanel = document.getElementById('archive-filter-panel');
  const globalArchiveFilterPanel = document.getElementById('global-archive-filter-panel');
  const navSearchBtn = document.querySelector('.search-btn');
  const mobileSearchBtn = document.getElementById('open-global-search-mobile');
  const globalSearchCloseBtn = document.getElementById('global-search-close');

  // Search input typing
  searchInputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      setSearchQuery(e.target.value);
    });
  });

  const dedicatedInput = document.getElementById('dedicated-search-input');
  const autocompleteDropdown = document.getElementById('search-autocomplete-dropdown');
  const autocompleteList = document.getElementById('autocomplete-list');

  function updateAutocomplete(query) {
    if (!autocompleteDropdown || !autocompleteList) return;
    
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.length < 2) {
      autocompleteDropdown.style.display = 'none';
      return;
    }

    const matches = [];
    const matchedTitles = new Set();
    const matchedTags = new Set();

    allArticles.forEach(article => {
      const title = String(article.title || '').trim();
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes(cleanQuery) && !matchedTitles.has(lowerTitle)) {
        matches.push({ type: 'title', value: title, text: title });
        matchedTitles.add(lowerTitle);
      }

      const director = String(article.director || '').trim();
      const lowerDir = director.toLowerCase();
      if (lowerDir.includes(cleanQuery) && !matchedTitles.has(lowerDir)) {
        matches.push({ type: 'director', value: director, text: `Director: ${director}` });
        matchedTitles.add(lowerDir);
      }

      const searchableTagGroups = article.__archiveTagGroups || {};
      Object.entries(searchableTagGroups).forEach(([group, tags]) => {
        const typeLabel = group === 'movies' ? 'movie' : group.replace(/s$/, '');
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            const lowerTag = tag.trim().toLowerCase();
            if (lowerTag.includes(cleanQuery) && !matchedTags.has(lowerTag)) {
              matches.push({ type: typeLabel, value: tag.trim(), text: `#${tag.trim()}` });
              matchedTags.add(lowerTag);
            }
          });
        }
      });

      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => {
          const lowerTag = tag.trim().toLowerCase();
          if (lowerTag.includes(cleanQuery) && !matchedTags.has(lowerTag)) {
            matches.push({ type: 'tag', value: tag.trim(), text: `#${tag.trim()}` });
            matchedTags.add(lowerTag);
          }
        });
      }

      // Scan content body for matching words or names (like "Michael Mann")
      const contentText = String(article.content || article.raw_text || '');
      const lowerContent = contentText.toLowerCase();
      const matchIndex = lowerContent.indexOf(cleanQuery);
      if (matchIndex !== -1) {
        const regex = new RegExp(`(\\b[A-Z][a-zA-Z]*\\s+)?\\b${cleanQuery}[a-zA-Z]*`, 'i');
        const match = contentText.match(regex);
        if (match) {
          const phrase = match[0].trim().replace(/[.,'’s]+$/, '');
          const lowerPhrase = phrase.toLowerCase();
          if (phrase.length > 2 && !matchedTitles.has(lowerPhrase)) {
            matches.push({ type: 'keyword', value: phrase, text: phrase });
            matchedTitles.add(lowerPhrase);
          }
        }
      }
    });

    const suggestions = matches.slice(0, 6);

    if (suggestions.length === 0) {
      autocompleteDropdown.style.display = 'none';
      return;
    }

    autocompleteList.innerHTML = suggestions.map(item => `
      <li class="autocomplete-item" data-type="${item.type}" data-value="${item.value}">
        <span>${item.text}</span>
        <span class="autocomplete-type">${item.type}</span>
      </li>
    `).join('');

    autocompleteDropdown.style.display = 'block';
  }

  dedicatedInput?.addEventListener('input', (e) => {
    // Clear filters on first character
    if (activeTags.size > 0 || hasActiveArchiveFacetFilters()) {
      activeTags.clear();
      clearArchiveFacetFilters();
      updateTagButtonStates();
      updateArchiveFilterChipStates();
    }
    updateAutocomplete(e.target.value);
  });

  dedicatedInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Ensure active filters are cleared
      if (activeTags.size > 0 || hasActiveArchiveFacetFilters()) {
        activeTags.clear();
        clearArchiveFacetFilters();
        updateTagButtonStates();
        updateArchiveFilterChipStates();
      }
      openGlobalSearchPanel({ focus: true });
      if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
    }
  });

  autocompleteList?.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.autocomplete-item');
    if (!itemEl) return;

    const type = itemEl.getAttribute('data-type');
    const value = itemEl.getAttribute('data-value');

    // Ensure clean search
    activeTags.clear();
    clearArchiveFacetFilters();
    updateTagButtonStates();
    updateArchiveFilterChipStates();

    if (type === 'tag') {
      setActiveArchiveTag(value);
    } else {
      setSearchQuery(value);
    }

    openGlobalSearchPanel({ focus: true });
    if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (autocompleteDropdown && dedicatedInput && !dedicatedInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
      autocompleteDropdown.style.display = 'none';
    }
  });

  const dedicatedIcon = dedicatedInput?.parentElement?.querySelector('.search-icon');
  dedicatedIcon?.addEventListener('click', () => {
    if (activeTags.size > 0 || hasActiveArchiveFacetFilters()) {
      activeTags.clear();
      clearArchiveFacetFilters();
      updateTagButtonStates();
      updateArchiveFilterChipStates();
    }
    openGlobalSearchPanel({ focus: true });
    if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
  });

  // Clear search input
  searchClearButtons.forEach((button) => {
    button.addEventListener('click', () => setSearchQuery(''));
  });

  // Tag button clicks, shared by the nav tray and archive section.
  document.addEventListener('click', (event) => {
    const editToggle = event.target.closest('.tag-edit-toggle');
    if (editToggle) {
      tagEditMode = !tagEditMode;
      renderTagCloud();
      updateTagButtonStates();
      return;
    }

    const removeBtn = event.target.closest('.tag-remove-btn');
    if (removeBtn) {
      const tag = removeBtn.getAttribute('data-tag') || '';
      const group = removeBtn.getAttribute('data-tag-group') || activeTagListCategory || 'all';
      const targetGroup = group === 'all' ? 'all' : group;
      tagOverrides.hidden[targetGroup] = canonicalizeArchiveTags([...(tagOverrides.hidden[targetGroup] || []), tag]);
      Object.keys(tagOverrides.added).forEach((category) => {
        tagOverrides.added[category] = canonicalizeArchiveTags((tagOverrides.added[category] || []).filter((item) => getArchiveTagKey(item) !== getArchiveTagKey(tag)));
      });
      activeTags.delete(String(tag).toLowerCase().trim());
      saveSearchTagOverrides();
      return;
    }

    const filterBtn = event.target.closest('.tag-list-filter');
    if (filterBtn) {
      activeTagListCategory = filterBtn.getAttribute('data-tag-list') || 'all';
      renderTagCloud();
      updateTagButtonStates();
      return;
    }

    const btn = event.target.closest('.tag-btn');
    if (!btn) return;
    if (tagEditMode && btn.classList.contains('tag-edit-chip')) return;
    const tag = btn.getAttribute('data-tag');
    setActiveArchiveTag(tag);
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('.tag-add-form');
    if (!form) return;
    event.preventDefault();

    const input = form.querySelector('.tag-add-input');
    const select = form.querySelector('.tag-add-category');
    const tag = cleanArchiveTag(input?.value || '').toLowerCase();
    const category = select?.value || (activeTagListCategory === 'all' ? 'directors' : activeTagListCategory);
    if (!tag || !tagOverrides.added[category]) return;

    tagOverrides.hidden[category] = canonicalizeArchiveTags((tagOverrides.hidden[category] || []).filter((item) => getArchiveTagKey(item) !== getArchiveTagKey(tag)));
    tagOverrides.hidden.all = canonicalizeArchiveTags((tagOverrides.hidden.all || []).filter((item) => getArchiveTagKey(item) !== getArchiveTagKey(tag)));
    tagOverrides.added[category] = canonicalizeArchiveTags([...(tagOverrides.added[category] || []), tag]);
    if (input) input.value = '';
    saveSearchTagOverrides();
  });

  const handleFilterPanelClick = (e) => {
    const chip = e.target.closest('.archive-filter-chip');
    if (!chip) return;

    const group = chip.getAttribute('data-facet-group');
    const value = chip.getAttribute('data-facet-value');
    const groupSet = activeFacetFilters[group];

    if (!groupSet) return;

    if (groupSet.has(value)) {
      groupSet.delete(value);
    } else {
      groupSet.add(value);
    }

    updateArchiveFilterChipStates();
    applySearchAndFilters();
  };

  archiveFilterPanel?.addEventListener('click', handleFilterPanelClick);
  globalArchiveFilterPanel?.addEventListener('click', handleFilterPanelClick);

  // Clear all filters link
  clearFiltersBtns.forEach((clearFiltersBtn) => clearFiltersBtn.addEventListener('click', () => {
    activeSearchQuery = '';
    activeTags.clear();
    clearArchiveFacetFilters();
    updateTagButtonStates();
    syncSearchInputs();
    applySearchAndFilters();
  }));

  // Nav SEARCH button opens the global tray.
  navSearchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openGlobalSearchPanel();
  });

  mobileSearchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.remove('active');
    openGlobalSearchPanel();
  });

  globalSearchCloseBtn?.addEventListener('click', closeGlobalSearchPanel);
}

export function handleURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');
  
  if (tagParam) {
    const cleanTag = tagParam.toLowerCase().trim();
    setTimeout(() => {
      setActiveArchiveTag(cleanTag);

      if (window.location.hash === '#search') {
        openGlobalSearchPanel();
        return;
      }

      const exploreSection = document.getElementById('explore');
      if (exploreSection) {
        if (lenis) {
          lenis.start();
          lenis.scrollTo(exploreSection, { offset: -80 });
        }
      }
    }, 500);
  } else if (window.location.hash === '#search') {
    setTimeout(() => openGlobalSearchPanel(), 500);
  } else if (window.location.hash === '#explore') {
    setTimeout(() => {
      const exploreSection = document.getElementById('explore');
      if (exploreSection) {
        if (lenis) {
          lenis.start();
          lenis.scrollTo(exploreSection, { offset: -80 });
        }
        document.getElementById('archive-search-input')?.focus();
      }
    }, 500);
  }
}

function getSearchResultKey(item) {
  let key = String(item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
  if (key.startsWith('journal-')) {
    key = key.substring('journal-'.length);
  }

  if (key) return `${item.platform || 'archive'}:${key}`;

  const link = String(item.original_link || item.url || '').trim().toLowerCase();
  if (link) return `link:${link}`;

  return [
    item.platform || 'archive',
    normalizeArchiveText(item.title),
    normalizeArchiveText(item.date_display || item.date),
    normalizeArchiveText(item.excerpt || item.preamble || item.raw_text).slice(0, 120)
  ].join(':');
}

function deduplicateSearchResults(list) {
  const seen = new Set();
  const result = [];

  list.forEach((item) => {
    const key = getSearchResultKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(item);
  });

  return result;
}

function forceVisibleSearchResultCards(...grids) {
  grids.filter(Boolean).forEach((grid) => {
    grid.querySelectorAll('.motion-reveal, .motion-reveal-up, .motion-reveal-left, .motion-reveal-right').forEach((el) => {
      el.classList.remove('motion-reveal', 'motion-reveal-up', 'motion-reveal-left', 'motion-reveal-right');
    });

    grid.querySelectorAll('.short-card').forEach((card) => {
      card.style.setProperty('opacity', '1', 'important');
      card.style.setProperty('transform', 'none', 'important');
      card.style.setProperty('filter', 'none', 'important');
      card.classList.add('motion-visible');
    });
  });
}

export function applySearchAndFilters() {
  const searchResultsContainer = document.getElementById('search-results-container');
  const searchResultsGrid = document.getElementById('search-results-grid');
  const resultsCountEl = document.getElementById('results-count');
  const globalResultsContainer = document.getElementById('global-search-results-container');
  const globalResultsGrid = document.getElementById('global-search-results-grid');
  const globalResultsCountEl = document.getElementById('global-results-count');

  const cleanQuery = activeSearchQuery.trim();
  const isFilterActive = cleanQuery || hasActiveArchiveFacetFilters();

  if (!isFilterActive) {
    if (searchResultsContainer) searchResultsContainer.style.display = 'none';
    if (globalResultsContainer) globalResultsContainer.style.display = 'block';
    if (globalResultsCountEl) globalResultsCountEl.textContent = 'START TYPING TO SEARCH THE ARCHIVE';
    if (globalResultsGrid) {
      globalResultsGrid.innerHTML = `
        <div class="global-search-empty">Try a director, film title, mood, era, rating, or tag.</div>
      `;
    }
    return;
  }

  const filtered = deduplicateSearchResults(allArticles.filter(item => {
    const inferredFacets = inferArchiveFacets(item);
    const searchableText = getArchiveSearchText(item);

    if (activeTags.size > 0) {
      if (!item.tags || !Array.from(activeTags).every(t => item.tags.includes(t))) {
        return false;
      }
    }

    if (activeFacetFilters.mood.size > 0) {
      const moods = inferredFacets.mood || [];
      if (!Array.from(activeFacetFilters.mood).every(value => moods.includes(value))) return false;
    }

    if (activeFacetFilters.form.size > 0) {
      const forms = inferredFacets.form || [];
      if (!Array.from(activeFacetFilters.form).every(value => forms.includes(value))) return false;
    }

    if (activeFacetFilters.era.size > 0) {
      const eras = inferredFacets.era || [];
      if (!Array.from(activeFacetFilters.era).every(value => eras.includes(value))) return false;
    }

    if (activeFacetFilters.rating.size > 0) {
      const ratings = inferredFacets.rating || [];
      if (!Array.from(activeFacetFilters.rating).every(value => ratings.includes(value))) return false;
    }
    
    if (cleanQuery) {
      const matchesQuery = searchableText.includes(cleanQuery);
      if (!matchesQuery) return false;
    }
    
    return true;
  }));

  if (searchResultsContainer) searchResultsContainer.style.display = 'block';

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

  if (globalResultsContainer) globalResultsContainer.style.display = 'block';
  if (globalResultsCountEl) {
    globalResultsCountEl.textContent = `${filtered.length} MATCHING SCENE${filtered.length === 1 ? '' : 'S'}`;
  }
  if (globalResultsGrid) {
    const globalResults = filtered.slice(0, 8);
    globalResultsGrid.innerHTML = globalResults.length
      ? globalResults.map(item => {
        const globalIndex = item.platform !== 'journal' ? item.localIndex : -1;
        return createResultCardHtml(item, globalIndex);
      }).join('')
      : '<div class="global-search-empty">No matching scenes found. Try another phrase.</div>';
  }

  forceVisibleSearchResultCards(searchResultsGrid, globalResultsGrid);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createResultCardHtml(item, globalIndex) {
  const platform = item.platform || '';
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
  } else if (platform === 'cms') {
    iconHtml = '<div class="short-platform-icon journal-icon" style="background:#5B1F26; color:#fff; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"></path><path d="M8 8h8M8 12h8M8 16h5"></path></svg></div>';
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
    ? `href="/article.html?id=${encodeURIComponent(item.id)}"`
    : item.source === 'cms' && item.url
      ? `href="${escapeHtml(item.url)}"`
    : `href="#journal-drawer" data-index="${globalIndex}" class="search-result-drawer-trigger"`;

  return `
    <a ${linkAttr} style="text-decoration:none; color:inherit; display:block;">
      <article class="short-card" data-platform="${platform}" style="opacity: 1 !important; transform: none !important; filter: none !important;">
        <div class="short-image-wrap">
          ${iconHtml}
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(title)}" />
        </div>
        <div class="short-content">
          <div class="short-meta">${escapeHtml(dateStr)}</div>
          <h4 class="short-title">${escapeHtml(title)}</h4>
          ${movieRefHtml}
          <p class="short-excerpt">${escapeHtml(excerpt)}</p>
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
