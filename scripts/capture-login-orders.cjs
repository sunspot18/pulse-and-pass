const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/rishi/.gemini/antigravity-ide/brain/a1fc74a9-8444-4079-8002-ae6dc4591ef3';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Capturing login desktop...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'login_desktop_1440.png'), fullPage: false });

  console.log('Capturing orders desktop...');
  await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'orders_desktop_1440.png'), fullPage: false });

  await browser.close();
  console.log('Done capturing login and orders!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
