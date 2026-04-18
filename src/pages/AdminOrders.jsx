import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, ExternalLink, Eye, Loader2, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getOrderById, getOrders, updateOrderStatus } from '@/services/orderService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusLabels = {
  new: 'חדש',
  processing: 'בתהליך',
  ready: 'מוכן',
  shipped: 'נשלח',
  completed: 'הושלם',
  cancelled: 'בוטל',
};

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function tryParseJsonArray(value) {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasDisplayValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function formatCustomizationValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getAssetEntries(order) {
  const directAssets = (order?.items || []).flatMap(item =>
    (item.order_item_assets || []).map(asset => ({
      url: asset.file_url,
      name: asset.original_filename || `${item.product_name}_${asset.file_type || 'asset'}`,
    }))
  );

  const customizationAssets = (order?.items || []).flatMap(item =>
    Object.entries(item.customizations || {}).flatMap(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('http')) {
        return [{ url: value, name: `${item.product_name}_${key}.jpg` }];
      }

      return tryParseJsonArray(value)
        .filter(url => typeof url === 'string' && url.startsWith('http'))
        .map((url, index) => ({ url, name: `${item.product_name}_${key}_${index + 1}.jpg` }));
    })
  );

  return [...directAssets, ...customizationAssets];
}

async function downloadImagesAsZip(order) {
  const imageEntries = getAssetEntries(order);
  if (!imageEntries.length) {
    alert('אין תמונות בהזמנה זו');
    return;
  }

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

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{' '}
      <strong>{hasDisplayValue(value) ? value : '-'}</strong>
    </div>
  );
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [zipping, setZipping] = useState(false);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: getOrders,
    initialData: [],
  });

  const {
    data: selectedOrder,
    isLoading: isSelectedOrderLoading,
    error: selectedOrderError,
  } = useQuery({
    queryKey: ['admin-order', selectedOrderId],
    queryFn: () => getOrderById(selectedOrderId),
    enabled: !!selectedOrderId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', variables.id] });
    },
    onError: mutationError => {
      console.error('Admin order status update failed:', mutationError);
    },
  });

  const filtered = useMemo(() => orders.filter(order => {
    const value = search.trim();
    const matchesSearch = !value
      || String(order.order_number || '').includes(value)
      || String(order.customer_name || '').includes(value)
      || String(order.customer_phone || '').includes(value)
      || String(order.customer_email || '').includes(value);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, search, statusFilter]);

  const selectedOrderAssets = getAssetEntries(selectedOrder);

  return (
    <AdminLayout currentPage="AdminOrders">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">הזמנות</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש הזמנה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 rounded-2xl p-4">שגיאה בטעינת ההזמנות</div>
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
                    <Select value={order.status} onValueChange={(value) => updateMutation.mutate({ id: order.id, status: value })}>
                      <SelectTrigger className="h-7 text-xs rounded-lg border-0 w-24">
                        <Badge className={`${statusColors[order.status]} text-xs`}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => { if (!open) setSelectedOrderId(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרטי הזמנה</DialogTitle>
          </DialogHeader>

          {isSelectedOrderLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#B68AD8]" />
            </div>
          ) : selectedOrderError ? (
            <div className="bg-red-50 text-red-700 rounded-2xl p-4">שגיאה בטעינת פרטי ההזמנה</div>
          ) : selectedOrder ? (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DetailRow label="מספר הזמנה" value={selectedOrder.order_number} />
                <DetailRow label="סטטוס" value={statusLabels[selectedOrder.status] || selectedOrder.status} />
                <DetailRow
                  label="תאריך יצירה"
                  value={selectedOrder.created_date ? format(new Date(selectedOrder.created_date), 'dd/MM/yyyy HH:mm') : ''}
                />
                <DetailRow label="שם לקוח" value={selectedOrder.customer_name} />
                <DetailRow label="טלפון" value={selectedOrder.customer_phone} />
                <DetailRow label="אימייל" value={selectedOrder.customer_email} />
                <DetailRow label="כתובת" value={selectedOrder.shipping_address} />
                <DetailRow label="כתובת 2" value={selectedOrder.shipping_address_2} />
                <DetailRow label="עיר" value={selectedOrder.shipping_city} />
                <DetailRow label="מיקוד" value={selectedOrder.postal_code} />
                <DetailRow label="שיטת משלוח" value={selectedOrder.shipping_method} />
                <DetailRow label="סה״כ" value={`₪${selectedOrder.total?.toFixed(0) || '0'}`} />
              </div>

              <div className="border-t pt-3">
                <span className="text-gray-500">הערות:</span>{' '}
                <strong>{hasDisplayValue(selectedOrder.notes) ? selectedOrder.notes : '-'}</strong>
              </div>

              <div className="border-t pt-3">
                <h3 className="font-bold mb-3">פריטים</h3>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map(item => (
                    <div key={item.id} className="rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku || '-'}</p>
                        </div>
                        <div className="text-sm text-right">
                          <div>כמות: <strong>{item.quantity}</strong></div>
                          <div>מחיר יחידה: <strong>₪{item.unit_price.toFixed(0)}</strong></div>
                          <div>סכום שורה: <strong>₪{item.line_total.toFixed(0)}</strong></div>
                        </div>
                      </div>

                      {Object.entries(item.customizations || {}).filter(([, value]) => hasDisplayValue(value)).length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="font-medium mb-2">התאמות אישיות</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            {Object.entries(item.customizations)
                              .filter(([, value]) => hasDisplayValue(value))
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-gray-500">{key}:</span> {formatCustomizationValue(value)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {item.order_item_assets?.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium">קבצים מקושרים</p>
                          <div className="flex flex-col gap-1">
                            {item.order_item_assets.map(asset => (
                              <a
                                key={asset.id}
                                href={asset.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-[#B68AD8] hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {asset.original_filename || asset.file_type || asset.file_url}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrderAssets.length > 0 && (
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl gap-2"
                    disabled={zipping}
                    onClick={async () => {
                      setZipping(true);
                      try {
                        await downloadImagesAsZip(selectedOrder);
                      } finally {
                        setZipping(false);
                      }
                    }}
                  >
                    {zipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    הורדת כל התמונות (ZIP)
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
