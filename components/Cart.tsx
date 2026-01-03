
import React, { useState } from 'react';
import { CartItem, User, OrderStatus } from '../types';
import { api } from '../services/api';

interface CartProps {
  cart: CartItem[];
  user: User;
  removeFromCart: (id: number) => void;
  onOrderPlaced: () => void;
}

const Cart: React.FC<CartProps> = ({ cart, user, removeFromCart, onOrderPlaced }) => {
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      await api.placeOrder(user.id, user.username, cart, total);
      setSuccess(true);
      onOrderPlaced();
    } catch (e) {
      alert("Sipariş verilirken bir hata oluştu.");
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center h-[70vh]">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 text-4xl mb-6">
          <i className="fas fa-check"></i>
        </div>
        <h2 className="text-2xl font-bold mb-2">Sipariş Alındı!</h2>
        <p className="text-gray-500 mb-8">Siparişiniz admin onayına iletildi. Profil sayfasından durumu takip edebilirsiniz.</p>
        <button onClick={() => setSuccess(false)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">
          Alışverişe Devam Et
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-full">
      <h2 className="text-2xl font-bold mb-6">Sepetim</h2>
      
      {cart.length > 0 ? (
        <>
          <div className="flex-1 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-2xl flex gap-3 shadow-sm">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-gray-400 text-xs">Adet: {item.quantity}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-blue-600 font-bold">{(item.price * item.quantity).toLocaleString('az-AZ')} ₼</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white p-6 rounded-t-3xl border-t shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500">Toplam Tutar:</span>
              <span className="text-2xl font-black text-gray-800">{total.toLocaleString('az-AZ')} ₼</span>
            </div>
            <button 
              disabled={placing}
              onClick={handlePlaceOrder}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95 ${placing ? 'bg-gray-400' : 'bg-blue-600 shadow-blue-200'}`}
            >
              {placing ? 'İŞLENİYOR...' : 'SİPARİŞİ TAMAMLA'}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl text-gray-200 mb-4"><i className="fas fa-shopping-cart"></i></div>
          <p className="text-gray-400 font-medium">Sepetiniz şu an boş.</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
