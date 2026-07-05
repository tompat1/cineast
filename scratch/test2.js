fetch('http://localhost:5173/data/articles.json')
  .then(r => r.json())
  .then(data => {
    const fb = data.find(a => a.platform === 'facebook');
    if (fb) {
      console.log("Found FB post:", fb.raw_text);
      
      let bodyText = fb.raw_text;
      let originalLink = "";
      const linkMatch = bodyText.match(/Original Link:\s*(https?:\/\/[^\s<]+)/);
      if (linkMatch) {
        originalLink = linkMatch[1];
      }
      console.log("Extracted Original Link:", originalLink);
    }
  });
