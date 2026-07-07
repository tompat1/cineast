-- Migration 0002: Full-Text Search (FTS5) index for pages

-- 1. FTS5 virtual table indexing all searchable columns of 'pages'
CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
  id UNINDEXED,
  slug,
  title,
  meta,
  summary,
  content,
  kind UNINDEXED,
  content='pages',
  content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);

-- 2. Populate FTS table from existing published pages
INSERT INTO pages_fts(rowid, id, slug, title, meta, summary, content, kind)
SELECT rowid, id, slug, title, COALESCE(meta, ''), COALESCE(summary, ''), COALESCE(content, ''), kind
FROM pages
WHERE status = 'published';

-- 3. Trigger: keep FTS in sync on INSERT
CREATE TRIGGER IF NOT EXISTS pages_fts_insert AFTER INSERT ON pages
WHEN NEW.status = 'published'
BEGIN
  INSERT INTO pages_fts(rowid, id, slug, title, meta, summary, content, kind)
  VALUES (NEW.rowid, NEW.id, NEW.slug, NEW.title, COALESCE(NEW.meta, ''), COALESCE(NEW.summary, ''), COALESCE(NEW.content, ''), NEW.kind);
END;

-- 4. Trigger: keep FTS in sync on UPDATE
CREATE TRIGGER IF NOT EXISTS pages_fts_update AFTER UPDATE ON pages
BEGIN
  DELETE FROM pages_fts WHERE rowid = OLD.rowid;
  INSERT INTO pages_fts(rowid, id, slug, title, meta, summary, content, kind)
  VALUES (NEW.rowid, NEW.id, NEW.slug, NEW.title, COALESCE(NEW.meta, ''), COALESCE(NEW.summary, ''), COALESCE(NEW.content, ''), NEW.kind);
END;

-- 5. Trigger: keep FTS in sync on DELETE
CREATE TRIGGER IF NOT EXISTS pages_fts_delete AFTER DELETE ON pages
BEGIN
  DELETE FROM pages_fts WHERE rowid = OLD.rowid;
END;

-- 6. Search warmup cache table (lightweight snapshot of published pages for frontend preloading)
CREATE TABLE IF NOT EXISTS search_warmup_cache (
  key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
