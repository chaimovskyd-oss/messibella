import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: 10, max_uses: null, expiry_date: '', min_order_amount: 0, is_active: true });

  const { data: coupons } = useQuery({ queryKey: ['coupons'], queryFn: () => base44.entities.Coupon.list(), initialData: [] });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem ? base44.entities.Coupon.update(editItem.id, data) : base44.entities.Coupon.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); setDialogOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const handleEdit = (item) => { setEditItem(item); setForm(item); setDialogOpen(true); };
  const handleNew = () => { setEditItem(null); setForm({ code: '', discount_type: 'percent', discount_value: 10, max_uses: null, expiry_date: '', min_order_amount: 0, is_active: true }); setDialogOpen(true); };

  return (
    <AdminLayout currentPage="AdminCoupons">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">קופונים</h1>
        <Button onClick={handleNew} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl"><Plus className="w-4 h-4 ml-2" /> קופון חדש</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500">
              <th className="py-3 px-4 text-right font-medium">קוד</th>
              <th className="py-3 px-4 text-right font-medium">הנחה</th>
              <th className="py-3 px-4 text-right font-medium">שימושים</th>
              <th className="py-3 px-4 text-right font-medium">סטטוס</th>
              <th className="py-3 px-4 text-right font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-mono font-bold">{c.code}</td>
                <td className="py-3 px-4">{c.discount_type === 'percent' ? `${c.discount_value}%` : `₪${c.discount_value}`}</td>
                <td className="py-3 px-4">{c.current_uses || 0}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                <td className="py-3 px-4"><Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{c.is_active ? 'פעיל' : 'לא פעיל'}</Badge></td>
                <td className="py-3 px-4 flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3 h-3" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'עריכת קופון' : 'קופון חדש'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>קוד קופון *</Label><Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} className="rounded-xl mt-1 font-mono" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>סוג הנחה</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({...form, discount_type: v})}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">אחוז</SelectItem>
                    <SelectItem value="fixed">סכום קבוע</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>ערך הנחה</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({...form, discount_value: Number(e.target.value)})} className="rounded-xl mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>מקסימום שימושים</Label><Input type="number" value={form.max_uses || ''} onChange={(e) => setForm({...form, max_uses: e.target.value ? Number(e.target.value) : null})} className="rounded-xl mt-1" placeholder="ללא הגבלה" /></div>
              <div><Label>תוקף עד</Label><Input type="date" value={form.expiry_date || ''} onChange={(e) => setForm({...form, expiry_date: e.target.value})} className="rounded-xl mt-1" /></div>
            </div>
            <div><Label>הזמנה מינימלית (₪)</Label><Input type="number" value={form.min_order_amount || ''} onChange={(e) => setForm({...form, min_order_amount: Number(e.target.value)})} className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label>פעיל</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1 bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">שמירה</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
