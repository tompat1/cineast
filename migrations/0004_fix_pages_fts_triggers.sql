-- Migration 0004: Rebuild pages FTS triggers with FTS5-safe external-content updates

DROP TRIGGER IF EXISTS pages_fts_insert;
DROP TRIGGER IF EXISTS pages_fts_update;
DROP TRIGGER IF EXISTS pages_fts_delete;

INSERT INTO pages_fts(pages_fts) VALUES('rebuild');

CREATE TRIGGER IF NOT EXISTS pages_fts_insert AFTER INSERT ON pages
WHEN NEW.status = 'published'
BEGIN
  INSERT INTO pages_fts(rowid, id, slug, title, meta, summary, content, kind)
  VALUES (NEW.rowid, NEW.id, NEW.slug, NEW.title, COALESCE(NEW.meta, ''), COALESCE(NEW.summary, ''), COALESCE(NEW.content, ''), NEW.kind);
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_update AFTER UPDATE ON pages
WHEN OLD.status = 'published'
BEGIN
  INSERT INTO pages_fts(pages_fts, rowid, id, slug, title, meta, summary, content, kind)
  VALUES ('delete', OLD.rowid, OLD.id, OLD.slug, OLD.title, COALESCE(OLD.meta, ''), COALESCE(OLD.summary, ''), COALESCE(OLD.content, ''), OLD.kind);
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_update_published AFTER UPDATE ON pages
WHEN NEW.status = 'published'
BEGIN
  INSERT INTO pages_fts(rowid, id, slug, title, meta, summary, content, kind)
  VALUES (NEW.rowid, NEW.id, NEW.slug, NEW.title, COALESCE(NEW.meta, ''), COALESCE(NEW.summary, ''), COALESCE(NEW.content, ''), NEW.kind);
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_delete AFTER DELETE ON pages
WHEN OLD.status = 'published'
BEGIN
  INSERT INTO pages_fts(pages_fts, rowid, id, slug, title, meta, summary, content, kind)
  VALUES ('delete', OLD.rowid, OLD.id, OLD.slug, OLD.title, COALESCE(OLD.meta, ''), COALESCE(OLD.summary, ''), COALESCE(OLD.content, ''), OLD.kind);
END;
