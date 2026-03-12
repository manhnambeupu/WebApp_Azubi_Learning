const { chromium } = require('@playwright/test');

(async () => {
  // Khởi động Chromium
  const browser = await chromium.launch({ headless: false }); // `headless: false` để xem cửa sổ trình duyệt
  const page = await browser.newPage();

  // Truy cập trang web
  await page.goto('https://example.com');
  console.log('Title:', await page.title());

  // Đóng trình duyệt
  await browser.close();
})();
