import products from '@/data/products.json';
import categories from '@/data/categories.json';

const defaultBanners = [
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
  {
    id: 'banner-promo-local',
    title: 'הזמנות כמותיות לגנים',
    subtitle: 'מגוון מוצרים בהתאמה אישית עם מחירי כמות',
    image_url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1200',
    button_text: 'לקטלוג',
    button_link: 'Catalog',
    type: 'promo',
    is_active: true,
    display_order: 2,
  },
];

const defaultShippingOptions = [
  { id: 'shipping-delivery', name: 'משלוח עד הבית', type: 'delivery', price: 30, free_above: 200, estimated_days: '3-5 ימי עסקים', is_active: true },
  { id: 'shipping-pickup-point', name: 'נקודת איסוף', type: 'pickup_point', price: 15, free_above: null, estimated_days: '2-4 ימי עסקים', is_active: true },
  { id: 'shipping-self-pickup', name: 'איסוף עצמי', type: 'self_pickup', price: 0, free_above: null, estimated_days: '1-2 ימי עסקים', is_active: true },
];

const defaultCoupons = [];
const defaultReviews = [];
const defaultOrders = [];
const defaultNavMenuItems = [];

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function readCollection(storageKey, fallbackValue) {
  const storage = getStorage();
  if (!storage) return fallbackValue;

  const stored = storage.getItem(storageKey);
  if (!stored) return fallbackValue;

  try {
    return JSON.parse(stored);
  } catch {
    return fallbackValue;
  }
}

export function getProducts() {
  return readCollection('masibala_local_Product', products);
}

export function getCategories() {
  return readCollection('masibala_local_Category', categories);
}

export function getBanners() {
  return readCollection('masibala_local_Banner', defaultBanners);
}

export function getShippingOptions() {
  return readCollection('masibala_local_ShippingOption', defaultShippingOptions);
}

export function getCoupons() {
  return readCollection('masibala_local_Coupon', defaultCoupons);
}

export function getReviews() {
  return readCollection('masibala_local_Review', defaultReviews);
}

export function getOrders() {
  return readCollection('masibala_local_Order', defaultOrders);
}

export function getNavMenuItems() {
  return readCollection('masibala_local_NavMenuItem', defaultNavMenuItems);
}
