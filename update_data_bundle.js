const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public/assets/data-Cpnfo5Fm.js');
let content = fs.readFileSync(filePath, 'utf8');

// The 4 new creator objects to insert into o array
const additionalCreators = [
  {
    slug: 'zara-chen',
    name: 'Zara Chen',
    role: 'AI Video & VFX Artist',
    category: 'AI Video',
    location: 'Singapore',
    cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    rate: 110,
    available: true,
    verified: true,
    bio: 'Crafting hyper-realistic AI video commercials, VFX world extensions, and high-impact social motion graphics.',
    languages: ['English', 'Mandarin'],
    skills: [{ name: 'AI Video', level: 97 }, { name: 'Generative Film', level: 93 }, { name: 'AI Image Generation', level: 89 }],
    portfolio: [
      { id: 'z1', type: 'video', title: 'Cyberpunk Hyperdrive Commercial', image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80', description: '30-second futuristic sports car launch film rendered with cutting-edge diffusion video pipelines.', tags: ['AI Video', 'Generative Film'] },
      { id: 'z2', type: 'image', title: 'Holographic Neon Fashion Reel', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', description: 'Dynamic neon-drenched apparel visualizer with consistent face geometry.', tags: ['Fashion', 'AI Video'] }
    ],
    reviews: [{ brand: 'Apex Motors', author: 'David W.', rating: 5, text: 'Zara delivered a jaw-dropping automotive launch video. Visual fidelity exceeded our expectations.', date: 'Sep 2026' }],
    packages: [
      { name: 'Teaser Reel', price: 1800, delivery: '7 days', features: ['15s 4K video', 'Custom sound design', '3 revisions'] },
      { name: 'Brand Campaign Video', price: 4800, delivery: '14 days', features: ['60s narrative film', 'Full VFX compositing', 'Multiple aspect ratios'] }
    ],
    workspace: [{ project: 'Hyperdrive campaign', brand: 'Apex Motors', progress: 85, due: 'Oct 28', status: 'In progress' }]
  },
  {
    slug: 'vikram-patel',
    name: 'Vikram Patel',
    role: 'LLM Integration & AI Agents Specialist',
    category: 'AI Agents',
    location: 'Hyderabad, India',
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    rate: 90,
    available: true,
    verified: true,
    bio: 'Designing enterprise-grade autonomous customer workflows, multi-agent orchestrations, and fine-tuned RAG pipelines.',
    languages: ['English', 'Hindi', 'Telugu'],
    skills: [{ name: 'AI Agents', level: 96 }, { name: 'LLM Integration', level: 94 }, { name: 'Chatbots', level: 90 }, { name: 'Prompt Engineering', level: 86 }],
    portfolio: [
      { id: 'v1', type: 'project', title: 'Fintech Multi-Agent Support Orchestrator', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80', description: 'Autonomous financial agent squad resolving transaction queries with 94% automation.', tags: ['AI Agents', 'LLM Integration'] },
      { id: 'v2', type: 'video', title: 'Omnichannel Voice Concierge', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80', description: 'Bilingual voice-to-text automated order resolution system handling 5k calls daily.', tags: ['Chatbots', 'Voice AI'] }
    ],
    reviews: [{ brand: 'Northwind Bank', author: 'Siddharth M.', rating: 5, text: 'Vikram integrated our banking copilot securely and flawlessly. Response latency dropped 45%.', date: 'Aug 2026' }],
    packages: [
      { name: 'Agent Prototype', price: 1200, delivery: '5 days', features: ['Custom workflow agent', 'API webhook integration', 'Documentation'] },
      { name: 'Enterprise Agent Suite', price: 3600, delivery: '18 days', features: ['Multi-agent orchestration', 'Vector DB & RAG', 'Testing harness & observability'] }
    ],
    workspace: [{ project: 'Banking copilot v2', brand: 'Northwind Bank', progress: 60, due: 'Nov 05', status: 'In progress' }]
  },
  {
    slug: 'elena-rostova',
    name: 'Elena Rostova',
    role: '3D Generative & Virtual Worlds Artist',
    category: 'AI Image Generation',
    location: 'Berlin, Germany',
    cover: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    rate: 130,
    available: true,
    verified: true,
    bio: 'Pioneering generative NeRFs, 3D product visualizer environments, and cinematic spatial fashion experiences.',
    languages: ['German', 'English', 'Russian'],
    skills: [{ name: 'AI Image Generation', level: 98 }, { name: 'Fashion', level: 95 }, { name: 'Generative Film', level: 90 }],
    portfolio: [
      { id: 'e1', type: 'image', title: 'Surrealist Metaverse Architecture', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', description: 'Generative architectural environments rendered in 8K resolution for luxury real estate.', tags: ['AI Image Generation', 'Generative Film'] },
      { id: 'e2', type: 'video', title: 'Haute Couture Digital Twin Runway', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', description: 'Generative digital twin garments tailored with dynamic cloth simulation.', tags: ['Fashion', 'AI Image Generation'] }
    ],
    reviews: [{ brand: 'Kira Studio', author: 'Kenji T.', rating: 5, text: 'Elena’s 3D generative renders brought our Tokyo fashion week showcase to life with extraordinary detail.', date: 'Oct 2026' }],
    packages: [
      { name: 'Virtual Lookbook', price: 2200, delivery: '10 days', features: ['8 high-definition 3D stills', 'Interactive 360 viewer', 'Lighting variants'] },
      { name: 'Metaverse World Build', price: 6500, delivery: '25 days', features: ['Full spatial 3D set', 'Animated lighting rigs', 'Multi-camera export'] }
    ],
    workspace: [{ project: 'Tokyo virtual showroom', brand: 'Kira Studio', progress: 40, due: 'Nov 12', status: 'In progress' }]
  },
  {
    slug: 'marcus-vance',
    name: 'Marcus Vance',
    role: 'Prompt Engineer & Creative Director',
    category: 'Prompt Engineering',
    location: 'San Francisco, USA',
    cover: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    rate: 105,
    available: true,
    verified: true,
    bio: 'Leading multinational creative brand campaigns with precision prompt engineering, custom LoRAs, and multi-modal storytelling.',
    languages: ['English'],
    skills: [{ name: 'Prompt Engineering', level: 96 }, { name: 'AI Video', level: 91 }, { name: 'Voice AI', level: 85 }],
    portfolio: [
      { id: 'vnc1', type: 'project', title: 'Aura Sound & Voice Brand Identity', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', description: 'End-to-end synthetic audio brand signature with emotional voice modulation.', tags: ['Voice AI', 'Prompt Engineering'] },
      { id: 'vnc2', type: 'image', title: 'Global Retail Prompt Book & LoRA Library', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80', description: 'Comprehensive design system with 50+ calibrated prompt templates for global D2C brands.', tags: ['Prompt Engineering', 'AI Video'] }
    ],
    reviews: [{ brand: 'Orbit SaaS', author: 'Amanda K.', rating: 4.8, text: 'Marcus is a prompt wizard. Saved months of trial and error for our creative marketing campaign.', date: 'Sep 2026' }],
    packages: [
      { name: 'Creative Prompt Kit', price: 1400, delivery: '6 days', features: ['25 tuned prompt pipelines', 'Negative prompt libraries', 'Staff training workshop'] },
      { name: 'Campaign Direction Suite', price: 4200, delivery: '18 days', features: ['Multi-modal creative direction', 'Custom LoRA model training', 'Full brand style guide'] }
    ],
    workspace: [{ project: 'Q4 Brand Voice Refactor', brand: 'Orbit SaaS', progress: 50, due: 'Nov 01', status: 'In progress' }]
  }
];

// 5 Brand objects for brand directory
const allBrands = [
  {
    id: 'brand-1',
    name: 'Lumen Beauty',
    industry: 'Beauty & Personal Care',
    location: 'Mumbai, India',
    website: 'lumenbeauty.in',
    founded: '2019',
    team: '48 people',
    about: 'D2C skincare brand known for clean formulas and bold, playful campaigns across India.',
    plan: 'Growth plan',
    budget_range: '$2,000 - $6,000',
    preferred_categories: ['Voice AI', 'AI Video', 'AI Image Generation', 'Generative Film'],
    contact_email: 'brand@lumen.com',
    campaign_requirements: ['Festive generative films', 'Bilingual AI voice customer support', 'AI serum lookbooks'],
    ideas: [
      { id: 'i1', title: 'Diwali campaign film', brief: 'A 30s generative film for our festive launch, dreamy and cinematic.', skills: ['Generative Film', 'AI Video'], budget: 5000 },
      { id: 'i2', title: 'Hindi/English voice support', brief: 'A bilingual voice agent to answer order and skincare questions.', skills: ['Voice AI', 'LLM Integration', 'Chatbots'], budget: 2500 },
      { id: 'i3', title: 'AI lookbook for new serum', brief: 'Consistent-model product imagery for website and Instagram.', skills: ['AI Image Generation', 'Fashion', 'Prompt Engineering'], budget: 2000 }
    ],
    stats: [{ label: 'Campaign reach', value: '1.2M', delta: '+18%' }, { label: 'Active creators', value: '7', delta: '+2' }, { label: 'Avg. match score', value: '86%', delta: '+4%' }, { label: 'Spend this month', value: '$8,450', delta: '-6%' }],
    monthly: [{ m: 'May', v: 42 }, { m: 'Jun', v: 55 }, { m: 'Jul', v: 48 }, { m: 'Aug', v: 70 }, { m: 'Sep', v: 82 }, { m: 'Oct', v: 94 }],
    liveProjects: [{ name: 'Glow serum launch visuals', creator: 'arjun-mehta', progress: 68, due: 'Oct 22', budget: 1500 }, { name: 'Skin-quiz chatbot', creator: 'kiran-das', progress: 45, due: 'Nov 04', budget: 2000 }, { name: 'Festive teaser film', creator: 'leo-marchetti', progress: 20, due: 'Nov 15', budget: 4500 }]
  },
  {
    id: 'brand-2',
    name: 'Northwind Bank',
    industry: 'Fintech & Banking',
    location: 'London, United Kingdom',
    website: 'northwindbank.co.uk',
    founded: '2016',
    team: '240 people',
    about: 'Digital-first retail banking group modernizing financial literacy and customer support through AI agents.',
    plan: 'Enterprise plan',
    budget_range: '$5,000 - $15,000',
    preferred_categories: ['Voice AI', 'AI Agents', 'Chatbots', 'LLM Integration'],
    contact_email: 'ai-partners@northwindbank.co.uk',
    campaign_requirements: ['Multilingual conversational loan assistant', 'Enterprise security guardrails', 'Voice customer care'],
    ideas: [
      { id: 'nw1', title: 'Conversational Loan Copilot', brief: 'Secure conversational flow answering mortgage and loan questions.', skills: ['Chatbots', 'LLM Integration', 'AI Agents'], budget: 8000 },
      { id: 'nw2', title: 'Multilingual Banking Voice Agent', brief: 'Support voice agent handling verification and FAQ calls in English and Hindi.', skills: ['Voice AI', 'LLM Integration'], budget: 6000 }
    ],
    stats: [{ label: 'Customer queries solved', value: '840k', delta: '+32%' }, { label: 'AI Resolution Rate', value: '91%', delta: '+7%' }],
    monthly: [{ m: 'May', v: 60 }, { m: 'Jun', v: 72 }, { m: 'Jul', v: 80 }, { m: 'Aug', v: 85 }, { m: 'Sep', v: 91 }, { m: 'Oct', v: 96 }],
    liveProjects: [{ name: 'Loan helpline agent', creator: 'anika-rao', progress: 72, due: 'Oct 24', budget: 2400 }]
  },
  {
    id: 'brand-3',
    name: 'Zesto Foods',
    industry: 'Quick-Commerce & F&B',
    location: 'Bengaluru, India',
    website: 'zestofoods.in',
    founded: '2021',
    team: '95 people',
    about: 'Ultra-fast organic grocery and gourmet cloud kitchen brand operating across major metropolitan hubs.',
    plan: 'Growth plan',
    budget_range: '$3,000 - $8,000',
    preferred_categories: ['Voice AI', 'AI Video', 'Chatbots', 'LLM Integration'],
    contact_email: 'marketing@zestofoods.in',
    campaign_requirements: ['Regional vernacular voice order bot', 'Dynamic food video ads', 'Automated refund resolution'],
    ideas: [
      { id: 'zf1', title: 'Vernacular Grocery Voice Bot', brief: 'High-speed order status and item lookup in Hindi, Kannada and English.', skills: ['Voice AI', 'Chatbots'], budget: 4000 }
    ],
    stats: [{ label: 'Daily order chats', value: '45k', delta: '+25%' }],
    monthly: [{ m: 'May', v: 30 }, { m: 'Jun', v: 45 }, { m: 'Jul', v: 55 }, { m: 'Aug', v: 68 }, { m: 'Sep', v: 75 }, { m: 'Oct', v: 88 }],
    liveProjects: [{ name: 'Order-status voice bot', creator: 'anika-rao', progress: 35, due: 'Nov 08', budget: 2000 }]
  },
  {
    id: 'brand-4',
    name: 'Kira Studio',
    industry: 'High Fashion & Luxury',
    location: 'Tokyo, Japan',
    website: 'kirastudio.jp',
    founded: '2018',
    team: '32 people',
    about: 'Avant-garde contemporary apparel house crafting digital twins, interactive runways, and metaverse collections.',
    plan: 'Boutique Luxury plan',
    budget_range: '$4,000 - $12,000',
    preferred_categories: ['Fashion', 'AI Image Generation', 'Generative Film', 'AI Video'],
    contact_email: 'collaborations@kirastudio.jp',
    campaign_requirements: ['Consistent-model seasonal lookbooks', 'Virtual runway 3D simulation', 'Short-form social loops'],
    ideas: [
      { id: 'ks1', title: 'Virtual Runway Spring Capsule', brief: 'Hyper-detailed 3D garments on AI avatars walking digital environments.', skills: ['Fashion', 'AI Image Generation', 'Generative Film'], budget: 7500 }
    ],
    stats: [{ label: 'Lookbook engagement', value: '480k', delta: '+40%' }],
    monthly: [{ m: 'May', v: 50 }, { m: 'Jun', v: 58 }, { m: 'Jul', v: 65 }, { m: 'Aug', v: 72 }, { m: 'Sep', v: 84 }, { m: 'Oct', v: 92 }],
    liveProjects: [{ name: 'Winter capsule', creator: 'mei-tanaka', progress: 88, due: 'Oct 18', budget: 3200 }]
  },
  {
    id: 'brand-5',
    name: 'Orbit SaaS',
    industry: 'B2B Enterprise AI Platform',
    location: 'New York, USA',
    website: 'orbitsaas.ai',
    founded: '2020',
    team: '110 people',
    about: 'Workforce acceleration platform building AI copilots and automated enterprise intelligence dashboards.',
    plan: 'Scale plan',
    budget_range: '$6,000 - $20,000',
    preferred_categories: ['AI Agents', 'LLM Integration', 'Prompt Engineering', 'AI Video'],
    contact_email: 'growth@orbitsaas.ai',
    campaign_requirements: ['Autonomous outreach agent team', 'Product explainer video', 'Technical UX writing & prompt docs'],
    ideas: [
      { id: 'os1', title: 'B2B Outbound Intelligence Agent', brief: 'Autonomous agent researching prospect tech stacks and generating bespoke summaries.', skills: ['AI Agents', 'LLM Integration', 'Prompt Engineering'], budget: 9000 }
    ],
    stats: [{ label: 'Hours saved / wk', value: '450', delta: '+50%' }],
    monthly: [{ m: 'May', v: 65 }, { m: 'Jun', v: 70 }, { m: 'Jul', v: 75 }, { m: 'Aug', v: 80 }, { m: 'Sep', v: 88 }, { m: 'Oct', v: 95 }],
    liveProjects: [{ name: 'Lead qualifier agent', creator: 'sofia-alvarez', progress: 64, due: 'Oct 27', budget: 2500 }]
  }
];

if (!content.includes('zara-chen')) {
  const targetEndOfO = 'workspace:[{project:`Diwali gifting ads`,brand:`Glow Labs`,progress:20,due:`Oct 20`,status:`Kickoff`}]}]';
  if (!content.includes(targetEndOfO)) {
    console.error('Target end of o array not found!');
    process.exit(1);
  }

  const serializedNewCreators = ',' + JSON.stringify(additionalCreators).slice(1, -1);
  content = content.replace(targetEndOfO, targetEndOfO.slice(0, -1) + serializedNewCreators + ']');
}

// Add brands export if not present
if (!content.includes('HAVOC_BRANDS')) {
  content += '\nconst brandsList = ' + JSON.stringify(allBrands) + ';\n';
  content += 'export { brandsList as brands };\n';
  content += 'if (typeof window !== "undefined") { window.HAVOC_CREATORS = o; window.HAVOC_BRANDS = brandsList; }\n';
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated data-Cpnfo5Fm.js with 10 creators and 5 brands!');
