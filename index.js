import puppeteer from 'puppeteer-core';

const BROWSER_WEBSOCKET = process.env.BRIGHTDATA_PROXY_URL;

if (!BROWSER_WEBSOCKET) {
  console.error("❌ Variável de ambiente BRIGHTDATA_PROXY_URL não definida.");
  process.exit(1);
}

(async () => {
  try {
    console.log("🔌 Conectando ao Bright Data Browser API...");
    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WEBSOCKET,
    });

    const page = await browser.newPage();
    await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=pix&search_type=keyword_unordered', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✅ Página carregada com sucesso.");

    // Espera até que os anúncios carreguem
    await page.waitForSelector('div[role="listitem"]', { timeout: 45000 });

    const ads = await page.$$eval('div[role="listitem"]', items =>
      items.slice(0, 50).map(ad => ({
        title: ad.innerText || null,
        link: window.location.href,
      }))
    );

    console.log("📦 Anúncios extraídos:", ads);
    await browser.close();
  } catch (err) {
    console.error("❌ Erro durante o scraping:", err.message);
    process.exit(1);
  }
})();
