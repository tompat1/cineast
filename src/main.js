import Lenis from 'lenis';

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  autoRaf: true,
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});

// Stop scrolling initially for preloader
lenis.stop();

// Nav Scroll State
const nav = document.getElementById('main-nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('solid');
  } else {
    nav.classList.remove('solid');
  }
});

// Mobile Menu Logic
const openMenuBtn = document.getElementById('open-mobile-menu');
const closeMenuBtn = document.getElementById('close-mobile-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.close-on-click');

if (openMenuBtn && closeMenuBtn && mobileMenu) {
  openMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    lenis.stop();
  });

  closeMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    lenis.start();
  });

  // Close menu when clicking a link
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      lenis.start();
    });
  });
}


// Preloader logic
const imagesToLoad = [
  '/assets/images/cineast_bg1.webp',
  '/assets/images/cineast_bg2.webp',
  '/assets/images/journal_feature.webp',
  '/assets/images/journal_film.webp',
  '/assets/images/journal_room.webp',
  '/assets/images/journal_street.webp'
];

let loadedCount = 0;
const totalImages = imagesToLoad.length;
const progressBar = document.getElementById('loader-progress');
const statusText = document.getElementById('loader-status');
const loadingScreen = document.getElementById('loading-screen');

function updateProgress(src) {
  loadedCount++;
  const percentage = (loadedCount / totalImages) * 100;
  progressBar.style.width = `${percentage}%`;
  
  // Extract filename for display
  const filename = src.split('/').pop();
  statusText.textContent = `Loading: ${filename}`;

  if (loadedCount === totalImages) {
    statusText.textContent = 'Ready.';
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      // allow scroll after loading
      lenis.start();
    }, 800); // Small delay to let the user see 100%
  }
}

// Lock scroll during loading
// (Handled by lenis.stop() at the top)

// Simulate loading or actually load images
imagesToLoad.forEach(src => {
  const img = new Image();
  img.onload = () => updateProgress(src);
  img.onerror = () => updateProgress(src); // Handle error to prevent freezing
  
  // Add a slight artificial delay to make the loader visible for longer 
  // since local loading is almost instant
  setTimeout(() => {
    img.src = src;
  }, Math.random() * 1500 + 500); 
});

