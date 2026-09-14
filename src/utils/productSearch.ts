import { useMemo, useState, useEffect } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';
import { ProductItem } from '../types';

/**
 * Generates search keywords including common Hindi/Urdu/English colloquialisms and typos
 * E.g.:
 * - 'gat lok' / 'gate lock' -> for gate locks, mortise handles, padlocks, aldrops
 * - 'kichen' / 'kitchen' -> for kitchen accessories, pantry baskets, magic corners
 * - 'parde stoper' / 'parda stopper' -> for door stoppers, magnetic stoppers, curtain/spider fittings
 */
export function getProductSearchKeywords(product: ProductItem): string {
  const parts: string[] = [
    product.name || '',
    product.productName || '',
    product.sku || '',
    product.categoryName || '',
    product.category || '',
    ...(product.tags || []),
    product.material || '',
    product.finish || '',
    product.sizeOrSpec || '',
    product.description || ''
  ];
  
  const text = parts.join(' ').toLowerCase();
  const synonyms: string[] = [];

  // Gate Lock / Mortise / Door Locks
  if (
    text.includes('gate') ||
    text.includes('lock') ||
    text.includes('mortise') ||
    text.includes('aldrop') ||
    text.includes('padlock') ||
    text.includes('cylinder') ||
    text.includes('handle lock')
  ) {
    synonyms.push('gat lok', 'gate lock', 'gate lok', 'gat lock', 'door lock', 'mortise lock', 'lok');
  }

  // Kitchen Accessories
  if (
    text.includes('kitchen') ||
    text.includes('pantry') ||
    text.includes('basket') ||
    text.includes('cutlery') ||
    text.includes('dish rack') ||
    text.includes('corner')
  ) {
    synonyms.push('kichen', 'kitchen', 'kichen basket', 'kitchen accessories', 'rasoi');
  }

  // Door Stopper / Parde Stopper
  if (
    text.includes('stopper') ||
    text.includes('magnetic') ||
    text.includes('door stop') ||
    text.includes('floor mount') ||
    text.includes('curtain') ||
    text.includes('spider')
  ) {
    synonyms.push('parde stoper', 'parda stopper', 'parde stopper', 'door stopper', 'curtain stopper', 'stoper', 'parda', 'dore stoper');
  }

  return synonyms.join(' ');
}

export interface PreparedSearchItem extends ProductItem {
  searchKeywords: string;
}

/**
 * Creates and memoizes a Fuse.js instance configured with threshold 0.4 for typo tolerance
 */
export function createProductFuse(products: ProductItem[]) {
  const prepared: PreparedSearchItem[] = products.map((p) => ({
    ...p,
    searchKeywords: getProductSearchKeywords(p)
  }));

  const options: IFuseOptions<PreparedSearchItem> = {
    threshold: 0.4, // Typo tolerant threshold per user requirement
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'searchKeywords', weight: 0.35 },
      { name: 'name', weight: 0.35 },
      { name: 'productName', weight: 0.35 },
      { name: 'sku', weight: 0.3 },
      { name: 'categoryName', weight: 0.2 },
      { name: 'category', weight: 0.2 },
      { name: 'tags', weight: 0.25 },
      { name: 'material', weight: 0.15 },
      { name: 'finish', weight: 0.15 }
    ]
  };

  return new Fuse(prepared, options);
}

/**
 * Executes fuzzy search with Fuse.js, handling phrase and token fallback
 */
export function searchProductsWithFuse(
  fuse: Fuse<PreparedSearchItem>, 
  query: string, 
  allProducts: ProductItem[]
): ProductItem[] {
  const q = query.trim();
  if (!q) return [];

  // 1. Full phrase Fuse search
  const directResults = fuse.search(q);
  if (directResults.length > 0) {
    return directResults.map(r => r.item);
  }

  // 2. Multi-word token search (e.g. 'gat lok', 'parde stoper')
  const words = q.split(/\s+/).filter(w => w.length >= 2);
  if (words.length > 1) {
    const scoreMap = new Map<string, { product: ProductItem; score: number }>();
    
    words.forEach(word => {
      const res = fuse.search(word);
      res.forEach(r => {
        const existing = scoreMap.get(r.item.id);
        const matchScore = 1 - (r.score ?? 0.4);
        if (existing) {
          existing.score += matchScore;
        } else {
          scoreMap.set(r.item.id, { product: r.item, score: matchScore });
        }
      });
    });

    if (scoreMap.size > 0) {
      return Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score)
        .map(x => x.product);
    }
  }

  // 3. Fallback standard substring search
  const lowerQ = q.toLowerCase();
  return allProducts.filter(p => {
    const combined = `${p.name} ${p.productName || ''} ${p.sku || ''} ${p.categoryName || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
    return combined.includes(lowerQ);
  });
}

/**
 * Custom React hook for debounced 200ms Fuse.js product search
 */
export function useProductSearch(products: ProductItem[], query: string, debounceMs: number = 200) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  const fuse = useMemo(() => {
    return createProductFuse(products);
  }, [products]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchProductsWithFuse(fuse, debouncedQuery, products);
  }, [fuse, debouncedQuery, products]);

  return {
    debouncedQuery,
    results
  };
}
