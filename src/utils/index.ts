export const PAGE_ROUTES: Record<string, string> = {
  Home: '/',
  Catalog: '/catalog',
  ProductPage: '/product',
  Cart: '/cart',
  Checkout: '/checkout',
  MyOrders: '/my-orders',
  Tips: '/tips',
  Gallery: '/gallery',
  Testimonials: '/testimonials',
  AdminLogin: '/admin/login',
  AdminDashboard: '/admin',
  AdminProducts: '/admin/products',
  AdminCategories: '/admin/categories',
  AdminBanners: '/admin/banners',
  AdminOrders: '/admin/orders',
  AdminTips: '/admin/tips',
  AdminGallery: '/admin/gallery',
  AdminCoupons: '/admin/coupons',
  AdminReviews: '/admin/reviews',
  AdminShipping: '/admin/shipping',
};

export function createPageUrl(pageName: string) {
  return PAGE_ROUTES[pageName] || `/${pageName.replace(/ /g, '-').toLowerCase()}`;
}
