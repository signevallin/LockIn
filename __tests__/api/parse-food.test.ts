/**
 * @jest-environment node
 */

import { POST } from '@/app/api/ai/parse-food/route';

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: 'Kycklingfilé med ris och sallad',
                kcalPer100g: 145,
                proteinPer100gG: 14.2,
                fatPer100gG: 3.1,
                carbsPer100gG: 15.8,
              }),
            },
          ],
        }),
      },
    })),
  };
});

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/ai/parse-food', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/ai/parse-food', () => {
  it('returnerar makron för en giltig beskrivning', async () => {
    const res = await POST(makeRequest({ description: 'kycklingfilé med ris' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('Kycklingfilé med ris och sallad');
    expect(typeof data.kcalPer100g).toBe('number');
    expect(typeof data.proteinPer100gG).toBe('number');
    expect(typeof data.fatPer100gG).toBe('number');
    expect(typeof data.carbsPer100gG).toBe('number');
  });

  it('returnerar 400 om description saknas', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returnerar 400 om description är tom sträng', async () => {
    const res = await POST(makeRequest({ description: '   ' }));
    expect(res.status).toBe(400);
  });

  it('returnerar 400 vid ogiltig JSON', async () => {
    const req = new Request('http://localhost/api/ai/parse-food', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
