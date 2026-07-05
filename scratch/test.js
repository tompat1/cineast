const fs = require('fs');

const rawText = `**One Battle After Another, 2025 - ★★★★★**\n\n![Poster](https://a.ltrbxd.com/resized/film-poster/9/5/1/2/7/7/951277-one-battle-after-another-0-600-0-900-crop.jpg?v=d27c4cc662)\n\nIt will not ever be better than this. I must say honestly I had my doubts going into this. Didn't care that much for Leonardo DiCaprios character in the trailer and my overhyped alarm was tingling.\n\nBut boy was I wrong! Paul T Anderson is always creating Intense on-screen worlds, with larger than life characters. And for almost three hours his wild ride through contemporary America delivers  a true masterpiece. Very funny, very political and very violent.\n\nStellar cast with Sean Penn finally returning. He punches u with such a brute force of scary good acting that you'll remember it 4 a very long time. Benicio Del Toro is perfect in his Kung-Fu master of disaster role elegantly and very funny saving the day.\n\nAnd yes, once again Leonardo lands the biggest role so far of his life, and somehow making it all perfectly believable and very, very funny and at the same time heartbreaking. Biggest kudos goes to Teyana Taylor for a powerful performance as the leader of the resistance and Sean Penn's antagonist. Maybe the brightest shining star of the movie is Chase Infiniti, excellent as DiCaprios daughter, suddenly fighting for her life.\n\nJust go and watch this in the Theater now! 🙌\n\nOriginal Link: https://letterboxd.com/tompat1/film/one-battle-after-another/`;

let title = "Archive Photo";
let bodyText = rawText;

const boldTitleMatch = rawText.match(/^\*\*([^*]+)\*\*/);
if (boldTitleMatch) {
title = boldTitleMatch[1];
bodyText = rawText.replace(/^\*\*([^*]+)\*\*\s*/, '');
}

let originalLink = "";
const linkMatch = bodyText.match(/Original Link:\s*(https?:\/\/[^\s<]+)/);
if (linkMatch) {
originalLink = linkMatch[1];
bodyText = bodyText.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/, '');
}

function parseMarkdown(text) {
let html = text;
html = html.replace(/!\[([^\]]*)\]\((.*?)\)/g, '<img src="$2" alt="$1" />');
html = html.replace(/\[([^\]]+)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
html = html.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/gi, '<a href="$1" target="_blank" class="utility-link" style="display:inline-block; margin-top: 20px; font-weight: 500;">VIEW ORIGINAL POST &rarr;</a>');
html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const paragraphs = html.split(/\n\s*\n/);
html = paragraphs.map(p => {
    const inner = p.replace(/\n/g, '<br>');
    if (inner.trim().startsWith('<img')) return inner;
    return `<p>${inner}</p>`;
}).join('');
return html;
}

console.log(parseMarkdown(bodyText));
