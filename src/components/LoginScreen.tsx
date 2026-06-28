import React, { useState } from 'react';
import { userService } from '../services/userService';
import { User as UserIcon, Lock, ShieldAlert, Wrench, ChevronRight, Briefcase } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authenticatedUser = await userService.authenticate(username, password);
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra trong quá trình đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-stone-50 font-sans overflow-hidden">
      
      {/* Left Panel - Branding (Full screen on lg, hidden on smaller screens) */}
      <div className="hidden lg:flex w-[55%] bg-emerald-950 relative flex-col justify-between p-16 text-white border-r border-emerald-900/50 shadow-[20px_0_40px_rgba(0,0,0,0.3)] z-10">
        {/* Background image & gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity brightness-75"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1587826269222-261f224f8ff1?q=80&w=2600&auto=format&fit=crop')" }} 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-950/80 to-stone-950/95" />
        
        {/* Animated glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[900px] h-[900px] rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-yellow-600/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 animate-fade-in-up" style={{ animationDuration: '0.8s' }}>
          <div className="w-20 h-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl flex items-center justify-center text-yellow-500 shadow-2xl mb-12">
            <Wrench className="h-10 w-10 drop-shadow-md" />
          </div>
          <div className="text-xs font-extrabold text-yellow-500/90 uppercase tracking-[0.3em] mb-4 leading-none">
            CỤC HẬU CẦN - KỸ THUẬT QUÂN ĐOÀN 34
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8">
            TIỂU ĐOÀN<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-500 drop-shadow-sm">
              SCTH30
            </span>
          </h1>
          <p className="text-emerald-100/70 text-lg leading-relaxed max-w-lg font-medium border-l-4 border-emerald-500/50 pl-6">
            Nền tảng quản lý tập trung dữ liệu phương tiện, hồ sơ kiểm định kỹ thuật và theo dõi tiến độ bảo dưỡng trực tuyến.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 animate-fade-in-up" style={{ animationDuration: '1.2s' }}>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/20 border border-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold tracking-widest uppercase shadow-inner">
            <div className="relative flex h-2 w-2">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
              <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
            </div>
            Hệ thống trực tuyến
          </div>
          <div className="text-white/30 text-xs font-extrabold tracking-widest">
            PHIÊN BẢN 2.0.4
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center bg-stone-50 relative p-8 sm:p-12 lg:p-20 z-20 min-h-screen">
        <div className="max-w-md w-full mx-auto relative z-10">
          
          <div className="lg:hidden mb-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-900 rounded-2xl flex items-center justify-center text-yellow-500 shadow-lg mb-6">
              <Wrench className="h-8 w-8" />
            </div>
            <div className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest mb-2 text-center">
              CỤC HẬU CẦN - KỸ THUẬT QUÂN ĐOÀN 34
            </div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight">
              TIỂU ĐOÀN SCTH30
            </h1>
          </div>

          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-2">Đăng nhập</h2>
            <p className="text-base text-stone-500 font-medium">Truy cập vào bảng điều khiển cá nhân.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-sm leading-relaxed animate-fade-in shadow-sm">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">{error}</span>
                  {error.includes("chưa được cấp quyền") && (
                    <p className="text-red-600/90 mt-1 text-xs font-medium">Vui lòng liên hệ Trạm trưởng để kích hoạt tài khoản của bạn.</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-emerald-700 transition-colors">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    placeholder="Nhập tài khoản"
                    className="block w-full pl-12 pr-4 py-4 md:py-4.5 bg-white border border-stone-200 rounded-2xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-semibold placeholder:text-stone-400 placeholder:font-medium shadow-sm hover:border-emerald-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5 ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-stone-400 group-focus-within:text-emerald-700 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="block w-full pl-12 pr-4 py-4 md:py-4.5 bg-white border border-stone-200 rounded-2xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-semibold placeholder:text-stone-400 placeholder:font-medium shadow-sm hover:border-emerald-200"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 px-4 bg-emerald-950 hover:bg-emerald-900 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_0_rgba(2,44,34,0.15)] hover:shadow-[0_12px_28px_rgba(2,44,34,0.25)] hover:-translate-y-1 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span className="text-sm tracking-wide uppercase">Truy cập hệ thống</span>
                  <ChevronRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                </>
              )}
            </button>
          </form>


        </div>
      </div>

    </div>
  );
};

