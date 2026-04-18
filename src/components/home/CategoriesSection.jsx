import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { getRootCategories } from '@/utils/categories';

const defaultCategories = [
  { name: 'מדבקות שם', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', id: '' },
  { name: 'בקבוקים ממותגים', image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', id: '' },
  { name: 'תיקים לגן', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', id: '' },
  { name: 'חולצות עם שם', image_url: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400', id: '' },
  { name: 'מתנות סוף שנה', image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238f9f1?w=400', id: '' },
  { name: 'מתנות לחגים', image_url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400', id: '' },
];

export default function CategoriesSection({ categories }) {
  const displayCategories = categories?.length > 0 ? getRootCategories(categories) : defaultCategories;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-[#FFF8E7]/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">הקטגוריות שלנו</h2>
          <p className="text-gray-500 text-lg">בחרו קטגוריה והתחילו להתאים אישית</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {displayCategories.filter(c => c.is_active !== false).map((cat, i) => (
            <motion.div
              key={cat.id || i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={createPageUrl('Catalog') + `?category=${cat.id || ''}`}
                className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={cat.image_url || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-4 md:p-6">
                  <h3 className="text-white font-bold text-lg md:text-xl">{cat.name}</h3>
                  <div className="flex items-center gap-1 text-white/80 text-sm mt-1 group-hover:text-[#F5B731] transition-colors">
                    <span>צפו במוצרים</span>
                    <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
