import React, { useState } from 'react';
import { BookOpen, Truck, PlusCircle, FileText, Wrench } from 'lucide-react';
import { User } from '../types';

const galleryImages = [
"https://res.cloudinary.com/dqj4jmv7c/image/upload/v1780370200/z7891598598281_284d1cc03019928125ae02b0c7eecb34_ocycix.jpg",
"https://res.cloudinary.com/dqj4jmv7c/image/upload/v1780370200/z7891598754852_eefb181329b38d73ac95cd52a564ae9b_rfy9cq.jpg",
"https://res.cloudinary.com/dqj4jmv7c/image/upload/v1780370200/z7891598431411_e4f9c30e9ff351947b3c5f3ee7fd5ae0_eokfku.jpg",
"https://res.cloudinary.com/dqj4jmv7c/image/upload/v1780370200/z7891598676418_c23194cdd8676d78a33e0336fe4ebe07_f9u5dx.jpg",
"https://res.cloudinary.com/dqj4jmv7c/image/upload/v1780370200/z7891598510773_6a52816a1d76faa23e4c7897e12ddc96_putef9.jpg"
];

interface IntroTabProps {
  currentUser: User;
  onNavigateToTab: (tab: 'RECEPTION' | 'INSPECTION') => void;
  onOpenCreateNew: () => void;
  onOpenInspection: () => void;
}

export function IntroTab({ currentUser, onNavigateToTab, onOpenCreateNew, onOpenInspection }: IntroTabProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className="w-full mt-3 font-sans animate-fade-in">
      {/* Outstanding Welcome Board / Visual Mockup */}
      <div className="w-full bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 rounded-3xl p-6 md:p-10 text-white border border-emerald-900 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[440px]">
        {/* Decorative background grid elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        {/* Top content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto pt-4 md:pt-6 mb-8 space-y-5">
          <div className="text-[10px] font-extrabold bg-emerald-950/80 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-700/50 inline-flex items-center gap-2 uppercase tracking-widest leading-none shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            XƯỞNG SCTH QUÂN ĐOÀN 34
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black font-sans text-white tracking-tight leading-tight px-4">
            CHÀO MỪNG ĐẾN HỆ THỐNG TIẾP NHẬN<br />VÀ QUẢN LÝ XE SỬA CHỮA
          </h2>
          
          <p className="text-emerald-100/70 text-sm leading-relaxed font-sans max-w-2xl px-6">
            Hệ thống tự động biên chế hồ sơ, liên thông trực tiếp danh mục kỹ thuật và tổng hợp lý lịch sửa chữa xe Quân sự.
          </p>
        </div>

        {/* Core graphics panel representing the modern engine workbench */}
        <div className="relative z-10 mb-2 bg-emerald-950/40 border border-emerald-800/80 p-5 md:p-6 rounded-3xl flex flex-col gap-5 shadow-2xl backdrop-blur-xl w-full max-w-5xl mx-auto">
          
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-emerald-900/40 p-3 rounded-2xl text-center border border-emerald-800/40 flex flex-col justify-center shadow-inner hover:bg-emerald-900/60 transition-colors">
              <div className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cán bộ đăng nhập</div>
              <div className="text-sm md:text-base font-black text-emerald-300">{currentUser.fullName}</div>
              <div className="text-[10px] text-stone-400 mt-1">{currentUser.rank}</div>
            </div>
            <div className="bg-emerald-900/40 p-3 rounded-2xl text-center border border-emerald-800/40 flex flex-col justify-center shadow-inner hover:bg-emerald-900/60 transition-colors">
              <div className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">Chức vụ</div>
              <div className="text-sm md:text-base font-black text-teal-300 uppercase">
                {currentUser.role === 'dai_doi_truong' ? 'Đại đội trưởng' :
                 currentUser.role === 'pho_dai_doi_truong' ? 'Phó Đại đội trưởng' :
                 currentUser.role === 'trung_doi_truong' ? 'Trung đội trưởng' :
                 currentUser.role === 'to_truong' ? 'Tổ trưởng' :
                 currentUser.role === 'kcs' ? 'Nhân viên KCS' :
                 currentUser.role === 'tro_ly_ky_thuat' ? 'Trợ lý Kỹ thuật' :
                 currentUser.role === 'admin' ? 'Quản trị hệ thống' : 'Chưa rõ chức vụ'}
              </div>
            </div>
            <div className="bg-emerald-900/40 p-3 rounded-2xl text-center border border-emerald-800/40 flex flex-col justify-center shadow-inner hover:bg-emerald-900/60 transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1 relative z-10 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                Trạm bảo trì
              </div>
              <div className="text-base md:text-lg font-black text-yellow-500 relative z-10 tracking-widest">SCTH-30</div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-emerald-900/80 pt-4 pb-1 text-[11px] text-emerald-400 font-mono px-1">
            <span className="tracking-widest uppercase font-semibold">Tình trạng hệ thống</span>
            <span className="text-emerald-300 font-bold flex items-center gap-2">
              HOẠT ĐỘNG HOÀN TOÀN
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>

          {/* Image Gallery inside SCTH-SYSTEM-M01 area */}
          <div className="relative mt-2 rounded-2xl border border-emerald-900/60 bg-stone-950 p-2 md:p-3 overflow-hidden shadow-inner">
            <div className="absolute top-4 left-4 xl:left-5 z-20 text-[10px] font-mono text-emerald-300/90 font-bold bg-black/60 px-2.5 py-1 rounded backdrop-blur-md pointer-events-none uppercase tracking-widest border border-emerald-800/50">
              SCTH-SYSTEM-M01
            </div>
            
            <div className="relative z-10 w-full mt-2 flex flex-col items-center">
              <div className="overflow-hidden rounded-xl shadow-2xl border border-emerald-900/50 bg-stone-950 w-full aspect-[4/3] sm:aspect-video flex justify-center items-center relative group">
                <img 
                  src={galleryImages[currentImageIndex]} 
                  alt={`Gallery ${currentImageIndex + 1}`} 
                  className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out group-hover:scale-105 opacity-95 group-hover:opacity-100"
                />
              </div>
              
              {/* Dots indicator */}
              <div className="flex gap-3 mt-5 mb-2 justify-center z-20">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full outline-none transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-yellow-500 w-8 shadow-[0_0_10px_rgba(234,179,8,0.5)]' 
                        : 'bg-emerald-900 hover:bg-emerald-600 border border-emerald-800'
                    }`}
                    title={`Xem ảnh ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Abstract gear rotates */}
            <div className="absolute -bottom-6 -right-6 text-emerald-500/10 pointer-events-none animate-spin" style={{ animationDuration: '20s' }}>
              <svg className="h-40 w-40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1a8.43 8.43 0 00-1.69-.98l-.38-2.65C13.96 2.18 13.71 2 13.43 2h-4c-.28 0-.53.18-.57.46l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49-.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.28.28.46.57.46h4c.28 0 .53-.18.57-.46l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Duty parameters / signature footer */}
        <div className="relative z-10 border-t border-emerald-950 pt-3 flex items-center justify-end text-emerald-300 text-[10px] font-mono leading-none mt-4">
          <span>Ngày: {new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
        </div>
      </div>
    </div>
  );
}
