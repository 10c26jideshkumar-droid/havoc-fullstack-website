import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/index';
import { seedMockData } from '../src/db/seed';

let app: any;
let brandToken: string;
let creatorToken: string;
let createdBriefId: string;
let creatorUserId: string;

describe('HAVOC Production API Integration Test Suite', () => {
  before(async () => {
    app = createApp();
    await seedMockData();
  });

  it('1. GET /health should return 200 OK with server health info', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');

    server.close();
  });

  it('2. POST /api/auth/signin should sign in seeded Brand (Lumen Beauty)', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'brand@lumen.com',
        password: 'Password123!',
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token);
    assert.strictEqual(data.data.user.role, 'brand');
    assert.strictEqual(data.data.user.company_name, 'Lumen Beauty');
    brandToken = data.data.token;

    server.close();
  });

  it('3. POST /api/auth/signin should sign in seeded Creator (Anika Rao)', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'anika@havoc.ai',
        password: 'Password123!',
      }),
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.token);
    assert.strictEqual(data.data.user.role, 'creator');
    creatorToken = data.data.token;
    creatorUserId = data.data.user.id;

    server.close();
  });

  it('4. GET /api/auth/me should return current creator profile with extensions', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/auth/me`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.email, 'anika@havoc.ai');
    assert.ok(data.data.creator_profile);
    assert.strictEqual(data.data.creator_profile.headline, 'Voice AI engineer');

    server.close();
  });

  it('5. GET /api/creators should filter creators by specialization (Voice AI)', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/creators?specialization=Voice%20AI`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.length >= 1);
    const anika = data.data.find((c: any) => c.full_name === 'Anika Rao');
    assert.ok(anika);
    assert.strictEqual(anika.user_id, creatorUserId);

    server.close();
  });

  it('6. GET /api/creators/:id should return complete creator details including portfolios, reviews, and packages', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/creators/${creatorUserId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.full_name, 'Anika Rao');
    assert.ok(Array.isArray(data.data.portfolios));
    assert.ok(Array.isArray(data.data.reviews));
    assert.ok(Array.isArray(data.data.packages));

    server.close();
  });

  it('7. POST /api/briefs should enforce RBAC (reject creators, allow brands)', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    // Creator attempt -> 403 Forbidden
    const forbidden = await fetch(`http://localhost:${port}/api/briefs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Brief',
        description: 'Creators cannot submit brand briefs',
        required_specializations: ['Voice AI'],
      }),
    });
    assert.strictEqual(forbidden.status, 403);

    // Brand submit brief -> 201 Created
    const res = await fetch(`http://localhost:${port}/api/briefs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandToken}`,
      },
      body: JSON.stringify({
        title: 'Autonomous Multilingual Voice Bot for Customer Success',
        description: 'Seeking a Voice AI engineer with deep LLM Integration experience to build voice support agents for customer success.',
        required_specializations: ['Voice AI', 'LLM Integration'],
        budget_range: '$3,000 - $5,000',
        max_budget: 5000,
      }),
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.id);
    createdBriefId = data.data.id;

    server.close();
  });

  it('8. POST /api/briefs/:id/match should execute AI Matching Engine with rankings and explanations', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const res = await fetch(`http://localhost:${port}/api/briefs/${createdBriefId}/match`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brandToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.length > 0);

    const topMatch = data.data[0];
    assert.strictEqual(topMatch.creator.full_name, 'Anika Rao');
    assert.ok(topMatch.match_score >= 80);
    assert.ok(topMatch.match_explanation.includes('VOICE AI'));
    assert.ok(topMatch.matched_skills.includes('voice ai'));

    server.close();
  });

  it('9. POST & GET /api/picks should save creator into brand picks and retrieve them', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    // Save pick
    const saveRes = await fetch(`http://localhost:${port}/api/picks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandToken}`,
      },
      body: JSON.stringify({
        creator_id: creatorUserId,
        note: 'Shortlisted for multilingual voice bot project',
      }),
    });

    assert.strictEqual(saveRes.status, 201);
    const saveData = await saveRes.json();
    assert.strictEqual(saveData.success, true);

    // Get picks
    const listRes = await fetch(`http://localhost:${port}/api/picks`, {
      headers: { Authorization: `Bearer ${brandToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.strictEqual(listData.success, true);
    assert.ok(listData.data.some((p: any) => p.creator_id === creatorUserId));

    server.close();
  });

  it('10. POST /api/invites should send interview invite for a project brief', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    const inviteRes = await fetch(`http://localhost:${port}/api/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandToken}`,
      },
      body: JSON.stringify({
        creator_id: creatorUserId,
        brief_id: createdBriefId,
        message: 'Hi Anika, your Voice AI work on Saathi is remarkable. We would love to interview you for our project.',
        proposed_date: '2026-10-20T14:00:00Z',
      }),
    });

    assert.strictEqual(inviteRes.status, 201);
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteData.success, true);
    assert.strictEqual(inviteData.data.status, 'pending');

    server.close();
  });
});
