import { UpdateNodeContentUseCase } from './node/update-node-content.use-case';
import { UpdateNodeCoverUseCase } from './node/update-node-cover.use-case';
import { UpdateNodeIconUseCase } from './node/update-node-icon.use-case';
import { SearchNodesUseCase } from './roadmap/search-nodes.use-case';

const makeNode = (overrides = {}) => ({
  id: 'n1', roadmapId: 'r1', type: 'LESSON' as const, title: 'x',
  positionX: null, positionY: null, targetRoadmapId: null,
  content: null, coverImage: null, icon: null, updatedAt: new Date(),
  ...overrides,
});

const makeRepo = (overrides = {}) => ({
  findAll: jest.fn(),
  findBySlug: jest.fn(),
  findNodeById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  upsertGraph: jest.fn(),
  updateNodeField: jest.fn(),
  getNodeBreadcrumb: jest.fn(),
  getRoadmapTree: jest.fn(),
  searchNodes: jest.fn(),
  ...overrides,
});

// ─── UpdateNodeContentUseCase ────────────────────────────────────────────────

describe('UpdateNodeContentUseCase', () => {
  it('parses JSON string before passing to repo', async () => {
    const content = [{ type: 'paragraph', content: [] }];
    const node = makeNode({ content });
    const repo = makeRepo({ updateNodeField: jest.fn().mockResolvedValue(node) });
    const uc = new UpdateNodeContentUseCase(repo as any);

    await uc.execute('n1', JSON.stringify(content));

    expect(repo.updateNodeField).toHaveBeenCalledWith('n1', { content });
  });

  it('passes null when content is empty string', async () => {
    const node = makeNode();
    const repo = makeRepo({ updateNodeField: jest.fn().mockResolvedValue(node) });
    const uc = new UpdateNodeContentUseCase(repo as any);

    await uc.execute('n1', '');

    expect(repo.updateNodeField).toHaveBeenCalledWith('n1', { content: null });
  });
});

// ─── UpdateNodeCoverUseCase ──────────────────────────────────────────────────

describe('UpdateNodeCoverUseCase', () => {
  it('passes coverImage URL to repo', async () => {
    const node = makeNode({ coverImage: 'https://cdn.example.com/cover.jpg' });
    const repo = makeRepo({ updateNodeField: jest.fn().mockResolvedValue(node) });
    const uc = new UpdateNodeCoverUseCase(repo as any);

    await uc.execute('n1', 'https://cdn.example.com/cover.jpg');

    expect(repo.updateNodeField).toHaveBeenCalledWith('n1', { coverImage: 'https://cdn.example.com/cover.jpg' });
  });

  it('passes null when coverImage is empty string', async () => {
    const node = makeNode();
    const repo = makeRepo({ updateNodeField: jest.fn().mockResolvedValue(node) });
    const uc = new UpdateNodeCoverUseCase(repo as any);

    await uc.execute('n1', '');

    expect(repo.updateNodeField).toHaveBeenCalledWith('n1', { coverImage: null });
  });
});

// ─── UpdateNodeIconUseCase ───────────────────────────────────────────────────

describe('UpdateNodeIconUseCase', () => {
  it('passes icon emoji to repo', async () => {
    const node = makeNode({ icon: '⚡' });
    const repo = makeRepo({ updateNodeField: jest.fn().mockResolvedValue(node) });
    const uc = new UpdateNodeIconUseCase(repo as any);

    await uc.execute('n1', '⚡');

    expect(repo.updateNodeField).toHaveBeenCalledWith('n1', { icon: '⚡' });
  });

  it('passes null when icon is empty string', async () => {
    const node = makeNode();
    const repo = makeRepo({ updateNodeField: jest.fn().mockResolvedValue(node) });
    const uc = new UpdateNodeIconUseCase(repo as any);

    await uc.execute('n1', '');

    expect(repo.updateNodeField).toHaveBeenCalledWith('n1', { icon: null });
  });
});

// ─── SearchNodesUseCase ──────────────────────────────────────────────────────

describe('SearchNodesUseCase', () => {
  const makeResult = (roadmapId: string) => ({
    id: 'n1', type: 'LESSON' as const, title: 'HTML', icon: null, coverImage: null,
    roadmapSlug: 'frontend', roadmapTitle: 'Frontend',
    roadmapId, updatedAt: new Date(), breadcrumb: ['Frontend', 'HTML'],
  });

  it('returns all results when isAdmin=true (no filter)', async () => {
    const results = [makeResult('r1'), makeResult('r2')];
    const repo = makeRepo({ searchNodes: jest.fn().mockResolvedValue(results) });
    const uc = new SearchNodesUseCase(repo as any);

    const output = await uc.execute({ q: 'HTML', titleOnly: false }, true);

    expect(output).toHaveLength(2);
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('filters to PUBLIC roadmaps only when isAdmin=false', async () => {
    const results = [makeResult('r1'), makeResult('r2')];
    const roadmaps = [
      { id: 'r1', status: 'PUBLIC', slug: 'a', title: 'A', description: null, coverImage: null, createdAt: new Date() },
      { id: 'r2', status: 'DRAFT',  slug: 'b', title: 'B', description: null, coverImage: null, createdAt: new Date() },
    ];
    const repo = makeRepo({
      searchNodes: jest.fn().mockResolvedValue(results),
      findAll: jest.fn().mockResolvedValue(roadmaps),
    });
    const uc = new SearchNodesUseCase(repo as any);

    const output = await uc.execute({ q: 'HTML', titleOnly: false }, false);

    expect(output).toHaveLength(1);
    expect(output[0].roadmapId).toBe('r1');
  });

  it('returns empty array when no PUBLIC roadmaps match', async () => {
    const results = [makeResult('r2')];
    const roadmaps = [
      { id: 'r1', status: 'PUBLIC', slug: 'a', title: 'A', description: null, coverImage: null, createdAt: new Date() },
    ];
    const repo = makeRepo({
      searchNodes: jest.fn().mockResolvedValue(results),
      findAll: jest.fn().mockResolvedValue(roadmaps),
    });
    const uc = new SearchNodesUseCase(repo as any);

    const output = await uc.execute({ q: 'HTML', titleOnly: false }, false);

    expect(output).toHaveLength(0);
  });
});
