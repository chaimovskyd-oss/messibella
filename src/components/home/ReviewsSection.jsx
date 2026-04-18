import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReviewsSection({ reviews }) {
  const displayReviews = reviews?.length > 0 ? reviews : [
    { id: '1', reviewer_name: 'שירה כ.', rating: 5, text: 'הזמנתי מדבקות שם לכל ילדי הגן – איכות מדהימה והילדים התלהבו!', created_date: '2026-01-15' },
    { id: '2', reviewer_name: 'מיכל ל.', rating: 5, text: 'בקבוקים ממותגים עם שם כל ילד, השירות היה מהיר ומקצועי', created_date: '2026-02-03' },
    { id: '3', reviewer_name: 'רונית ד.', rating: 5, text: 'כבר השנה השלישית שאני מזמינה מתנות סוף שנה – תמיד מרוצה!', created_date: '2026-02-20' },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-[#F3E8FF]/30 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">מה הגננות אומרות</h2>
          <p className="text-gray-500 text-lg">אלפי גננות כבר בחרו במסיבלה</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {displayReviews.slice(0, 6).map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`w-5 h-5 ${j < review.rating ? 'fill-[#F5B731] text-[#F5B731]' : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#B68AD8]/20 flex items-center justify-center text-[#B68AD8] font-bold">
                  {review.reviewer_name?.[0]}
                </div>
                <span className="font-medium text-gray-900">{review.reviewer_name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}