const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\rishi\\.gemini\\antigravity-ide\\brain\\a1fc74a9-8444-4079-8002-ae6dc4591ef3';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const viewports = [
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_375', width: 375, height: 812 },
];

const pages = [
  { name: 'home', url: 'http://localhost:3000' },
  { name: 'styleguide', url: 'http://localhost:3000/styleguide' },
];

async function capture() {
  console.log('📸  Launching Edge for Design Reset Verification...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const pageInfo of pages) {
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
      });

      console.log(`⏳ Navigating to ${pageInfo.url} at ${vp.width}x${vp.height}...`);
      await page.goto(pageInfo.url, { waitUntil: 'networkidle2' });

      // Small delay to ensure all web fonts and layouts settle
      await new Promise((r) => setTimeout(r, 600));

      const fileName = `${pageInfo.name}_${vp.name}.png`;
      const filePath = path.join(ARTIFACTS_DIR, fileName);

      await page.screenshot({
        path: filePath,
        fullPage: false, // Clean viewport screenshot
      });

      console.log(`✅ Saved: ${fileName}`);
      await page.close();
    }
  }

  await browser.close();
  console.log('\n🎉 All 6 design reset screenshots successfully captured.');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
