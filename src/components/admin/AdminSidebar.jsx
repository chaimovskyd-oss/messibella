import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Package, FolderOpen, Image, ShoppingCart, Truck, Tag, Star, Settings, ArrowRight } from 'lucide-react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_67d6827d7b459e772fe40b45/ab330f83c_logo.png";

const menuItems = [
  { label: 'דשבורד', page: 'AdminDashboard', icon: LayoutDashboard },
  { label: 'מוצרים', page: 'AdminProducts', icon: Package },
  { label: 'קטגוריות', page: 'AdminCategories', icon: FolderOpen },
  { label: 'באנרים', page: 'AdminBanners', icon: Image },
  { label: 'הזמנות', page: 'AdminOrders', icon: ShoppingCart },
  { label: 'קופונים', page: 'AdminCoupons', icon: Tag },
  { label: 'ביקורות', page: 'AdminReviews', icon: Star },
  { label: 'משלוחים', page: 'AdminShipping', icon: Truck },
];

export default function AdminSidebar({ currentPage }) {
  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen p-4 hidden md:block">
      <div className="mb-6">
        <img src={LOGO_URL} alt="מסיבלה" className="h-12 mb-2" />
        <p className="text-xs text-gray-400">ניהול החנות</p>
      </div>
      
      <nav className="space-y-1">
        {menuItems.map(item => {
          const isActive = currentPage === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#B68AD8]/10 text-[#B68AD8]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowRight className="w-4 h-4" />
          חזרה לאתר
        </Link>
      </div>
    </aside>
  );
}