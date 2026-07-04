import Lenis from 'lenis';

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  autoRaf: true,
  duration: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});

// Stop scrolling initially for preloader
lenis.stop();

// Theme Toggle (Noir / Blanco)
const themeToggleBtn = document.getElementById('theme-toggle');
const rootElement = document.documentElement;
const heroImage = document.querySelector('.hero-image');
const loaderImage = document.querySelector('.loader-bg img');
const brandBgImage = document.querySelector('.brand-bg img');

// Check for saved theme
const savedTheme = localStorage.getItem('theme');

function updateThemeToggleUI(theme) {
  const themeText = themeToggleBtn.querySelector('.theme-text');
  const moonIcon = themeToggleBtn.querySelector('.theme-icon-moon');
  const sunIcon = themeToggleBtn.querySelector('.theme-icon-sun');
  
  // Show the OPPOSITE theme label/icon — indicates what you'll switch TO
  if (themeText) {
    themeText.textContent = theme === 'blanco' ? 'THEME / NOIR' : 'THEME / BLANCO';
  }
  if (moonIcon && sunIcon) {
    // In Blanco → show moon (switch to dark/Noir)
    // In Noir → show sun (switch to light/Blanco)
    moonIcon.style.display = theme === 'blanco' ? 'block' : 'none';
    sunIcon.style.display = theme === 'blanco' ? 'none' : 'block';
  }
}

if (savedTheme) {
  rootElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleUI(savedTheme);
  if (heroImage) {
    heroImage.src = savedTheme === 'blanco' 
      ? '/assets/images/hero_background_blanco.webp' 
      : '/assets/images/hero_background.webp';
  }
  if (loaderImage) {
    loaderImage.src = savedTheme === 'blanco'
      ? '/assets/images/projector_beam_blanco.webp'
      : '/assets/images/projector_beam.webp';
  }
  if (brandBgImage) {
    brandBgImage.src = savedTheme === 'blanco'
      ? '/assets/images/brand_statement_bg_blanco.webp'
      : '/assets/images/brand_statement_bg.webp';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = rootElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'blanco' ? 'noir' : 'blanco';
  
  rootElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleUI(newTheme);
  
  if (heroImage) {
    heroImage.src = newTheme === 'blanco' 
      ? '/assets/images/hero_background_blanco.webp' 
      : '/assets/images/hero_background.webp';
  }
  if (loaderImage) {
    loaderImage.src = newTheme === 'blanco'
      ? '/assets/images/projector_beam_blanco.webp'
      : '/assets/images/projector_beam.webp';
  }
  if (brandBgImage) {
    brandBgImage.src = newTheme === 'blanco'
      ? '/assets/images/brand_statement_bg_blanco.webp'
      : '/assets/images/brand_statement_bg.webp';
  }
});

// Nav Scroll State
const nav = document.getElementById('main-nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.classList.add('solid');
  } else {
    nav.classList.remove('solid');
  }
});

// Back to Top Logic
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  lenis.scrollTo(0, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
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
  '/assets/images/hero_background.webp',
  '/assets/images/hero_background_blanco.webp',
  '/assets/images/hero_background_nero_flash1.webp',
  '/assets/images/hero_background_nero_flash2.webp',
  '/assets/images/hero_background_nero_flash3.webp',
  '/assets/images/hero_background_nero_flash4.webp',
  '/assets/images/projector_beam.webp',
  '/assets/images/projector_beam_blanco.webp',
  '/assets/images/brand_statement_bg.webp',
  '/assets/images/brand_statement_bg_blanco.webp',
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

// Lightning Effect Logic
const lightningFrames = document.querySelectorAll('.lightning-frame');
let lightningTimeout;

function triggerLightning() {
  // Only trigger if in noir theme
  if (document.documentElement.getAttribute('data-theme') === 'blanco') {
    // Check again later
    lightningTimeout = setTimeout(triggerLightning, 2000);
    return;
  }

  const sequence = [
    { frame: 1, duration: 60 },
    { frame: 2, duration: 100 },
    { frame: 3, duration: 250 },
    { frame: 2, duration: 80 },
    { frame: 4, duration: 120 }
  ];

  let delay = 0;
  
  sequence.forEach(step => {
    setTimeout(() => {
      // Hide all
      lightningFrames.forEach(f => f.style.opacity = '0');
      // Show current
      const frameEl = document.getElementById(`lf-${step.frame}`);
      if (frameEl) frameEl.style.opacity = '1';
    }, delay);
    
    delay += step.duration;
  });

  // Reset to dark
  setTimeout(() => {
    lightningFrames.forEach(f => f.style.opacity = '0');
  }, delay + 50);

  // Schedule next strike randomly between 5 and 15 seconds
  const nextTime = Math.random() * 10000 + 5000;
  lightningTimeout = setTimeout(triggerLightning, nextTime);
}

if (lightningFrames.length > 0) {
  lightningTimeout = setTimeout(triggerLightning, 3000);
}

// Live Clock — Hero Metadata Bar
const heroClockEl = document.getElementById('hero-live-clock');
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function updateHeroClock() {
  if (!heroClockEl) return;
  const now = new Date();
  const day = DAYS[now.getDay()];
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, '0');
  heroClockEl.textContent = `${day} ${hh}:${minutes}:${seconds} ${ampm}`;
}

updateHeroClock();
setInterval(updateHeroClock, 1000);

