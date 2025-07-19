const puppeteer = require("puppeteer");

const BRIGHT_DATA_PROXY = process.env.BRIGHT_DATA_PROXY;
const KEYWORD = process.env.KEYWORD || "píxel"; // ou substitua diretamente aqui
const MAX_WAIT_TIME_MS = 90000; // espera máxima de 90 segundos

(async () => {
  console.log("🔌 Connecting to Bright Data...");
  const browser = await puppeteer.connect({
    browserWSEndpoint: BRIGHT_DATA_PROXY,
    protocolTimeout: MAX_WAIT_TIME_MS,
  });

  const page = await browser.newPage();

  console.log("🌐 Navigating to Meta Ads Library...");
  const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=${encodeURIComponent(
    KEYWORD
  )}&search_type=keyword_unordered`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  console.log("✅ Page loaded. Scrolling...");
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });

  console.log("🔎 Waiting for ads...");
  let ads = [];
  let attempts = 0;

  try {
    while (ads.length === 0 && attempts < 15) {
      try {
        await page.waitForSelector('div[role="listitem"]', {
          timeout: 6000,
        });
        ads = await page.$$eval('div[role="listitem"]', (nodes) =>
          nodes.map((el) => el.innerText.trim())
        );
      } catch {
        console.log(`⏳ Esperando anúncios... tentativa ${attempts + 1}`);
      }
      attempts++;
    }

    if (ads.length === 0) {
      console.log("⚠️ No ads extracted.");
      const html = await page.content();
      console.log("📄 Dumping HTML:");
      console.log(html.slice(0, 5000)); // só os primeiros 5000 caracteres
    } else {
      console.log(`📦 Ads extracted: ${ads.length}`);
      console.log(ads);
    }
  } catch (error) {
    console.error("❌ Scraping error:", error.message);
  } finally {
    await browser.close();
  }
})();
