
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  cartCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, cartCount }) => {
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50 shadow-xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 flex items-center">
          <i className="fas fa-shopping-bag mr-2"></i>
          Mobil Market
        </h1>
        {isAdmin && (
          <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-tighter">Yönetici</span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto no-scrollbar">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t flex justify-around items-center py-2 z-50`}>
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center p-2 transition-all ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-home text-xl"></i>
          <span className="text-[10px] mt-1 font-bold">Anasayfa</span>
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center p-2 transition-all ${activeTab === 'search' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-search text-xl"></i>
          <span className="text-[10px] mt-1 font-bold">Ara</span>
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center p-2 relative transition-all ${activeTab === 'cart' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-shopping-cart text-xl"></i>
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] mt-1 font-bold">Sepetim</span>
        </button>
        
        {isAdmin && (
           <button 
           onClick={() => setActiveTab('admin')}
           className={`flex flex-col items-center p-2 transition-all ${activeTab === 'admin' ? 'text-blue-600' : 'text-gray-400'}`}
         >
           <i className="fas fa-user-shield text-xl"></i>
           <span className="text-[10px] mt-1 font-bold">Yönetim</span>
         </button>
        )}

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center p-2 transition-all ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <i className="fas fa-user text-xl"></i>
          <span className="text-[10px] mt-1 font-bold">Profil</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
