
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { api, APP_BACKEND_URL } from '../services/api';

interface HomeProps {
  addToCart: (p: Product) => void;
  favorites: number[];
  saved: number[];
  toggleFavorite: (id: number) => void;
  toggleSaved: (id: number) => void;
  showSearchInitial?: boolean;
}

const Home: React.FC<HomeProps> = ({ addToCart, favorites, saved, toggleFavorite, toggleSaved, showSearchInitial }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tümü');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const categories = ['Tümü', 'Elektronik', 'Bilgisayar', 'Aksesuar', 'Giyim'];

  const getProductImages = (imgStr: string): string[] => {
    try {
      if (!imgStr) return [];
      let images: string[] = [];
      if (imgStr.startsWith('[')) {
        images = JSON.parse(imgStr);
      } else {
        images = [imgStr];
      }
      
      // Resim yollarını düzelt (backend adresiyle eşleştir)
      return images.map(img => {
        if (img.startsWith('/product_images')) {
          // Eğer native uygulama (APK) tarafındaysak merkezi backend URL'ini kullan
          const isNative = window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:';
          const host = isNative ? APP_BACKEND_URL : window.location.origin;
          return `${host}${img}`;
        }
        return img;
      });
    } catch {
      return [imgStr];
    }
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await api.getProducts(search, category);
      setProducts(res);
      setLoading(false);
    };
    fetch();
  }, [search, category]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4 relative">
        <input type="text" placeholder="Ürün Ara..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm outline-none" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus={showSearchInitial} />
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${category === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-500 shadow-sm'}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map(product => {
          const images = getProductImages(product.image);
          return (
            <div key={product.id} className="bg-white rounded-3xl p-3 shadow-sm flex flex-col relative active:scale-95 transition-transform" onClick={() => { setSelectedProduct(product); setActiveImageIndex(0); }}>
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-10" onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleFavorite(product.id)} className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md ${favorites.includes(product.id) ? 'text-red-500' : 'text-gray-300'}`}><i className="fas fa-heart"></i></button>
              </div>
              <img src={images[0] || 'https://via.placeholder.com/400'} className="w-full aspect-square object-cover rounded-2xl mb-3" />
              <h3 className="font-bold text-xs line-clamp-1 mb-1">{product.name}</h3>
              <p className="text-blue-600 font-black text-xs mb-3">{product.price.toLocaleString('az-AZ')} ₼</p>
              <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="w-full py-2.5 bg-gray-50 text-blue-600 font-bold rounded-xl text-[10px] hover:bg-blue-600 hover:text-white transition-all">SEPETE EKLE</button>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full rounded-t-[40px] p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" onClick={() => setSelectedProduct(null)}></div>
            
            <div className="space-y-4 mb-6">
              <img src={getProductImages(selectedProduct.image)[activeImageIndex]} className="w-full aspect-video object-cover rounded-3xl shadow-xl transition-all duration-300" />
              
              {/* Thumbnail List */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {getProductImages(selectedProduct.image).map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-16 h-12 rounded-xl object-cover cursor-pointer transition-all border-2 ${activeImageIndex === i ? 'border-blue-600 scale-105 shadow-md' : 'border-transparent opacity-60'}`} 
                  />
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-black mb-2">{selectedProduct.name}</h2>
            <p className="text-blue-600 text-xl font-black mb-4">{selectedProduct.price.toLocaleString('az-AZ')} ₼</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{selectedProduct.description}</p>
            
            {(selectedProduct.videoUrl || selectedProduct.fileUrl) && (
              <div className="space-y-3 mb-8">
                <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest">Ekler</h4>
                {selectedProduct.videoUrl && (
                  <a href={selectedProduct.videoUrl} target="_blank" className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm"><i className="fas fa-play-circle text-xl"></i> Videoyu İzle</a>
                )}
                {selectedProduct.fileUrl && (
                  <a href={selectedProduct.fileUrl} target="_blank" className="flex items-center gap-3 p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm"><i className="fas fa-file-download text-xl"></i> Dosyayı İndir</a>
                )}
              </div>
            )}
            
            <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100">SEPETE EKLE</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
