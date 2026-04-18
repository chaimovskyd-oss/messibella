import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, X, Loader2, Image, Palette } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getChildCategories, getRootCategories } from '@/utils/categories';
import { getCategories, getProducts } from '@/data/store';

const emptyProduct = {
  name: '', category_id: '', main_image: '', gallery: [], short_description: '', full_description: '',
  base_price: 0, quantity_discounts: [
    { min_qty: 10, max_qty: 29, discount_percent: 10 },
    { min_qty: 30, max_qty: 49, discount_percent: 15 },
    { min_qty: 50, max_qty: null, discount_percent: 20 },
  ],
  customization_options: [
    { type: 'text', label: 'שם הילד', required: true, options: [] },
    { type: 'text', label: 'שם הגן', required: false, options: [] },
  ],
  tags: [], is_active: true, display_order: 0
};

function OptionValuesEditor({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState('');

  const addValue = () => {
    const nextValue = draft.trim();
    if (!nextValue) return;
    if (values.includes(nextValue)) {
      setDraft('');
      return;
    }
    onChange([...values, nextValue]);
    setDraft('');
  };

  const removeValue = (valueToRemove) => {
    onChange(values.filter(value => value !== valueToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addValue();
            }
          }}
          className="rounded-lg h-9 text-sm"
        />
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={addValue}>
          הוסף
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map(value => (
          <Badge key={value} variant="secondary" className="gap-1 px-2 py-1">
            {value}
            <button type="button" onClick={() => removeValue(value)} className="text-gray-500 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);

  const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: async () => getProducts(), initialData: [] });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: async () => getCategories(), initialData: [] });
  const orderedCategories = getRootCategories(categories).flatMap(root => [root, ...getChildCategories(categories, root.id)]);

  const saveMutation = useMutation({
    mutationFn: (data) => editProduct
      ? base44.entities.Product.update(editProduct.id, data)
      : base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      setEditProduct(null);
      setForm(emptyProduct);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({
      ...emptyProduct,
      ...product,
      quantity_discounts: product.quantity_discounts?.length ? product.quantity_discounts : emptyProduct.quantity_discounts,
      customization_options: product.customization_options?.length ? product.customization_options : emptyProduct.customization_options,
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, main_image: file_url }));
    setUploading(false);
  };

  const handleDesignImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const designs = [...(form.design_options || [])];
    designs[index] = { ...designs[index], image_url: file_url };
    setForm(f => ({ ...f, design_options: designs }));
    setUploading(false);
  };

  const addDesign = () => {
    setForm(f => ({ ...f, design_options: [...(f.design_options || []), { name: '', image_url: '' }] }));
  };

  const removeDesign = (index) => {
    setForm(f => ({ ...f, design_options: f.design_options.filter((_, i) => i !== index) }));
  };

  const updateDesign = (index, field, value) => {
    const designs = [...(form.design_options || [])];
    designs[index] = { ...designs[index], [field]: value };
    setForm(f => ({ ...f, design_options: designs }));
  };

  const addCustomOption = () => {
    setForm(f => ({ ...f, customization_options: [...(f.customization_options || []), { type: 'text', label: '', required: false, options: [] }] }));
  };

  const removeCustomOption = (index) => {
    setForm(f => ({ ...f, customization_options: f.customization_options.filter((_, i) => i !== index) }));
  };

  const updateCustomOption = (index, field, value) => {
    const opts = [...(form.customization_options || [])];
    opts[index] = { ...opts[index], [field]: value };
    setForm(f => ({ ...f, customization_options: opts }));
  };

  const toggleTag = (tag) => {
    const tags = form.tags || [];
    setForm({ ...form, tags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] });
  };

  const updateDiscount = (index, field, value) => {
    const discounts = [...(form.quantity_discounts || [])];
    discounts[index] = { ...discounts[index], [field]: value === '' ? null : Number(value) };
    setForm({ ...form, quantity_discounts: discounts });
  };

  return (
    <AdminLayout currentPage="AdminProducts">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">מוצרים</h1>
        <Button onClick={handleNew} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
          <Plus className="w-4 h-4 ml-2" /> מוצר חדש
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <Card key={product.id} className="border-0 shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {product.main_image ? (
                  <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><Image className="w-8 h-8 text-gray-300" /></div>
                )}
                {!product.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold">לא פעיל</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-[#B68AD8] font-bold mb-2">₪{product.base_price}</p>
                <div className="flex gap-1 mb-3">
                  {product.tags?.map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => handleEdit(product)}>
                    <Pencil className="w-3 h-3 ml-1" /> עריכה
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 rounded-lg" onClick={() => deleteMutation.mutate(product.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'עריכת מוצר' : 'מוצר חדש'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="basic" className="flex-1">פרטים בסיסיים</TabsTrigger>
              <TabsTrigger value="designs" className="flex-1">עיצובים גרפיים</TabsTrigger>
              <TabsTrigger value="customization" className="flex-1">התאמה אישית</TabsTrigger>
            </TabsList>

            {/* BASIC */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>שם המוצר *</Label>
                  <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>קטגוריה</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({...form, category_id: v})}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="בחרו קטגוריה" /></SelectTrigger>
                    <SelectContent>
                      {orderedCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.parent_id ? `- ${c.name}` : c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>מחיר בסיס *</Label>
                  <Input type="number" value={form.base_price} onChange={(e) => setForm({...form, base_price: Number(e.target.value)})} className="rounded-xl mt-1" />
                </div>
              </div>
              <div>
                <Label>תמונה ראשית</Label>
                <div className="flex gap-3 mt-1">
                  {form.main_image && <img src={form.main_image} alt="" className="w-20 h-20 rounded-xl object-cover" />}
                  <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-[#B68AD8] transition-colors">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div><Label>תיאור קצר</Label><Input value={form.short_description} onChange={(e) => setForm({...form, short_description: e.target.value})} className="rounded-xl mt-1" /></div>
              <div><Label>תיאור מלא</Label><Textarea value={form.full_description} onChange={(e) => setForm({...form, full_description: e.target.value})} className="rounded-xl mt-1" rows={3} /></div>
              <div>
                <Label>תגיות</Label>
                <div className="flex gap-2 mt-1">
                  {['best_seller', 'new', 'sale'].map(tag => (
                    <Badge key={tag} className={`cursor-pointer ${form.tags?.includes(tag) ? 'bg-[#B68AD8] text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => toggleTag(tag)}>
                      {tag === 'best_seller' ? 'הכי נמכר' : tag === 'new' ? 'חדש' : 'מבצע'}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>הנחות כמות</Label>
                <div className="space-y-2 mt-1">
                  {form.quantity_discounts?.map((d, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input type="number" placeholder="מ-" value={d.min_qty || ''} onChange={(e) => updateDiscount(i, 'min_qty', e.target.value)} className="w-20 rounded-lg text-sm" />
                      <span className="text-gray-400">-</span>
                      <Input type="number" placeholder="עד" value={d.max_qty || ''} onChange={(e) => updateDiscount(i, 'max_qty', e.target.value)} className="w-20 rounded-lg text-sm" />
                      <Input type="number" placeholder="%" value={d.discount_percent || ''} onChange={(e) => updateDiscount(i, 'discount_percent', e.target.value)} className="w-20 rounded-lg text-sm" />
                      <span className="text-xs text-gray-400">% הנחה</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
                <Label>מוצר פעיל</Label>
              </div>
            </TabsContent>

            {/* DESIGNS */}
            <TabsContent value="designs" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">עיצובים גרפיים</p>
                  <p className="text-sm text-gray-500">הלקוח יוכל לבחור מתוך העיצובים שתעלו</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={addDesign}>
                  <Plus className="w-3 h-3 ml-1" /> הוסף עיצוב
                </Button>
              </div>
              {(form.design_options || []).length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-2xl text-gray-400">
                  <Palette className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>אין עיצובים. לחצו "הוסף עיצוב"</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {(form.design_options || []).map((d, i) => (
                  <div key={i} className="border rounded-2xl p-3 space-y-2 relative">
                    <button onClick={() => removeDesign(i)} className="absolute top-2 left-2 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      {d.image_url ? (
                        <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-200 transition-colors">
                          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                          <span className="text-xs text-gray-400 mt-1">העלה תמונה</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, i)} />
                        </label>
                      )}
                    </div>
                    {d.image_url && (
                      <label className="block text-center text-xs text-[#B68AD8] cursor-pointer">
                        החלף תמונה
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, i)} />
                      </label>
                    )}
                    <Input placeholder="שם העיצוב" value={d.name} onChange={(e) => updateDesign(i, 'name', e.target.value)} className="rounded-lg text-sm h-8" />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* CUSTOMIZATION OPTIONS */}
            <TabsContent value="customization" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">שדות התאמה אישית</p>
                  <p className="text-sm text-gray-500">שדות שהלקוח ימלא בעת ההזמנה</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={addCustomOption}>
                  <Plus className="w-3 h-3 ml-1" /> הוסף שדה
                </Button>
              </div>
              <div className="space-y-3">
                {(form.customization_options || []).map((opt, i) => (
                  <div key={i} className="border rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={opt.type} onValueChange={(v) => updateCustomOption(i, 'type', v)}>
                        <SelectTrigger className="w-36 rounded-lg h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">טקסט חופשי</SelectItem>
                          <SelectItem value="names_list">רשימת שמות</SelectItem>
                          <SelectItem value="select">בחירה מרשימה</SelectItem>
                          <SelectItem value="color">בחירת צבע</SelectItem>
                          <SelectItem value="image">העלאת תמונה</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="תווית שדה" value={opt.label} onChange={(e) => updateCustomOption(i, 'label', e.target.value)} className="flex-1 rounded-lg h-8 text-sm" />
                      <div className="flex items-center gap-1">
                        <input type="checkbox" checked={opt.required} onChange={(e) => updateCustomOption(i, 'required', e.target.checked)} />
                        <span className="text-xs">חובה</span>
                      </div>
                      <button onClick={() => removeCustomOption(i)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {(opt.type === 'select' || opt.type === 'color') && (
                      <OptionValuesEditor
                        values={opt.options || []}
                        onChange={(nextOptions) => updateCustomOption(i, 'options', nextOptions)}
                        placeholder={opt.type === 'color' ? 'הוסיפו צבע' : 'הוסיפו אפשרות'}
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="flex-1 bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמירה'}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">ביטול</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

