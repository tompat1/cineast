const MOTION_REVEAL_SELECTORS = [
  '.hero-utility',
  '.hero-title',
  '.hero-subtitle',
  '.hero-ctas',
  '.hero-metadata',
  '.statement-col',
  '.road-intro-panel',
  '.now-showing-header',
  '.now-showing-card',
  '.now-showing-bottom',
  '.shop-hero-text',
  '.shop-featured-box',
  '.section-header',
  '.explore-controls',
  '.archive-filter-panel',
  '.search-results-container',
  '.journal-card',
  '.short-card',
  '.product-card',
  '.footer-col',
  '.footer-bottom',
  '.article-header',
  '.article-hero',
  '.article-content',
  '.article-sidebar',
  '.drawer-article-header',
  '.drawer-article-body'
];

const PARALLAX_SELECTORS = [
  '.road-intro-bg img',
  '.brand-bg img',
  '.shop-hero-bg img',
  '.article-hero img',
  '.search-section-bg img'
];

function setMotionDelay(el, index, step = 90) {
  el.style.setProperty('--motion-delay', `${index * step}ms`);
}

function shouldSkipMotionReveal(el) {
  return Boolean(el.closest('#explore, #global-search-panel, .dedicated-search-section'));
}

function decorateMotionTargets(root = document) {
  const allTargets = [];

  MOTION_REVEAL_SELECTORS.forEach((selector) => {
    const nodes = Array.from(root.querySelectorAll(selector));
    nodes.forEach((el, index) => {
      if (shouldSkipMotionReveal(el)) return;
      el.classList.add('motion-reveal-up');
      setMotionDelay(el, index, 80);
      allTargets.push(el);
    });
  });

  PARALLAX_SELECTORS.forEach((selector) => {
    root.querySelectorAll(selector).forEach((img) => {
      img.classList.add('motion-parallax-image');
      if (!img.dataset.parallaxSpeed) {
        if (selector === '.article-hero img') {
          img.dataset.parallaxSpeed = '0.05';
        } else {
          img.dataset.parallaxSpeed = '0.065';
        }
      }
    });
  });

  root.querySelectorAll('.now-showing-card').forEach((card, index) => {
    setMotionDelay(card, index, 120);
  });

  root.querySelectorAll('.journal-card.secondary, .short-card, .product-card').forEach((card, index) => {
    setMotionDelay(card, index, 90);
  });

  root.querySelectorAll('.footer-col').forEach((col, index) => {
    setMotionDelay(col, index, 110);
  });

  return allTargets;
}

export function initFilmicMotion(root = document) {
  const html = root.documentElement || document.documentElement;
  const body = root.body || document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionTargets = decorateMotionTargets(root);

  html.classList.add('motion-ready');

  if (!body.querySelector('.motion-grain-layer')) {
    const grain = document.createElement('div');
    grain.className = 'motion-grain-layer';
    grain.setAttribute('aria-hidden', 'true');
    body.appendChild(grain);
  }

  if (reduceMotion) {
    motionTargets.forEach((el) => el.classList.add('motion-visible'));
    root.querySelectorAll('.motion-parallax-image').forEach((img) => {
      img.style.setProperty('--parallax-y', '0px');
    });
    return;
  }

  const revealTargets = Array.from(new Set(motionTargets));
  const visibleSet = new Set();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (visibleSet.has(el)) return;
      visibleSet.add(el);
      el.classList.add('motion-visible');
      revealObserver.unobserve(el);
    });
  }, {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.16
  });

  revealTargets.forEach((el) => {
    revealObserver.observe(el);
  });

  const parallaxTargets = Array.from(root.querySelectorAll('.motion-parallax-image'));
  let parallaxFrame = 0;

  const updateParallax = () => {
    parallaxFrame = 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    parallaxTargets.forEach((img) => {
      const speed = Number.parseFloat(img.dataset.parallaxSpeed || '0.06');
      const rect = img.getBoundingClientRect();
      const distanceFromCenter = (rect.top + rect.height / 2) - (viewportHeight / 2);
      const offset = Math.max(-64, Math.min(64, -distanceFromCenter * speed));
      img.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  };

  const requestParallax = () => {
    if (parallaxFrame) return;
    parallaxFrame = window.requestAnimationFrame(updateParallax);
  };

  requestParallax();
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);
}
