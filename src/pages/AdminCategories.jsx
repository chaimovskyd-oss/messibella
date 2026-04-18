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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2, Image, FolderOpen, FolderTree, Menu } from 'lucide-react';
import { getCategories } from '@/data/store';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', parent_id: '', image_url: '', display_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);

  // Nav menu state
  const [navDialogOpen, setNavDialogOpen] = useState(false);
  const [editNav, setEditNav] = useState(null);
  const [navForm, setNavForm] = useState({ label: '', page: '', url: '', display_order: 0, is_active: true });

  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: async () => getCategories(), initialData: [] });
  const { data: navItems } = useQuery({ queryKey: ['nav-menu'], queryFn: () => base44.entities.NavMenuItem.list('display_order'), initialData: [] });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem ? base44.entities.Category.update(editItem.id, data) : base44.entities.Category.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setDialogOpen(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const saveNavMutation = useMutation({
    mutationFn: (data) => editNav ? base44.entities.NavMenuItem.update(editNav.id, data) : base44.entities.NavMenuItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nav-menu'] }); setNavDialogOpen(false); }
  });

  const deleteNavMutation = useMutation({
    mutationFn: (id) => base44.entities.NavMenuItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nav-menu'] }),
  });

  const handleEdit = (item) => { setEditItem(item); setForm({ ...item, parent_id: item.parent_id || '' }); setDialogOpen(true); };
  const handleNew = (parentId = '') => { setEditItem(null); setForm({ name: '', parent_id: parentId, image_url: '', display_order: 0, is_active: true }); setDialogOpen(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, image_url: file_url });
    setUploading(false);
  };

  const handleEditNav = (item) => { setEditNav(item); setNavForm(item); setNavDialogOpen(true); };
  const handleNewNav = () => { setEditNav(null); setNavForm({ label: '', page: '', url: '', display_order: 0, is_active: true }); setNavDialogOpen(true); };

  const rootCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId) => categories.filter(c => c.parent_id === parentId);

  return (
    <AdminLayout currentPage="AdminCategories">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">קטגוריות ותפריטים</h1>

      <Tabs defaultValue="categories">
        <TabsList className="mb-6">
          <TabsTrigger value="categories" className="gap-2"><FolderTree className="w-4 h-4" /> קטגוריות</TabsTrigger>
          <TabsTrigger value="nav" className="gap-2"><Menu className="w-4 h-4" /> תפריט ניווט</TabsTrigger>
        </TabsList>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleNew()} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
              <Plus className="w-4 h-4 ml-2" /> קטגוריה ראשית חדשה
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
          ) : (
            <div className="space-y-4">
              {rootCategories.map(cat => {
                const subs = getSubcategories(cat.id);
                return (
                  <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Parent category row */}
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><FolderOpen className="w-6 h-6 text-gray-300" /></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{cat.name}</h3>
                          {!cat.is_active && <Badge variant="secondary">לא פעיל</Badge>}
                        </div>
                        <p className="text-sm text-gray-500">{subs.length} תת-קטגוריות</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleNew(cat.id)}>
                          <Plus className="w-3 h-3 ml-1" /> תת-קטגוריה
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleEdit(cat)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 rounded-lg" onClick={() => deleteMutation.mutate(cat.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {subs.length > 0 && (
                      <div className="border-t bg-gray-50 px-4 py-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {subs.map(sub => (
                            <div key={sub.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {sub.image_url ? <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><FolderOpen className="w-4 h-4 text-gray-300" /></div>}
                              </div>
                              <span className="text-sm font-medium flex-1 truncate">{sub.name}</span>
                              <div className="flex gap-1">
                                <button onClick={() => handleEdit(sub)} className="text-gray-400 hover:text-[#B68AD8]"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => deleteMutation.mutate(sub.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
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
          )}
        </TabsContent>

        {/* NAV MENU TAB */}
        <TabsContent value="nav">
          <div className="flex justify-end mb-4">
            <Button onClick={handleNewNav} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
              <Plus className="w-4 h-4 ml-2" /> פריט תפריט חדש
            </Button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {navItems.length === 0 ? (
              <p className="text-center text-gray-400 py-10">אין פריטי תפריט</p>
            ) : (
              <div className="divide-y">
                {navItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.page || item.url || '—'}</p>
                    </div>
                    <Badge className={item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {item.is_active ? 'פעיל' : 'מוסתר'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditNav(item)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteNavMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'עריכת קטגוריה' : form.parent_id ? 'תת-קטגוריה חדשה' : 'קטגוריה חדשה'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>שם *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl mt-1" /></div>
            <div>
              <Label>קטגוריית אב (לתת-קטגוריה)</Label>
              <Select value={form.parent_id || 'none'} onValueChange={(v) => setForm({...form, parent_id: v === 'none' ? '' : v})}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="קטגוריה ראשית (ללא אב)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ראשית (ללא אב)</SelectItem>
                  {rootCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תמונה</Label>
              <div className="flex gap-3 mt-1">
                {form.image_url && <img src={form.image_url} alt="" className="w-20 h-20 rounded-xl object-cover" />}
                <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-[#B68AD8] transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <div><Label>סדר תצוגה</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({...form, display_order: Number(e.target.value)})} className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
              <Label>פעיל</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1 bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמירה'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nav Menu Dialog */}
      <Dialog open={navDialogOpen} onOpenChange={setNavDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editNav ? 'עריכת פריט תפריט' : 'פריט תפריט חדש'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>תווית *</Label><Input value={navForm.label} onChange={(e) => setNavForm({...navForm, label: e.target.value})} className="rounded-xl mt-1" placeholder="דף הבית" /></div>
            <div><Label>שם דף (ניווט פנימי)</Label><Input value={navForm.page} onChange={(e) => setNavForm({...navForm, page: e.target.value})} className="rounded-xl mt-1" placeholder="Home / Catalog / ..." /></div>
            <div><Label>קישור חיצוני</Label><Input value={navForm.url} onChange={(e) => setNavForm({...navForm, url: e.target.value})} className="rounded-xl mt-1" placeholder="https://..." /></div>
            <div><Label>סדר תצוגה</Label><Input type="number" value={navForm.display_order} onChange={(e) => setNavForm({...navForm, display_order: Number(e.target.value)})} className="rounded-xl mt-1" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={navForm.is_active} onChange={(e) => setNavForm({...navForm, is_active: e.target.checked})} />
              <Label>פעיל</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => saveNavMutation.mutate(navForm)} disabled={saveNavMutation.isPending} className="flex-1 bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">שמירה</Button>
              <Button variant="outline" onClick={() => setNavDialogOpen(false)} className="rounded-xl">ביטול</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

