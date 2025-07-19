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
    await page.evaluate(() => {
      window.scrollBy(0, 6000);
    });
    await new Promise(resolve => setTimeout(resolve, 5000)); // substitui waitForTimeout

    console.log("🧪 Dumping HTML for debug...");
    const html = await page.content();
    console.log(html);

    console.log("🔎 Extracting ads...");
    let ads = await page.$$eval('div[role="listitem"]', items =>
      items.slice(0, 25).map(ad => ({
        text: ad.innerText || null,
        link: window.location.href,
      }))
    );

    if (ads.length === 0) {
      console.warn("⚠️ Nenhum anúncio via 'div[role=\"listitem\"]'. Tentando seletor alternativo...");
      ads = await page.$$eval('a[href*="/ads/library/"]', items =>
        items.slice(0, 25).map(ad => ({
          text: ad.innerText || null,
          href: ad.href || null,
        }))
      );
    }

    if (ads.length === 0) {
      console.warn("⚠️ Nenhum anúncio extraído.");
    } else {
      console.log("📦 Anúncios extraídos:", ads);
    }

    await browser.close();
  } catch (err) {
    console.error("❌ Scraping error:", err.message);
    process.exit(1);
  }
})();

