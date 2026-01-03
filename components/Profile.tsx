
import React, { useState, useEffect } from 'react';
import { User, Order, Product, OrderStatus } from '../types';
import { api } from '../services/api';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [favs, setFavs] = useState<Product[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'interactions'>('orders');

  useEffect(() => {
    const fetchData = async () => {
      const orderList = await api.getOrders(user.id);
      setOrders(orderList.reverse());
      
      const allProducts = await api.getProducts();
      const favIds = await api.toggleFavorite(user.id, -1);
      
      setFavs(allProducts.filter(p => favIds.includes(p.id)));
    };
    fetchData();
  }, [user.id]);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Hesabınızdan çıkış yapmak istediğinize emin misiniz?')) {
      onLogout();
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING: return "bg-yellow-100 text-yellow-600";
      case OrderStatus.APPROVED: return "bg-blue-100 text-blue-600";
      case OrderStatus.REJECTED: return "bg-red-100 text-red-600";
      case OrderStatus.DELIVERED: return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-4 pb-32"> {/* Navigasyonun butonun üstünü kapatmaması için pb-32 eklendi */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">{user.username}</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogoutClick}
          className="w-12 h-12 flex items-center justify-center text-red-500 bg-red-50 rounded-2xl active:scale-90 transition-all border border-red-100 shadow-sm"
        >
          <i className="fas fa-power-off text-lg"></i>
        </button>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 border border-gray-200">
        <button onClick={() => setActiveSubTab('orders')} className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all tracking-widest ${activeSubTab === 'orders' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>SİPARİŞLERİM</button>
        <button onClick={() => setActiveSubTab('interactions')} className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all tracking-widest ${activeSubTab === 'interactions' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>FAVORİLERİM</button>
      </div>

      {activeSubTab === 'orders' ? (
        <div className="space-y-4">
          {orders.length > 0 ? orders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-blue-600 tracking-tighter uppercase">Sipariş No: #{order.id}</span>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter ${getStatusStyle(order.status)}`}>{order.status}</span>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[11px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleDateString('az-AZ')}</p>
                <p className="text-xl font-black text-gray-800">{order.totalPrice.toLocaleString('az-AZ')} ₼</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
              <i className="fas fa-history text-3xl text-gray-200 mb-3"></i>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Siparişiniz bulunmuyor.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {favs.length > 0 ? favs.map(p => (
            <div key={p.id} className="bg-white p-3 rounded-[2rem] shadow-sm border border-gray-50 text-center">
              <img src={p.image} className="w-full aspect-square object-cover rounded-2xl mb-3" />
              <p className="text-[11px] font-black text-gray-800 line-clamp-1">{p.name}</p>
            </div>
          )) : (
            <div className="col-span-2 text-center py-20">
               <p className="text-gray-400 font-bold text-xs">Favori ürününüz yok.</p>
            </div>
          )}
        </div>
      )}

      {/* Ana Çıkış Butonu - En Alta Sabitlenmiş Değil, Sayfa Akışında */}
      <div className="mt-12 px-2">
        <button 
          onClick={handleLogoutClick}
          className="w-full py-5 bg-red-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-red-100 border-none text-xs tracking-[0.2em]"
        >
          <i className="fas fa-sign-out-alt"></i>
          GÜVENLİ ÇIKIŞ YAP
        </button>
      </div>
    </div>
  );
};

export default Profile;
