import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { getOrders } from '@/services/orderService';

const statusConfig = {
  new: { label: 'חדש', color: 'bg-blue-100 text-blue-800', icon: Clock },
  processing: { label: 'בתהליך', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  ready: { label: 'מוכן', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'נשלח', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'בוטל', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function MyOrders() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['my-orders', user?.full_name],
    queryFn: async () => {
      const allOrders = await getOrders();
      return allOrders.filter(order => order.customer_name === user?.full_name);
    },
    enabled: !!user?.full_name,
    initialData: [],
  });

  if (!user || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">ההזמנות שלי</h1>
        <p className="text-gray-500 mb-8">שלום {user.full_name}</p>

        {error ? (
          <div className="bg-red-50 text-red-700 rounded-2xl p-4">שגיאה בטעינת ההזמנות</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">עדיין אין הזמנות</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const status = statusConfig[order.status] || statusConfig.new;
              const Icon = status.icon;
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-gray-900">הזמנה #{order.order_number}</span>
                      <span className="text-gray-400 text-sm mr-3">
                        {order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <Badge className={`${status.color} flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>₪{item.total_price?.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t font-bold">
                    <span>סה"כ</span>
                    <span className="text-[#B68AD8]">₪{order.total?.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
