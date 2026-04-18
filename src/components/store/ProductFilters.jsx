import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getChildCategories, getRootCategories } from '@/utils/categories';

export default function ProductFilters({
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  showSale,
  setShowSale,
  showPopular,
  setShowPopular
}) {
  const activeCategories = categories.filter(category => category.is_active !== false);
  const rootCategories = getRootCategories(activeCategories);
  const selectedItem = activeCategories.find(category => category.id === selectedCategory);
  const selectedRootId = selectedItem?.parent_id || (rootCategories.some(category => category.id === selectedCategory) ? selectedCategory : '');
  const visibleSubcategories = selectedRootId ? getChildCategories(activeCategories, selectedRootId) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8">
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="חיפוש מוצרים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 h-12 rounded-xl text-base"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className={`cursor-pointer px-4 py-2 rounded-xl text-sm transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#B68AD8] hover:bg-[#9b6fc0] text-white'
              : 'hover:bg-[#B68AD8]/10 border-gray-200'
          }`}
          onClick={() => setSelectedCategory('all')}
        >
          הכל
        </Badge>
        {rootCategories.map(category => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            className={`cursor-pointer px-4 py-2 rounded-xl text-sm transition-all ${
              selectedCategory === category.id
                ? 'bg-[#B68AD8] hover:bg-[#9b6fc0] text-white'
                : 'hover:bg-[#B68AD8]/10 border-gray-200'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Badge>
        ))}
      </div>

      {visibleSubcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge
            variant={selectedCategory === selectedRootId ? 'default' : 'outline'}
            className={`cursor-pointer px-4 py-2 rounded-xl text-sm transition-all ${
              selectedCategory === selectedRootId
                ? 'bg-[#5BC5C8] hover:bg-[#48b2b5] text-white'
                : 'hover:bg-[#5BC5C8]/10 border-gray-200'
            }`}
            onClick={() => setSelectedCategory(selectedRootId)}
          >
            כל תתי-הקטגוריות
          </Badge>
          {visibleSubcategories.map(category => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm transition-all ${
                selectedCategory === category.id
                  ? 'bg-[#5BC5C8] hover:bg-[#48b2b5] text-white'
                  : 'hover:bg-[#5BC5C8]/10 border-gray-200'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SlidersHorizontal className="w-4 h-4 ml-2" />
            <SelectValue placeholder="מיון" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">ברירת מחדל</SelectItem>
            <SelectItem value="price_low">מחיר: נמוך לגבוה</SelectItem>
            <SelectItem value="price_high">מחיר: גבוה לנמוך</SelectItem>
            <SelectItem value="newest">חדשים ביותר</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showSale ? 'default' : 'outline'}
          size="sm"
          className={`rounded-xl min-h-10 ${showSale ? 'bg-red-500 hover:bg-red-600' : ''}`}
          onClick={() => setShowSale(!showSale)}
        >
          במבצע
        </Button>

        <Button
          variant={showPopular ? 'default' : 'outline'}
          size="sm"
          className={`rounded-xl min-h-10 ${showPopular ? 'bg-[#F5B731] hover:bg-[#e5a821]' : ''}`}
          onClick={() => setShowPopular(!showPopular)}
        >
          פופולרי
        </Button>
      </div>
    </div>
  );
}
