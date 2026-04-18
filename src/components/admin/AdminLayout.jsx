import React from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminLayout({ children, currentPage }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar currentPage={currentPage} />
      
      {/* Mobile header */}
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
      </div>

      <main className="flex-1 p-4 md:p-8 md:pt-8 pt-16 overflow-auto">
        {children}
      </main>
    </div>
  );
}
