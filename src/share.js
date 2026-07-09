/**
 * Cineast Share Helper Module
 */

export async function sharePage(title, url) {
  const shareData = {
    title: title || 'Cineast',
    url: url || window.location.href
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      } else {
        return; // User cancelled, do nothing
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast('Link copied to clipboard');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    // Ultimate fallback: prompt the user
    window.prompt('Copy this link to share:', shareData.url);
  }
}

export function showToast(message) {
  let toast = document.querySelector('.cineast-share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cineast-share-toast';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  // Trigger layout reflow to restart transition if already visible
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');

  // Hide toast after 3 seconds
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }
  toast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Binds click event handlers to all elements with class .card-share-btn.
 * Stops event bubbling so card links don't trigger.
 */
export function initCardShareButtons(rootElement = document) {
  const shareButtons = rootElement.querySelectorAll('.card-share-btn');
  shareButtons.forEach(btn => {
    // Avoid double binding
    if (btn.dataset.shareBound) return;
    btn.dataset.shareBound = 'true';

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const title = btn.getAttribute('data-share-title') || 'Cineast';
      let shareUrl = btn.getAttribute('data-share-url');

      if (!shareUrl) {
        // Fallback to nearest anchor link
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

      await sharePage(title, shareUrl);
    });
  });
}
