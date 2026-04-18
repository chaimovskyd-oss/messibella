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

function hasDisplayValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function normalizeNameList(value) {
  if (!hasDisplayValue(value)) return [];
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
  return String(value).split('\n').map(item => item.trim()).filter(Boolean);
}

function isAssetReference(value) {
  return value && typeof value === 'object' && typeof value.file_url === 'string' && value.file_url.length > 0;
}

function extractAssetLinks(item) {
  const persistedAssets = (item.order_item_assets || []).map(asset => ({
    url: asset.file_url,
    file_path: asset.file_path,
    file_type: asset.file_type,
    original_filename: asset.original_filename,
    sort_order: asset.sort_order ?? 0,
  }));

  if (persistedAssets.length > 0) return persistedAssets;

  return Object.values(item.customizations || {})
    .flatMap(value => Array.isArray(value) ? value : [value])
    .filter(isAssetReference)
    .map((asset, index) => ({
      url: asset.file_url,
      file_path: asset.file_path || '',
      file_type: asset.file_type || 'application/octet-stream',
      original_filename: asset.original_filename || `asset-${index + 1}`,
      sort_order: asset.sort_order ?? index,
    }));
}

function extractDesignChoice(customizations) {
  const match = Object.entries(customizations || {}).find(([key, value]) =>
    hasDisplayValue(value) && /עיצוב|design|theme|style/i.test(key)
  );
  return match ? { label: match[0], value: String(match[1]) } : null;
}

function extractTextFields(customizations) {
  return Object.entries(customizations || {}).filter(([key, value]) => {
    if (!hasDisplayValue(value)) return false;
    if (Array.isArray(value) || isAssetReference(value) || (typeof value === 'object' && value !== null)) return false;
    if (/עיצוב|design|theme|style|name list|רשימת שמות/i.test(key)) return false;
    return true;
  });
}

function getCustomizationEntries(customizations) {
  return Object.entries(customizations || {}).filter(([, value]) => {
    if (!hasDisplayValue(value)) return false;
    if (Array.isArray(value) && value.every(isAssetReference)) return false;
    if (isAssetReference(value)) return false;
    return true;
  });
}

function formatCustomizationValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function downloadImagesAsZip(order) {
  const imageEntries = (order?.items || []).flatMap(extractAssetLinks);
  if (!imageEntries.length) {
    alert('אין תמונות בהזמנה זו');
    return;
  }

  const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
  const zip = new JSZip();
  const folder = zip.folder(`order_${order.order_number}`);

  await Promise.all(imageEntries.map(async (entry, index) => {
    const response = await fetch(entry.url);
    const blob = await response.blob();
    folder.file(entry.original_filename || `asset-${index + 1}`, blob);
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

  const itemCount = selectedOrder?.items?.length || 0;
  const totalQuantity = (selectedOrder?.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  const selectedOrderAssets = (selectedOrder?.items || []).flatMap(extractAssetLinks);

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
                  <td className="py-3 px-4 text-gray-500">{order.created_date && format(new Date(order.created_date), 'dd/MM/yyyy')}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => setSelectedOrderId(order.id)}>
                      <Eye className="w-4 h-4" />
                      פרטים
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => { if (!open) setSelectedOrderId(null); }}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
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
                <DetailRow label="תאריך יצירה" value={selectedOrder.created_date ? format(new Date(selectedOrder.created_date), 'dd/MM/yyyy HH:mm') : ''} />
                <DetailRow label="שם לקוח" value={selectedOrder.customer_name} />
                <DetailRow label="טלפון" value={selectedOrder.customer_phone} />
                <DetailRow label="אימייל" value={selectedOrder.customer_email} />
                <DetailRow label="סוג משלוח" value={selectedOrder.shipping_method} />
                <DetailRow label="כתובת" value={selectedOrder.shipping_address} />
                <DetailRow label="כתובת 2" value={selectedOrder.shipping_address_2} />
                <DetailRow label="עיר" value={selectedOrder.shipping_city} />
                <DetailRow label="מיקוד" value={selectedOrder.postal_code} />
                <DetailRow label="סה״כ" value={`₪${selectedOrder.total?.toFixed(0) || '0'}`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 rounded-2xl p-4">
                <DetailRow label="מספר פריטים" value={itemCount} />
                <DetailRow label="כמות כוללת" value={totalQuantity} />
                <DetailRow label="קבצים מצורפים" value={selectedOrderAssets.length} />
              </div>

              <div className="border-t pt-3">
                <span className="text-gray-500">הערות:</span>{' '}
                <strong>{hasDisplayValue(selectedOrder.notes) ? selectedOrder.notes : '-'}</strong>
              </div>

              <div className="border-t pt-3">
                <h3 className="font-bold mb-3">מוצרים בהזמנה</h3>
                <div className="space-y-4">
                  {(selectedOrder.items || []).map(item => {
                    const assetLinks = extractAssetLinks(item);
                    const nameListEntry = Object.entries(item.customizations || {}).find(([key]) => /רשימת שמות|names/i.test(key));
                    const names = normalizeNameList(nameListEntry?.[1]);
                    const designChoice = extractDesignChoice(item.customizations || {});
                    const textFields = extractTextFields(item.customizations || {});
                    const remainingEntries = getCustomizationEntries(item.customizations || {}).filter(([key]) =>
                      key !== nameListEntry?.[0] && key !== designChoice?.label
                    );

                    return (
                      <div key={item.id} className="rounded-2xl border border-gray-100 p-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="font-bold text-base text-gray-900">{item.product_name}</p>
                            <p className="text-xs text-gray-500">Product ID: {item.product_id || '-'} | SKU: {item.sku || '-'}</p>
                          </div>
                          <div className="text-sm md:text-left bg-gray-50 rounded-xl px-3 py-2">
                            <div>כמות: <strong>{item.quantity}</strong></div>
                            <div>מחיר יחידה: <strong>₪{item.unit_price.toFixed(0)}</strong></div>
                            <div>סכום שורה: <strong>₪{item.line_total.toFixed(0)}</strong></div>
                          </div>
                        </div>

                        {designChoice && (
                          <div className="bg-[#F5B731]/10 rounded-xl p-3">
                            <span className="text-gray-500">{designChoice.label}:</span>{' '}
                            <strong>{designChoice.value}</strong>
                          </div>
                        )}

                        {textFields.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                            <p className="font-medium mb-1">טקסטים והתאמות</p>
                            {textFields.map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}:</span> {formatCustomizationValue(value)}
                              </div>
                            ))}
                          </div>
                        )}

                        {names.length > 0 && (
                          <div className="space-y-2">
                            <p className="font-medium">רשימת שמות</p>
                            <div className="flex flex-wrap gap-2">
                              {names.map(name => (
                                <Badge key={`${item.id}-${name}`} variant="secondary" className="px-3 py-1">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {remainingEntries.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                            <p className="font-medium mb-1">שדות נוספים</p>
                            {remainingEntries.map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}:</span> {formatCustomizationValue(value)}
                              </div>
                            ))}
                          </div>
                        )}

                        {assetLinks.length > 0 && (
                          <div className="space-y-3">
                            <p className="font-medium">תמונות / קבצים</p>
                            <div className="flex flex-wrap gap-3">
                              {assetLinks.map((asset, index) => (
                                <div key={`${asset.file_path || asset.url}-${index}`} className="w-24">
                                  <a href={asset.url} target="_blank" rel="noreferrer" className="block">
                                    <img src={asset.url} alt={asset.original_filename} className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                                  </a>
                                  <div className="mt-2 space-y-1 text-xs">
                                    <a href={asset.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#B68AD8] hover:underline">
                                      <ExternalLink className="w-3 h-3" />
                                      פתיחה
                                    </a>
                                    <a href={asset.url} download={asset.original_filename} className="block text-[#B68AD8] hover:underline">
                                      הורדה
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
