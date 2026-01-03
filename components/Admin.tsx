
import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, Product } from '../types';
import { api, APP_BACKEND_URL } from '../services/api';

interface AdminProps {
  user: User;
  onLogout: () => void;
}

const Admin: React.FC<AdminProps> = ({ user, onLogout }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'orders' | 'products' | 'add_product'>('orders');
  
  // Filters
  const [filter, setFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'hour' | 'today' | 'week' | 'month'>('all');

  // Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', price: '', category: 'Elektronik', image: '', description: '', videoUrl: '', fileUrl: ''
  });

  const fetchData = async () => {
    const [orderList, productList] = await Promise.all([api.getOrders(), api.getProducts()]);
    setOrders(orderList.reverse());
    setProducts(productList);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if(window.confirm('Yönetici oturumunu kapatmak istediğinize emin misiniz?')) {
      onLogout();
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await api.updateOrderStatus(orderId, status);
    fetchData();
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price)
    };
    if (editingProduct) {
      await api.updateProduct(editingProduct.id, data);
    } else {
      await api.addProduct(data);
    }
    setFormData({ name: '', price: '', category: 'Elektronik', image: '', description: '', videoUrl: '', fileUrl: '' });
    setEditingProduct(null);
    setView('products');
    fetchData();
  };

  const deleteProduct = async (id: number) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      await api.deleteProduct(id);
      fetchData();
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filter === 'all' || order.status === filter;
    if (!matchesStatus) return false;
    if (timeFilter === 'all') return true;
    
    const date = new Date(order.createdAt);
    const now = new Date();
    
    if (timeFilter === 'hour') {
      return (now.getTime() - date.getTime()) < 3600000;
    }
    if (timeFilter === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    if (timeFilter === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-32">
      {/* Admin Header with Logout Option */}
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Yönetim</h2>
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Admin Paneli</p>
        </div>
        <button 
          onClick={handleLogoutClick}
          className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl active:scale-90 transition-all border border-red-100 shadow-sm"
        >
          <i className="fas fa-power-off text-lg"></i>
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => setView('orders')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest ${view === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>SİPARİŞLER</button>
        <button onClick={() => setView('products')} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest ${view === 'products' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>ÜRÜNLER</button>
        <button onClick={() => { setEditingProduct(null); setView('add_product'); }} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all tracking-widest ${view === 'add_product' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>+ EKLE</button>
      </div>

      {view === 'orders' && (
        <>
          <div className="mb-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 py-1">
              {['all', 'hour', 'today', 'week', 'month'].map(tf => (
                <button key={tf} onClick={() => setTimeFilter(tf as any)} className={`px-4 py-2 text-[10px] rounded-full font-black uppercase whitespace-nowrap transition-all ${timeFilter === tf ? 'bg-gray-800 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                  {tf === 'all' ? 'Tümü' : tf === 'hour' ? 'Son 1 Saat' : tf === 'today' ? 'Bugün' : tf === 'week' ? 'Bu Hafta' : 'Bu Ay'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {filteredOrders.length > 0 ? filteredOrders.map(order => (
              <div key={order.id} className="bg-white border-none rounded-[2rem] p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 tracking-tighter uppercase mr-2">#{order.id}</span>
                    <span className="text-[9px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter ${order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>{order.status}</span>
                </div>
                <h4 className="font-black text-sm text-gray-800 mb-1">{order.username}</h4>
                <div className="text-[11px] text-gray-400 font-medium mb-4 leading-relaxed">
                  {order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                </div>
                <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                   <p className="font-black text-gray-800 text-lg">{order.totalPrice.toLocaleString('az-AZ')} ₼</p>
                   {order.status === 'PENDING' && (
                     <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatus(order.id, OrderStatus.APPROVED)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100">ONAYLA</button>
                        <button onClick={() => handleUpdateStatus(order.id, OrderStatus.REJECTED)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest active:scale-95 transition-all">REDDET</button>
                     </div>
                   )}
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                <p className="text-gray-300 font-bold text-sm">Filtreye uygun sipariş yok.</p>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'products' && (
        <div className="space-y-4">
          {products.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-3xl shadow-sm flex gap-4 items-center border border-gray-50">
              <img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
              <div className="flex-1">
                <h4 className="font-black text-[13px] text-gray-800 line-clamp-1">{p.name}</h4>
                <p className="text-xs text-blue-600 font-black tracking-tighter mt-0.5">{p.price.toLocaleString('az-AZ')} ₼</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { 
                  setEditingProduct(p); 
                  setFormData({
                    name: p.name,
                    price: p.price.toString(),
                    category: p.category,
                    image: p.image,
                    description: p.description,
                    videoUrl: p.videoUrl || '',
                    fileUrl: p.fileUrl || ''
                  }); 
                  setView('add_product'); 
                }} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-xl transition-all active:scale-90"><i className="fas fa-edit"></i></button>
                <button onClick={() => deleteProduct(p.id)} className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-xl transition-all active:scale-90"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'add_product' && (
        <form onSubmit={handleProductSubmit} className="bg-white p-6 rounded-[2.5rem] shadow-sm space-y-4 border border-gray-50">
          <h3 className="font-black text-lg mb-6 text-gray-800">{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Ürün Adı" className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="number" placeholder="Fiyat (₺)" className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <select className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>Elektronik</option><option>Bilgisayar</option><option>Aksesuar</option><option>Giyim</option>
            </select>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ürün Görselleri (Cihazınızdan Seçin)</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10" 
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []) as File[];
                  if (files.length > 0) {
                    try {
                      const paths = await api.uploadFiles(files);
                      setFormData({...formData, image: JSON.stringify(paths)});
                      alert(`${files.length} görsel başarıyla yüklendi.`);
                    } catch (err) {
                      alert("Görsel yüklenirken hata oluştu.");
                    }
                  }
                }} 
              />
              {formData.image && formData.image.startsWith('[') && (
                <div className="flex gap-2 p-3 bg-blue-50/50 rounded-2xl overflow-x-auto no-scrollbar border border-blue-100">
                  {JSON.parse(formData.image).map((path: string, i: number) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img 
                        src={path.startsWith('/') 
                          ? (window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:' 
                              ? `${APP_BACKEND_URL}${path}` 
                              : `${window.location.origin}${path}`) 
                          : path} 
                        className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md animate-in fade-in zoom-in duration-300" 
                      />
                      <div className="absolute -top-1 -right-1 bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm">{i+1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea placeholder="Ürün Açıklaması" className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm font-medium outline-none h-32 focus:ring-2 focus:ring-blue-500/10" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">{editingProduct ? 'GÜNCELLE' : 'SİSTEME YÜKLE'}</button>
            <button type="button" onClick={() => setView('products')} className="px-6 bg-gray-50 text-gray-400 py-4 rounded-2xl font-bold text-xs tracking-widest">İPTAL</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Admin;
