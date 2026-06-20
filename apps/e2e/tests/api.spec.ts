import { test, expect } from '@playwright/test';

const ADMIN_TOKEN = 'supersecret';

test.describe('API Gateway — REST', () => {
  test('GET /api/roadmaps returns roadmap list', async ({ request }) => {
    const res = await request.get('/api/roadmaps');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('roadmaps');
    expect(Array.isArray(body.roadmaps)).toBe(true);
    expect(body.roadmaps.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/roadmaps roadmap items have required fields', async ({ request }) => {
    const res = await request.get('/api/roadmaps');
    const body = await res.json();
    for (const rm of body.roadmaps) {
      expect(rm).toHaveProperty('id');
      expect(rm).toHaveProperty('slug');
      expect(rm).toHaveProperty('title');
    }
  });

  test('POST /api/roadmaps requires admin token', async ({ request }) => {
    const res = await request.post('/api/roadmaps', {
      data: { title: 'Test', slug: 'test', description: '' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/roadmaps creates with valid token', async ({ request }) => {
    const res = await request.post('/api/roadmaps', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      data: { title: 'PW Test Roadmap', slug: 'pw-test-' + Date.now(), description: 'Created by Playwright' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');

    // Cleanup
    if (body.id) {
      await request.delete(`/api/roadmaps/${body.id}`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
    }
  });

  test('DELETE non-existent roadmap returns 404', async ({ request }) => {
    const res = await request.delete('/api/roadmaps/nonexistent-id', {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(res.status()).toBe(404);
  });
});

test.describe('API Gateway — GraphQL', () => {
  const gql = (query: string) =>
    JSON.stringify({ query });

  test('introspection is available', async ({ request }) => {
    const res = await request.post('/graphql', {
      headers: { 'Content-Type': 'application/json' },
      data: gql('{ __schema { queryType { name } } }'),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.__schema.queryType.name).toBe('Query');
  });

  test('roadmaps query returns list', async ({ request }) => {
    const res = await request.post('/graphql', {
      headers: { 'Content-Type': 'application/json' },
      data: gql('{ roadmaps { slug title description } }'),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.errors).toBeUndefined();
    expect(Array.isArray(body.data.roadmaps)).toBe(true);
    expect(body.data.roadmaps.length).toBeGreaterThanOrEqual(3);
  });

  test('roadmap query returns nodes without type field (NodeType enum bug)', async ({ request }) => {
    // Querying `type` on NodeDto currently crashes with:
    // "Enum "NodeType" cannot represent value: 0"
    // This test documents the bug — it should NOT throw when querying id + title only.
    const res = await request.post('/graphql', {
      headers: { 'Content-Type': 'application/json' },
      data: gql('{ roadmap(slug: "frontend") { nodes { id title } } }'),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.errors).toBeUndefined();
    expect(Array.isArray(body.data.roadmap.nodes)).toBe(true);
  });

  test('NodeType enum serializes correctly for all node types', async ({ request }) => {
    // Regression: proto sends 0/1 numerics, GraphQL enum expects "ROADMAP"/"LESSON" strings.
    // normalizeNodeType() in the resolver bridges the gap.
    const res = await request.post('/graphql', {
      headers: { 'Content-Type': 'application/json' },
      data: gql('{ roadmap(slug: "frontend") { nodes { id title type } } }'),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.errors).toBeUndefined();
    for (const node of body.data.roadmap.nodes) {
      expect(['ROADMAP', 'LESSON']).toContain(node.type);
    }
  });
});
