import { chromium } from 'playwright-core';
import fs from 'fs/promises';

const KEYWORD = process.env.KEYWORD || 'pixel';
const MAX_ADS = parseInt(process.env.MAX_ADS || '25', 10);

(async () => {
  console.log('🔌 Conectando via Playwright...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser', // caminho presente no Render
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('🌐 Acessando Ads Library...');
  await page.goto(`https://www.facebook.com/ads/library/?q=${encodeURIComponent(KEYWORD)}&search_type=keyword_unordered`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  console.log('✅ Página carregada. Scrollando...');

  let previousHeight = 0;
  try {
    while (true) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
    }
  } catch (err) {
    console.warn('⚠️ Erro no scroll:', err.message);
  }

  console.log('🔎 Extraindo anúncios...');
  try {
    await page.waitForSelector('div[role="listitem"]', { timeout: 60000 });
  } catch {
    console.log('❌ Nenhum anúncio visível.');
    await browser.close();
    return;
  }

  const ads = await page.$$eval('div[role="listitem"]', (nodes, max) => {
    return nodes.slice(0, max).map(node => {
      const text = node.innerText;
      const image = node.querySelector('img')?.src || null;
      const video = node.querySelector('video')?.src || null;
      return { text, image, video };
    });
  }, MAX_ADS);

  console.log(`📦 Total extraído: ${ads.length}`);
  await fs.writeFile('ads.json', JSON.stringify(ads, null, 2));
  console.log('💾 Salvo em ads.json');

  await browser.close();
})();
