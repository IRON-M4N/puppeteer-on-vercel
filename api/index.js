const express = require('express');
const puppeteerExtra = require('puppeteer-extra');
const chromium = require('@sparticuz/chromium');
const {
  Mutex
} = require('async-mutex');

const app = express();
const port = 3000;
const lock = new Mutex();

app.get('/ss', async (req, res) => {
  const {
    url
  } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }
  let browser;
  const release = await lock.acquire();
  try {
    browser = await puppeteerExtra.launch({
      args: [
        ...chromium.args,
        '--no-zygote', //this is optional
        '--no-sandbox', // thus too
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });
    
    const img = await page.screenshot({
      fullPage: true
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="ironman.png"');
    res.end(img);
  } catch (error) {
    console.error(error);
    res.status(412).send('Fekd up');
  } finally {
    if (browser) {
      await browser.close();
    }
    release();
  }
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
