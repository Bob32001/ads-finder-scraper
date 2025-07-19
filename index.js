import puppeteer from 'puppeteer-core';

const BROWSER_WEBSOCKET = process.env.BRIGHTDATA_PROXY_URL;

if (!BROWSER_WEBSOCKET) {
  console.error("❌ Variável de ambiente BRIGHTDATA_PROXY_URL não definida.");
  process.exit(1);
}

(async () => {
  let browser;
  let page;

  try {
    console.log("🔌 Conectando ao Bright Data Browser API...");
    browser = await puppeteer.connect({ browserWSEndpoint: BROWSER_WEBSOCKET });

    page = await browser.newPage();
    await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=pix&search_type=keyword_unordered', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✅ Página carregada com sucesso.");

    try {
      await page.waitForSelector('[data-testid="ad-review-creative"]', { timeout: 45000 });
    } catch (e) {
      console.warn("⚠️ Nenhum anúncio encontrado dentro do tempo esperado.");
    }

    const ads = await page.$$eval('[data-testid="ad-review-creative"]', items =>
      items.slice(0, 50).map(ad => ({
        title: ad.innerText || null,
        link: window.location.href,
      }))
    );

    console.log("📦 Anúncios extraídos:", ads);

    const html = await page.content();
    console.log("🧾 HTML da página:");
    console.log(html);

    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error("❌ Erro durante o scraping:", err.message);

    if (typeof page !== 'undefined') {
      const html = await page.content();
      console.log("🧾 HTML da página (erro):");
      console.log(html);
    }

    if (browser) await browser.close();
    process.exit(1);
  }
})();


