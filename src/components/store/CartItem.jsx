import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from './CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart, getDiscountedPrice, getItemTotal } = useCart();
  const unitPrice = getDiscountedPrice(item);
  const total = getItemTotal(item);

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm overflow-hidden">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
        <img
          src={item.main_image || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200'}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{item.product_name}</h3>
        {Object.keys(item.customizations || {}).length > 0 && (
          <div className="text-xs text-gray-500 mt-1 space-y-1 break-words">
            {Object.entries(item.customizations).map(([key, value]) => (
              <div key={key}>{key}: {String(value)}</div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">
          <div className="flex items-center bg-gray-100 rounded-lg w-fit">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.key, item.quantity - 1)}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.key, item.quantity + 1)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="text-left sm:text-left">
            <p className="font-bold text-[#B68AD8]">₪{total.toFixed(0)}</p>
            {unitPrice < item.base_price && (
              <p className="text-xs text-gray-400 line-through">₪{(item.base_price * item.quantity).toFixed(0)}</p>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-red-500 self-start"
        onClick={() => removeFromCart(item.key)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
