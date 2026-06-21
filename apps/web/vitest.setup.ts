import { vi } from 'vitest';

// Provide process.env defaults so services resolve the API base URL in tests
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
