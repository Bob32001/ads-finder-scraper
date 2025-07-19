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

    const url = 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=pix&search_type=keyword_unordered';
    console.log("🌐 Navigating to Meta Ads Library...");
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✅ Page loaded. Scrolling...");
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));

    console.log("🧠 Dumping HTML content...");
    const html = await page.content();
    console.log("📄 HTML content:\n", html);

    await browser.close();
  } catch (err) {
    console.error("❌ Scraping error:", err.message);
    process.exit(1);
  }
})();


