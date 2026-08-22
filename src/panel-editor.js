import { updatePage, listPages } from './cms-client.js';
import { showToast } from './admin-panel.js';

let isAdminMode = false;
let isInitialized = false;

/**
 * Selectors matching panels, cards, and section headers that support admin editing.
 */
const PANEL_SELECTORS = [
  '[data-panel-id]',
  '[data-panel]',
  '.road-intro-panel',
  '.soundtrack-panel',
  '.brand-statement',
  '.dedicated-search-section',
  '.now-showing-header',
  '.scene-studies-header',
  '.shop-hero-content',
  '.editorial-block',
  '.product-card',
  '.about-text-column',
  '.about-middle-grid',
  '.recent-stories-intro',
  '.streaming-header',
  '#journal .section-header',
  '.journal-card',
  '#shorts .shorts-header',
  '.shorts-card',
  '.account-panel'
];

/**
 * Text selectors within a panel to make contenteditable.
 */
const EDITABLE_FIELD_SELECTORS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p',
  '.section-title',
  '.section-subtitle',
  '.section-kicker',
  '.brand-headline',
  '.brand-kicker',
  '.brand-body',
  '.road-intro-title',
  '.road-intro-kicker',
  '.road-intro-headline',
  '.road-intro-copy',
  '.soundtrack-title',
  '.soundtrack-kicker',
  '.soundtrack-text',
  '.editorial-headline',
  '.editorial-kicker',
  '.editorial-text',
  '.about-headline',
  '.about-label',
  '.about-description',
  '.about-description-italic',
  '.shop-title',
  '.shop-label',
  '.shop-desc',
  '.shop-desc-italic',
  '.recent-stories-kicker',
  '.streaming-kicker',
  '.streaming-desc',
  '.journal-title',
  '.journal-meta',
  '.card-title',
  '.card-copy',
  '.entry-label',
  '.small-meta',
  '.meta-label',
  '.meta-value-text'
];

/**
 * Find all panel containers on the page.
 */
export function findPanels() {
  const panelElements = [];
  const query = PANEL_SELECTORS.join(', ');
  const matches = document.querySelectorAll(query);

  matches.forEach((el, index) => {
    // Avoid duplicate nested registrations if child is already a panel
    if (el.closest('.panel-edit-toolbar')) return;

    // Ensure element has a panel ID for tracking and persistence
    if (!el.dataset.panelId) {
      const tagOrClass = el.id || el.className.split(' ')[0] || 'panel';
      el.dataset.panelId = `panel-${tagOrClass.replace(/[^a-z0-9_-]/gi, '')}-${index + 1}`;
    }
    panelElements.push(el);
  });

  return panelElements;
}

/**
 * Initialize panel editing engine and event listeners.
 */
export function initPanelEditing() {
  if (isInitialized) return;
  isInitialized = true;

  // Hydrate saved panel text overrides
  hydratePanelOverrides();

  // Listen to global admin status changes
  document.addEventListener('cineast:admin-status', (e) => {
    const isAdmin = Boolean(e.detail && e.detail.isAdmin);
    updateAllPanelsAdminUI(isAdmin);
  });

  // Re-check dynamic panels periodically or on DOM mutations
  const observer = new MutationObserver(() => {
    if (isAdminMode) {
      updateAllPanelsAdminUI(true);
    }
  });

  const mainContainer = document.querySelector('main') || document.body;
  observer.observe(mainContainer, { childList: true, subtree: true });
}

/**
 * Enable or disable edit flags across all panels.
 * @param {boolean} isAdmin 
 */
export function updateAllPanelsAdminUI(isAdmin) {
  isAdminMode = Boolean(isAdmin);
  const panels = findPanels();

  panels.forEach((panel) => {
    if (isAdminMode) {
      panel.classList.add('has-panel-edit-btn');
      ensurePanelEditFlag(panel);
    } else {
      panel.classList.remove('has-panel-edit-btn', 'is-editing-panel');
      removePanelEditFlag(panel);
      cancelPanelEditing(panel);
    }
  });
}

/**
 * Ensure a pen icon edit flag button exists on the panel.
 */
function ensurePanelEditFlag(panel) {
  if (panel.querySelector('.panel-edit-btn') || panel.querySelector('.panel-edit-toolbar')) return;

  const btn = document.createElement('button');
  btn.className = 'panel-edit-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Edit panel text');
  btn.setAttribute('title', 'Click to edit headlines & paragraphs');
  btn.innerHTML = `
    <svg class="pen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
    </svg>
    <span>EDIT PANEL</span>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startPanelEditing(panel);
  });

  panel.appendChild(btn);
}

/**
 * Remove edit flag button from panel.
 */
function removePanelEditFlag(panel) {
  const btn = panel.querySelector('.panel-edit-btn');
  if (btn) btn.remove();
}

/**
 * Start in-place editing of headlines and paragraphs in a panel.
 */

function getEditableFields(panel) {
  const fields = [];
  const query = EDITABLE_FIELD_SELECTORS.join(', ');
  const candidates = panel.querySelectorAll(query);

  candidates.forEach((el) => {
    // Skip controls, inputs, links, buttons, and toolbar elements
    if (
      el.closest('.panel-edit-toolbar') ||
      el.closest('.panel-edit-btn') ||
      el.tagName === 'BUTTON' ||
      el.tagName === 'INPUT' ||
      el.tagName === 'TEXTAREA'
    ) return;

    fields.push(el);
  });

  return fields;
}

function startPanelEditing(panel) {
  if (panel.classList.contains('is-editing-panel')) return;

  const fields = getEditableFields(panel);
  if (!fields.length) {
    showToast('No editable text elements found in this panel.', 'info');
    return;
  }

  panel.classList.add('is-editing-panel');

  // Hide the pen edit button while editing
  const editBtn = panel.querySelector('.panel-edit-btn');
  if (editBtn) editBtn.style.display = 'none';

  // Store initial content and make editable
  fields.forEach((field) => {
    field.dataset.originalHtml = field.innerHTML;
    field.contentEditable = 'true';
    field.setAttribute('spellcheck', 'true');
    field.classList.add('panel-editable-field');
  });

  // Inject floating Save/Cancel toolbar
  let toolbar = panel.querySelector('.panel-edit-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.className = 'panel-edit-toolbar';
    toolbar.innerHTML = `
      <span class="panel-edit-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        EDITING PANEL
      </span>
      <button type="button" class="panel-save-btn">SAVE</button>
      <button type="button" class="panel-cancel-btn">CANCEL</button>
    `;

    toolbar.querySelector('.panel-save-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      savePanelEdits(panel);
    });

    toolbar.querySelector('.panel-cancel-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cancelPanelEditing(panel);
    });

    panel.appendChild(toolbar);
  }
}

/**
 * Save edited panel content to CMS and local storage.
 */
async function savePanelEdits(panel) {
  const panelId = panel.dataset.panelId;
  const fields = getEditableFields(panel);
  const fieldData = [];

  fields.forEach((field, idx) => {
    field.contentEditable = 'false';
    field.classList.remove('panel-editable-field');
    fieldData.push({
      index: idx,
      tag: field.tagName.toLowerCase(),
      className: field.className,
      html: field.innerHTML,
      text: field.textContent
    });
  });

  panel.classList.remove('is-editing-panel');

  const toolbar = panel.querySelector('.panel-edit-toolbar');
  if (toolbar) toolbar.remove();

  const editBtn = panel.querySelector('.panel-edit-btn');
  if (editBtn) editBtn.style.display = '';

  const payload = {
    panelId,
    fields: fieldData,
    updatedAt: new Date().toISOString()
  };

  // Local storage caching for immediate responsiveness
  try {
    localStorage.setItem(`cineast_panel_override_${panelId}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // Persistence to CMS database
  try {
    const slug = `panel-${panelId}`;
    const pagePayload = {
      slug,
      title: `Panel Content: ${panelId}`,
      meta: 'PANEL OVERRIDE',
      summary: JSON.stringify(payload),
      content: JSON.stringify(payload),
      status: 'published'
    };
    await updatePage(slug, pagePayload);
    showToast('Panel headlines and paragraphs saved successfully!', 'success', { title: 'Panel Saved' });
  } catch (err) {
    console.warn('Backend page update failed, saved locally.', err);
    showToast('Panel changes saved to local browser cache.', 'info', { title: 'Saved Locally' });
  }
}

/**
 * Cancel editing and revert to original values.
 */
function cancelPanelEditing(panel) {
  const fields = getEditableFields(panel);

  fields.forEach((field) => {
    if (field.dataset.originalHtml !== undefined) {
      field.innerHTML = field.dataset.originalHtml;
      delete field.dataset.originalHtml;
    }
    field.contentEditable = 'false';
    field.classList.remove('panel-editable-field');
  });

  panel.classList.remove('is-editing-panel');

  const toolbar = panel.querySelector('.panel-edit-toolbar');
  if (toolbar) toolbar.remove();

  const editBtn = panel.querySelector('.panel-edit-btn');
  if (editBtn) editBtn.style.display = '';
}

/**
 * Hydrate saved panel text overrides from local storage and D1 database.
 */
export async function hydratePanelOverrides() {
  const panels = findPanels();

  // 1. Hydrate from Local Storage first
  panels.forEach((panel) => {
    const panelId = panel.dataset.panelId;
    if (!panelId) return;
    try {
      const cached = localStorage.getItem(`cineast_panel_override_${panelId}`);
      if (cached) {
        const payload = JSON.parse(cached);
        applyPanelPayload(panel, payload);
      }
    } catch (e) {}
  });

  // 2. Hydrate from Backend CMS Database
  try {
    const res = await listPages({ limit: 100 });
    const pages = res?.pages || [];
    pages.forEach((page) => {
      if (page.slug && page.slug.startsWith('panel-') && page.summary) {
        try {
          const payload = JSON.parse(page.summary);
          if (payload && payload.panelId) {
            const targetPanel = document.querySelector(`[data-panel-id="${payload.panelId}"]`);
            if (targetPanel) {
              applyPanelPayload(targetPanel, payload);
            }
          }
        } catch (e) {}
      }
    });
  } catch (err) {
    // Non-blocking if CMS network is offline
  }
}

/**
 * Apply saved field HTML/text to matching panel elements.
 */
function applyPanelPayload(panel, payload) {
  if (!payload || !Array.isArray(payload.fields)) return;
  const fields = getEditableFields(panel);

  payload.fields.forEach((savedField) => {
    const field = fields[savedField.index];
    if (field && savedField.html !== undefined) {
      field.innerHTML = savedField.html;
    }
  });
}
