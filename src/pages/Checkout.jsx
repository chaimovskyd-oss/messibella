import React, { useState, useEffect } from 'react';
import { useCart } from '@/components/store/CartContext';
import { base44 } from '@/api/localClient';
import { createOrder } from '@/services/orderService';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Check, ShoppingCart, MapPin, Truck, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Checkout() {
  const { cart, cartTotal, getDiscountedPrice, getItemTotal, clearCart } = useCart();
  const urlParams = new URLSearchParams(window.location.search);
  const couponCode = urlParams.get('coupon');

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    shipping_city: '',
    shipping_method: 'delivery',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const { data: shippingOptions } = useQuery({
    queryKey: ['shipping'],
    queryFn: () => base44.entities.ShippingOption.filter({ is_active: true }),
    initialData: [],
  });

  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.list(),
    initialData: [],
  });

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user) {
        setForm(f => ({
          ...f,
          customer_name: user.full_name || '',
          customer_email: user.email || ''
        }));
      }
    }).catch(() => {});
  }, []);

  const appliedCoupon = couponCode
    ? coupons.find(c => c.code === couponCode && c.is_active)
    : null;

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percent'
      ? cartTotal * (appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;

  const selectedShipping = shippingOptions.find(s => s.type === form.shipping_method);
  const shippingCost = selectedShipping
    ? (selectedShipping.free_above && cartTotal >= selectedShipping.free_above ? 0 : selectedShipping.price)
    : (cartTotal >= 200 ? 0 : 30);

  const finalTotal = cartTotal - discountAmount + shippingCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        name: item.product_name,
        product_name: item.product_name,
        quantity: item.quantity,
        price: getDiscountedPrice(item),
        unit_price: getDiscountedPrice(item),
        total_price: getItemTotal(item),
        customizations: item.customizations
      }));

      const createdOrder = await createOrder({
        customer_name: form.customer_name,
        phone: form.customer_phone,
        items,
        total_price: finalTotal,
        status: 'new'
      });

      base44.functions.invoke('sendOrderEmail', {
        order: {
          ...form,
          ...createdOrder,
          subtotal: cartTotal,
          shipping_cost: shippingCost,
          discount_amount: discountAmount,
          coupon_code: couponCode || '',
        }
      }).catch(() => {});

      if (appliedCoupon) {
        await base44.entities.Coupon.update(appliedCoupon.id, {
          current_uses: (appliedCoupon.current_uses || 0) + 1
        });
      }

      clearCart();
      setOrderNumber(createdOrder.order_number);
      setOrderComplete(true);
    } catch (error) {
      console.error('Checkout order submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">ההזמנה התקבלה!</h1>
        <p className="text-gray-500 text-lg mb-2">מספר הזמנה: <strong>{orderNumber}</strong></p>
        <p className="text-gray-500 mb-8">נשלח לכם אישור במייל בקרוב</p>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-[#F5B731] hover:bg-[#e5a821] rounded-2xl px-8 py-5 text-lg">
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">העגלה ריקה</h2>
        <Link to={createPageUrl('Catalog')}>
          <Button className="mt-4 bg-[#F5B731] hover:bg-[#e5a821] rounded-2xl">לקטלוג</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">השלמת הזמנה</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Personal details */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#B68AD8]" />
                  פרטים אישיים
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>שם מלא *</Label>
                    <Input required value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label>טלפון *</Label>
                    <Input required type="tel" value={form.customer_phone} onChange={(e) => setForm({...form, customer_phone: e.target.value})} className="rounded-xl mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>אימייל</Label>
                    <Input type="email" value={form.customer_email} onChange={(e) => setForm({...form, customer_email: e.target.value})} className="rounded-xl mt-1" />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#B68AD8]" />
                  משלוח
                </h2>
                <RadioGroup value={form.shipping_method} onValueChange={(v) => setForm({...form, shipping_method: v})} className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 p-3 border rounded-xl hover:border-[#B68AD8] transition-colors">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <span className="font-medium">משלוח עד הבית</span>
                      <span className="text-sm text-gray-500 block">3-5 ימי עסקים</span>
                    </Label>
                    <span className="text-sm font-medium">{cartTotal >= 200 ? 'חינם' : '₪30'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-xl hover:border-[#B68AD8] transition-colors">
                    <RadioGroupItem value="pickup_point" id="pickup_point" />
                    <Label htmlFor="pickup_point" className="flex-1 cursor-pointer">
                      <span className="font-medium">נקודת איסוף</span>
                      <span className="text-sm text-gray-500 block">2-4 ימי עסקים</span>
                    </Label>
                    <span className="text-sm font-medium">₪15</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-xl hover:border-[#B68AD8] transition-colors">
                    <RadioGroupItem value="self_pickup" id="self_pickup" />
                    <Label htmlFor="self_pickup" className="flex-1 cursor-pointer">
                      <span className="font-medium">איסוף עצמי</span>
                      <span className="text-sm text-gray-500 block">1-2 ימי עסקים</span>
                    </Label>
                    <span className="text-sm font-medium text-green-600">חינם</span>
                  </div>
                </RadioGroup>

                {form.shipping_method !== 'self_pickup' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>כתובת</Label>
                      <Input value={form.shipping_address} onChange={(e) => setForm({...form, shipping_address: e.target.value})} className="rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label>עיר</Label>
                      <Input value={form.shipping_city} onChange={(e) => setForm({...form, shipping_city: e.target.value})} className="rounded-xl mt-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Label>הערות להזמנה</Label>
                <Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="rounded-xl mt-1" placeholder="הערות מיוחדות..." />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-fit sticky top-24">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#B68AD8]" />
                סיכום
              </h2>
              <div className="space-y-2 text-sm mb-4">
                {cart.map(item => (
                  <div key={item.key} className="flex justify-between">
                    <span className="text-gray-600 truncate flex-1">{item.product_name} x{item.quantity}</span>
                    <span className="mr-2 font-medium">₪{(getDiscountedPrice(item) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
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
                  <span>{shippingCost === 0 ? <span className="text-green-600">חינם</span> : `₪${shippingCost}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>סה"כ לתשלום</span>
                  <span className="text-[#B68AD8]">₪{finalTotal.toFixed(0)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 bg-[#F5B731] hover:bg-[#e5a821] text-lg py-5 rounded-2xl font-bold shadow-lg shadow-[#F5B731]/30"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'אישור הזמנה'}
              </Button>
              <p className="text-xs text-gray-400 text-center mt-3">ניצור קשר לתיאום תשלום</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
