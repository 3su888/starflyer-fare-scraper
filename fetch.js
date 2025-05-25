// fetch.js
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  // Puppeteer を起動
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  // タイムアウトを 60 秒に延長し、networkidle2 で待機
  await page.goto('https://www.starflyer.jp/ap/fare/faretable.aspx', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // カレンダーテーブルのセルが描画されるまで待つ（最大 60 秒）
  await page.waitForSelector('.calendar-table td', { timeout: 60000 });

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

  // CSV を書き出し
  const csv = data.map(r => r.join(',')).join('\n');
  fs.writeFileSync('fare.csv', csv, 'utf8');
  console.log(`Wrote ${data.length} rows to fare.csv`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
