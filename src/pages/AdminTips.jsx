import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const emptyPost = {
  title: '',
  slug: '',
  excerpt: '',
  cover_image: '',
  content_html: '',
  is_published: true,
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminTips() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyPost);
  const [uploading, setUploading] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => base44.entities.BlogPost.list('-created_date'),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: data => editItem
      ? base44.entities.BlogPost.update(editItem.id, data)
      : base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      setDialogOpen(false);
      setEditItem(null);
      setForm(emptyPost);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.BlogPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'site-assets/blog' });
      setForm(current => ({ ...current, cover_image: file_url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout currentPage="AdminTips">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">הטיפים שלנו</h1>
        <Button onClick={() => { setEditItem(null); setForm(emptyPost); setDialogOpen(true); }} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
          <Plus className="w-4 h-4 ml-2" /> מאמר חדש
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col lg:flex-row gap-4">
              {post.cover_image && <img src={post.cover_image} alt={post.title} className="w-full lg:w-48 h-36 object-cover rounded-2xl" />}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                <p className="text-sm text-gray-400 mt-1">/{post.slug}</p>
                <p className="text-sm text-gray-500 mt-3 line-clamp-3">{post.excerpt}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => { setEditItem(post); setForm(post); setDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 ml-1" /> עריכה
                </Button>
                <Button variant="outline" className="rounded-xl text-red-500" onClick={() => deleteMutation.mutate(post.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'עריכת מאמר' : 'מאמר חדש'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>כותרת</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(current => ({ ...current, title: e.target.value, slug: current.slug || slugify(e.target.value) }))}
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(current => ({ ...current, slug: slugify(e.target.value) }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>תקציר</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm(current => ({ ...current, excerpt: e.target.value }))} className="rounded-xl mt-1" rows={3} />
            </div>
            <div>
              <Label>תמונת שער</Label>
              <div className="flex gap-3 mt-1 items-center">
                {form.cover_image && <img src={form.cover_image} alt="" className="w-28 h-20 rounded-2xl object-cover" />}
                <label className="border-2 border-dashed rounded-2xl px-4 py-3 cursor-pointer text-sm">
                  {uploading ? 'מעלה...' : 'העלה תמונה'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>
            <div>
              <Label>תוכן HTML</Label>
              <Textarea value={form.content_html} onChange={(e) => setForm(current => ({ ...current, content_html: e.target.value }))} className="rounded-xl mt-1 font-mono" rows={12} />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium mb-3">תצוגה מקדימה</p>
              <div dangerouslySetInnerHTML={{ __html: form.content_html || '<p>המאמר יופיע כאן.</p>' }} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(current => ({ ...current, is_published: e.target.checked }))} />
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
