const rawText = `Äntligen kan vi själva besöka The Closet när vi vill! Criterions lilla Cineast skrubb med de tidlösa klassikerna finns nu på nätet som en interaktiv app\n\nOriginal Link: https://www.facebook.com/groups/386201384739926/posts/28546009598332394/`;

let title = "Archive Photo";
let bodyText = rawText;

const boldTitleMatch = rawText.match(/^\*\*([^*]+)\*\*/);
if (boldTitleMatch) {
    title = boldTitleMatch[1];
    bodyText = rawText.replace(/^\*\*([^*]+)\*\*\s*/, '');
} else {
    const cleanText = rawText.replace(/!\[.*?\]\(.*?\)/g, '').replace(/Original Link:.*/, '').trim();
    const words = cleanText.split(/\s+/);
    if (words.length > 0 && words[0] !== "") {
      title = words.slice(0, 8).join(' ') + (words.length > 8 ? "..." : "");
    }
}

let originalLink = "";
const linkMatch = bodyText.match(/Original Link:\s*(https?:\/\/[^\s<]+)/);
if (linkMatch) {
    originalLink = linkMatch[1];
    bodyText = bodyText.replace(/Original Link:\s*(https?:\/\/[^\s<]+)/, '');
}

console.log("Original Link extracted:", originalLink);
console.log("Title extracted:", title);
