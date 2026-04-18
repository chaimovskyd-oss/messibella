import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/store/ProductCard';
import ProductCustomization from '@/components/store/ProductCustomization';
import QuantityDiscountTable from '@/components/store/QuantityDiscountTable';
import { useCart } from '@/components/store/CartContext';
import { createPageUrl } from '@/utils';
import { getCategoryLineage, getCategoryMap } from '@/utils/categories';
import { getCategories, getProducts, getReviews } from '@/data/store';

const tagConfig = {
  best_seller: { label: 'הכי נמכר', color: 'bg-[#F5B731] text-white' },
  new: { label: 'חדש!', color: 'bg-[#5BC5C8] text-white' },
  sale: { label: 'מבצע', color: 'bg-red-500 text-white' },
};

export default function ProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => getProducts().find(currentProduct => currentProduct.id === productId),
    enabled: !!productId,
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => getProducts(),
    initialData: [],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => getCategories(),
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => getReviews().filter(review => review.product_id === productId && review.is_approved),
    initialData: [],
    enabled: !!productId,
  });

  const discountedPrice = useMemo(() => {
    if (!product) return 0;
    const discounts = product.quantity_discounts || [];
    let discount = 0;
    for (const entry of discounts) {
      if (quantity >= entry.min_qty && (!entry.max_qty || quantity <= entry.max_qty)) {
        discount = entry.discount_percent;
      }
    }
    return product.base_price * (1 - discount / 100);
  }, [product, quantity]);

  const related = useMemo(() => {
    if (!product) return [];
    const categoryMap = getCategoryMap(categories);
    const currentCategory = categoryMap.get(product.category_id);
    const siblingRootId = currentCategory?.parent_id || currentCategory?.id;

    return allProducts
      .filter(candidate => {
        if (candidate.id === product.id || candidate.is_active === false) return false;
        if (candidate.category_id === product.category_id) return true;

        const candidateCategory = categoryMap.get(candidate.category_id);
        const candidateRootId = candidateCategory?.parent_id || candidateCategory?.id;
        return siblingRootId && candidateRootId === siblingRootId;
      })
      .slice(0, 4);
  }, [allProducts, categories, product]);

  const images = product ? [product.main_image, ...(product.gallery || [])].filter(Boolean) : [];

  const handleAddToCart = () => {
    addToCart(product, quantity, { ...customizations, ...(selectedDesign ? { עיצוב: selectedDesign } : {}) });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">מוצר לא נמצא</p>
        <Link to={createPageUrl('Catalog')}>
          <Button className="mt-4">חזרה למוצרים</Button>
        </Link>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : null;
  const categoryLineage = getCategoryLineage(categories, product.category_id);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-6 overflow-x-hidden">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-1">
          <Link to={createPageUrl('Home')} className="hover:text-[#B68AD8]">דף הבית</Link>
          <ArrowRight className="w-3 h-3 flex-shrink-0" />
          <Link to={createPageUrl('Catalog')} className="hover:text-[#B68AD8]">מוצרים</Link>
          {categoryLineage.map(category => (
            <React.Fragment key={category.id}>
              <ArrowRight className="w-3 h-3 flex-shrink-0" />
              <Link to={createPageUrl('Catalog') + `?category=${category.id}`} className="hover:text-[#B68AD8]">
                {category.name}
              </Link>
            </React.Fragment>
          ))}
          <ArrowRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-start">
          <div className="min-w-0">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 aspect-square mb-4">
              <img
                src={images[selectedImage] || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-[#B68AD8] shadow-md' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {product.tags?.map(tag => (
                <Badge key={tag} className={`${tagConfig[tag]?.color} rounded-lg`}>
                  {tagConfig[tag]?.label}
                </Badge>
              ))}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 break-words">{product.name}</h1>

            {avgRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`w-4 h-4 ${index < Math.round(avgRating) ? 'fill-[#F5B731] text-[#F5B731]' : 'fill-gray-200 text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({reviews.length} ביקורות)</span>
              </div>
            )}

            <p className="text-gray-600 mb-6 leading-relaxed break-words">{product.short_description}</p>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#B68AD8]">₪{discountedPrice.toFixed(0)}</span>
                {discountedPrice < product.base_price && (
                  <span className="text-lg text-gray-400 line-through">₪{product.base_price}</span>
                )}
                <span className="text-sm text-gray-500">/ יחידה</span>
              </div>
              {quantity > 1 && (
                <p className="text-sm text-gray-500 mt-1">
                  סה&quot;כ: <span className="font-bold text-gray-900">₪{(discountedPrice * quantity).toFixed(0)}</span>
                </p>
              )}
            </div>

            <div className="mb-6">
              <QuantityDiscountTable
                discounts={product.quantity_discounts}
                currentQty={quantity}
                basePrice={product.base_price}
              />
            </div>

            <div className="mb-6 min-w-0">
              <ProductCustomization
                options={product.customization_options}
                values={customizations}
                onChange={setCustomizations}
                designOptions={product.design_options}
                selectedDesign={selectedDesign}
                onDesignChange={setSelectedDesign}
              />
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
              <span className="font-medium text-gray-700">כמות:</span>
              <div className="flex items-center bg-gray-100 rounded-xl">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-14 sm:w-16 text-center bg-transparent font-bold text-lg border-none outline-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleAddToCart}
                className={`w-full text-base sm:text-lg py-6 rounded-2xl font-bold shadow-lg transition-all duration-300 whitespace-normal min-h-14 ${
                  added
                    ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                    : 'bg-[#F5B731] hover:bg-[#e5a821] shadow-[#F5B731]/30'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 ml-2" />
                    נוסף לסל!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 ml-2" />
                    הוסיפו לסל - ₪{(discountedPrice * quantity).toFixed(0)}
                  </>
                )}
              </Button>
            </motion.div>

            {product.full_description && (
              <div className="mt-8 prose max-w-none">
                <h3 className="font-bold text-gray-900">תיאור מלא</h3>
                <p className="text-gray-600 whitespace-pre-line break-words">{product.full_description}</p>
              </div>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ביקורות לקוחות</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`w-4 h-4 ${index < review.rating ? 'fill-[#F5B731] text-[#F5B731]' : 'fill-gray-200 text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-2 break-words">&quot;{review.text}&quot;</p>
                  <p className="text-sm text-gray-500">{review.reviewer_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">קונים גם יחד עם זה</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((relatedProduct, index) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
