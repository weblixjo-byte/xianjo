export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  category: string;
  imageUrl?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isAvailable: boolean;
}

export interface DeliveryZone {
  id: string;
  nameEn: string;
  nameAr: string;
  fee: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  phoneNumber: string;
  address?: string;
  deliveryArea?: string;
  pickupTime?: string;
  reservationPeople?: number | null;
  reservationTime?: string | null;
  orderType?: 'DELIVERY' | 'PICKUP' | 'TABLE';
  notes?: string;
  totalPrice: number;
  status: string;
  couponCode?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  isArchived: boolean;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discountAmount: number;
  items: OrderItem[];
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export interface Customer {
  name: string;
  phone: string;
  area: string;
  email?: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

export interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  itemBreakdown: { name: string; quantity: number; revenue: number }[];
  orders: Order[];
}

export type AdminTab = 'ORDERS' | 'HISTORY' | 'CUSTOMERS' | 'REPORTS' | 'SYSTEM' | 'PRODUCTS' | 'COUPONS' | 'ZONES' | 'SUPPORT';
