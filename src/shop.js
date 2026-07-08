export function initShopFilters() {
  const filterLinks = document.querySelectorAll('.shop-filters .filter-left .filter-link');
  const productCards = document.querySelectorAll('.product-grid .product-card');
  const editorialBlock = document.querySelector('.product-grid .editorial-block');
  const exploreBtn = document.querySelector('.featured-link[data-filter="NEW"]');

  if (!filterLinks.length || !productCards.length) return;

  function applyFilter(filterValue) {
    // Update active class on links
    filterLinks.forEach(link => {
      if (link.getAttribute('data-filter') === filterValue) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Filter products
    productCards.forEach(card => {
      if (filterValue === 'ALL') {
        card.style.display = '';
        return;
      }

      const category = card.getAttribute('data-shop-category');
      const status = card.getAttribute('data-shop-status');

      if (filterValue === 'NEW' && status === 'NEW') {
        card.style.display = '';
      } else if (filterValue === category || filterValue === category + 'S') { // Handle OBJECT vs OBJECTS mismatch if any
        card.style.display = '';
      } else if (filterValue === 'OBJECT' && category === 'OBJECT') {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });

    // Handle Editorial Block
    if (editorialBlock) {
      if (filterValue === 'ALL' || filterValue === 'NEW') {
        editorialBlock.style.display = '';
      } else {
        editorialBlock.style.display = 'none';
      }
    }
  }

  filterLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filterValue = link.getAttribute('data-filter');
      applyFilter(filterValue);
    });
  });

  // Explore button in the hero
  if (exploreBtn) {
    exploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilter('NEW');
      
      // Scroll down to the shop section
      const shopSection = document.getElementById('shop');
      if (shopSection) {
        shopSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
