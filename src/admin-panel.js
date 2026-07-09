import {
  createPage,
  createUser,
  getHealth,
  getAuthSettings,
  deletePage,
  getCurrentUser,
  getPage,
  listUsers,
  listPages,
  login,
  logout,
  updateAuthSettings,
  register,
  updatePage,
  updateUser,
  changePassword
} from './cms-client.js';

import {
  lenis,
  closeDrawer,
  setSharedDrawerOverlay
} from './main.js';

// --- Account / CMS Drawer UI Element Bindings ---
const accountOpenBtn = document.getElementById('open-account-drawer');
const accountOpenMobileBtn = document.getElementById('open-account-mobile');
const accountDrawer = document.getElementById('account-drawer');
const accountDrawerCloseBtn = document.getElementById('account-drawer-close');
const accountAuthPanel = document.getElementById('account-auth-panel');
const accountSessionStateEl = document.getElementById('account-session-state');
const accountSessionNoteEl = document.getElementById('account-session-note');
const accountSessionHintEl = document.getElementById('account-session-hint');
const accountDbStatusEl = document.getElementById('account-db-status');
const accountDbLabelEl = document.getElementById('account-db-label');
const accountUserNameEl = document.getElementById('account-user-name');
const accountUserRoleEl = document.getElementById('account-user-role');
const accountLogoutBtn = document.getElementById('account-logout-btn');
const accountScrollLoginBtn = document.getElementById('account-scroll-login');
const accountScrollRegisterBtn = document.getElementById('account-scroll-register');
const accountLoginForm = document.getElementById('account-login-form');
const accountRegisterForm = document.getElementById('account-register-form');
const accountChangePasswordPanel = document.getElementById('account-change-password-panel');
const accountChangePasswordForm = document.getElementById('account-change-password-form');
const accountAuthTabs = document.querySelectorAll('.auth-tab');
const cmsAdminPanel = document.getElementById('cms-admin-panel');
const invitePolicyStateEl = document.getElementById('invite-policy-state');
const invitePolicyNoteEl = document.getElementById('invite-policy-note');
const invitePolicyToggleBtn = document.getElementById('invite-policy-toggle');
const accountCreateUserForm = document.getElementById('account-create-user-form');
const adminUserResults = document.getElementById('admin-user-results');
const cmsPageSearchInput = document.getElementById('cms-page-search-input');
const cmsPageSearchBtn = document.getElementById('cms-page-search-btn');
const cmsPageRefreshBtn = document.getElementById('cms-page-refresh-btn');
const cmsPageNewBtn = document.getElementById('cms-page-new-btn');
const cmsPageStatusFilterButtons = document.querySelectorAll('[data-page-status-filter]');
const cmsPageResults = document.getElementById('cms-page-results');
const cmsPageEditorForm = document.getElementById('cms-page-editor-form');
const cmsEditorStatus = document.getElementById('cms-editor-status');
const cmsEditorHint = document.getElementById('cms-editor-hint');
const cmsPageIdInput = document.getElementById('cms-page-id');
const cmsPageSlugInput = document.getElementById('cms-page-slug');
const cmsPageTitleInput = document.getElementById('cms-page-title');
const cmsPageMetaInput = document.getElementById('cms-page-meta');
const cmsPageSummaryInput = document.getElementById('cms-page-summary');
const cmsPageHeroInput = document.getElementById('cms-page-hero');
const cmsPageKindInput = document.getElementById('cms-page-kind');
const cmsPageStatusInput = document.getElementById('cms-page-status');
const cmsPageContentInput = document.getElementById('cms-page-content');
const cmsPageResetBtn = document.getElementById('cms-page-reset-btn');
const cmsPageDeleteBtn = document.getElementById('cms-page-delete-btn');
const cmsPageSaveBtn = document.getElementById('cms-page-save-btn');
const cmsEditorEmptyState = 'No page selected yet.';

export let currentAccountUser = null;
let currentCmsPage = null;
let currentCmsPages = [];
let currentAuthTab = 'login';
let cmsPageSearchTerm = '';
let cmsPageStatusFilter = 'all';
let inviteOnlyMode = false;
let adminUsers = [];
let toastStackEl = null;

function setAccountSessionCopy(message) {
  if (accountSessionNoteEl) {
    accountSessionNoteEl.textContent = message;
  }
}

function setDatabaseStatus(online, label, tone = 'online') {
  if (accountDbStatusEl) {
    accountDbStatusEl.classList.toggle('is-online', Boolean(online));
    accountDbStatusEl.classList.toggle('is-offline', !online);
    accountDbStatusEl.classList.toggle('is-checking', tone === 'checking');
    accountDbStatusEl.setAttribute(
      'aria-label',
      online ? 'Database connected' : (tone === 'checking' ? 'Checking database connection' : 'Database offline')
    );
  }
  if (accountDbLabelEl) {
    accountDbLabelEl.textContent = label;
  }
}

function setScraperStatus(scraperId, online, label, tone = 'online') {
  const statusEl = document.getElementById(`scraper-${scraperId}-status`);
  const labelEl = document.getElementById(`scraper-${scraperId}-label`);
  if (statusEl) {
    statusEl.classList.toggle('is-online', Boolean(online));
    statusEl.classList.toggle('is-offline', !online);
    statusEl.classList.toggle('is-checking', tone === 'checking');
    statusEl.setAttribute(
      'aria-label',
      online ? `${scraperId.toUpperCase()} connected` : (tone === 'checking' ? `Checking ${scraperId.toUpperCase()} connection` : `${scraperId.toUpperCase()} offline`)
    );
  }
  if (labelEl) {
    labelEl.textContent = label;
  }
}

function ensureToastStack() {
  if (toastStackEl) return toastStackEl;

  toastStackEl = document.createElement('div');
  toastStackEl.className = 'toast-stack';
  toastStackEl.setAttribute('aria-live', 'polite');
  toastStackEl.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toastStackEl);
  return toastStackEl;
}

export function showToast(message, tone = 'info', { title = '', duration = 4200 } = {}) {
  const text = String(message || '').trim();
  if (!text) return;

  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`;
  toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');

  const header = document.createElement('div');
  header.className = 'toast-header';

  const badge = document.createElement('span');
  badge.className = 'toast-badge';
  badge.textContent = (title || tone).toUpperCase();

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '×';

  const body = document.createElement('div');
  body.className = 'toast-message';
  body.textContent = text;

  let dismissTimer = null;
  const dismiss = () => {
    if (toast.dataset.dismissed === 'true') return;
    toast.dataset.dismissed = 'true';
    window.clearTimeout(dismissTimer);
    toast.classList.add('closing');
    window.setTimeout(() => toast.remove(), 180);
  };

  closeBtn.addEventListener('click', dismiss);

  header.append(badge, closeBtn);
  toast.append(header, body);
  stack.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  dismissTimer = window.setTimeout(dismiss, duration);
  return dismiss;
}

function renderInvitePolicyState(isInviteOnly) {
  inviteOnlyMode = Boolean(isInviteOnly);

  if (invitePolicyStateEl) {
    invitePolicyStateEl.textContent = inviteOnlyMode ? 'INVITE ONLY' : 'OPEN REGISTRATION';
  }

  if (invitePolicyNoteEl) {
    invitePolicyNoteEl.textContent = inviteOnlyMode
      ? 'Registration is closed. Admins create member accounts from this panel.'
      : 'Keep registration open for self-service signups, or switch to invite-only and create members manually from this panel.';
  }

  if (invitePolicyToggleBtn) {
    invitePolicyToggleBtn.textContent = inviteOnlyMode ? 'ALLOW OPEN REGISTRATION' : 'TOGGLE INVITE ONLY';
  }

  const registerTab = document.querySelector('.auth-tab[data-auth-tab="register"]');
  if (registerTab) {
    registerTab.hidden = inviteOnlyMode;
  }

  if (accountRegisterForm) {
    accountRegisterForm.hidden = inviteOnlyMode;
  }

  if (accountScrollRegisterBtn) {
    accountScrollRegisterBtn.hidden = inviteOnlyMode || Boolean(currentAccountUser);
  }

  if (inviteOnlyMode && currentAuthTab === 'register') {
    setActiveAuthTab('login');
  }
}

function setActiveAuthTab(tab) {
  currentAuthTab = tab === 'register' && !inviteOnlyMode ? 'register' : 'login';
  accountAuthTabs.forEach((button) => {
    const isRegisterButton = button.dataset.authTab === 'register';
    const isActive = button.dataset.authTab === currentAuthTab;
    button.classList.toggle('active', isActive);
    if (isRegisterButton) {
      button.hidden = inviteOnlyMode;
    }
  });
  if (accountLoginForm) {
    accountLoginForm.classList.toggle('active', currentAuthTab === 'login');
  }
  if (accountRegisterForm) {
    accountRegisterForm.classList.toggle('active', currentAuthTab === 'register' && !inviteOnlyMode);
  }
}

function renderAccountState(user) {
  currentAccountUser = user || null;
  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === 'admin';
  const accountLabel = isLoggedIn
    ? `Account, signed in as ${user?.username || 'user'}`
    : 'Account';

  if (accountSessionStateEl) {
    accountSessionStateEl.textContent = isLoggedIn ? 'ACTIVE SESSION' : 'SIGNED OUT';
    accountSessionStateEl.classList.toggle('is-active', isLoggedIn);
    accountSessionStateEl.classList.toggle('is-signed-out', !isLoggedIn);
    accountSessionStateEl.setAttribute('aria-label', isLoggedIn ? 'Current session active' : 'No active session');
  }
  if (accountUserNameEl) {
    accountUserNameEl.textContent = user?.username || 'Guest';
  }
  if (accountUserRoleEl) {
    accountUserRoleEl.textContent = user?.role || 'member';
    accountUserRoleEl.classList.toggle('admin', isAdmin);
  }
  if (accountLogoutBtn) {
    accountLogoutBtn.hidden = !isLoggedIn;
  }
  if (accountScrollLoginBtn) {
    accountScrollLoginBtn.hidden = isLoggedIn;
  }
  if (accountScrollRegisterBtn) {
    accountScrollRegisterBtn.hidden = isLoggedIn || inviteOnlyMode;
  }
  if (accountAuthPanel) {
    accountAuthPanel.hidden = isLoggedIn;
  }
  if (accountChangePasswordPanel) {
    accountChangePasswordPanel.hidden = !isLoggedIn;
  }
  if (cmsAdminPanel) {
    cmsAdminPanel.hidden = !isAdmin;
  }
  if (accountOpenBtn) {
    accountOpenBtn.classList.toggle('is-authenticated', isLoggedIn);
    accountOpenBtn.setAttribute('aria-label', accountLabel);
    accountOpenBtn.setAttribute('title', accountLabel);
  }
  if (accountOpenMobileBtn) {
    accountOpenMobileBtn.classList.toggle('is-authenticated', isLoggedIn);
    accountOpenMobileBtn.setAttribute('aria-label', accountLabel);
  }

  if (isLoggedIn) {
    if (accountSessionHintEl) {
      accountSessionHintEl.textContent = isAdmin
        ? 'Admin sessions can edit pages directly from the page view. Log out to end this browser session.'
        : 'Member sessions can read published pages. Log out to end this browser session.';
    }
    setAccountSessionCopy(isAdmin
      ? 'Admin access is active. Navigate to a page or article and use its edit toggle to update content.'
      : 'Member access is active. Published pages are readable; CMS editing stays locked.');
  } else {
    if (accountSessionHintEl) {
      accountSessionHintEl.textContent = 'No active session yet.';
    }
    setAccountSessionCopy(inviteOnlyMode
      ? 'Registration is invite-only. Ask an admin for an account.'
      : 'Sign in or create a member account to read published pages and access the CMS tools.');
  }

  // Update Now Showing admin edit controls
  import('./now-showing.js').then((m) => {
    m.updateNowShowingAdminUI(isAdmin);
  }).catch((err) => {
    console.warn('Failed to load now-showing module', err);
  });

  // Update Scene Studies admin edit controls
  import('./main.js').then((m) => {
    m.updateSceneStudiesAdminUI(isAdmin);
  }).catch((err) => {
    console.warn('Failed to load main module', err);
  });
}

async function refreshDatabaseStatus() {
  if (!accountDbStatusEl && !accountDbLabelEl) return null;

  setDatabaseStatus(false, 'Checking', 'checking');
  setScraperStatus('tmdb', false, 'Checking', 'checking');
  setScraperStatus('tvdb', false, 'Checking', 'checking');
  setScraperStatus('itunes', false, 'Checking', 'checking');

  try {
    const health = await getHealth();
    const online = Boolean(health?.db ?? health?.ok);
    setDatabaseStatus(online, online ? 'Connected' : 'Offline', online ? 'online' : 'offline');

    const scrapers = health?.scrapers || {};
    setScraperStatus('tmdb', Boolean(scrapers.tmdb), scrapers.tmdb ? 'Connected' : 'Offline', scrapers.tmdb ? 'online' : 'offline');
    setScraperStatus('tvdb', Boolean(scrapers.tvdb), scrapers.tvdb ? 'Connected' : 'Offline', scrapers.tvdb ? 'online' : 'offline');
    setScraperStatus('itunes', Boolean(scrapers.itunes), scrapers.itunes ? 'Connected' : 'Offline', scrapers.itunes ? 'online' : 'offline');

    return online;
  } catch (error) {
    console.warn('Database health check failed.', error);
    setDatabaseStatus(false, 'Offline', 'offline');
    setScraperStatus('tmdb', false, 'Offline', 'offline');
    setScraperStatus('tvdb', false, 'Offline', 'offline');
    setScraperStatus('itunes', false, 'Offline', 'offline');
    return false;
  }
}

function getCmsEditorPayload() {
  return {
    slug: cmsPageSlugInput?.value.trim() || '',
    title: cmsPageTitleInput?.value.trim() || '',
    meta: cmsPageMetaInput?.value.trim() || '',
    summary: cmsPageSummaryInput?.value.trim() || '',
    hero_image: cmsPageHeroInput?.value.trim() || '',
    kind: cmsPageKindInput?.value || 'page',
    status: cmsPageStatusInput?.value || 'draft',
    content: cmsPageContentInput?.value.trim() || ''
  };
}

function setCmsEditorMessage(message) {
  if (cmsEditorStatus) {
    cmsEditorStatus.textContent = message;
  }
}

function setCmsEditorHint(message) {
  if (cmsEditorHint) {
    cmsEditorHint.textContent = message;
  }
}

function clearCmsEditor() {
  currentCmsPage = null;
  if (cmsPageIdInput) cmsPageIdInput.value = '';
  if (cmsPageSlugInput) cmsPageSlugInput.value = '';
  if (cmsPageTitleInput) cmsPageTitleInput.value = '';
  if (cmsPageMetaInput) cmsPageMetaInput.value = '';
  if (cmsPageSummaryInput) cmsPageSummaryInput.value = '';
  if (cmsPageHeroInput) cmsPageHeroInput.value = '';
  if (cmsPageKindInput) cmsPageKindInput.value = 'page';
  if (cmsPageStatusInput) cmsPageStatusInput.value = 'draft';
  if (cmsPageContentInput) cmsPageContentInput.value = '';
  setCmsEditorMessage(cmsEditorEmptyState);
  setCmsEditorHint('Pick a page from search results or create a fresh one.');
  if (cmsPageSaveBtn) cmsPageSaveBtn.textContent = 'SAVE PAGE';
  if (cmsPageDeleteBtn) cmsPageDeleteBtn.disabled = true;
}

function populateCmsEditor(page) {
  currentCmsPage = page || null;
  if (!page) {
    clearCmsEditor();
    return;
  }

  if (cmsPageIdInput) cmsPageIdInput.value = page.id || '';
  if (cmsPageSlugInput) cmsPageSlugInput.value = page.slug || '';
  if (cmsPageTitleInput) cmsPageTitleInput.value = page.title || '';
  if (cmsPageMetaInput) cmsPageMetaInput.value = page.meta || '';
  if (cmsPageSummaryInput) cmsPageSummaryInput.value = page.summary || '';
  if (cmsPageHeroInput) cmsPageHeroInput.value = page.hero_image || '';
  if (cmsPageKindInput) cmsPageKindInput.value = page.kind || 'page';
  if (cmsPageStatusInput) cmsPageStatusInput.value = page.status || 'draft';
  if (cmsPageContentInput) cmsPageContentInput.value = page.content || '';
  setCmsEditorMessage(`${page.kind || 'page'} / ${page.status || 'draft'} / ${page.slug || page.id}`);
  setCmsEditorHint(`Updated ${page.updated_at || page.created_at || 'recently'}.`);
  if (cmsPageSaveBtn) cmsPageSaveBtn.textContent = page.id ? 'UPDATE PAGE' : 'SAVE PAGE';
  if (cmsPageDeleteBtn) cmsPageDeleteBtn.disabled = false;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCmsPageResults(pages) {
  currentCmsPages = pages || [];
  if (!cmsPageResults) return;

  if (!currentCmsPages.length) {
    cmsPageResults.innerHTML = '<div class="cms-search-empty">No matching pages found.</div>';
    return;
  }

  cmsPageResults.innerHTML = currentCmsPages.map((page) => {
    const isActive = currentCmsPage && (currentCmsPage.id === page.id || currentCmsPage.slug === page.slug);
    return `
      <button type="button" class="cms-search-result ${isActive ? 'active' : ''}" data-page-key="${escapeHtml(page.id || page.slug)}">
        <span class="cms-search-result-title">${escapeHtml(page.title || 'Untitled page')}</span>
        <span class="cms-search-result-meta">${escapeHtml(page.kind || 'page')} / ${escapeHtml(page.status || 'draft')} / ${escapeHtml(page.slug || page.id || '')}</span>
      </button>
    `;
  }).join('');
}

function renderCmsPageStatusFilterState(status) {
  cmsPageStatusFilter = ['all', 'published', 'draft'].includes(status) ? status : 'all';
  cmsPageStatusFilterButtons.forEach((button) => {
    const isActive = button.dataset.pageStatusFilter === cmsPageStatusFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function renderAdminUsers(users) {
  adminUsers = users || [];
  if (!adminUserResults) return;

  if (!adminUsers.length) {
    adminUserResults.innerHTML = '<div class="cms-search-empty">No users found.</div>';
    return;
  }

  adminUserResults.innerHTML = adminUsers.map((user) => `
    <div class="cms-search-result" style="cursor: default; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
      <div>
        <span class="cms-search-result-title" style="display: block;">${escapeHtml(user.username || 'Unnamed user')}</span>
        <span class="cms-search-result-meta">${escapeHtml(user.role || 'member')} / ${escapeHtml(user.created_at || '')}</span>
      </div>
      <button type="button" class="cms-action-btn" data-action="reset-pwd" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}" style="font-family: var(--font-mono); font-size: 0.55rem; padding: 4px 8px; border: 1px solid rgba(242,238,232,0.16); background: transparent; color: var(--color-screen-cream); cursor: pointer; transition: all 0.2s; white-space: nowrap;">
        RESET PASSWORD
      </button>
    </div>
  `).join('');

  adminUserResults.querySelectorAll('button[data-action="reset-pwd"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.getAttribute('data-user-id');
      const username = btn.getAttribute('data-username');
      const newPassword = prompt(`Enter new password for ${username} (8+ characters):`);
      if (newPassword === null) return; // User cancelled prompt

      const trimmed = newPassword.trim();
      if (trimmed.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'RESETTING...';
      try {
        await updateUser(userId, { password: trimmed });
        showToast(`Password successfully reset for ${username}.`, 'success', { title: 'Reset successful' });
      } catch (err) {
        showToast(err.message || 'Failed to reset password.', 'error', { title: 'Reset failed' });
      } finally {
        btn.disabled = false;
        btn.textContent = 'RESET PASSWORD';
      }
    });
  });
}

async function loadAdminUsers() {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  try {
    const response = await listUsers();
    renderAdminUsers(response.users || []);
  } catch (error) {
    console.error('Failed to load users', error);
    if (adminUserResults) {
      adminUserResults.innerHTML = `<div class="cms-search-empty">${escapeHtml(error.message || 'Unable to load users.')}</div>`;
    }
  }
}

async function loadCmsPages(query = cmsPageSearchTerm, status = cmsPageStatusFilter) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;

  cmsPageSearchTerm = query;
  cmsPageStatusFilter = ['all', 'published', 'draft'].includes(status) ? status : 'all';

  try {
    const response = query
      ? await searchPages(query, { includeDrafts: true, limit: 12, status: cmsPageStatusFilter })
      : await listPages({ includeDrafts: true, limit: 12, status: cmsPageStatusFilter });

    const pages = response.pages || response.results || [];
    renderCmsPageResults(pages);
    const statusLabel = cmsPageStatusFilter === 'all' ? 'all pages' : `${cmsPageStatusFilter} pages`;
    setCmsEditorHint(query ? `Search results for "${query}" in ${statusLabel}.` : `Recent ${statusLabel} loaded.`);
  } catch (error) {
    console.error('Failed to load CMS pages', error);
    if (cmsPageResults) {
      cmsPageResults.innerHTML = `<div class="cms-search-empty">${escapeHtml(error.message || 'Unable to load pages.')}</div>`;
    }
  }
}

export async function refreshAccountSession() {
  try {
    const response = await getCurrentUser();
    renderAccountState(response.user);
    if (response.user?.role === 'admin') {
      await loadCmsPages(cmsPageSearchTerm);
      await loadAdminUsers();
      if (!currentCmsPage) {
        clearCmsEditor();
      }
    }
    return response.user || null;
  } catch (error) {
    renderAccountState(null);
    if (cmsPageResults) cmsPageResults.innerHTML = '';
    clearCmsEditor();
    return null;
  }
}

export async function refreshAuthSettings() {
  try {
    const settings = await getAuthSettings();
    renderInvitePolicyState(settings.invite_only);
    renderAccountState(currentAccountUser);
  } catch (error) {
    console.warn('Failed to load auth settings, defaulting to open registration.', error);
    renderInvitePolicyState(false);
  }
}

export function openAccountDrawer() {
  closeDrawer();
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.classList.remove('active');
  }
  if (accountDrawer) {
    accountDrawer.classList.add('open');
    accountDrawer.setAttribute('aria-hidden', 'false');
  }
  setSharedDrawerOverlay(true);
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();
  refreshAuthSettings();
  refreshAccountSession();
  refreshDatabaseStatus();
}

export function closeAccountDrawer() {
  if (accountDrawer) {
    accountDrawer.classList.remove('open');
    accountDrawer.setAttribute('aria-hidden', 'true');
  }
  const journalDrawer = document.getElementById('journal-drawer');
  if (!journalDrawer?.classList.contains('open')) {
    setSharedDrawerOverlay(false);
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
}

async function handleAccountLoginSubmit(event) {
  event.preventDefault();
  if (!accountLoginForm) return;

  const formData = new FormData(accountLoginForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    const response = await login(username, password);
    renderAccountState(response.user);
    setActiveAuthTab('login');
    accountLoginForm.reset();
    await loadCmsPages();
    if (response.user?.role === 'admin') {
      clearCmsEditor();
    }
    showToast(`Welcome back, ${response.user?.username || username}.`, 'success', { title: 'Signed in' });
  } catch (error) {
    showToast(error.message || 'Login failed.', 'error', { title: 'Sign in failed' });
  }
}

async function handleAccountRegisterSubmit(event) {
  event.preventDefault();
  if (!accountRegisterForm) return;

  const formData = new FormData(accountRegisterForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');

  try {
    const response = await register(username, password);
    renderAccountState(response.user);
    setActiveAuthTab('login');
    accountRegisterForm.reset();
    await loadCmsPages();
    showToast(`Account created for ${response.user?.username || username}.`, 'success', { title: 'Account ready' });
  } catch (error) {
    showToast(error.message || 'Registration failed.', 'error', { title: 'Create account failed' });
  }
}

async function handleAccountLogout() {
  try {
    await logout();
  } catch (error) {
    console.warn('Logout request failed, clearing local state anyway.', error);
  } finally {
    renderAccountState(null);
    clearCmsEditor();
    if (cmsPageResults) cmsPageResults.innerHTML = '';
    closeAccountDrawer();
    showToast('You have been signed out.', 'success', { title: 'Logged out' });
  }
}

async function handleInvitePolicyToggle() {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  try {
    const response = await updateAuthSettings({ invite_only: !inviteOnlyMode });
    renderInvitePolicyState(response.invite_only);
    showToast(
      response.invite_only ? 'Registration is now invite-only.' : 'Open registration is now enabled.',
      'success',
      { title: 'Access policy updated' }
    );
  } catch (error) {
    showToast(error.message || 'Unable to update access policy.', 'error', { title: 'Policy update failed' });
  }
}

async function handleAdminCreateUser(event) {
  event.preventDefault();
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  if (!accountCreateUserForm) return;

  const formData = new FormData(accountCreateUserForm);
  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '');
  const role = String(formData.get('role') || 'member').trim();

  try {
    await createUser({ username, password, role });
    accountCreateUserForm.reset();
    await loadAdminUsers();
    showToast(`User "${username}" created.`, 'success', { title: 'User added' });
  } catch (error) {
    showToast(error.message || 'Unable to create user.', 'error', { title: 'Create user failed' });
  }
}

async function handleAccountChangePasswordSubmit(e) {
  e.preventDefault();
  if (!currentAccountUser || !accountChangePasswordForm) return;

  const formData = new FormData(accountChangePasswordForm);
  const currentPassword = String(formData.get('currentPassword') || '');
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (newPassword !== confirmPassword) {
    alert('New passwords do not match.');
    return;
  }

  const submitBtn = accountChangePasswordForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'UPDATING...';
  }

  try {
    await changePassword(currentPassword, newPassword);
    accountChangePasswordForm.reset();
    showToast('Your password has been updated.', 'success', { title: 'Password changed' });
  } catch (error) {
    showToast(error.message || 'Unable to update password.', 'error', { title: 'Update failed' });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'UPDATE PASSWORD';
    }
  }
}

async function handleCmsPageSearch(query) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  await loadCmsPages(query, cmsPageStatusFilter);
}

async function handleCmsPageStatusFilterChange(status) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  renderCmsPageStatusFilterState(status);
  const query = String(cmsPageSearchInput?.value || '').trim();
  await loadCmsPages(query, cmsPageStatusFilter);
}

async function handleCmsPageSelection(pageKey) {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  try {
    const response = await getPage(pageKey);
    populateCmsEditor(response.page);
    setCmsEditorHint(`Loaded ${response.page.title || response.page.slug || pageKey}.`);
  } catch (error) {
    setCmsEditorHint(error.message || 'Unable to load page.');
  }
}

async function handleCmsPageSave(event) {
  event.preventDefault();
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;

  const payload = getCmsEditorPayload();
  if (!payload.title || !payload.content) {
    setCmsEditorHint('Title and content are required.');
    return;
  }

  try {
    const targetKey = currentCmsPage?.id || currentCmsPage?.slug;
    const response = targetKey
      ? await updatePage(targetKey, payload)
      : await createPage(payload);

    const page = response.page;
    populateCmsEditor(page);
    await loadCmsPages(cmsPageSearchTerm);
    setCmsEditorHint(`Saved ${page.title || page.slug || 'page'}.`);
    showToast(`Saved ${page.title || page.slug || 'page'}.`, 'success', { title: 'Page saved' });
  } catch (error) {
    setCmsEditorHint(error.message || 'Unable to save page.');
    showToast(error.message || 'Unable to save page.', 'error', { title: 'Save failed' });
  }
}

async function handleCmsPageDelete() {
  if (!currentAccountUser || currentAccountUser.role !== 'admin') return;
  if (!currentCmsPage?.id && !currentCmsPage?.slug) {
    setCmsEditorHint('Select a page before deleting.');
    return;
  }

  const confirmed = window.confirm(`Delete "${currentCmsPage.title || currentCmsPage.slug}"?`);
  if (!confirmed) return;

  try {
    await deletePage(currentCmsPage.id || currentCmsPage.slug);
    clearCmsEditor();
    await loadCmsPages(cmsPageSearchTerm);
    setCmsEditorHint('Page deleted.');
    showToast('Page deleted.', 'success', { title: 'Page removed' });
  } catch (error) {
    setCmsEditorHint(error.message || 'Unable to delete page.');
    showToast(error.message || 'Unable to delete page.', 'error', { title: 'Delete failed' });
  }
}

export function setupAccountDrawer() {
  accountOpenBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openAccountDrawer();
  });

  accountOpenMobileBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    openAccountDrawer();
  });

  accountDrawerCloseBtn?.addEventListener('click', closeAccountDrawer);

  accountAuthTabs.forEach((button) => {
    button.addEventListener('click', () => setActiveAuthTab(button.dataset.authTab));
  });

  accountScrollLoginBtn?.addEventListener('click', () => setActiveAuthTab('login'));
  accountScrollRegisterBtn?.addEventListener('click', () => setActiveAuthTab('register'));
  accountLoginForm?.addEventListener('submit', handleAccountLoginSubmit);
  accountRegisterForm?.addEventListener('submit', handleAccountRegisterSubmit);
  accountLogoutBtn?.addEventListener('click', handleAccountLogout);
  invitePolicyToggleBtn?.addEventListener('click', handleInvitePolicyToggle);
  accountCreateUserForm?.addEventListener('submit', handleAdminCreateUser);
  accountChangePasswordForm?.addEventListener('submit', handleAccountChangePasswordSubmit);

  cmsPageStatusFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const status = button.dataset.pageStatusFilter || 'all';
      handleCmsPageStatusFilterChange(status);
    });
  });

  cmsPageSearchBtn?.addEventListener('click', () => {
    const query = String(cmsPageSearchInput?.value || '').trim();
    handleCmsPageSearch(query);
  });

  cmsPageRefreshBtn?.addEventListener('click', () => {
    const query = String(cmsPageSearchInput?.value || '').trim();
    handleCmsPageSearch(query);
  });

  cmsPageNewBtn?.addEventListener('click', () => {
    clearCmsEditor();
    setCmsEditorHint('New draft ready.');
  });

  cmsPageResults?.addEventListener('click', (event) => {
    const button = event.target.closest('.cms-search-result');
    if (!button) return;
    const pageKey = button.getAttribute('data-page-key');
    if (pageKey) {
      handleCmsPageSelection(pageKey);
    }
  });

  cmsPageEditorForm?.addEventListener('submit', handleCmsPageSave);
  cmsPageResetBtn?.addEventListener('click', () => {
    if (currentCmsPage) {
      populateCmsEditor(currentCmsPage);
    } else {
      clearCmsEditor();
    }
  });
  cmsPageDeleteBtn?.addEventListener('click', handleCmsPageDelete);

  setActiveAuthTab(currentAuthTab);
  renderCmsPageStatusFilterState(cmsPageStatusFilter);
  renderInvitePolicyState(false);
  renderAccountState(null);
  clearCmsEditor();
  refreshAuthSettings();
}
