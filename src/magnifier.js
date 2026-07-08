export function initMagnifier() {
  const wrappers = document.querySelectorAll('.product-image-wrapper');
  if (!wrappers.length) return;

  const overlay = document.getElementById('magnify-overlay');
  const closeBtn = document.getElementById('magnify-close');
  const container = document.getElementById('magnify-container');
  const toaster = document.getElementById('magnify-toaster');
  
  if (!overlay || !container) return;

  // Add icons to products
  wrappers.forEach(wrapper => {
    const icon = document.createElement('div');
    icon.className = 'magnify-icon';
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    wrapper.appendChild(icon);
    
    // When clicking the wrapper (or icon), open magnify
    wrapper.addEventListener('click', (e) => {
      // Prevent opening the cart drawer
      e.preventDefault();
      e.stopPropagation();
      openMagnify(wrapper);
    });
  });

  let isDragging = false;
  let startX, startY;
  let currentTranslateX = -50; 
  let currentTranslateY = -50; 
  let lastX = -50, lastY = -50;
  let toasterTimeout;

  function openMagnify(wrapper) {
    const isBlanco = document.documentElement.getAttribute('data-theme') === 'blanco';
    const activeImg = wrapper.querySelector(isBlanco ? '.img-blanco' : '.img-noir') || wrapper.querySelector('img');
    
    if (!activeImg) return;
    
    container.innerHTML = `<img src="${activeImg.src}" alt="${activeImg.alt}" style="transform: translate(-50%, -50%);" />`;
    
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden'; // lock scroll
    
    // Reset drag state
    currentTranslateX = -50;
    currentTranslateY = -50;
    lastX = -50;
    lastY = -50;
    
    // Reset toaster
    toaster.classList.remove('fade-out');
    clearTimeout(toasterTimeout);
    
    // Fade out toaster after 3 seconds
    toasterTimeout = setTimeout(() => {
      toaster.classList.add('fade-out');
    }, 3000);
  }

  function closeMagnify() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMagnify);

  // Close on clicking outside the image container (but not on drag)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMagnify();
  });

  // Drag Logic
  const imgElement = () => container.querySelector('img');

  function updateTransform() {
    const img = imgElement();
    if (img) {
      img.style.transform = `translate(${currentTranslateX}%, ${currentTranslateY}%)`;
    }
  }

  function onDragStart(e) {
    // Only allow left click dragging
    if (e.type.includes('mouse') && e.button !== 0) return;
    
    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    // Hide toaster on drag immediately
    toaster.classList.add('fade-out');
  }

  function onDragMove(e) {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling on mobile while dragging
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    const img = imgElement();
    if (!img) return;
    
    // Convert pixel delta to percentage of image size to make it scale-agnostic
    const rect = img.getBoundingClientRect();
    const percentDeltaX = (deltaX / rect.width) * 100;
    const percentDeltaY = (deltaY / rect.height) * 100;
    
    currentTranslateX = lastX + percentDeltaX;
    currentTranslateY = lastY + percentDeltaY;
    
    // Keep it relatively bounded
    currentTranslateX = Math.max(Math.min(currentTranslateX, 0), -100);
    currentTranslateY = Math.max(Math.min(currentTranslateY, 0), -100);
    
    updateTransform();
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    lastX = currentTranslateX;
    lastY = currentTranslateY;
  }

  container.addEventListener('mousedown', onDragStart);
  window.addEventListener('mousemove', onDragMove, {passive: false});
  window.addEventListener('mouseup', onDragEnd);
  
  container.addEventListener('touchstart', onDragStart, {passive: true});
  window.addEventListener('touchmove', onDragMove, {passive: false});
  window.addEventListener('touchend', onDragEnd);
}
