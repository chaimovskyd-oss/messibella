import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/store/ProductCard';
import ProductFilters from '@/components/store/ProductFilters';
import { Loader2 } from 'lucide-react';
import { getDescendantCategoryIds } from '@/utils/categories';
import { getCategories, getProducts } from '@/data/store';

export default function Catalog() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showSale, setShowSale] = useState(false);
  const [showPopular, setShowPopular] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => getProducts(),
    initialData: [],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => getCategories(),
    initialData: [],
  });

  const filtered = useMemo(() => {
    let result = products.filter(p => p.is_active !== false);

    if (selectedCategory !== 'all') {
      const allowedCategoryIds = new Set(getDescendantCategoryIds(categories, selectedCategory));
      result = result.filter(p => allowedCategoryIds.has(p.category_id));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q)
      );
    }

    if (showSale) result = result.filter(p => p.tags?.includes('sale'));
    if (showPopular) result = result.filter(p => p.tags?.includes('best_seller'));

    switch (sortBy) {
      case 'price_low': result.sort((a, b) => a.base_price - b.base_price); break;
      case 'price_high': result.sort((a, b) => b.base_price - a.base_price); break;
      case 'newest': result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)); break;
      default: result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return result;
  }, [products, categories, selectedCategory, searchQuery, sortBy, showSale, showPopular]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-l from-[#FFF8E7] to-[#F3E8FF] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">המוצרים שלנו</h1>
          <p className="text-gray-600 text-lg">בחרו, התאימו אישית, והזמינו לכל הגן</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductFilters
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showSale={showSale}
          setShowSale={setShowSale}
          showPopular={showPopular}
          setShowPopular={setShowPopular}
        />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">לא נמצאו מוצרים</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-4">{filtered.length} מוצרים</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
