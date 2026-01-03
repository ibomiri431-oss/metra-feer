
export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED'
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  videoUrl?: string; // Video desteği
  fileUrl?: string;  // Dosya desteği
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  username: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}
