# Kiểm thử (Testing)

Hướng dẫn này giải thích cách viết và chạy tests trong VizTeckStack — từ unit tests đến E2E tests.

---

## Tổng quan: 3 loại test, 3 framework

| Package | Framework | File pattern | Chạy khi |
|---------|-----------|-------------|----------|
| `apps/admin` | Vitest + Testing Library | `src/**/*.spec.tsx` | `pnpm --filter @vizteck/admin test` |
| `apps/api-gateway` | Jest + ts-jest | `src/**/*.spec.ts` | `pnpm --filter @vizteck/api-gateway test` |
| `apps/svc-roadmap` | Jest + ts-jest | `src/**/*.spec.ts` | `pnpm --filter @vizteck/svc-roadmap test` |
| `apps/e2e` | Playwright | `tests/**/*.spec.ts` | `pnpm --filter @vizteck/e2e test:e2e` |

```
pnpm test     → chạy Vitest + Jest (tất cả unit tests)
               ← KHÔNG bao gồm E2E Playwright
```

---

## Unit tests: apps/admin (Vitest)

Admin dùng **Vitest** + **@testing-library/react** cho React components và hooks.

### Chạy tests

```bash
# Chạy một lần (dùng trong CI)
pnpm --filter @vizteck/admin test

# Watch mode (dùng trong khi phát triển)
pnpm --filter @vizteck/admin test -- --watch
# hoặc
pnpm --filter @vizteck/admin test:watch
```

### Đặt file test ở đâu?

Test file đặt cạnh file source:
```
src/features/roadmaps/
  services/roadmap.service.ts
  services/roadmap.service.spec.ts    ← test file ở đây
  hooks/useRoadmaps.ts
  hooks/useRoadmaps.spec.ts           ← test file ở đây
```

### Viết test cho hooks

```typescript
// src/features/roadmaps/hooks/useRoadmaps.spec.ts
import { renderHook, act } from '@testing-library/react';
import { useRoadmaps } from './useRoadmaps';

// Mock service dependencies
vi.mock('../services/roadmap.service', () => ({
  fetchRoadmaps: vi.fn().mockResolvedValue([
    { id: '1', slug: 'frontend', title: 'Frontend', status: 'PUBLIC' }
  ]),
}));

describe('useRoadmaps', () => {
  it('loads roadmap list on mount', async () => {
    const { result } = renderHook(() => useRoadmaps());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {}); // chờ async effects
    
    expect(result.current.loading).toBe(false);
    expect(result.current.roadmaps).toHaveLength(1);
    expect(result.current.roadmaps[0].slug).toBe('frontend');
  });
});
```

---

## Unit tests: apps/api-gateway (Jest)

API gateway dùng **Jest** + **ts-jest** kết hợp với NestJS Testing Module.

### Chạy tests

```bash
pnpm --filter @vizteck/api-gateway test
```

### Pattern: Mock gRPC client

```typescript
// apps/api-gateway/src/roadmap/roadmap.resolver.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapResolver } from './roadmap.resolver';
import { RoadmapGrpcClient } from './roadmap.grpc-client';

const mockClient = {
  getRoadmaps: jest.fn().mockResolvedValue({
    roadmaps: [{ id: '1', slug: 'frontend', title: 'Frontend' }]
  }),
  getRoadmap: jest.fn().mockResolvedValue({
    roadmap: { id: '1', slug: 'frontend', title: 'Frontend' },
    nodes: [],
    edges: [],
  }),
};

describe('RoadmapResolver', () => {
  let resolver: RoadmapResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapResolver,
        { provide: RoadmapGrpcClient, useValue: mockClient },  // inject mock
      ],
    }).compile();
    resolver = module.get<RoadmapResolver>(RoadmapResolver);
  });

  it('roadmaps() trả về mảng', async () => {
    const result = await resolver.roadmaps();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('frontend');
  });

  it('roadmap(slug) trả về chi tiết', async () => {
    const result = await resolver.roadmap('frontend');
    expect(result.roadmap?.slug).toBe('frontend');
    expect(result.nodes).toHaveLength(0);
  });
});
```

---

## Unit tests: apps/svc-roadmap (Jest)

svc-roadmap dùng **Jest** + **ts-jest** với Prisma được mock ở module level.

### Chạy tests

```bash
pnpm --filter @vizteck/svc-roadmap test
```

### Lưu ý quan trọng: Prisma mock

svc-roadmap PHẢI mock `@vizteck/db` ở đầu file test. Nếu không, Prisma sẽ cố kết nối database thật trong unit test.

```typescript
// apps/svc-roadmap/src/roadmap/roadmap.service.spec.ts

// Mock PHẢI đặt TRƯỚC import db
jest.mock('@vizteck/db', () => ({
  ...jest.requireActual('@vizteck/db'),
  db: {
    roadmap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    node: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    edge: {},
    $transaction: jest.fn(),
  },
}));

import { db } from '@vizteck/db';  // import SAU mock
import { Test, TestingModule } from '@nestjs/testing';
import { RoadmapService } from './roadmap.service';

describe('RoadmapService', () => {
  let service: RoadmapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoadmapService],
    }).compile();
    service = module.get<RoadmapService>(RoadmapService);
    jest.clearAllMocks();  // reset mock data giữa các tests
  });

  it('getRoadmaps trả về danh sách', async () => {
    (db.roadmap.findMany as jest.Mock).mockResolvedValue([
      { id: 'r1', slug: 'frontend', title: 'Frontend', description: null, coverImage: null },
    ]);
    
    const result = await service.getRoadmaps({});
    
    expect(result.roadmaps).toHaveLength(1);
    expect(result.roadmaps[0].slug).toBe('frontend');
  });
});
```

### Tại sao cần `moduleNameMapper`?

`apps/svc-roadmap/package.json` có cấu hình đặc biệt:

```json
"jest": {
  "moduleNameMapper": {
    "@prisma/client": "<rootDir>/../../packages/db/node_modules/@prisma/client"
  }
}
```

**Lý do:** pnpm dùng strict isolation, dẫn đến service và test load hai instance `PrismaClientKnownRequestError` khác nhau. `instanceof` check sẽ luôn trả về `false` dẫn đến lỗi không xử lý được. Mapper này pin về cùng một instance.

Nếu `packages/db` upgrade Prisma version, cần cập nhật đường dẫn này.

---

## E2E tests: apps/e2e (Playwright)

Playwright test toàn bộ user flows qua browser thật, cần tất cả services đang chạy.

### Yêu cầu

**Trước khi chạy E2E, khởi động tất cả apps:**
```bash
pnpm dev    # chờ đến khi thấy output từ cả 4 services
```

### Chạy tests

```bash
# Headless (không hiện browser, chạy nhanh)
pnpm --filter @vizteck/e2e test:e2e

# Interactive UI mode (Playwright UI, để debug)
pnpm --filter @vizteck/e2e test:ui

# Headed (hiện browser, thấy được gì đang chạy)
pnpm --filter @vizteck/e2e test:headed

# Xem report sau khi chạy
pnpm --filter @vizteck/e2e test:report
```

### Cấu trúc tests E2E

```
apps/e2e/tests/
  admin.spec.ts   → test admin panel (login, CRUD roadmaps, graph editor)
  api.spec.ts     → test REST API endpoints trực tiếp
  web.spec.ts     → test public roadmap viewer
```

### Ví dụ từ codebase thực tế

```typescript
// apps/e2e/tests/admin.spec.ts
import { test, expect, type Page } from '@playwright/test';

const ADMIN_TOKEN = 'supersecret';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.locator('#admin-token').fill(ADMIN_TOKEN);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/roadmaps$/, { timeout: 8000 });
}

test.describe('Admin — Login', () => {
  test('login page hiển thị token input', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#admin-token')).toBeVisible();
  });

  test('token sai hiển thị lỗi', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#admin-token').fill('wrongtoken');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Invalid token')).toBeVisible({ timeout: 8000 });
  });

  test('token đúng redirect về /roadmaps', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/roadmaps$/);
  });
});
```

---

## Chạy tất cả unit tests cùng lúc

```bash
pnpm test
```

Lệnh này chạy **Vitest + Jest** cho tất cả packages. `apps/e2e` tự exclude bằng cách thay lệnh `test` thành echo message:

```
apps/e2e: e2e tests skipped in unit test run — use pnpm test:e2e with apps running
```

**CI cũng dùng `pnpm test`** — nên nếu pass local sẽ pass trên CI.

---

## Best practices khi viết test

### 1. Đặt tên test rõ ràng

```typescript
// ❌ Không rõ
it('works', () => {});
it('test 1', () => {});

// ✅ Rõ ràng: subject + action + expected result
it('getRoadmaps trả về mảng rỗng khi database không có roadmap', () => {});
it('login page redirect về /roadmaps khi token đúng', () => {});
```

### 2. Arrange / Act / Assert pattern

```typescript
it('updateNodeContent cập nhật nội dung và trả về node mới', async () => {
  // Arrange — chuẩn bị dữ liệu
  (db.node.findUnique as jest.Mock).mockResolvedValue({
    id: 'n1', type: 'LESSON', roadmapId: 'r1',
  });
  (db.node.update as jest.Mock).mockResolvedValue({
    id: 'n1', type: 'LESSON', content: '{"blocks":[]}',
  });

  // Act — thực hiện action
  const result = await service.updateNodeContent({
    id: 'n1',
    content: '{"blocks":[]}',
  });

  // Assert — kiểm tra kết quả
  expect(db.node.update).toHaveBeenCalledWith({
    where: { id: 'n1' },
    data: { content: '{"blocks":[]}' },
  });
  expect(result.node?.content).toBe('{"blocks":[]}');
});
```

### 3. Mock ở đúng level

- **Unit test:** Mock dependencies (Prisma, gRPC client) — test logic thuần
- **E2E test:** Không mock — test flow thực tế qua browser

### 4. `jest.clearAllMocks()` trong `beforeEach`

Luôn clear mocks trước mỗi test để tránh state rò rỉ giữa các tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Xử lý lỗi thường gặp

**`instanceof PrismaClientKnownRequestError` luôn trả về false trong svc-roadmap tests**
Kiểm tra `moduleNameMapper` trong `apps/svc-roadmap/package.json` trỏ đúng version Prisma trong `packages/db/node_modules`.

**E2E fail: "Connection refused" hoặc timeout**
Apps chưa khởi động. Chạy `pnpm dev` và đợi output đầy đủ từ tất cả 4 services rồi mới chạy E2E.

**Vitest "Cannot find module @vizteck/..."**
Chạy `pnpm install` từ root để đảm bảo workspace links được thiết lập đúng.

**Jest test fail "SyntaxError: Cannot use import statement"**
ts-jest chưa được cấu hình đúng. Kiểm tra `jest.config.js` trong package đó có `transform: { '.ts': 'ts-jest' }`.

**E2E: admin test dùng hardcoded `ROADMAP_ID`**
E2E tests dùng seed data cố định — đảm bảo đã chạy `db:seed` trước. Nếu seed data thay đổi, cần cập nhật ID trong test files.

---

## Liên quan

- [Quy trình làm việc hàng ngày](./daily-workflow.md) — chạy tests trước khi push
- [CI/CD Pipeline](./cicd.md) — CI chạy `pnpm test`, không chạy E2E
- [Bắt đầu với VizTeckStack](./getting-started.md) — setup môi trường local để chạy E2E
