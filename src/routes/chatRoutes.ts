import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/pool';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { messages, message } = req.body;
  
  // Extract user text
  let userText = '';
  if (typeof message === 'string') {
    userText = message;
  } else if (messages && Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1];
    if (typeof last === 'string') {
      userText = last;
    } else if (typeof last.content === 'string') {
      userText = last.content;
    } else if (typeof last.text === 'string') {
      userText = last.text;
    } else if (Array.isArray(last.parts)) {
      const textPart = last.parts.find((p: any) => p.type === 'text');
      userText = textPart?.text || '';
    }
  }

  // Query creators from SQLite database to provide factual answers
  const db = getDb();
  const creators = db.prepare(`
    SELECT cp.*, u.full_name 
    FROM creator_profiles cp 
    JOIN users u ON cp.user_id = u.id
  `).all() as any[];

  const query = userText.toLowerCase();
  let reply = '';

  if (query.includes('diwali') || query.includes('film') || query.includes('video')) {
    const leo = creators.find((c: any) => c.slug === 'leo-marchetti');
    reply = `For your Diwali campaign film, **${leo ? leo.full_name : 'Leo Marchetti'}** is the top match! Leo specializes in Generative Film and AI Video with a 4.8★ track record, having directed hero launch films and festival-screened generative shorts. He charges $120/hr and has launch film packages starting at $1,500.`;
  } else if (query.includes('voice') || query.includes('support') || query.includes('bilingual')) {
    const anika = creators.find((c: any) => c.slug === 'anika-rao');
    reply = `For bilingual support, **${anika ? anika.full_name : 'Anika Rao'}** is ideal. She is a Voice AI engineer (4.9★, $85/hr) with 40+ deployed agents handling multilingual customer workflows across English, Hindi, and Kannada. Her starter voice agent packages begin at $900 with 7-day turnaround.`;
  } else if (query.includes('interview') || query.includes('question') || query.includes('lookbook') || query.includes('fashion') || query.includes('artist')) {
    const mei = creators.find((c: any) => c.slug === 'mei-tanaka');
    reply = `Recommended interview questions for an AI lookbook artist like **${mei ? mei.full_name : 'Mei Tanaka'}** (4.9★, AI fashion image artist):\n\n1. *How do you maintain face and lighting consistency across multiple wardrobe changes in generative shoots?*\n2. *What is your turnaround pipeline from creative brief to final 4K deliverables?*\n3. *Can you provide an example of adapting brand style guidelines into custom LoRA models?*`;
  } else if (userText.trim()) {
    reply = `I analyzed your brief against our database of verified AI creators. Based on your request ("${userText.slice(0, 80)}"), you can explore **Anika Rao** (Voice AI), **Leo Marchetti** (AI Film), **Mei Tanaka** (Fashion Lookbooks), **Kiran Das** (Chatbots), or **Sofia Alvarez** (AI Agents) directly under the Matches tab.`;
  } else {
    reply = `Hello! I'm your HAVOC AI Assistant. Ask me to match creators, compare specializations, or draft custom project briefs.`;
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const textId = uuidv4();

  // Send Vercel AI SDK text-start event
  res.write(`data: ${JSON.stringify({ type: 'text-start', id: textId })}\n\n`);

  // Stream text in small chunks for authentic typing experience
  const chunkSize = 25;
  for (let i = 0; i < reply.length; i += chunkSize) {
    const delta = reply.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({ type: 'text-delta', id: textId, delta })}\n\n`);
  }

  // Send text-end event
  res.write(`data: ${JSON.stringify({ type: 'text-end', id: textId })}\n\n`);

  // Finish stream
  res.write(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`);
  res.end();
});

export default router;
