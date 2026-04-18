import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/store/CartContext';
import CartItem from '@/components/store/CartItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, ArrowLeft, Gift, Truck, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';

const FREE_SHIPPING_THRESHOLD = 200;

export default function Cart() {
  const { cart, cartTotal, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.list(),
    initialData: [],
  });

  const applyCoupon = () => {
    setCouponError('');
    const coupon = coupons.find(c => 
      c.code.toLowerCase() === couponCode.toLowerCase() && 
      c.is_active &&
      (!c.max_uses || c.current_uses < c.max_uses) &&
      (!c.expiry_date || new Date(c.expiry_date) >= new Date()) &&
      (!c.min_order_amount || cartTotal >= c.min_order_amount)
    );
    if (coupon) {
      setAppliedCoupon(coupon);
    } else {
      setCouponError('קוד קופון לא תקין או שלא עומד בתנאים');
    }
  };

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percent') {
      return cartTotal * (appliedCoupon.discount_value / 100);
    }
    return appliedCoupon.discount_value;
  }, [appliedCoupon, cartTotal]);

  const freeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingProgress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const finalTotal = cartTotal - discountAmount;

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">העגלה ריקה</h2>
        <p className="text-gray-500 mb-6">הוסיפו מוצרים ממותגים מהקטלוג שלנו</p>
        <Link to={createPageUrl('Catalog')}>
          <Button className="bg-[#F5B731] hover:bg-[#e5a821] rounded-2xl px-8 py-5 text-lg">
            לקטלוג המוצרים
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">סל הקניות</h1>

        {/* Free shipping progress */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Truck className={`w-5 h-5 ${freeShipping ? 'text-green-500' : 'text-gray-400'}`} />
            {freeShipping ? (
              <span className="text-green-600 font-medium">🎉 מגיע לכם משלוח חינם!</span>
            ) : (
              <span className="text-gray-600">הוסיפו עוד <strong className="text-[#B68AD8]">₪{(FREE_SHIPPING_THRESHOLD - cartTotal).toFixed(0)}</strong> וקבלו משלוח חינם</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-l from-[#B68AD8] to-[#F5B731] transition-all duration-500"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Items */}
          <div className="md:col-span-2 space-y-3">
            {cart.map(item => (
              <CartItem key={item.key} item={item} />
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm h-fit md:sticky md:top-24">
            <h2 className="font-bold text-lg mb-4">סיכום הזמנה</h2>

            {/* Coupon */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="קוד קופון"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="rounded-xl text-sm"
              />
              <Button variant="outline" size="sm" className="rounded-xl px-4 min-h-10" onClick={applyCoupon}>
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {couponError && <p className="text-red-500 text-xs mb-2">{couponError}</p>}
            {appliedCoupon && (
              <div className="bg-green-50 text-green-700 text-sm p-2 rounded-lg mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                קופון {appliedCoupon.code} הופעל – {appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}%` : `₪${appliedCoupon.discount_value}`} הנחה
              </div>
            )}

            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">סכום ביניים</span>
                <span>₪{cartTotal.toFixed(0)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>הנחת קופון</span>
                  <span>-₪{discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">משלוח</span>
                <span className={freeShipping ? 'text-green-600 font-medium' : ''}>
                  {freeShipping ? 'חינם!' : 'יחושב בצ\'קאאוט'}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>סה"כ</span>
                <span className="text-[#B68AD8]">₪{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            <Link to={createPageUrl('Checkout') + `?coupon=${appliedCoupon?.code || ''}`} className="block">
              <Button className="w-full mt-4 bg-[#F5B731] hover:bg-[#e5a821] text-lg py-5 rounded-2xl font-bold shadow-lg shadow-[#F5B731]/30">
                לתשלום
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
