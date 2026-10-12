const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('media-enhancements.js')) {
    content = content.replace('</body></html>', '<script src="/media-enhancements.js"></script></body></html>');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Injected media-enhancements.js into ${file}`);
  }
}
