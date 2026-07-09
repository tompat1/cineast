/**
 * Cineast Share Helper Module
 */

export function openShareModal(title, url, image) {
  let modal = document.getElementById('cineast-share-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.id = 'cineast-share-modal';
    modal.setAttribute('data-lenis-prevent', 'true');
    modal.innerHTML = `
      <div class="share-modal-overlay"></div>
      <div class="share-modal-container">
        <div class="share-modal-header">
          <div>
            <div class="share-modal-kicker">SHARE THIS</div>
            <h3 class="share-modal-title">Share</h3>
          </div>
          <button type="button" class="share-modal-close" id="share-modal-close-btn">&times;</button>
        </div>
        <div class="share-modal-body">
          <div class="share-preview-card">
            <div class="share-preview-img-container">
              <img id="share-preview-img" src="" alt="Preview" />
            </div>
            <div class="share-preview-info">
              <div class="share-preview-title" id="share-preview-title"></div>
              <div class="share-preview-url" id="share-preview-url"></div>
            </div>
          </div>
          <div class="share-options-grid">
            <button type="button" class="share-option-btn" id="share-opt-x">
              <iconify-icon icon="ri:twitter-x-line"></iconify-icon> X
            </button>
            <button type="button" class="share-option-btn" id="share-opt-fb">
              <iconify-icon icon="ri:facebook-fill"></iconify-icon> Facebook
            </button>
            <button type="button" class="share-option-btn" id="share-opt-ig">
              <iconify-icon icon="ri:instagram-line"></iconify-icon> Instagram
            </button>
            <button type="button" class="share-option-btn" id="share-opt-tiktok">
              <iconify-icon icon="ri:tiktok-fill"></iconify-icon> TikTok
            </button>
            <button type="button" class="share-option-btn" id="share-opt-native">
              <iconify-icon icon="ri:share-forward-line"></iconify-icon> Native
            </button>
            <button type="button" class="share-option-btn" id="share-opt-copy">
              <iconify-icon icon="ri:file-copy-line"></iconify-icon> Copy Link
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.classList.remove('active');
    modal.querySelector('.share-modal-overlay').addEventListener('click', closeModal);
    modal.querySelector('#share-modal-close-btn').addEventListener('click', closeModal);
  }

  // Populate dynamic content
  modal.querySelector('#share-preview-title').textContent = title || 'Cineast';
  const urlEl = modal.querySelector('#share-preview-url');
  try {
    const urlObj = new URL(url);
    urlEl.textContent = urlObj.hostname + urlObj.pathname;
  } catch(e) {
    urlEl.textContent = url;
  }
  
  const imgEl = modal.querySelector('#share-preview-img');
  if (image) {
    imgEl.src = image;
  } else {
    // Default fallback image
    imgEl.src = '/assets/images/hero_background.webp';
  }

  // Bind Actions (clean previous bounds)
  const bindAction = (selector, handler) => {
    const btn = modal.querySelector(selector);
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', handler);
  };

  bindAction('#share-opt-x', () => {
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  });

  bindAction('#share-opt-fb', () => {
    const intentUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  });

  bindAction('#share-opt-ig', async () => {
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      await navigator.share({ title, text: title, url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied! Open Instagram to paste and share.');
    }
  });

  bindAction('#share-opt-tiktok', async () => {
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      await navigator.share({ title, text: title, url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied! Open TikTok to paste and share.');
    }
  });

  bindAction('#share-opt-native', async () => {
    if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
      await navigator.share({ title, text: title, url });
    } else {
      showToast('Native share is not supported on this device.');
    }
  });

  bindAction('#share-opt-copy', async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  });

  // Trigger reflow & show
  void modal.offsetWidth;
  modal.classList.add('active');
}

export function showToast(message) {
  let toast = document.querySelector('.cineast-share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cineast-share-toast';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');

  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

export function initCardShareButtons(rootElement = document) {
  const shareButtons = rootElement.querySelectorAll('.card-share-btn');
  shareButtons.forEach(btn => {
    if (btn.dataset.shareBound) return;
    btn.dataset.shareBound = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const title = btn.getAttribute('data-share-title') || 'Cineast';
      let shareUrl = btn.getAttribute('data-share-url');
      const image = btn.getAttribute('data-share-image');

      if (!shareUrl) {
        const anchor = btn.closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href) {
            shareUrl = new URL(href, window.location.origin).href;
          }
        }
      }

      if (!shareUrl) {
        shareUrl = window.location.href;
      }

      openShareModal(title, shareUrl, image);
    });
  });
}
