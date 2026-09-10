import React from 'react';
import { FeaturedProductsCarousel } from './FeaturedProductsCarousel';
import { CategoriesGrid } from './CategoriesGrid';
import { Category, ProductItem } from '../types';

interface HomePageProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onViewCategorySKUs?: (category: Category) => void;
  onSelectProduct?: (product: ProductItem) => void;
  onOpenQuoteModalWithCategory?: (categoryName: string) => void;
}

/**
 * Main Storefront HomePage
 * Renders FeaturedProductsCarousel RIGHT AFTER header/search bar
 * and BEFORE the categories grid (165-Degree Hinges section).
 */
export function HomePage({
  selectedCategory,
  onSelectCategory,
  onViewCategorySKUs,
  onSelectProduct,
  onOpenQuoteModalWithCategory
}: HomePageProps) {
  return (
    <div className="w-full">
      {/* 1. Auto-scrolling Featured Products Carousel */}
      <FeaturedProductsCarousel 
        onSelectProduct={(product) => {
          if (onSelectProduct) onSelectProduct(product);
        }}
      />

      {/* 2. Categories Grid (165-degree hinges, mortise locks, etc.) */}
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
