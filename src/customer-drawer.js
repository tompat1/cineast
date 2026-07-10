const CUSTOMER_DRAWER_CONTENT = {
  shipping: {
    meta: 'CUSTOMER / SHIPPING',
    title: 'Shipping',
    kicker: 'FULFILLMENT / PLACEHOLDER',
    body: 'Shipping details will live here once the shop policies are finalized.',
    note: 'Expected content: delivery regions, processing time, tracking, and international shipping notes.'
  },
  returns: {
    meta: 'CUSTOMER / RETURNS',
    title: 'Returns',
    kicker: 'POLICY / PLACEHOLDER',
    body: 'Return and exchange instructions will live here once the policy is finalized.',
    note: 'Expected content: return window, product condition, exchanges, and refund timing.'
  },
  contact: {
    meta: 'CUSTOMER / CONTACT',
    title: 'Contact',
    kicker: 'SUPPORT / PLACEHOLDER',
    body: 'For now, customer questions can go directly to the Cineast inbox.',
    note: 'Email: <a href="mailto:cineast@rynell.org">cineast@rynell.org</a>'
  },
  faq: {
    meta: 'CUSTOMER / FAQ',
    title: 'FAQ',
    kicker: 'ANSWERS / PLACEHOLDER',
    body: 'Frequently asked questions will live here once the shop and membership flows are settled.',
    note: 'Expected content: sizing, limited drops, archive items, accounts, shipping, and returns.'
  }
};

function closeOtherDrawers(customerDrawer) {
  document.querySelectorAll('.journal-drawer.open, .account-drawer.open, .cart-drawer.open').forEach((drawer) => {
    if (drawer !== customerDrawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
  });

  document.getElementById('global-search-panel')?.classList.remove('open');
  document.getElementById('mobile-menu')?.classList.remove('active');
}

export function setupCustomerDrawer() {
  const customerDrawer = document.getElementById('customer-drawer');
  const customerDrawerClose = document.getElementById('customer-drawer-close');
  const customerDrawerMeta = document.getElementById('customer-drawer-meta');
  const customerDrawerContent = document.getElementById('customer-drawer-content');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const triggers = document.querySelectorAll('[data-customer-drawer]');

  if (!customerDrawer || !customerDrawerContent || !triggers.length) return;

  const closeCustomerDrawer = () => {
    customerDrawer.classList.remove('open');
    customerDrawer.setAttribute('aria-hidden', 'true');
    drawerOverlay?.classList.remove('open');
    drawerOverlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const openCustomerDrawer = (type) => {
    const content = CUSTOMER_DRAWER_CONTENT[type] || CUSTOMER_DRAWER_CONTENT.faq;
    closeOtherDrawers(customerDrawer);

    if (customerDrawerMeta) {
      customerDrawerMeta.textContent = content.meta;
    }

    customerDrawerContent.innerHTML = `
      <section class="customer-drawer-panel">
        <div class="customer-drawer-kicker">${content.kicker}</div>
        <h2 class="customer-drawer-title">${content.title}</h2>
        <p class="customer-drawer-body">${content.body}</p>
        <p class="customer-drawer-note">${content.note}</p>
      </section>
    `;

    customerDrawer.classList.add('open');
    customerDrawer.setAttribute('aria-hidden', 'false');
    drawerOverlay?.classList.add('open');
    drawerOverlay?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openCustomerDrawer(trigger.dataset.customerDrawer);
    });
  });

  customerDrawerClose?.addEventListener('click', closeCustomerDrawer);
  drawerOverlay?.addEventListener('click', () => {
    if (customerDrawer.classList.contains('open')) {
      closeCustomerDrawer();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && customerDrawer.classList.contains('open')) {
      closeCustomerDrawer();
    }
  });
}
