
import React, { useState, useEffect } from 'react';
import { User, Product, CartItem, Order, OrderStatus } from './types';
import { api } from './services/api';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Home from './components/Home';
import Cart from './components/Cart';
import Profile from './components/Profile';
import Admin from './components/Admin';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Oturum kontrolü
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Kullanıcı etkileşimlerini yükle
        api.toggleFavorite(parsedUser.id, -1).then(setFavorites);
        api.toggleSaved(parsedUser.id, -1).then(setSaved);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('currentUser', JSON.stringify(u));
    api.toggleFavorite(u.id, -1).then(setFavorites);
    api.toggleSaved(u.id, -1).then(setSaved);
    setActiveTab('home');
  };

  const handleLogout = () => {
    // 1. Durumu temizle
    setUser(null);
    setCart([]);
    setFavorites([]);
    setSaved([]);
    
    // 2. Storage'ı temizle
    localStorage.clear();
    
    // 3. Kesin çözüm için sayfayı başlangıç durumuna zorla
    window.location.reload();
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = async (id: number) => {
    if (!user) return;
    const newFavs = await api.toggleFavorite(user.id, id);
    setFavorites(newFavs);
  };

  const toggleSaved = async (id: number) => {
    if (!user) return;
    const newSaved = await api.toggleSaved(user.id, id);
    setSaved(newSaved);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Hazırlanıyor...</p>
    </div>
  );

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user} 
      cartCount={cart.reduce((acc, curr) => acc + curr.quantity, 0)}
    >
      {activeTab === 'home' && (
        <Home 
          addToCart={addToCart} 
          favorites={favorites} 
          saved={saved} 
          toggleFavorite={toggleFavorite} 
          toggleSaved={toggleSaved} 
        />
      )}
      {activeTab === 'search' && (
        <Home 
          showSearchInitial={true} 
          addToCart={addToCart} 
          favorites={favorites} 
          saved={saved} 
          toggleFavorite={toggleFavorite} 
          toggleSaved={toggleSaved} 
        />
      )}
      {activeTab === 'cart' && (
        <Cart 
          cart={cart} 
          user={user} 
          removeFromCart={removeFromCart} 
          onOrderPlaced={clearCart} 
        />
      )}
      {activeTab === 'profile' && (
        <Profile user={user} onLogout={handleLogout} />
      )}
      {activeTab === 'admin' && (
        <Admin user={user} onLogout={handleLogout} />
      )}
    </Layout>
  );
};

export default App;
