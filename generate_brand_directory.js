const fs = require('fs');
const path = require('path');

const baseHtml = fs.readFileSync(path.join(__dirname, 'temp_brand.html'), 'utf8');
const backupPath = path.join(__dirname, 'src/db/havoc_database_backup.json');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const brands = backup.tables.brands;

console.log('Total brands to render:', brands.length);

// Generate brand cards HTML to inject into the brand page
function makeBrandCard(b) {
  const reqs = (b.campaign_requirements || []).map(r => `<span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">${r}</span>`).join(' ');
  return `
    <div class="rounded-3xl border bg-card p-6 shadow-card hover:border-primary/50 transition duration-300">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <img src="${b.logo_url}" alt="${b.name}" class="h-12 w-12 rounded-2xl object-cover border border-border" />
          <div>
            <h3 class="text-lg font-bold">${b.name}</h3>
            <p class="text-xs text-primary font-medium">${b.industry} · ${b.location}</p>
          </div>
        </div>
        <span class="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">${b.budget_range}</span>
      </div>
      <p class="mt-3 text-sm text-muted-foreground line-clamp-2">${b.description}</p>
      <div class="mt-4">
        <p class="text-xs font-semibold text-foreground/80 mb-1.5">Campaign Needs:</p>
        <div class="flex flex-wrap gap-1.5">${reqs}</div>
      </div>
      <div class="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span class="text-xs text-muted-foreground">Team: ${b.team_size || '30+'} · Est. ${b.founded || '2020'}</span>
        <a href="mailto:${b.contact_email}" class="text-xs font-semibold text-primary hover:underline">Contact Brand →</a>
      </div>
    </div>
  `;
}

const brandCards = brands.map(makeBrandCard).join('');

const brandDirectorySection = `
<section class="mt-12">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Active Brand Profiles</h2>
      <p class="text-sm text-muted-foreground">Discover verified brand teams actively hiring AI creators.</p>
    </div>
    <span class="rounded-full border bg-accent/40 px-3 py-1 text-xs font-semibold">${brands.length} Brands Active</span>
  </div>
  <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    ${brandCards}
  </div>
</section>
`;

let brandHtml = baseHtml;
// Inject brand directory before the end of the main section
const injectionPoint = '<!--/$--></main>';
if (brandHtml.includes(injectionPoint)) {
  brandHtml = brandHtml.replace(injectionPoint, `${brandDirectorySection}<!--/$--></main>`);
}

// Ensure voice assistant is included
if (!brandHtml.includes('/voice-assistant.js')) {
  brandHtml = brandHtml.replace('</body></html>', '<script src="/voice-assistant.js"></script></body></html>');
}

fs.writeFileSync(path.join(__dirname, 'public/brand.html'), brandHtml, 'utf8');
console.log('Successfully wrote public/brand.html with all 5 active brand profiles!');
