import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { Overview } from './components/Overview';
import { Details } from './components/Details';
import { PeriodicList } from './components/PeriodicList';
import { PricingList } from './components/PricingList';
import { LayoutDashboard, List, LogOut, DownloadCloud, Unlock } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'periodic' | 'pricing'>('overview');
  const [detailsMode, setDetailsMode] = useState<'books' | 'stations' | 'all' | 'overdue' | 'phase1' | 'phase3' | 'types' | 'tiRatios' | 'notesAndSolar' | 'phase1Direct' | 'phase1Indirect' | 'phase3Direct' | 'phase3Indirect' | 'excludeSpecificPrices' | 'periodic2026' | 'replaced2026' | 'changedCustomers' | 'removedCustomers' | 'newCustomers' | 'customerTypes' | 'customersWithPE'>('books');
  const [authError, setAuthError] = useState<string | null>(null);

  const { customers, loading, error, fetchCustomers } = useGoogleSheets(accessToken);

  useEffect(() => {
    // Note: this hook might fail if the dummy firebase config throws error during init Auth.
    // In actual AI Studio environments, the config comes from backend. We handle potential errors gracefully.
    try {
      const unsubscribe = initAuth(
        (u, token) => {
          setUser(u);
          setAccessToken(token);
          setNeedsAuth(false);
        },
        () => setNeedsAuth(true)
      );
      return () => unsubscribe();
    } catch (e: any) {
      console.error(e);
      setNeedsAuth(true);
      setAuthError('Không thể khởi tạo nền tảng xác thực tự động.');
    }
  }, []);

  useEffect(() => {
    if (!needsAuth) {
      fetchCustomers();
    }
  }, [needsAuth, accessToken, fetchCustomers]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || 'Lỗi khi đăng nhập bằng Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
  };

  const handleContinueWithoutLogin = () => {
    setNeedsAuth(false);
    setAccessToken(null);
  };

  if (needsAuth) {
    return (
      <div className="h-full bg-slate-50 flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
              <DownloadCloud className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Trình Quản Lý Danh Sách Ghi Điện</h1>
            <p className="text-slate-500 mb-8 text-sm font-medium">
              Ứng dụng cần quyền truy cập vào dữ liệu Google Sheets.
            </p>

            {authError && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 text-left">
                <strong>Lưu ý:</strong> Nền tảng gặp sự cố khi khởi tạo tự động đăng nhập. Đang chuyển sang chế độ tải trực tiếp qua URL.
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleContinueWithoutLogin}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Truy cập qua Public Link
              </button>
              
              <div className="mt-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg text-left">
                <strong>Hướng dẫn:</strong><br/>
                Để truy cập thành công, hãy mở file Google Sheets của bạn và chuyển quyền riêng tư sang: <br/>
                <span className="font-semibold text-indigo-600">"Bất kỳ ai có liên kết" (Anyone with the link can view)</span>.
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-400">hoặc thử đăng nhập tự động</span>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center px-6 py-3 border border-slate-200 text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <span>Đang kết nối...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3 bg-white rounded-full p-0.5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    Đăng nhập tài khoản Google
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      <header className="bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-3 shadow-sm flex-shrink-0 z-10 gap-3 sm:gap-4">
        {/* Top Row: Brand & User Profile */}
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 uppercase truncate">
              Quản Lý Danh Sách
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              {user ? `Xin chào, ${user.displayName?.split(' ')[0] || user.email?.split('@')[0]}` : "Chế độ đọc Public"}
            </span>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-inner flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0"
              title={user ? "Đăng xuất" : "Quay lại màn hình chính"}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row / Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto scrollbar-hide shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab('overview')}
            className={twMerge(
              'shrink-0 flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm transition-colors text-center whitespace-nowrap',
              activeTab === 'overview'
                ? 'font-bold bg-white text-indigo-600 shadow-sm'
                : 'font-medium text-slate-600 hover:bg-white/50'
            )}
          >
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={twMerge(
              'shrink-0 flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm transition-colors text-center whitespace-nowrap',
              activeTab === 'details'
                ? 'font-bold bg-white text-indigo-600 shadow-sm'
                : 'font-medium text-slate-600 hover:bg-white/50'
            )}
          >
            Chi Tiết KH
          </button>
          <button
            onClick={() => setActiveTab('periodic')}
            className={twMerge(
              'shrink-0 flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm transition-colors text-center whitespace-nowrap',
              activeTab === 'periodic'
                ? 'font-bold bg-white text-indigo-600 shadow-sm'
                : 'font-medium text-slate-600 hover:bg-white/50'
            )}
          >
            Danh Sách Thay Định Kỳ
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={twMerge(
              'shrink-0 flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm transition-colors text-center whitespace-nowrap',
              activeTab === 'pricing'
                ? 'font-bold bg-white text-indigo-600 shadow-sm'
                : 'font-medium text-slate-600 hover:bg-white/50'
            )}
          >
            Danh Sách Thay Thời Gian Cho Biểu Giá
          </button>
        </nav>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {error && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 p-4 max-w-lg w-full bg-red-50 rounded-xl border border-red-200 shadow-xl text-sm text-red-700 flex items-start gap-3 animate-in slide-in-from-top-4">
            <Unlock className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <strong>Lỗi tải dữ liệu:</strong>
              <p className="mt-1">{error}</p>
              {!accessToken && (
                <div className="mt-2 text-xs bg-red-100 p-2 rounded text-red-800">
                  Vui lòng mở file Google Sheet của bạn &gt; Nhấn nút <strong>Chia sẻ (Share)</strong> góc trên phải &gt; Chọn <strong>"Bất kỳ ai có liên kết" (Anyone with the link)</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-slate-50">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium font-mono text-xs">Đang tải biểu dữ liệu...</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' ? (
              <Overview 
                customers={customers}
                onNavigate={(mode) => {
                  setDetailsMode(mode);
                  setActiveTab('details');
                }}
              />
            ) : activeTab === 'details' ? (
              <Details customers={customers} mode={detailsMode} />
            ) : activeTab === 'periodic' ? (
              <PeriodicList customers={customers} />
            ) : (
              <PricingList customers={customers} />
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-[10px] text-slate-400 font-medium z-10 shrink-0">
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5">
            <span className={clsx("w-2 h-2 rounded-full", accessToken ? "bg-green-500" : "bg-yellow-500")}></span> 
            {accessToken ? "Kết nối API an toàn" : "Kết nối qua URL Public CSV"}
          </span>
          <span>Tổng cộng: {customers.length} khách hàng</span>
        </div>
        <div>Phiên bản 2.4.0</div>
      </footer>
    </div>
  );
}

