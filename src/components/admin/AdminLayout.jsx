import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminLayout({ children, currentPage }) {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar currentPage={currentPage} />

      <div className="md:hidden fixed top-0 right-0 left-0 bg-white border-b z-50 p-3 flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <AdminSidebar currentPage={currentPage} />
          </SheetContent>
        </Sheet>
        <span className="font-bold text-gray-900">ניהול מסיבלה</span>
        <Button variant="ghost" size="icon" className="mr-auto" onClick={logout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <main className="flex-1 p-4 md:p-8 md:pt-8 pt-16 overflow-auto">
        <div className="hidden md:flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">מחובר/ת כאדמין</p>
            <p className="font-medium text-gray-900">{user?.email || '-'}</p>
          </div>
          <Button variant="outline" className="rounded-xl gap-2" onClick={logout}>
            <LogOut className="w-4 h-4" />
            התנתקות
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}
