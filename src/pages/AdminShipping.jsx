import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Truck } from 'lucide-react';

export default function AdminShipping() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'delivery', price: 0, free_above: null, estimated_days: '', is_active: true });

  const { data: options } = useQuery({ queryKey: ['shipping'], queryFn: () => base44.entities.ShippingOption.list(), initialData: [] });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem ? base44.entities.ShippingOption.update(editItem.id, data) : base44.entities.ShippingOption.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping'] }); setDialogOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShippingOption.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping'] }),
  });

  const handleEdit = (item) => { setEditItem(item); setForm(item); setDialogOpen(true); };
  const handleNew = () => { setEditItem(null); setForm({ name: '', type: 'delivery', price: 0, free_above: null, estimated_days: '', is_active: true }); setDialogOpen(true); };

  const typeLabels = { delivery: 'משלוח עד הבית', pickup_point: 'נקודת איסוף', self_pickup: 'איסוף עצמי' };

  return (
    <AdminLayout currentPage="AdminShipping">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">משלוחים</h1>
        <Button onClick={handleNew} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl"><Plus className="w-4 h-4 ml-2" /> אפשרות חדשה</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map(opt => (
          <div key={opt.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#B68AD8]/10 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#B68AD8]" />
              </div>
              <div>
                <h3 className="font-bold">{opt.name}</h3>
                <p className="text-xs text-gray-500">{typeLabels[opt.type]}</p>
              </div>
            </div>
            <div className="text-sm space-y-1 mb-3">
              <p>מחיר: <strong>₪{opt.price}</strong></p>
              {opt.free_above && <p>חינם מעל: <strong>₪{opt.free_above}</strong></p>}
              {opt.estimated_days && <p>זמן אספקה: <strong>{opt.estimated_days}</strong></p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => handleEdit(opt)}><Pencil className="w-3 h-3 ml-1" /> עריכה</Button>
              <Button variant="outline" size="sm" className="text-red-500 rounded-lg" onClick={() => deleteMutation.mutate(opt.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'עריכת אפשרות משלוח' : 'אפשרות משלוח חדשה'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>שם *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl mt-1" /></div>
            <div>
              <Label>סוג</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">משלוח עד הבית</SelectItem>
                  <SelectItem value="pickup_point">נקודת איסוף</SelectItem>
                  <SelectItem value="self_pickup">איסוף עצמי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>מחיר (₪)</Label><Input type="number" value={form.price} onChange={(e) => setForm({...form, price: Number(e.target.value)})} className="rounded-xl mt-1" /></div>
              <div><Label>חינם מעל (₪)</Label><Input type="number" value={form.free_above || ''} onChange={(e) => setForm({...form, free_above: e.target.value ? Number(e.target.value) : null})} className="rounded-xl mt-1" placeholder="ללא" /></div>
            </div>
            <div><Label>זמן אספקה</Label><Input value={form.estimated_days} onChange={(e) => setForm({...form, estimated_days: e.target.value})} className="rounded-xl mt-1" placeholder="3-5 ימי עסקים" /></div>
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
