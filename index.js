import puppeteer from 'puppeteer-core';

const BROWSER_WEBSOCKET = process.env.BRIGHTDATA_PROXY_URL;

if (!BROWSER_WEBSOCKET) {
  console.error("❌ Environment variable BRIGHTDATA_PROXY_URL not defined.");
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
      timeout: 60000,
    });

    console.log("✅ Page loaded. Scrolling...");
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 200;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight / 2) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });

    // Pause briefly to allow lazy-loaded content to appear
    await new Promise(resolve => setTimeout(resolve, 4000));

    console.log("🔎 Extracting ads...");
    await page.waitForSelector('div[role="listitem"]', { timeout: 60000 }); // tempo aumentado aqui

    const ads = await page.$$eval('div[role="listitem"]', items =>
      items.slice(0, 25).map(ad => ({
        title: ad.innerText || null,
        link: window.location.href,
      }))
    );

    if (ads.length === 0) {
      console.warn("⚠️ No ads found in time.");
    }

    console.log("📦 Extracted ads:", ads);
    await browser.close();
  } catch (err) {
    console.error("❌ Scraping error:", err.message);
    process.exit(1);
  }
})();

