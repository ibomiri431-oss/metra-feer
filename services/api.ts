// --- CONFIGURATION ---
// Bu adresi backend'ini internete (Render, PythonAnywhere vb.) yüklediğinde aldığın link ile değiştir.
// Örn: 'https://senin-uygulaman.onrender.com'
export const APP_BACKEND_URL = 'http://192.168.1.75:5000'; 

import { Product, User, Order, OrderStatus, CartItem } from '../types';

// Web'de çalışırken /api kullan, APK'da (native) çalışırken tam URL kullan.
const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.protocol === 'capacitor:'))
  ? `${APP_BACKEND_URL}/api` 
  : '/api';

class APIService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Hatası');
    }
    
    return response.json();
  }

  // Auth Methods
  async login(credentials: { username: string; password: string }): Promise<User | null> {
    try {
      return await this.request<User>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (e) {
      return null;
    }
  }

  async register(username: string, password: string): Promise<User> {
    return await this.request<User>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Product CRUD
  async getProducts(search?: string, category?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return await this.request<Product[]>(`/products?${params.toString()}`);
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<void> {
    await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, updated: Partial<Product>): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Interaction Methods
  async toggleFavorite(userId: string, productId: number) {
    return await this.request<number[]>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    });
  }

  async toggleSaved(userId: string, productId: number) {
    return await this.request<number[]>('/saved', {
      method: 'POST',
      body: JSON.stringify({ userId, productId }),
    });
  }

  // Order Methods
  async placeOrder(userId: string, username: string, items: CartItem[], total: number): Promise<Order> {
    return await this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ userId, username, items, totalPrice: total }),
    });
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const endpoint = userId ? `/orders?userId=${userId}` : '/orders';
    return await this.request<Order[]>(endpoint);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.request(`/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async uploadFiles(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type header, browser will set it to multipart/form-data with boundary
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload Hatası');
    }
    
    const { paths } = await response.json();
    return paths;
  }
}

export const api = new APIService();
