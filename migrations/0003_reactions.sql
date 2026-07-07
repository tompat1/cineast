CREATE TABLE IF NOT EXISTS page_reactions (
  page_slug TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'heart')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page_slug, user_id, reaction_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_page_reactions_slug ON page_reactions(page_slug);
