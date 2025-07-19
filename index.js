import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

(async () => {
  console.log("🔌 Iniciando browser com chrome-aws-lambda...");

  const executablePath = await chromium.executablePath || '/usr/bin/chromium-browser';

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless
  });

  const page = await browser.newPage();

  console.log("🌐 Acessando Meta Ads Library...");
  await page.goto('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log("✅ Página carregada. Extraindo anúncios...");
  try {
    await page.waitForSelector('div[role="listitem"]', { timeout: 45000 });

    const ads = await page.$$eval('div[role="listitem"]', elements =>
      elements.slice(0, 50).map(el => ({
        title: el.innerText.slice(0, 150),
        html: el.innerHTML
      }))
    );

    console.log(`📦 Anúncios extraídos: ${ads.length}`);
    console.log(JSON.stringify(ads, null, 2));
  } catch (e) {
    console.error("❌ Nenhum anúncio encontrado ou erro ao extrair:", e.message);
  }

  await browser.close();
})();

