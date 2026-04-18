import React, { useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const emptyReview = {
  reviewer_name: '',
  text: '',
  rating: 5,
  image_url: '',
  is_approved: true,
};

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyReview);
  const [uploading, setUploading] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date'),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: data => editItem
      ? base44.entities.Review.update(editItem.id, data)
      : base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(emptyReview);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Review.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'site-assets/reviews' });
      setForm(current => ({ ...current, image_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminReviews">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">מה אומרים עלינו</h1>
        <Button onClick={() => { setEditItem(null); setForm(emptyReview); setDialogOpen(true); }} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
          <Plus className="w-4 h-4 ml-2" /> ביקורת חדשה
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {review.image_url && <img src={review.image_url} alt={review.reviewer_name} className="w-24 h-24 rounded-2xl object-cover" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <strong>{review.reviewer_name}</strong>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-[#F5B731] text-[#F5B731]' : 'fill-gray-200 text-gray-200'}`} />
                      ))}
                    </div>
                    <Badge className={review.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {review.is_approved ? 'מאושר' : 'מוסתר'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-line">{review.text}</p>
                  <p className="text-gray-400 text-xs mt-1">{review.created_date && format(new Date(review.created_date), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setEditItem(review); setForm(review); setDialogOpen(true); }}>
                  <Pencil className="w-3 h-3 ml-1" /> עריכה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={review.is_approved ? 'text-yellow-600 rounded-lg' : 'text-green-600 rounded-lg'}
                  onClick={() => saveMutation.mutate({ ...review, is_approved: !review.is_approved })}
                >
                  {review.is_approved ? <X className="w-3 h-3 ml-1" /> : <Check className="w-3 h-3 ml-1" />}
                  {review.is_approved ? 'הסתרה' : 'פרסום'}
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 rounded-lg" onClick={() => deleteMutation.mutate(review.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'עריכת ביקורת' : 'ביקורת חדשה'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>שם הלקוח/ה</Label><Input value={form.reviewer_name} onChange={(e) => setForm(current => ({ ...current, reviewer_name: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>טקסט</Label><Textarea value={form.text} onChange={(e) => setForm(current => ({ ...current, text: e.target.value }))} className="rounded-xl mt-1" rows={4} /></div>
            <div><Label>דירוג</Label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm(current => ({ ...current, rating: Number(e.target.value) }))} className="rounded-xl mt-1" /></div>
            <div>
              <Label>תמונה</Label>
              <div className="flex gap-3 mt-1 items-center">
                {form.image_url && <img src={form.image_url} alt="" className="w-24 h-24 rounded-2xl object-cover" />}
                <label className="border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer text-sm">
                  {uploading ? 'מעלה...' : 'העלה תמונה'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_approved} onChange={(e) => setForm(current => ({ ...current, is_approved: e.target.checked }))} />
              <Label>לפרסום באתר</Label>
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
