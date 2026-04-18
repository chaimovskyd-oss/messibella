import products from '@/data/products.json';
import categories from '@/data/categories.json';

export const SITE_PHONE = '0547695345';
export const SITE_PHONE_DISPLAY = '054-769-5345';
export const SITE_EMAIL = 'messibella.online@gmail.com';
export const ADMIN_EMAIL = 'chaimovsky.d@gmail.com';
export const ADMIN_PASSWORD = '22122234';

const oldEmailPattern = /(?:info@masibala\.co\.il|chaimovsky\.d@gmail\.com)/gi;
const oldPhonePattern = /050-?1234567/g;

function replaceContactValues(text) {
  return String(text || '')
    .replace(oldEmailPattern, SITE_EMAIL)
    .replace(oldPhonePattern, SITE_PHONE_DISPLAY);
}

function normalizeProduct(product) {
  return {
    ...product,
    short_description: replaceContactValues(product.short_description),
    full_description: replaceContactValues(product.full_description),
  };
}

export const defaultProducts = products.map(normalizeProduct);
export const defaultCategories = categories;

export const defaultBanners = [
  {
    id: 'banner-hero-local',
    title: 'מוצרים ממותגים לילדים ולגנים',
    subtitle: 'קטלוג מקומי עם התאמה אישית, תיקים, בקבוקים ומתנות',
    image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200',
    button_text: 'לצפייה במוצרים',
    button_link: 'Catalog',
    type: 'hero',
    is_active: true,
    display_order: 1,
  },
];

export const defaultShippingOptions = [
  { id: 'shipping-delivery', name: 'משלוח עד הבית', type: 'delivery', price: 30, free_above: 200, estimated_days: '3-5 ימי עסקים', is_active: true },
  { id: 'shipping-pickup-point', name: 'נקודת איסוף', type: 'pickup_point', price: 15, free_above: null, estimated_days: '2-4 ימי עסקים', is_active: true },
  { id: 'shipping-self-pickup', name: 'איסוף עצמי', type: 'self_pickup', price: 0, free_above: null, estimated_days: '1-2 ימי עסקים', is_active: true },
];

export const defaultCoupons = [];
export const defaultReviews = [];
export const defaultGalleryItems = [];
export const defaultBlogPosts = [];
export const defaultOrders = [];

export const defaultNavMenuItems = [
  { id: 'nav-home', label: 'דף הבית', page: 'Home', display_order: 1, is_active: true },
  { id: 'nav-catalog', label: 'מוצרים', page: 'Catalog', display_order: 2, is_active: true },
  { id: 'nav-tips', label: 'הטיפים שלנו', page: 'Tips', display_order: 3, is_active: true },
  { id: 'nav-gallery', label: 'גלריה', page: 'Gallery', display_order: 4, is_active: true },
  { id: 'nav-testimonials', label: 'מה לקוחות אומרים עלינו', page: 'Testimonials', display_order: 5, is_active: true },
  { id: 'nav-contact', label: 'צור קשר', page: 'Home', display_order: 6, is_active: true },
];

export function getDefaultCollection(entityName) {
  const collections = {
    Product: defaultProducts,
    Category: defaultCategories,
    Banner: defaultBanners,
    Review: defaultReviews,
    ShippingOption: defaultShippingOptions,
    Coupon: defaultCoupons,
    NavMenuItem: defaultNavMenuItems,
    BlogPost: defaultBlogPosts,
    GalleryItem: defaultGalleryItems,
  };

  return collections[entityName] || [];
}
