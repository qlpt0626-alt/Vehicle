import React, { useState } from 'react';
import { Search, PlusCircle, Car, X } from 'lucide-react';

interface QuickSearchItem {
  id: string;
  plate: string;
  label: string;
}

const DEFAULT_QUICK_SEARCHES: QuickSearchItem[] = [
  { id: 'ural', plate: '29-A1 888.88', label: '29-A1 888.88 (Ural-4320)' },
  { id: 'uaz', plate: '80A-012.34', label: '80A-012.34 (UAZ-469)' }
];

interface SearchSectionProps {
  onSearch: (plate: string) => void;
  onOpenCreateNew: () => void;
  notFoundPlate: string | null;
  onShowSavedList?: () => void;
  showSavedList?: boolean;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  onSearch,
  onOpenCreateNew,
  notFoundPlate,
  onShowSavedList,
  showSavedList = false
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [quickSearches, setQuickSearches] = useState<QuickSearchItem[]>(() => {
    const saved = localStorage.getItem('quick_searches_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_QUICK_SEARCHES;
      }
    }
    return DEFAULT_QUICK_SEARCHES;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput);
    }
  };

  const handleQuickSearch = (plate: string) => {
    setSearchInput(plate);
    onSearch(plate);
  };

  const handleDeleteQuickSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = quickSearches.filter(item => item.id !== id);
    setQuickSearches(updated);
    localStorage.setItem('quick_searches_list', JSON.stringify(updated));
  };

  return (
    <div id="search-section" className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6">
      {/* Search Header Accent */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white text-center md:text-left">
        <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight">Tra Cứu Phương Tiện & Lịch Sử Sửa Chữa</h2>
        <p className="text-emerald-100/80 text-sm mt-1">Nhập biển số xe đăng ký</p>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400">
              <Search className="h-5 w-5" />
            </span>
            <input
              id="search-input"
              type="text"
              placeholder=""
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white text-base font-medium transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              id="search-btn"
              type="submit"
              className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl tracking-wide flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Search className="h-5 w-5" />
              <span>Tìm kiếm</span>
            </button>

            {onShowSavedList && (
              <button
                id="toggle-saved-list-btn"
                type="button"
                onClick={onShowSavedList}
                className={`px-4 py-3.5 border font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  showSavedList 
                    ? 'bg-amber-500 text-emerald-950 border-amber-500 hover:bg-amber-600 shadow-sm font-bold' 
                    : 'border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-stone-400'
                }`}
                title="Xem danh sách tất cả hồ sơ xe đã lưu"
              >
                <Car className="h-5 w-5" />
                <span className="hidden md:inline">Hồ sơ đã lưu</span>
              </button>
            )}
          </div>
        </form>

        {/* Suggested Quick Searches */}
        {quickSearches.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="text-stone-500 font-medium font-sans">Gợi ý tìm nhanh:</span>
            {quickSearches.map((item) => (
              <div
                key={item.id}
                className="inline-flex items-center bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleQuickSearch(item.plate)}
                  className="px-3 py-1 bg-transparent text-stone-700 font-mono text-xs md:text-sm transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteQuickSearch(item.id, e)}
                  className="px-2 py-1.5 border-l border-stone-300 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center font-sans font-bold"
                  title="Xoá gợi ý này"
                >
                  <X className="h-3.3 w-3.3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* No Data Display Area */}
        {notFoundPlate !== null && (
          <div id="no-data-alert" className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <Car className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <h3 className="text-red-800 font-bold text-lg">Không tìm thấy dữ liệu</h3>
            <p className="text-red-650 text-sm mt-1 font-medium">
              Phương tiện có biển số <strong className="font-mono text-red-800">"{notFoundPlate}"</strong> chưa được đăng ký trong hệ thống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
