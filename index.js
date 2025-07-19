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
        const distance = 300;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= 2000) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });

    console.log("🔎 Extracting ads...");

    let ads = [];
    try {
      ads = await page.$$eval('div[role="listitem"]', items =>
        items.slice(0, 25).map(ad => ({
          title: ad.innerText || null,
          link: window.location.href,
        }))
      );
    } catch (innerErr) {
      console.warn("⚠️ Fallback: Could not find any ads, selector missing.");
    }

    if (!ads.length) {
      console.warn("⚠️ No ads extracted.");
    } else {
      console.log("📦 Ads extracted:", ads);
    }

    await browser.close();
  } catch (err) {
    console.error("❌ Scraping error:", err.message);
    process.exit(1);
  }
})();

