const puppeteer = require('puppeteer');
const XLSX = require('xlsx');
const os = require('os');
const path = require('path');
const fs = require('fs');

const INSTAGRAM_USERNAME = 'your_username';
const INSTAGRAM_PASSWORD = 'your_password';

const usernamesPath = path.join(__dirname, 'username-list.json');
let usernames = [];

try {
  const data = fs.readFileSync(usernamesPath, 'utf-8');
  usernames = JSON.parse(data);
  if (!Array.isArray(usernames)) {
    throw new Error('usernames.json dosyası dizi içermiyor!');
  }
} catch (err) {
  console.error('❌ usernames.json okunurken hata:', err.message);
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Instagram login 
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

  // Username, password
  await page.waitForSelector('input[name="username"]', { visible: true });
  await page.type('input[name="username"]', INSTAGRAM_USERNAME, { delay: 100 });
  await page.type('input[name="password"]', INSTAGRAM_PASSWORD, { delay: 100 });

  // Login Button Click
  await page.click('button[type="submit"]');

  // Giriş sonrası sayfa yüklenene kadar bekle
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 50000 });
  } catch {
    console.log("⏰ Navigation timeout oldu, devam ediliyor...");
  }

  // Login başarılı mı kontrol : profil fotoğrafının alt attribute'unda username olmalı
  try {
    await page.waitForSelector('img', { timeout: 10000 });
    const imgsAlt = await page.$$eval('img', imgs =>
      imgs.map(img => img.alt.toLowerCase())
    );
    const usernameLower = INSTAGRAM_USERNAME.toLowerCase();
    const loginSuccess = imgsAlt.some(alt => alt.includes(usernameLower));

    console.log("imgsAlt", imgsAlt)
    console.log("loginSuccess", loginSuccess)

    if (!loginSuccess) {
      console.log("⚠️ Giriş başarısız, profil fotoğrafı alt attribute'unda kullanıcı adı bulunamadı.");
      await browser.close();
      return;
    }
  } catch {
    console.log("⚠️ Profil fotoğrafı bulunamadı, giriş sorunlu olabilir.");
    await browser.close();
    return;
  }

  console.log("✅ Giriş başarılı!");

  try {
    await page.waitForSelector('button.sqdOP.yWX7d.y3zKF', { timeout: 5000 });
    await page.click('button.sqdOP.yWX7d.y3zKF');
  } catch (e) { }

  const canceledUsers = [];

  for (const username of usernames) {
    console.log(`👉 ${username} profil sayfasına gidiliyor...`);

    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle2' });

    try {
      await page.waitForSelector('button', { visible: true, timeout: 5000 });
      const buttons = await page.$$('button');

      let cancelBtn = null;
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent.toLowerCase(), btn);
        if (text.includes('requested')) {
          cancelBtn = btn;
          break;
        }
      }

      if (!cancelBtn) cancelBtn = buttons[0];

      if (cancelBtn) {
        await cancelBtn.click();
        console.log('❗ İstek iptal butonuna tıklandı, modal bekleniyor...');

        await page.waitForSelector('button._a9--._ap36._a9-_', { visible: true, timeout: 5000 });
        await page.click('button._a9--._ap36._a9-_');

        console.log('✅ İstek başarıyla iptal edildi.');
        canceledUsers.push({ username });

      } else {
        console.log('❌ İptal butonu bulunamadı.');
      }
    } catch (err) {
      console.log('❌ İşlem sırasında hata:', err.message);
    }

    await new Promise(r => setTimeout(r, 5000));
  }

  if (canceledUsers.length > 0) {
    const worksheet = XLSX.utils.json_to_sheet(canceledUsers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'İptalEdilenler');

    const desktopPath = path.join(os.homedir(), 'Desktop');
    const fileName = path.join(desktopPath, 'iptal_edilenler_listesi.xlsx');

    XLSX.writeFile(workbook, fileName);
    console.log(`🎉 İptal edilen kullanıcılar '${fileName}' dosyasına kaydedildi.`);
  } else {
    console.log('❗ İptal edilen kullanıcı bulunamadı, dosya oluşturulmadı.');
  }

  console.log("🎉 Tüm işlemler tamamlandı.");
  await browser.close();
})();
