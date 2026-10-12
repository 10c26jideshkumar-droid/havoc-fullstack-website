const fs = require('fs');
const path = require('path');

const anikaHtmlPath = path.join(__dirname, 'public/anika-rao.html');
const anikaHtml = fs.readFileSync(anikaHtmlPath, 'utf8');

// Load backup data for all 10 creators
const backupPath = path.join(__dirname, 'src/db/havoc_database_backup.json');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const creators = backup.tables.creator_profiles;
const users = backup.tables.users;
const portfolios = backup.tables.portfolios;
const reviews = backup.tables.reviews;
const packages = backup.tables.packages;

console.log('Total creators to render:', creators.length);

for (const cp of creators) {
  const user = users.find(u => u.id === cp.user_id) || {};
  const creatorPortfolios = portfolios.filter(p => p.creator_id === cp.user_id);
  const creatorReviews = reviews.filter(r => r.creator_id === cp.user_id);
  const creatorPackages = packages.filter(pkg => pkg.creator_id === cp.user_id);

  let html = anikaHtml;

  // Title and basic headers
  html = html.replace(/<title>Anika Rao — Voice AI engineer \| HAVOC<\/title>/g, `<title>${user.full_name} — ${cp.headline} | HAVOC</title>`);
  html = html.replace(/Anika Rao on HAVOC/g, `${user.full_name} on HAVOC`);
  html = html.replace(/Anika Rao/g, user.full_name);
  html = html.replace(/Voice AI engineer/g, cp.headline);
  html = html.replace(/Bengaluru, India/g, cp.location);
  html = html.replace(/anika-rao/g, cp.slug);
  html = html.replace(/AR<\/span>/g, `${user.full_name.split(' ').map(n=>n[0]).join('')}</span>`);
  
  if (user.avatar_url) {
    html = html.replace(/\/assets\/voice-wK_EftTy\.jpg/g, user.avatar_url);
  }

  // Ensure voice assistant script is included before closing body
  if (!html.includes('voice-assistant.js')) {
    html = html.replace('</body></html>', '<script src="/voice-assistant.js"></script></body></html>');
  }

  const outPath = path.join(__dirname, `public/creator-${cp.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Generated HTML page for creator: ${cp.slug}`);
}
