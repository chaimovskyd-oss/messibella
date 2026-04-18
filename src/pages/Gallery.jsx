import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGalleryItems } from '@/data/store';

export default function Gallery() {
  const { data: items = [] } = useQuery({
    queryKey: ['gallery-items'],
    queryFn: getGalleryItems,
    initialData: [],
  });

  const visibleItems = items
    .filter(item => item.is_active !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">גלריה</h1>
        <p className="text-gray-500 mt-3">דוגמאות לעבודות, עיצובים ומוצרים שכבר הכנו.</p>
      </div>

      {visibleItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 text-center py-20 text-gray-400">
          הגלריה עדיין ריקה. אפשר להעלות תמונות חדשות מתוך הניהול.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {visibleItems.map(item => (
            <div key={item.id} className="break-inside-avoid overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
              <img src={item.image_url} alt={item.title || 'Gallery item'} className="w-full object-cover" />
              {(item.title || item.caption) && (
                <div className="p-4">
                  {item.title && <h2 className="font-bold text-gray-900">{item.title}</h2>}
                  {item.caption && <p className="text-sm text-gray-500 mt-1">{item.caption}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
