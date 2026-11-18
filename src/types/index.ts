export type UserRole = 'STUDENT' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
export type OrderStatus =
  | 'PENDING_MEETUP'
  | 'PAID_PENDING_MEETUP'
  | 'PENDING_PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CONFIRMED';
export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
export type ProductCategory = 'Electronics' | 'Books' | 'Clothing' | 'Furniture' | 'Sports' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  college?: string;
  created_at: string;
  is_banned?: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  images: string[];
  stock: number;
  seller_id: string;
  seller_name: string;
  seller_avatar?: string;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_item_id: string;
  product_id: string;
  title: string;
  price: number;
  image_url?: string;
  stock: number;
  quantity: number;
  seller_name?: string;
  product: Product;
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  payment_method?: 'OFFLINE' | 'ONLINE';
  meetup_location?: string;
  meetup_time?: string;
  meetup_notes?: string;
  delivery_otp?: string;
  razorpay_order_id?: string;
  created_at: string;
  items?: OrderItem[];
  product: Product;
  buyer: User;
  seller: User;
}

export interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Navigation param lists
export type RootStackParamList = {
  Auth: undefined;
  StudentApp: undefined;
  SellerApp: undefined;
  AdminApp: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type StudentTabParamList = {
  HomeTab: undefined;
  BrowseTab: undefined;
  ChatTab: undefined;
  WishlistTab: undefined;
  ProfileTab: undefined;
};

export type StudentStackParamList = {
  StudentTabs: undefined;
  ProductDetail: { productId: string };
  CartScreen: undefined;
  OrdersScreen: undefined;
  ChatRoom: { orderId: string; sellerName: string; productName: string };
  SellerProfile: { sellerId: string };
  Notifications: undefined;
  EditProfile: undefined;
  Settings: undefined;
  SellerOnboarding: undefined;
  PaymentWebView: { paymentUrl?: string; orderId: string };
};

export type SellerTabParamList = {
  DashboardTab: undefined;
  ProductsTab: undefined;
  OrdersTab: undefined;
  PayoutsTab: undefined;
  ProfileTab: undefined;
};

export type SellerStackParamList = {
  SellerTabs: undefined;
  AddEditProduct: { productId?: string };
  ChatRoom: { orderId: string; buyerName: string; productName: string };
};

export type AdminTabParamList = {
  DashboardTab: undefined;
  UsersTab: undefined;
  ListingsTab: undefined;
  PayoutsTab: undefined;
};
