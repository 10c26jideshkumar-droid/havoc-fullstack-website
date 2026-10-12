const fs = require('fs');
const path = require('path');

// 1. Generate full public/creators.html with all 10 creators
const baseHtml = fs.readFileSync(path.join(__dirname, 'temp_creators_current.html'), 'utf8');

// Additional 4 creators HTML cards matching exactly the existing card DOM structure
function makeCreatorCard(c) {
  return `<div class="group overflow-hidden rounded-3xl border bg-card shadow-card transition hover:-translate-y-1"><a class="block" href="/creators/${c.slug}"><div class="aspect-[4/3] overflow-hidden"><img src="${c.cover}" alt="${c.name}" loading="lazy" width="1024" height="768" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div><div class="p-5 pb-3"><div class="flex items-center justify-between text-xs"><span class="font-semibold text-primary">${c.category}</span><span class="flex items-center gap-1 text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>${c.rating}</span></div><h3 class="mt-1.5 flex items-center gap-1.5 text-lg font-bold">${c.name}<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-check h-4 w-4 text-primary" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m9 12 2 2 4-4"></path></svg></h3><p class="text-sm text-muted-foreground">${c.role}</p><p class="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin h-3 w-3" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>${c.location}<!-- --> · $<!-- -->${c.rate}<!-- -->/hr</p></div></a><div class="flex flex-wrap gap-2 px-5 pb-5"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 rounded-md px-3 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-plus h-4 w-4" aria-hidden="true"><path d="M16 19h6"></path><path d="M16 2v4"></path><path d="M19 16v6"></path><path d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"></path><path d="M3 10h18"></path><path d="M8 2v4"></path></svg>Invite to interview</button><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark h-4 w-4" aria-hidden="true"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"></path></svg>My Picks</button></div></div>`;
}

const extraCreators = [
  {
    slug: 'zara-chen',
    name: 'Zara Chen',
    role: 'AI Video & VFX Artist',
    category: 'AI Video',
    location: 'Singapore',
    rate: 110,
    rating: 4.9,
    cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    slug: 'vikram-patel',
    name: 'Vikram Patel',
    role: 'LLM Integration & AI Agents Specialist',
    category: 'AI Agents',
    location: 'Hyderabad, India',
    rate: 90,
    rating: 4.8,
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
  },
  {
    slug: 'elena-rostova',
    name: 'Elena Rostova',
    role: '3D Generative & Virtual Worlds Artist',
    category: 'AI Image Generation',
    location: 'Berlin, Germany',
    rate: 130,
    rating: 4.9,
    cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
  },
  {
    slug: 'marcus-vance',
    name: 'Marcus Vance',
    role: 'Prompt Engineer & Creative Director',
    category: 'Prompt Engineering',
    location: 'San Francisco, USA',
    rate: 105,
    rating: 4.7,
    cover: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
  }
];

const cardsHtml = extraCreators.map(makeCreatorCard).join('');
// Insert cards before the closing of the grid:
// The last creator card is arjun-mehta, ending with My Picks</button></div></div></div></div>
const targetPoint = 'My Picks</button></div></div></div></div><script>';
let creatorsHtml = baseHtml;
if (creatorsHtml.includes(targetPoint)) {
  creatorsHtml = creatorsHtml.replace(targetPoint, 'My Picks</button></div></div>' + cardsHtml + '</div></div><script>');
}

// Ensure voice assistant is included
if (!creatorsHtml.includes('/voice-assistant.js')) {
  creatorsHtml = creatorsHtml.replace('</body></html>', '<script src="/voice-assistant.js"></script></body></html>');
}

fs.writeFileSync(path.join(__dirname, 'public/creators.html'), creatorsHtml, 'utf8');
console.log('Successfully wrote public/creators.html with all 10 creator cards!');
