const express = require('express');
const puppeteerExtra = require('puppeteer-extra'); //need to install puppeteer or puppeteer core (no need to import it)
const chromium = require('@sparticuz/chromium');
const {
  Mutex
} = require('async-mutex'); //to queue multiple requests

const app = express();
const port = 3000;
const lock = new Mutex();
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      executablePath: await chromium.executablePath(), //these stuff is in the docs of @sparticuz/chromium 
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle2'
    });
    await wait(3500);
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
