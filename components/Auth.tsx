
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = isLogin 
        ? await api.login({ username, password }) 
        : await api.register(username, password);
        
      if (user) {
        onLogin(user);
      } else {
        setError(isLogin ? 'Giriş başarısız. Bilgilerinizi kontrol edin.' : 'Bu kullanıcı adı zaten alınmış olabilir.');
      }
    } catch (err) {
      setError('Sistem hatası. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 max-w-md mx-auto">
      <div className="mt-16 mb-12 text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto shadow-xl shadow-blue-100 mb-6 rotate-3">
          <i className="fas fa-shopping-basket"></i>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hoş Geldiniz</h1>
        <p className="text-gray-400 mt-2 font-medium">Hemen alışverişe başlayın.</p>
      </div>

      <div className="bg-gray-50 p-1.5 rounded-2xl flex mb-10 border border-gray-100">
        <button 
          onClick={() => { setIsLogin(true); setError(''); }} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${isLogin ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}
        >
          GİRİŞ
        </button>
        <button 
          onClick={() => { setIsLogin(false); setError(''); }} 
          className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-widest transition-all ${!isLogin ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}
        >
          KAYIT
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
          <input 
            type="text" 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium" 
            placeholder="Kullanıcı adınızı girin"
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Şifre</label>
          <input 
            type="password" 
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium" 
            placeholder="Şifrenizi girin"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 mt-4 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Lütfen Bekleyin...' : (isLogin ? 'OTURUM AÇ' : 'KAYIT OL')}
        </button>
      </form>
      
      <p className="mt-8 text-center text-xs text-gray-300 font-medium">
        Tüm hakları saklıdır &copy; 2024
      </p>
    </div>
  );
};

export default Auth;
