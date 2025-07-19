import puppeteer from 'puppeteer-core';

const BROWSER_WEBSOCKET = process.env.BRIGHTDATA_PROXY_URL;

if (!BROWSER_WEBSOCKET) {
  console.error("❌ Variável de ambiente BRIGHTDATA_PROXY_URL não definida.");
  process.exit(1);
}

(async () => {
  try {
    console.log("🔌 Connecting to Bright Data...");
    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WEBSOCKET,
    });

    const page = await browser.newPage();
    console.log("🌐 Navigating to Meta Ads Library...");
    await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=pix&search_type=keyword_unordered', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✅ Page loaded. Scrolling...");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 3000)); // aumenta o delay
    }

    console.log("🔎 Checking if ads list is visible...");

    const listExists = await page.$('div[role="listitem"]');
    if (!listExists) {
      const fallback = await page.evaluate(() => {
        const container = document.querySelector('[data-pagelet]');
        return container ? container.innerHTML : 'No data-pagelet found';
      });

      console.warn("⚠️ Selector not found. Dumping fallback HTML...");
      console.log(fallback);
    } else {
      console.log("🔎 Extracting ads...");
      const ads = await page.$$eval('div[role="listitem"]', items =>
        items.slice(0, 25).map(ad => ({
          title: ad.innerText || null,
          link: window.location.href,
        }))
      );
      console.log("📦 Ads extracted:", ads);
    }

    await browser.close();
  } catch (err) {
    console.error("❌ Scraping error:", err.message);
    process.exit(1);
  }
})();


