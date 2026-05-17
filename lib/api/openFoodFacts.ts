export interface OpenFoodProduct {
  name: string;
  kcalPer100g: number;
  proteinPer100gG: number;
  fatPer100gG: number;
  carbsPer100gG: number;
}

export async function searchFoods(query: string): Promise<OpenFoodProduct[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?action=process&json=true` +
    `&search_terms=${encodeURIComponent(query)}` +
    `&fields=product_name,nutriments` +
    `&page_size=10`;

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Search failed');

  const data = (await res.json()) as { products?: unknown[] };

  return (data.products ?? [])
    .filter((p): p is Record<string, unknown> => {
      if (typeof p !== 'object' || p === null) return false;
      const prod = p as Record<string, unknown>;
      const n = prod.nutriments as Record<string, unknown> | undefined;
      return typeof prod.product_name === 'string' && typeof n?.['energy-kcal_100g'] === 'number';
    })
    .map((prod) => {
      const n = prod.nutriments as Record<string, number>;
      return {
        name: prod.product_name as string,
        kcalPer100g: Math.round(n['energy-kcal_100g'] ?? 0),
        proteinPer100gG: Math.round((n.proteins_100g ?? 0) * 10) / 10,
        fatPer100gG: Math.round((n.fat_100g ?? 0) * 10) / 10,
        carbsPer100gG: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      };
    });
}
