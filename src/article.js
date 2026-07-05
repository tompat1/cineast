// article.js

function parseMarkdown(text) {
  let html = text;
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italics
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    const inner = p.replace(/\n/g, '<br>');
    return `<p>${inner}</p>`;
  }).join('');
  
  return html;
}

async function loadArticle() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (!id) {
    document.getElementById('article-title').textContent = "Article Not Found";
    return;
  }

  try {
    const response = await fetch('/data/journal.json?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    const entries = await response.json();
    
    const article = entries.find(e => e.id === id);
    if (!article) {
      document.getElementById('article-title').textContent = "Article Not Found";
      return;
    }

    // Update DOM
    document.title = `${article.title} — CINEAST Journal`;
    document.getElementById('article-label').textContent = `JOURNAL ENTRY ${article.id}`;
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-meta').textContent = article.meta;
    document.getElementById('article-image').src = article.image;
    document.getElementById('article-content').innerHTML = parseMarkdown(article.content);

    // Dynamic Related Articles
    const relatedList = document.getElementById('related-articles-list');
    if (relatedList) {
      const related = entries.filter(e => e.id !== id);
      relatedList.innerHTML = related.map(rel => `
        <a href="/article.html?id=${rel.id}" class="related-article-card">
          <div class="related-article-thumb">
            <img src="${rel.image}" alt="${rel.title}">
          </div>
          <div class="related-article-info">
            <div class="related-article-date">${rel.date || 'MAY 28, 2024'}</div>
            <h4 class="related-article-title">${rel.title}</h4>
            <p class="related-article-preamble">${rel.preamble || ''}</p>
          </div>
        </a>
      `).join('');
    }

  } catch (error) {
    console.error('Error loading article:', error);
    document.getElementById('article-title').textContent = "Error Loading Article";
  }
}

// Theme handling (copied from main.js)
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeMenu = document.getElementById('theme-menu');
  const html = document.documentElement;

  if (themeToggle && themeMenu) {
    themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      themeMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      themeMenu.classList.remove('active');
    });

    const themeButtons = themeMenu.querySelectorAll('.theme-dropdown-item');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.themeValue;
        
        // Update DOM
        if (value === 'system') {
          html.removeAttribute('data-theme');
        } else {
          html.setAttribute('data-theme', value);
        }
        
        // Update toggle text
        const textSpan = themeToggle.querySelector('.theme-text');
        if (textSpan) {
          textSpan.textContent = `FILM - ${value.toUpperCase()}`;
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadArticle();
  initTheme();

  // Nav scroll behavior
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('solid');
      } else {
        nav.classList.remove('solid');
      }
    });
  }
});
