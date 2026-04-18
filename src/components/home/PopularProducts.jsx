import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/store/ProductCard';
import { ArrowLeft } from 'lucide-react';

export default function PopularProducts({ products }) {
  const popular = products
    ?.filter(p => p.is_active !== false)
    ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    ?.slice(0, 8) || [];

  if (popular.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">מוצרים פופולריים</h2>
            <p className="text-gray-500">המוצרים שהגננות הכי אוהבות</p>
          </div>
          <Link to={createPageUrl('Catalog')}>
            <Button variant="ghost" className="text-[#B68AD8] hover:text-[#9b6fc0] font-medium">
              כל המוצרים
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {popular.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}