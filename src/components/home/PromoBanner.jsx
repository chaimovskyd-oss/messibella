import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Gift, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PromoBanner({ banner }) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-l from-[#F5B731] via-[#F5C858] to-[#B68AD8] p-8 md:p-12"
        >
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-20 translate-y-20"></div>
          
          <div className="relative text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              <span>מבצע מיוחד לגנים</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              {banner?.title || 'הזמנת 30+ פריטים לגן? קבלו 20% הנחה!'}
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              {banner?.subtitle || 'ההנחה מחושבת אוטומטית – פשוט בחרו את הכמות ותהנו מהחיסכון'}
            </p>
            <Link to={createPageUrl('Catalog')}>
              <Button className="bg-white text-[#B68AD8] hover:bg-white/90 text-lg px-8 py-6 rounded-2xl font-bold shadow-xl">
                לכל המוצרים
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}