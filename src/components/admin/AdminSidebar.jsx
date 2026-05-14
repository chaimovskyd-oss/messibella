import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Package, FolderOpen, Image, ShoppingCart, Truck, Tag, Star, ArrowRight, BookOpen, Images } from 'lucide-react';

const menuItems = [
  { label: 'דשבורד', page: 'AdminDashboard', icon: LayoutDashboard },
  { label: 'מוצרים', page: 'AdminProducts', icon: Package },
  { label: 'קטגוריות', page: 'AdminCategories', icon: FolderOpen },
  { label: 'באנרים', page: 'AdminBanners', icon: Image },
  { label: 'הזמנות', page: 'AdminOrders', icon: ShoppingCart },
  { label: 'הטיפים שלנו', page: 'AdminTips', icon: BookOpen },
  { label: 'גלריה', page: 'AdminGallery', icon: Images },
  { label: 'קופונים', page: 'AdminCoupons', icon: Tag },
  { label: 'ביקורות', page: 'AdminReviews', icon: Star },
  { label: 'משלוחים', page: 'AdminShipping', icon: Truck },
];

export default function AdminSidebar({ currentPage }) {
  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen p-4 hidden md:block">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-gray-900 mb-2" aria-label="Messibella">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#F5B731] via-[#B68AD8] to-[#1CA3A9] text-white font-black shadow">
            M
          </span>
          <strong className="text-base tracking-wide">MESSIBELLA</strong>
        </div>
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
