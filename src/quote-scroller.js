const LOCAL_QUOTE_FEED = '/data/movie-quotes.json';
const DEFAULT_REMOTE_QUOTE_FEED = 'https://gist.githubusercontent.com/grant0417/59022d88dfeb5aadf9f6dc2f974f9c79/raw/9cf7a06aa90d74f691a6a087927465bafe9bec9a/AFI%20100%20Years%20100%20Movie%20Quotes.json';
const DEFAULT_RAIL_TEXT = 'SHARING THE DETAILS THAT ECHO THE FOOTSTEPS OF FILM';
const MAX_QUOTE_WORDS = 16;
const RAIL_PIXELS_PER_SECOND = 24;
const MIN_RAIL_DURATION_SECONDS = 42;

function getRemoteQuoteFeedUrl() {
  return window.CINEAST_QUOTE_FEED_URL
    || document.documentElement.dataset.quoteFeedUrl
    || localStorage.getItem('cineastQuoteFeedUrl')
    || DEFAULT_REMOTE_QUOTE_FEED;
}

function normalizeQuoteFeed(data) {
  const items = Array.isArray(data) ? data : data?.quotes;
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      quote: String(item.quote || item.text || '').trim(),
      movie: String(item.movie || item.film || item.title || '').trim(),
      year: String(item.year || item.releaseYear || '').trim()
    }))
    .filter((item) => (
      item.quote
      && item.movie
      && /^\d{4}$/.test(item.year)
      && item.quote.split(/\s+/).length <= MAX_QUOTE_WORDS
    ));
}

async function fetchQuoteFeed(url) {
  if (!url) return [];
  try {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) return [];
    return normalizeQuoteFeed(await response.json());
  } catch (_) {
    return [];
  }
}

function mergeQuoteFeeds(...feeds) {
  const seen = new Set();
  return feeds.flat().filter((item) => {
    const key = `${item.quote.toLowerCase()}|${item.movie.toLowerCase()}|${item.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatQuote(item) {
  return `"${item.quote}" - ${item.movie} (${item.year})`;
}

function buildRailItems(quotes) {
  return [DEFAULT_RAIL_TEXT, ...quotes.map(formatQuote)];
}

function updateRailDuration(rail) {
  const firstItem = rail.querySelector('span');
  if (!firstItem) return;

  const distance = firstItem.scrollWidth + 28;
  const duration = Math.max(
    MIN_RAIL_DURATION_SECONDS,
    Math.round(distance / RAIL_PIXELS_PER_SECOND)
  );
  rail.style.setProperty('--quote-rail-duration', `${duration}s`);
}

function updateAllRailDurations() {
  document
    .querySelectorAll('.quote-only-section .quote-feed-rail')
    .forEach(updateRailDuration);
}

function renderQuoteRails(quotes) {
  const rails = document.querySelectorAll('.quote-only-section .quote-feed-rail');
  if (!rails.length) return;

  const railItems = buildRailItems(quotes);
  rails.forEach((rail) => {
    rail.replaceChildren();
    const fragment = document.createDocumentFragment();
    [railItems, railItems].forEach((items) => {
      const loop = document.createElement('span');
      items.forEach((text) => {
        loop.appendChild(document.createTextNode(text));
        const separator = document.createElement('i');
        separator.className = 'rail-separator';
        separator.setAttribute('aria-hidden', 'true');
        loop.appendChild(separator);
      });
      fragment.appendChild(loop);
    });
    rail.appendChild(fragment);
    requestAnimationFrame(() => updateRailDuration(rail));
  });
}

export async function initQuoteScroller() {
  const rails = document.querySelectorAll('.quote-only-section .quote-feed-rail');
  if (!rails.length) return;

  const localQuotes = await fetchQuoteFeed(LOCAL_QUOTE_FEED);
  renderQuoteRails(localQuotes);

  const remoteUrl = getRemoteQuoteFeedUrl();
  if (!remoteUrl) return;

  const remoteQuotes = await fetchQuoteFeed(remoteUrl);
  const mergedQuotes = mergeQuoteFeeds(remoteQuotes, localQuotes);
  if (mergedQuotes.length) renderQuoteRails(mergedQuotes);

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateAllRailDurations).catch(() => {});
  }
  window.addEventListener('resize', updateAllRailDurations, { passive: true });
}
