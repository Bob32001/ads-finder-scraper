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
      timeout: 90000
    });

    console.log("✅ Page loaded. Scrolling...");
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });

    // ⏱ Espera alternativa de 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("🔎 Extracting ads...");
    const ads = await page.$$eval('div[data-pagelet^="FeedUnit_"]', items =>
      items.slice(0, 25).map(ad => ({
        text: ad.innerText,
        html: ad.innerHTML,
      }))
    );

    if (ads.length === 0) {
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


