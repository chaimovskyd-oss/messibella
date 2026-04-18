import React from 'react';
import { Palette, Truck, Award, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  { icon: Palette, title: 'התאמה אישית', desc: 'שם הילד + שם הגן על כל מוצר', color: 'bg-[#F5B731]/15 text-[#B8860B]' },
  { icon: Heart, title: 'הנחות לגנים', desc: 'עד 20% הנחה בהזמנה מרוכזת', color: 'bg-[#B68AD8]/15 text-[#8B5FB8]' },
  { icon: Truck, title: 'משלוח מהיר', desc: 'עד 5 ימי עסקים לכל הארץ', color: 'bg-[#5BC5C8]/15 text-[#3A9B9D]' },
  { icon: Award, title: 'איכות מעולה', desc: 'חומרים עמידים והדפסה מקצועית', color: 'bg-[#F9A8C9]/15 text-[#C77898]' },
];

export default function BenefitsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl hover:shadow-lg transition-all duration-300 group"
            >
              <div className={`w-16 h-16 ${b.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <b.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{b.title}</h3>
              <p className="text-gray-500 text-sm">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}