import React from 'react';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '@/components/home/HeroSection';
import BenefitsSection from '@/components/home/BenefitsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import PopularProducts from '@/components/home/PopularProducts';
import PromoBanner from '@/components/home/PromoBanner';
import ReviewsSection from '@/components/home/ReviewsSection';
import { getBanners, getCategories, getProducts, getReviews } from '@/data/store';

export default function Home() {
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => getBanners(),
    initialData: [],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => getCategories(),
    initialData: [],
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => getProducts(),
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => getReviews().filter(review => review.is_approved),
    initialData: [],
  });

  const promoBanner = banners.find(b => b.type === 'promo' && b.is_active);

  return (
    <div>
      <HeroSection banners={banners} />
      <BenefitsSection />
      <CategoriesSection categories={categories} />
      <PopularProducts products={products} />
      <PromoBanner banner={promoBanner} />
      <ReviewsSection reviews={reviews} />
    </div>
  );
}
