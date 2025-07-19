import { chromium } from "playwright";

(async () => {
  console.log("🔌 Conectando via Playwright...");

  const browser = await chromium.launch({
    headless: true, // obrigatório no Render
  });

  const page = await browser.newPage();

  console.log("🌐 Acessando Meta Ads Library...");
  await page.goto("https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR", {
    timeout: 60000,
    waitUntil: "domcontentloaded"
  });

  console.log("✅ Página carregada. Esperando anúncios...");

  try {
    await page.waitForSelector('div[role="listitem"]', { timeout: 45000 });
    const ads = await page.$$eval('div[role="listitem"]', (elements) => {
      return elements.slice(0, 25).map((el) => {
        const title = el.innerText.slice(0, 100);
        const html = el.innerHTML;
        return { title, html };
      });
    });

    console.log(`📦 Ads extraídos: ${ads.length}`);
    console.log(JSON.stringify(ads, null, 2));
  } catch (e) {
    console.error("❌ Erro ao extrair anúncios:", e.message);
  }

  await browser.close();
})();

