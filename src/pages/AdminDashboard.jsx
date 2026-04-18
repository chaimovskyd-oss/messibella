import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getProducts } from '@/data/store';

export default function AdminDashboard() {
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: () => base44.entities.Order.list('-created_date'), initialData: [] });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: async () => getProducts(), initialData: [] });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const newOrders = orders.filter(o => o.status === 'new').length;

  const stats = [
    { title: 'הזמנות', value: orders.length, icon: ShoppingCart, color: 'bg-blue-500', lightColor: 'bg-blue-50 text-blue-600' },
    { title: 'הזמנות חדשות', value: newOrders, icon: Clock, color: 'bg-yellow-500', lightColor: 'bg-yellow-50 text-yellow-600' },
    { title: 'הכנסות', value: `₪${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500', lightColor: 'bg-green-50 text-green-600' },
    { title: 'מוצרים', value: products.length, icon: Package, color: 'bg-purple-500', lightColor: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <AdminLayout currentPage="AdminDashboard">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">דשבורד</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.lightColor} flex items-center justify-center`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>הזמנות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3 text-right font-medium">מספר הזמנה</th>
                  <th className="py-3 text-right font-medium">לקוח</th>
                  <th className="py-3 text-right font-medium">סכום</th>
                  <th className="py-3 text-right font-medium">סטטוס</th>
                  <th className="py-3 text-right font-medium">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{order.order_number}</td>
                    <td className="py-3 text-gray-600">{order.customer_name}</td>
                    <td className="py-3 font-medium">₪{order.total?.toFixed(0)}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'new' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'new' ? 'חדש' : order.status === 'processing' ? 'בתהליך' : order.status === 'ready' ? 'מוכן' : order.status === 'shipped' ? 'נשלח' : order.status === 'completed' ? 'הושלם' : order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

