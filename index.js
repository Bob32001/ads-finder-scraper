import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

(async () => {
  console.log("🔌 Iniciando browser com chrome-aws-lambda...");

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless
  });

  const page = await browser.newPage();

  console.log("🌐 Acessando Meta Ads Library...");
  await page.goto("https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR", {
    waitUntil: "domcontentloaded",
    timeout: 60000
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

    console.log(`📦 Anúncios extraídos: ${ads.length}`);
    console.log(JSON.stringify(ads, null, 2));
  } catch (err) {
    console.error("❌ Erro ao extrair anúncios:", err.message);
  }

  await browser.close();
})();

