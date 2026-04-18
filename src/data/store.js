import { getCollection } from '@/services/siteContentService';

export function getProducts() {
  return getCollection('Product');
}

export function getCategories() {
  return getCollection('Category');
}

export function getBanners() {
  return getCollection('Banner');
}

export function getShippingOptions() {
  return getCollection('ShippingOption');
}

export function getCoupons() {
  return getCollection('Coupon');
}

export function getReviews() {
  return getCollection('Review');
}

export function getOrders() {
  return [];
}

export function getNavMenuItems() {
  return getCollection('NavMenuItem');
}

export function getBlogPosts() {
  return getCollection('BlogPost');
}

export function getGalleryItems() {
  return getCollection('GalleryItem');
}
