// fetch.js
const { google } = require('googleapis');
const chromium = require('chrome-aws-lambda');

(async () => {
  // 1) Headless Chrome を起動
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

  // 3) Sheets API で書き込み
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.SHEET_ID;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: '運賃データ!A:B'
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: '運賃データ!A1',
    valueInputOption: 'RAW',
    requestBody: { values: data }
  });

  console.log(`Updated ${data.length} rows`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
