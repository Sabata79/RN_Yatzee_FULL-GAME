const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'assets', 'fonts');

if (!fs.existsSync(fontsDir)) {
  console.error('❌ Kansio assets/fonts ei löytynyt!');
  process.exit(1);
}

const files = fs.readdirSync(fontsDir);
console.log('📂 Löydetyt fonttitiedostot assets/fonts-kansiosta:');
files.forEach(file => console.log(' -', file));

const target = 'Anton-Regular.ttf';
if (files.includes(target)) {
  console.log(`✅ ${target} löytyy ja kirjainkoko täsmää.`);
} else {
  console.error(`⚠️ ${target} ei täsmää (kirjainkoko tai nimi voi olla eri)!`);
}