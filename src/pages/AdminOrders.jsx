import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

const statusLabels = { new: 'חדש', processing: 'בתהליך', ready: 'מוכן', shipped: 'נשלח', completed: 'הושלם', cancelled: 'בוטל' };
const statusColors = { new: 'bg-blue-100 text-blue-700', processing: 'bg-yellow-100 text-yellow-700', ready: 'bg-purple-100 text-purple-700', shipped: 'bg-indigo-100 text-indigo-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

async function downloadImagesAsZip(order) {
  // Collect all image URLs from customizations
  const imageEntries = [];
  (order.items || []).forEach(item => {
    Object.entries(item.customizations || {}).forEach(([k, v]) => {
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr)) arr.forEach((url, i) => imageEntries.push({ url, name: `${item.product_name}_${k}_${i + 1}.jpg` }));
      } catch (_) {}
      if (typeof v === 'string' && v.startsWith('http')) imageEntries.push({ url: v, name: `${item.product_name}_${k}.jpg` });
    });
  });

  if (!imageEntries.length) { alert('אין תמונות בהזמנה זו'); return; }

  // Dynamic import JSZip
  const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
  const zip = new JSZip();
  const folder = zip.folder(`order_${order.order_number}`);

  await Promise.all(imageEntries.map(async ({ url, name }) => {
    const res = await fetch(url);
    const blob = await res.blob();
    folder.file(name, blob);
  }));

  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `order_${order.order_number}_images.zip`;
  link.click();
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [zipping, setZipping] = useState(false);

  const { data: orders, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: () => base44.entities.Order.list('-created_date'), initialData: [] });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number?.includes(search) || o.customer_name?.includes(search) || o.customer_phone?.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout currentPage="AdminOrders">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">הזמנות</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="חיפוש הזמנה..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 bg-gray-50">
                <th className="py-3 px-4 text-right font-medium">מס' הזמנה</th>
                <th className="py-3 px-4 text-right font-medium">לקוח</th>
                <th className="py-3 px-4 text-right font-medium">טלפון</th>
                <th className="py-3 px-4 text-right font-medium">סכום</th>
                <th className="py-3 px-4 text-right font-medium">סטטוס</th>
                <th className="py-3 px-4 text-right font-medium">תאריך</th>
                <th className="py-3 px-4 text-right font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{order.order_number}</td>
                  <td className="py-3 px-4">{order.customer_name}</td>
                  <td className="py-3 px-4 text-gray-500">{order.customer_phone}</td>
                  <td className="py-3 px-4 font-medium">₪{order.total?.toFixed(0)}</td>
                  <td className="py-3 px-4">
                    <Select value={order.status} onValueChange={(v) => updateMutation.mutate({ id: order.id, status: v })}>
                      <SelectTrigger className="h-7 text-xs rounded-lg border-0 w-24">
                        <Badge className={`${statusColors[order.status]} text-xs`}>{statusLabels[order.status]}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy')}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>הזמנה #{selectedOrder?.order_number}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">לקוח:</span> <strong>{selectedOrder.customer_name}</strong></div>
                <div><span className="text-gray-500">טלפון:</span> <strong>{selectedOrder.customer_phone}</strong></div>
                <div><span className="text-gray-500">אימייל:</span> <strong>{selectedOrder.customer_email}</strong></div>
                <div><span className="text-gray-500">משלוח:</span> <strong>{selectedOrder.shipping_method === 'delivery' ? 'עד הבית' : selectedOrder.shipping_method === 'pickup_point' ? 'נקודת איסוף' : 'איסוף עצמי'}</strong></div>
                {selectedOrder.shipping_address && <div className="col-span-2"><span className="text-gray-500">כתובת:</span> <strong>{selectedOrder.shipping_address}, {selectedOrder.shipping_city}</strong></div>}
              </div>
              <div className="border-t pt-3">
                <h3 className="font-bold mb-2">פריטים:</h3>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name} x{item.quantity}</p>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <p className="text-gray-500 text-xs">{Object.entries(item.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                      )}
                    </div>
                    <span className="font-medium">₪{item.total_price?.toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between"><span>סכום ביניים</span><span>₪{selectedOrder.subtotal?.toFixed(0)}</span></div>
                {selectedOrder.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>הנחה</span><span>-₪{selectedOrder.discount_amount?.toFixed(0)}</span></div>}
                <div className="flex justify-between"><span>משלוח</span><span>₪{selectedOrder.shipping_cost?.toFixed(0)}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>סה"כ</span><span className="text-[#B68AD8]">₪{selectedOrder.total?.toFixed(0)}</span></div>
              </div>
              {selectedOrder.notes && <div className="border-t pt-3"><span className="text-gray-500">הערות:</span> <strong>{selectedOrder.notes}</strong></div>}

              {/* Download ZIP button */}
              {(() => {
                const hasImages = (selectedOrder.items || []).some(item =>
                  Object.values(item.customizations || {}).some(v => {
                    try { const a = JSON.parse(v); return Array.isArray(a) && a.length > 0; } catch { return false; }
                  })
                );
                return hasImages ? (
                  <div className="border-t pt-3">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2"
                      disabled={zipping}
                      onClick={async () => { setZipping(true); await downloadImagesAsZip(selectedOrder); setZipping(false); }}
                    >
                      {zipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      הורדת כל התמונות (ZIP)
                    </Button>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
