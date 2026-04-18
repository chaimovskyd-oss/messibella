import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CartProvider, useCart } from '@/components/store/CartContext';
import { ShoppingCart, Menu, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_67d6827d7b459e772fe40b45/ab330f83c_logo.png";

function Navbar({ currentPageName }) {
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdminPage = currentPageName?.startsWith('Admin');

  if (isAdminPage) return null;

  const navLinks = [
    { label: 'דף הבית', page: 'Home' },
    { label: 'מוצרים', page: 'Catalog' },
    { label: 'אודות', page: 'Home' },
    { label: 'צור קשר', page: 'Home' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'}`}>
      {/* Top bar */}
      <div className="bg-gradient-to-l from-[#F5B731] to-[#B68AD8] text-white text-sm py-1.5 px-4 text-center font-medium">
        🎉 משלוח חינם בהזמנה מעל ₪200! | ☎ 050-1234567
      </div>
      
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map(link => (
                    <Link
                      key={link.page + link.label}
                      to={createPageUrl(link.page)}
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

          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex-shrink-0">
            <img src={LOGO_URL} alt="מסיבלה" className="h-12 md:h-16 object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.page + link.label}
                to={createPageUrl(link.page)}
                className="text-gray-700 hover:text-[#B68AD8] font-medium transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-[#B68AD8] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Cart')} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-[#F5B731] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce-slow">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to={createPageUrl('MyOrders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={LOGO_URL} alt="מסיבלה" className="h-16 mb-4 brightness-0 invert" />
            <p className="text-gray-400 text-sm">
              מתנות ממותגות לגני ילדים – תנו לדמיון ליצור
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5B731]">קישורים מהירים</h3>
            <div className="flex flex-col gap-2">
              <Link to={createPageUrl('Home')} className="text-gray-400 hover:text-white transition-colors text-sm">דף הבית</Link>
              <Link to={createPageUrl('Catalog')} className="text-gray-400 hover:text-white transition-colors text-sm">מוצרים</Link>
              <Link to={createPageUrl('MyOrders')} className="text-gray-400 hover:text-white transition-colors text-sm">ההזמנות שלי</Link>
              <Link to={createPageUrl('AdminDashboard')} className="text-gray-400 hover:text-[#F5B731] transition-colors text-sm">ניהול האתר</Link>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5B731]">מידע</h3>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <span>תנאי שימוש</span>
              <span>מדיניות פרטיות</span>
              <span>מדיניות החזרות</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-[#F5B731]">צרו קשר</h3>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>050-1234567</span>
              </div>
              <span>info@masibala.co.il</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          © 2026 מסיבלה – כל הזכויות שמורות
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children, currentPageName }) {
  const isAdminPage = currentPageName?.startsWith('Admin');
  
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar currentPageName={currentPageName} />
        <main className="flex-1">
          {children}
        </main>
        {!isAdminPage && <Footer />}
      </div>
    </CartProvider>
  );
}
