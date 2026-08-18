const CARD_SELECTORS = [
  '.now-showing-card',
  '.now-notes-card',
  '.journal-card',
  '.scene-card',
  '.scene-featured',
  '.product-card',
  '.short-card',
  '.story-card',
  '.streaming-card'
];

export function initMobileHoverInView(root = document) {
  const isMobileQuery = window.matchMedia('(max-width: 768px), (pointer: coarse)');

  function updateCardVisibility(entry) {
    const card = entry.target;
    if (isMobileQuery.matches && entry.isIntersecting) {
      card.classList.add('is-in-view');
    } else {
      card.classList.remove('is-in-view');
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(updateCardVisibility);
    },
    {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.35
    }
  );

  const observedElements = new WeakSet();

  function observeCards(container = root) {
    CARD_SELECTORS.forEach((selector) => {
      const cards = container.querySelectorAll
        ? container.querySelectorAll(selector)
        : [];
      cards.forEach((card) => {
        if (!observedElements.has(card)) {
          observedElements.add(card);
          observer.observe(card);
        }
      });
    });
  }

  // Initial observation
  observeCards(root);

  // Re-evaluate when viewport size or media query changes
  const handleMediaChange = () => {
    if (!isMobileQuery.matches) {
      CARD_SELECTORS.forEach((selector) => {
        root.querySelectorAll(selector).forEach((card) => {
          card.classList.remove('is-in-view');
        });
      });
    }
  };

  if (isMobileQuery.addEventListener) {
    isMobileQuery.addEventListener('change', handleMediaChange);
  } else if (isMobileQuery.addListener) {
    isMobileQuery.addListener(handleMediaChange);
  }

  // Observe dynamically added cards
  if (window.MutationObserver && root.nodeType === Node.DOCUMENT_NODE) {
    const mutationObserver = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        observeCards(root);
      }
    });

    mutationObserver.observe(root.body || root, {
      childList: true,
      subtree: true
    });
  }
}
