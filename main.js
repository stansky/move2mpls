const puppeteer = require("puppeteer");
const PuppeteerMassScreenshots = require('puppeteer-mass-screenshots');

// Performance timing
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
const start = window.performance.now();

// Options
const screenshots = new PuppeteerMassScreenshots();
const url = "https://stackoverflow.com/";
const headlessBrowser = true;
const viewportWidth = 1440;
const viewportHeight = 768;

const waitFor = async (ms) => {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
};

const scrollAndRender = async (page) => {
  const bodyHandle = await page.$("body");
  const { height } = await bodyHandle.boundingBox();
  await bodyHandle.dispose();
  
  let count = 0;
  const calculatedVh = page.viewport().height;
  let vhIncrease = 0;
  let pageYOffset = 0;
  while (vhIncrease + calculatedVh < height) {
    pageYOffset = await page.evaluate(() => window.pageYOffset)
    
    await page.evaluate((_calculatedVh) => {
      window.scrollBy(0, _calculatedVh);
    }, calculatedVh);

    // Wait for scroll animations
    await waitFor(1000);
    vhIncrease = vhIncrease + calculatedVh;
    count++;

    // Debugging
    console.log('#', calculatedVh, pageYOffset, height)
  }

  // Scroll back to top
  await page.evaluate((_) => {
    window.scrollTo(0, 0);
  });
  
  await page.setViewport({ width: viewportWidth, height: parseInt(height) });
  // Wait for scroll animations
  await waitFor(2000);
};

const FullPageScreenshot = async () => {
  let browser = await puppeteer.launch({ headless: headlessBrowser });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.setViewport({ width: viewportWidth, height: viewportHeight });
  await scrollAndRender(page);

  await page.screenshot({
    path: "./screen_node.png",
    fullPage: true
  });

  await page.close();
  await browser.close();

  const stop = window.performance.now();
  console.log(`Execution time in seconds: ${(stop - start) / 1000} seconds`);
};

const AnimatedScrollScreenshot = async () => {
  let browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await screenshots.init(page, '');
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.setViewport({ width: 1440, height: 768 });
  await screenshots.start({format: 'png'});
  await scrollAndRender(page);
  await screenshots.stop();

  await page.close();
  await browser.close();

  const stop = window.performance.now();
  console.log(`Execution time in seconds: ${(stop - start) / 1000} seconds`);
};

FullPageScreenshot();
