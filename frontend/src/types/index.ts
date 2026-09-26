export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface AuthResponse {
  access_token?: string;
  user: User;
  message?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock?: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  subtotal?: number;
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  message: string | string[];
  timestamp?: string;
}
