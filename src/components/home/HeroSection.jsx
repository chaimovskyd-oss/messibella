import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ banners }) {
  const heroBanner = banners?.find(b => b.type === 'hero' && b.is_active) || {
    title: 'מתנות ממותגות לכל ילדי הגן – תוך דקות',
    subtitle: 'מדבקות שם, בקבוקים, תיקים, חולצות ועוד – עם שם הילד ועיצוב מושלם',
    image_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200',
    button_text: 'צפו במוצרים',
    button_link: 'Catalog'
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-[#FFF8E7] via-white to-[#F3E8FF]">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-[#F5B731]/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#B68AD8]/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-[#F9A8C9]/20 rounded-full blur-lg"></div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-right"
          >
            <div className="inline-flex items-center gap-2 bg-[#F5B731]/15 text-[#B8860B] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>הנחות מיוחדות להזמנות גנים</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              {heroBanner.title}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              {heroBanner.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to={createPageUrl(heroBanner.button_link || 'Catalog')}>
                <Button className="bg-[#F5B731] hover:bg-[#e5a821] text-white text-lg px-8 py-6 rounded-2xl shadow-lg shadow-[#F5B731]/30 hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                  <Gift className="w-5 h-5 ml-2" />
                  {heroBanner.button_text || 'צפו במוצרים'}
                </Button>
              </Link>
              <Link to={createPageUrl('Catalog') + '?bulk=true'}>
                <Button variant="outline" className="text-lg px-8 py-6 rounded-2xl border-2 border-[#B68AD8] text-[#B68AD8] hover:bg-[#B68AD8] hover:text-white transition-all duration-300 w-full sm:w-auto">
                  הזמנה לגן שלם
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroBanner.image_url}
                alt="מוצרים ממותגים לגני ילדים"
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
            >
              <div className="text-center">
                <span className="text-2xl font-bold text-[#B68AD8]">20%</span>
                <p className="text-xs text-gray-600">הנחה ל-50+ יחידות</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}