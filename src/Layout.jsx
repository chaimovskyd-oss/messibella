import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { CartProvider, useCart } from '@/components/store/CartContext';
import { ChevronDown, Menu, Phone, ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { getCategories, getNavMenuItems } from '@/data/store';
import { getRootCategories, getChildCategories } from '@/utils/categories';
import { SITE_EMAIL, SITE_PHONE, SITE_PHONE_DISPLAY } from '@/data/defaultContent';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_67d6827d7b459e772fe40b45/ab330f83c_logo.png';

function CategoriesDropdown({ categories, onNavigate }) {
  const rootCategories = getRootCategories(categories);

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 text-gray-700 hover:text-[#B68AD8] font-medium transition-colors">
        קטגוריות
        <ChevronDown className="w-4 h-4" />
      </button>
      <div className="absolute top-full right-0 mt-3 w-72 rounded-2xl border border-gray-100 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
          {rootCategories.map(category => {
            const children = getChildCategories(categories, category.id);
            return (
              <div key={category.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                <Link
                  to={`${createPageUrl('Catalog')}?category=${category.id}`}
                  className="block font-bold text-gray-900 hover:text-[#B68AD8]"
                  onClick={onNavigate}
                >
                  {category.name}
                </Link>
                {children.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {children.map(child => (
                      <Link
                        key={child.id}
                        to={`${createPageUrl('Catalog')}?category=${child.id}`}
                        className="text-sm text-gray-500 hover:text-[#B68AD8]"
                        onClick={onNavigate}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Navbar({ currentPageName }) {
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories, initialData: [] });
  const { data: navMenuItems = [] } = useQuery({ queryKey: ['nav-menu'], queryFn: getNavMenuItems, initialData: [] });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdminPage = currentPageName?.startsWith('Admin');
  if (isAdminPage) return null;

  const navLinks = useMemo(
    () => navMenuItems
      .filter(item => item.is_active !== false && item.page !== 'Catalog')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
    [navMenuItems]
  );

  const rootCategories = getRootCategories(categories);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'}`}>
      <div className="bg-gradient-to-l from-[#F5B731] to-[#B68AD8] text-white text-sm py-1.5 px-4 text-center font-medium">
        <span className="block truncate">משלוח חינם בהזמנה מעל ₪200 | {SITE_PHONE_DISPLAY} | {SITE_EMAIL}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2 h-16 md:h-20">
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="min-h-11 min-w-11">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-80">
                <div className="flex flex-col gap-4 mt-8">
                  <Link
                    to={createPageUrl('Catalog')}
                    className="text-lg font-medium py-2 border-b border-gray-100 hover:text-[#B68AD8] transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    כל המוצרים
                  </Link>
                  {rootCategories.map(category => (
                    <div key={category.id} className="border-b border-gray-100 pb-3">
                      <Link
                        to={`${createPageUrl('Catalog')}?category=${category.id}`}
                        className="text-lg font-medium py-2 hover:text-[#B68AD8] transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {category.name}
                      </Link>
                      <div className="mt-1 pr-3 flex flex-col gap-1">
                        {getChildCategories(categories, category.id).map(child => (
                          <Link
                            key={child.id}
                            to={`${createPageUrl('Catalog')}?category=${child.id}`}
                            className="text-sm text-gray-500 hover:text-[#B68AD8] transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  {navLinks.map(link => (
                    <Link
                      key={link.id}
                      to={createPageUrl(link.page || 'Home')}
                      className="text-lg font-medium py-2 border-b border-gray-100 hover:text-[#B68AD8] transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link to={createPageUrl('Home')} className="flex-shrink min-w-0">
            <img src={LOGO_URL} alt="מסיבלה" className="h-10 sm:h-12 md:h-16 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to={createPageUrl('Catalog')}
              className="text-gray-700 hover:text-[#B68AD8] font-medium transition-colors relative group"
            >
              מוצרים
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-[#B68AD8] group-hover:w-full transition-all duration-300" />
            </Link>
            <CategoriesDropdown categories={categories} />
            {navLinks.map(link => (
              <Link
                key={link.id}
                to={createPageUrl(link.page || 'Home')}
                className="text-gray-700 hover:text-[#B68AD8] font-medium transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-[#B68AD8] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <a href={`tel:${SITE_PHONE}`} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-[#B68AD8]/10 hover:text-[#B68AD8] transition-colors">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">{SITE_PHONE_DISPLAY}</span>
            </a>
            <Link to={createPageUrl('Cart')} className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-[#F5B731] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to={createPageUrl('MyOrders')} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
              <User className="w-6 h-6 text-gray-700" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <img src={LOGO_URL} alt="מסיבלה" className="h-16 mb-4 brightness-0 invert" />
            <p className="text-gray-400 text-sm">
              מתנות ממותגות לגני ילדים, התאמות אישיות, בקבוקים, תיקים, מתנות סוף שנה והמון השראה.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5B731]">קישורים מהירים</h3>
            <div className="flex flex-col gap-2">
              <Link to={createPageUrl('Home')} className="text-gray-400 hover:text-white transition-colors text-sm">דף הבית</Link>
              <Link to={createPageUrl('Catalog')} className="text-gray-400 hover:text-white transition-colors text-sm">מוצרים</Link>
              <Link to={createPageUrl('Tips')} className="text-gray-400 hover:text-white transition-colors text-sm">הטיפים שלנו</Link>
              <Link to={createPageUrl('Gallery')} className="text-gray-400 hover:text-white transition-colors text-sm">גלריה</Link>
              <Link to={createPageUrl('Testimonials')} className="text-gray-400 hover:text-white transition-colors text-sm">מה לקוחות אומרים</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5B731]">מידע</h3>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <span>תנאי שימוש</span>
              <span>מדיניות פרטיות</span>
              <span>מדיניות החזרות</span>
              <Link to={createPageUrl('AdminLogin')} className="hover:text-white transition-colors">ניהול האתר</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5B731]">צור קשר</h3>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <a href={`tel:${SITE_PHONE}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span>{SITE_PHONE_DISPLAY}</span>
              </a>
              <a href={`mailto:${SITE_EMAIL}`} className="hover:text-white transition-colors">
                {SITE_EMAIL}
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          © 2026 מסיבלה - כל הזכויות שמורות
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children, currentPageName }) {
  const isAdminPage = currentPageName?.startsWith('Admin');

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Navbar currentPageName={currentPageName} />
        <main className="flex-1 min-w-0">
          {children}
        </main>
        {!isAdminPage && <Footer />}
      </div>
    </CartProvider>
  );
}
