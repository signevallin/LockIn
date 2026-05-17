/**
 * @jest-environment node
 */

const mockTokenGet = jest.fn();
const mockDataSet = jest.fn();

jest.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: (_name: string) => ({
      doc: (_id: string) => ({
        get: mockTokenGet,
        collection: (_sub: string) => ({
          doc: (_docId: string) => ({
            set: mockDataSet,
          }),
        }),
      }),
    }),
  }),
}));

jest.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'mock-timestamp' },
}));

// Import AFTER mocks are set up
import { POST } from '@/app/api/health/sync/route';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/health/sync', () => {
  it('returns 400 when token is missing', async () => {
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ steps: 100, totalCalories: 2000, workoutMinutes: 30, date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/token/i);
  });

  it('returns 400 when metrics are missing', async () => {
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc', date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is invalid', async () => {
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'abc', steps: 100, totalCalories: 2000, workoutMinutes: 30, date: 'not-a-date' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when token is not found in Firestore', async () => {
    mockTokenGet.mockResolvedValueOnce({ exists: false });
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'bad-token', steps: 100, totalCalories: 2000, workoutMinutes: 30, date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 and writes data when token is valid', async () => {
    mockTokenGet.mockResolvedValueOnce({ exists: true, data: () => ({ uid: 'user123' }) });
    mockDataSet.mockResolvedValueOnce(undefined);
    const req = new Request('http://localhost/api/health/sync', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', steps: 8432, totalCalories: 2140, workoutMinutes: 38, date: '2026-05-17' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockDataSet).toHaveBeenCalledWith({
      steps: 8432,
      totalCalories: 2140,
      workoutMinutes: 38,
      syncedAt: 'mock-timestamp',
    });
  });
});
