// fetch.js
const fs = require('fs');
const puppeteer = require('puppeteer-core');

(async () => {
  // GitHub Actions ランナーにインストール済みの Chrome を使う
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.goto('https://www.starflyer.jp/ap/fare/faretable.aspx', { waitUntil: 'networkidle0' });

  // 日付＋運賃を抽出
  const data = await page.evaluate(() => {
    const rows = [];
    document.querySelectorAll('.calendar-table td').forEach(cell => {
      const dayEl  = cell.querySelector('.day');
      const fareEl = cell.querySelector('.fare');
      if (dayEl && fareEl) {
        rows.push([ dayEl.innerText.trim(), fareEl.innerText.trim() ]);
      }
    });
    return rows;
  });

  await browser.close();

  // CSV に書き出し
  const csv = data.map(r => r.join(',')).join('\n');
  fs.writeFileSync('fare.csv', csv, 'utf8');
  console.log(`Wrote ${data.length} rows to fare.csv`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
