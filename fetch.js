// fetch.js
const fs = require('fs');
const chromium = require('chrome-aws-lambda');

(async () => {
  // 1) Headless Chrome 起動
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.goto('https://www.starflyer.jp/ap/fare/faretable.aspx', { waitUntil: 'networkidle0' });

  // 2) 日付＋運賃を抽出
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

  // 3) CSV 文字列を作成して書き込む
  const csv = data.map(r => r.join(',')).join('\n');
  fs.writeFileSync('fare.csv', csv);

  console.log(`Wrote ${data.length} rows to fare.csv`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
