import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image, Loader2, Palette, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getCategories, getProducts } from '@/data/store';
import { getChildCategories, getRootCategories } from '@/utils/categories';

const emptyProduct = {
  name: '',
  category_id: '',
  main_image: '',
  gallery: [],
  short_description: '',
  full_description: '',
  base_price: 0,
  inventory_quantity: 0,
  quantity_discounts: [
    { min_qty: 10, max_qty: 29, discount_percent: 10 },
    { min_qty: 30, max_qty: 49, discount_percent: 15 },
    { min_qty: 50, max_qty: null, discount_percent: 20 },
  ],
  customization_options: [
    { type: 'text', label: 'שם הילד', required: true, options: [] },
    { type: 'text', label: 'שם הגן', required: false, options: [] },
  ],
  design_options: [],
  tags: [],
  is_active: true,
  display_order: 0,
};

const emptyBulkForm = {
  targetCategoryId: 'all',
  moveCategoryId: 'unchanged',
  priceMode: 'none',
  priceValue: '',
  inventoryValue: '',
  designName: '',
  designImageUrl: '',
};

function OptionValuesEditor({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState('');

  const addValue = () => {
    const nextValue = draft.trim();
    if (!nextValue || values.includes(nextValue)) {
      setDraft('');
      return;
    }
    onChange([...values, nextValue]);
    setDraft('');
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
            <button type="button" onClick={() => onChange(values.filter(item => item !== value))} className="text-gray-500 hover:text-red-500">
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
  const [filters, setFilters] = useState({ search: '', categoryId: 'all', sortBy: 'name' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkForm, setBulkForm] = useState(emptyBulkForm);

  const { data: products = [], isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: getProducts, initialData: [] });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories, initialData: [] });
  const orderedCategories = getRootCategories(categories).flatMap(root => [root, ...getChildCategories(categories, root.id)]);

  const filteredProducts = useMemo(() => {
    const nextProducts = [...products].filter(product => {
      const matchesSearch = !filters.search || product.name?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.categoryId === 'all' || product.category_id === filters.categoryId;
      return matchesSearch && matchesCategory;
    });

    switch (filters.sortBy) {
      case 'price':
        nextProducts.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        break;
      case 'updated':
        nextProducts.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
        break;
      default:
        nextProducts.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'he'));
        break;
    }

    return nextProducts;
  }, [filters, products]);

  const selectedProducts = filteredProducts.filter(product => selectedIds.includes(product.id));

  const saveMutation = useMutation({
    mutationFn: (data) => editProduct
      ? base44.entities.Product.update(editProduct.id, data)
      : base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDialogOpen(false);
      setEditProduct(null);
      setForm(emptyProduct);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const targets = selectedIds.length > 0
        ? products.filter(product => selectedIds.includes(product.id))
        : products.filter(product => bulkForm.targetCategoryId === 'all' || product.category_id === bulkForm.targetCategoryId);

      await Promise.all(targets.map(product => {
        const nextData = {};

        if (bulkForm.moveCategoryId !== 'unchanged') {
          nextData.category_id = bulkForm.moveCategoryId;
        }

        if (bulkForm.priceMode === 'set' && bulkForm.priceValue !== '') {
          nextData.base_price = Number(bulkForm.priceValue);
        }

        if (bulkForm.priceMode === 'increase' && bulkForm.priceValue !== '') {
          nextData.base_price = Number(product.base_price || 0) + Number(bulkForm.priceValue);
        }

        if (bulkForm.priceMode === 'decrease' && bulkForm.priceValue !== '') {
          nextData.base_price = Math.max(0, Number(product.base_price || 0) - Number(bulkForm.priceValue));
        }

        if (bulkForm.inventoryValue !== '') {
          nextData.inventory_quantity = Number(bulkForm.inventoryValue);
        }

        if (bulkForm.designName && bulkForm.designImageUrl) {
          nextData.design_options = [
            ...(product.design_options || []),
            { name: bulkForm.designName, image_url: bulkForm.designImageUrl },
          ];
        }

        return base44.entities.Product.update(product.id, nextData);
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedIds([]);
      setBulkForm(emptyBulkForm);
    },
  });

  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({
      ...emptyProduct,
      ...product,
      quantity_discounts: product.quantity_discounts?.length ? product.quantity_discounts : emptyProduct.quantity_discounts,
      customization_options: product.customization_options?.length ? product.customization_options : emptyProduct.customization_options,
      design_options: product.design_options || [],
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'site-assets/products' });
      setForm(current => ({ ...current, main_image: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const handleDesignImageUpload = async (event, index) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file, folder: 'site-assets/product-designs' });
      setForm(current => {
        const nextDesigns = [...(current.design_options || [])];
        nextDesigns[index] = { ...nextDesigns[index], image_url: file_url };
        return { ...current, design_options: nextDesigns };
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDiscount = (index, field, value) => {
    const nextDiscounts = [...(form.quantity_discounts || [])];
    nextDiscounts[index] = { ...nextDiscounts[index], [field]: value === '' ? null : Number(value) };
    setForm(current => ({ ...current, quantity_discounts: nextDiscounts }));
  };

  const updateCustomOption = (index, field, value) => {
    const nextOptions = [...(form.customization_options || [])];
    nextOptions[index] = { ...nextOptions[index], [field]: value };
    setForm(current => ({ ...current, customization_options: nextOptions }));
  };

  const toggleSelected = (productId) => {
    setSelectedIds(current => current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId]);
  };

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every(product => selectedIds.includes(product.id));

  return (
    <AdminLayout currentPage="AdminProducts">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">מוצרים</h1>
        <Button onClick={() => { setEditProduct(null); setForm(emptyProduct); setDialogOpen(true); }} className="bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-xl">
          <Plus className="w-4 h-4 ml-2" /> מוצר חדש
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={filters.search} onChange={(e) => setFilters(current => ({ ...current, search: e.target.value }))} placeholder="חיפוש מוצר" className="rounded-xl pr-10" />
          </div>
          <Select value={filters.categoryId} onValueChange={(value) => setFilters(current => ({ ...current, categoryId: value }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {orderedCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.parent_id ? `- ${category.name}` : category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.sortBy} onValueChange={(value) => setFilters(current => ({ ...current, sortBy: value }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">מיון לפי שם</SelectItem>
              <SelectItem value="price">מיון לפי מחיר</SelectItem>
              <SelectItem value="updated">מיון לפי עדכון אחרון</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="font-bold text-gray-900">כלים חכמים לעריכה כמותית</h2>
              <p className="text-sm text-gray-500">אפשר לבחור מוצרים ספציפיים, או להריץ פעולה על קטגוריה שלמה.</p>
            </div>
            <Button variant="outline" className="rounded-xl w-full md:w-auto" onClick={() => setSelectedIds(allVisibleSelected ? [] : filteredProducts.map(product => product.id))}>
              {allVisibleSelected ? 'נקה בחירה' : 'בחר את כל המוצגים'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <Select value={bulkForm.targetCategoryId} onValueChange={(value) => setBulkForm(current => ({ ...current, targetCategoryId: value }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="קטגוריה לעדכון" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {orderedCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.parent_id ? `- ${category.name}` : category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bulkForm.moveCategoryId} onValueChange={(value) => setBulkForm(current => ({ ...current, moveCategoryId: value }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unchanged">ללא שינוי קטגוריה</SelectItem>
                {orderedCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.parent_id ? `- ${category.name}` : category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={bulkForm.priceMode} onValueChange={(value) => setBulkForm(current => ({ ...current, priceMode: value }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא שינוי מחיר</SelectItem>
                <SelectItem value="set">הגדרת מחיר חדש</SelectItem>
                <SelectItem value="increase">העלאת מחיר</SelectItem>
                <SelectItem value="decrease">הורדת מחיר</SelectItem>
              </SelectContent>
            </Select>

            <Input value={bulkForm.priceValue} onChange={(e) => setBulkForm(current => ({ ...current, priceValue: e.target.value }))} placeholder="ערך מחיר" className="rounded-xl" />
            <Input value={bulkForm.inventoryValue} onChange={(e) => setBulkForm(current => ({ ...current, inventoryValue: e.target.value }))} placeholder="מלאי חדש" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input value={bulkForm.designName} onChange={(e) => setBulkForm(current => ({ ...current, designName: e.target.value }))} placeholder="שם עיצוב חדש" className="rounded-xl" />
            <Input value={bulkForm.designImageUrl} onChange={(e) => setBulkForm(current => ({ ...current, designImageUrl: e.target.value }))} placeholder="קישור לתמונת עיצוב" className="rounded-xl" />
            <Button onClick={() => bulkMutation.mutate()} disabled={bulkMutation.isPending} className="bg-[#F5B731] hover:bg-[#e5a821] rounded-xl">
              {bulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'החל עדכונים כמותיים'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            נבחרו {selectedProducts.length} מוצרים ידנית. אם לא תבחרו מוצרים, הפעולה תרוץ על הקטגוריה שנבחרה.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="border-0 shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                <label className="absolute top-3 right-3 z-10 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelected(product.id)} />
                  בחר
                </label>
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-[#B68AD8] font-bold mb-2">₪{product.base_price}</p>
                  </div>
                  <Badge variant="secondary">מלאי: {product.inventory_quantity ?? 0}</Badge>
                </div>
                <div className="flex gap-1 mb-3 flex-wrap">
                  {product.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
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

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>שם המוצר *</Label>
                  <Input value={form.name} onChange={(e) => setForm(current => ({ ...current, name: e.target.value }))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>קטגוריה</Label>
                  <Select value={form.category_id} onValueChange={(value) => setForm(current => ({ ...current, category_id: value }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="בחרו קטגוריה" /></SelectTrigger>
                    <SelectContent>
                      {orderedCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.parent_id ? `- ${category.name}` : category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>מחיר בסיס *</Label>
                  <Input type="number" value={form.base_price} onChange={(e) => setForm(current => ({ ...current, base_price: Number(e.target.value) }))} className="rounded-xl mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>מלאי</Label>
                  <Input type="number" value={form.inventory_quantity ?? 0} onChange={(e) => setForm(current => ({ ...current, inventory_quantity: Number(e.target.value) }))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>סדר תצוגה</Label>
                  <Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm(current => ({ ...current, display_order: Number(e.target.value) }))} className="rounded-xl mt-1" />
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
              <div><Label>תיאור קצר</Label><Input value={form.short_description} onChange={(e) => setForm(current => ({ ...current, short_description: e.target.value }))} className="rounded-xl mt-1" /></div>
              <div><Label>תיאור מלא</Label><Textarea value={form.full_description} onChange={(e) => setForm(current => ({ ...current, full_description: e.target.value }))} className="rounded-xl mt-1" rows={4} /></div>
              <div>
                <Label>תגיות</Label>
                <div className="flex gap-2 mt-1">
                  {['best_seller', 'new', 'sale'].map(tag => (
                    <Badge key={tag} className={`cursor-pointer ${form.tags?.includes(tag) ? 'bg-[#B68AD8] text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => setForm(current => ({ ...current, tags: current.tags?.includes(tag) ? current.tags.filter(item => item !== tag) : [...(current.tags || []), tag] }))}>
                      {tag === 'best_seller' ? 'הכי נמכר' : tag === 'new' ? 'חדש' : 'מבצע'}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>הנחות כמות</Label>
                <div className="space-y-2 mt-1">
                  {form.quantity_discounts?.map((discount, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input type="number" placeholder="מ-" value={discount.min_qty || ''} onChange={(e) => updateDiscount(index, 'min_qty', e.target.value)} className="w-20 rounded-lg text-sm" />
                      <span className="text-gray-400">-</span>
                      <Input type="number" placeholder="עד" value={discount.max_qty || ''} onChange={(e) => updateDiscount(index, 'max_qty', e.target.value)} className="w-20 rounded-lg text-sm" />
                      <Input type="number" placeholder="%" value={discount.discount_percent || ''} onChange={(e) => updateDiscount(index, 'discount_percent', e.target.value)} className="w-20 rounded-lg text-sm" />
                      <span className="text-xs text-gray-400">% הנחה</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(current => ({ ...current, is_active: e.target.checked }))} />
                <Label>מוצר פעיל</Label>
              </div>
            </TabsContent>

            <TabsContent value="designs" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">עיצובים גרפיים</p>
                  <p className="text-sm text-gray-500">הלקוח יוכל לבחור מתוך העיצובים שתעלו</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setForm(current => ({ ...current, design_options: [...(current.design_options || []), { name: '', image_url: '' }] }))}>
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
                {(form.design_options || []).map((design, index) => (
                  <div key={index} className="border rounded-2xl p-3 space-y-2 relative">
                    <button onClick={() => setForm(current => ({ ...current, design_options: current.design_options.filter((_, itemIndex) => itemIndex !== index) }))} className="absolute top-2 left-2 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      {design.image_url ? (
                        <img src={design.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-gray-200 transition-colors">
                          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 text-gray-400" />}
                          <span className="text-xs text-gray-400 mt-1">העלה תמונה</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, index)} />
                        </label>
                      )}
                    </div>
                    {design.image_url && (
                      <label className="block text-center text-xs text-[#B68AD8] cursor-pointer">
                        החלף תמונה
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, index)} />
                      </label>
                    )}
                    <Input placeholder="שם העיצוב" value={design.name} onChange={(e) => setForm(current => {
                      const nextDesigns = [...(current.design_options || [])];
                      nextDesigns[index] = { ...nextDesigns[index], name: e.target.value };
                      return { ...current, design_options: nextDesigns };
                    })} className="rounded-lg text-sm h-8" />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="customization" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">שדות התאמה אישית</p>
                  <p className="text-sm text-gray-500">שדות שהלקוח ימלא בעת ההזמנה</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setForm(current => ({ ...current, customization_options: [...(current.customization_options || []), { type: 'text', label: '', required: false, options: [] }] }))}>
                  <Plus className="w-3 h-3 ml-1" /> הוסף שדה
                </Button>
              </div>
              <div className="space-y-3">
                {(form.customization_options || []).map((option, index) => (
                  <div key={index} className="border rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={option.type} onValueChange={(value) => updateCustomOption(index, 'type', value)}>
                        <SelectTrigger className="w-36 rounded-lg h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">טקסט חופשי</SelectItem>
                          <SelectItem value="names_list">רשימת שמות</SelectItem>
                          <SelectItem value="select">בחירה מרשימה</SelectItem>
                          <SelectItem value="color">בחירת צבע</SelectItem>
                          <SelectItem value="image">העלאת תמונה</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="תווית שדה" value={option.label} onChange={(e) => updateCustomOption(index, 'label', e.target.value)} className="flex-1 rounded-lg h-8 text-sm" />
                      <div className="flex items-center gap-1">
                        <input type="checkbox" checked={option.required} onChange={(e) => updateCustomOption(index, 'required', e.target.checked)} />
                        <span className="text-xs">חובה</span>
                      </div>
                      <button onClick={() => setForm(current => ({ ...current, customization_options: current.customization_options.filter((_, itemIndex) => itemIndex !== index) }))} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {(option.type === 'select' || option.type === 'color') && (
                      <OptionValuesEditor
                        values={option.options || []}
                        onChange={(nextOptions) => updateCustomOption(index, 'options', nextOptions)}
                        placeholder={option.type === 'color' ? 'הוסיפו צבע' : 'הוסיפו אפשרות'}
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
