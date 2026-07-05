import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Find a Facebook post and click it
  await page.evaluate(() => {
    const cards = document.querySelectorAll('.short-card');
    for (let card of cards) {
      if (card.querySelector('.fb-icon')) {
        card.click();
        break;
      }
    }
  });
  
  await page.waitForSelector('#drawer-content .drawer-article-header', { timeout: 5000 });
  
  const headerHtml = await page.evaluate(() => {
    return document.querySelector('#drawer-content .drawer-article-header').innerHTML;
  });
  
  console.log("Drawer Header HTML:");
  console.log(headerHtml);
  
  await browser.close();
})();
