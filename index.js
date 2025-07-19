import puppeteer from 'puppeteer-core';
import fs from 'fs/promises';

const KEYWORD = process.env.KEYWORD || 'pixel';
const MAX_ADS = parseInt(process.env.MAX_ADS || '25', 10);

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log('🔌 Conectando ao Bright Data...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('🌐 Acessando Meta Ads Library...');
  await page.goto(`https://www.facebook.com/ads/library/?q=${encodeURIComponent(KEYWORD)}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&search_type=keyword_unordered`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log('✅ Página carregada. Scrollando...');

  // Scroll para carregar os anúncios
  let previousHeight = 0;
  try {
    while (true) {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await delay(1500);
      const newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
    }
  } catch (err) {
    console.warn('⚠️ Erro durante scroll, continuando...');
  }

  console.log('🔎 Buscando anúncios...');
  await page.waitForSelector('div[role="listitem"]', { timeout: 60000 }).catch(() => {
    console.error('❌ Nenhum anúncio encontrado. Abortando.');
    return browser.close();
  });

  const ads = await page.$$eval('div[role="listitem"]', (nodes, max) => {
    return nodes.slice(0, max).map(node => {
      const text = node.innerText;
      const video = node.querySelector('video')?.src || null;
      const image = node.querySelector('img')?.src || null;
      return { text, video, image };
    });
  }, MAX_ADS);

  console.log(`📦 Anúncios extraídos: ${ads.length}`);
  console.log(JSON.stringify(ads, null, 2));

  await fs.writeFile('ads.json', JSON.stringify(ads, null, 2));
  console.log('💾 Salvo em ads.json');

  await browser.close();
})();
