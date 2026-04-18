import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const emptyItem = {
  title: '',
  caption: '',
  image_url: '',
  display_order: 0,
  layout: 'grid',
  is_active: true,
};

export default function AdminGallery() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyItem);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['gallery-items'],
    queryFn: () => base44.entities.GalleryItem.list('display_order'),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: data => editItem
      ? base44.entities.GalleryItem.update(editItem.id, data)
      : base44.entities.GalleryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(emptyItem);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.GalleryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gallery-items'] }),
  });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'site-assets/gallery' });
      setForm(current => ({ ...current, image_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminGallery">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">ניהול גלריה</h1>
        <Button onClick={() => { setEditItem(null); setForm(emptyItem); setDialogOpen(true); }} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
          <Plus className="w-4 h-4 ml-2" /> תמונה חדשה
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-56 object-cover" />}
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-gray-900">{item.title || 'ללא כותרת'}</h2>
                    <p className="text-xs text-gray-400 mt-1">תצוגה: {item.layout || 'grid'} | מיקום: {item.display_order || 0}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => { setEditItem(item); setForm(item); setDialogOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="rounded-xl text-red-500" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {item.caption && <p className="text-sm text-gray-500 mt-3">{item.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'עריכת פריט גלריה' : 'פריט גלריה חדש'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>כותרת</Label><Input value={form.title} onChange={(e) => setForm(current => ({ ...current, title: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>כיתוב</Label><Textarea value={form.caption} onChange={(e) => setForm(current => ({ ...current, caption: e.target.value }))} className="rounded-xl mt-1" rows={3} /></div>
            <div>
              <Label>תמונה</Label>
              <div className="flex gap-3 mt-1 items-center">
                {form.image_url && <img src={form.image_url} alt="" className="w-28 h-20 rounded-2xl object-cover" />}
                <label className="border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer text-sm">
                  {uploading ? 'מעלה...' : 'העלה תמונה'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>תצוגה</Label>
                <Select value={form.layout} onValueChange={(value) => setForm(current => ({ ...current, layout: value }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">גריד</SelectItem>
                    <SelectItem value="masonry">מוזאיקה</SelectItem>
                    <SelectItem value="featured">מודגש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>מיקום</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm(current => ({ ...current, display_order: Number(e.target.value) }))} className="rounded-xl mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(current => ({ ...current, is_active: e.target.checked }))} />
              <Label>להצגה באתר</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1 bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמירה'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
