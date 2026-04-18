import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';

const tagConfig = {
  best_seller: { label: 'הכי נמכר', color: 'bg-[#F5B731] text-white' },
  new: { label: 'חדש!', color: 'bg-[#5BC5C8] text-white' },
  sale: { label: 'מבצע', color: 'bg-red-500 text-white' },
};

export default function ProductCard({ product, index = 0 }) {
  const bestDiscount = product.quantity_discounts?.length
    ? Math.max(...product.quantity_discounts.map(d => d.discount_percent))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={createPageUrl('ProductPage') + `?id=${product.id}`}
        className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.main_image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Tags */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {product.tags?.map(tag => (
              <Badge key={tag} className={`${tagConfig[tag]?.color} text-xs px-2 py-1 rounded-lg shadow-sm`}>
                {tagConfig[tag]?.label}
              </Badge>
            ))}
          </div>
          {bestDiscount > 0 && (
            <div className="absolute top-3 left-3 bg-[#B68AD8] text-white text-xs px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              עד {bestDiscount}% הנחה
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#B68AD8] transition-colors line-clamp-1">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.short_description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-[#F5B731]">₪{product.base_price}</span>
              {bestDiscount > 0 && (
                <span className="text-xs text-gray-400">/ יחידה</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}