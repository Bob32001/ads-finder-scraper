import puppeteer from 'puppeteer-core';

const BROWSER_WEBSOCKET = process.env.BRIGHTDATA_PROXY_URL;

if (!BROWSER_WEBSOCKET) {
  console.error("❌ Variável de ambiente BRIGHTDATA_PROXY_URL não definida.");
  process.exit(1);
}

(async () => {
  try {
    console.log("🔌 Connecting to Bright Data...");
    const browser = await puppeteer.connect({ browserWSEndpoint: BROWSER_WEBSOCKET });
    const page = await browser.newPage();

    console.log("🌐 Navigating to Meta Ads Library...");
    await page.goto(
      'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=pix&search_type=keyword_unordered',
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );

    console.log("✅ Page loaded. Scrolling...");
    const start = Date.now();
    while (Date.now() - start < 40000) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("🔎 Waiting for ads...");
    const maxTries = 15;
    let adsFound = false;

    for (let i = 0; i < maxTries; i++) {
      adsFound = await page.$('div[role="listitem"]');
      if (adsFound) break;
      console.log(`⏳ Esperando anúncios... tentativa ${i + 1}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (!adsFound) {
      console.warn("⚠️ No ads extracted.");
    }

    const ads = await page.$$eval('div[role="listitem"]', items =>
      items.slice(0, 25).map(ad => ({
        title: ad.innerText || null,
        link: window.location.href,
      }))
    );

    console.log(`📦 Ads extracted: ${ads.length}`);
    console.log(JSON.stringify(ads, null, 2));

    await browser.close();
  } catch (err) {
    console.error("❌ Scraping error:", err.message);
    process.exit(1);
  }
})();

