import fs from 'fs';

const journalData = JSON.parse(fs.readFileSync('public/data/journal.json', 'utf8'));
const articlesData = JSON.parse(fs.readFileSync('public/data/articles.json', 'utf8'));

const rawCombined = [];
journalData.forEach(item => rawCombined.push({ ...item, platform: 'journal' }));
articlesData.forEach(item => rawCombined.push({ ...item }));

function deduplicateArticles(list) {
  const seenKeys = new Set();
  const seenTitles = new Set();
  const seenExcerpts = new Set();
  const result = [];

  list.forEach(item => {
    let key = String(item.slug || item.id || '').toLowerCase().replace(/_/g, '-');
    if (key.startsWith('journal-')) {
      key = key.substring('journal-'.length);
    }
    const title = String(item.title || '').trim().toLowerCase();
    const excerpt = String(item.excerpt || item.preamble || '').trim().toLowerCase();

    if (key && seenKeys.has(key)) return;
    if (title && title !== 'untitled' && seenTitles.has(title)) return;
    if (excerpt && seenExcerpts.has(excerpt)) return;

    if (key) seenKeys.add(key);
    if (title && title !== 'untitled') seenTitles.add(title);
    if (excerpt) seenExcerpts.add(excerpt);

    result.push(item);
  });

  return result;
}

const all = deduplicateArticles(rawCombined);
const bs = all.filter(a => String(a.title).includes('Before Sunrise'));
console.log('Found Before Sunrise count:', bs.length);
bs.forEach(b => console.log(b.id, b.title));
