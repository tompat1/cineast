/**
 * Newsfeed Module for CINEAST
 * Renders global movie newsfeed cards matching the reference image layout.
 */

let newsStories = [];

export async function initNewsfeed() {
  const container = document.getElementById("newsfeed-grid");
  if (!container) return;

  try {
    const response = await fetch("/data/newsfeed.json");
    if (response.ok) {
      newsStories = await response.json();
    }
  } catch (err) {
    console.warn("Could not fetch newsfeed JSON, using default stories", err);
  }

  if (!newsStories || newsStories.length === 0) {
    newsStories = getFallbackStories();
  }

  renderStories(container, newsStories);
  setupCategoryFilters(container);
  setupVideoModal();
}

function renderStories(container, stories) {
  if (!container) return;

  if (stories.length === 0) {
    container.innerHTML = `<div class="no-stories" style="color: var(--color-dust-gray); font-family: var(--font-mono); grid-column: 1 / -1; padding: 40px 0;">No stories found for this category.</div>`;
    return;
  }

  container.innerHTML = stories.map(story => createStoryCardHTML(story)).join("");
}

function createStoryCardHTML(story) {
  const isVideo = story.is_video;
  const overlayType = story.overlay_type || (isVideo ? "play" : "badge");
  const badgeText = story.overlay_badge || "";

  let mediaOverlayHTML = "";
  if (overlayType === "question") {
    mediaOverlayHTML = `<div class="story-question-badge">?</div>`;
  } else if (isVideo || overlayType === "play") {
    mediaOverlayHTML = `
      <div class="story-play-overlay">
        <div class="story-play-btn" aria-label="Play Video">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    `;
  }

  let badgeHTML = "";
  if (badgeText) {
    badgeHTML = `<div class="story-badge">${escapeHTML(badgeText)}</div>`;
  }

  const iconURL = story.source_icon || "https://api.iconify.design/ph:film-strip-bold.svg?color=%23ffffff";
  const sourceName = story.source_name || "CINEAST";
  const title = story.title || "";
  const excerpt = story.excerpt || "";
  const link = story.link || "#";

  return `
    <article class="story-card" data-category="${escapeHTML(story.category_slug || 'all')}" data-id="${story.id}">
      <div class="story-media-wrap">
        <img src="${escapeHTML(story.image)}" alt="${escapeHTML(title)}" loading="lazy" />
        <div class="story-media-overlay"></div>
        ${mediaOverlayHTML}
        ${badgeHTML}
      </div>
      <div class="story-body">
        <div class="story-source-row">
          <div class="story-source-icon">
            <img src="${escapeHTML(iconURL)}" alt="${escapeHTML(sourceName)}" />
          </div>
          <span class="story-source-name">${escapeHTML(sourceName)}</span>
        </div>
        <h3 class="story-title">${escapeHTML(title)}</h3>
        <p class="story-excerpt">${escapeHTML(excerpt)}</p>
        <div class="story-footer">
          <a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer" class="story-read-link" ${isVideo && story.video_url ? `data-video="${escapeHTML(story.video_url)}"` : ''}>
            READ STORY
          </a>
        </div>
      </div>
    </article>
  `;
}

function setupCategoryFilters(container) {
  const tabButtons = document.querySelectorAll(".stories-tab-btn");
  if (!tabButtons.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      if (!filter || filter === "all") {
        renderStories(container, newsStories);
      } else {
        const filtered = newsStories.filter(s =>
          (s.category_slug && s.category_slug.toLowerCase() === filter.toLowerCase()) ||
          (s.category && s.category.toLowerCase() === filter.toLowerCase())
        );
        renderStories(container, filtered);
      }
    });
  });
}

function setupVideoModal() {
  let modal = document.querySelector(".story-video-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "story-video-modal";
    modal.innerHTML = `
      <div class="story-video-container">
        <button class="story-modal-close" aria-label="Close Video">&times;</button>
        <iframe id="story-video-iframe" src="" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector(".story-modal-close");
    closeBtn.addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  }

  document.addEventListener("click", (e) => {
    const playTarget = e.target.closest(".story-card");
    if (playTarget) {
      const readLink = playTarget.querySelector(".story-read-link");
      const videoURL = readLink ? readLink.dataset.video : null;
      if (videoURL && (e.target.closest(".story-play-btn") || e.target.closest(".story-media-wrap"))) {
        e.preventDefault();
        openModal(modal, videoURL);
      }
    }
  });
}

function openModal(modal, videoUrl) {
  const iframe = modal.querySelector("#story-video-iframe");
  if (iframe) {
    const autoplayUrl = videoUrl.includes("?") ? `${videoUrl}&autoplay=1` : `${videoUrl}?autoplay=1`;
    iframe.src = autoplayUrl;
  }
  modal.classList.add("active");
}

function closeModal(modal) {
  const iframe = modal.querySelector("#story-video-iframe");
  if (iframe) iframe.src = "";
  modal.classList.remove("active");
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, match => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

function getFallbackStories() {
  return [
    {
      id: "story-001",
      source_name: "AFI",
      source_icon: "https://api.iconify.design/ph:film-strip-bold.svg?color=%23e50914",
      title: "Play Today’s Game #1587",
      excerpt: "Guess this movie image! Track your Get the Picture play and win streaks and challenge yourself with past games.",
      category: "RETROSPECTIVES",
      category_slug: "retrospectives",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
      overlay_type: "question",
      overlay_badge: "Get the Picture",
      link: "https://www.afi.com/",
      is_video: false
    },
    {
      id: "story-002",
      source_name: "DCA Cinema",
      source_icon: "https://api.iconify.design/ph:video-camera-bold.svg?color=%23ffffff",
      title: "Sculpting in Time: Andrei Tarkovsky",
      excerpt: "David Nixon, DCA’s Head of Cinema, shares more about our Andrei Tarkovsky season, taking place throughout August.",
      category: "RETROSPECTIVES",
      category_slug: "retrospectives",
      image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
      overlay_type: "play",
      overlay_badge: "",
      link: "https://www.dca.org.uk/",
      is_video: true,
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    },
    {
      id: "story-003",
      source_name: "MUBI",
      source_icon: "https://api.iconify.design/ph:dots-nine-bold.svg?color=%233b82f6",
      title: "APRIL | Official Trailer | Now Streaming",
      excerpt: "APRIL. Winner of the Venice Special Jury Prize in 2024, Georgian filmmaker Dea Kulumbegashvili (Beginning) gives us a film about the morals and professionalism of Nina, an obstetrician-gynecologist...",
      category: "TRAILERS",
      category_slug: "trailers",
      image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80",
      overlay_type: "play",
      overlay_badge: "OFFICIAL TRAILER",
      link: "https://mubi.com/",
      is_video: true,
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ"
    }
  ];
}
