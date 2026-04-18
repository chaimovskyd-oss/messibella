import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { getReviews } from '@/data/store';

export default function Testimonials() {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: getReviews,
    initialData: [],
  });

  const approvedReviews = reviews
    .filter(review => review.is_approved !== false)
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">מה לקוחות אומרים עלינו</h1>
        <p className="text-gray-500 mt-3">חוות דעת, תמונות והמלצות מלקוחות שכבר הזמינו.</p>
      </div>

      {approvedReviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 text-center py-20 text-gray-400">
          עדיין אין כאן ביקורות מפורסמות.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {approvedReviews.map(review => (
            <div key={review.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-lg text-gray-900">{review.reviewer_name || 'לקוח/ה'}</h2>
                  {review.created_date && <p className="text-xs text-gray-400">{new Date(review.created_date).toLocaleDateString('he-IL')}</p>}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`w-4 h-4 ${index < (review.rating || 5) ? 'fill-[#F5B731] text-[#F5B731]' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              {review.image_url && (
                <img src={review.image_url} alt={review.reviewer_name || 'Review'} className="w-full h-56 object-cover rounded-2xl mb-4" />
              )}
              <p className="text-gray-700 leading-7 whitespace-pre-line">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
