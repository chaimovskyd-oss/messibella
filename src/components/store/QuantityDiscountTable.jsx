import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, TrendingUp } from 'lucide-react';

export default function QuantityDiscountTable({ discounts, currentQty, basePrice }) {
  if (!discounts?.length) return null;

  const getNextTier = () => {
    const sortedDiscounts = [...discounts].sort((a, b) => a.min_qty - b.min_qty);
    for (const d of sortedDiscounts) {
      if (currentQty < d.min_qty) {
        return { needed: d.min_qty - currentQty, discount: d.discount_percent };
      }
    }
    return null;
  };

  const nextTier = getNextTier();

  return (
    <div className="bg-gradient-to-l from-[#FFF8E7] to-[#F3E8FF]/50 rounded-2xl p-4 md:p-6">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#B68AD8]" />
        הנחות כמות – כי משתלם להזמין לכל הגן!
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {discounts.sort((a, b) => a.min_qty - b.min_qty).map((d, i) => {
          const isActive = currentQty >= d.min_qty && (!d.max_qty || currentQty <= d.max_qty);
          return (
            <div
              key={i}
              className={`rounded-xl p-3 text-center transition-all ${
                isActive 
                  ? 'bg-[#B68AD8] text-white shadow-lg scale-105' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="text-xs mb-1 opacity-80">
                {d.min_qty}{d.max_qty ? `–${d.max_qty}` : '+'} יחידות
              </div>
              <div className="text-lg font-bold">{d.discount_percent}% הנחה</div>
              <div className="text-xs mt-1 opacity-80">
                ₪{(basePrice * (1 - d.discount_percent / 100)).toFixed(0)} ליחידה
              </div>
              {isActive && <Check className="w-4 h-4 mx-auto mt-1" />}
            </div>
          );
        })}
      </div>

      {nextTier && (
        <div className="mt-4 bg-white rounded-xl p-3 border-2 border-dashed border-[#F5B731] text-center">
          <span className="text-[#B8860B] font-medium">
            🎯 עוד {nextTier.needed} יחידות ותקבלו {nextTier.discount}% הנחה!
          </span>
        </div>
      )}
    </div>
  );
}