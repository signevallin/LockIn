/**
 * @jest-environment node
 */

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import { searchFoods } from '@/lib/api/openFoodFacts';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('searchFoods', () => {
  it('returns parsed products from API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [
          {
            product_name: 'Havregrynsgröt',
            nutriments: {
              'energy-kcal_100g': 362,
              proteins_100g: 13.0,
              fat_100g: 6.9,
              carbohydrates_100g: 60.0,
            },
          },
          {
            product_name: 'Produkt utan kcal',
            nutriments: {},
          },
        ],
      }),
    });

    const results = await searchFoods('havre');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      name: 'Havregrynsgröt',
      kcalPer100g: 362,
      proteinPer100gG: 13.0,
      fatPer100gG: 6.9,
      carbsPer100gG: 60.0,
    });
  });

  it('returns empty array when API returns no products', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    });

    const results = await searchFoods('xyznotexist');
    expect(results).toEqual([]);
  });

  it('throws when API returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(searchFoods('anything')).rejects.toThrow('Search failed');
  });
});
