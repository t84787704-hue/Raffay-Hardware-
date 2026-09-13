import React from 'react';
import { CategoriesGrid } from './CategoriesGrid';
import { Category } from '../types';

interface HomePageProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onViewCategorySKUs?: (category: Category) => void;
  onOpenQuoteModalWithCategory?: (categoryName: string) => void;
}

/**
 * Main Storefront HomePage
 * Renders Categories grid (165-Degree Hinges, locks, handles, etc.)
 */
export function HomePage({
  selectedCategory,
  onSelectCategory,
  onViewCategorySKUs,
  onOpenQuoteModalWithCategory
}: HomePageProps) {
  return (
    <div className="w-full">
      {/* Categories Grid (165-degree hinges, mortise locks, etc.) */}
      <CategoriesGrid
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        onViewCategorySKUs={onViewCategorySKUs}
        onOpenQuoteModalWithCategory={onOpenQuoteModalWithCategory}
      />
    </div>
  );
}

export default HomePage;
