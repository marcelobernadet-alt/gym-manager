export type UserRole = 'client' | 'owner';

export interface Profile {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export type MembershipStatus = 'active' | 'expired' | 'paused' | 'cancelled';

export interface Membership {
  id: string;
  client_id: string;
  plan_name: string;
  price: number;
  status: MembershipStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface GymClass {
  id: string;
  name: string;
  description: string | null;
  instructor_name: string | null;
  duration_min: number;
  category: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  location: string | null;
  created_at: string;
  gym_classes?: GymClass;
  booked_count?: number;
}

export type BookingStatus = 'booked' | 'cancelled' | 'attended' | 'no_show';

export interface Booking {
  id: string;
  session_id: string;
  client_id: string;
  status: BookingStatus;
  created_at: string;
  class_sessions?: ClassSession;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled';
export type OrderSource = 'store' | 'pos';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: Product;
}

export interface Order {
  id: string;
  client_id: string | null;
  created_by: string;
  total: number;
  status: OrderStatus;
  payment_method: string;
  source: OrderSource;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
  profiles?: Profile;
}

export interface CartLine {
  product: Product;
  quantity: number;
}
