import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function AdminBanners() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', button_text: '', button_link: '', type: 'hero', is_active: true, display_order: 0 });
  const [uploading, setUploading] = useState(false);

  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: () => base44.entities.Banner.list(), initialData: [] });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem ? base44.entities.Banner.update(editItem.id, data) : base44.entities.Banner.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); setDialogOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Banner.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });

  const handleEdit = (item) => { setEditItem(item); setForm(item); setDialogOpen(true); };
  const handleNew = () => { setEditItem(null); setForm({ title: '', subtitle: '', image_url: '', button_text: '', button_link: '', type: 'hero', is_active: true, display_order: 0 }); setDialogOpen(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, image_url: file_url });
    setUploading(false);
  };

  return (
    <AdminLayout currentPage="AdminBanners">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">באנרים</h1>
        <Button onClick={handleNew} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl"><Plus className="w-4 h-4 ml-2" /> באנר חדש</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map(b => (
          <Card key={b.id} className="border-0 shadow-sm overflow-hidden">
            <div className="aspect-[3/1] bg-gray-100">
              {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold">{b.title}</h3>
              <p className="text-sm text-gray-500">{b.type === 'hero' ? 'ראשי' : 'מבצע'} | {b.is_active ? 'פעיל' : 'לא פעיל'}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(b)}><Pencil className="w-3 h-3 ml-1" /> עריכה</Button>
                <Button variant="outline" size="sm" className="text-red-500" onClick={() => deleteMutation.mutate(b.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'עריכת באנר' : 'באנר חדש'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>כותרת</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="rounded-xl mt-1" /></div>
            <div><Label>תת כותרת</Label><Input value={form.subtitle} onChange={(e) => setForm({...form, subtitle: e.target.value})} className="rounded-xl mt-1" /></div>
            <div>
              <Label>תמונה</Label>
              <div className="flex gap-3 mt-1">
                {form.image_url && <img src={form.image_url} alt="" className="w-24 h-16 rounded-xl object-cover" />}
                <label className="flex items-center justify-center w-24 h-16 border-2 border-dashed rounded-xl cursor-pointer">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>טקסט כפתור</Label><Input value={form.button_text} onChange={(e) => setForm({...form, button_text: e.target.value})} className="rounded-xl mt-1" /></div>
              <div><Label>קישור כפתור</Label><Input value={form.button_link} onChange={(e) => setForm({...form, button_link: e.target.value})} className="rounded-xl mt-1" placeholder="Catalog" /></div>
            </div>
            <div>
              <Label>סוג</Label>
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">ראשי</SelectItem>
                  <SelectItem value="promo">מבצע</SelectItem>
                </SelectContent>
              </Select>
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
